// src/pages/Analytics.jsx
import { useState, useMemo } from "react"; 
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./Analytics.css";

const Analytics = () => {
  // CORRECTED: We only keep the 'billsData' variable and ignore the setter function.
  const [billsData] = useState([
    { id: 1, utilityType: "Electricity", billingMonth: "June 2025", unitsUsed: 320, billAmount: 2750 },
    { id: 2, utilityType: "Water", billingMonth: "June 2025", unitsUsed: 22, billAmount: 880 },
    { id: 3, utilityType: "Electricity", billingMonth: "July 2025", unitsUsed: 345, billAmount: 2950 },
    { id: 4, utilityType: "Water", billingMonth: "July 2025", unitsUsed: 24, billAmount: 960 },
    { id: 5, utilityType: "Electricity", billingMonth: "August 2025", unitsUsed: 380, billAmount: 3250 },
    { id: 6, utilityType: "Water", billingMonth: "August 2025", unitsUsed: 26, billAmount: 1040 },
    { id: 7, utilityType: "Electricity", billingMonth: "September 2025", unitsUsed: 350, billAmount: 3000 },
    { id: 8, utilityType: "Water", billingMonth: "September 2025", unitsUsed: 23, billAmount: 920 },
    { id: 9, utilityType: "Electricity", billingMonth: "October 2025", unitsUsed: 330, billAmount: 2820 },
    { id: 10, utilityType: "Water", billingMonth: "October 2025", unitsUsed: 21, billAmount: 840 },
    { id: 11, utilityType: "Electricity", billingMonth: "November 2025", unitsUsed: 310, billAmount: 2650 },
    { id: 12, utilityType: "Water", billingMonth: "November 2025", unitsUsed: 20, billAmount: 800 },
  ]);


  const [filter, setFilter] = useState("All"); // All, Electricity, Water

  // Filter data based on selected utility type
  const filteredData = useMemo(() => {
    if (filter === "All") return billsData;
    return billsData.filter(bill => bill.utilityType === filter);
  }, [billsData, filter]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalBills = filteredData.length;
    const totalUnits = filteredData.reduce((sum, bill) => sum + bill.unitsUsed, 0);
    const totalAmount = filteredData.reduce((sum, bill) => sum + bill.billAmount, 0);
    const avgUsage = totalBills > 0 ? Math.round(totalUnits / totalBills) : 0;

    return {
      totalBills,
      totalUnits,
      totalAmount,
      avgUsage
    };
  }, [filteredData]);

  // Process data for monthly usage chart
  const monthlyUsageData = useMemo(() => {
    const groupedData = {};
    
    billsData.forEach(bill => {
      if (!groupedData[bill.billingMonth]) {
        groupedData[bill.billingMonth] = { month: bill.billingMonth };
      }
      
      if (filter === "All" || filter === bill.utilityType) {
        groupedData[bill.billingMonth][bill.utilityType] = bill.unitsUsed;
      }
    });
    
    return Object.values(groupedData).sort((a, b) => {
      // Sort by month
      const months = ["June", "July", "August", "September", "October", "November"];
      return months.indexOf(a.month.split(" ")[0]) - months.indexOf(b.month.split(" ")[0]);
    });
  }, [billsData, filter]);

  // Process data for monthly cost chart
  const monthlyCostData = useMemo(() => {
    const groupedData = {};
    
    billsData.forEach(bill => {
      if (!groupedData[bill.billingMonth]) {
        groupedData[bill.billingMonth] = { month: bill.billingMonth, cost: 0 };
      }
      
      if (filter === "All" || filter === bill.utilityType) {
        groupedData[bill.billingMonth].cost += bill.billAmount;
      }
    });
    
    return Object.values(groupedData).sort((a, b) => {
      // Sort by month
      const months = ["June", "July", "August", "September", "October", "November"];
      return months.indexOf(a.month.split(" ")[0]) - months.indexOf(b.month.split(" ")[0]);
    });
  }, [billsData, filter]);

  // Process data for utility distribution pie chart
  const distributionData = useMemo(() => {
    if (filter !== "All") return [];
    
    const electricityUnits = billsData
      .filter(bill => bill.utilityType === "Electricity")
      .reduce((sum, bill) => sum + bill.unitsUsed, 0);
    
    const waterUnits = billsData
      .filter(bill => bill.utilityType === "Water")
      .reduce((sum, bill) => sum + bill.unitsUsed, 0);
    
    return [
      { name: "Electricity", value: electricityUnits, color: "#2563EB" },
      { name: "Water", value: waterUnits, color: "#10b981" }
    ];
  }, [billsData, filter]);

  // Generate insights based on data
  const insights = useMemo(() => {
    const insights = [];
    
    if (billsData.length > 0) {
      // Find highest electricity usage month
      const electricityBills = billsData.filter(bill => bill.utilityType === "Electricity");
      if (electricityBills.length > 0) {
        const highestElectricity = electricityBills.reduce((max, bill) => 
          bill.unitsUsed > max.unitsUsed ? bill : max, electricityBills[0]);
        insights.push({
          type: "info",
          text: `Highest electricity usage was in ${highestElectricity.billingMonth} with ${highestElectricity.unitsUsed} kWh`
        });
      }
      
      // Find water usage trend
      const waterBills = billsData.filter(bill => bill.utilityType === "Water");
      if (waterBills.length >= 2) {
        const latestWaterBill = waterBills[waterBills.length - 1];
        const previousWaterBill = waterBills[waterBills.length - 2];
        const percentChange = Math.round(((latestWaterBill.unitsUsed - previousWaterBill.unitsUsed) / previousWaterBill.unitsUsed) * 100);
        
        if (percentChange > 0) {
          insights.push({
            type: "warning",
            text: `Water usage increased by ${percentChange}% compared to last month`
          });
        } else {
          insights.push({
            type: "success",
            text: `Water usage decreased by ${Math.abs(percentChange)}% compared to last month`
          });
        }
      }
      
      // Calculate average electricity consumption
      if (electricityBills.length > 0) {
        const avgElectricity = Math.round(
          electricityBills.reduce((sum, bill) => sum + bill.unitsUsed, 0) / electricityBills.length
        );
        insights.push({
          type: "info",
          text: `Average monthly electricity consumption is ${avgElectricity} kWh`
        });
      }
    }
    
    return insights;
  }, [billsData]);

  return (
    <div className="analytics-container">
      {/* Header */}
      <div className="analytics-header">
        <h1>Analytics</h1>
        <p>Analyze your utility consumption patterns and trends</p>
      </div>

      {/* Utility Filter */}
      <div className="filter-container">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === "All" ? "active" : ""}`}
            onClick={() => setFilter("All")}
          >
            All Utilities
          </button>
          <button 
            className={`filter-btn ${filter === "Electricity" ? "active" : ""}`}
            onClick={() => setFilter("Electricity")}
          >
            <span className="icon">⚡</span> Electricity
          </button>
          <button 
            className={`filter-btn ${filter === "Water" ? "active" : ""}`}
            onClick={() => setFilter("Water")}
          >
            <span className="icon">💧</span> Water
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">📊</div>
          <div className="card-content">
            <h3>Total Bills Added</h3>
            <p className="card-value">{summaryStats.totalBills}</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">⚡</div>
          <div className="card-content">
            <h3>Total Units Consumed</h3>
            <p className="card-value">{summaryStats.totalUnits} {filter === "Water" ? "kL" : "kWh"}</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Total Amount Spent</h3>
            <p className="card-value">LKR {summaryStats.totalAmount.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Average Monthly Usage</h3>
            <p className="card-value">{summaryStats.avgUsage} {filter === "Water" ? "kL" : "kWh"}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-container">
        {/* Monthly Usage Line Chart */}
        <div className="chart-card">
          <h3>Monthly Usage Trend</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                {(filter === "All" || filter === "Electricity") && (
                  <Line type="monotone" dataKey="Electricity" stroke="#2563EB" strokeWidth={2} />
                )}
                {(filter === "All" || filter === "Water") && (
                  <Line type="monotone" dataKey="Water" stroke="#10b981" strokeWidth={2} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Cost Bar Chart */}
        <div className="chart-card">
          <h3>Monthly Cost Comparison</h3>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyCostData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`LKR ${value}`, "Cost"]} />
                <Bar dataKey="cost" fill="#2563EB" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Utility Distribution Pie Chart */}
        {filter === "All" && (
          <div className="chart-card">
            <h3>Utility Distribution</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} units`, "Consumption"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Insights Section */}
      <div className="insights-container">
        <h3>Insights & Recommendations</h3>
        <div className="insights-list">
          {insights.map((insight, index) => (
            <div key={index} className={`insight-item ${insight.type}`}>
              {insight.type === "warning" && <span className="insight-icon">⚠️</span>}
              {insight.type === "success" && <span className="insight-icon">✅</span>}
              {insight.type === "info" && <span className="insight-icon">ℹ️</span>}
              <p>{insight.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;