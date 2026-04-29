// server/services/mlService.js
import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

// ─── In-memory cooldown tracker ───────────────────────────────────────────────
// Key: "<userId>_<utility>"  Value: timestamp of last sent email
// This prevents duplicate emails within a single server session.
// For persistence across restarts, see User model approach in predictionsController.
const anomalyCooldown = new Map();
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Call ML service to predict next month's bill.
 *
 * NOTE: userEmail / userName are intentionally NOT accepted here anymore.
 * Anomaly alerting is handled at the controller level (only on bill add),
 * not on every prediction fetch.
 */
export const predictBill = async (
  utility,
  bills,
  method = "auto",
  householdFeatures = null
) => {
  try {
    console.log(`Calling ML service for ${utility} prediction...`);

    const now        = new Date();
    const targetMonth = now.toLocaleString("default", { month: "long" });
    const targetYear  = now.getFullYear();

    const historicalData = bills.map(bill => ({
      amount: bill.billAmount,
      units:  bill.unitsUsed || 0,
      month:  bill.billingMonth,
      year:   new Date(bill.billingDate || now).getFullYear(),
      date:   bill.billingDate
    }));

    const requestBody = {
      utility_type:       utility,
      historical_data:    historicalData,
      target_month:       targetMonth,
      target_year:        targetYear,
      household_features: householdFeatures || {
        household_size:   1,
        num_ac:           0,
        num_bathrooms:    1,
        num_floors:       1,
        building_type:    "house",
        has_solar:        false,
        has_water_heater: false
      }
    };

    const response = await axios.post(`${ML_SERVICE_URL}/predict`, requestBody, {
      timeout: 10000
    });

    const mlData = response.data;

    return {
      success:        true,
      predictedUnits: mlData.predicted_amount ? Math.round(mlData.predicted_amount / 12) : 0,
      predictedAmount: mlData.predicted_amount,
      confidence:     mlData.confidence,
      method:         mlData.method,
      mape:           mlData.mape,
      dataQuality:    mlData.data_quality,
      isAnomaly:      mlData.is_anomaly      || false,
      anomalyMessage: mlData.anomaly_message || null,
      anomalyPercent: mlData.anomaly_percent || 0,
      anomalySeverity:mlData.anomaly_severity || "normal",
      message:        mlData.message
    };

  } catch (error) {
    console.error("ML Service error:", error.message);
    if (error.code === "ECONNREFUSED") {
      console.error("❌ Cannot connect to ML service on port 8001");
    }
    return fallbackPrediction(bills);
  }
};

/**
 * Send an anomaly alert email IF the cooldown for this user+utility has expired.
 *
 * Call this ONLY from the "add bill" flow, never from prediction-fetch endpoints.
 *
 * @param {string} userId      - MongoDB user ID (used as cooldown key)
 * @param {string} userEmail
 * @param {string} userName
 * @param {object} anomalyData - { utilityType, currentAmount, averageAmount, increasePercent, severity }
 * @returns {Promise<boolean>} true if email was sent, false if skipped (cooldown)
 */
export const maybeSendAnomalyAlert = async (userId, userEmail, userName, anomalyData) => {
  if (!userEmail || !userName) return false;

  const key     = `${userId}_${anomalyData.utilityType}`;
  const lastSent = anomalyCooldown.get(key) || 0;
  const now      = Date.now();

  if (now - lastSent < COOLDOWN_MS) {
    const hoursAgo = ((now - lastSent) / 3_600_000).toFixed(1);
    console.log(`⏳ Anomaly email skipped for ${key} — sent ${hoursAgo}h ago (cooldown: 24h)`);
    return false;
  }

  try {
    const emailModule  = await import("./emailService.js");
    const emailService = emailModule.default;

    await emailService.sendAnomalyAlert(userEmail, userName, anomalyData);

    // Record send time AFTER successful send
    anomalyCooldown.set(key, now);
    console.log(`✅ Anomaly alert sent to ${userEmail} for ${anomalyData.utilityType}`);
    return true;
  } catch (err) {
    console.error("❌ Failed to send anomaly alert:", err.message);
    return false;
  }
};

/**
 * Detect anomaly using ML service's dedicated endpoint (if available).
 * Does NOT send emails — caller decides whether to alert.
 */
export const detectAnomaly = async (utility, currentUnits, historicalUnits) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/detect-anomaly`, {
      utility,
      currentUnits,
      historicalUnits
    });
    return response.data;
  } catch (error) {
    console.error("ML Service detectAnomaly error:", error.message);
    return fallbackAnomaly(currentUnits, historicalUnits);
  }
};

/**
 * Legacy endpoint — backward compatibility only. No email logic here.
 */
export const predictBillLegacy = async (utility, bills, method = "simple") => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict/legacy`, {
      utility_type:    utility,
      historical_data: bills.map(bill => ({
        amount: bill.billAmount,
        month:  bill.billingMonth
      })),
      target_month: new Date().toLocaleString("default", { month: "long" }),
      target_year:  new Date().getFullYear()
    });

    return {
      success:        true,
      predictedUnits: 0,
      predictedAmount: response.data.predictedAmount,
      confidence:     response.data.confidence,
      method:         response.data.method,
      message:        response.data.message
    };
  } catch (error) {
    console.error("Legacy ML Service error:", error.message);
    return fallbackPrediction(bills);
  }
};

// ─── Fallback helpers ─────────────────────────────────────────────────────────

function fallbackPrediction(bills) {
  console.log("Using fallback prediction calculation");
  if (!bills.length) {
    return { success: false, predictedAmount: 0, predictedUnits: 0 };
  }

  let predictedAmount;
  if (bills.length >= 3) {
    const recent = bills.slice(-3);
    predictedAmount = Math.round(
      recent[0].billAmount * 0.5 +
      recent[1].billAmount * 0.3 +
      recent[2].billAmount * 0.2
    );
  } else {
    predictedAmount = Math.round(
      bills.reduce((s, b) => s + b.billAmount, 0) / bills.length
    );
  }

  return {
    success:        true,
    predictedAmount,
    predictedUnits: Math.round(predictedAmount / 12),
    confidence:     "Low",
    method:         "fallback",
    isAnomaly:      false,
    anomalyMessage: null,
    message:        "Using fallback calculation (ML service unavailable)"
  };
}

function fallbackAnomaly(current, historical) {
  if (historical.length < 3) {
    return { isAnomaly: false, percentIncrease: 0, severity: "normal" };
  }
  const avg     = historical.slice(-3).reduce((s, v) => s + v, 0) / 3;
  const percent = ((current - avg) / avg) * 100;
  return {
    isAnomaly:       percent > 20,
    percentIncrease: percent,
    severity:        percent > 30 ? "critical" : "warning",
    message:         `Usage ${percent > 20 ? "increased" : "normal"} by ${percent.toFixed(1)}%`
  };
}