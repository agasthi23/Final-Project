// server/controllers/analyticsController.js
import Bill from "../models/Bill.js";

const MONTHS_ORDER = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const getMonthAbbr = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  return new Date(year, month - 1).toLocaleDateString("en-US", { month: "short" });
};

// ──────────────────────────────────────────────
// GET /api/analytics/stats
// Returns pre-calculated stats for the dashboard
// ──────────────────────────────────────────────
export const getAnalyticsStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { utility = "All" } = req.query;
    
    let bills = await Bill.find({ user: userId });
    
    if (utility !== "All") {
      bills = bills.filter(b => b.utilityType === utility);
    }
    
    const isFlat = utility !== "All" && utility === "Internet";
    
    const totalBills = bills.length;
    const totalAmount = bills.reduce((s, b) => s + b.billAmount, 0);
    
    const meteredRows = isFlat ? [] : bills.filter(b => b.utilityType !== "Internet");
    const totalUnits = meteredRows.reduce((s, b) => s + (b.unitsUsed || 0), 0);
    const avgUsage = meteredRows.length ? Math.round(totalUnits / meteredRows.length) : 0;
    const costPerUnit = totalUnits ? (meteredRows.reduce((s, b) => s + b.billAmount, 0) / totalUnits).toFixed(2) : "N/A";
    
    const peak = meteredRows.length
      ? meteredRows.reduce((mx, b) => (b.unitsUsed || 0) > (mx.unitsUsed || 0) ? b : mx, meteredRows[0])
      : bills.reduce((mx, b) => b.billAmount > mx.billAmount ? b : mx, bills[0] || {});
    
    // Calculate YoY change (compare last 6 months vs previous 6 months)
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);
    
    const recentBills = bills.filter(b => new Date(b.createdAt) >= sixMonthsAgo);
    const olderBills = bills.filter(b => new Date(b.createdAt) >= twelveMonthsAgo && new Date(b.createdAt) < sixMonthsAgo);
    
    const recentTotal = recentBills.reduce((s, b) => s + b.billAmount, 0);
    const olderTotal = olderBills.reduce((s, b) => s + b.billAmount, 0);
    const yoyChange = olderTotal ? Math.round(((recentTotal - olderTotal) / olderTotal) * 100) : 0;
    
    res.json({
      success: true,
      stats: {
        totalBills,
        totalUnits,
        totalAmount,
        avgUsage,
        costPerUnit,
        peakUsage: isFlat ? `Rs. ${(peak.billAmount || 0).toLocaleString()}` : (peak.unitsUsed || 0),
        peakMonth: getMonthAbbr(peak.billingMonth),
        yoyChange,
      }
    });
  } catch (error) {
    console.error("Get analytics stats error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────────────────────────────
// GET /api/analytics/monthly-usage
// Returns monthly usage data for charts
// ──────────────────────────────────────────────
export const getMonthlyUsage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { utility = "All" } = req.query;
    
    let bills = await Bill.find({ user: userId });
    
    if (utility !== "All") {
      bills = bills.filter(b => b.utilityType === utility);
    }
    
    // Group by month
    const monthlyMap = {};
    bills.forEach(bill => {
      if (bill.utilityType === "Internet") return;
      const month = getMonthAbbr(bill.billingMonth);
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, Electricity: 0, Water: 0 };
      }
      monthlyMap[month][bill.utilityType] += bill.unitsUsed || 0;
    });
    
    const data = Object.values(monthlyMap).sort((a, b) => 
      MONTHS_ORDER.indexOf(a.month) - MONTHS_ORDER.indexOf(b.month)
    );
    
    res.json({ success: true, data });
  } catch (error) {
    console.error("Get monthly usage error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────────────────────────────
// GET /api/analytics/monthly-cost
// Returns monthly cost data for charts
// ──────────────────────────────────────────────
export const getMonthlyCost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { utility = "All" } = req.query;
    
    let bills = await Bill.find({ user: userId });
    
    if (utility !== "All") {
      bills = bills.filter(b => b.utilityType === utility);
    }
    
    const monthlyMap = {};
    bills.forEach(bill => {
      const month = getMonthAbbr(bill.billingMonth);
      if (!monthlyMap[month]) {
        monthlyMap[month] = { month, Electricity: 0, Water: 0, Internet: 0 };
      }
      monthlyMap[month][bill.utilityType] += bill.billAmount;
    });
    
    const data = Object.values(monthlyMap).sort((a, b) => 
      MONTHS_ORDER.indexOf(a.month) - MONTHS_ORDER.indexOf(b.month)
    );
    
    res.json({ success: true, data });
  } catch (error) {
    console.error("Get monthly cost error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────────────────────────────
// GET /api/analytics/distribution
// Returns cost distribution by utility
// ──────────────────────────────────────────────
export const getDistribution = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bills = await Bill.find({ user: userId });
    
    const dist = {
      Electricity: 0,
      Water: 0,
      Internet: 0
    };
    
    bills.forEach(bill => {
      dist[bill.utilityType] += bill.billAmount;
    });
    
    const data = Object.entries(dist)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
    
    res.json({ success: true, data });
  } catch (error) {
    console.error("Get distribution error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────────────────────────────
// GET /api/analytics/insights
// Returns AI-generated insights
// ──────────────────────────────────────────────
export const getAnalyticsInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bills = await Bill.find({ user: userId }).sort({ billingMonth: 1 });
    
    const insights = [];
    
    if (bills.length < 2) {
      insights.push({
        type: "info",
        title: "Insufficient Data",
        text: "Add more bills to see personalized insights.",
        value: "Data collection"
      });
      return res.json({ success: true, insights });
    }
    
    // Spend trend analysis
    const recent = bills.slice(-4);
    const older = bills.slice(-8, -4);
    const rAvg = recent.reduce((s, b) => s + b.billAmount, 0) / (recent.length || 1);
    const oAvg = older.reduce((s, b) => s + b.billAmount, 0) / (older.length || 1);
    const trend = rAvg > oAvg ? "increasing" : "decreasing";
    const pct = Math.abs(Math.round(((rAvg - oAvg) / (oAvg || 1)) * 100));
    
    insights.push({
      type: trend === "increasing" ? "warning" : "success",
      title: "Spend Trend Analysis",
      text: `Total spend is ${trend} by ${pct}% vs the previous period.`,
      value: "Strategic planning needed"
    });
    
    // Cost efficiency alert
    const highCost = bills.filter(b => b.utilityType !== "Internet" && b.billAmount / b.unitsUsed > 15);
    if (highCost.length) {
      insights.push({
        type: "warning",
        title: "Cost Efficiency Alert",
        text: `${highCost.length} period(s) show elevated cost per unit (> Rs. 15). Review pricing tiers.`,
        value: "Optimisation opportunity"
      });
    }
    
    // Peak expenditure
    const peak = bills.reduce((mx, b) => b.billAmount > mx.billAmount ? b : mx, bills[0]);
    insights.push({
      type: "info",
      title: "Peak Expenditure",
      text: `Highest bill: Rs. ${peak.billAmount?.toLocaleString()} (${peak.utilityType}) in ${peak.billingMonth}.`,
      value: "Capacity planning"
    });
    
    // Water conservation alert
    const waterBills = bills.filter(b => b.utilityType === "Water");
    if (waterBills.length >= 3) {
      const avgWater = waterBills.slice(-3).reduce((s, b) => s + b.unitsUsed, 0) / 3;
      if (avgWater > 44) {
        insights.push({
          type: "warning",
          title: "Water Conservation Alert",
          text: `Avg water usage is elevated at ${Math.round(avgWater)} units. Consider conservation measures.`,
          value: "Sustainability target"
        });
      }
    }
    
    // Internet plan status
    const internetBills = bills.filter(b => b.utilityType === "Internet");
    if (internetBills.length >= 2) {
      const changed = internetBills.some((b, i) => i > 0 && b.billAmount !== internetBills[i - 1].billAmount);
      insights.push({
        type: changed ? "warning" : "success",
        title: "Internet Plan Status",
        text: changed
          ? `Internet charges varied — a possible plan upgrade detected. Latest: Rs. ${internetBills[internetBills.length - 1]?.billAmount?.toLocaleString()}.`
          : `Internet plan is stable at Rs. ${internetBills[0]?.billAmount?.toLocaleString()}/month.`,
        value: changed ? "Review plan options" : "Consistent spend"
      });
    }
    
    // Savings potential
    const elecCost = bills.filter(b => b.utilityType === "Electricity").reduce((s, b) => s + b.billAmount, 0);
    if (elecCost) {
      insights.push({
        type: "success",
        title: "Savings Potential",
        text: `Estimated Rs. ${Math.round(elecCost * 0.1).toLocaleString()} monthly savings through electricity optimisation.`,
        value: "ROI: 3–6 months"
      });
    }
    
    res.json({ success: true, insights });
  } catch (error) {
    console.error("Get analytics insights error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};