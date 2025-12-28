// src/pages/Prediction.jsx
import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import "./Prediction.css";

const Prediction = () => {
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

  const [selectedUtility, setSelectedUtility] = useState("Electricity"); // Electricity or Water
  const [predictionMethod, setPredictionMethod] = useState("average"); // average, weighted, trend

  // Filter data based on selected utility type
  const filteredData = useMemo(() => {
    return billsData.filter(bill => bill.utilityType === selectedUtility);
  }, [billsData, selectedUtility]);

  // Calculate predictions
  const prediction = useMemo(() => {
    if (filteredData.length < 1) {
      return {
        predictedUnits: 0,
        predictedAmount: 0,
        percentChange: 0,
        confidence: "Low",
        explanation: "Not enough data to generate prediction"
      };
    }

    let predictedUnits, predictedAmount;
    
    if (predictionMethod === "average") {
      // Simple average of all months
      const totalUnits = filteredData.reduce((sum, bill) => sum + bill.unitsUsed, 0);
      const totalAmount = filteredData.reduce((sum, bill) => sum + bill.billAmount, 0);
      predictedUnits = Math.round(totalUnits / filteredData.length);
      predictedAmount = Math.round(totalAmount / filteredData.length);
    } 
    else if (predictionMethod === "weighted") {
      // Weighted average (recent months have higher weight)
      let weightedUnitsSum = 0;
      let weightedAmountSum = 0;
      let weightSum = 0;
      
      filteredData.forEach((bill, index) => {
        const weight = index + 1; // More recent bills have higher weight
        weightedUnitsSum += bill.unitsUsed * weight;
        weightedAmountSum += bill.billAmount * weight;
        weightSum += weight;
      });
      
      predictedUnits = Math.round(weightedUnitsSum / weightSum);
      predictedAmount = Math.round(weightedAmountSum / weightSum);
    } 
    else if (predictionMethod === "trend") {
      // Linear trend extrapolation
      if (filteredData.length < 2) {
        // Fallback to average if not enough data points
        const totalUnits = filteredData.reduce((sum, bill) => sum + bill.unitsUsed, 0);
        const totalAmount = filteredData.reduce((sum, bill) => sum + bill.billAmount, 0);
        predictedUnits = Math.round(totalUnits / filteredData.length);
        predictedAmount = Math.round(totalAmount / filteredData.length);
      } else {
        // Calculate linear trend
        const n = filteredData.length;
        const xValues = Array.from({ length: n }, (_, i) => i);
        const yUnitsValues = filteredData.map(bill => bill.unitsUsed);
        const yAmountValues = filteredData.map(bill => bill.billAmount);
        
        // Calculate slope and intercept for units
        const xSum = xValues.reduce((sum, x) => sum + x, 0);
        const yUnitsSum = yUnitsValues.reduce((sum, y) => sum + y, 0);
        const xyUnitsSum = xValues.reduce((sum, x, i) => sum + x * yUnitsValues[i], 0);
        const x2Sum = xValues.reduce((sum, x) => sum + x * x, 0);
        
        const slopeUnits = (n * xyUnitsSum - xSum * yUnitsSum) / (n * x2Sum - xSum * xSum);
        const interceptUnits = (yUnitsSum - slopeUnits * xSum) / n;
        
        // Predict next month (x = n)
        predictedUnits = Math.round(slopeUnits * n + interceptUnits);
        
        // Calculate slope and intercept for amount
        const yAmountSum = yAmountValues.reduce((sum, y) => sum + y, 0);
        const xyAmountSum = xValues.reduce((sum, x, i) => sum + x * yAmountValues[i], 0);
        
        const slopeAmount = (n * xyAmountSum - xSum * yAmountSum) / (n * x2Sum - xSum * xSum);
        const interceptAmount = (yAmountSum - slopeAmount * xSum) / n;
        
        // Predict next month (x = n)
        predictedAmount = Math.round(slopeAmount * n + interceptAmount);
      }
    }
    
    // Calculate percent change from last month
    const lastMonth = filteredData[filteredData.length - 1];
    const percentChange = lastMonth ? 
      Math.round(((predictedUnits - lastMonth.unitsUsed) / lastMonth.unitsUsed) * 100) : 0;
    
    // Determine confidence level
    let confidence;
    if (filteredData.length < 2) {
      confidence = "Low";
    } else if (filteredData.length < 4) {
      confidence = "Medium";
    } else {
      confidence = "High";
    }
    
    // Generate explanation
    let explanation;
    if (predictionMethod === "average") {
      explanation = `Prediction is based on the average of the last ${filteredData.length} months`;
    } else if (predictionMethod === "weighted") {
      explanation = `Prediction gives more weight to recent months (weighted average)`;
    } else if (predictionMethod === "trend") {
      explanation = `Prediction is based on linear trend extrapolation from historical data`;
    }
    
    // Add seasonal pattern detection if possible
    if (filteredData.length >= 6) {
      // Simple seasonal pattern detection (highest vs lowest month)
      const highestMonth = filteredData.reduce((max, bill) => 
        bill.unitsUsed > max.unitsUsed ? bill : max, filteredData[0]);
      const lowestMonth = filteredData.reduce((min, bill) => 
        bill.unitsUsed < min.unitsUsed ? bill : min, filteredData[0]);
      
      if (highestMonth.unitsUsed / lowestMonth.unitsUsed > 1.3) {
        explanation += `. Seasonal patterns detected with highest usage in ${highestMonth.billingMonth}`;
      }
    }
    
    return {
      predictedUnits,
      predictedAmount,
      percentChange,
      confidence,
      explanation
    };
  }, [filteredData, predictionMethod]);

  // Process data for chart
  const chartData = useMemo(() => {
    const data = filteredData.map(bill => ({
      month: bill.billingMonth,
      units: bill.unitsUsed,
      amount: bill.billAmount,
      type: "actual"
    }));
    
    // Add prediction for next month
    const lastMonth = filteredData[filteredData.length - 1];
    if (lastMonth) {
      const monthNames = ["January", "February", "March", "April", "May", "June", 
                         "July", "August", "September", "October", "November", "December"];
      const lastMonthParts = lastMonth.billingMonth.split(" ");
      const lastMonthName = lastMonthParts[0];
      const lastMonthYear = parseInt(lastMonthParts[1]);
      
      const lastMonthIndex = monthNames.indexOf(lastMonthName);
      const nextMonthIndex = (lastMonthIndex + 1) % 12;
      const nextMonthYear = nextMonthIndex === 0 ? lastMonthYear + 1 : lastMonthYear;
      
      data.push({
        month: `${monthNames[nextMonthIndex]} ${nextMonthYear}`,
        units: prediction.predictedUnits,
        amount: prediction.predictedAmount,
        type: "predicted"
      });
    }
    
    return data;
  }, [filteredData, prediction]);

  return (
    <div className="prediction-container">
      {/* Header */}
      <div className="prediction-header">
        <h1>Predictions</h1>
        <p>Estimate future utility consumption and costs based on historical data</p>
      </div>

      {/* Utility Selector */}
      <div className="utility-selector">
        <div className="utility-buttons">
          <button 
            className={`utility-btn ${selectedUtility === "Electricity" ? "active" : ""}`}
            onClick={() => setSelectedUtility("Electricity")}
          >
            <span className="icon">⚡</span> Electricity
          </button>
          <button 
            className={`utility-btn ${selectedUtility === "Water" ? "active" : ""}`}
            onClick={() => setSelectedUtility("Water")}
          >
            <span className="icon">💧</span> Water
          </button>
        </div>
        
        <div className="prediction-method">
          <label htmlFor="method">Prediction Method:</label>
          <select 
            id="method"
            value={predictionMethod} 
            onChange={(e) => setPredictionMethod(e.target.value)}
          >
            <option value="average">Simple Average</option>
            <option value="weighted">Weighted Average</option>
            <option value="trend">Linear Trend</option>
          </select>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="no-data-message">
          <h3>No Data Available</h3>
          <p>Please add some {selectedUtility.toLowerCase()} bills to generate predictions.</p>
        </div>
      ) : (
        <>
          {/* Prediction Summary Cards */}
          <div className="prediction-cards">
            <div className="prediction-card">
              <div className="card-icon">📊</div>
              <div className="card-content">
                <h3>Predicted Units for Next Month</h3>
                <p className="card-value">{prediction.predictedUnits} {selectedUtility === "Water" ? "kL" : "kWh"}</p>
                <p className="card-change">
                  {prediction.percentChange > 0 ? "↑" : "↓"} {Math.abs(prediction.percentChange)}% from last month
                </p>
              </div>
            </div>
            
            <div className="prediction-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h3>Predicted Bill Amount</h3>
                <p className="card-value">LKR {prediction.predictedAmount.toLocaleString()}</p>
                <p className="card-change">
                  {prediction.percentChange > 0 ? "↑" : "↓"} {Math.abs(prediction.percentChange)}% from last month
                </p>
              </div>
            </div>
            
            <div className="prediction-card">
              <div className="card-icon">🔮</div>
              <div className="card-content">
                <h3>Confidence Level</h3>
                <p className="card-value">{prediction.confidence}</p>
                <p className="card-desc">Based on {filteredData.length} months of data</p>
              </div>
            </div>
          </div>

          {/* Historical vs Predicted Chart */}
          <div className="chart-container">
            <h3>Historical vs Predicted {selectedUtility} Usage</h3>
            <div className="chart-wrapper">
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="units" 
                    stroke={selectedUtility === "Electricity" ? "#2563EB" : "#10b981"} 
                    strokeWidth={2}
                    name={`${selectedUtility} Usage (${selectedUtility === "Water" ? "kL" : "kWh"})`}
                    connectNulls
                  />
                  {chartData.length > 0 && (
                    <ReferenceLine 
                      x={chartData[chartData.length - 1].month} 
                      stroke="#888" 
                      strokeDasharray="5 5" 
                      label="Prediction Start"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Prediction Explanation */}
          <div className="explanation-container">
            <h3>Prediction Details</h3>
            <div className="explanation-content">
              <p>{prediction.explanation}</p>
              
              {filteredData.length >= 2 && (
                <div className="additional-info">
                  <h4>Additional Information:</h4>
                  <ul>
                    <li>Highest usage: {Math.max(...filteredData.map(bill => bill.unitsUsed))} {selectedUtility === "Water" ? "kL" : "kWh"}</li>
                    <li>Lowest usage: {Math.min(...filteredData.map(bill => bill.unitsUsed))} {selectedUtility === "Water" ? "kL" : "kWh"}</li>
                    <li>Average usage: {Math.round(filteredData.reduce((sum, bill) => sum + bill.unitsUsed, 0) / filteredData.length)} {selectedUtility === "Water" ? "kL" : "kWh"}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Prediction;