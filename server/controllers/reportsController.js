// server/controllers/reportsController.js
import Bill from "../models/Bill.js";

// Helper functions
const MONTH_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const getMonthShort = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  return new Date(year, month - 1).toLocaleString("default", { month: "short" });
};

const getMonthName = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  return new Date(year, month - 1).toLocaleString("default", { month: "long" });
};

const formatMonth = (monthStr) => {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const monthName = new Date(year, month - 1).toLocaleString("default", { month: "long" });
  return `${monthName} ${year}`;
};

const getQuarter = (monthStr) => {
  const [year, month] = monthStr.split("-");
  const monthNum = parseInt(month);
  if (monthNum <= 3) return `Q1 ${year}`;
  if (monthNum <= 6) return `Q2 ${year}`;
  if (monthNum <= 9) return `Q3 ${year}`;
  return `Q4 ${year}`;
};

// Apply filters to bills
const applyFilters = (bills, { utility, timeRange, month, quarter, year }) => {
  let filtered = [...bills];
  
  if (utility && utility !== "All") {
    filtered = filtered.filter(b => b.utilityType === utility);
  }
  
  if (timeRange === "Monthly" && month) {
    filtered = filtered.filter(b => b.billingMonth === month);
  } else if (timeRange === "Quarterly" && quarter) {
    filtered = filtered.filter(b => getQuarter(b.billingMonth) === quarter);
  } else if (timeRange === "Yearly" && year) {
    filtered = filtered.filter(b => b.billingMonth.startsWith(year));
  }
  
  return filtered;
};

// ──────────────────────────────────────────────
// 1. GET /api/reports/summary - KPI Cards
// ──────────────────────────────────────────────
export const getReportSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { utility, timeRange, month, quarter, year } = req.query;
    
    let bills = await Bill.find({ user: userId });
    bills = applyFilters(bills, { utility, timeRange, month, quarter, year });
    
    if (bills.length === 0) {
      return res.json({
        success: true,
        summary: {
          totalUnits: 0,
          totalAmount: 0,
          avgMonthlyCost: 0,
          peakExpenditure: { month: "N/A", amount: 0, utility: "N/A" }
        }
      });
    }
    
    // Total Units (exclude Internet)
    const meteredBills = bills.filter(b => b.utilityType !== "Internet");
    const totalUnits = meteredBills.reduce((sum, b) => sum + (b.unitsUsed || 0), 0);
    
    // Total Amount
    const totalAmount = bills.reduce((sum, b) => sum + b.billAmount, 0);
    
    // Avg Monthly Cost
    const uniqueMonths = [...new Set(bills.map(b => b.billingMonth))];
    const avgMonthlyCost = uniqueMonths.length > 0 ? Math.round(totalAmount / uniqueMonths.length) : 0;
    
    // Peak Expenditure
    const peak = bills.reduce((max, b) => b.billAmount > max.billAmount ? b : max, bills[0]);
    
    res.json({
      success: true,
      summary: {
        totalUnits,
        totalAmount,
        avgMonthlyCost,
        peakExpenditure: {
          month: formatMonth(peak.billingMonth),
          amount: peak.billAmount,
          utility: peak.utilityType
        }
      }
    });
  } catch (error) {
    console.error("Get report summary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────────────────────────────
// 2. GET /api/reports/consumption - Units Chart
// ──────────────────────────────────────────────
export const getConsumptionData = async (req, res) => {
  try {
    const userId = req.user.id;
    const { utility, year } = req.query;
    
    let bills = await Bill.find({ user: userId });
    
    if (year) {
      bills = bills.filter(b => b.billingMonth.startsWith(year));
    }
    if (utility && utility !== "All") {
      bills = bills.filter(b => b.utilityType === utility);
    }
    
    // Group by month (only Electricity and Water for units)
    const monthlyData = {};
    bills.forEach(bill => {
      if (bill.utilityType === "Internet") return;
      
      const monthFull = bill.billingMonth;
      const monthShort = getMonthShort(monthFull);
      
      if (!monthlyData[monthShort]) {
        monthlyData[monthShort] = { month: monthShort, Electricity: 0, Water: 0, fullMonth: monthFull };
      }
      monthlyData[monthShort][bill.utilityType] += bill.unitsUsed || 0;
    });
    
    const data = Object.values(monthlyData).sort((a, b) => {
      const aMonth = a.fullMonth.split("-")[1];
      const bMonth = b.fullMonth.split("-")[1];
      return parseInt(aMonth) - parseInt(bMonth);
    });
    
    res.json({ success: true, data });
  } catch (error) {
    console.error("Get consumption data error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────────────────────────────
// 3. GET /api/reports/expenses - Stacked Bar Chart
// ──────────────────────────────────────────────
export const getMonthlyExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const { utility, year } = req.query;
    
    let bills = await Bill.find({ user: userId });
    
    if (year) {
      bills = bills.filter(b => b.billingMonth.startsWith(year));
    }
    if (utility && utility !== "All") {
      bills = bills.filter(b => b.utilityType === utility);
    }
    
    // Group by month with separate utilities
    const monthlyData = {};
    bills.forEach(bill => {
      const monthFull = bill.billingMonth;
      const monthShort = getMonthShort(monthFull);
      
      if (!monthlyData[monthShort]) {
        monthlyData[monthShort] = { 
          month: monthShort, 
          Electricity: 0, 
          Water: 0, 
          Internet: 0,
          fullMonth: monthFull 
        };
      }
      monthlyData[monthShort][bill.utilityType] += bill.billAmount;
    });
    
    const data = Object.values(monthlyData).sort((a, b) => {
      const aMonth = a.fullMonth.split("-")[1];
      const bMonth = b.fullMonth.split("-")[1];
      return parseInt(aMonth) - parseInt(bMonth);
    });
    
    res.json({ success: true, data });
  } catch (error) {
    console.error("Get monthly expenses error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────────────────────────────
// 4. GET /api/reports/distribution - Pie Chart
// ──────────────────────────────────────────────
export const getSpendDistribution = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year } = req.query;
    
    let bills = await Bill.find({ user: userId });
    
    if (year) {
      bills = bills.filter(b => b.billingMonth.startsWith(year));
    }
    
    const distribution = {};
    bills.forEach(bill => {
      if (!distribution[bill.utilityType]) {
        distribution[bill.utilityType] = 0;
      }
      distribution[bill.utilityType] += bill.billAmount;
    });
    
    const data = Object.entries(distribution).map(([name, value]) => ({ name, value }));
    
    res.json({ success: true, data });
  } catch (error) {
    console.error("Get spend distribution error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────────────────────────────
// 5. GET /api/reports/records - Detailed Table
// ──────────────────────────────────────────────
export const getDetailedRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const { utility, timeRange, month, quarter, year, page = 1, limit = 10, sort = "desc" } = req.query;
    
    let bills = await Bill.find({ user: userId });
    bills = applyFilters(bills, { utility, timeRange, month, quarter, year });
    
    // Sort by month
    bills.sort((a, b) => {
      return sort === "desc" 
        ? b.billingMonth.localeCompare(a.billingMonth)
        : a.billingMonth.localeCompare(b.billingMonth);
    });
    
    // Calculate change percentage
    const records = bills.map((bill, index) => {
      let change = 0;
      if (index < bills.length - 1 && bills[index + 1].utilityType === bill.utilityType) {
        const prevBill = bills[index + 1];
        if (prevBill.billAmount > 0) {
          change = ((bill.billAmount - prevBill.billAmount) / prevBill.billAmount) * 100;
        }
      }
      return {
        id: bill._id,
        month: formatMonth(bill.billingMonth),
        utility: bill.utilityType,
        unitsUsed: bill.utilityType === "Internet" ? null : bill.unitsUsed,
        billAmount: bill.billAmount,
        costPerUnit: bill.utilityType !== "Internet" && bill.unitsUsed > 0 
          ? (bill.billAmount / bill.unitsUsed).toFixed(2) 
          : null,
        change: change.toFixed(1)
      };
    });
    
    // Pagination
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedRecords = records.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      records: paginatedRecords,
      pagination: {
        total: records.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(records.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Get detailed records error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────────────────────────────
// 6. GET /api/reports/insights - AI Insights
// ──────────────────────────────────────────────
export const getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year } = req.query;
    
    let bills = await Bill.find({ user: userId });
    
    if (year) {
      bills = bills.filter(b => b.billingMonth.startsWith(year));
    }
    
    const insights = [];
    
    if (bills.length < 2) {
      insights.push({
        type: "info",
        text: "Add more bills to see personalized insights about your utility usage patterns."
      });
      return res.json({ success: true, insights });
    }
    
    // Electricity trend
    const elecBills = bills.filter(b => b.utilityType === "Electricity").sort((a,b) => a.billingMonth.localeCompare(b.billingMonth));
    if (elecBills.length >= 2) {
      const lastMonth = elecBills[elecBills.length - 1];
      const prevMonth = elecBills[elecBills.length - 2];
      const change = ((lastMonth.billAmount - prevMonth.billAmount) / prevMonth.billAmount) * 100;
      
      if (Math.abs(change) > 5) {
        insights.push({
          type: change > 0 ? "warning" : "success",
          text: `Electricity ${change > 0 ? "increased" : "decreased"} by ${Math.abs(change).toFixed(1)}% compared to last month.`
        });
      }
    }
    
    // Water trend
    const waterBills = bills.filter(b => b.utilityType === "Water").sort((a,b) => a.billingMonth.localeCompare(b.billingMonth));
    if (waterBills.length >= 2) {
      const lastMonth = waterBills[waterBills.length - 1];
      const prevMonth = waterBills[waterBills.length - 2];
      const change = ((lastMonth.billAmount - prevMonth.billAmount) / prevMonth.billAmount) * 100;
      
      if (Math.abs(change) > 5) {
        insights.push({
          type: change > 0 ? "warning" : "success",
          text: `Water ${change > 0 ? "increased" : "decreased"} by ${Math.abs(change).toFixed(1)}% compared to last month.`
        });
      }
    }
    
    // Peak expenditure
    const peak = bills.reduce((max, b) => b.billAmount > max.billAmount ? b : max, bills[0]);
    insights.push({
      type: "info",
      text: `Peak expenditure was in ${formatMonth(peak.billingMonth)} at Rs. ${peak.billAmount.toLocaleString()}.`
    });
    
    // Internet plan changes
    const internetBills = bills.filter(b => b.utilityType === "Internet");
    if (internetBills.length >= 2) {
      const amounts = internetBills.map(b => b.billAmount);
      const unique = [...new Set(amounts)];
      if (unique.length > 1) {
        insights.push({
          type: "info",
          text: `Internet plan charges varied between Rs. ${Math.min(...amounts).toLocaleString()} and Rs. ${Math.max(...amounts).toLocaleString()} — a possible plan upgrade occurred.`
        });
      }
    }
    
    // Water conservation alert
    const avgWater = waterBills.reduce((s,b) => s + b.unitsUsed, 0) / (waterBills.length || 1);
    if (avgWater > 45) {
      insights.push({
        type: "warning",
        text: `Water consumption is elevated at ${Math.round(avgWater)} units average. Consider conservation measures.`
      });
    }
    
    res.json({ success: true, insights });
  } catch (error) {
    console.error("Get insights error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ──────────────────────────────────────────────
// 7. GET /api/reports/filters - Dropdown Options
// ──────────────────────────────────────────────
export const getFilterOptions = async (req, res) => {
  try {
    const userId = req.user.id;
    const bills = await Bill.find({ user: userId });
    
    // ✅ ALWAYS include all utilities, even if no bills exist
    const utilities = ["All", "Electricity", "Water", "Internet"];
    
    const months = [...new Set(bills.map(b => b.billingMonth))].sort();
    const years = [...new Set(months.map(m => m.split("-")[0]))].sort();
    
    // Generate quarters
    const quarters = [];
    months.forEach(month => {
      const q = getQuarter(month);
      if (!quarters.includes(q)) quarters.push(q);
    });
    quarters.sort();
    
    res.json({
      success: true,
      filters: {
        utilities,  // ✅ Now always includes "Internet"
        months: months.map(m => formatMonth(m)),
        quarters,
        years
      }
    });
  } catch (error) {
    console.error("Get filter options error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};