// server/controllers/predictionsController.js
import Bill from "../models/Bill.js";
import { predictBill, detectAnomaly } from "../services/mlService.js";

// Helper functions - UPDATED to handle "YYYY-MM" format
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const formatChartMonth = (monthStr) => {
  if (!monthStr) return "";
  try {
    // Handle "YYYY-MM" format like "2026-04"
    if (monthStr.includes("-") && monthStr.length <= 7) {
      const [year, monthNum] = monthStr.split("-");
      const monthIndex = parseInt(monthNum) - 1;
      const monthName = months[monthIndex];
      return `${monthName.slice(0,3)} '${year.slice(2)}`;
    }
    // Handle "January 2025" format
    if (monthStr.includes(" ")) {
      const [month, year] = monthStr.split(" ");
      return `${month.slice(0,3)} '${year.slice(2)}`;
    }
    return monthStr;
  } catch (e) {
    console.error("Error formatting month:", e);
    return monthStr;
  }
};

const formatFullMonth = (monthStr) => {
  if (!monthStr) return "";
  try {
    // Handle "YYYY-MM" format like "2026-04"
    if (monthStr.includes("-") && monthStr.length <= 7) {
      const [year, monthNum] = monthStr.split("-");
      const monthIndex = parseInt(monthNum) - 1;
      const monthName = months[monthIndex];
      return `${monthName} ${year}`;
    }
    return monthStr;
  } catch (e) {
    return monthStr;
  }
};

const getNextMonth = (currentMonth) => {
  if (!currentMonth) return "Next Month";
  try {
    let month, year;
    
    // Handle "YYYY-MM" format like "2026-04"
    if (currentMonth.includes("-") && currentMonth.length <= 7) {
      const [yearStr, monthNum] = currentMonth.split("-");
      const monthIndex = parseInt(monthNum) - 1;
      month = months[monthIndex];
      year = parseInt(yearStr);
    }
    // Handle "Month Year" format
    else if (currentMonth.includes(" ")) {
      [month, year] = currentMonth.split(" ");
      year = parseInt(year);
    } else {
      return "Next Month";
    }
    
    const idx = months.indexOf(month);
    const nextIdx = (idx + 1) % 12;
    const nextYear = nextIdx === 0 ? year + 1 : year;
    return `${months[nextIdx]} ${nextYear}`;
  } catch (e) {
    console.error("Error getting next month:", e);
    return "Next Month";
  }
};

// Helper function for fallback calculations
const calculateAverage = (bills) => {
  if (!bills || bills.length === 0) return { units: 0, amount: 0 };
  let unitsSum = 0, amountSum = 0;
  for (const b of bills) {
    unitsSum += b.unitsUsed || 0;
    amountSum += b.billAmount;
  }
  return {
    units: Math.round(unitsSum / bills.length),
    amount: Math.round(amountSum / bills.length)
  };
};

// Helper: Calculate Weighted Average (more weight to recent months)
const calculateWeightedAverage = (bills) => {
  if (!bills || bills.length === 0) return { units: 0, amount: 0 };
  
  // Sort by date (oldest first)
  const sorted = [...bills].sort((a, b) => {
    const aDate = a.billingDate || new Date(a.billingMonth);
    const bDate = b.billingDate || new Date(b.billingMonth);
    return aDate - bDate;
  });
  
  const count = sorted.length;
  
  if (count === 1) {
    return { units: sorted[0].unitsUsed || 0, amount: sorted[0].billAmount };
  }
  
  if (count === 2) {
    // 60% recent, 40% older
    return {
      units: Math.round((sorted[1].unitsUsed || 0) * 0.6 + (sorted[0].unitsUsed || 0) * 0.4),
      amount: Math.round(sorted[1].billAmount * 0.6 + sorted[0].billAmount * 0.4)
    };
  }
  
  // For 3+ months: 50% most recent, 30% second, 20% third
  const weights = [0.5, 0.3, 0.2];
  let unitsSum = 0, amountSum = 0;
  
  for (let i = 0; i < Math.min(3, count); i++) {
    const bill = sorted[count - 1 - i];
    unitsSum += (bill.unitsUsed || 0) * weights[i];
    amountSum += bill.billAmount * weights[i];
  }
  
  return {
    units: Math.round(unitsSum),
    amount: Math.round(amountSum)
  };
};

// ──────────────────────────────────────────────
// 1. GET /api/predictions/next-month
// Uses ML Service for predictions
// ──────────────────────────────────────────────
export const getNextMonthPrediction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { utility = "Electricity", method = "simple" } = req.query;
    
    console.log("=== getNextMonthPrediction called ===");
    console.log("userId:", userId);
    console.log("utility:", utility);
    console.log("method:", method);
    
    // Get bills
    const bills = await Bill.find({ 
      user: userId, 
      utilityType: utility 
    }).sort({ billingMonth: 1 });
    
    console.log("Bills found:", bills.length);
    
    if (!bills.length) {
      return res.json({
        success: true,
        predictions: null,
        message: `No bill data available for ${utility}`,
        confidence: "Low",
        dataPoints: 0
      });
    }
    
    // Format bills for ML service
    const formattedBills = bills.map(b => ({
      billingMonth: b.billingMonth,
      utilityType: b.utilityType,
      unitsUsed: b.unitsUsed || 0,
      billAmount: b.billAmount
    }));
    
    // Call ML service for prediction
    const mlResult = await predictBill(utility, formattedBills, method);
    
    let predictedUnits, predictedAmount, confidence;
    
    if (mlResult.success) {
      predictedUnits = mlResult.predictedUnits;
      predictedAmount = mlResult.predictedAmount;
      confidence = mlResult.confidence;
      console.log(`✅ ML Prediction: ${predictedAmount} (${confidence} confidence)`);
    } else {
      // Fallback to simple average if ML fails
      console.log("ML service failed, using fallback calculation");
      const fallback = calculateAverage(bills);
      predictedUnits = fallback.units;
      predictedAmount = fallback.amount;
      confidence = "Low";
    }
    
    const lastBill = bills[bills.length - 1];
    const amountChange = Math.round(((predictedAmount - lastBill.billAmount) / lastBill.billAmount) * 100);
    const nextMonth = getNextMonth(lastBill.billingMonth);
    const isFlat = utility === "Internet";
    
    res.json({
      success: true,
      predictions: {
        predictedUnits: isFlat ? 0 : predictedUnits,
        predictedAmount: predictedAmount,
        amountChange: amountChange,
        percentChange: amountChange,
        currentUnits: isFlat ? 0 : lastBill.unitsUsed || 0,
        currentAmount: lastBill.billAmount,
        confidence: confidence,
        explanation: mlResult.success 
          ? `ML prediction based on ${bills.length} months of data using ${method} method.`
          : `Fallback calculation based on average of ${bills.length} months.`,
        method: mlResult.success ? `ML - ${method}` : "Simple Average (Fallback)",
        nextMonth: nextMonth,
        dataPoints: bills.length,
        mlUsed: mlResult.success
      }
    });
    
  } catch (error) {
    console.error("ERROR in getNextMonthPrediction:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// 2. GET /api/predictions/history
// ──────────────────────────────────────────────
export const getPredictionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { utility = "Electricity" } = req.query;
    
    console.log("=== getPredictionHistory called ===");
    console.log("userId:", userId);
    console.log("utility:", utility);
    
    const bills = await Bill.find({ 
      user: userId, 
      utilityType: utility 
    }).sort({ billingMonth: 1 });
    
    console.log("Bills found:", bills.length);
    
    if (!bills.length) {
      return res.json({
        success: true,
        history: {
          usageData: [],
          billData: [],
          stats: null
        }
      });
    }
    
    // Prepare chart data with proper month formatting
    const usageData = [];
    const billData = [];
    
    for (const bill of bills) {
      const chartMonth = formatChartMonth(bill.billingMonth);
      usageData.push({
        month: chartMonth,
        units: bill.unitsUsed || 0
      });
      billData.push({
        month: chartMonth,
        amount: bill.billAmount
      });
    }
    
    // Calculate statistics
    const amounts = bills.map(b => b.billAmount);
    const avgMonthlyBill = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length);
    const totalSpend = amounts.reduce((a, b) => a + b, 0);
    
    const highestBill = bills.reduce((max, b) => b.billAmount > max.billAmount ? b : max, bills[0]);
    const lowestBill = bills.reduce((min, b) => b.billAmount < min.billAmount ? b : min, bills[0]);
    
    // Calculate trend
    let overallTrend = 0;
    if (amounts.length >= 3) {
      const recent = amounts.slice(-3).reduce((a, b) => a + b, 0) / 3;
      const older = amounts.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      overallTrend = older ? Math.round(((recent - older) / older) * 100) : 0;
    }
    
    const isFlat = utility === "Internet";
    
    res.json({
      success: true,
      history: {
        usageData,
        billData,
        stats: {
          highestBill: { 
            amount: highestBill.billAmount, 
            month: formatFullMonth(highestBill.billingMonth) 
          },
          lowestBill: { 
            amount: lowestBill.billAmount, 
            month: formatFullMonth(lowestBill.billingMonth) 
          },
          avgMonthlyBill,
          totalSpend,
          totalBills: bills.length,
          overallTrend,
          costPerUnit: !isFlat && bills[bills.length - 1]?.unitsUsed 
            ? (bills[bills.length - 1].billAmount / bills[bills.length - 1].unitsUsed).toFixed(2)
            : 0
        }
      }
    });
    
  } catch (error) {
    console.error("ERROR in getPredictionHistory:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// 3. GET /api/predictions/summary
// ──────────────────────────────────────────────
export const getPredictionSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const elecBills = await Bill.find({ user: userId, utilityType: "Electricity" }).sort({ billingMonth: -1 }).limit(6);
    const waterBills = await Bill.find({ user: userId, utilityType: "Water" }).sort({ billingMonth: -1 }).limit(6);
    
    // Format bills for ML service
    const formattedElecBills = elecBills.map(b => ({
      billingMonth: b.billingMonth,
      utilityType: b.utilityType,
      unitsUsed: b.unitsUsed || 0,
      billAmount: b.billAmount
    }));
    
    const formattedWaterBills = waterBills.map(b => ({
      billingMonth: b.billingMonth,
      utilityType: b.utilityType,
      unitsUsed: b.unitsUsed || 0,
      billAmount: b.billAmount
    }));
    
    // Try ML service first, fallback to average
    let elecPrediction, waterPrediction;
    
    try {
      const elecML = await predictBill("Electricity", formattedElecBills, "simple");
      elecPrediction = elecML.success ? elecML.predictedAmount : calculateAverage(elecBills).amount;
    } catch (e) {
      elecPrediction = calculateAverage(elecBills).amount;
    }
    
    try {
      const waterML = await predictBill("Water", formattedWaterBills, "simple");
      waterPrediction = waterML.success ? waterML.predictedAmount : calculateAverage(waterBills).amount;
    } catch (e) {
      waterPrediction = calculateAverage(waterBills).amount;
    }
    
    const lastElec = elecBills[0];
    const lastWater = waterBills[0];
    
    res.json({
      success: true,
      summary: {
        electricity: {
          predicted: Math.round(elecPrediction),
          current: lastElec?.billAmount || 0
        },
        water: {
          predicted: Math.round(waterPrediction),
          current: lastWater?.billAmount || 0
        },
        total: Math.round(elecPrediction + waterPrediction),
        nextMonth: getNextMonth(lastElec?.billingMonth)
      }
    });
    
  } catch (error) {
    console.error("ERROR in getPredictionSummary:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// 4. POST /api/predictions/batch
// Get predictions for multiple utilities at once (used by Budget page)
// Uses SAME "simple" method as Prediction page for consistency
// ──────────────────────────────────────────────
export const getBatchPredictions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { month, year, utilities } = req.body;
    
    console.log("=== getBatchPredictions called ===");
    console.log("userId:", userId);
    console.log("month:", month, "year:", year);
    console.log("utilities:", utilities);
    
    const results = {};
    
    for (const utility of utilities) {
      console.log(`Processing ${utility}...`);
      
      // Get bills for this utility
      const bills = await Bill.find({ 
        user: userId, 
        utilityType: utility 
      }).sort({ billingMonth: 1 });
      
      console.log(`${utility} bills found:`, bills.length);
      
      if (bills.length < 3) {
        // Not enough data - use simple average
        const avg = calculateAverage(bills);
        results[utility.toLowerCase()] = {
          predictedAmount: avg.amount,
          confidence: "Low",
          method: "Simple Average (Insufficient data)",
          historicalMonths: bills.length,
          warning: bills.length === 0 ? "No bill data available" : `Only ${bills.length} months of data`
        };
        continue;
      }
      
      // Format bills for ML service (SAME format as getNextMonthPrediction)
      const formattedBills = bills.map(b => ({
        billingMonth: b.billingMonth,
        utilityType: b.utilityType,
        unitsUsed: b.unitsUsed || 0,
        billAmount: b.billAmount
      }));
      
      // Try ML service with "simple" method (SAME as getNextMonthPrediction)
      let predictionResult;
      
      try {
        // Use "simple" method to match getNextMonthPrediction
        const mlResult = await predictBill(utility, formattedBills, "simple");
        
        if (mlResult.success) {
          console.log(`✅ ML prediction for ${utility}: Rs. ${mlResult.predictedAmount} (${mlResult.confidence} confidence)`);
          predictionResult = {
            predictedAmount: Math.round(mlResult.predictedAmount),
            confidence: mlResult.confidence || "Medium",
            method: `ML - ${mlResult.method || "simple"}`,
            historicalMonths: bills.length,
            mlUsed: true
          };
        } else {
          throw new Error("ML prediction failed");
        }
      } catch (err) {
        // Fallback to weighted average
        console.log(`ML failed for ${utility}, using fallback:`, err.message);
        const weightedAvg = calculateWeightedAverage(bills);
        predictionResult = {
          predictedAmount: weightedAvg.amount,
          confidence: "Low",
          method: "Weighted Average (Fallback)",
          historicalMonths: bills.length,
          mlUsed: false
        };
      }
      
      results[utility.toLowerCase()] = predictionResult;
    }
    
    console.log("Batch predictions results:", results);
    res.json(results);
    
  } catch (error) {
    console.error("ERROR in getBatchPredictions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// 5. GET /api/predictions/current
// Get predictions for current month (used by Dashboard and Budget page)
// Uses SAME "simple" method as Prediction page for consistency
// ──────────────────────────────────────────────
export const getCurrentPredictions = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const currentMonth = now.toLocaleString("en-US", { month: "long" });
    const currentYear = now.getFullYear();
    
    console.log("=== getCurrentPredictions called ===");
    console.log("Current month:", currentMonth, currentYear);
    
    // Get electricity bills
    const elecBills = await Bill.find({ 
      user: userId, 
      utilityType: "Electricity" 
    }).sort({ billingMonth: 1 });
    
    // Get water bills
    const waterBills = await Bill.find({ 
      user: userId, 
      utilityType: "Water" 
    }).sort({ billingMonth: 1 });
    
    console.log(`Electricity bills: ${elecBills.length}, Water bills: ${waterBills.length}`);
    
    const getPredictionForUtility = async (utility, bills) => {
      if (bills.length < 3) {
        const avg = calculateAverage(bills);
        console.log(`Insufficient data for ${utility}: ${bills.length} months, using average: ${avg.amount}`);
        return {
          predictedAmount: avg.amount,
          confidence: "Low",
          method: "Simple Average (Insufficient data)",
          historicalMonths: bills.length
        };
      }
      
      // Format bills for ML service (SAME format as getNextMonthPrediction)
      const formattedBills = bills.map(b => ({
        billingMonth: b.billingMonth,
        utilityType: b.utilityType,
        unitsUsed: b.unitsUsed || 0,
        billAmount: b.billAmount
      }));
      
      try {
        // Use "simple" method to match getNextMonthPrediction
        console.log(`Calling ML service for ${utility} with "simple" method...`);
        const mlResult = await predictBill(utility, formattedBills, "simple");
        
        if (mlResult.success) {
          console.log(`✅ ML prediction for ${utility}: Rs. ${mlResult.predictedAmount} (${mlResult.confidence} confidence)`);
          return {
            predictedAmount: Math.round(mlResult.predictedAmount),
            confidence: mlResult.confidence || "Medium",
            method: `ML - ${mlResult.method || "simple"}`,
            historicalMonths: bills.length
          };
        } else {
          throw new Error("ML prediction failed");
        }
      } catch (err) {
        console.log(`ML fallback for ${utility}:`, err.message);
        // Fallback to weighted average
        const weightedAvg = calculateWeightedAverage(bills);
        console.log(`Using weighted average for ${utility}: ${weightedAvg.amount}`);
        return {
          predictedAmount: weightedAvg.amount,
          confidence: "Low",
          method: "Weighted Average (ML unavailable)",
          historicalMonths: bills.length
        };
      }
    };
    
    const electricity = await getPredictionForUtility("Electricity", elecBills);
    const water = await getPredictionForUtility("Water", waterBills);
    
    const total = (electricity.predictedAmount || 0) + (water.predictedAmount || 0);
    const isUsingML = electricity.method.includes("ML") || water.method.includes("ML");
    
    console.log(`Final predictions - Electricity: ${electricity.predictedAmount}, Water: ${water.predictedAmount}, Total: ${total}`);
    
    res.json({
      electricity,
      water,
      month: currentMonth,
      year: currentYear,
      total: total,
      isUsingML: isUsingML
    });
    
  } catch (error) {
    console.error("ERROR in getCurrentPredictions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// 6. GET /api/predictions/forecast
// Get forecast for next month (used by Dashboard)
// ──────────────────────────────────────────────
export const getForecastPredictions = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const forecastMonth = nextMonth.toLocaleString("en-US", { month: "long" });
    const forecastYear = nextMonth.getFullYear();
    
    console.log("=== getForecastPredictions called ===");
    console.log("Forecast month:", forecastMonth, forecastYear);
    
    const elecBills = await Bill.find({ 
      user: userId, 
      utilityType: "Electricity" 
    }).sort({ billingMonth: 1 });
    
    const waterBills = await Bill.find({ 
      user: userId, 
      utilityType: "Water" 
    }).sort({ billingMonth: 1 });
    
    const getForecastForUtility = async (utility, bills) => {
      if (bills.length < 3) {
        const avg = calculateAverage(bills);
        // Add 5% projection for forecast
        return Math.round(avg.amount * 1.05);
      }
      
      try {
        const formattedBills = bills.map(b => ({
          billingMonth: b.billingMonth,
          utilityType: b.utilityType,
          unitsUsed: b.unitsUsed || 0,
          billAmount: b.billAmount
        }));
        
        const mlResult = await predictBill(utility, formattedBills, "simple");
        if (mlResult.success) {
          // Add 5% for forecast (next month after current)
          return Math.round(mlResult.predictedAmount * 1.05);
        }
      } catch (err) {
        console.log(`ML fallback for ${utility} forecast`);
      }
      
      // Fallback: weighted average + 5%
      const weightedAvg = calculateWeightedAverage(bills);
      return Math.round(weightedAvg.amount * 1.05);
    };
    
    const electricity = await getForecastForUtility("Electricity", elecBills);
    const water = await getForecastForUtility("Water", waterBills);
    
    res.json({
      electricity: {
        predictedAmount: electricity,
        confidence: "Medium",
        method: "5% Projection + ML/Weighted Average"
      },
      water: {
        predictedAmount: water,
        confidence: "Medium",
        method: "5% Projection + ML/Weighted Average"
      },
      month: forecastMonth,
      year: forecastYear,
      total: electricity + water
    });
    
  } catch (error) {
    console.error("ERROR in getForecastPredictions:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// 7. GET /api/predictions/single
// Get prediction for a specific utility and month
// ──────────────────────────────────────────────
export const getSinglePrediction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { utilityType, month, year } = req.query;
    
    console.log("=== getSinglePrediction called ===");
    console.log("utilityType:", utilityType);
    console.log("month:", month, "year:", year);
    
    if (!utilityType) {
      return res.status(400).json({ success: false, message: "utilityType is required" });
    }
    
    const bills = await Bill.find({ 
      user: userId, 
      utilityType: utilityType 
    }).sort({ billingMonth: 1 });
    
    if (bills.length < 3) {
      const avg = calculateAverage(bills);
      return res.json({
        predictedAmount: avg.amount,
        confidence: "Low",
        method: "Simple Average",
        historicalMonths: bills.length,
        warning: bills.length === 0 ? "No bill data available" : `Only ${bills.length} months of data`
      });
    }
    
    try {
      const formattedBills = bills.map(b => ({
        billingMonth: b.billingMonth,
        utilityType: b.utilityType,
        unitsUsed: b.unitsUsed || 0,
        billAmount: b.billAmount
      }));
      
      const mlResult = await predictBill(utilityType, formattedBills, "simple");
      if (mlResult.success) {
        return res.json({
          predictedAmount: Math.round(mlResult.predictedAmount),
          confidence: mlResult.confidence || "Medium",
          method: `ML - ${mlResult.method || "simple"}`,
          historicalMonths: bills.length
        });
      }
    } catch (err) {
      console.log(`ML fallback for ${utilityType}`);
    }
    
    // Fallback to weighted average
    const weightedAvg = calculateWeightedAverage(bills);
    res.json({
      predictedAmount: weightedAvg.amount,
      confidence: "Low",
      method: "Weighted Average",
      historicalMonths: bills.length
    });
    
  } catch (error) {
    console.error("ERROR in getSinglePrediction:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};