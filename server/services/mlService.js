// server/services/mlService.js
import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

const anomalyCooldown = new Map();
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
/**
 * TARIFF CALCULATION - ONE PLACE ONLY
 * Includes: CEB full fixed charge (no proration) + SSC Levy 2.5%
 *           NWSDB full service charge + VAT 18%
 */
export const calculateTariffBill = (activeTariff, rawPredictedUnits, utility) => {
  if (!activeTariff || !activeTariff.tiers?.length || rawPredictedUnits <= 0) return 0;

  let units = Math.max(0, Math.round(rawPredictedUnits));
  let amount = 0;
  let remaining = units;
  let prevMax = 0;
  let applicableFixedCharge = activeTariff.fixedCharge || 0;

  for (const tier of activeTariff.tiers) {
    const tierMax = tier.upTo === null ? Infinity : tier.upTo;
    const unitsInTier = Math.min(remaining, tierMax - prevMax);

    if (unitsInTier > 0) {
      amount += unitsInTier * (tier.ratePerUnit || 0);
      if (tier.fixedCharge && tier.fixedCharge > applicableFixedCharge) {
        applicableFixedCharge = tier.fixedCharge;
      }
    }

    remaining -= unitsInTier;
    prevMax = tierMax === Infinity ? prevMax : tierMax;
    if (remaining <= 0) break;
  }

  let finalAmount;

  if (utility === "Electricity") {
    const fullFixed = applicableFixedCharge;
    const subtotal = amount + fullFixed;
    finalAmount = Math.round(subtotal * 1.025);
    console.log(`✅ Tariff calc: ${units} units | usage Rs.${amount} + fixed Rs.${fullFixed} (full month) = Rs.${subtotal} + SSC 2.5% → Rs.${finalAmount} (Electricity)`);

  } else if (utility === "Water") {
    const subtotal = amount + applicableFixedCharge;
    finalAmount = Math.round(subtotal * 1.18);
    console.log(`✅ Tariff calc: ${units} units | usage Rs.${amount} + service Rs.${applicableFixedCharge} = Rs.${subtotal} + VAT 18% → Rs.${finalAmount} (Water)`);

  } else {
    finalAmount = Math.round(amount + applicableFixedCharge);
    console.log(`✅ Tariff calc: ${units} units → Rs.${finalAmount} (${utility})`);
  }

  return finalAmount;
};

/**
 * HOUSEHOLD FEATURE EXTRACTOR - FROM NESTED DB STRUCTURE
 */
function extractHouseholdFeatures(raw, utility) {
  const elec = raw?.electricity || {};
  const water = raw?.water || {};
  const num_floors = elec.num_floors || 1;

  if (utility === "Electricity") {
    return {
      num_floors,
      num_ac: elec.num_ac || 0,
      has_solar: elec.has_solar || false,
      has_water_heater: elec.has_electric_water_heater || false,
      num_refrigerators: elec.num_refrigerators || 1,
      num_tvs: elec.num_tvs || 0,
      num_computers: elec.num_computers || 0,
      has_washing_machine: elec.has_washing_machine || false,
      has_electric_vehicle: elec.has_electric_vehicle || false,
      household_size: water.num_people || 1,
      building_type: water.building_type || "house",
    };
  }

  if (utility === "Water") {
    return {
      num_floors,
      num_bathrooms: water.num_bathrooms || 1,
      household_size: water.num_people || 1,
      building_type: water.building_type || "house",
      has_garden: water.has_garden || false,
      has_pool: water.has_pool || false,
      has_water_tank: water.has_water_tank || false,
      has_water_heater: water.has_water_heater || false,
      has_washing_machine: water.has_washing_machine || false,
      num_ac: 0,
      has_solar: false,
    };
  }

  return { num_floors, num_ac: 0, has_solar: false };
}

/**
 * HOUSEHOLD MULTIPLIER
 */
function calculateHouseholdMultiplier(hf, utility) {
  let multiplier = 1.0;

  if (utility === "Electricity") {
    multiplier += Math.max(0, (hf.num_floors || 1) - 1) * 0.05;
    multiplier += (hf.num_ac || 0) * 0.08;
    if (hf.has_water_heater) multiplier += 0.05;
    if (hf.has_solar) multiplier -= 0.12;
    multiplier += Math.max(0, (hf.num_refrigerators || 1) - 1) * 0.03;
    multiplier += Math.min(hf.num_tvs || 0, 3) * 0.02;
    multiplier += Math.min(hf.num_computers || 0, 3) * 0.03;
    if (hf.has_washing_machine) multiplier += 0.04;
    if (hf.has_electric_vehicle) multiplier += 0.10;
  } else if (utility === "Water") {
    multiplier += Math.max(0, (hf.num_bathrooms || 1) - 1) * 0.06;
    const size = hf.household_size || 1;
    if (size >= 5) multiplier += 0.12;
    else if (size >= 4) multiplier += 0.08;
    else if (size >= 3) multiplier += 0.04;
    if (hf.has_garden) multiplier += 0.05;
    if (hf.has_pool) multiplier += 0.08;
    if (hf.building_type === "house" && (hf.num_floors || 1) >= 2) multiplier += 0.03;
  }

  return Math.round(Math.min(Math.max(multiplier, 0.80), 1.50) * 100) / 100;
}

/**
 * MAIN PREDICTION - Uses Python's units, calculates amount via tariff
 */
export const predictBill = async (
  utility,
  bills,
  method = "auto",
  householdFeatures = null
) => {
  try {
    console.log(`\n🔮 Predicting ${utility}...`);

    const now = new Date();
    const targetMonth = now.toLocaleString("default", { month: "long" });
    const targetYear = now.getFullYear();

    const hf = extractHouseholdFeatures(householdFeatures, utility);

    console.log(`🏠 HH [${utility}]: Floors:${hf.num_floors} ACs:${hf.num_ac} Solar:${hf.has_solar} People:${hf.household_size}`);

    const historicalData = bills.map(bill => ({
      amount: bill.billAmount,
      units: bill.unitsUsed || 0,
      month: bill.billingMonth,
      year: new Date(bill.billingDate || now).getFullYear(),
      date: bill.billingDate
    }));

    // ✅ INTERNET: Skip Python ML, use historical weighted average directly
    if (utility === "Internet") {
      let finalAmount = 0;
      if (bills.length >= 3) {
        const sorted = [...bills].sort((a, b) => (b.billingMonth || "").localeCompare(a.billingMonth || ""));
        const w = [0.50, 0.30, 0.20];
        finalAmount = Math.round(
          sorted.slice(0, 3).reduce((sum, b, i) => sum + b.billAmount * w[i], 0)
        );
      } else if (bills.length > 0) {
        finalAmount = Math.round(bills.reduce((s, b) => s + b.billAmount, 0) / bills.length);
      }
      console.log(`🌐 Internet: No tariff/units → historical amount Rs.${finalAmount}`);

      return {
        success: true,
        predictedUnits: 0,
        predictedAmount: finalAmount,
        tariffUsed: false,
        confidence: bills.length >= 6 ? "Medium" : "Low",
        method: bills.length >= 3 ? "Weighted Average" : "Simple Average",
        mape: null,
        dataQuality: bills.length >= 6 ? "Good" : "Limited",
        isAnomaly: false,
        anomalyMessage: null,
        anomalyPercent: 0,
        anomalySeverity: "normal",
        message: `Predicted Rs.${finalAmount} based on ${bills.length} months of internet bill history`
      };
    }

    // Call Python ML service to get UNIT prediction
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
      utility_type: utility,
      historical_data: historicalData,
      target_month: targetMonth,
      target_year: targetYear,
      household_features: hf
    }, { timeout: 10000 });

    const mlData = response.data;

    let predictedUnits = mlData.predicted_units || 0;

    console.log(`📊 ML predicted units from Python: ${predictedUnits}`);

    // Apply household multiplier to units
    if (predictedUnits > 0) {
      const multiplier = calculateHouseholdMultiplier(hf, utility);
      const adjusted = Math.round(predictedUnits * multiplier);
      console.log(`🏠 Household multiplier: ×${multiplier} → ${predictedUnits} → ${adjusted} units`);
      predictedUnits = adjusted;
    }

    console.log(`📊 Final units for ${utility}: ${predictedUnits}`);

    // Calculate amount using tariff
    let finalAmount = 0;
    let tariffUsed = false;

    if (predictedUnits > 0) {
      try {
        const Tariff = (await import("../models/Tariff.js")).default;
        const activeTariff = await Tariff.findOne({
          utilityType: utility.toLowerCase(),
          status: "active"
        }).sort({ effectiveFrom: -1 });

        if (activeTariff) {
          finalAmount = calculateTariffBill(activeTariff, predictedUnits, utility);
          tariffUsed = true;
        }
      } catch (tariffErr) {
        console.warn("Tariff lookup failed:", tariffErr.message);
      }
    }

    console.log(`💰 ${utility}: ${predictedUnits} units → Rs. ${finalAmount} | tariff: ${tariffUsed}\n`);

    return {
      success: true,
      predictedUnits: predictedUnits,
      predictedAmount: finalAmount,
      tariffUsed,
      confidence: mlData.confidence || "Medium-High",
      method: "ML Units + Real Tariff",
      mape: mlData.mape,
      dataQuality: mlData.data_quality || "Good",
      isAnomaly: mlData.is_anomaly || false,
      anomalyMessage: mlData.anomaly_message,
      anomalyPercent: mlData.anomaly_percent || 0,
      anomalySeverity: mlData.anomaly_severity || "normal",
      message: mlData.message || `Predicted ${predictedUnits} units based on your usage history`
    };

  } catch (error) {
    console.error("ML Service error:", error.message);
    if (error.code === "ECONNREFUSED") console.error("❌ Cannot connect to ML service on port 8001");
    return fallbackPrediction(bills);
  }
};

// ====================== SUPPORTING FUNCTIONS ======================

export const maybeSendAnomalyAlert = async (userId, userEmail, userName, anomalyData) => {
  if (!userEmail || !userName) return false;
  const key = `${userId}_${anomalyData.utilityType}`;
  const lastSent = anomalyCooldown.get(key) || 0;
  const now = Date.now();
  if (now - lastSent < COOLDOWN_MS) {
    console.log(`⏳ Anomaly email skipped for ${key} — sent ${((now - lastSent) / 3_600_000).toFixed(1)}h ago`);
    return false;
  }
  try {
    const emailModule = await import("./emailService.js");
    const emailService = emailModule.default;
    await emailService.sendAnomalyAlert(userEmail, userName, anomalyData);
    anomalyCooldown.set(key, now);
    console.log(`✅ Anomaly alert sent to ${userEmail}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send anomaly alert:", err.message);
    return false;
  }
};

export const detectAnomaly = async (utility, currentUnits, historicalUnits) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/detect-anomaly`, { utility, currentUnits, historicalUnits });
    return response.data;
  } catch (error) {
    console.error("ML detectAnomaly error:", error.message);
    return fallbackAnomaly(currentUnits, historicalUnits);
  }
};

export const predictBillLegacy = async (utility, bills, method = "simple") => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/legacy`, {
      utility_type: utility,
      historical_data: bills.map(bill => ({ amount: bill.billAmount, month: bill.billingMonth })),
      target_month: new Date().toLocaleString("default", { month: "long" }),
      target_year: new Date().getFullYear()
    });
    return {
      success: true, predictedUnits: 0,
      predictedAmount: response.data.predictedAmount,
      confidence: response.data.confidence,
      method: response.data.method,
      message: response.data.message
    };
  } catch (error) {
    console.error("Legacy ML error:", error.message);
    return fallbackPrediction(bills);
  }
};

function fallbackPrediction(bills) {
  if (!bills.length) return { success: false, predictedAmount: 0, predictedUnits: 0 };
  const sorted = [...bills].sort((a, b) => {
    const aM = a.billingMonth || ""; const bM = b.billingMonth || "";
    if (bM !== aM) return bM.localeCompare(aM);
    return new Date(b.billingDate || 0) - new Date(a.billingDate || 0);
  });
  const predictedAmount = sorted.length >= 3
    ? Math.round(sorted[0].billAmount * 0.50 + sorted[1].billAmount * 0.30 + sorted[2].billAmount * 0.20)
    : Math.round(sorted.reduce((s, b) => s + b.billAmount, 0) / sorted.length);
  return { success: true, predictedAmount, predictedUnits: 0, confidence: "Low", method: "fallback",
    message: "Using fallback calculation (ML service unavailable)" };
}

function fallbackAnomaly(current, historical) {
  if (historical.length < 3) return { isAnomaly: false, percentIncrease: 0, severity: "normal" };
  const avg = historical.slice(-3).reduce((s, v) => s + v, 0) / 3;
  const percent = ((current - avg) / avg) * 100;
  return {
    isAnomaly: percent > 20, percentIncrease: percent,
    severity: percent > 30 ? "critical" : "warning",
    message: `Usage ${percent > 20 ? "increased" : "normal"} by ${percent.toFixed(1)}%`
  };
}

export default { predictBill, calculateTariffBill, maybeSendAnomalyAlert, detectAnomaly, predictBillLegacy };