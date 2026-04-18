// server/controllers/dashboardController.js
import Bill from "../models/Bill.js";
import User from "../models/User.js";

// Helper: Get current month in YYYY-MM format
const getCurrentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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

// Helper: Calculate simple average prediction
const calculatePrediction = (bills, months = 3) => {
  if (!bills.length) return 0;
  const recent = bills.slice(-months);
  const sum = recent.reduce((s, b) => s + b.billAmount, 0);
  return Math.round(sum / recent.length);
};

const calculateUnitPrediction = (bills, months = 3) => {
  if (!bills.length) return 0;
  const recent = bills.slice(-months);
  const sum = recent.reduce((s, b) => s + (b.unitsUsed || 0), 0);
  return Math.round(sum / recent.length);
};

// Helper: Calculate percentage change
const calculatePercentChange = (current, previous) => {
  if (!previous || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

// ──────────────────────────────────────────────
// GET /api/dashboard/summary
// Returns all data needed for the dashboard
// ──────────────────────────────────────────────
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user info
    const user = await User.findById(userId).select("name salary");
    
    // Get all bills
    const allBills = await Bill.find({ user: userId }).sort({ billingMonth: 1 });
    
    const currentMonthKey = getCurrentMonthKey();
    const currentMonthName = getMonthName(currentMonthKey);
    
    // ── CURRENT MONTH BILLS ──
    const currentBills = allBills.filter(b => b.billingMonth === currentMonthKey);
    const currentWater = currentBills.find(b => b.utilityType === "Water")?.billAmount || 0;
    const currentElec = currentBills.find(b => b.utilityType === "Electricity")?.billAmount || 0;
    const currentInternet = currentBills.find(b => b.utilityType === "Internet")?.billAmount || 0;
    const currentFixedFees = 350; // Default fixed fees (can be made configurable)
    const currentTotal = currentWater + currentElec + currentInternet + currentFixedFees;
    
    const currentWaterUnits = currentBills.find(b => b.utilityType === "Water")?.unitsUsed || 0;
    const currentElecUnits = currentBills.find(b => b.utilityType === "Electricity")?.unitsUsed || 0;
    
    // ── BUDGET ──
    const budget = user.salary ? Math.round(user.salary * 0.08) : 8000; // 8% of salary or default
    const budgetPct = budget > 0 ? Math.min(100, Math.round((currentTotal / budget) * 100)) : 0;
    
    // ── PREDICTIONS (based on last 3 months) ──
    const waterBills = allBills.filter(b => b.utilityType === "Water");
    const elecBills = allBills.filter(b => b.utilityType === "Electricity");
    
    const predictedWater = calculatePrediction(waterBills, 3);
    const predictedElec = calculatePrediction(elecBills, 3);
    const predictedFixedFees = Math.round(currentFixedFees * 1.1);
    const predictedTotal = predictedWater + predictedElec + predictedFixedFees;
    
    const predictedWaterUnits = calculateUnitPrediction(waterBills, 3);
    const predictedElecUnits = calculateUnitPrediction(elecBills, 3);
    
    // Calculate percentage changes
    const waterBillChange = calculatePercentChange(predictedWater, currentWater);
    const elecBillChange = calculatePercentChange(predictedElec, currentElec);
    const waterUnitsChange = calculatePercentChange(predictedWaterUnits, currentWaterUnits);
    const elecUnitsChange = calculatePercentChange(predictedElecUnits, currentElecUnits);
    const totalChange = calculatePercentChange(predictedTotal, currentTotal);
    const fixedFeesChange = calculatePercentChange(predictedFixedFees, currentFixedFees);
    
    // ── TREND DATA (last 6 months for charts) ──
    const trendData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthShort = getShortMonth(monthKey);
      const isCurrentMonth = monthKey === currentMonthKey;
      
      const monthBills = allBills.filter(b => b.billingMonth === monthKey);
      const monthWater = monthBills.find(b => b.utilityType === "Water")?.billAmount || 0;
      const monthElec = monthBills.find(b => b.utilityType === "Electricity")?.billAmount || 0;
      const monthWaterUnits = monthBills.find(b => b.utilityType === "Water")?.unitsUsed || 0;
      const monthElecUnits = monthBills.find(b => b.utilityType === "Electricity")?.unitsUsed || 0;
      const monthTotal = monthWater + monthElec + currentFixedFees;
      
      trendData.push({
        m: isCurrentMonth ? `${monthShort}*` : monthShort,
        water: monthWaterUnits,
        elec: monthElecUnits,
        waterBill: monthWater,
        elecBill: monthElec,
        total: monthTotal,
        predicted: isCurrentMonth,
      });
    }
    
    // ── PER-UTILITY COMPARISON DATA (last 6 months) ──
    const comparisonData = trendData.map(t => ({
      m: t.m,
      waterBill: t.waterBill,
      elecBill: t.elecBill,
    }));
    
    // ── BILL DISTRIBUTION ──
    const totalAllTime = allBills.reduce((s, b) => s + b.billAmount, 0);
    const totalWater = allBills.filter(b => b.utilityType === "Water").reduce((s, b) => s + b.billAmount, 0);
    const totalElec = allBills.filter(b => b.utilityType === "Electricity").reduce((s, b) => s + b.billAmount, 0);
    const totalFixedFeesTotal = currentFixedFees * 6; // Estimate for 6 months
    
    const waterPercent = totalAllTime > 0 ? Math.round((totalWater / totalAllTime) * 100) : 28;
    const elecPercent = totalAllTime > 0 ? Math.round((totalElec / totalAllTime) * 100) : 62;
    const fixedPercent = 100 - waterPercent - elecPercent;
    
    // ── ALERTS & RECOMMENDATIONS ──
    const alerts = [];
    
    // Water usage alert
    if (waterUnitsChange > 5) {
      alerts.push({
        type: "warning",
        title: "Water Usage Rising",
        body: `Predicted ${waterUnitsChange}% increase next month. Check for dripping taps or over-irrigation.`,
        icon: "water"
      });
    }
    
    // Electricity trend
    if (elecUnitsChange < 0) {
      alerts.push({
        type: "success",
        title: "Electricity Trending Down",
        body: `${Math.abs(elecUnitsChange)}% reduction forecast. Your conservation efforts are paying off.`,
        icon: "elec"
      });
    } else if (elecUnitsChange > 0) {
      alerts.push({
        type: "warning",
        title: "Electricity Usage Increasing",
        body: `Predicted ${elecUnitsChange}% increase. Consider reducing AC usage or shifting to off-peak hours.`,
        icon: "elec"
      });
    }
    
    // Budget alert
    if (budgetPct >= 100) {
      alerts.push({
        type: "danger",
        title: "Budget Exceeded",
        body: `You've used ${budgetPct}% of your Rs.${budget.toLocaleString()} budget. Consider reducing usage.`,
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
        user: {
          name: user.name,
        },
        currentMonth: currentMonthName,
        current: {
          water: currentWaterUnits,
          elec: currentElecUnits,
          waterBill: currentWater,
          elecBill: currentElec,
          fixedFees: currentFixedFees,
          total: currentTotal,
          budget: budget,
          budgetPct: budgetPct,
        },
        predictions: {
          water: predictedWaterUnits,
          elec: predictedElecUnits,
          waterBill: predictedWater,
          elecBill: predictedElec,
          fixedFees: predictedFixedFees,
          total: predictedTotal,
          waterBillChange: waterBillChange,
          elecBillChange: elecBillChange,
          waterUnitsChange: waterUnitsChange,
          elecUnitsChange: elecUnitsChange,
          totalChange: totalChange,
          fixedFeesChange: fixedFeesChange,
        },
        trends: trendData,
        comparison: comparisonData,
        distribution: {
          electricity: elecPercent,
          water: waterPercent,
          fixedFees: fixedPercent,
        },
        alerts: alerts,
        hasData: allBills.length > 0,
      }
    });
    
  } catch (error) {
    console.error("Get dashboard summary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────────────────────────────
// GET /api/dashboard/trends
// Returns trend data for charts
// ──────────────────────────────────────────────
export const getDashboardTrends = async (req, res) => {
  try {
    const userId = req.user.id;
    const allBills = await Bill.find({ user: userId }).sort({ billingMonth: 1 });
    
    const currentMonthKey = getCurrentMonthKey();
    const currentFixedFees = 350;
    const trendData = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthShort = getShortMonth(monthKey);
      const isCurrentMonth = monthKey === currentMonthKey;
      
      const monthBills = allBills.filter(b => b.billingMonth === monthKey);
      const monthWater = monthBills.find(b => b.utilityType === "Water")?.billAmount || 0;
      const monthElec = monthBills.find(b => b.utilityType === "Electricity")?.billAmount || 0;
      const monthTotal = monthWater + monthElec + currentFixedFees;
      
      trendData.push({
        month: isCurrentMonth ? `${monthShort}*` : monthShort,
        total: monthTotal,
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
// Returns alerts and recommendations
// ──────────────────────────────────────────────
export const getDashboardAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("salary");
    const allBills = await Bill.find({ user: userId });
    
    const currentMonthKey = getCurrentMonthKey();
    const currentBills = allBills.filter(b => b.billingMonth === currentMonthKey);
    const currentTotal = currentBills.reduce((s, b) => s + b.billAmount, 0);
    const budget = user.salary ? Math.round(user.salary * 0.08) : 8000;
    const budgetPct = budget > 0 ? Math.min(100, Math.round((currentTotal / budget) * 100)) : 0;
    
    // Calculate trends
    const waterBills = allBills.filter(b => b.utilityType === "Water").sort((a,b) => a.billingMonth.localeCompare(b.billingMonth));
    const elecBills = allBills.filter(b => b.utilityType === "Electricity").sort((a,b) => a.billingMonth.localeCompare(b.billingMonth));
    
    const predictedWater = calculatePrediction(waterBills, 3);
    const currentWater = waterBills.length ? waterBills[waterBills.length - 1]?.billAmount || 0 : 0;
    const waterChange = calculatePercentChange(predictedWater, currentWater);
    
    const predictedElec = calculatePrediction(elecBills, 3);
    const currentElec = elecBills.length ? elecBills[elecBills.length - 1]?.billAmount || 0 : 0;
    const elecChange = calculatePercentChange(predictedElec, currentElec);
    
    const alerts = [];
    
    if (waterChange > 5) {
      alerts.push({
        type: "warning",
        title: "Water Usage Rising",
        body: `Predicted ${waterChange}% increase next month. Check for dripping taps or over-irrigation.`,
      });
    }
    
    if (elecChange < -5) {
      alerts.push({
        type: "success",
        title: "Electricity Trending Down",
        body: `${Math.abs(elecChange)}% reduction forecast. Your conservation efforts are paying off.`,
      });
    } else if (elecChange > 5) {
      alerts.push({
        type: "warning",
        title: "Electricity Usage Increasing",
        body: `Predicted ${elecChange}% increase. Consider reducing AC usage.`,
      });
    }
    
    if (budgetPct >= 100) {
      alerts.push({
        type: "danger",
        title: "Budget Exceeded",
        body: `You've used ${budgetPct}% of your Rs.${budget.toLocaleString()} budget.`,
      });
    } else if (budgetPct >= 85) {
      alerts.push({
        type: "warning",
        title: "Approaching Budget Limit",
        body: `You've used ${budgetPct}% of your Rs.${budget.toLocaleString()} budget.`,
      });
    } else {
      alerts.push({
        type: "success",
        title: "Budget on Track",
        body: `You've used ${budgetPct}% of your Rs.${budget.toLocaleString()} budget.`,
      });
    }
    
    res.json({ success: true, alerts });
    
  } catch (error) {
    console.error("Get dashboard alerts error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};