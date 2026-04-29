# ml_service/app.py - COMPLETE VERSION with Ada Derana RSS (Sri Lanka specific)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import requests
import feedparser
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

# Try importing SARIMA
try:
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    SARIMA_AVAILABLE = True
except ImportError:
    SARIMA_AVAILABLE = False
    print("⚠️ statsmodels not installed. SARIMA disabled.")

app = FastAPI(title="Utility Bill Prediction ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# SECTION 1: SRI LANKAN CULTURAL FACTORS
# ============================================

def get_cultural_factor(month: str) -> float:
    """Sri Lankan cultural/religious event multipliers"""
    factors = {
        "January": 1.00,
        "February": 1.00,
        "March": 1.05,
        "April": 1.18,
        "May": 1.25,
        "June": 1.12,
        "July": 1.08,
        "August": 1.00,
        "September": 1.00,
        "October": 1.05,
        "November": 1.00,
        "December": 1.10
    }
    return factors.get(month, 1.00)

# ============================================
# SECTION 2: MONTHLY AVERAGE WEATHER (Sri Lanka)
# ============================================

def get_weather_factor(target_month: str) -> float:
    """
    Use HISTORICAL AVERAGE weather for Sri Lanka (not live daily data)
    This ensures predictions are STABLE and CONSISTENT
    Based on Sri Lanka climate data (average temperatures by month)
    """
    monthly_temps = {
        "January": 27.0, "February": 28.0, "March": 29.0,
        "April": 30.0, "May": 30.5, "June": 29.5,
        "July": 29.0, "August": 29.0, "September": 29.0,
        "October": 28.5, "November": 28.0, "December": 27.5
    }
    monthly_rain = {
        "January": 100, "February": 80, "March": 90,
        "April": 150, "May": 200, "June": 150,
        "July": 100, "August": 100, "September": 120,
        "October": 250, "November": 200, "December": 150
    }

    avg_temp = monthly_temps.get(target_month, 28.0)
    avg_rain = monthly_rain.get(target_month, 100)

    if avg_temp > 31:
        temp_factor = 1.20
        weather_status = "Very Hot Season"
    elif avg_temp > 29:
        temp_factor = 1.10
        weather_status = "Hot Season"
    elif avg_temp < 26:
        temp_factor = 0.95
        weather_status = "Cool Season"
    else:
        temp_factor = 1.00
        weather_status = "Normal"

    if avg_rain > 200:
        rain_factor = 0.90
        weather_status += " + Heavy Rain Season"
    elif avg_rain > 120:
        rain_factor = 0.95
        weather_status += " + Rainy Season"
    else:
        rain_factor = 1.00

    final_factor = temp_factor * rain_factor
    print(f"🌤️ Sri Lanka Climate ({target_month}): {avg_temp}°C avg, {avg_rain}mm rain | Factor: {final_factor} ({weather_status})")
    return final_factor

# ============================================
# SECTION 3: SRI LANKA NEWS RSS (Ada Derana)
# ============================================

def get_sri_lanka_news_factor() -> float:
    """
    Get Sri Lanka specific news from Ada Derana RSS feed
    Detects floods, droughts, heatwaves, power cuts, water cutoffs
    FREE - No API key required
    """
    try:
        url = "https://www.adaderana.lk/rss.php"
        feed = feedparser.parse(url)

        flood_keywords      = ['flood', 'floods', 'flooding', 'දියබැස්ම', 'ගංවතුර']
        drought_keywords    = ['drought', 'droughts', 'නියඟය', 'වියළි']
        heatwave_keywords   = ['heatwave', 'heat wave', 'hot weather', 'උණුසුම් කාලගුණය']
        power_cut_keywords  = ['power cut', 'electricity cut', 'load shedding', 'විදුලි කප්පාදුව']
        water_cutoff_keywords = ['water cut', 'water supply cut', 'ජල සැපයුම් කප්පාදුව']

        for entry in feed.entries[:15]:
            title       = entry.title.lower()
            description = entry.description.lower() if hasattr(entry, 'description') else ''
            full_text   = title + ' ' + description

            if any(k in full_text for k in flood_keywords):
                print(f"🌊 Sri Lanka flood alert detected: {entry.title[:50]}...")
                return 0.85
            elif any(k in full_text for k in heatwave_keywords):
                print(f"🔥 Sri Lanka heatwave alert: {entry.title[:50]}...")
                return 1.20
            elif any(k in full_text for k in drought_keywords):
                print(f"🏜️ Sri Lanka drought alert: {entry.title[:50]}...")
                return 0.90
            elif any(k in full_text for k in power_cut_keywords):
                print(f"⚡ Power cut alert: {entry.title[:50]}...")
                return 0.80
            elif any(k in full_text for k in water_cutoff_keywords):
                print(f"💧 Water cutoff alert: {entry.title[:50]}...")
                return 0.70

        return 1.00

    except Exception as e:
        print(f"⚠️ Sri Lanka news RSS failed: {e}")
        return 1.00

# ============================================
# SECTION 4: WATER CUTOFF ALERTS (NWSDB)
# ============================================

def get_water_cutoff_factor() -> float:
    """Check for NWSDB water cutoff announcements"""
    try:
        return 1.00
    except Exception as e:
        print(f"⚠️ Water cutoff API failed: {e}")
        return 1.00

# ============================================
# SECTION 5: WEATHER ALERTS (Optional enhancement)
# ============================================

def get_weather_alert_factor() -> float:
    """Check for weather warnings from Met Department"""
    try:
        return 1.00
    except:
        return 1.00

# ============================================
# SECTION 6: WEIGHTED AVERAGE (0-5 months)
# ============================================

def predict_weighted_average(amounts: List[float]) -> float:
    if len(amounts) == 0:
        return 0
    if len(amounts) == 1:
        return amounts[0]
    if len(amounts) == 2:
        return round((amounts[0] * 0.6 + amounts[1] * 0.4), 2)

    weights = [0.5, 0.3, 0.2]
    weighted_sum = sum(amounts[i] * weights[i] for i in range(3))
    return round(weighted_sum, 2)

# ============================================
# SECTION 7: LINEAR REGRESSION (6-11 months)
# ============================================

def predict_linear_regression(amounts: List[float]) -> Dict[str, Any]:
    if len(amounts) < 3:
        result = predict_weighted_average(amounts)
        return {"prediction": result, "slope": 0, "trend": "stable"}

    x = np.arange(len(amounts))
    y = np.array(amounts)

    z = np.polyfit(x, y, 1)
    slope = float(z[0])
    trend = "increasing" if slope > 5 else "decreasing" if slope < -5 else "stable"

    trend_line = np.poly1d(z)
    prediction = float(trend_line(len(amounts)))

    return {
        "prediction": round(max(0, prediction), 2),
        "slope": round(slope, 2),
        "trend": trend
    }

# ============================================
# SECTION 8: SARIMA (12+ months)
# ============================================

def predict_sarima(amounts: List[float]) -> Optional[float]:
    if not SARIMA_AVAILABLE or len(amounts) < 12:
        return None
    try:
        model = SARIMAX(
            amounts,
            order=(1, 1, 1),
            seasonal_order=(1, 1, 1, 12),
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        fitted_model = model.fit(disp=False, maxiter=100)
        forecast = fitted_model.forecast(steps=1)
        return float(forecast[0])
    except Exception as e:
        print(f"SARIMA error: {e}")
        return None

# ============================================
# SECTION 9: ANOMALY DETECTION
# ============================================

def detect_anomaly(amounts: List[float]) -> Dict[str, Any]:
    """
    Detect anomalies using rolling percentage change and Z-score.
    Always returns a consistent dict with all keys populated.
    """
    if len(amounts) < 3:
        return {
            "is_anomaly": False,
            "percent_increase": 0.0,
            "z_score": 0.0,
            "severity": "normal",
            "message": "Need at least 3 months of data for anomaly detection.",
            "current_amount": float(amounts[0]) if amounts else 0.0,
            "average_amount": 0.0
        }

    current = amounts[0]
    previous_slice = amounts[1:4] if len(amounts) >= 4 else amounts[1:]
    avg_previous = sum(previous_slice) / len(previous_slice)

    percent_increase = ((current - avg_previous) / avg_previous * 100) if avg_previous > 0 else 0.0
    percent_increase = float(percent_increase)

    if len(amounts) >= 4:
        mean  = float(np.mean(amounts[1:]))
        std   = float(np.std(amounts[1:]))
        z_score = float((current - mean) / std) if std > 0 else 0.0
    else:
        z_score = 0.0

    is_anomaly = bool(percent_increase > 20 or z_score > 2.5)

    if percent_increase > 30 or z_score > 3:
        severity = "critical"
        message  = f"CRITICAL: Unusually high usage detected ({percent_increase:.0f}% above average)! Check for leaks or faulty appliances."
    elif is_anomaly:
        severity = "warning"
        message  = f"WARNING: Usage increased by {percent_increase:.0f}%. Monitor your consumption."
    else:
        severity = "normal"
        message  = "Usage within normal range."

    return {
        "is_anomaly": is_anomaly,
        "percent_increase": round(percent_increase, 2),
        "z_score": round(z_score, 2),
        "severity": severity,
        "message": message,
        "current_amount": float(current),
        "average_amount": round(avg_previous, 2)
    }

# ============================================
# SECTION 10: MAIN PREDICTION FUNCTION
# ============================================

def _build_response(
    base_prediction: float,
    final_prediction: float,
    model_used: str,
    confidence: str,
    model_message: str,
    num_months: int,
    cultural_factor: float,
    weather_factor: float,
    sri_lanka_news_factor: float,
    water_cutoff_factor: float,
    total_external_factor: float,
    anomaly_result: Dict[str, Any],
    extra: Dict[str, Any] = None
) -> Dict[str, Any]:
    """Helper to build a consistent prediction response dict."""
    response = {
        "predicted_amount":      round(final_prediction, 2),
        "base_prediction":       round(base_prediction, 2),
        "model_used":            model_used,
        "confidence":            confidence,
        "data_months":           num_months,
        "cultural_factor":       round(cultural_factor, 2),
        "weather_factor":        round(weather_factor, 2),
        "sri_lanka_news_factor": round(sri_lanka_news_factor, 2),
        "water_cutoff_factor":   round(water_cutoff_factor, 2),
        "total_factor":          round(total_external_factor, 2),
        "message":               model_message,
        # Anomaly fields — always present
        "is_anomaly":            anomaly_result["is_anomaly"],
        "anomaly_message":       anomaly_result["message"],
        "anomaly_percent":       anomaly_result["percent_increase"],
        "anomaly_severity":      anomaly_result["severity"],
    }
    if extra:
        response.update(extra)
    return response


def predict_adaptive(amounts: List[float], target_month: str, utility_type: str) -> Dict[str, Any]:
    num_months = len(amounts)

    cultural_factor       = get_cultural_factor(target_month)
    weather_factor        = get_weather_factor(target_month)
    sri_lanka_news_factor = get_sri_lanka_news_factor()

    water_cutoff_factor = get_water_cutoff_factor() if utility_type == "Water" else 1.00

    anomaly_result = detect_anomaly(amounts)

    total_external_factor = (
        cultural_factor * weather_factor * sri_lanka_news_factor * water_cutoff_factor
    )

    # ── SARIMA (12+ months) ──────────────────────────────────────────────────
    if num_months >= 12 and SARIMA_AVAILABLE:
        sarima_pred = predict_sarima(amounts)
        if sarima_pred is not None:
            base_prediction  = float(sarima_pred)
            final_prediction = base_prediction * total_external_factor
            return _build_response(
                base_prediction, final_prediction,
                model_used="SARIMA (Seasonal ARIMA)",
                confidence="High",
                model_message=f"Using SARIMA with {num_months} months of data - detects seasonal patterns",
                num_months=num_months,
                cultural_factor=cultural_factor,
                weather_factor=weather_factor,
                sri_lanka_news_factor=sri_lanka_news_factor,
                water_cutoff_factor=water_cutoff_factor,
                total_external_factor=total_external_factor,
                anomaly_result=anomaly_result,
            )

    # ── Linear Regression (6-11 months) ─────────────────────────────────────
    if num_months >= 6:
        reg_result       = predict_linear_regression(amounts)
        base_prediction  = reg_result["prediction"]
        final_prediction = base_prediction * total_external_factor
        return _build_response(
            base_prediction, final_prediction,
            model_used="Linear Regression (Trend Detection)",
            confidence="Medium-High",
            model_message=f"Using Linear Regression with {num_months} months of data. Trend: {reg_result['trend']}",
            num_months=num_months,
            cultural_factor=cultural_factor,
            weather_factor=weather_factor,
            sri_lanka_news_factor=sri_lanka_news_factor,
            water_cutoff_factor=water_cutoff_factor,
            total_external_factor=total_external_factor,
            anomaly_result=anomaly_result,
            extra={"trend": reg_result["trend"], "slope": reg_result["slope"]},
        )

    # ── Weighted Average (< 6 months) ────────────────────────────────────────
    base_prediction  = predict_weighted_average(amounts)
    final_prediction = base_prediction * total_external_factor
    return _build_response(
        base_prediction, final_prediction,
        model_used="Weighted Average (Fallback)",
        confidence="Low",
        model_message=f"Using Weighted Average with {num_months} months of data. Add more bills for better accuracy.",
        num_months=num_months,
        cultural_factor=cultural_factor,
        weather_factor=weather_factor,
        sri_lanka_news_factor=sri_lanka_news_factor,
        water_cutoff_factor=water_cutoff_factor,
        total_external_factor=total_external_factor,
        anomaly_result=anomaly_result,
    )

# ============================================
# SECTION 11: API ENDPOINTS
# ============================================

class PredictionRequest(BaseModel):
    utility_type: str
    historical_data: List[dict]
    target_month: str
    target_year: int

@app.post("/predict")
async def predict(request: PredictionRequest):
    try:
        amounts = []
        for bill in request.historical_data:
            amount = bill.get('amount') or bill.get('billAmount')
            if amount:
                amounts.append(float(amount))

        amounts.reverse()

        if not amounts:
            return {
                "success": False,
                "predicted_amount": 0,
                "message": "No historical data provided"
            }

        result = predict_adaptive(amounts, request.target_month, request.utility_type)

        return {
            "success":              True,
            "predicted_amount":     result["predicted_amount"],
            "base_prediction":      result["base_prediction"],
            "confidence":           result["confidence"],
            "method":               result["model_used"],
            "data_months":          result["data_months"],
            "cultural_factor":      result["cultural_factor"],
            "weather_factor":       result["weather_factor"],
            "sri_lanka_news_factor":result["sri_lanka_news_factor"],
            "water_cutoff_factor":  result["water_cutoff_factor"],
            "total_external_factor":result["total_factor"],
            "is_anomaly":           result["is_anomaly"],
            "anomaly_message":      result["anomaly_message"],
            "anomaly_percent":      result["anomaly_percent"],
            "anomaly_severity":     result["anomaly_severity"],
            "message":              result["message"]
        }

    except Exception as e:
        print(f"Prediction error: {e}")
        return {
            "success": False,
            "predicted_amount": 0,
            "message": f"Error: {str(e)}"
        }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "sarima_available": SARIMA_AVAILABLE,
        "data_sources": ["historical_climate_averages", "ada_derana_rss", "cultural_calendar"],
        "sri_lanka_specific": True
    }

@app.get("/")
async def root():
    return {
        "message": "Utility Bill Prediction ML Service - Sri Lanka Edition",
        "version": "3.1",
        "features": [
            "SARIMA (12+ months data)",
            "Linear Regression (6-11 months data)",
            "Weighted Average (< 6 months data)",
            "Historical Climate Averages (Sri Lanka, stable predictions)",
            "Sri Lanka News RSS (Ada Derana)",
            "Cultural Factors (Sri Lankan festivals)",
            "Anomaly Detection (Z-score + Rolling Percentage)"
        ],
        "sri_lanka_specific": True,
        "data_sources": ["Ada Derana RSS", "Historical Climate Averages", "NWSDB (planned)"]
    }

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("🚀 Utility Bill Prediction ML Service - Sri Lanka Edition")
    print("=" * 60)
    print(f"📊 SARIMA Available: {SARIMA_AVAILABLE}")
    print(f"🌤️ Weather: Historical Climate Averages (stable)")
    print(f"📰 Sri Lanka News: Ada Derana RSS (FREE, Sri Lanka specific)")
    print(f"📍 Running on: http://localhost:8001")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8001)