# ml_service/app.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

app = FastAPI(title="Utility Bill Prediction ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BillData(BaseModel):
    billingMonth: str
    utilityType: str
    unitsUsed: float
    billAmount: float

class PredictionRequest(BaseModel):
    utility: str
    bills: List[BillData]
    method: str = "simple"

class PredictionResponse(BaseModel):
    success: bool
    predictedUnits: float
    predictedAmount: float
    confidence: str
    method: str
    message: str

class AnomalyRequest(BaseModel):
    utility: str
    currentUnits: float
    historicalUnits: List[float]

class AnomalyResponse(BaseModel):
    success: bool
    isAnomaly: bool
    severity: str
    message: str
    percentIncrease: float

def calculate_simple_average(bills):
    if len(bills) == 0:
        return 0, 0
    recent = bills[-3:] if len(bills) >= 3 else bills
    avg_units = sum(b.unitsUsed for b in recent) / len(recent)
    avg_amount = sum(b.billAmount for b in recent) / len(recent)
    return avg_units, avg_amount

def calculate_weighted_average(bills):
    if len(bills) == 0:
        return 0, 0
    total_weight = 0
    weighted_units = 0
    weighted_amount = 0
    for i, bill in enumerate(bills):
        weight = i + 1
        weighted_units += bill.unitsUsed * weight
        weighted_amount += bill.billAmount * weight
        total_weight += weight
    return weighted_units / total_weight, weighted_amount / total_weight

def calculate_linear_trend(bills):
    if len(bills) < 2:
        return calculate_simple_average(bills)
    
    n = len(bills)
    x = list(range(n))
    
    y_units = [b.unitsUsed for b in bills]
    x_mean = sum(x) / n
    y_units_mean = sum(y_units) / n
    
    numerator_units = sum((x[i] - x_mean) * (y_units[i] - y_units_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
    
    if denominator != 0:
        slope_units = numerator_units / denominator
        intercept_units = y_units_mean - slope_units * x_mean
        predicted_units = slope_units * n + intercept_units
    else:
        predicted_units = y_units_mean
    
    y_amount = [b.billAmount for b in bills]
    y_amount_mean = sum(y_amount) / n
    
    numerator_amount = sum((x[i] - x_mean) * (y_amount[i] - y_amount_mean) for i in range(n))
    
    if denominator != 0:
        slope_amount = numerator_amount / denominator
        intercept_amount = y_amount_mean - slope_amount * x_mean
        predicted_amount = slope_amount * n + intercept_amount
    else:
        predicted_amount = y_amount_mean
    
    return max(0, predicted_units), max(0, predicted_amount)

def detect_anomaly(current_units, historical_units):
    if len(historical_units) < 3:
        return False, 0, "Need more data", "normal"
    
    recent_avg = sum(historical_units[-3:]) / 3
    percent_increase = ((current_units - recent_avg) / recent_avg) * 100
    
    is_anomaly = percent_increase > 20
    
    if is_anomaly:
        if percent_increase > 50:
            severity = "critical"
            message = f"CRITICAL: Usage increased by {percent_increase:.1f}%! Check for leaks."
        elif percent_increase > 30:
            severity = "high"
            message = f"HIGH: Usage increased by {percent_increase:.1f}%! Please investigate."
        else:
            severity = "warning"
            message = f"WARNING: Usage increased by {percent_increase:.1f}% from your average."
    else:
        severity = "normal"
        message = f"Usage is normal ({percent_increase:.1f}% change)"
    
    return is_anomaly, percent_increase, message, severity

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        bills = request.bills
        
        if len(bills) < 2:
            return PredictionResponse(
                success=False,
                predictedUnits=0,
                predictedAmount=0,
                confidence="Low",
                method=request.method,
                message="Need at least 2 months of data"
            )
        
        if request.method == "weighted":
            pred_units, pred_amount = calculate_weighted_average(bills)
        elif request.method == "trend":
            pred_units, pred_amount = calculate_linear_trend(bills)
        else:
            pred_units, pred_amount = calculate_simple_average(bills)
        
        if len(bills) >= 12:
            confidence = "High"
        elif len(bills) >= 6:
            confidence = "Medium"
        else:
            confidence = "Low"
        
        return PredictionResponse(
            success=True,
            predictedUnits=round(pred_units, 2),
            predictedAmount=round(pred_amount, 2),
            confidence=confidence,
            method=request.method,
            message=f"Predicted using {len(bills)} months of data"
        )
        
    except Exception as e:
        return PredictionResponse(
            success=False,
            predictedUnits=0,
            predictedAmount=0,
            confidence="Low",
            method=request.method,
            message=f"Error: {str(e)}"
        )

@app.post("/detect-anomaly", response_model=AnomalyResponse)
async def anomaly_detect(request: AnomalyRequest):
    try:
        is_anomaly, percent, message, severity = detect_anomaly(
            request.currentUnits,
            request.historicalUnits
        )
        
        return AnomalyResponse(
            success=True,
            isAnomaly=is_anomaly,
            severity=severity,
            message=message,
            percentIncrease=round(percent, 1)
        )
        
    except Exception as e:
        return AnomalyResponse(
            success=False,
            isAnomaly=False,
            severity="normal",
            message=f"Error: {str(e)}",
            percentIncrease=0
        )

if __name__ == "__main__":
    import uvicorn
    print("🚀 ML Service starting on http://localhost:8001")
    uvicorn.run(app, host="0.0.0.0", port=8001)
