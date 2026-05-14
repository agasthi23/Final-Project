// src/pages/Income.jsx — with proper new-user onboarding + budget mode selector
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend,
} from "recharts";
import {
  FiZap, FiDroplet, FiTrendingUp, FiTrendingDown, FiDollarSign,
  FiCheck, FiAlertTriangle, FiXCircle, FiX, FiDownload, FiCalendar,
  FiSave, FiCpu, FiArrowRight,
} from "react-icons/fi";
import { billsAPI, authAPI, predictionsAPI } from "../services/api";
import { useTheme } from "../context/ThemeContext";

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";

if (!document.getElementById("db-font")) {
  const l = document.createElement("link");
  l.id = "db-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.getElementById("inc-anim")) {
  const s = document.createElement("style");
  s.id = "inc-anim";
  s.textContent = `
    @keyframes incFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes incPopIn  { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }
    @keyframes spin { to { transform: rotate(360deg) } }
    .inc-fu  { animation: incFadeUp .4s ease both }
    .inc-fu1 { animation-delay:.05s } .inc-fu2 { animation-delay:.10s }
    .inc-fu3 { animation-delay:.15s } .inc-fu4 { animation-delay:.20s }
    .inc-kpi:hover        { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .inc-bar-card:hover   { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .inc-chart-card:hover { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .inc-export:hover { background:#0f172a!important; color:#fff!important; border-color:#0f172a!important; }
    .inc-mode-btn { transition: all .2s ease !important; }
    .inc-mode-btn:hover { transform: translateY(-1px) !important; }
  `;
  document.head.appendChild(s);
}

const toMonthKey = (date) => {
  const y  = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${mo}`;
};

const keyToLabel = (key) => {
  if (!key) return "";
  const [y, mo] = key.split("-");
  return new Date(Number(y), Number(mo) - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
};

const AnimNum = ({ value }) => {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const start = prev.current, end = value, diff = end - start;
    if (!diff) return;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / 380, 1);
      const e = p < .5 ? 2*p*p : -1+(4-2*p)*p;
      setDisplay(Math.round(start + diff * e));
      if (p < 1) requestAnimationFrame(step);
      else prev.current = end;
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{display.toLocaleString()}</>;
};

const Toast = ({ message, type, onClose, C }) => {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const isError = type === "error";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 18px",
      borderRadius:12, maxWidth:360, fontSize:"0.875rem", fontWeight:500,
      color:"#fff", boxShadow:C.s3, fontFamily:F, background: isError ? C.red : C.green }}>
      <span style={{ display:"flex", flexShrink:0 }}>
        {isError ? <FiXCircle size={17}/> : <FiCheck size={17}/>}
      </span>
      <p style={{ margin:0, flex:1 }}>{message}</p>
      <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer",
        display:"flex", padding:0, color:"rgba(255,255,255,.7)" }}>
        <FiX size={15}/>
      </button>
    </div>
  );
};

const CTip = ({ active, payload, label, C }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
      padding:"10px 14px", boxShadow:C.s3, fontFamily:F, minWidth:150 }}>
      <p style={{ fontSize:"0.7rem", fontWeight:700, color:C.muted, margin:"0 0 7px",
        textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:8,
          marginBottom: i < payload.length-1 ? 4 : 0 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:p.color, display:"inline-block" }}/>
          <span style={{ fontSize:"0.75rem", color:C.muted, flex:1 }}>{p.name}</span>
          <span style={{ fontSize:"0.8rem", fontWeight:700, color:C.ink }}>Rs. {Number(p.value).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default function Income() {
  const { darkMode } = useTheme();

  const C = useMemo(() => ({
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
    tealL:   darkMode ? "rgba(8,145,178,0.15)"  : "#ecfeff",
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
    hero:    "#0f172a",
    s1: "0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
    s2: "0 4px 16px rgba(15,23,42,.08),0 2px 4px rgba(15,23,42,.04)",
    s3: "0 12px 40px rgba(15,23,42,.10),0 4px 8px rgba(15,23,42,.04)",
  }), [darkMode]);

  const ax = useMemo(() => ({ fill: C.faint, fontSize: 11, fontFamily: F }), [C.faint]);
  const TooltipContent = useCallback((props) => <CTip {...props} C={C} />, [C]);

  // ─── State ───────────────────────────────────────────────────────────────────
  const [salary,           setSalary]           = useState(0);
  const [inputSalary,      setInputSalary]       = useState("");
  const [isEditing,        setIsEditing]         = useState(false);
  const [savingSalary,     setSavingSalary]       = useState(false);
  const [billsData,        setBillsData]         = useState([]);
  const [loading,          setLoading]           = useState(true);
  const [error,            setError]             = useState(null);
  const [toast,            setToast]             = useState(null);
  const [budgetMode,       setBudgetMode]        = useState("salary");
  const [fixedBudget,      setFixedBudget]       = useState(0);
  const [fixedBudgetInput, setFixedBudgetInput]  = useState("");
  const [savingBudgetMode, setSavingBudgetMode]  = useState(false);
  // Onboarding: which mode is selected in the onboarding card (before saving)
  const [onboardingMode,   setOnboardingMode]    = useState("salary");

  const [predictions, setPredictions] = useState({
    electricity: { predictedAmount: 0, confidence: "Low", method: "" },
    water:       { predictedAmount: 0, confidence: "Low", method: "" },
    total: 0, month: "", year: "", isUsingML: false,
  });

  const showToast = useCallback((msg, type = "success") => setToast({ message: msg, type }), []);

  const currentMonthKey   = useMemo(() => toMonthKey(new Date()), []);
  const currentMonthLabel = useMemo(() => keyToLabel(currentMonthKey), [currentMonthKey]);

  // ─── Data fetch ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const salaryRes = await authAPI.getSalary();
      const userSalary = salaryRes.data?.salary || 0;
      setSalary(userSalary);
      setInputSalary(userSalary > 0 ? userSalary.toString() : "");

      try {
        const budgetRes = await authAPI.getBudgetMode();
        if (budgetRes.data?.success) {
          const mode = budgetRes.data.budgetMode || "salary";
          const fixed = budgetRes.data.fixedBudget || 0;
          setBudgetMode(mode);
          setOnboardingMode(mode);
          setFixedBudget(fixed);
          setFixedBudgetInput(fixed > 0 ? fixed.toString() : "");
        }
      } catch (budgetErr) {
        console.warn("Could not load budget mode:", budgetErr);
      }

      const billsRes = await billsAPI.getAll();
      let bills = billsRes.data || [];
      if (Array.isArray(billsRes.data?.bills)) bills = billsRes.data.bills;
      if (Array.isArray(billsRes.data?.data))  bills = billsRes.data.data;
      setBillsData(bills);

      try {
        const predRes = await predictionsAPI.getCurrentMonthPredictions();
        if (predRes.data) {
          setPredictions({
            electricity: {
              predictedAmount: predRes.data.electricity?.predictedAmount || 0,
              confidence:      predRes.data.electricity?.confidence      || "Low",
              method:          predRes.data.electricity?.method          || "",
            },
            water: {
              predictedAmount: predRes.data.water?.predictedAmount || 0,
              confidence:      predRes.data.water?.confidence      || "Low",
              method:          predRes.data.water?.method          || "",
            },
            total:     predRes.data.total     || 0,
            month:     predRes.data.month     || currentMonthLabel,
            year:      predRes.data.year      || new Date().getFullYear(),
            isUsingML: predRes.data.isUsingML || false,
          });
        }
      } catch (predErr) {
        console.warn("Prediction fallback:", predErr);
        const elecBills  = bills.filter(b => b.utilityType === "Electricity");
        const waterBills = bills.filter(b => b.utilityType === "Water");
        const calcAvg = (arr, n = 3) => {
          if (!arr.length) return 0;
          const recent = arr.slice(-n);
          return Math.round(recent.reduce((s, b) => s + b.billAmount, 0) / recent.length);
        };
        const elecAvg  = calcAvg(elecBills);
        const waterAvg = calcAvg(waterBills);
        setPredictions({
          electricity: { predictedAmount: elecAvg,  confidence: "Low", method: "Simple Average" },
          water:       { predictedAmount: waterAvg, confidence: "Low", method: "Simple Average" },
          total: elecAvg + waterAvg,
          month: currentMonthLabel,
          year:  new Date().getFullYear(),
          isUsingML: false,
        });
      }
    } catch (err) {
      console.error("fetchData error:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentMonthLabel]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Onboarding complete? ─────────────────────────────────────────────────────
  // True only when user has actually saved a value
  // If they have a salary OR a fixedBudget saved, they're past onboarding
  // regardless of which mode is currently selected
  const isOnboardingComplete = useMemo(() => {
    return salary > 0 || fixedBudget > 0;
  }, [salary, fixedBudget]);

  // ─── Save salary ─────────────────────────────────────────────────────────────
  const handleSaveSalary = async () => {
    const newSalary = parseInt(inputSalary, 10);
    if (isNaN(newSalary) || newSalary <= 0) {
      showToast("Please enter a valid salary amount", "error");
      return;
    }
    setSavingSalary(true);
    try {
      // If coming from onboarding, also save the mode as "salary"
      if (!isOnboardingComplete) {
        await authAPI.updateBudgetMode({ budgetMode: "salary", fixedBudget: 0 });
        setBudgetMode("salary");
      }
      await authAPI.updateSalary(newSalary);
      setSalary(newSalary);
      setIsEditing(false);
      showToast("Salary saved successfully!");
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save salary", "error");
    } finally {
      setSavingSalary(false);
    }
  };

  // ─── Save fixed budget ────────────────────────────────────────────────────────
  const handleSaveFixedBudget = async () => {
    const amount = Number(fixedBudgetInput);
    if (isNaN(amount) || amount <= 0) {
      showToast("Please enter a budget amount greater than 0", "error");
      return;
    }
    setSavingBudgetMode(true);
    try {
      await authAPI.updateBudgetMode({ budgetMode: "fixed", fixedBudget: amount });
      setBudgetMode("fixed");
      setFixedBudget(amount);
      showToast("Fixed budget saved successfully!");
    } catch {
      showToast("Failed to save fixed budget", "error");
    } finally {
      setSavingBudgetMode(false);
    }
  };

  // ─── Switch mode (for existing users) ────────────────────────────────────────
  const handleSwitchMode = async (mode) => {
    if (mode === budgetMode || savingBudgetMode) return;
    setSavingBudgetMode(true);
    try {
      if (mode === "salary") {
        await authAPI.updateBudgetMode({ budgetMode: "salary", fixedBudget });
        setBudgetMode("salary");
        showToast("Switched to Salary-Based mode!");
      } else {
        await authAPI.updateBudgetMode({ budgetMode: "fixed", fixedBudget });
        setBudgetMode("fixed");
        showToast("Switched to Fixed Budget mode!");
      }
    } catch {
      showToast("Failed to switch mode", "error");
    } finally {
      setSavingBudgetMode(false);
    }
  };

  // ─── Budget calculation ───────────────────────────────────────────────────────
  const budget = useMemo(() => {
    const totalPredictedExpenses = predictions.total;
    const budgetLimit  = budgetMode === "fixed" ? fixedBudget : salary * 0.08;
    const budgetSource = budgetMode === "fixed" ? "fixed budget" : "salary (8%)";
    const referenceAmount = budgetMode === "fixed" ? fixedBudget : salary;
    const savings         = referenceAmount - totalPredictedExpenses;
    const percentageUsed  = budgetLimit > 0 ? (totalPredictedExpenses / budgetLimit) * 100 : 0;

    let healthStatus, healthColor, healthMessage;
    if (percentageUsed <= 80) {
      healthStatus = "Excellent"; healthColor = "green";
      healthMessage = `Great! Your predicted expenses are only ${percentageUsed.toFixed(1)}% of your ${budgetSource}.`;
    } else if (percentageUsed <= 100) {
      healthStatus = "Good"; healthColor = "yellow";
      healthMessage = `Your predicted expenses are at ${percentageUsed.toFixed(1)}% of your ${budgetSource}.`;
    } else {
      healthStatus = "High"; healthColor = "red";
      healthMessage = `Alert! Predicted expenses exceed your ${budgetSource} by ${(percentageUsed - 100).toFixed(1)}%.`;
    }

    return {
      salary, budgetMode, budgetLimit, budgetSource,
      totalExpenses: totalPredictedExpenses, savings,
      percentageUsed: percentageUsed.toFixed(1),
      recommendedBudget: budgetLimit,
      healthStatus, healthColor, healthMessage,
      electricityPrediction: predictions.electricity.predictedAmount,
      waterPrediction:       predictions.water.predictedAmount,
      electricityConfidence: predictions.electricity.confidence,
      waterConfidence:       predictions.water.confidence,
      predictionMethod:      predictions.electricity.method,
      isUsingML:             predictions.isUsingML,
    };
  }, [salary, predictions, budgetMode, fixedBudget]);

  // ─── Chart data ───────────────────────────────────────────────────────────────
  const chartData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const date       = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthKey   = toMonthKey(date);
      const monthShort = date.toLocaleDateString("en-US", { month: "short" });
      const isCurrent  = monthKey === currentMonthKey;
      let expenses = isCurrent
        ? budget.totalExpenses
        : billsData.filter(b => b.billingMonth === monthKey).reduce((s, b) => s + (b.billAmount || 0), 0);
      const reference = budget.budgetMode === "fixed" ? fixedBudget : salary;
      return {
        month: monthShort,
        income: reference,
        expenses: Math.round(expenses),
        savings: Math.max(0, reference - Math.round(expenses)),
        isPredicted: isCurrent,
      };
    });
  }, [billsData, salary, fixedBudget, budget.totalExpenses, budget.budgetMode, currentMonthKey]);

  const historyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const date       = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const monthKey   = toMonthKey(date);
      const monthShort = date.toLocaleDateString("en-US", { month: "short" });
      const isCurrent  = monthKey === currentMonthKey;
      let electricity = 0, water = 0;
      if (isCurrent) {
        electricity = budget.electricityPrediction;
        water       = budget.waterPrediction;
      } else {
        const monthBills = billsData.filter(b => b.billingMonth === monthKey);
        electricity = monthBills.filter(b => b.utilityType === "Electricity").reduce((s, b) => s + (b.billAmount || 0), 0);
        water       = monthBills.filter(b => b.utilityType === "Water").reduce((s, b) => s + (b.billAmount || 0), 0);
      }
      return { month: monthShort, electricity: Math.round(electricity), water: Math.round(water) };
    });
  }, [billsData, budget.electricityPrediction, budget.waterPrediction, currentMonthKey]);

  // ─── Insights ─────────────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const list = [];
    if (budget.budgetMode === "fixed") {
      list.push({ type: "info", text: `📊 Using Fixed Budget mode — limit: Rs. ${fixedBudget.toLocaleString()}/month. Change anytime using the mode toggle above.` });
    } else {
      list.push({ type: "info", text: `💰 Using Salary-Based mode — budget limit: Rs. ${Math.round(budget.budgetLimit).toLocaleString()} (8% of salary). Change anytime using the mode toggle above.` });
    }
    if (budget.isUsingML) {
      list.push({ type: "info", text: `🤖 AI-powered predictions for ${currentMonthLabel}. Confidence: Electricity (${budget.electricityConfidence}), Water (${budget.waterConfidence})` });
    } else {
      list.push({ type: "warning", text: `📊 Using ${budget.predictionMethod} predictions. Add more bills for AI-powered predictions.` });
    }
    if (parseFloat(budget.percentageUsed) <= 80) {
      list.push({ type: "success", text: `✅ Excellent! Predicted expenses are ${budget.percentageUsed}% of your ${budget.budgetSource}. You have Rs. ${Math.abs(budget.savings).toLocaleString()} headroom.` });
    } else if (parseFloat(budget.percentageUsed) <= 100) {
      list.push({ type: "warning", text: `⚠️ Predicted expenses at ${budget.percentageUsed}% of your ${budget.budgetSource}. You're close to the limit.` });
    } else {
      list.push({ type: "critical", text: `🔴 Predicted expenses (${budget.percentageUsed}% of ${budget.budgetSource}) exceed your budget.` });
    }
    if (budget.savings > 0) {
      list.push({ type: "success", text: `💰 Rs. ${budget.savings.toLocaleString()} remaining in your ${budget.budgetSource} after predicted utility bills.` });
    } else if (budget.savings < 0) {
      list.push({ type: "critical", text: `⚠️ Predicted bills exceed your ${budget.budgetSource} by Rs. ${Math.abs(budget.savings).toLocaleString()}.` });
    }
    if (billsData.length < 3) {
      list.unshift({ type: "warning", text: `Add ${3 - billsData.length} more past bill${3 - billsData.length > 1 ? "s" : ""} for better ML predictions.` });
    }
    return list;
  }, [budget, billsData.length, fixedBudget, currentMonthLabel]);

  const savingsLabel = budget.budgetMode === "fixed" ? "Remaining Budget" : "Expected Savings";
  const referenceForRing = budget.budgetMode === "fixed" ? fixedBudget : salary;
  const savePct = referenceForRing > 0
    ? Math.max(0, Math.min(((referenceForRing - budget.totalExpenses) / referenceForRing) * 100, 100))
    : 0;
  const circumference = 2 * Math.PI * 52;

  const kpiColors = {
    green: { accent: C.green, bg: C.greenL, bdr: C.greenM },
    red:   { accent: C.red,   bg: C.redL,   bdr: C.redM   },
    amber: { accent: C.amber, bg: C.amberL, bdr: C.amberM },
    teal:  { accent: C.teal,  bg: C.tealL,  bdr: C.tealM  },
  };

  const insightColors = {
    success:  { bg: C.greenL, bdr: C.greenM, color: C.green, icon: <FiCheck size={16}/> },
    warning:  { bg: C.amberL, bdr: C.amberM, color: C.amber, icon: <FiAlertTriangle size={16}/> },
    critical: { bg: C.redL,   bdr: C.redM,   color: C.red,   icon: <FiXCircle size={16}/> },
    info:     { bg: C.blueL,  bdr: C.blueM,  color: C.blue,  icon: <FiCalendar size={16}/> },
  };

  const kpis = [
    budget.budgetMode === "salary"
      ? { label: "Monthly Salary",        val: budget.salary,      icon: <FiDollarSign size={18}/>, colorKey: "green" }
      : { label: "Monthly Utility Budget", val: budget.budgetLimit, icon: <FiDollarSign size={18}/>, colorKey: "green" },
    { label: "Predicted Expenses",      val: budget.totalExpenses,         icon: <FiTrendingUp size={18}/>,  colorKey: "red"   },
    { label: "Electricity (Predicted)", val: budget.electricityPrediction, icon: <FiZap size={18}/>,         colorKey: "amber" },
    { label: "Water (Predicted)",       val: budget.waterPrediction,       icon: <FiDroplet size={18}/>,     colorKey: "teal"  },
    { label: savingsLabel,              val: budget.savings,
      icon: budget.savings >= 0 ? <FiDollarSign size={18}/> : <FiTrendingDown size={18}/>,
      colorKey: budget.savings >= 0 ? "green" : "red" },
  ];

  // ─── Loading / Error ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, padding:"28px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, color:C.muted, fontSize:"0.875rem" }}>
          <div style={{ width:18, height:18, border:`2px solid ${C.border}`, borderTopColor:C.blue,
            borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
          Loading budget data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, padding:"28px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 18px",
          borderRadius:12, background:C.redL, border:`1px solid ${C.redM}`,
          color:C.red, fontSize:"0.875rem" }}>
          <FiAlertTriangle size={16}/>
          <div style={{ flex:1 }}>{error}</div>
          <button onClick={fetchData} style={{ padding:"5px 12px", borderRadius:7,
            border:`1px solid ${C.redM}`, background:"transparent", color:C.red, cursor:"pointer" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // ONBOARDING SCREEN — shown to first-time users who haven't set up budget yet
  // ══════════════════════════════════════════════════════════════════════════════
  if (!isOnboardingComplete) {
    return (
      <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, color:C.ink,
        padding:"28px 32px 64px", display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center" }}>

        {toast && (
          <div style={{ position:"fixed", bottom:28, right:28, zIndex:9999, animation:"incFadeUp .3s ease" }}>
            <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} C={C}/>
          </div>
        )}

        <div className="inc-fu inc-fu1" style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 24, padding: "48px 52px", maxWidth: 560, width: "100%",
          boxShadow: C.s3,
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 64, height: 64, borderRadius: 18,
              background: `linear-gradient(135deg, #2563eb, #7c3aed)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px", fontSize: "1.75rem" }}>
              💰
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: C.ink,
              margin: "0 0 8px", letterSpacing: "-0.03em" }}>
              Set Up Your Budget
            </h2>
            <p style={{ fontSize: "0.875rem", color: C.muted, margin: 0, lineHeight: 1.6 }}>
              Choose how you want to track and plan your utility spending for{" "}
              <strong style={{ color: C.violet }}>{currentMonthLabel}</strong>
            </p>
          </div>

          {/* Step 1 — choose mode */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.12em", color: C.faint, margin: "0 0 12px" }}>
              Step 1 — How do you want to plan?
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                {
                  key: "salary", emoji: "💰", label: "Salary Based",
                  sub: "Use 8% of my monthly income as my utility limit",
                  accent: C.green, bg: C.greenL, bdr: C.greenM,
                  tag: "For households"
                },
                {
                  key: "fixed", emoji: "📊", label: "Fixed Budget",
                  sub: "I'll set my own monthly utility spending limit",
                  accent: C.teal, bg: C.tealL, bdr: C.tealM,
                  tag: "For businesses too"
                },
              ].map(opt => {
                const isActive = onboardingMode === opt.key;
                return (
                  <button key={opt.key} className="inc-mode-btn"
                    onClick={() => setOnboardingMode(opt.key)}
                    style={{
                      padding: "18px 16px", borderRadius: 16, cursor: "pointer",
                      textAlign: "left", fontFamily: F,
                      border: `2px solid ${isActive ? opt.accent : C.border}`,
                      background: isActive ? opt.bg : C.hover,
                      position: "relative", overflow: "hidden",
                    }}>
                    <div style={{ fontSize: "1.5rem", marginBottom: 10 }}>{opt.emoji}</div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem",
                      color: isActive ? opt.accent : C.body, marginBottom: 5 }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: isActive ? opt.accent : C.muted,
                      lineHeight: 1.5, marginBottom: 10 }}>
                      {opt.sub}
                    </div>
                    <span style={{
                      fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px",
                      borderRadius: 999, background: isActive ? "rgba(255,255,255,0.6)" : C.border,
                      color: isActive ? opt.accent : C.faint
                    }}>
                      {isActive ? "✓ Selected" : opt.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2 — amount input based on chosen mode */}
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
            <p style={{ fontSize: "0.68rem", fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.12em", color: C.faint, margin: "0 0 12px" }}>
              Step 2 — {onboardingMode === "salary" ? "Enter your monthly salary" : "Enter your monthly utility budget"}
            </p>

            <div style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center",
                border: `1.5px solid ${C.border}`, borderRadius: 12,
                background: C.hover, overflow: "hidden" }}>
                <span style={{ padding: "0 16px", fontSize: "0.85rem", fontWeight: 700,
                  color: C.muted, borderRight: `1px solid ${C.border}`, whiteSpace: "nowrap",
                  alignSelf: "stretch", display: "flex", alignItems: "center" }}>
                  Rs.
                </span>
                <input
                  type="number"
                  value={onboardingMode === "salary" ? inputSalary : fixedBudgetInput}
                  onChange={e => onboardingMode === "salary"
                    ? setInputSalary(e.target.value)
                    : setFixedBudgetInput(e.target.value)}
                  placeholder={onboardingMode === "salary" ? "e.g. 100,000" : "e.g. 8,000"}
                  min="0"
                  style={{ flex: 1, border: "none", outline: "none", background: "transparent",
                    padding: "14px 16px", fontFamily: F, fontSize: "1.1rem",
                    fontWeight: 700, color: C.ink }}
                />
              </div>
              <button
                onClick={onboardingMode === "salary" ? handleSaveSalary : handleSaveFixedBudget}
                disabled={savingSalary || savingBudgetMode}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "14px 24px", borderRadius: 12, border: "none",
                  background: onboardingMode === "salary" ? C.green : C.teal,
                  color: "#fff", fontFamily: F, fontSize: "0.9rem", fontWeight: 700,
                  cursor: (savingSalary || savingBudgetMode) ? "not-allowed" : "pointer",
                  opacity: (savingSalary || savingBudgetMode) ? 0.7 : 1,
                  whiteSpace: "nowrap",
                }}>
                {(savingSalary || savingBudgetMode) ? "Saving..." : <>Get Started <FiArrowRight size={16}/></>}
              </button>
            </div>

            {/* Live hint */}
            {onboardingMode === "salary" && inputSalary && Number(inputSalary) > 0 && (
              <p style={{ fontSize: "0.75rem", color: C.green, fontWeight: 600,
                margin: "10px 0 0", fontFamily: F }}>
                → Your utility budget will be Rs. {Math.round(Number(inputSalary) * 0.08).toLocaleString()} (8% of salary)
              </p>
            )}
            {onboardingMode === "fixed" && fixedBudgetInput && Number(fixedBudgetInput) > 0 && (
              <p style={{ fontSize: "0.75rem", color: C.teal, fontWeight: 600,
                margin: "10px 0 0", fontFamily: F }}>
                → Rs. {Number(fixedBudgetInput).toLocaleString()} will be your monthly utility spending cap
              </p>
            )}
          </div>
        </div>

        <p style={{ marginTop: 20, fontSize: "0.75rem", color: C.faint, textAlign: "center" }}>
          You can change your budget mode anytime from this page or Profile → Preferences
        </p>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // FULL DASHBOARD — shown to users who have completed onboarding
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, color:C.ink,
      padding:"28px 32px 64px", transition:"background 0.3s ease, color 0.3s ease" }}>

      {toast && (
        <div style={{ position:"fixed", bottom:28, right:28, zIndex:9999, animation:"incFadeUp .3s ease" }}>
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} C={C}/>
        </div>
      )}

      {/* HERO */}
      <section className="inc-fu inc-fu1" style={{
        background: C.hero, borderRadius: 20, padding: "36px 44px",
        marginBottom: 20, display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: 40, position: "relative",
        overflow: "hidden", boxShadow: "0 8px 40px rgba(15,23,42,.20)"
      }}>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.03,
          backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}/>

        <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
          <span style={{ display:"inline-block", padding:"4px 12px", borderRadius:999,
            background:"rgba(255,255,255,.1)", color:"rgba(255,255,255,.65)",
            fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.08em", marginBottom:14 }}>
            {budgetMode === "fixed" ? "Fixed Utility Budget" : "Monthly Income"}
          </span>

          {isEditing ? (
            <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", background:"rgba(255,255,255,.08)",
                border:"1.5px solid rgba(255,255,255,.2)", borderRadius:14, padding:"0 18px" }}>
                <span style={{ fontFamily:"monospace", fontSize:"0.85rem", fontWeight:600,
                  color:"rgba(255,255,255,.4)", marginRight:10 }}>Rs.</span>
                <input type="number" value={inputSalary} onChange={e => setInputSalary(e.target.value)}
                  placeholder="Enter your monthly salary" autoFocus
                  style={{ flex:1, background:"transparent", border:"none", outline:"none",
                    fontFamily:"monospace", fontSize:"1.2rem", fontWeight:600, color:"#fff",
                    padding:"14px 0", minWidth:200 }}/>
              </div>
              <button onClick={handleSaveSalary} disabled={savingSalary}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 24px",
                  borderRadius:10, background:C.green, border:"none", color:"#fff",
                  fontWeight:600, fontSize:"0.9rem", cursor:"pointer" }}>
                <FiSave size={16}/> {savingSalary ? "Saving..." : "Save Salary"}
              </button>
              <button onClick={() => { setIsEditing(false); setInputSalary(salary.toString()); }}
                style={{ padding:"10px 20px", borderRadius:10, background:"rgba(255,255,255,.1)",
                  border:"none", color:"#fff", cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          ) : (
            <div>
              <div style={{ display:"flex", alignItems:"baseline", gap:16, flexWrap:"wrap", marginBottom:8 }}>
                <h1 style={{ fontSize:"2rem", fontWeight:800, color:"#fff", margin:0, letterSpacing:"-0.03em" }}>
                  Rs. {(budgetMode === "fixed" ? fixedBudget : salary).toLocaleString()}
                </h1>
                {budgetMode === "salary" && (
                  <button onClick={() => setIsEditing(true)}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 16px",
                      borderRadius:8, background:"rgba(255,255,255,.1)", border:"none",
                      color:"#fff", fontSize:"0.8rem", cursor:"pointer" }}>
                    Edit Salary
                  </button>
                )}
              </div>
              <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,.5)", margin:0 }}>
                {budgetMode === "fixed"
                  ? `Your fixed utility budget for ${currentMonthLabel}`
                  : `Your monthly salary for ${currentMonthLabel} — used to calculate expected savings`}
              </p>
            </div>
          )}
        </div>

        <div style={{ position:"relative", width:130, height:130, flexShrink:0 }}>
          <svg viewBox="0 0 120 120" style={{ width:"100%", height:"100%" }}>
            <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="10"/>
            <circle cx="60" cy="60" r="52" fill="none"
              stroke={budget.savings < 0 ? C.red : C.green} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(savePct / 100) * circumference} ${circumference}`}
              transform="rotate(-90 60 60)"
              style={{ transition:"stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)" }}/>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontFamily:"monospace", fontSize:"1.6rem", fontWeight:700, color:"#fff", lineHeight:1 }}>
              {savePct.toFixed(0)}%
            </span>
            <span style={{ fontSize:"0.7rem", color:"rgba(255,255,255,.45)", fontWeight:500,
              marginTop:2, textTransform:"uppercase", letterSpacing:".06em" }}>
              {budgetMode === "fixed" ? "remaining" : "saved"}
            </span>
          </div>
        </div>
      </section>

      {/* BUDGET MODE TOGGLE — for existing users to switch */}
      <section className="inc-fu inc-fu2" style={{
        background: C.card, borderRadius: 16, padding: "18px 22px",
        border: `1px solid ${C.border}`, boxShadow: C.s1, marginBottom: 20
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.muted, whiteSpace: "nowrap" }}>
            📅 Budget mode for <strong style={{ color: C.violet }}>{currentMonthLabel}</strong>
          </span>

          {/* Mode pills */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { key: "salary", label: "💰 Salary-Based", accent: C.green, bg: C.greenL, bdr: C.greenM },
              { key: "fixed",  label: "📊 Fixed Budget",  accent: C.teal,  bg: C.tealL,  bdr: C.tealM  },
            ].map(opt => {
              const isActive = budgetMode === opt.key;
              return (
                <button key={opt.key} className="inc-mode-btn"
                  disabled={savingBudgetMode}
                  onClick={() => handleSwitchMode(opt.key)}
                  style={{
                    padding: "7px 16px", borderRadius: 999, fontFamily: F,
                    fontSize: "0.8rem", fontWeight: 700, cursor: "pointer",
                    border: `1.5px solid ${isActive ? opt.accent : C.border}`,
                    background: isActive ? opt.bg : "transparent",
                    color: isActive ? opt.accent : C.muted,
                    transition: "all .15s",
                  }}>
                  {opt.label} {isActive && "✓"}
                </button>
              );
            })}
          </div>

          {/* Fixed budget input — shown inline when switching to fixed */}
          {budgetMode === "fixed" && (
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
              <div style={{ display: "flex", alignItems: "center",
                border: `1px solid ${C.border}`, borderRadius: 8,
                background: C.hover, overflow: "hidden" }}>
                <span style={{ padding: "0 10px", fontSize: "0.78rem", fontWeight: 600,
                  color: C.muted, borderRight: `1px solid ${C.border}` }}>Rs.</span>
                <input type="number" value={fixedBudgetInput} min="0"
                  onChange={e => setFixedBudgetInput(e.target.value)}
                  placeholder="e.g. 8000"
                  style={{ border: "none", outline: "none", background: "transparent",
                    padding: "8px 10px", fontFamily: F, fontSize: "0.875rem",
                    fontWeight: 600, color: C.ink, width: 120 }}/>
              </div>
              <button onClick={handleSaveFixedBudget} disabled={savingBudgetMode}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px",
                  borderRadius: 8, background: C.teal, border: "none", color: "#fff",
                  fontFamily: F, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                <FiSave size={13}/> {savingBudgetMode ? "Saving..." : "Save"}
              </button>
              {fixedBudget > 0 && (
                <span style={{ fontSize: "0.72rem", color: C.teal, fontWeight: 600 }}>
                  Current: Rs. {fixedBudget.toLocaleString()}
                </span>
              )}
            </div>
          )}

          {budgetMode === "salary" && (
            <span style={{ marginLeft: "auto", fontSize: "0.72rem", color: C.muted }}>
              Limit: Rs. {Math.round(budget.budgetLimit).toLocaleString()} (8% of salary)
            </span>
          )}

          {/* ML badge */}
          {budget.isUsingML ? (
            <span style={{ fontSize:"0.7rem", padding:"4px 10px", borderRadius:20,
              background:C.violetL, color:C.violet, display:"flex", alignItems:"center", gap:4 }}>
              <FiCpu size={12}/> ML Active
            </span>
          ) : (
            <span style={{ fontSize:"0.7rem", padding:"4px 10px", borderRadius:20,
              background:C.amberL, color:C.amber }}>
              {budget.predictionMethod || "Average"}
            </span>
          )}
        </div>
      </section>

      {/* KPI CARDS */}
      <section className="inc-fu inc-fu3" style={{
        display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",
        gap:14, marginBottom:20
      }}>
        {kpis.map(({ label, val, icon, colorKey }) => {
          const col = kpiColors[colorKey] || kpiColors.green;
          return (
            <div key={label} className="inc-kpi"
              style={{ background:C.card, borderRadius:14, padding:"18px 20px",
                display:"flex", alignItems:"center", gap:14, boxShadow:C.s1,
                border:`1px solid ${C.border}`, borderTop:`3px solid ${col.accent}`,
                transition:"transform .18s, box-shadow .18s" }}>
              <div style={{ width:40, height:40, borderRadius:10, flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                background:col.bg, color:col.accent }}>{icon}</div>
              <div>
                <p style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase",
                  letterSpacing:".06em", color:C.muted, margin:"0 0 4px" }}>{label}</p>
                <p style={{ fontFamily:"monospace", fontSize:"1.05rem", fontWeight:600, color:C.ink, margin:0 }}>
                  Rs. <AnimNum value={Math.abs(val)}/>
                  {val < 0 && <span style={{ fontSize:"0.7rem", color:C.red, marginLeft:4 }}>over budget</span>}
                </p>
              </div>
            </div>
          );
        })}
      </section>

      {/* PROGRESS BARS */}
      <section style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:14, marginBottom:20 }}>
        {[
          { key:"electricity", label:"Electricity (Predicted)", icon:<FiZap size={16}/>, amount:budget.electricityPrediction, confidence:budget.electricityConfidence, accent:C.amber, bg:C.amberL, bdr:C.amberM },
          { key:"water",       label:"Water (Predicted)",       icon:<FiDroplet size={16}/>, amount:budget.waterPrediction,       confidence:budget.waterConfidence,       accent:C.teal,  bg:C.tealL,  bdr:C.tealM  },
        ].map(({ key, label, icon, amount, confidence, accent, bg, bdr }) => {
          const recommendedAmount = budget.budgetLimit / 2;
          const pctOfRecommended  = recommendedAmount > 0 ? (amount / recommendedAmount) * 100 : 0;
          const barColor = pctOfRecommended > 100 ? C.red : pctOfRecommended > 80 ? C.amber : C.green;
          return (
            <div key={key} className="inc-bar-card"
              style={{ background:C.card, borderRadius:14, padding:"20px 22px",
                boxShadow:C.s1, border:`1px solid ${C.border}` }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14,
                fontSize:"0.95rem", fontWeight:600, color:C.ink }}>
                <div style={{ width:34, height:34, borderRadius:8, background:bg,
                  border:`1px solid ${bdr}`, display:"flex", alignItems:"center",
                  justifyContent:"center", color:accent }}>{icon}</div>
                <span>{label}</span>
                <span style={{ marginLeft:"auto", fontFamily:"monospace", fontSize:"0.78rem",
                  fontWeight:700, padding:"3px 10px", borderRadius:999,
                  background: barColor===C.green ? C.greenL : barColor===C.amber ? C.amberL : C.redL,
                  border:`1px solid ${barColor===C.green ? C.greenM : barColor===C.amber ? C.amberM : C.redM}`,
                  color:barColor }}>{pctOfRecommended.toFixed(0)}%</span>
              </div>
              <div style={{ height:10, background:C.hover, borderRadius:999, overflow:"hidden", marginBottom:10 }}>
                <div style={{ height:"100%", borderRadius:999, width:`${Math.min(pctOfRecommended,100)}%`,
                  background:`linear-gradient(90deg,${barColor},${barColor}aa)`,
                  transition:"width .55s cubic-bezier(.4,0,.2,1)" }}/>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between",
                fontSize:"0.75rem", fontFamily:"monospace", color:C.faint }}>
                <span>Predicted: Rs. {amount.toLocaleString()}</span>
                <span>Limit (½ budget): Rs. {Math.round(recommendedAmount).toLocaleString()}</span>
              </div>
              <div style={{ marginTop:8, fontSize:"0.65rem", color:C.muted }}>
                Confidence: {confidence}
              </div>
            </div>
          );
        })}
      </section>

      {/* CHARTS */}
      <section style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(440px,1fr))", gap:14, marginBottom:20 }}>
        <div className="inc-chart-card" style={{ background:C.card, borderRadius:14, padding:"22px 24px", boxShadow:C.s1, border:`1px solid ${C.border}` }}>
          <h3 style={{ fontSize:"0.75rem", fontWeight:700, color:C.muted, textTransform:"uppercase",
            letterSpacing:".07em", margin:"0 0 18px" }}>
            {budgetMode === "fixed" ? "Budget vs Expenses" : "Income vs Expenses"}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="4 4" stroke={C.border} vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}k`}/>
              <Tooltip content={TooltipContent}/>
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:"0.75rem", fontFamily:F }}/>
              <Bar dataKey="income"   name={budgetMode === "fixed" ? "Budget Limit" : "Income"}  fill={C.green} radius={[5,5,0,0]}/>
              <Bar dataKey="expenses" name="Expenses" fill={C.red}   radius={[5,5,0,0]}/>
              <Bar dataKey="savings"  name={budgetMode === "fixed" ? "Remaining" : "Savings"} fill={C.blue}  radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <p style={{ fontSize:"0.65rem", color:C.faint, textAlign:"center", marginTop:12 }}>
            * Current month ({currentMonthLabel}) shows predicted values
          </p>
        </div>

        <div className="inc-chart-card" style={{ background:C.card, borderRadius:14, padding:"22px 24px", boxShadow:C.s1, border:`1px solid ${C.border}` }}>
          <h3 style={{ fontSize:"0.75rem", fontWeight:700, color:C.muted, textTransform:"uppercase",
            letterSpacing:".07em", margin:"0 0 18px" }}>Utility Expenses History</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="igE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.amber} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={C.amber} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="igW" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.teal} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke={C.border} vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(1)}k`}/>
              <Tooltip content={TooltipContent}/>
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:"0.75rem", fontFamily:F }}/>
              <Area type="monotone" dataKey="electricity" name="Electricity"
                stroke={C.amber} strokeWidth={2} fill="url(#igE)" dot={{ r:4, fill:C.amber }}/>
              <Area type="monotone" dataKey="water" name="Water"
                stroke={C.teal}  strokeWidth={2} fill="url(#igW)" dot={{ r:4, fill:C.teal }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* INSIGHTS */}
      <section style={{ background:C.card, borderRadius:14, padding:"22px 24px",
        boxShadow:C.s1, border:`1px solid ${C.border}`, marginBottom:20 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          marginBottom:16, gap:12, flexWrap:"wrap" }}>
          <h3 style={{ fontSize:"0.75rem", fontWeight:700, color:C.muted, textTransform:"uppercase",
            letterSpacing:".07em", margin:0 }}>Budget Insights</h3>
          <button className="inc-export" onClick={() => {
            const rows = [
              [`Budget Report — ${currentMonthLabel}`], [],
              ["Budget Mode",  budgetMode === "fixed" ? "Fixed Budget" : "Salary Based"],
              ["Budget Limit", `Rs. ${Math.round(budget.budgetLimit).toLocaleString()}`],
              ["Monthly Salary", `Rs. ${salary.toLocaleString()}`], [],
              ["Category","Predicted Amount","Confidence"],
              ["Electricity", `Rs. ${budget.electricityPrediction.toLocaleString()}`, budget.electricityConfidence],
              ["Water",       `Rs. ${budget.waterPrediction.toLocaleString()}`,       budget.waterConfidence],
              ["Total Expenses",   `Rs. ${budget.totalExpenses.toLocaleString()}`],
              [budgetMode === "fixed" ? "Remaining Budget" : "Expected Savings", `Rs. ${budget.savings.toLocaleString()}`],
              ["Budget Usage", `${budget.percentageUsed}% of ${budget.budgetSource}`],
            ];
            const csv  = rows.map(r => r.join(",")).join("\n");
            const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href = url; a.download = `budget_${currentMonthLabel.replace(" ","_")}.csv`;
            a.style.display = "none"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
          }} style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 14px",
            borderRadius:9, border:`1px solid ${C.border}`, background:C.card,
            fontFamily:F, fontSize:"0.78rem", fontWeight:600, color:C.muted,
            cursor:"pointer", transition:"all .18s" }}>
            <FiDownload size={13}/> Export CSV
          </button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {insights.map((ins, i) => {
            const s = insightColors[ins.type] || insightColors.success;
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
                padding:"12px 16px", borderRadius:10, background:s.bg,
                border:`1px solid ${s.bdr}`, fontSize:"0.875rem", fontWeight:500 }}>
                <span style={{ display:"flex", flexShrink:0, color:s.color }}>{s.icon}</span>
                <p style={{ margin:0, color:s.color }}>{ins.text}</p>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}