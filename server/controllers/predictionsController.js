// server/controllers/predictionsController.js
import Bill from "../models/Bill.js";

// Helper functions
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const formatChartMonth = (monthStr) => {
  if (!monthStr) return "";
  try {
    const [month, year] = monthStr.split(" ");
    return `${month.slice(0,3)} '${year.slice(2)}`;
  } catch (e) {
    return monthStr;
  }
};

const getNextMonth = (currentMonth) => {
  if (!currentMonth) return "Next Month";
  try {
    const [month, year] = currentMonth.split(" ");
    const idx = months.indexOf(month);
    const nextIdx = (idx + 1) % 12;
    const nextYear = nextIdx === 0 ? parseInt(year) + 1 : parseInt(year);
    return `${months[nextIdx]} ${nextYear}`;
  } catch (e) {
    return "Next Month";
  }
};

// Prediction methods
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

// ──────────────────────────────────────────────
// 1. GET /api/predictions/next-month
// ──────────────────────────────────────────────
export const getNextMonthPrediction = async (req, res) => {
  try {
    const userId = req.user.id;
    const { utility = "Electricity", method = "average" } = req.query;
    
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
    
    // Calculate prediction
    const prediction = calculateAverage(bills);
    const lastBill = bills[bills.length - 1];
    const amountChange = Math.round(((prediction.amount - lastBill.billAmount) / lastBill.billAmount) * 100);
    const confidence = bills.length < 3 ? "Low" : bills.length < 6 ? "Medium" : "High";
    const nextMonth = getNextMonth(lastBill.billingMonth);
    const isFlat = utility === "Internet";
    
    res.json({
      success: true,
      predictions: {
        predictedUnits: isFlat ? 0 : prediction.units,
        predictedAmount: prediction.amount,
        amountChange: amountChange,
        percentChange: amountChange,
        currentUnits: isFlat ? 0 : lastBill.unitsUsed || 0,
        currentAmount: lastBill.billAmount,
        confidence: confidence,
        explanation: `Based on average of ${bills.length} months.`,
        method: "Simple Average",
        nextMonth: nextMonth,
        dataPoints: bills.length
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
    
    // Prepare chart data
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
          highestBill: { amount: highestBill.billAmount, month: highestBill.billingMonth },
          lowestBill: { amount: lowestBill.billAmount, month: lowestBill.billingMonth },
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
    
    const elecPrediction = calculateAverage(elecBills);
    const waterPrediction = calculateAverage(waterBills);
    
    const lastElec = elecBills[0];
    const lastWater = waterBills[0];
    
    res.json({
      success: true,
      summary: {
        electricity: {
          predicted: elecPrediction.amount,
          current: lastElec?.billAmount || 0
        },
        water: {
          predicted: waterPrediction.amount,
          current: lastWater?.billAmount || 0
        },
        total: elecPrediction.amount + waterPrediction.amount,
        nextMonth: getNextMonth(lastElec?.billingMonth)
      }
    });
    
  } catch (error) {
    console.error("ERROR in getPredictionSummary:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};