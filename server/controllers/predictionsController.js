// server/controllers/predictionsController.js
import Bill from "../models/Bill.js";
import User from "../models/User.js";
import { predictBill, detectAnomaly, maybeSendAnomalyAlert } from "../services/mlService.js";

// ─── Month helpers ─────────────────────────────────────────────────────────────
const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const formatChartMonth = (monthStr) => {
  if (!monthStr) return "";
  try {
    if (monthStr.includes("-") && monthStr.length <= 7) {
      const [year, monthNum] = monthStr.split("-");
      return `${months[parseInt(monthNum) - 1].slice(0, 3)} '${year.slice(2)}`;
    }
    if (monthStr.includes(" ")) {
      const [month, year] = monthStr.split(" ");
      return `${month.slice(0, 3)} '${year.slice(2)}`;
    }
    return monthStr;
  } catch {
    return monthStr;
  }
};

const formatFullMonth = (monthStr) => {
  if (!monthStr) return "";
  try {
    if (monthStr.includes("-") && monthStr.length <= 7) {
      const [year, monthNum] = monthStr.split("-");
      return `${months[parseInt(monthNum) - 1]} ${year}`;
    }
    return monthStr;
  } catch {
    return monthStr;
  }
};

const getNextMonth = (currentMonth) => {
  if (!currentMonth) return "Next Month";
  try {
    let month, year;
    if (currentMonth.includes("-") && currentMonth.length <= 7) {
      const [yearStr, monthNum] = currentMonth.split("-");
      month = months[parseInt(monthNum) - 1];
      year  = parseInt(yearStr);
    } else if (currentMonth.includes(" ")) {
      [month, year] = currentMonth.split(" ");
      year = parseInt(year);
    } else {
      return "Next Month";
    }
    const idx     = months.indexOf(month);
    const nextIdx = (idx + 1) % 12;
    return `${months[nextIdx]} ${nextIdx === 0 ? year + 1 : year}`;
  } catch {
    return "Next Month";
  }
};

const getCurrentMonthLabel = () => {
  const now = new Date();
  return `${months[now.getMonth()]} ${now.getFullYear()}`;
};

// ─── Average helpers ──────────────────────────────────────────────────────────
const calculateAverage = (bills) => {
  if (!bills?.length) return { units: 0, amount: 0 };
  const unitsSum  = bills.reduce((s, b) => s + (b.unitsUsed || 0), 0);
  const amountSum = bills.reduce((s, b) => s + b.billAmount, 0);
  return {
    units:  Math.round(unitsSum  / bills.length),
    amount: Math.round(amountSum / bills.length)
  };
};

const calculateWeightedAverage = (bills) => {
  if (!bills?.length) return { units: 0, amount: 0 };
  const sorted = [...bills].sort((a, b) => {
    const aDate = a.billingDate || new Date(a.billingMonth);
    const bDate = b.billingDate || new Date(b.billingMonth);
    return aDate - bDate;
  });
  const count = sorted.length;
  if (count === 1) return { units: sorted[0].unitsUsed || 0, amount: sorted[0].billAmount };
  if (count === 2) {
    return {
      units:  Math.round((sorted[1].unitsUsed || 0) * 0.6 + (sorted[0].unitsUsed || 0) * 0.4),
      amount: Math.round(sorted[1].billAmount  * 0.6 + sorted[0].billAmount  * 0.4)
    };
  }
  const weights = [0.5, 0.3, 0.2];
  let unitsSum = 0, amountSum = 0;
  for (let i = 0; i < 3; i++) {
    const bill = sorted[count - 1 - i];
    unitsSum  += (bill.unitsUsed || 0) * weights[i];
    amountSum += bill.billAmount       * weights[i];
  }
  return { units: Math.round(unitsSum), amount: Math.round(amountSum) };
};

// ─── Core prediction helper - UPDATED to accept householdFeatures ──────────────
const getPredictionForUtility = async (utility, bills, householdFeatures = null) => {
  if (bills.length < 3) {
    const avg = calculateAverage(bills);
    return {
      predictedAmount:  avg.amount,
      confidence:       "Low",
      method:           "Simple Average (Insufficient data)",
      historicalMonths: bills.length,
      isAnomaly:        false,
      anomalyMessage:   null,
      anomalyPercent:   0,
      anomalySeverity:  "normal"
    };
  }

  const formattedBills = bills.map(b => ({
    billingMonth: b.billingMonth,
    utilityType:  b.utilityType,
    unitsUsed:    b.unitsUsed || 0,
    billAmount:   b.billAmount
  }));

  try {
    // ✅ PASS householdFeatures to predictBill
    const mlResult = await predictBill(utility, formattedBills, "simple", householdFeatures);
    if (mlResult.success) {
      return {
        predictedAmount:  Math.round(mlResult.predictedAmount),
        confidence:       mlResult.confidence || "Medium",
        method:           `ML - ${mlResult.method || "simple"}`,
        historicalMonths: bills.length,
        isAnomaly:        mlResult.isAnomaly      || false,
        anomalyMessage:   mlResult.anomalyMessage || null,
        anomalyPercent:   mlResult.anomalyPercent || 0,
        anomalySeverity:  mlResult.anomalySeverity || "normal"
      };
    }
    throw new Error("ML prediction returned success=false");
  } catch (err) {
    console.warn(`ML fallback for ${utility}:`, err.message);
    const weightedAvg = calculateWeightedAverage(bills);
    return {
      predictedAmount:  weightedAvg.amount,
      confidence:       "Low",
      method:           "Weighted Average (ML unavailable)",
      historicalMonths: bills.length,
      isAnomaly:        false,
      anomalyMessage:   null,
      anomalyPercent:   0,
      anomalySeverity:  "normal"
    };
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 1. GET /api/predictions/next-month
// ──────────────────────────────────────────────────────────────────────────────
export const getNextMonthPrediction = async (req, res) => {
  try {
    const userId  = req.user.id;
    const { utility = "Electricity", method = "simple" } = req.query;

    const bills = await Bill.find({ user: userId, utilityType: utility })
      .sort({ billingMonth: 1 });

    if (!bills.length) {
      return res.json({
        success: true, predictions: null,
        message: `No bill data available for ${utility}`,
        confidence: "Low", dataPoints: 0
      });
    }

    const formattedBills = bills.map(b => ({
      billingMonth: b.billingMonth,
      utilityType: b.utilityType,
      unitsUsed: b.unitsUsed || 0,
      billAmount: b.billAmount
    }));

    const mlResult = await predictBill(utility, formattedBills, method);
    const { predictedUnits, predictedAmount, confidence } = mlResult.success
      ? mlResult
      : { ...calculateAverage(bills), confidence: "Low" };

    const lastBill    = bills[bills.length - 1];
    const amountChange = Math.round(((predictedAmount - lastBill.billAmount) / lastBill.billAmount) * 100);

    res.json({
      success: true,
      predictions: {
        predictedUnits:  utility === "Internet" ? 0 : predictedUnits,
        predictedAmount,
        amountChange,
        percentChange:   amountChange,
        currentUnits:    utility === "Internet" ? 0 : lastBill.unitsUsed || 0,
        currentAmount:   lastBill.billAmount,
        confidence,
        explanation:     mlResult.success
          ? `ML prediction based on ${bills.length} months of data using ${method} method.`
          : `Fallback calculation based on average of ${bills.length} months.`,
        method:     mlResult.success ? `ML - ${method}` : "Simple Average (Fallback)",
        nextMonth:  getCurrentMonthLabel(),
        dataPoints: bills.length,
        mlUsed:     mlResult.success
      }
    });
  } catch (error) {
    console.error("ERROR in getNextMonthPrediction:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 2. GET /api/predictions/history
// ──────────────────────────────────────────────────────────────────────────────
export const getPredictionHistory = async (req, res) => {
  try {
    const userId  = req.user.id;
    const { utility = "Electricity" } = req.query;

    const bills = await Bill.find({ user: userId, utilityType: utility })
      .sort({ billingMonth: 1 });

    if (!bills.length) {
      return res.json({ success: true, history: { usageData: [], billData: [], stats: null } });
    }

    const usageData = bills.map(b => ({ month: formatChartMonth(b.billingMonth), units: b.unitsUsed || 0 }));
    const billData  = bills.map(b => ({ month: formatChartMonth(b.billingMonth), amount: b.billAmount }));

    const amounts         = bills.map(b => b.billAmount);
    const avgMonthlyBill  = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length);
    const totalSpend      = amounts.reduce((a, b) => a + b, 0);
    const highestBill     = bills.reduce((max, b) => b.billAmount > max.billAmount ? b : max, bills[0]);
    const lowestBill      = bills.reduce((min, b) => b.billAmount < min.billAmount ? b : min, bills[0]);

    let overallTrend = 0;
    if (amounts.length >= 3) {
      const recent = amounts.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const older  = amounts.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      overallTrend = older ? Math.round(((recent - older) / older) * 100) : 0;
    }

    res.json({
      success: true,
      history: {
        usageData, billData,
        stats: {
          highestBill:    { amount: highestBill.billAmount, month: formatFullMonth(highestBill.billingMonth) },
          lowestBill:     { amount: lowestBill.billAmount,  month: formatFullMonth(lowestBill.billingMonth)  },
          avgMonthlyBill, totalSpend, totalBills: bills.length, overallTrend,
          costPerUnit: utility !== "Internet" && bills[bills.length - 1]?.unitsUsed
            ? (bills[bills.length - 1].billAmount / bills[bills.length - 1].unitsUsed).toFixed(2) : 0
        }
      }
    });
  } catch (error) {
    console.error("ERROR in getPredictionHistory:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 3. GET /api/predictions/summary
// ──────────────────────────────────────────────────────────────────────────────
export const getPredictionSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const elecBills  = await Bill.find({ user: userId, utilityType: "Electricity" }).sort({ billingMonth: -1 }).limit(6);
    const waterBills = await Bill.find({ user: userId, utilityType: "Water"       }).sort({ billingMonth: -1 }).limit(6);

    const format = (bills) => bills.map(b => ({
      billingMonth: b.billingMonth, utilityType: b.utilityType,
      unitsUsed: b.unitsUsed || 0, billAmount: b.billAmount
    }));

    let elecPred, waterPred;
    try {
      const r = await predictBill("Electricity", format(elecBills), "simple");
      elecPred = r.success ? r.predictedAmount : calculateAverage(elecBills).amount;
    } catch { elecPred = calculateAverage(elecBills).amount; }

    try {
      const r = await predictBill("Water", format(waterBills), "simple");
      waterPred = r.success ? r.predictedAmount : calculateAverage(waterBills).amount;
    } catch { waterPred = calculateAverage(waterBills).amount; }

    res.json({
      success: true,
      summary: {
        electricity: { predicted: Math.round(elecPred),  current: elecBills[0]?.billAmount  || 0 },
        water:       { predicted: Math.round(waterPred), current: waterBills[0]?.billAmount || 0 },
        total:     Math.round(elecPred + waterPred),
        nextMonth: getCurrentMonthLabel()
      }
    });
  } catch (error) {
    console.error("ERROR in getPredictionSummary:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 4. POST /api/predictions/batch - UPDATED with household features
// ──────────────────────────────────────────────────────────────────────────────
export const getBatchPredictions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { utilities } = req.body;

    // ✅ FETCH USER WITH HOUSEHOLD FEATURES
    const user = await User.findById(userId).select("householdFeatures");
    const householdFeatures = user?.householdFeatures || {};

    const results = {};
    for (const utility of utilities) {
      const bills = await Bill.find({ user: userId, utilityType: utility })
        .sort({ billingMonth: 1 });

      // ✅ PASS householdFeatures to getPredictionForUtility
      results[utility.toLowerCase()] = await getPredictionForUtility(utility, bills, householdFeatures);
    }

    res.json(results);
  } catch (error) {
    console.error("ERROR in getBatchPredictions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 5. GET /api/predictions/current - UPDATED with household features
// Used by Dashboard and Budget page — NO anomaly emails here
// ──────────────────────────────────────────────────────────────────────────────
export const getCurrentPredictions = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // ✅ FETCH USER WITH HOUSEHOLD FEATURES
    const user = await User.findById(userId).select("householdFeatures");

// ADD THIS TEMPORARILY
console.log("🔍 RAW householdFeatures from DB:", JSON.stringify(user?.householdFeatures, null, 2));

const householdFeatures = user?.householdFeatures || {};

    const elecBills = await Bill.find({ user: userId, utilityType: "Electricity" }).sort({ billingMonth: 1 });
    const waterBills = await Bill.find({ user: userId, utilityType: "Water" }).sort({ billingMonth: 1 });

    // ✅ PASS householdFeatures to getPredictionForUtility
    const electricity = await getPredictionForUtility("Electricity", elecBills, householdFeatures);
    const water = await getPredictionForUtility("Water", waterBills, householdFeatures);

    const total = (electricity.predictedAmount || 0) + (water.predictedAmount || 0);
    const isUsingML = electricity.method.includes("ML") || water.method.includes("ML");
    const hasAnomaly = electricity.isAnomaly || water.isAnomaly;

    res.json({
      electricity,
      water,
      month: now.toLocaleString("en-US", { month: "long" }),
      year: now.getFullYear(),
      total,
      isUsingML,
      hasAnomaly
    });
  } catch (error) {
    console.error("ERROR in getCurrentPredictions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 6. GET /api/predictions/forecast
// ──────────────────────────────────────────────────────────────────────────────
export const getForecastPredictions = async (req, res) => {
  try {
    const userId = req.user.id;
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

    const elecBills = await Bill.find({ user: userId, utilityType: "Electricity" }).sort({ billingMonth: 1 });
    const waterBills = await Bill.find({ user: userId, utilityType: "Water" }).sort({ billingMonth: 1 });

    const getForecast = async (utility, bills) => {
      if (bills.length < 3) return Math.round(calculateAverage(bills).amount * 1.05);
      try {
        const formattedBills = bills.map(b => ({
          billingMonth: b.billingMonth, utilityType: b.utilityType,
          unitsUsed: b.unitsUsed || 0, billAmount: b.billAmount
        }));
        const r = await predictBill(utility, formattedBills, "simple");
        if (r.success) return Math.round(r.predictedAmount * 1.05);
      } catch { /* fall through */ }
      return Math.round(calculateWeightedAverage(bills).amount * 1.05);
    };

    const electricity = await getForecast("Electricity", elecBills);
    const water = await getForecast("Water", waterBills);

    res.json({
      electricity: { predictedAmount: electricity, confidence: "Medium", method: "5% Projection + ML/Weighted Average" },
      water: { predictedAmount: water, confidence: "Medium", method: "5% Projection + ML/Weighted Average" },
      month: nextMonth.toLocaleString("en-US", { month: "long" }),
      year: nextMonth.getFullYear(),
      total: electricity + water
    });
  } catch (error) {
    console.error("ERROR in getForecastPredictions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 7. GET /api/predictions/single
// ──────────────────────────────────────────────────────────────────────────────
export const getSinglePrediction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { utilityType } = req.query;

    if (!utilityType) {
      return res.status(400).json({ success: false, message: "utilityType is required" });
    }

    const user = await User.findById(userId).select("householdFeatures");
    const householdFeatures = user?.householdFeatures || {};

    const bills = await Bill.find({ user: userId, utilityType }).sort({ billingMonth: 1 });
    const result = await getPredictionForUtility(utilityType, bills, householdFeatures);
    res.json(result);
  } catch (error) {
    console.error("ERROR in getSinglePrediction:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// 8. POST /api/bills  (or wherever you add bills)
//    ✅ THIS is the ONLY place anomaly emails should be triggered.
//    Call this after saving a new bill to the database.
// ──────────────────────────────────────────────────────────────────────────────
export const checkAndAlertAnomaly = async (userId, utilityType) => {
  try {
    const user = await User.findById(userId);
    if (!user?.email) return;

    // Fetch the 4 most recent bills (current + 3 for comparison)
    const recentBills = await Bill.find({ user: userId, utilityType })
      .sort({ billingMonth: -1 })
      .limit(4);

    if (recentBills.length < 3) return; // Not enough data for anomaly detection

    const amounts    = recentBills.map(b => b.billAmount);
    const current    = amounts[0];
    const prevSlice  = amounts.slice(1);
    const avgPrev    = prevSlice.reduce((s, v) => s + v, 0) / prevSlice.length;
    const pctIncrease = avgPrev > 0 ? ((current - avgPrev) / avgPrev) * 100 : 0;

    if (pctIncrease <= 20) return; // Not an anomaly

    const severity = pctIncrease > 30 ? "critical" : "warning";
    console.log(`⚠️ Bill anomaly for user ${userId}, ${utilityType}: +${pctIncrease.toFixed(1)}% (${severity})`);

    await maybeSendAnomalyAlert(
      userId,
      user.email,
      user.name || user.username || "User",
      {
        utilityType,
        currentAmount:   current,
        averageAmount:   Math.round(avgPrev),
        increasePercent: pctIncrease.toFixed(1),
        severity
      }
    );
  } catch (err) {
    // Don't let anomaly checking break the bill-add flow
    console.error("checkAndAlertAnomaly error:", err.message);
  }
  
};