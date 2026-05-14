# ml_service/app.py - v5.0 Predicts UNITS only (not amount)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import feedparser
import warnings
warnings.filterwarnings('ignore')

try:
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    SARIMA_AVAILABLE = True
except ImportError:
    SARIMA_AVAILABLE = False

app = FastAPI(title="Utility Bill Prediction ML Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

# ============================================================
# CULTURAL FACTORS (Sri Lanka billing cycle aware)
# Vesak 2026 = May 30, meter read ≈ May 20 → spike lands in JUNE bill
# ============================================================
def get_cultural_factor(month: str) -> float:
    return {
        "January": 1.00, "February": 1.00, "March": 1.05,
        "April": 1.15,   "May": 1.05,      "June": 1.25,
        "July": 1.08,    "August": 1.00,   "September": 1.00,
        "October": 1.05, "November": 1.00, "December": 1.12
    }.get(month, 1.00)

def get_weather_factor(month: str) -> float:
    temps = {"January":27,"February":28,"March":29,"April":30,"May":30.5,
             "June":29.5,"July":29,"August":29,"September":29,"October":28.5,
             "November":28,"December":27.5}
    rain  = {"January":100,"February":80,"March":90,"April":150,"May":200,
             "June":150,"July":100,"August":100,"September":120,"October":250,
             "November":200,"December":150}
    t = temps.get(month, 28.0)
    r = rain.get(month, 100)
    tf = 1.20 if t > 31 else 1.10 if t > 29 else 0.95 if t < 26 else 1.00
    rf = 0.90 if r > 200 else 0.95 if r > 120 else 1.00
    factor = tf * rf
    print(f"🌤️ Climate ({month}): {t}°C, {r}mm → factor: {factor}")
    return factor

def get_sri_lanka_news_factor() -> float:
    try:
        feed = feedparser.parse("https://www.adaderana.lk/rss.php")
        for entry in feed.entries[:10]:
            text = (getattr(entry,'title','') + " " + getattr(entry,'description','')).lower()
            if any(k in text for k in ['flood','heatwave','drought','power cut','load shedding']):
                return 0.85
        return 1.00
    except:
        return 1.00

# ============================================================
# HOUSEHOLD FEATURE EXTRACTOR
# ============================================================
def extract_household_features(raw: dict, utility_type: str) -> dict:
    if not raw:
        return {
            "num_floors": 1, "num_ac": 0, "has_solar": False,
            "has_water_heater": False, "num_bathrooms": 1,
            "household_size": 1, "building_type": "house",
            "has_garden": False, "num_refrigerators": 1,
        }

    if "electricity" in raw or "water" in raw:
        elec  = raw.get("electricity", {})
        water = raw.get("water", {})
        num_floors = elec.get("num_floors", 1)
        if utility_type.lower() == "electricity":
            return {
                "num_floors":           num_floors,
                "num_ac":               elec.get("num_ac", 0),
                "has_solar":            elec.get("has_solar", False),
                "has_water_heater":     elec.get("has_electric_water_heater", False),
                "num_refrigerators":    elec.get("num_refrigerators", 1),
                "num_tvs":              elec.get("num_tvs", 0),
                "num_computers":        elec.get("num_computers", 0),
                "has_washing_machine":  elec.get("has_washing_machine", False),
                "has_electric_vehicle": elec.get("has_electric_vehicle", False),
                "household_size":       water.get("num_people", 1),
                "building_type":        water.get("building_type", "house"),
                "num_bathrooms":        water.get("num_bathrooms", 1),
                "has_garden":           water.get("has_garden", False),
            }
        else:
            return {
                "num_floors":           num_floors,
                "num_bathrooms":        water.get("num_bathrooms", 1),
                "household_size":       water.get("num_people", 1),
                "building_type":        water.get("building_type", "house"),
                "has_garden":           water.get("has_garden", False),
                "has_pool":             water.get("has_pool", False),
                "has_water_tank":       water.get("has_water_tank", False),
                "has_water_heater":     water.get("has_water_heater", False),
                "has_washing_machine":  water.get("has_washing_machine", False),
                "num_ac":               0,
                "has_solar":            False,
                "num_refrigerators":    1,
            }

    return raw

def get_household_factor(raw_hf: dict, utility_type: str) -> float:
    hf = extract_household_features(raw_hf, utility_type)
    factor = 1.0

    if utility_type.lower() == "electricity":
        factor += max(0, int(hf.get("num_floors", 1)) - 1) * 0.04
        factor += int(hf.get("num_ac", 0)) * 0.07
        if hf.get("has_water_heater"):     factor += 0.04
        if hf.get("has_solar"):            factor -= 0.10
        if hf.get("has_washing_machine"):  factor += 0.03
        if hf.get("has_electric_vehicle"): factor += 0.08
        factor += max(0, int(hf.get("num_refrigerators", 1)) - 1) * 0.02

    elif utility_type.lower() == "water":
        factor += max(0, int(hf.get("num_bathrooms", 1)) - 1) * 0.05
        size = int(hf.get("household_size", 1))
        if size >= 5: factor += 0.10
        elif size >= 4: factor += 0.07
        elif size >= 3: factor += 0.03
        if hf.get("has_garden"): factor += 0.04
        if hf.get("has_pool"):   factor += 0.06
        if hf.get("building_type") == "house" and int(hf.get("num_floors", 1)) >= 2:
            factor += 0.03

    return round(min(max(factor, 0.82), 1.35), 3)

# ============================================================
# UNIT PREDICTION HELPERS
# ============================================================
def predict_weighted_average_units(units_list):
    if not units_list: return 0
    if len(units_list) == 1: return units_list[0]
    if len(units_list) == 2: return round(units_list[0]*0.6 + units_list[1]*0.4)
    return round(units_list[0]*0.5 + units_list[1]*0.3 + units_list[2]*0.2)

def predict_linear_regression_units(units_list):
    if len(units_list) < 3:
        return predict_weighted_average_units(units_list)
    x = np.arange(len(units_list))
    y = np.array(units_list)
    z = np.polyfit(x, y, 1)
    pred = float(np.poly1d(z)(len(units_list)))
    return round(max(0, pred))

def detect_anomaly(amounts):
    if len(amounts) < 3:
        return {"is_anomaly": False, "percent_increase": 0.0, "severity": "normal", "message": "Need more data"}
    current = amounts[0]
    avg_prev = sum(amounts[1:4]) / len(amounts[1:4]) if len(amounts) >= 4 else sum(amounts[1:]) / len(amounts[1:])
    pct = ((current - avg_prev) / avg_prev * 100) if avg_prev > 0 else 0
    return {
        "is_anomaly": pct > 20,
        "percent_increase": round(pct, 2),
        "severity": "warning" if pct > 20 else "normal",
        "message": f"Usage increased by {pct:.1f}%." if pct > 20 else "Normal usage."
    }

def calculate_mape_from_history(amounts):
    if len(amounts) < 4: return None
    errors = []
    for i in range(3, len(amounts)):
        train = amounts[:i]
        actual = amounts[i]
        pred = predict_weighted_average_units(train[-3:]) if len(train) >= 3 else sum(train)/len(train)
        if actual > 0:
            errors.append(abs((actual - pred) / actual) * 100)
    if errors:
        mape = round(sum(errors)/len(errors), 2)
        return {"mape": mape, "accuracy": round(100-mape, 2), "tests_performed": len(errors)}
    return None

# ============================================================
# BUILD RESPONSE - UNITS ONLY
# ============================================================
def _build_response(
    predicted_units: float,
    model_used: str,
    confidence: str,
    model_message: str,
    num_months: int,
    cultural_factor: float,
    weather_factor: float,
    sri_lanka_news_factor: float,
    anomaly_result: Dict[str, Any],
    mape_result: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Build response - PREDICTS UNITS ONLY"""
    
    response = {
        "predicted_units": round(predicted_units),
        "model_used": model_used,
        "confidence": confidence,
        "data_months": num_months,
        "cultural_factor": round(cultural_factor, 2),
        "weather_factor": round(weather_factor, 2),
        "sri_lanka_news_factor": round(sri_lanka_news_factor, 2),
        "message": model_message,
        "is_anomaly": anomaly_result["is_anomaly"],
        "anomaly_message": anomaly_result.get("message", ""),
        "anomaly_percent": anomaly_result.get("percent_increase", 0),
        "anomaly_severity": anomaly_result.get("severity", "normal"),
        "mape": mape_result["mape"] if mape_result else None,
        "accuracy": mape_result["accuracy"] if mape_result else None,
        "tests_performed": mape_result["tests_performed"] if mape_result else 0,
        "data_quality": "Excellent" if num_months >= 12 else "Good" if num_months >= 6 else "Poor"
    }
    return response

# ============================================================
# MAIN PREDICTION FUNCTION - PREDICTS UNITS ONLY
# ============================================================
def predict_adaptive(amounts, target_month, utility_type, historical_units=None, household_features=None):
    num_months = len(amounts)

    hf = extract_household_features(household_features or {}, utility_type)
    cult = get_cultural_factor(target_month)
    weather = get_weather_factor(target_month)
    news = get_sri_lanka_news_factor()
    anomaly = detect_anomaly(amounts)
    mape_res = calculate_mape_from_history(amounts)

    print(f"🔧 Predicting UNITS for {utility_type}")
    print(f"   Cultural:{cult} Weather:{weather} News:{news}")
    print(f"   Household: Floors:{hf.get('num_floors',1)} ACs:{hf.get('num_ac',0)}")

    # Predict UNITS from historical units
    if historical_units and len(historical_units) >= 3:
        recent = historical_units[:4]
        predicted_units = predict_weighted_average_units(recent)
        model_used = "Weighted Average (Units)"
        confidence = "Medium-High"
        model_message = f"Predicted {round(predicted_units)} units from last {len(recent)} months"
    elif num_months >= 6:
        # Fallback: estimate units from amount trend using average rate
        reg_result = predict_linear_regression_units(historical_units) if historical_units else 100
        predicted_units = reg_result
        model_used = "Linear Regression (Units)"
        confidence = "Medium"
        model_message = f"Predicted {round(predicted_units)} units from trend analysis"
    else:
        predicted_units = 100  # Default fallback
        model_used = "Default"
        confidence = "Low"
        model_message = "Using default unit prediction"

    # Apply household multiplier
    hh_factor = get_household_factor(hf, utility_type)
    predicted_units = predicted_units * hh_factor
    model_message += f" × household {hh_factor:.2f}"

    # Cap at realistic range
    predicted_units = max(20, min(500, predicted_units))

    print(f"📏 Final units: {round(predicted_units)} units for {utility_type}")

    return _build_response(
        predicted_units, model_used, confidence, model_message,
        num_months, cult, weather, news, anomaly, mape_res
    )

# ============================================================
# API ENDPOINT
# ============================================================
class PredictionRequest(BaseModel):
    utility_type:       str
    historical_data:    List[dict]
    target_month:       str
    target_year:        int
    household_features: Optional[Dict[str, Any]] = None

@app.post("/predict")
async def predict(request: PredictionRequest):
    try:
        amounts = []
        units_list = []
        for bill in request.historical_data:
            amt   = bill.get('amount') or bill.get('billAmount')
            units = bill.get('units') or bill.get('unitsUsed') or bill.get('unit')
            if amt is not None: amounts.append(float(amt))
            if units is not None: units_list.append(float(units))

        amounts.reverse()
        units_list.reverse()

        if not amounts and not units_list:
            return {"success": False, "predicted_units": 0, "message": "No historical data"}

        result = predict_adaptive(
            amounts, request.target_month, request.utility_type,
            units_list, request.household_features
        )

        return {
            "success": True,
            "predicted_units": result["predicted_units"],
            "model_used": result["model_used"],
            "confidence": result["confidence"],
            "data_months": result["data_months"],
            "cultural_factor": result["cultural_factor"],
            "weather_factor": result["weather_factor"],
            "sri_lanka_news_factor": result["sri_lanka_news_factor"],
            "is_anomaly": result["is_anomaly"],
            "anomaly_message": result["anomaly_message"],
            "anomaly_percent": result["anomaly_percent"],
            "anomaly_severity": result["anomaly_severity"],
            "mape": result.get("mape"),
            "accuracy": result.get("accuracy"),
            "message": result["message"]
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        return {"success": False, "predicted_units": 0, "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    print("=" * 70)
    print("🚀 Utility Bill Prediction Service v5.0")
    print("   PREDICTS UNITS ONLY - Node.js handles tariff calculation")
    print("=" * 70)
    uvicorn.run(app, host="0.0.0.0", port=8001)