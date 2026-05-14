// server/controllers/dashboardController.js
import Bill from "../models/Bill.js";
import User from "../models/User.js";
import { predictBill } from "../services/mlService.js";

// Helper: Get month in YYYY-MM format
const getMonthKey = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

// Helper: Get previous month
const getPreviousMonth = (currentMonthKey) => {
  const [year, month] = currentMonthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 2, 1);
  return getMonthKey(date);
};

// Helper: Get next month
const getNextMonthKey = (currentMonthKey) => {
  const [year, month] = currentMonthKey.split("-");
  const date = new Date(parseInt(year), parseInt(month), 1);
  return getMonthKey(date);
};

// Helper: Get month name for display
const getMonthName = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  return new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

// Helper: Get short month name for charts
const getShortMonth = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  return new Date(year, month - 1).toLocaleDateString("en-US", { month: "short" });
};

// Helper: Calculate percentage change
const calculatePercentChange = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

// ──────────────────────────────────────────────
// GET /api/dashboard/summary
// ──────────────────────────────────────────────
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // ✅ Get user info INCLUDING householdFeatures
    const user = await User.findById(userId).select("name salary budgetMode fixedBudget householdFeatures");
    const householdFeatures = user?.householdFeatures || {};
    console.log("🏠 Dashboard HF:", JSON.stringify(householdFeatures, null, 2));
    
    // Get all bills
    const allBills = await Bill.find({ user: userId }).sort({ billingMonth: 1 });
    
    const today = new Date();
    const currentMonthKey = getMonthKey(today);
    const previousMonthKey = getPreviousMonth(currentMonthKey);
    const nextMonthKey = getNextMonthKey(currentMonthKey);
    
    const currentMonthName = getMonthName(currentMonthKey);
    let previousMonthName = getMonthName(previousMonthKey);
    const nextMonthName = getMonthName(nextMonthKey);
    
    // ── PREVIOUS MONTH BILLS (Water, Electricity, Internet) ──
    const lastWaterBill = [...allBills].reverse().find(b => b.utilityType === "Water");
    const lastElecBill = [...allBills].reverse().find(b => b.utilityType === "Electricity");
    const lastInternetBill = [...allBills].reverse().find(b => b.utilityType === "Internet");
    const latestBill = [...allBills].reverse()[0];
    const actualPreviousMonthKey = latestBill?.billingMonth || previousMonthKey;
    previousMonthName = getMonthName(actualPreviousMonthKey);

    const previousWater      = lastWaterBill?.billAmount  || 0;
    const previousElec       = lastElecBill?.billAmount   || 0;
    const previousInternet   = lastInternetBill?.billAmount || 0;
    const previousWaterUnits = lastWaterBill?.unitsUsed   || 0;
    const previousElecUnits  = lastElecBill?.unitsUsed    || 0;
    const previousTotal      = previousWater + previousElec + previousInternet;
    
    // ── BUDGET — calculate based on budget mode ──
    const salaryAmount = user.salary || 0;
    const budgetMode   = user.budgetMode || "salary";
    const fixedBudgetValue = user.fixedBudget || 0;
    const budget = budgetMode === "fixed"
      ? fixedBudgetValue
      : salaryAmount > 0 ? Math.round(salaryAmount * 0.08) : 0;
    
    // ── ML PREDICTIONS for CURRENT MONTH (Water, Electricity, Internet) ──
    const waterBills = allBills.filter(b => b.utilityType === "Water").map(b => ({
      billingMonth: b.billingMonth,
      utilityType: b.utilityType,
      unitsUsed: b.unitsUsed || 0,
      billAmount: b.billAmount
    }));
    
    const elecBills = allBills.filter(b => b.utilityType === "Electricity").map(b => ({
      billingMonth: b.billingMonth,
      utilityType: b.utilityType,
      unitsUsed: b.unitsUsed || 0,
      billAmount: b.billAmount
    }));
    
    const internetBills = allBills.filter(b => b.utilityType === "Internet").map(b => ({
      billingMonth: b.billingMonth,
      utilityType: b.utilityType,
      unitsUsed: b.unitsUsed || 0,
      billAmount: b.billAmount
    }));
    
    let predictedWater = 0, predictedElec = 0, predictedInternet = 0;
    let predictedWaterUnits = 0, predictedElecUnits = 0;
    let mlConfidence = "Low";
    
    try {
      if (waterBills.length >= 3) {
        // ✅ Pass householdFeatures
        const waterResult = await predictBill("Water", waterBills, "simple", householdFeatures);
        if (waterResult.success) {
          predictedWater = waterResult.predictedAmount;
          predictedWaterUnits = waterResult.predictedUnits;
          mlConfidence = waterResult.confidence;
        }
      }
      if (elecBills.length >= 3) {
        // ✅ Pass householdFeatures
        const elecResult = await predictBill("Electricity", elecBills, "simple", householdFeatures);
        if (elecResult.success) {
          predictedElec = elecResult.predictedAmount;
          predictedElecUnits = elecResult.predictedUnits;
          mlConfidence = elecResult.confidence;
        }
      }
      if (internetBills.length >= 3) {
        // ✅ Pass householdFeatures
        const internetResult = await predictBill("Internet", internetBills, "simple", householdFeatures);
        if (internetResult.success) {
          predictedInternet = internetResult.predictedAmount;
          mlConfidence = internetResult.confidence;
        }
      }
    } catch (mlError) {
      console.error("ML service error:", mlError.message);
    }
    
    const predictedTotal = predictedWater + predictedElec + predictedInternet;
    const budgetPct = budget > 0 ? Math.min(100, Math.round((predictedTotal / budget) * 100)) : 0;
    
    // ── PREDICTIONS for NEXT MONTH (simple projection) ──
    const nextMonthWater = Math.round(predictedWater * 1.05);
    const nextMonthElec = Math.round(predictedElec * 1.03);
    const nextMonthInternet = Math.round(predictedInternet * 1.02);
    const nextMonthWaterUnits = Math.round(predictedWaterUnits * 1.05);
    const nextMonthElecUnits = Math.round(predictedElecUnits * 1.03);
    const nextMonthTotal = nextMonthWater + nextMonthElec + nextMonthInternet;
    
    // ── TREND DATA (last 6 months for charts) ──
    const trendData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = getMonthKey(date);
      const monthShort = getShortMonth(monthKey);
      const isCurrentMonth = monthKey === currentMonthKey;
      
      const monthBills = allBills.filter(b => b.billingMonth === monthKey);
      const monthWater = monthBills.find(b => b.utilityType === "Water")?.billAmount || 0;
      const monthElec = monthBills.find(b => b.utilityType === "Electricity")?.billAmount || 0;
      const monthWaterUnits = monthBills.find(b => b.utilityType === "Water")?.unitsUsed || 0;
      const monthElecUnits = monthBills.find(b => b.utilityType === "Electricity")?.unitsUsed || 0;
      
      trendData.push({
        m: isCurrentMonth ? `${monthShort}*` : monthShort,
        water: monthWaterUnits,
        elec: monthElecUnits,
        waterBill: monthWater,
        elecBill: monthElec,
        total: monthWater + monthElec,
      });
    }
    
    // ── PER-UTILITY COMPARISON DATA ──
    const comparisonData = trendData.map(t => ({
      m: t.m,
      waterBill: t.waterBill,
      elecBill: t.elecBill,
    }));
    
    // ── BILL DISTRIBUTION (including Internet) ──
    const totalWater = allBills.filter(b => b.utilityType === "Water").reduce((s, b) => s + b.billAmount, 0);
    const totalElec = allBills.filter(b => b.utilityType === "Electricity").reduce((s, b) => s + b.billAmount, 0);
    const totalInternet = allBills.filter(b => b.utilityType === "Internet").reduce((s, b) => s + b.billAmount, 0);
    const totalAll = totalWater + totalElec + totalInternet;
    const waterPercent = totalAll > 0 ? Math.round((totalWater / totalAll) * 100) : 35;
    const elecPercent = totalAll > 0 ? Math.round((totalElec / totalAll) * 100) : 65;
    const internetPercent = totalAll > 0 ? Math.round((totalInternet / totalAll) * 100) : 0;
    
    // ── ALERTS (including Internet changes) ──
    const alerts = [];
    const waterChange = calculatePercentChange(predictedWater, previousWater);
    const elecChange = calculatePercentChange(predictedElec, previousElec);
    const internetChange = calculatePercentChange(predictedInternet, previousInternet);
    
    if (waterChange > 10) {
      alerts.push({
        type: "warning",
        title: "Water Usage Rising",
        body: `Predicted ${waterChange}% increase this month. Check for leaks.`,
        icon: "water"
      });
    }
    
    if (elecChange < -5) {
      alerts.push({
        type: "success",
        title: "Electricity Trending Down",
        body: `${Math.abs(elecChange)}% reduction forecast. Great job!`,
        icon: "elec"
      });
    } else if (elecChange > 10) {
      alerts.push({
        type: "warning",
        title: "Electricity Usage Increasing",
        body: `Predicted ${elecChange}% increase. Consider reducing usage.`,
        icon: "elec"
      });
    }
    
    if (internetChange > 10) {
      alerts.push({
        type: "warning",
        title: "Internet Bill Changed",
        body: `Your internet bill ${internetChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(internetChange)}%.`,
        icon: "internet"
      });
    }
    
    if (budgetPct >= 100) {
      alerts.push({
        type: "danger",
        title: "Budget Exceeded",
        body: `You've used ${budgetPct}% of your Rs.${budget.toLocaleString()} budget.`,
        icon: "budget"
      });
    } else if (budgetPct >= 85) {
      alerts.push({
        type: "warning",
        title: "Approaching Budget Limit",
        body: `You've used ${budgetPct}% of your Rs.${budget.toLocaleString()} budget.`,
        icon: "budget"
      });
    } else {
      alerts.push({
        type: "success",
        title: "Budget on Track",
        body: `You've used ${budgetPct}% of your Rs.${budget.toLocaleString()} budget.`,
        icon: "budget"
      });
    }
    
    res.json({
      success: true,
      data: {
        user: { name: user.name },
        salary: salaryAmount,
        budgetMode: budgetMode,
        fixedBudget: fixedBudgetValue,
        currentMonth: currentMonthName,
        previousMonth: previousMonthName,
        nextMonthLabel: nextMonthName,
        previous: {
          water: previousWaterUnits,
          elec: previousElecUnits,
          waterBill: previousWater,
          elecBill: previousElec,
          internetBill: previousInternet,
          total: previousTotal,
        },
        predictions: {
          water: Math.round(predictedWaterUnits),
          elec: Math.round(predictedElecUnits),
          waterBill: Math.round(predictedWater),
          elecBill: Math.round(predictedElec),
          internetBill: Math.round(predictedInternet),
          total: Math.round(predictedTotal),
          waterChange: waterChange,
          elecChange: elecChange,
          internetChange: internetChange,
          totalChange: calculatePercentChange(predictedTotal, previousTotal),
          confidence: mlConfidence,
        },
        nextMonth: {
          water: nextMonthWaterUnits,
          elec: nextMonthElecUnits,
          waterBill: nextMonthWater,
          elecBill: nextMonthElec,
          internetBill: nextMonthInternet,
          total: nextMonthTotal,
        },
        budget: {
          amount: budget,
          used: Math.round(predictedTotal),
          percent: budgetPct,
        },
        trends: trendData,
        comparison: comparisonData,
        distribution: {
          electricity: elecPercent,
          water: waterPercent,
          internet: internetPercent,
        },
        alerts: alerts,
      }
    });
    
  } catch (error) {
    console.error("Get dashboard summary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────────────────────────────
// GET /api/dashboard/trends
// ──────────────────────────────────────────────
export const getDashboardTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const allBills = await Bill.find({ user: userId }).sort({ billingMonth: 1 });
    const today = new Date();
    const trendData = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = getMonthKey(date);
      const monthShort = getShortMonth(monthKey);
      const isCurrentMonth = monthKey === getMonthKey(today);
      
      const monthBills = allBills.filter(b => b.billingMonth === monthKey);
      const monthWater = monthBills.find(b => b.utilityType === "Water")?.billAmount || 0;
      const monthElec = monthBills.find(b => b.utilityType === "Electricity")?.billAmount || 0;
      
      trendData.push({
        month: isCurrentMonth ? `${monthShort}*` : monthShort,
        total: monthWater + monthElec,
        water: monthWater,
        electricity: monthElec,
      });
    }
    
    res.json({ success: true, trends: trendData });
    
  } catch (error) {
    console.error("Get dashboard trends error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────────────────────────────
// GET /api/dashboard/alerts
// ──────────────────────────────────────────────
export const getDashboardAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("salary householdFeatures");
    const householdFeatures = user?.householdFeatures || {};
    const allBills = await Bill.find({ user: userId });
    
    const today = new Date();
    const currentMonthKey = getMonthKey(today);
    const previousMonthKey = getPreviousMonth(currentMonthKey);
    
    const previousBills = allBills.filter(b => b.billingMonth === previousMonthKey);
    const previousTotal = previousBills.reduce((s, b) => s + b.billAmount, 0);
    const budget = user.salary ? Math.round(user.salary * 0.08) : 8000;
    
    const waterBills = allBills.filter(b => b.utilityType === "Water").map(b => ({
      billingMonth: b.billingMonth,
      utilityType: b.utilityType,
      unitsUsed: b.unitsUsed || 0,
      billAmount: b.billAmount
    }));
    const elecBills = allBills.filter(b => b.utilityType === "Electricity").map(b => ({
      billingMonth: b.billingMonth,
      utilityType: b.utilityType,
      unitsUsed: b.unitsUsed || 0,
      billAmount: b.billAmount
    }));
    
    let predictedTotal = 0;
    try {
      if (waterBills.length >= 3) {
        const waterResult = await predictBill("Water", waterBills, "simple", householdFeatures);
        if (waterResult.success) predictedTotal += waterResult.predictedAmount;
      }
      if (elecBills.length >= 3) {
        const elecResult = await predictBill("Electricity", elecBills, "simple", householdFeatures);
        if (elecResult.success) predictedTotal += elecResult.predictedAmount;
      }
    } catch (mlError) {
      console.error("ML error:", mlError.message);
    }
    
    const budgetPct = budget > 0 ? Math.min(100, Math.round((predictedTotal / budget) * 100)) : 0;
    const alerts = [];
    
    if (budgetPct >= 100) {
      alerts.push({ type: "danger", title: "Budget Exceeded", body: `You've used ${budgetPct}% of your budget.` });
    } else if (budgetPct >= 85) {
      alerts.push({ type: "warning", title: "Approaching Budget Limit", body: `You've used ${budgetPct}% of your budget.` });
    } else {
      alerts.push({ type: "success", title: "Budget on Track", body: `You've used ${budgetPct}% of your budget.` });
    }
    
    res.json({ success: true, alerts });
    
  } catch (error) {
    console.error("Get dashboard alerts error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};