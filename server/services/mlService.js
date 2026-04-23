// server/services/mlService.js
import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";

/**
 * Call ML service to predict next month's bill
 */
export const predictBill = async (utility, bills, method = "simple") => {
  try {
    console.log(`Calling ML service for ${utility} prediction...`);
    
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
      utility,
      bills,
      method
    });
    
    console.log("ML service response status:", response.status);
    console.log("ML service response data:", response.data);
    
    // The ML service returns data directly
    const mlData = response.data;
    
    return {
      success: true,
      predictedUnits: mlData.predictedUnits,
      predictedAmount: mlData.predictedAmount,
      confidence: mlData.confidence,
      method: mlData.method,
      message: mlData.message
    };
    
  } catch (error) {
    console.error("ML Service error details:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    if (error.code === 'ECONNREFUSED') {
      console.error("❌ Cannot connect to ML service. Make sure it's running on port 8001");
    }
    // Fallback to simple calculation if ML service is down
    return fallbackPrediction(bills);
  }
};

/**
 * Detect anomaly using ML service
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
    console.error("ML Service error:", error.message);
    return fallbackAnomaly(currentUnits, historicalUnits);
  }
};

// Fallback functions if ML service is down
function fallbackPrediction(bills) {
  console.log("Using fallback prediction calculation");
  if (!bills.length) return { success: false, predictedAmount: 0, predictedUnits: 0 };
  
  const sumAmount = bills.reduce((s, b) => s + b.billAmount, 0);
  const sumUnits = bills.reduce((s, b) => s + (b.unitsUsed || 0), 0);
  
  return {
    success: true,
    predictedAmount: Math.round(sumAmount / bills.length),
    predictedUnits: Math.round(sumUnits / bills.length),
    confidence: "Low",
    method: "fallback",
    message: "Using fallback calculation (ML service unavailable)"
  };
}

function fallbackAnomaly(current, historical) {
  if (historical.length < 3) return { isAnomaly: false, percentIncrease: 0, severity: "normal" };
  const avg = historical.slice(-3).reduce((s, v) => s + v, 0) / 3;
  const percent = ((current - avg) / avg) * 100;
  return {
    isAnomaly: percent > 20,
    percentIncrease: percent,
    severity: percent > 30 ? "critical" : "warning",
    message: `Usage ${percent > 20 ? 'increased' : 'normal'} by ${percent.toFixed(1)}%`
  };
}