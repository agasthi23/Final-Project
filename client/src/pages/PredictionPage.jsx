// src/pages/Prediction.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar,
} from "recharts";
import {
  FiZap, FiDroplet, FiWifi, FiCalendar, FiArrowUp, FiArrowDown,
  FiBarChart2, FiStar, FiTrendingUp, FiInfo, FiShield, FiHome,
  FiClock, FiPlay, FiRefreshCw,
} from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { predictionsAPI, billsAPI } from "../services/api";

/* ─── Font (shared with dashboard) ─── */
if (!document.getElementById("db-font")) {
  const l = document.createElement("link");
  l.id = "db-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.getElementById("pred-anim")) {
  const s = document.createElement("style");
  s.id = "pred-anim";
  s.textContent = `
    @keyframes predFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to { transform: rotate(360deg) } }
    .p-fu  { animation: predFadeUp .4s ease both }
    .p-fu1 { animation-delay:.05s } .p-fu2 { animation-delay:.10s }
    .p-fu3 { animation-delay:.15s } .p-fu4 { animation-delay:.20s }
    .p-sc:hover  { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .p-hbc:hover { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .p-util:not(.active):hover { background:#f0f2f7!important; color:#475569!important; }
    .p-mpill:hover { background:#f1f5f9!important; }
    .bt-card:hover { transform:translateY(-1px)!important; box-shadow:0 8px 24px rgba(0,0,0,.1)!important; }
  `;
  document.head.appendChild(s);
}

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

// ─── Cultural factors (mirrors app.py) ────────────────────────────────────────
const CULTURAL_FACTORS = {
  January:1.00, February:1.00, March:1.05, April:1.30,
  May:1.20,     June:1.12,     July:1.08,  August:1.00,
  September:1.00, October:1.05, November:1.00, December:1.10,
};

// ─── Weather factors (mirrors app.py) ─────────────────────────────────────────
const WEATHER_FACTORS = {
  January:1.00, February:1.00, March:1.10, April:1.10,
  May:1.045,    June:0.988,    July:1.035, August:1.035,
  September:1.035, October:0.9405, November:0.950, December:1.00,
};

/* ════ BACKTESTER HELPERS ════ */

/** Weighted average on last 3 months (mirrors predict_weighted_average in app.py) */
function weightedAvg(amounts) {
  if (!amounts.length) return 0;
  if (amounts.length === 1) return amounts[0];
  if (amounts.length === 2) return amounts[0]*0.6 + amounts[1]*0.4;
  return amounts[0]*0.5 + amounts[1]*0.3 + amounts[2]*0.20;
}

/** Linear regression prediction (mirrors predict_linear_regression in app.py) */
function linearRegression(amounts) {
  if (amounts.length < 3) return weightedAvg(amounts);
  const x = amounts.map((_, i) => i);
  const n = amounts.length;
  const xMean = x.reduce((a,b)=>a+b,0)/n;
  const yMean = amounts.reduce((a,b)=>a+b,0)/n;
  const num = x.reduce((s,xi,i)=>s+(xi-xMean)*(amounts[i]-yMean),0);
  const den = x.reduce((s,xi)=>s+(xi-xMean)**2,0);
  const slope = den ? num/den : 0;
  const intercept = yMean - slope*xMean;
  const pred = intercept + slope*n;
  return Math.max(0, pred);
}

/**
 * Simulate what the ML model would have predicted for `targetMonthKey`
 * using only bills BEFORE that month.
 */
function simulatePrediction(allBills, targetMonthKey, utilityType) {
  // Filter bills for this utility, only those before the target month
  const prior = allBills
    .filter(b => b.utilityType === utilityType && b.billingMonth < targetMonthKey)
    .sort((a,b) => b.billingMonth.localeCompare(a.billingMonth)); // newest first

  if (!prior.length) return null;

  const amounts = prior.map(b => b.billAmount);
  const [, mo] = targetMonthKey.split("-");
  const monthName = MONTH_NAMES[parseInt(mo,10)-1];

  const cultural = CULTURAL_FACTORS[monthName] || 1.0;
  const weather  = WEATHER_FACTORS[monthName]  || 1.0;
  const externalFactor = cultural * weather;

  let basePred, model, confidence;
  if (amounts.length >= 12) {
    basePred = linearRegression(amounts); // SARIMA not available in JS; use LR
    model = "Linear Regression (SARIMA proxy)";
    confidence = "High";
  } else if (amounts.length >= 6) {
    basePred = linearRegression(amounts);
    model = "Linear Regression";
    confidence = "Medium-High";
  } else {
    basePred = weightedAvg(amounts.slice(0,3));
    model = "Weighted Average";
    confidence = amounts.length >= 3 ? "Medium" : "Low";
  }

  const finalPred = Math.round(basePred * externalFactor);

  return {
    monthName,
    monthKey: targetMonthKey,
    dataMonths: amounts.length,
    basePrediction: Math.round(basePred),
    culturalFactor: cultural,
    weatherFactor: weather,
    externalFactor: Math.round(externalFactor*100)/100,
    predictedAmount: finalPred,
    model,
    confidence,
    priorAmounts: amounts,
  };
}

/* ════ MAIN COMPONENT ════ */
const Prediction = () => {
  const { darkMode } = useTheme();

  const C = {
    page:    darkMode ? "#0f172a" : "#f3f4f8",
    card:    darkMode ? "#1e293b" : "#ffffff",
    hover:   darkMode ? "#334155" : "#f0f2f7",
    ink:     darkMode ? "#f1f5f9" : "#0f172a",
    body:    darkMode ? "#cbd5e1" : "#334155",
    muted:   darkMode ? "#94a3b8" : "#64748b",
    faint:   darkMode ? "#64748b" : "#94a3b8",
    border:  darkMode ? "#334155" : "#e2e8f0",
    blue:    "#2563eb",
    blueL:   darkMode ? "rgba(37,99,235,0.15)"  : "#eff6ff",
    blueM:   darkMode ? "#1e3a8a"               : "#bfdbfe",
    teal:    "#0891b2",
    tealL:   darkMode ? "rgba(8,145,178,0.15)" : "#ecfeff",
    tealM:   darkMode ? "#164e63"               : "#a5f3fc",
    green:   "#059669",
    greenL:  darkMode ? "rgba(5,150,105,0.15)"  : "#ecfdf5",
    greenM:  darkMode ? "#064e3b"               : "#a7f3d0",
    amber:   "#d97706",
    amberL:  darkMode ? "rgba(217,119,6,0.15)"  : "#fffbeb",
    amberM:  darkMode ? "#78350f"               : "#fde68a",
    red:     "#dc2626",
    redL:    darkMode ? "rgba(220,38,38,0.15)"  : "#fef2f2",
    redM:    darkMode ? "#7f1d1d"               : "#fecaca",
    violet:  "#7c3aed",
    violetL: darkMode ? "rgba(124,58,237,0.15)" : "#f5f3ff",
    violetM: darkMode ? "#4c1d95"               : "#ddd6fe",
    indigo:  "#4f46e5",
    indigoL: darkMode ? "rgba(79,70,229,0.15)"  : "#eef2ff",
    indigoM: darkMode ? "#312e81"               : "#c7d2fe",
    s1: "0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
    s2: "0 4px 16px rgba(15,23,42,.08),0 2px 4px rgba(15,23,42,.04)",
    s3: "0 12px 40px rgba(15,23,42,.10),0 4px 8px rgba(15,23,42,.04)",
  };

  const UTIL_META = {
    Electricity: { color:C.blue,   bg:C.blueL,   bdr:C.blueM,   icon:(s)=><FiZap size={s}/>,     unit:"kWh",      flatRate:false },
    Water:       { color:C.teal,   bg:C.tealL,   bdr:C.tealM,   icon:(s)=><FiDroplet size={s}/>,  unit:"Units",    flatRate:false },
    Internet:    { color:C.indigo, bg:C.indigoL, bdr:C.indigoM, icon:(s)=><FiWifi size={s}/>,     unit:"Flat-rate", flatRate:true },
  };

  // ── Page-level modal ──
  const [showBacktester, setShowBacktester] = useState(false);

  // ── Predictions tab state ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUtility, setSelectedUtility] = useState("Electricity");
  const [predictionMethod, setPredictionMethod] = useState("simple");
  const [predictionData, setPredictionData] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [showHouseholdForm, setShowHouseholdForm] = useState(false);
  const [savingHousehold, setSavingHousehold] = useState(false);
  const [activeTab, setActiveTab] = useState("electricity");
  const [householdData, setHouseholdData] = useState({
    electricity: {
      num_ac:0, ac_type:"non_inverter", num_refrigerators:1, fridge_age_years:5,
      num_tvs:1, num_computers:0, has_electric_water_heater:false,
      has_washing_machine:false, has_solar:false, has_electric_vehicle:false,
      num_floors:1, house_area_sqft:1000,
    },
    water: {
      num_bathrooms:1, num_people:1, has_water_heater:false,
      has_washing_machine:false, has_garden:false, has_pool:false,
      has_water_tank:false, building_type:"house",
    },
  });

  // ── Household data popup ──
  const [hasHouseholdData, setHasHouseholdData] = useState(null);

  // ── Backtester tab state ──
  const [allBills, setAllBills]                   = useState([]);
  const [btUtility, setBtUtility]                 = useState("Electricity");
  const [btTargetMonth, setBtTargetMonth]         = useState("");
  const [btResult, setBtResult]                   = useState(null);
  const [btRunning, setBtRunning]                 = useState(false);
  const [btAllResults, setBtAllResults]           = useState([]);
  const [btLoadingBills, setBtLoadingBills]       = useState(false);

  const meta = UTIL_META[selectedUtility];
  const utilColor = meta?.color || C.blue;
  const utilUnit = meta?.unit || "";
  const isFlat = meta?.flatRate || false;

  // ── Fetch all bills for backtester ──────────────────────────────────────────
  const fetchAllBills = useCallback(async () => {
    setBtLoadingBills(true);
    try {
      const res = await billsAPI.getAll();
      let bills = res.data || [];
      if (Array.isArray(res.data?.bills)) bills = res.data.bills;
      if (Array.isArray(res.data?.data))  bills = res.data.data;
      setAllBills(bills);
    } catch (e) {
      console.error("Failed to fetch bills for backtester:", e);
    } finally {
      setBtLoadingBills(false);
    }
  }, []);

  // ── Available months for backtester dropdown ─────────────────────────────────
  const btAvailableMonths = useMemo(() => {
    const allMonths = allBills
      .filter(b => b.utilityType === btUtility)
      .map(b => b.billingMonth)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
    
    return allMonths.filter((month) => {
      const priorBills = allBills.filter(b => 
        b.utilityType === btUtility && b.billingMonth < month
      );
      return priorBills.length >= 3;
    });
  }, [allBills, btUtility]);

  // ── Run single backtest ─────────────────────────────────────────────────────
  const runBacktest = () => {
    if (!btTargetMonth) return;
    setBtRunning(true);
    setBtResult(null);
    setTimeout(() => {
      const sim = simulatePrediction(allBills, btTargetMonth, btUtility);
      if (!sim) { setBtRunning(false); return; }
      const actual = allBills.find(
        b => b.utilityType === btUtility && b.billingMonth === btTargetMonth
      );
      setBtResult({ ...sim, actualAmount: actual?.billAmount || null });
      setBtRunning(false);
    }, 300);
  };

  // ── Run full history backtest ───────────────────────────────────────────────
  const runFullBacktest = () => {
    setBtRunning(true);
    setBtAllResults([]);
    setTimeout(() => {
      const results = btAvailableMonths.map(monthKey => {
        const sim = simulatePrediction(allBills, monthKey, btUtility);
        const actual = allBills.find(
          b => b.utilityType === btUtility && b.billingMonth === monthKey
        );
        if (!sim || !actual) return null;
        const error = actual.billAmount
          ? Math.round(((sim.predictedAmount - actual.billAmount) / actual.billAmount) * 100)
          : null;
        return { ...sim, actualAmount: actual.billAmount, errorPct: error };
      }).filter(Boolean);
      setBtAllResults(results);
      setBtRunning(false);
    }, 400);
  };

  // ── Fetch prediction data (Predictions tab) ──────────────────────────────────
  const fetchPredictionData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const predRes = await predictionsAPI.getNextMonth({ utility: selectedUtility, method: predictionMethod });
      const histRes = await predictionsAPI.getHistory({ utility: selectedUtility });

      if (predRes.data?.success && predRes.data.predictions) {
        setPredictionData(predRes.data.predictions);
      } else if (predRes.data?.message) {
        setError(predRes.data.message);
      }

      if (histRes.data?.success && histRes.data.history) {
        setHistoryData(histRes.data.history);
        const { usageData, billData } = histRes.data.history;
        const maxLength = Math.max(usageData?.length || 0, billData?.length || 0);
        const combined = [];
        for (let i = 0; i < maxLength; i++) {
          combined.push({
            month: usageData?.[i]?.month || billData?.[i]?.month,
            units: usageData?.[i]?.units || null,
            amount: billData?.[i]?.amount || null,
            forecast: null, forecastAmount: null,
          });
        }
        if (predRes.data?.predictions) {
          const pred = predRes.data.predictions;
          const nextMonthLabel = pred.nextMonth || "Next Month";
          const shortMonth = nextMonthLabel.split(" ")[0].slice(0,3) + " '" + nextMonthLabel.split(" ")[1]?.slice(2);
          combined.push({
            month: shortMonth + " ›",
            units: isFlat ? null : pred.predictedUnits,
            amount: null,
            forecast: isFlat ? null : pred.predictedUnits,
            forecastAmount: pred.predictedAmount,
          });
          if (combined.length > 1) {
            combined[combined.length - 2] = {
              ...combined[combined.length - 2],
              forecast: isFlat ? null : (usageData?.[usageData.length - 1]?.units || 0),
              forecastAmount: billData?.[billData.length - 1]?.amount || 0,
            };
          }
        }
        setChartData(combined);
      }
    } catch (err) {
      console.error("Fetch prediction error:", err);
      setError("Failed to load prediction data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedUtility, predictionMethod, isFlat]);

  useEffect(() => { fetchPredictionData(); }, [fetchPredictionData]);

  // Fetch bills when backtester modal opens
  useEffect(() => {
    if (showBacktester && allBills.length === 0) fetchAllBills();
  }, [showBacktester, allBills.length, fetchAllBills]);

  const saveHouseholdFeatures = async () => {
    setSavingHousehold(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("http://localhost:5000/api/users/household-features", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(householdData),
      });
      if (response.ok) {
        alert("✅ Household details saved!");
        setShowHouseholdForm(false);
        setHasHouseholdData(true);
        fetchPredictionData();
      } else { alert("❌ Failed to save. Please try again."); }
    } catch (error) { alert("❌ Error saving."); }
    finally { setSavingHousehold(false); }
  };

  useEffect(() => {
    const loadHouseholdFeatures = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await fetch("http://localhost:5000/api/users/household-features", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          if (data && (data.electricity || data.water)) {
            setHouseholdData({
              electricity: { num_ac:data.electricity?.num_ac||0, ac_type:data.electricity?.ac_type||"non_inverter", num_refrigerators:data.electricity?.num_refrigerators||1, fridge_age_years:data.electricity?.fridge_age_years||5, num_tvs:data.electricity?.num_tvs||1, num_computers:data.electricity?.num_computers||0, has_electric_water_heater:data.electricity?.has_electric_water_heater||false, has_washing_machine:data.electricity?.has_washing_machine||false, has_solar:data.electricity?.has_solar||false, has_electric_vehicle:data.electricity?.has_electric_vehicle||false, num_floors:data.electricity?.num_floors||1, house_area_sqft:data.electricity?.house_area_sqft||1000 },
              water: { num_bathrooms:data.water?.num_bathrooms||1, num_people:data.water?.num_people||1, has_water_heater:data.water?.has_water_heater||false, has_washing_machine:data.water?.has_washing_machine||false, has_garden:data.water?.has_garden||false, has_pool:data.water?.has_pool||false, has_water_tank:data.water?.has_water_tank||false, building_type:data.water?.building_type||"house" },
            });
            setHasHouseholdData(true);
          } else {
            setHasHouseholdData(false);
          }
        } else {
          setHasHouseholdData(false);
        }
      } catch (error) {
        setHasHouseholdData(false);
      }
    };
    loadHouseholdFeatures();
  }, []);

  const prediction = useMemo(() => {
    if (!predictionData) return { predictedUnits:0, predictedAmount:0, percentChange:0, amountChange:0, confidence:"Low", explanation:"No data available.", currentUnits:0, currentAmount:0, dataPoints:0 };
    return predictionData;
  }, [predictionData]);

  const stats = useMemo(() => historyData?.stats || null, [historyData]);
  const nextMonthLabel = prediction.nextMonth || "Next Month";
  const confColor = { Low:C.red, Medium:C.amber, High:C.green }[prediction.confidence] || C.muted;
  const isUp = prediction.percentChange > 0;
  const isAmtUp = prediction.amountChange > 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const isForecast = label?.includes("›");
    return (
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 16px", boxShadow:C.s3, fontFamily:F, minWidth:180 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <span style={{ fontSize:"0.78rem", fontWeight:700, color:C.ink }}>{label?.replace(" ›","")}</span>
          {isForecast && <span style={{ fontSize:"0.65rem", fontWeight:700, background:C.violetL, color:C.violet, border:`1px solid ${C.violetM}`, padding:"1px 7px", borderRadius:20 }}>Forecast</span>}
        </div>
        {payload.filter(p=>p.value!==null).map((p,i)=>(
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:i<payload.length-1?4:0 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:p.color, display:"inline-block" }}/>
            <span style={{ fontSize:"0.75rem", color:C.muted, flex:1 }}>{p.name}</span>
            <span style={{ fontSize:"0.8rem", fontWeight:700, color:C.ink }}>
              {p.name==="Usage"?`${p.value} ${utilUnit}`:`Rs. ${p.value.toLocaleString()}`}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const ax = { fill:C.faint, fontSize:11, fontFamily:F };

  const fmtMonthKey = (key) => {
    if (!key) return "";
    const [y, m] = key.split("-");
    return `${MONTH_NAMES[parseInt(m,10)-1]} ${y}`;
  };

  const btSummary = useMemo(() => {
    if (!btAllResults.length) return null;
    const errors = btAllResults.filter(r=>r.errorPct!==null).map(r=>Math.abs(r.errorPct));
    const mape = errors.length ? Math.round(errors.reduce((a,b)=>a+b,0)/errors.length) : null;
    const overEstimated = btAllResults.filter(r=>r.errorPct>0).length;
    const underEstimated = btAllResults.filter(r=>r.errorPct<0).length;
    return { mape, accuracy: mape!==null?100-mape:null, overEstimated, underEstimated, total:btAllResults.length };
  }, [btAllResults]);

  // ─────────────────────────────────────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, color:C.ink, padding:"28px 32px 64px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, color:C.muted }}>
            <div style={{ width:18, height:18, border:`2px solid ${C.border}`, borderTopColor:C.blue, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
            Loading prediction data...
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, color:C.ink, padding:"28px 32px 64px", transition:"background 0.3s ease, color 0.3s ease" }}>

      {/* ── PAGE HEADER ──────────────────────────────────────────────────────── */}
      <div className="p-fu p-fu1" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:20 }}>
        <div>
          <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:C.ink, margin:"0 0 5px", letterSpacing:"-0.03em" }}>Bill Predictions</h1>
          <p style={{ fontSize:"0.85rem", color:C.muted, margin:0 }}>Estimate next month's consumption and cost from your historical data</p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"12px 18px", boxShadow:C.s1 }}>
            <div style={{ color:C.violet, display:"flex" }}><FiCalendar size={20}/></div>
            <div>
              <span style={{ display:"block", fontSize:"0.65rem", fontWeight:700, color:C.faint, letterSpacing:"0.05em", textTransform:"uppercase" }}>Forecasting for</span>
              <span style={{ display:"block", fontSize:"0.95rem", fontWeight:800, color:C.ink, marginTop:1 }}>{nextMonthLabel}</span>
            </div>
          </div>
          <button
            onClick={() => setShowBacktester(true)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px", borderRadius: 10, border: `1px solid ${C.amberM}`,
              background: C.amberL, color: C.amber, fontFamily: F,
              fontSize: "0.78rem", fontWeight: 700, cursor: "pointer"
            }}>
            <FiClock size={14}/> Test Past Accuracy
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* BACKTESTER MODAL                                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {showBacktester && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: C.page, borderRadius: 20, maxWidth: "1200px", width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: C.ink, margin: 0 }}>Prediction Backtester</h2>
                <p style={{ fontSize: "0.9rem", color: C.muted, margin: "4px 0 0" }}>Test past accuracy by simulating what the model would have predicted</p>
              </div>
              <button
                onClick={() => setShowBacktester(false)}
                style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, color: C.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: "24px 28px" }}>
              {/* Explainer banner */}
              <div className="p-fu p-fu1" style={{ background:`linear-gradient(135deg, ${C.amberL}, ${C.card})`, border:`1px solid ${C.amberM}`, borderRadius:16, padding:"20px 24px", marginBottom:20 }}>
                <div style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                  <div style={{ fontSize:"2rem", flexShrink:0 }}>🕐</div>
                  <div>
                    <h3 style={{ fontSize:"1rem", fontWeight:800, color:C.ink, margin:"0 0 6px" }}>Prediction Time Machine</h3>
                    <p style={{ fontSize:"0.82rem", color:C.body, margin:0, lineHeight:1.7 }}>
                      Go back in time and see what the model <em>would have</em> predicted for any past month — 
                      using only the data that existed before that month. Compare it to what actually happened.
                      This is how you verify that a code change (like updating April's cultural factor) actually improves accuracy.
                    </p>
                  </div>
                </div>
              </div>

          {/* Controls */}
          <div className="p-fu p-fu2" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 24px", marginBottom:20, boxShadow:C.s1 }}>
            <h3 style={{ fontSize:"0.78rem", fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em", margin:"0 0 16px" }}>Simulation Controls</h3>
            <div style={{ display:"flex", flexWrap:"wrap", gap:16, alignItems:"flex-end" }}>

              {/* Utility */}
              <div>
                <label style={{ fontSize:"0.7rem", fontWeight:700, color:C.faint, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Utility</label>
                <div style={{ display:"flex", gap:6 }}>
                  {["Electricity","Water"].map(u => {
                    const m = UTIL_META[u];
                    const active = btUtility === u;
                    return (
                      <button key={u} onClick={()=>{ setBtUtility(u); setBtTargetMonth(""); setBtResult(null); setBtAllResults([]); }}
                        style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:10, fontFamily:F, fontSize:"0.82rem", fontWeight:600, cursor:"pointer",
                          border:`1.5px solid ${active?m.color:C.border}`, background:active?m.bg:"transparent", color:active?m.color:C.muted, transition:"all .15s" }}>
                        {m.icon(14)} {u}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target month */}
              <div>
                <label style={{ fontSize:"0.7rem", fontWeight:700, color:C.faint, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Target Month to Predict</label>
                {btLoadingBills ? (
                  <div style={{ display:"flex", alignItems:"center", gap:8, color:C.muted, fontSize:"0.8rem" }}>
                    <div style={{ width:14, height:14, border:`2px solid ${C.border}`, borderTopColor:C.amber, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
                    Loading bills...
                  </div>
                ) : btAvailableMonths.length === 0 ? (
                  <p style={{ fontSize:"0.78rem", color:C.red, margin:0 }}>No past months with prior data. Add more bills.</p>
                ) : (
                  <select value={btTargetMonth} onChange={e=>{ setBtTargetMonth(e.target.value); setBtResult(null); }}
                    style={{ padding:"9px 36px 9px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, background:C.card, color:C.body, fontFamily:F, fontSize:"0.875rem", fontWeight:500, cursor:"pointer", outline:"none", appearance:"none", minWidth:200 }}>
                    <option value="">— pick a month —</option>
                    {btAvailableMonths.map(m=>(
                      <option key={m} value={m}>{fmtMonthKey(m)}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Run buttons */}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={runBacktest} disabled={!btTargetMonth||btRunning}
                  style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 20px", borderRadius:10, fontFamily:F, fontSize:"0.85rem", fontWeight:700, cursor:(!btTargetMonth||btRunning)?"not-allowed":"pointer",
                    border:"none", background:(!btTargetMonth||btRunning)?C.border:C.amber, color:(!btTargetMonth||btRunning)?C.muted:"#fff", transition:"all .15s" }}>
                  {btRunning?<div style={{ width:14, height:14, border:"2px solid rgba(255,255,255,.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>:<FiPlay size={14}/>}
                  Simulate
                </button>
                <button onClick={runFullBacktest} disabled={btAvailableMonths.length===0||btRunning}
                  style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 20px", borderRadius:10, fontFamily:F, fontSize:"0.85rem", fontWeight:700,
                    cursor:(btAvailableMonths.length===0||btRunning)?"not-allowed":"pointer",
                    border:`1.5px solid ${C.border}`, background:"transparent", color:C.muted, transition:"all .15s" }}>
                  <FiRefreshCw size={14}/> Run All Months
                </button>
              </div>
            </div>
          </div>

          {/* Single month result */}
          {btResult && (
            <div className="p-fu p-fu2" style={{ marginBottom:20 }}>
              <h3 style={{ fontSize:"0.78rem", fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em", margin:"0 0 14px" }}>
                Simulation Result — {fmtMonthKey(btResult.monthKey)}
              </h3>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14 }}>

                {/* Predicted */}
                <div className="bt-card" style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`3px solid ${C.amber}`, borderRadius:16, padding:"20px 22px", boxShadow:C.s1, transition:"transform .18s, box-shadow .18s" }}>
                  <p style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:C.amber, margin:"0 0 8px" }}>🤖 Model Would Have Predicted</p>
                  <p style={{ fontSize:"2rem", fontWeight:800, color:C.ink, margin:"0 0 4px", letterSpacing:"-1px" }}>Rs. {btResult.predictedAmount.toLocaleString()}</p>
                  <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>{btResult.model} · {btResult.confidence} confidence</p>
                </div>

                {/* Actual */}
                <div className="bt-card" style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`3px solid ${btResult.actualAmount?C.green:C.faint}`, borderRadius:16, padding:"20px 22px", boxShadow:C.s1, transition:"transform .18s, box-shadow .18s" }}>
                  <p style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:btResult.actualAmount?C.green:C.faint, margin:"0 0 8px" }}>✅ Actual Bill</p>
                  {btResult.actualAmount ? (
                    <>
                      <p style={{ fontSize:"2rem", fontWeight:800, color:C.ink, margin:"0 0 4px", letterSpacing:"-1px" }}>Rs. {btResult.actualAmount.toLocaleString()}</p>
                      <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>Real bill you entered</p>
                    </>
                  ) : (
                    <p style={{ fontSize:"1rem", fontWeight:700, color:C.faint, margin:0 }}>Not recorded</p>
                  )}
                </div>

                {/* Error */}
                {btResult.actualAmount && (() => {
                  const errPct = Math.round(((btResult.predictedAmount - btResult.actualAmount) / btResult.actualAmount) * 100);
                  const errAbs = Math.abs(btResult.predictedAmount - btResult.actualAmount);
                  const isOver = errPct > 0;
                  const good = Math.abs(errPct) <= 10;
                  return (
                    <div className="bt-card" style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`3px solid ${good?C.green:Math.abs(errPct)<=20?C.amber:C.red}`, borderRadius:16, padding:"20px 22px", boxShadow:C.s1, transition:"transform .18s, box-shadow .18s" }}>
                      <p style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:good?C.green:Math.abs(errPct)<=20?C.amber:C.red, margin:"0 0 8px" }}>
                        {good?"✅":"⚠️"} Prediction Error
                      </p>
                      <p style={{ fontSize:"2rem", fontWeight:800, color:C.ink, margin:"0 0 4px", letterSpacing:"-1px" }}>
                        {isOver?"+":""}{errPct}%
                      </p>
                      <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>
                        {isOver?"Over-estimated":"Under-estimated"} by Rs. {errAbs.toLocaleString()}
                      </p>
                    </div>
                  );
                })()}

                {/* Factor breakdown */}
                <div className="bt-card" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"20px 22px", boxShadow:C.s1, transition:"transform .18s, box-shadow .18s" }}>
                  <p style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:C.violet, margin:"0 0 12px" }}>🔬 Factor Breakdown</p>
                  {[
                    { label:"Base prediction",   val:`Rs. ${btResult.basePrediction.toLocaleString()}` },
                    { label:"Cultural factor",   val:`× ${btResult.culturalFactor}`, sub:`(${btResult.monthName})` },
                    { label:"Weather factor",    val:`× ${btResult.weatherFactor}` },
                    { label:"Combined factor",   val:`× ${btResult.externalFactor}` },
                    { label:"Data used",         val:`${btResult.dataMonths} months` },
                  ].map((row,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:i<4?`1px solid ${C.border}`:"none" }}>
                      <span style={{ fontSize:"0.72rem", color:C.muted }}>{row.label} {row.sub&&<span style={{ color:C.faint }}>{row.sub}</span>}</span>
                      <span style={{ fontSize:"0.78rem", fontWeight:700, color:C.ink, fontFamily:"monospace" }}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Full history results */}
          {btAllResults.length > 0 && (
            <div className="p-fu p-fu3">
              {/* Summary */}
              {btSummary && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginBottom:20 }}>
                  {[
                    { label:"Avg Error (MAPE)", val:`${btSummary.mape}%`, color:btSummary.mape<=10?C.green:btSummary.mape<=20?C.amber:C.red },
                    { label:"Model Accuracy",   val:`${btSummary.accuracy}%`, color:btSummary.accuracy>=90?C.green:btSummary.accuracy>=80?C.amber:C.red },
                    { label:"Months Tested",    val:btSummary.total, color:C.violet },
                    { label:"Over-estimated",   val:btSummary.overEstimated, color:C.red },
                    { label:"Under-estimated",  val:btSummary.underEstimated, color:C.amber },
                  ].map((s,i)=>(
                    <div key={i} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, padding:"16px 18px", boxShadow:C.s1 }}>
                      <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:C.faint, margin:"0 0 6px" }}>{s.label}</p>
                      <p style={{ fontSize:"1.5rem", fontWeight:800, color:s.color, margin:0, letterSpacing:"-0.5px" }}>{s.val}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bar chart: predicted vs actual */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px", marginBottom:20, boxShadow:C.s1 }}>
                <h3 style={{ fontSize:"0.78rem", fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em", margin:"0 0 16px" }}>Predicted vs Actual — All Months</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={btAllResults.map(r=>({ month:fmtMonthKey(r.monthKey).split(" ")[0].slice(0,3)+" '"+fmtMonthKey(r.monthKey).split(" ")[1].slice(2), predicted:r.predictedAmount, actual:r.actualAmount }))} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="4 4" stroke={C.border} vertical={false}/>
                    <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                    <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                    <Tooltip formatter={(v,n)=>[`Rs. ${v?.toLocaleString()}`,n]} contentStyle={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10, fontFamily:F, fontSize:"0.78rem" }}/>
                    <Bar dataKey="actual"    name="Actual"    fill={C.green} radius={[4,4,0,0]}/>
                    <Bar dataKey="predicted" name="Predicted" fill={C.amber} radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Detail table */}
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"22px 24px", boxShadow:C.s1, overflowX:"auto" }}>
                <h3 style={{ fontSize:"0.78rem", fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em", margin:"0 0 14px" }}>Month-by-Month Breakdown</h3>
                <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:F }}>
                  <thead>
                    <tr style={{ background:C.hover }}>
                      {["Month","Model","Data","Cultural ×","Predicted","Actual","Error","Status"].map(h=>(
                        <th key={h} style={{ padding:"10px 14px", fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:C.faint, textAlign:"left", whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {btAllResults.map((r,i)=>{
                      const errPct = r.errorPct;
                      const good = errPct!==null && Math.abs(errPct)<=10;
                      const ok   = errPct!==null && Math.abs(errPct)<=20;
                      const statusColor = errPct===null?C.faint:good?C.green:ok?C.amber:C.red;
                      const statusLabel = errPct===null?"N/A":good?"✅ Accurate":ok?"⚠️ Off":errPct>0?"🔴 Over":"🔴 Under";
                      return (
                        <tr key={i} style={{ borderBottom:`1px solid ${C.border}`, background:i%2===0?"transparent":C.hover+"66" }}>
                          <td style={{ padding:"10px 14px", fontSize:"0.8rem", fontWeight:600, color:C.ink, whiteSpace:"nowrap" }}>{fmtMonthKey(r.monthKey)}</td>
                          <td style={{ padding:"10px 14px", fontSize:"0.72rem", color:C.muted, whiteSpace:"nowrap" }}>{r.model.split(" ")[0]} {r.model.split(" ")[1]}</td>
                          <td style={{ padding:"10px 14px", fontSize:"0.78rem", fontWeight:600, color:C.body }}>{r.dataMonths}mo</td>
                          <td style={{ padding:"10px 14px", fontSize:"0.78rem", fontFamily:"monospace", color:C.violet, fontWeight:700 }}>×{r.culturalFactor}</td>
                          <td style={{ padding:"10px 14px", fontSize:"0.8rem", fontFamily:"monospace", fontWeight:700, color:C.amber }}>Rs. {r.predictedAmount?.toLocaleString()}</td>
                          <td style={{ padding:"10px 14px", fontSize:"0.8rem", fontFamily:"monospace", fontWeight:700, color:C.green }}>{r.actualAmount?`Rs. ${r.actualAmount.toLocaleString()}`:"—"}</td>
                          <td style={{ padding:"10px 14px", fontSize:"0.78rem", fontFamily:"monospace", fontWeight:700, color:statusColor }}>
                            {errPct!==null?`${errPct>0?"+":""}${errPct}%`:"—"}
                          </td>
                          <td style={{ padding:"10px 14px", fontSize:"0.72rem", fontWeight:700, color:statusColor, whiteSpace:"nowrap" }}>{statusLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

              {/* Empty state */}
              {!btResult && btAllResults.length===0 && !btRunning && (
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"48px 32px", textAlign:"center", boxShadow:C.s1 }}>
                  <p style={{ fontSize:"3rem", margin:"0 0 12px" }}>🕐</p>
                  <h3 style={{ fontSize:"1.1rem", fontWeight:700, color:C.ink, margin:"0 0 8px" }}>Ready to Simulate</h3>
                  <p style={{ fontSize:"0.85rem", color:C.muted, margin:0 }}>
                    Pick a utility and a past month above, then click <strong>Simulate</strong> to see what the model would have predicted.<br/>
                    Or click <strong>Run All Months</strong> to check accuracy across your entire history.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* PREDICTIONS CONTENT                                                  */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <>
        {(error || (!predictionData && !loading)) ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"40vh", flexDirection:"column", gap:16 }}>
            <div style={{ textAlign:"center", padding:"60px 40px", background:C.card, borderRadius:18, border:`1px solid ${C.border}`, boxShadow:C.s1, maxWidth:500 }}>
              <div style={{ fontSize:"3.5rem", margin:"0 0 8px" }}>
                {selectedUtility === "Internet" ? "📡" : "📭"}
              </div>
              <h3 style={{ fontSize:"1.2rem", color:C.ink, margin:"0 0 8px", fontWeight:700 }}>
                {selectedUtility === "Internet" ? "No Internet Bills Yet" : "No Data Available"}
              </h3>
              <p style={{ color:C.muted, margin:"0 0 20px", lineHeight:1.6 }}>
                {selectedUtility === "Internet" 
                  ? "Add your internet bills to start seeing predictions."
                  : error || `Add some ${selectedUtility.toLowerCase()} bills to generate predictions.`}
              </p>

              {/* Utility switcher buttons */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20, flexWrap:"wrap" }}>
                <span style={{ fontSize:"0.75rem", color:C.muted }}>Switch to:</span>
                {Object.entries(UTIL_META).map(([key, m]) => (
                  key !== selectedUtility && (
                    <button
                      key={key}
                      onClick={() => setSelectedUtility(key)}
                      style={{
                        display:"flex", alignItems:"center", gap:6,
                        padding:"8px 16px", borderRadius:10,
                        border:`1.5px solid ${m.bdr}`, background:m.bg, color:m.color,
                        fontFamily:F, fontSize:"0.82rem", fontWeight:600,
                        cursor:"pointer", transition:"all .15s"
                      }}
                    >
                      {m.icon(14)} {key}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={fetchPredictionData}
                style={{
                  padding:"8px 20px", borderRadius:8,
                  background:C.blue, color:"#fff", border:"none",
                  cursor:"pointer", fontFamily:F, fontSize:"0.82rem", fontWeight:600
                }}
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
            <>
              {/* CONTROLS */}
              <div className="p-fu p-fu2" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14, marginBottom:22 }}>
                <div style={{ display:"flex", background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:4, gap:3 }}>
                  {Object.entries(UTIL_META).map(([key,m])=>{
                    const active = selectedUtility===key;
                    return (
                      <button key={key} className={`p-util${active?" active":""}`} onClick={()=>setSelectedUtility(key)}
                        style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 18px", borderRadius:9,
                          border:active?`1px solid ${m.bdr}`:"1px solid transparent",
                          background:active?m.bg:"transparent", color:active?m.color:C.muted,
                          fontFamily:F, fontWeight:600, fontSize:"0.875rem", cursor:"pointer", transition:"all .15s" }}>
                        {m.icon(15)} {key}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <label style={{ fontSize:"0.78rem", fontWeight:600, color:C.muted }}>Method</label>
                  <div style={{ position:"relative" }}>
                    <select value={predictionMethod} onChange={e=>setPredictionMethod(e.target.value)}
                      style={{ padding:"8px 36px 8px 14px", borderRadius:10, border:`1.5px solid ${C.border}`, background:C.card, color:C.body, fontFamily:F, fontSize:"0.875rem", fontWeight:500, cursor:"pointer", outline:"none", appearance:"none" }}
                      onFocus={e=>{e.target.style.borderColor=C.blue; e.target.style.boxShadow=`0 0 0 3px ${C.blueM}55`;}}
                      onBlur={e=>{e.target.style.borderColor=C.border; e.target.style.boxShadow="none";}}>
                      <option value="simple">Simple Average</option>
                      <option value="weighted">Weighted Average</option>
                      <option value="trend">Linear Trend</option>
                    </select>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* HOUSEHOLD FEATURES */}
              <div className="p-fu p-fu2" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px 20px", marginBottom:22, boxShadow:C.s1 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:C.indigoL, display:"flex", alignItems:"center", justifyContent:"center", color:C.indigo }}><FiHome size={18}/></div>
                    <div>
                      <h4 style={{ fontSize:"0.85rem", fontWeight:700, color:C.ink, margin:0 }}>Household Details</h4>
                      <p style={{ fontSize:"0.7rem", color:C.muted, margin:0 }}>Help us improve predictions with your home info</p>
                    </div>
                  </div>
                  <button onClick={()=>setShowHouseholdForm(!showHouseholdForm)}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:20, border:`1px solid ${C.border}`, background:C.hover, color:C.ink, fontSize:"0.75rem", fontWeight:500, cursor:"pointer" }}>
                    {showHouseholdForm?"− Hide":"+ Add Details"}
                  </button>
                </div>
                {showHouseholdForm && (
                  <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
                    <div style={{ display:"flex", gap:8, marginBottom:20, borderBottom:`1px solid ${C.border}`, paddingBottom:8 }}>
                      {[{k:"electricity",l:"⚡ Electricity",c:C.blue},{k:"water",l:"💧 Water",c:C.teal},{k:"general",l:"🏠 General",c:C.amber}].map(t=>(
                        <button key={t.k} onClick={()=>setActiveTab(t.k)}
                          style={{ padding:"6px 16px", borderRadius:20, fontSize:"0.75rem", fontWeight:600, cursor:"pointer", border:"none", background:activeTab===t.k?t.c:"transparent", color:activeTab===t.k?"#fff":C.muted }}>
                          {t.l}
                        </button>
                      ))}
                    </div>
                    {activeTab==="electricity" && (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 }}>
                        {[
                          {label:"Number of ACs",field:"num_ac",type:"number"},
                          {label:"AC Type",field:"ac_type",type:"select",options:[{v:"inverter",l:"Inverter"},{v:"non_inverter",l:"Non-Inverter"}]},
                          {label:"Number of Refrigerators",field:"num_refrigerators",type:"number"},
                          {label:"Fridge Age (years)",field:"fridge_age_years",type:"number"},
                          {label:"Number of TVs",field:"num_tvs",type:"number"},
                          {label:"Has Solar Panels?",field:"has_solar",type:"bool"},
                          {label:"Has Electric Vehicle?",field:"has_electric_vehicle",type:"bool"},
                        ].map(f=>(
                          <div key={f.field}>
                            <label style={{ fontSize:"0.7rem", fontWeight:600, color:C.muted, display:"block", marginBottom:4 }}>{f.label}</label>
                            {f.type==="number"?<input type="number" min="0" value={householdData.electricity[f.field]} onChange={e=>setHouseholdData({...householdData,electricity:{...householdData.electricity,[f.field]:parseInt(e.target.value)||0}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}/>
                            :f.type==="select"?<select value={householdData.electricity[f.field]} onChange={e=>setHouseholdData({...householdData,electricity:{...householdData.electricity,[f.field]:e.target.value}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}>{f.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
                            :<select value={householdData.electricity[f.field]} onChange={e=>setHouseholdData({...householdData,electricity:{...householdData.electricity,[f.field]:e.target.value==="true"}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}><option value="false">No</option><option value="true">Yes</option></select>}
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab==="water" && (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 }}>
                        {[
                          {label:"Number of Bathrooms",field:"num_bathrooms",type:"number"},
                          {label:"Number of People",field:"num_people",type:"number"},
                          {label:"Has Water Heater?",field:"has_water_heater",type:"bool"},
                          {label:"Has Washing Machine?",field:"has_washing_machine",type:"bool"},
                          {label:"Has Garden?",field:"has_garden",type:"bool"},
                          {label:"Has Swimming Pool?",field:"has_pool",type:"bool"},
                        ].map(f=>(
                          <div key={f.field}>
                            <label style={{ fontSize:"0.7rem", fontWeight:600, color:C.muted, display:"block", marginBottom:4 }}>{f.label}</label>
                            {f.type==="number"?<input type="number" min="1" value={householdData.water[f.field]} onChange={e=>setHouseholdData({...householdData,water:{...householdData.water,[f.field]:parseInt(e.target.value)||1}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}/>
                            :<select value={householdData.water[f.field]} onChange={e=>setHouseholdData({...householdData,water:{...householdData.water,[f.field]:e.target.value==="true"}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}><option value="false">No</option><option value="true">Yes</option></select>}
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab==="general" && (
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 }}>
                        <div>
                          <label style={{ fontSize:"0.7rem", fontWeight:600, color:C.muted, display:"block", marginBottom:4 }}>Building Type</label>
                          <select value={householdData.water.building_type} onChange={e=>setHouseholdData({...householdData,water:{...householdData.water,building_type:e.target.value}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}>
                            {["house","apartment","restaurant","hotel","office"].map(v=><option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize:"0.7rem", fontWeight:600, color:C.muted, display:"block", marginBottom:4 }}>Number of Floors</label>
                          <input type="number" min="1" value={householdData.electricity.num_floors} onChange={e=>setHouseholdData({...householdData,electricity:{...householdData.electricity,num_floors:parseInt(e.target.value)||1}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}/>
                        </div>
                        <div>
                          <label style={{ fontSize:"0.7rem", fontWeight:600, color:C.muted, display:"block", marginBottom:4 }}>House Area (sq ft)</label>
                          <input type="number" min="0" value={householdData.electricity.house_area_sqft} onChange={e=>setHouseholdData({...householdData,electricity:{...householdData.electricity,house_area_sqft:parseInt(e.target.value)||0}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}/>
                        </div>
                      </div>
                    )}
                    <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:20, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
                      <button onClick={saveHouseholdFeatures} disabled={savingHousehold}
                        style={{ padding:"10px 28px", borderRadius:10, background:C.green, color:"#fff", border:"none", fontSize:"0.85rem", fontWeight:600, cursor:"pointer" }}>
                        {savingHousehold?"Saving...":"💾 Save Household Details"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* HERO CARDS */}
              <div className="p-fu p-fu3" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:20 }}>
                <div className="p-hbc" style={{ background:C.card, border:`1px solid ${C.border}`, borderTop:`4px solid ${utilColor}`, borderRadius:18, padding:24, boxShadow:C.s2, transition:"transform .22s ease, box-shadow .22s ease" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
                    <div style={{ width:52, height:52, borderRadius:14, background:`${utilColor}14`, display:"flex", alignItems:"center", justifyContent:"center", color:utilColor, flexShrink:0 }}>{meta.icon(26)}</div>
                    <div>
                      <div style={{ fontSize:"0.78rem", fontWeight:600, color:C.muted, marginBottom:4 }}>Predicted Bill · {nextMonthLabel}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:"0.75rem", fontWeight:700, color:confColor }}>
                        <FiShield size={12}/> {prediction.confidence} Confidence
                      </div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:18 }}>
                    <span style={{ fontSize:"1.1rem", fontWeight:700, color:C.muted }}>Rs.</span>
                    <span style={{ fontSize:"3rem", fontWeight:800, color:C.ink, letterSpacing:"-2px", lineHeight:1 }}>{prediction.predictedAmount?.toLocaleString()||0}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18, flexWrap:"wrap" }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"5px 12px", borderRadius:20, fontSize:"0.75rem", fontWeight:700, background:isAmtUp?C.redL:C.greenL, border:`1px solid ${isAmtUp?C.redM:C.greenM}`, color:isAmtUp?C.red:C.green }}>
                      {isAmtUp?<FiArrowUp size={11}/>:<FiArrowDown size={11}/>} {Math.abs(prediction.amountChange)}% vs last month
                    </span>
                    <span style={{ fontSize:"0.8rem", color:C.faint }}>Last month: Rs. {prediction.currentAmount?.toLocaleString()||0}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                    {[1,2,3,4,5,6].map(i=>(
                      <span key={i} style={{ display:"inline-block", width:30, height:6, borderRadius:3, background:(prediction.dataPoints||0)>=i?confColor:C.border, transition:"background .3s" }}/>
                    ))}
                    <span style={{ fontSize:"0.7rem", color:C.faint, marginLeft:4 }}>{prediction.dataPoints||0} months of data</span>
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  {!isFlat && (
                    <div className="p-sc" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:18, display:"flex", alignItems:"flex-start", gap:12, boxShadow:C.s1, transition:"transform .15s, box-shadow .15s" }}>
                      <div style={{ width:38, height:38, borderRadius:10, background:`${utilColor}12`, display:"flex", alignItems:"center", justifyContent:"center", color:utilColor, flexShrink:0 }}>{meta.icon(17)}</div>
                      <div>
                        <span style={{ display:"block", fontSize:"0.65rem", fontWeight:700, color:C.faint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>Predicted Usage</span>
                        <div style={{ fontSize:"1.25rem", fontWeight:800, letterSpacing:"-0.5px", marginBottom:4, color:utilColor }}>{prediction.predictedUnits||0}<span style={{ fontSize:"0.8rem", fontWeight:500, color:C.faint }}> {utilUnit}</span></div>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontSize:"0.68rem", fontWeight:700, padding:"2px 7px", borderRadius:20, background:isUp?C.redL:C.greenL, border:`1px solid ${isUp?C.redM:C.greenM}`, color:isUp?C.red:C.green }}>
                          {isUp?<FiArrowUp size={10}/>:<FiArrowDown size={10}/>} {Math.abs(prediction.percentChange)}% vs last month
                        </span>
                      </div>
                    </div>
                  )}
                  {stats && (
                    <>
                      <div className="p-sc" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:18, display:"flex", alignItems:"flex-start", gap:12, boxShadow:C.s1, transition:"transform .15s, box-shadow .15s" }}>
                        <div style={{ width:38, height:38, borderRadius:10, background:C.amberL, display:"flex", alignItems:"center", justifyContent:"center", color:C.amber, flexShrink:0 }}><FiBarChart2 size={17}/></div>
                        <div>
                          <span style={{ display:"block", fontSize:"0.65rem", fontWeight:700, color:C.faint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>Avg Monthly Bill</span>
                          <div style={{ fontSize:"1.25rem", fontWeight:800, letterSpacing:"-0.5px", marginBottom:4, color:C.amber }}>Rs. {stats.avgMonthlyBill?.toLocaleString()||0}</div>
                          <span style={{ fontSize:"0.7rem", color:C.faint }}>Over {stats.totalBills||0} months</span>
                        </div>
                      </div>
                      {!isFlat && (
                        <div className="p-sc" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:18, display:"flex", alignItems:"flex-start", gap:12, boxShadow:C.s1, transition:"transform .15s, box-shadow .15s" }}>
                          <div style={{ width:38, height:38, borderRadius:10, background:C.greenL, display:"flex", alignItems:"center", justifyContent:"center", color:C.green, flexShrink:0 }}><FiStar size={17}/></div>
                          <div>
                            <span style={{ display:"block", fontSize:"0.65rem", fontWeight:700, color:C.faint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>Rate per {utilUnit}</span>
                            <div style={{ fontSize:"1.25rem", fontWeight:800, letterSpacing:"-0.5px", marginBottom:4, color:C.green }}>Rs. {stats.costPerUnit||0}</div>
                            <span style={{ fontSize:"0.7rem", color:C.faint }}>Based on last month</span>
                          </div>
                        </div>
                      )}
                      <div className="p-sc" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, padding:18, display:"flex", alignItems:"flex-start", gap:12, boxShadow:C.s1, transition:"transform .15s, box-shadow .15s" }}>
                        <div style={{ width:38, height:38, borderRadius:10, background:C.violetL, display:"flex", alignItems:"center", justifyContent:"center", color:C.violet, flexShrink:0 }}><FiTrendingUp size={17}/></div>
                        <div>
                          <span style={{ display:"block", fontSize:"0.65rem", fontWeight:700, color:C.faint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>Overall Trend</span>
                          <div style={{ fontSize:"1.25rem", fontWeight:800, letterSpacing:"-0.5px", marginBottom:4, color:(stats.overallTrend||0)>0?C.red:(stats.overallTrend||0)<0?C.green:C.muted }}>
                            {(stats.overallTrend||0)>0?"+":""}{stats.overallTrend||0}%
                          </div>
                          <span style={{ fontSize:"0.7rem", color:C.faint }}>Usage · recent vs earlier</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* CHART */}
              <div className="p-fu p-fu4" style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:"22px 24px", marginBottom:20, boxShadow:C.s1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:18 }}>
                  <div>
                    <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>
                      {isFlat?"Bill History":"Usage & Bill History"} — with {nextMonthLabel} Forecast
                    </h3>
                    <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>Shaded area is forecast · Dashed line marks the prediction boundary</p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:14, fontSize:"0.72rem", color:C.muted, flexWrap:"wrap" }}>
                    {!isFlat&&<span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:10, height:10, borderRadius:"50%", background:utilColor, display:"inline-block" }}/>Usage ({utilUnit})</span>}
                    <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:10, height:10, borderRadius:"50%", background:C.amber, display:"inline-block" }}/>Bill (Rs.)</span>
                    <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:18, height:0, borderBottom:`2.5px dashed ${utilColor}`, display:"inline-block" }}/>Forecast</span>
                  </div>
                </div>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData} margin={{ top:10, right:16, left:0, bottom:0 }}>
                      <defs>
                        <linearGradient id="pgU" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={utilColor} stopOpacity={0.12}/><stop offset="95%" stopColor={utilColor} stopOpacity={0.01}/></linearGradient>
                        <linearGradient id="pgA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.amber} stopOpacity={0.10}/><stop offset="95%" stopColor={C.amber} stopOpacity={0.01}/></linearGradient>
                        <linearGradient id="pgF" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={utilColor} stopOpacity={0.22}/><stop offset="95%" stopColor={utilColor} stopOpacity={0.04}/></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                      <XAxis dataKey="month" tick={ax} axisLine={{ stroke:C.border }} tickLine={false}/>
                      <YAxis yAxisId="l" tick={ax} axisLine={false} tickLine={false}/>
                      <YAxis yAxisId="r" orientation="right" tick={ax} axisLine={false} tickLine={false}/>
                      <Tooltip content={<CustomTooltip/>}/>
                      {!isFlat&&<Area yAxisId="l" type="monotone" dataKey="units" name={`Usage (${utilUnit})`} stroke={utilColor} strokeWidth={2.5} fill="url(#pgU)" dot={{ r:4, fill:utilColor, strokeWidth:0 }} activeDot={{ r:6 }} connectNulls/>}
                      <Area yAxisId="r" type="monotone" dataKey="amount" name="Bill (Rs.)" stroke={C.amber} strokeWidth={2.5} fill="url(#pgA)" dot={{ r:4, fill:C.amber, strokeWidth:0 }} activeDot={{ r:6 }} connectNulls/>
                      {!isFlat&&<Area yAxisId="l" type="monotone" dataKey="forecast" name="Forecast Usage" stroke={utilColor} strokeWidth={2.5} strokeDasharray="7 4" fill="url(#pgF)" dot={(props)=>{ const{cx,cy,index}=props; if(index!==chartData.length-1)return<g key={index}/>; return<circle key={index} cx={cx} cy={cy} r={7} fill={utilColor} stroke="#fff" strokeWidth={2.5}/>; }} activeDot={{ r:6 }} connectNulls/>}
                      <Area yAxisId="r" type="monotone" dataKey="forecastAmount" name="Forecast Bill" stroke={C.amber} strokeWidth={2.5} strokeDasharray="7 4" fill="url(#pgA)" dot={(props)=>{ const{cx,cy,index}=props; if(index!==chartData.length-1)return<g key={index}/>; return<circle key={index} cx={cx} cy={cy} r={7} fill={C.amber} stroke="#fff" strokeWidth={2.5}/>; }} activeDot={{ r:6 }} connectNulls/>
                      {chartData.length>1&&<ReferenceLine yAxisId="l" x={chartData[chartData.length-2]?.month} stroke={C.violet} strokeDasharray="5 4" strokeWidth={1.5} label={{ value:"Forecast →", fill:C.violet, fontSize:11, position:"insideTopRight", fontFamily:F }}/>}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height:300, display:"flex", alignItems:"center", justifyContent:"center", color:C.muted }}>No chart data available</div>
                )}
              </div>

              {/* BOTTOM GRID */}
              <div className="p-fu p-fu5" style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(380px,1fr))", gap:18 }}>
                {stats && (
                  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:"22px 24px", boxShadow:C.s1 }}>
                    <h3 style={{ display:"flex", alignItems:"center", gap:8, fontSize:"0.875rem", fontWeight:700, color:C.ink, margin:"0 0 18px" }}><FiBarChart2 size={16} color={C.violet}/> Historical Statistics</h3>
                    <div style={{ display:"grid", gridTemplateColumns:`repeat(${isFlat?2:3},1fr)`, gap:1, background:C.border, borderRadius:12, overflow:"hidden" }}>
                      {(isFlat?[
                        {label:"Highest Bill",val:`Rs. ${stats.highestBill?.amount?.toLocaleString()||0}`,sub:stats.highestBill?.month||"N/A",color:C.red},
                        {label:"Lowest Bill",val:`Rs. ${stats.lowestBill?.amount?.toLocaleString()||0}`,sub:stats.lowestBill?.month||"N/A",color:C.green},
                        {label:"Avg Monthly",val:`Rs. ${stats.avgMonthlyBill?.toLocaleString()||0}`,sub:`${stats.totalBills||0} months`,color:C.amber},
                        {label:"Total Spent",val:`Rs. ${stats.totalSpend?.toLocaleString()||0}`,sub:`${stats.totalBills||0} mo. combined`,color:C.violet},
                      ]:[
                        {label:"Highest Bill",val:`Rs. ${stats.highestBill?.amount?.toLocaleString()||0}`,sub:stats.highestBill?.month||"N/A",color:C.red},
                        {label:"Lowest Bill",val:`Rs. ${stats.lowestBill?.amount?.toLocaleString()||0}`,sub:stats.lowestBill?.month||"N/A",color:C.green},
                        {label:"Highest Usage",val:`${stats.highestUsage?.units||0} ${utilUnit}`,sub:stats.highestUsage?.month||"N/A",color:utilColor},
                        {label:"Lowest Usage",val:`${stats.lowestUsage?.units||0} ${utilUnit}`,sub:stats.lowestUsage?.month||"N/A",color:C.muted},
                        {label:"Avg Monthly",val:`Rs. ${stats.avgMonthlyBill?.toLocaleString()||0}`,sub:`${stats.totalBills||0} months`,color:C.amber},
                        {label:"Total Spent",val:`Rs. ${stats.totalSpend?.toLocaleString()||0}`,sub:`${stats.totalBills||0} mo. combined`,color:C.violet},
                      ]).map((s,i)=>(
                        <div key={i} style={{ background:C.card, padding:"16px 14px" }}>
                          <div style={{ fontSize:"0.9rem", fontWeight:800, color:s.color, marginBottom:3 }}>{s.val}</div>
                          <div style={{ fontSize:"0.72rem", fontWeight:600, color:C.body, marginBottom:2 }}>{s.label}</div>
                          <div style={{ fontSize:"0.68rem", color:C.faint }}>{s.sub}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:"22px 24px", boxShadow:C.s1 }}>
                  <h3 style={{ display:"flex", alignItems:"center", gap:8, fontSize:"0.875rem", fontWeight:700, color:C.ink, margin:"0 0 18px" }}><FiInfo size={16} color={C.violet}/> How This Was Calculated</h3>
                  <div style={{ background:C.violetL, border:`1px solid ${C.violetM}`, borderRadius:12, padding:"14px 16px", marginBottom:18 }}>
                    <p style={{ margin:0, fontSize:"0.82rem", color:C.body, lineHeight:1.7 }}>{prediction.explanation||"Based on your historical bill data using the selected prediction method."}</p>
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                    {[{key:"simple",label:"📊 Simple Avg"},{key:"weighted",label:"⚖️ Weighted"},{key:"trend",label:"📈 Trend"}].map(m=>{
                      const active=predictionMethod===m.key;
                      return <button key={m.key} className="p-mpill" onClick={()=>setPredictionMethod(m.key)} style={{ padding:"6px 14px", borderRadius:20, fontFamily:F, fontSize:"0.75rem", fontWeight:600, cursor:"pointer", transition:"all .15s", border:active?`1px solid ${utilColor}55`:`1px solid ${C.border}`, background:active?`${utilColor}14`:C.hover, color:active?utilColor:C.muted }}>{m.label}</button>;
                    })}
                  </div>
                  <p style={{ fontSize:"0.8rem", color:C.muted, margin:"0 0 16px", lineHeight:1.6 }}>
                    {predictionMethod==="simple"?"Treats every month equally. Best for stable, consistent usage with no clear trend."
                    :predictionMethod==="weighted"?"Gives more weight to recent months. Ideal when usage has been gradually changing."
                    :"Extrapolates the direction of change. Best when there's a clear upward or downward trend."}
                  </p>
                  {stats && (
                    <div style={{ display:"flex", alignItems:"flex-start", gap:10, background:C.amberL, border:`1px solid ${C.amberM}`, borderRadius:12, padding:"12px 14px" }}>
                      <FiStar size={14} color={C.amber} style={{ marginTop:2, flexShrink:0 }}/>
                      <p style={{ margin:0, fontSize:"0.8rem", color:C.body, lineHeight:1.6 }}>
                        {(()=>{ const t=stats.overallTrend||0; return t<-5?`${isFlat?"Spend":"Usage"} is trending down ${Math.abs(t)}% — great progress!`:t>5?`${isFlat?"Spend":"Usage"} is trending up ${t}% — consider reviewing your plan options.`:`Your ${isFlat?"monthly spend":"usage"} has been fairly stable across the tracked period.`; })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* HOUSEHOLD DATA POPUP MODAL                                          */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {hasHouseholdData === false && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: C.page, borderRadius: 20, maxWidth: "800px", width: "100%", maxHeight: "90vh", overflow: "auto", boxShadow: "0 25px 50px rgba(0,0,0,0.3)" }}>
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: C.ink, margin: 0 }}>Welcome! Let's Set Up Your Household</h2>
                <p style={{ fontSize: "0.9rem", color: C.muted, margin: "4px 0 0" }}>Help us improve your predictions with some basic household details</p>
              </div>
            </div>

            {/* Modal Content - Use existing household form */}
            <div style={{ padding: "24px 28px" }}>
              <div style={{ display:"flex", gap:8, marginBottom:20, borderBottom:`1px solid ${C.border}`, paddingBottom:8 }}>
                {[{k:"electricity",l:"⚡ Electricity",c:C.blue},{k:"water",l:"💧 Water",c:C.teal},{k:"general",l:"🏠 General",c:C.amber}].map(t=>(
                  <button key={t.k} onClick={()=>setActiveTab(t.k)}
                    style={{ padding:"6px 16px", borderRadius:20, fontSize:"0.75rem", fontWeight:600, cursor:"pointer", border:"none", background:activeTab===t.k?t.c:"transparent", color:activeTab===t.k?"#fff":C.muted }}>
                    {t.l}
                  </button>
                ))}
              </div>

              {/* Form content */}
              {activeTab==="electricity" && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 }}>
                  {[
                    {label:"Number of ACs",field:"num_ac",type:"number"},
                    {label:"AC Type",field:"ac_type",type:"select",options:[{v:"inverter",l:"Inverter"},{v:"non_inverter",l:"Non-Inverter"}]},
                    {label:"Number of Refrigerators",field:"num_refrigerators",type:"number"},
                    {label:"Fridge Age (years)",field:"fridge_age_years",type:"number"},
                    {label:"Number of TVs",field:"num_tvs",type:"number"},
                    {label:"Has Solar Panels?",field:"has_solar",type:"bool"},
                    {label:"Has Electric Vehicle?",field:"has_electric_vehicle",type:"bool"},
                  ].map(f=>(
                    <div key={f.field}>
                      <label style={{ fontSize:"0.7rem", fontWeight:600, color:C.muted, display:"block", marginBottom:4 }}>{f.label}</label>
                      {f.type==="number"?<input type="number" min="0" value={householdData.electricity[f.field]} onChange={e=>setHouseholdData({...householdData,electricity:{...householdData.electricity,[f.field]:parseInt(e.target.value)||0}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}/>
                      :f.type==="select"?<select value={householdData.electricity[f.field]} onChange={e=>setHouseholdData({...householdData,electricity:{...householdData.electricity,[f.field]:e.target.value}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}>{f.options.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select>
                      :<select value={householdData.electricity[f.field]} onChange={e=>setHouseholdData({...householdData,electricity:{...householdData.electricity,[f.field]:e.target.value==="true"}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}><option value="false">No</option><option value="true">Yes</option></select>}
                    </div>
                  ))}
                </div>
              )}

              {activeTab==="water" && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 }}>
                  {[
                    {label:"Number of Bathrooms",field:"num_bathrooms",type:"number"},
                    {label:"Number of People",field:"num_people",type:"number"},
                    {label:"Has Water Heater?",field:"has_water_heater",type:"bool"},
                    {label:"Has Washing Machine?",field:"has_washing_machine",type:"bool"},
                    {label:"Has Garden?",field:"has_garden",type:"bool"},
                    {label:"Has Swimming Pool?",field:"has_pool",type:"bool"},
                  ].map(f=>(
                    <div key={f.field}>
                      <label style={{ fontSize:"0.7rem", fontWeight:600, color:C.muted, display:"block", marginBottom:4 }}>{f.label}</label>
                      {f.type==="number"?<input type="number" min="1" value={householdData.water[f.field]} onChange={e=>setHouseholdData({...householdData,water:{...householdData.water,[f.field]:parseInt(e.target.value)||1}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}/>
                      :<select value={householdData.water[f.field]} onChange={e=>setHouseholdData({...householdData,water:{...householdData.water,[f.field]:e.target.value==="true"}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}><option value="false">No</option><option value="true">Yes</option></select>}
                    </div>
                  ))}
                </div>
              )}

              {activeTab==="general" && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14 }}>
                  <div>
                    <label style={{ fontSize:"0.7rem", fontWeight:600, color:C.muted, display:"block", marginBottom:4 }}>Building Type</label>
                    <select value={householdData.water.building_type} onChange={e=>setHouseholdData({...householdData,water:{...householdData.water,building_type:e.target.value}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}>
                      {["house","apartment","restaurant","hotel","office"].map(v=><option key={v} value={v}>{v.charAt(0).toUpperCase()+v.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize:"0.7rem", fontWeight:600, color:C.muted, display:"block", marginBottom:4 }}>Number of Floors</label>
                    <input type="number" min="1" value={householdData.electricity.num_floors} onChange={e=>setHouseholdData({...householdData,electricity:{...householdData.electricity,num_floors:parseInt(e.target.value)||1}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}/>
                  </div>
                  <div>
                    <label style={{ fontSize:"0.7rem", fontWeight:600, color:C.muted, display:"block", marginBottom:4 }}>House Area (sq ft)</label>
                    <input type="number" min="0" value={householdData.electricity.house_area_sqft} onChange={e=>setHouseholdData({...householdData,electricity:{...householdData.electricity,house_area_sqft:parseInt(e.target.value)||0}})} style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:`1px solid ${C.border}`, background:C.card, color:C.ink }}/>
                  </div>
                </div>
              )}

              <div style={{ display:"flex", justifyContent:"flex-end", gap:10, marginTop:24, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
                <button onClick={saveHouseholdFeatures} disabled={savingHousehold}
                  style={{ padding:"12px 32px", borderRadius:10, background:C.green, color:"#fff", border:"none", fontSize:"0.9rem", fontWeight:600, cursor:"pointer" }}>
                  {savingHousehold?"Saving...":"💾 Save & Continue"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Prediction;