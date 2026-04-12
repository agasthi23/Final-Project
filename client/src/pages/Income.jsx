// src/pages/Income.jsx
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend,
} from "recharts";
import {
  FiZap, FiDroplet, FiTrendingUp, FiTrendingDown, FiDollarSign,
  FiCheck, FiAlertTriangle, FiXCircle, FiX, FiDownload, FiCalendar,
  FiSave,
} from "react-icons/fi";
import { billsAPI, authAPI } from "../services/api";
import { useTheme } from "../context/ThemeContext";

/* ─── Font & Animations ─── */
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
    @keyframes incBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    @keyframes incHeroFlash { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,0)} 50%{box-shadow:0 0 0 6px rgba(255,255,255,.15)} }
    .inc-fu  { animation: incFadeUp .4s ease both }
    .inc-fu1 { animation-delay:.05s } .inc-fu2 { animation-delay:.10s }
    .inc-fu3 { animation-delay:.15s } .inc-fu4 { animation-delay:.20s }
    .inc-kpi:hover    { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .inc-bar-card:hover { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .inc-chart-card:hover { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .inc-hero-flash  { animation: incHeroFlash .5s ease !important; }
    .inc-export:hover { background:#0f172a!important; color:#fff!important; border-color:#0f172a!important; }
    @keyframes spin { to { transform: rotate(360deg) } }
  `;
  document.head.appendChild(s);
}

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";

const AnimNum = ({ value, colors }) => {
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

export default function Income() {
  const { darkMode } = useTheme();

  // ⭐ C is now INSIDE the component - reacts to darkMode
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
    hero:    "#0f172a", // dark navy always
    s1: "0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
    s2: "0 4px 16px rgba(15,23,42,.08),0 2px 4px rgba(15,23,42,.04)",
    s3: "0 12px 40px rgba(15,23,42,.10),0 4px 8px rgba(15,23,42,.04)",
  };

  const ax = { fill:C.faint, fontSize:11, fontFamily:F };

  // Toast component inside so it can access C
  const Toast = ({ message, type, onClose }) => {
    useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
    const isError = type === "error";
    return (
      <div style={{
        display:"flex", alignItems:"center", gap:12, padding:"12px 18px",
        borderRadius:12, maxWidth:360, fontSize:"0.875rem", fontWeight:500,
        color:"#fff", boxShadow:C.s3, fontFamily:F,
        background: isError ? C.red : C.green,
      }}>
        <span style={{ display:"flex", flexShrink:0 }}>
          {isError ? <FiXCircle size={17}/> : <FiCheck size={17}/>}
        </span>
        <p style={{ margin:0, flex:1 }}>{message}</p>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", padding:0, color:"rgba(255,255,255,.7)" }}>
          <FiX size={15}/>
        </button>
      </div>
    );
  };

  const CTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
        padding:"10px 14px", boxShadow:C.s3, fontFamily:F, minWidth:150 }}>
        <p style={{ fontSize:"0.7rem", fontWeight:700, color:C.muted, margin:"0 0 7px", textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</p>
        {payload.map((p,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:i<payload.length-1?4:0 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:p.color, display:"inline-block" }}/>
            <span style={{ fontSize:"0.75rem", color:C.muted, flex:1 }}>{p.name}</span>
            <span style={{ fontSize:"0.8rem", fontWeight:700, color:C.ink }}>
              Rs. {Number(p.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // State
  const [salary, setSalary] = useState(0);
  const [inputSalary, setInputSalary] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [savingSalary, setSavingSalary] = useState(false);
  
  const [billsData, setBillsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [toast, setToast] = useState(null);
  const [flash, setFlash] = useState(null);

  // Helper: Get current month
  const getCurrentMonth = () => {
    const now = new Date();
    return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  // Helper: Calculate average of last N bills
  const calculatePrediction = (bills, months = 3) => {
    if (!bills.length) return 0;
    const recent = bills.slice(-months);
    const sum = recent.reduce((s, b) => s + b.billAmount, 0);
    return Math.round(sum / recent.length);
  };

  // Fetch all data from MongoDB
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const salaryRes = await authAPI.getSalary();
      const userSalary = salaryRes.data?.salary || 0;
      setSalary(userSalary);
      setInputSalary(userSalary.toString());
      
      const billsRes = await billsAPI.getAll();
      let bills = billsRes.data || [];
      if (Array.isArray(billsRes.data?.bills)) bills = billsRes.data.bills;
      if (Array.isArray(billsRes.data?.data)) bills = billsRes.data.data;
      
      setBillsData(bills);
      
      const months = [...new Set(bills.map(b => b.billingMonth))];
      if (months.length) {
        setSelectedMonth(months[months.length - 1]);
      } else {
        setSelectedMonth(getCurrentMonth());
      }
      
    } catch (err) {
      console.error("Fetch data error:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (msg, type = "success") => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const triggerFlash = (key) => { setFlash(key); setTimeout(() => setFlash(null), 900); };

  const handleSaveSalary = async () => {
    const newSalary = parseInt(inputSalary, 10);
    if (isNaN(newSalary) || newSalary < 0) {
      showToast("Please enter a valid salary amount", "error");
      return;
    }
    
    setSavingSalary(true);
    try {
      await authAPI.updateSalary(newSalary);
      setSalary(newSalary);
      setIsEditing(false);
      showToast("Salary saved successfully!");
      triggerFlash("income");
      await fetchData();
    } catch (err) {
      showToast(err?.response?.data?.message || "Failed to save salary", "error");
    } finally {
      setSavingSalary(false);
    }
  };

  const availableMonths = useMemo(() => {
    const months = [...new Set(billsData.map(b => b.billingMonth))];
    const order = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return months.sort((a,b) => order.indexOf(a.split(" ")[0]) - order.indexOf(b.split(" ")[0]));
  }, [billsData]);

  const predictions = useMemo(() => {
    const elecBills = billsData.filter(b => b.utilityType === "Electricity");
    const waterBills = billsData.filter(b => b.utilityType === "Water");
    
    return {
      electricity: calculatePrediction(elecBills, 3),
      water: calculatePrediction(waterBills, 3),
    };
  }, [billsData]);

  const M = useMemo(() => {
    const currentMonth = getCurrentMonth();
    const isCurrentMonth = selectedMonth === currentMonth;
    
    let elec = 0, water = 0;
    
    if (isCurrentMonth) {
      elec = predictions.electricity;
      water = predictions.water;
    } else {
      const monthBills = billsData.filter(b => b.billingMonth === selectedMonth);
      elec = monthBills.filter(b => b.utilityType === "Electricity").reduce((s,b) => s + b.billAmount, 0);
      water = monthBills.filter(b => b.utilityType === "Water").reduce((s,b) => s + b.billAmount, 0);
    }
    
    const total = elec + water;
    const savings = salary - total;
    const incPct = salary > 0 ? (total / salary) * 100 : 0;
    const elecBudget = predictions.electricity;
    const waterBudget = predictions.water;
    
    return {
      total, elec, water,
      elecRemain: elecBudget - elec,
      waterRemain: waterBudget - water,
      elecPct: elecBudget > 0 ? (elec / elecBudget) * 100 : 0,
      waterPct: waterBudget > 0 ? (water / waterBudget) * 100 : 0,
      incPct,
      savings,
      isCurrentMonth,
      elecBudget,
      waterBudget,
    };
  }, [billsData, selectedMonth, salary, predictions]);

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthFull = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const monthShort = date.toLocaleDateString("en-US", { month: "short" });
      
      const isCurrent = monthFull === getCurrentMonth();
      let expenses = 0;
      
      if (isCurrent) {
        expenses = predictions.electricity + predictions.water;
      } else {
        const monthBills = billsData.filter(b => b.billingMonth === monthFull);
        expenses = monthBills.reduce((s, b) => s + b.billAmount, 0);
      }
      
      months.push({
        month: monthShort,
        income: salary,
        expenses,
        savings: Math.max(0, salary - expenses),
        isPredicted: isCurrent,
      });
    }
    
    return months;
  }, [billsData, salary, predictions]);

  const historyData = useMemo(() => {
    const now = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthFull = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const monthShort = date.toLocaleDateString("en-US", { month: "short" });
      
      const isCurrent = monthFull === getCurrentMonth();
      let electricity = 0, water = 0;
      
      if (isCurrent) {
        electricity = predictions.electricity;
        water = predictions.water;
      } else {
        const monthBills = billsData.filter(b => b.billingMonth === monthFull);
        electricity = monthBills.filter(b => b.utilityType === "Electricity").reduce((s,b) => s + b.billAmount, 0);
        water = monthBills.filter(b => b.utilityType === "Water").reduce((s,b) => s + b.billAmount, 0);
      }
      
      months.push({ month: monthShort, electricity, water });
    }
    
    return months;
  }, [billsData, predictions]);

  const insights = useMemo(() => {
    const list = [];
    const currentMonth = getCurrentMonth();
    const isCurrent = selectedMonth === currentMonth;
    
    if (isCurrent) {
      list.push({ type: "info", text: `📊 These are PREDICTED bills based on your last 3 months of usage.` });
    }
    
    if (M.elecPct > 100) {
      list.push({ type: "critical", text: `Electricity predicted to exceed average by ${(M.elecPct-100).toFixed(0)}%. Consider reducing usage.` });
    } else if (M.elecPct > 90) {
      list.push({ type: "warning", text: `Electricity is at ${M.elecPct.toFixed(0)}% of your average usage.` });
    } else if (M.elecPct > 0 && M.elecPct < 100 && M.elecPct > 0) {
      list.push({ type: "success", text: `Electricity is ${(100-M.elecPct).toFixed(0)}% below your average usage — great job!` });
    }
    
    if (M.waterPct > 100) {
      list.push({ type: "critical", text: `Water predicted to exceed average by ${(M.waterPct-100).toFixed(0)}%. Consider reducing usage.` });
    } else if (M.waterPct > 90) {
      list.push({ type: "warning", text: `Water is at ${M.waterPct.toFixed(0)}% of your average usage.` });
    } else if (M.waterPct > 0 && M.waterPct < 100) {
      list.push({ type: "success", text: `Water is ${(100-M.waterPct).toFixed(0)}% below your average usage — great job!` });
    }
    
    if (salary > 0 && M.savings > 0) {
      list.push({ type: "success", text: `You'll save Rs. ${M.savings.toLocaleString()} (${(100-M.incPct).toFixed(0)}% of salary) after utility costs.` });
    } else if (salary > 0 && M.savings < 0) {
      list.push({ type: "critical", text: `Utilities may exceed your salary by Rs. ${Math.abs(M.savings).toLocaleString()}. Consider reviewing usage.` });
    }
    
    if (billsData.length < 3) {
      list.unshift({ type: "warning", text: `Add ${3 - billsData.length} more past bills for better predictions.` });
    }
    
    if (!list.length && salary > 0) {
      list.push({ type: "success", text: "All utilities within budget — excellent financial management!" });
    }
    
    if (salary === 0 && !isEditing) {
      list.unshift({ type: "info", text: "💰 Click 'Set Salary' above to start tracking your budget." });
    }
    
    return list;
  }, [M, salary, billsData.length, selectedMonth, isEditing]);

  const hasSalary = salary > 0;
  const savePct = salary > 0 ? Math.max(0, Math.min(((salary - M.total) / salary) * 100, 100)) : 0;
  const circumference = 2 * Math.PI * 52;

  const kpis = [
    { label:"Monthly Salary", val:salary, icon:<FiDollarSign size={18}/>, colorKey:"green" },
    { label:"Total Expenses", val:M.total, icon:<FiTrendingUp size={18}/>, colorKey:"red" },
    { label:"Electricity", val:M.elec, sub:`${M.elecPct.toFixed(0)}% of avg`, icon:<FiZap size={18}/>, colorKey:"amber" },
    { label:"Water", val:M.water, sub:`${M.waterPct.toFixed(0)}% of avg`, icon:<FiDroplet size={18}/>, colorKey:"teal" },
    { label:"Net Savings", val:M.savings, icon:M.savings>=0?<FiDollarSign size={18}/>:<FiTrendingDown size={18}/>, colorKey:M.savings>=0?"green":"red" },
  ];

  const kpiColors = {
    green: { accent:C.green, bg:C.greenL, bdr:C.greenM },
    red: { accent:C.red, bg:C.redL, bdr:C.redM },
    amber: { accent:C.amber, bg:C.amberL, bdr:C.amberM },
    teal: { accent:C.teal, bg:C.tealL, bdr:C.tealM },
  };

  const insightColors = {
    success: { bg:C.greenL, bdr:C.greenM, color:C.green, icon:<FiCheck size={16}/> },
    warning: { bg:C.amberL, bdr:C.amberM, color:C.amber, icon:<FiAlertTriangle size={16}/> },
    critical: { bg:C.redL, bdr:C.redM, color:C.red, icon:<FiXCircle size={16}/> },
    info: { bg:C.blueL, bdr:C.blueM, color:C.blue, icon:<FiCalendar size={16}/> },
  };

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, padding:"28px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, color:C.muted, fontSize:"0.875rem" }}>
          <div style={{ width:18, height:18, border:`2px solid ${C.border}`, borderTopColor:C.blue, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
          Loading budget data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, padding:"28px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 18px", borderRadius:12, background:C.redL, border:`1px solid ${C.redM}`, color:C.red, fontSize:"0.875rem" }}>
          <FiAlertTriangle size={16}/>
          <div style={{ flex:1 }}>{error}</div>
          <button onClick={fetchData} style={{ padding:"5px 12px", borderRadius:7, border:`1px solid ${C.redM}`, background:"transparent", color:C.red, cursor:"pointer" }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, color:C.ink, padding:"28px 32px 64px", transition:"background 0.3s ease, color 0.3s ease" }}>

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:28, right:28, zIndex:9999, animation:"incFadeUp .3s ease" }}>
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>
        </div>
      )}

      {/* HERO — Salary Entry */}
      <section className="inc-fu inc-fu1" style={{
        background:C.hero, borderRadius:20, padding: hasSalary ? "36px 44px" : "44px 48px",
        marginBottom:20, display:"flex", alignItems:"center",
        justifyContent:"space-between", gap:40, position:"relative",
        overflow:"hidden", transition:"padding .3s ease",
        boxShadow:"0 8px 40px rgba(15,23,42,.20)",
      }}>
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.03,
          backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}/>

        <div style={{ flex:1, minWidth:0, position:"relative", zIndex:1 }}>
          <span style={{ display:"inline-block", padding:"4px 12px", borderRadius:999,
            background:"rgba(255,255,255,.1)", color:"rgba(255,255,255,.65)",
            fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.08em",
            textTransform:"uppercase", marginBottom:14 }}>
            Monthly Income
          </span>

          {isEditing ? (
            <div className={flash === "income" ? "inc-hero-flash" : ""}
              style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", background:"rgba(255,255,255,.08)",
                border:`1.5px solid rgba(255,255,255,.2)`, borderRadius:14, padding:"0 18px" }}>
                <span style={{ fontFamily:"monospace", fontSize:"0.85rem", fontWeight:600,
                  color:"rgba(255,255,255,.4)", marginRight:10 }}>Rs.</span>
                <input 
                  type="number" 
                  value={inputSalary} 
                  onChange={e => setInputSalary(e.target.value)}
                  placeholder="Enter your monthly salary"
                  style={{ flex:1, background:"transparent", border:"none", outline:"none",
                    fontFamily:"monospace", fontSize:"1.2rem", fontWeight:600, color:"#fff",
                    padding:"14px 0", minWidth:200 }}
                  autoFocus
                />
              </div>
              <button onClick={handleSaveSalary} disabled={savingSalary}
                style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 24px",
                  borderRadius:10, background:C.green, border:"none", color:"#fff",
                  fontWeight:600, fontSize:"0.9rem", cursor:"pointer" }}>
                <FiSave size={16}/> {savingSalary ? "Saving..." : "Save Salary"}
              </button>
              {hasSalary && (
                <button onClick={() => { setIsEditing(false); setInputSalary(salary.toString()); }}
                  style={{ padding:"10px 20px", borderRadius:10, background:"rgba(255,255,255,.1)",
                    border:"none", color:"#fff", cursor:"pointer" }}>
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <div>
              {hasSalary ? (
                <>
                  <div style={{ display:"flex", alignItems:"baseline", gap:16, flexWrap:"wrap", marginBottom:8 }}>
                    <h1 style={{ fontSize:"2rem", fontWeight:800, color:"#fff", margin:0, letterSpacing:"-0.03em" }}>
                      Rs. {salary.toLocaleString()}
                    </h1>
                    <button onClick={() => setIsEditing(true)}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 16px",
                        borderRadius:8, background:"rgba(255,255,255,.1)", border:"none",
                        color:"#fff", fontSize:"0.8rem", cursor:"pointer" }}>
                      Edit Salary
                    </button>
                  </div>
                  <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,.5)", margin:0 }}>
                    Your monthly take-home salary — used to calculate savings and insights
                  </p>
                </>
              ) : (
                <>
                  <h1 style={{ fontSize:"1.65rem", fontWeight:800, color:"#fff",
                    margin:"0 0 8px", letterSpacing:"-0.03em", lineHeight:1.15 }}>
                    Set Your Monthly Salary
                  </h1>
                  <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,.5)", margin:"0 0 22px", maxWidth:440 }}>
                    Enter your salary to start tracking your budget and savings
                  </p>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ display:"flex", alignItems:"center", background:"rgba(255,255,255,.08)",
                      border:`1.5px solid rgba(255,255,255,.2)`, borderRadius:14, padding:"0 18px" }}>
                      <span style={{ fontFamily:"monospace", fontSize:"0.85rem", fontWeight:600,
                        color:"rgba(255,255,255,.4)", marginRight:10 }}>Rs.</span>
                      <input 
                        type="number" 
                        value={inputSalary} 
                        onChange={e => setInputSalary(e.target.value)}
                        placeholder="e.g., 100000"
                        style={{ flex:1, background:"transparent", border:"none", outline:"none",
                          fontFamily:"monospace", fontSize:"1.2rem", fontWeight:600, color:"#fff",
                          padding:"14px 0", minWidth:200 }}
                      />
                    </div>
                    <button onClick={handleSaveSalary} disabled={savingSalary}
                      style={{ display:"flex", alignItems:"center", gap:6, padding:"10px 24px",
                        borderRadius:10, background:C.green, border:"none", color:"#fff",
                        fontWeight:600, fontSize:"0.9rem", cursor:"pointer" }}>
                      <FiSave size={16}/> {savingSalary ? "Saving..." : "Save Salary"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {hasSalary && (
          <div style={{ position:"relative", width:130, height:130, flexShrink:0 }}>
            <svg viewBox="0 0 120 120" style={{ width:"100%", height:"100%" }}>
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="10"/>
              <circle cx="60" cy="60" r="52" fill="none"
                stroke={M.savings < 0 ? C.red : C.green}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={`${(savePct/100) * circumference} ${circumference}`}
                transform="rotate(-90 60 60)"
                style={{ transition:"stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)" }}/>
            </svg>
            <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontFamily:"monospace", fontSize:"1.6rem", fontWeight:700, color:"#fff", lineHeight:1 }}>{savePct.toFixed(0)}%</span>
              <span style={{ fontSize:"0.7rem", color:"rgba(255,255,255,.45)", fontWeight:500, marginTop:2, textTransform:"uppercase", letterSpacing:".06em" }}>saved</span>
            </div>
          </div>
        )}
      </section>

      {/* Month Selector */}
      {hasSalary && availableMonths.length > 0 && (
        <section className="inc-fu inc-fu2" style={{
          background:C.card, borderRadius:16, padding:"18px 22px",
          border:`1px solid ${C.border}`, boxShadow:C.s1, marginBottom:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.72rem",
              fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:C.muted }}>
              <FiCalendar size={12}/> View Month
            </label>
            <select value={selectedMonth}
              onChange={e => { setSelectedMonth(e.target.value); triggerFlash("month"); }}
              style={{ fontFamily:F, fontSize:"0.875rem", color:C.body, background:C.hover,
                border:`1.5px solid ${C.border}`, borderRadius:10, padding:"8px 32px 8px 14px",
                cursor:"pointer", outline:"none" }}>
              {availableMonths.map(m => <option key={m} value={m}>{m} {m === getCurrentMonth() ? "(Current - Predicted)" : ""}</option>)}
            </select>
            {selectedMonth === getCurrentMonth() && (
              <span style={{ fontSize:"0.7rem", padding:"4px 10px", borderRadius:20, background:C.blueL, color:C.blue }}>
                🤖 Using AI predictions
              </span>
            )}
          </div>
        </section>
      )}

      {/* DASHBOARD */}
      {hasSalary ? (
        <div style={{ animation:"incFadeUp .35s ease" }}>

          {/* KPI CARDS */}
          <section className="inc-fu inc-fu3" style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:20 }}>
            {kpis.map(({ label, val, sub, icon, colorKey }) => {
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
                      Rs. <AnimNum value={Math.abs(val)} colors={C}/>
                      {val < 0 && <span style={{ fontSize:"0.7rem", color:C.red, marginLeft:4 }}>deficit</span>}
                    </p>
                    {sub && <p style={{ fontSize:"0.65rem", color:C.faint, margin:0 }}>{sub}</p>}
                  </div>
                </div>
              );
            })}
          </section>

          {/* PROGRESS BARS */}
          <section style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:14, marginBottom:20 }}>
            {[
              { key:"electricity", label:"Electricity", icon:<FiZap size={16}/>, pct:M.elecPct, spent:M.elec, predicted:M.elecBudget, remaining:M.elecRemain, accent:C.amber, bg:C.amberL, bdr:C.amberM },
              { key:"water", label:"Water", icon:<FiDroplet size={16}/>, pct:M.waterPct, spent:M.water, predicted:M.waterBudget, remaining:M.waterRemain, accent:C.teal, bg:C.tealL, bdr:C.tealM },
            ].map(({ key, label, icon, pct, spent, predicted, remaining, accent, bg, bdr }) => {
              const barColor = pct > 100 ? C.red : pct > 90 ? C.amber : C.green;
              return (
                <div key={key} className="inc-bar-card"
                  style={{ background:C.card, borderRadius:14, padding:"20px 22px",
                    boxShadow:C.s1, border:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14, fontSize:"0.95rem", fontWeight:600, color:C.ink }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:bg, border:`1px solid ${bdr}`, display:"flex", alignItems:"center", justifyContent:"center", color:accent }}>{icon}</div>
                    <span>{label}</span>
                    <span style={{ marginLeft:"auto", fontFamily:"monospace", fontSize:"0.78rem", fontWeight:700, padding:"3px 10px", borderRadius:999, background:barColor === C.green ? C.greenL : barColor === C.amber ? C.amberL : C.redL, border:`1px solid ${barColor === C.green ? C.greenM : barColor === C.amber ? C.amberM : C.redM}`, color:barColor }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height:10, background:C.hover, borderRadius:999, overflow:"hidden", marginBottom:10 }}>
                    <div style={{ height:"100%", borderRadius:999, width:`${Math.min(pct,100)}%`, background:`linear-gradient(90deg,${barColor},${barColor}aa)`, transition:"width .55s cubic-bezier(.4,0,.2,1)" }}/>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.75rem", fontFamily:"monospace", color:C.faint }}>
                    <span>Rs. {spent.toLocaleString()} {selectedMonth === getCurrentMonth() ? "predicted" : "actual"}</span>
                    <span>Vs avg Rs. {predicted.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* CHARTS */}
          <section style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(440px,1fr))", gap:14, marginBottom:20 }}>
            <div className="inc-chart-card" style={{ background:C.card, borderRadius:14, padding:"22px 24px", boxShadow:C.s1, border:`1px solid ${C.border}` }}>
              <h3 style={{ fontSize:"0.75rem", fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em", margin:"0 0 18px" }}>Income vs Expenses</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                  <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                  <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<CTip/>}/>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:"0.75rem", fontFamily:F }}/>
                  <Bar dataKey="income" name="Income" fill={C.green} radius={[5,5,0,0]}/>
                  <Bar dataKey="expenses" name="Expenses" fill={C.red} radius={[5,5,0,0]}/>
                  <Bar dataKey="savings" name="Savings" fill={C.blue} radius={[5,5,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
              <p style={{ fontSize:"0.65rem", color:C.faint, textAlign:"center", marginTop:12 }}>
                * Current month values are predicted based on your usage history
              </p>
            </div>

            <div className="inc-chart-card" style={{ background:C.card, borderRadius:14, padding:"22px 24px", boxShadow:C.s1, border:`1px solid ${C.border}` }}>
              <h3 style={{ fontSize:"0.75rem", fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em", margin:"0 0 18px" }}>Utility Expenses History</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="igE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.amber} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={C.amber} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="igW" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.teal} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                  <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                  <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(1)}k`}/>
                  <Tooltip content={<CTip/>}/>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:"0.75rem", fontFamily:F }}/>
                  <Area type="monotone" dataKey="electricity" name="Electricity" stroke={C.amber} strokeWidth={2} fill="url(#igE)" dot={{ r:4, fill:C.amber }}/>
                  <Area type="monotone" dataKey="water" name="Water" stroke={C.teal} strokeWidth={2} fill="url(#igW)" dot={{ r:4, fill:C.teal }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* INSIGHTS */}
          <section style={{ background:C.card, borderRadius:14, padding:"22px 24px", boxShadow:C.s1, border:`1px solid ${C.border}`, marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, gap:12, flexWrap:"wrap" }}>
              <h3 style={{ fontSize:"0.75rem", fontWeight:700, color:C.muted, textTransform:"uppercase", letterSpacing:".07em", margin:0 }}>Financial Insights</h3>
              <button className="inc-export" onClick={() => {
                const rows = [
                  [`Budget Report — ${selectedMonth}`],[],
                  ["Monthly Salary", `Rs. ${salary.toLocaleString()}`],[],
                  ["Category", "Amount", "Status"],
                  ["Electricity", `Rs. ${M.elec.toLocaleString()}`, M.elecPct > 100 ? "Over Average" : M.elecPct > 90 ? "Near Average" : "Below Average"],
                  ["Water", `Rs. ${M.water.toLocaleString()}`, M.waterPct > 100 ? "Over Average" : M.waterPct > 90 ? "Near Average" : "Below Average"],
                  ["Total Expenses", `Rs. ${M.total.toLocaleString()}`],
                  ["Net Savings", `Rs. ${M.savings.toLocaleString()}`],
                ];
                const csv = rows.map(r => r.join(",")).join("\n");
                const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href=url; a.download=`budget_${selectedMonth.replace(" ","_")}.csv`;
                a.style.display="none"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
              }} style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 14px", borderRadius:9, border:`1px solid ${C.border}`, background:C.card, fontFamily:F, fontSize:"0.78rem", fontWeight:600, color:C.muted, cursor:"pointer", transition:"all .18s" }}>
                <FiDownload size={13}/> Export CSV
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {insights.map((ins,i) => {
                const style = insightColors[ins.type] || insightColors.success;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderRadius:10, background:style.bg, border:`1px solid ${style.bdr}`, fontSize:"0.875rem", fontWeight:500 }}>
                    <span style={{ display:"flex", flexShrink:0, color:style.color }}>{style.icon}</span>
                    <p style={{ margin:0, color:style.color }}>{ins.text}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}