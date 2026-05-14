// src/pages/Dashboard.jsx
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer,
} from "recharts";
import {
  FiDroplet, FiZap, FiWifi, FiDollarSign,
  FiAlertTriangle, FiArrowUp, FiArrowDown,
  FiActivity, FiBarChart2, FiChevronRight, FiInfo,
} from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { dashboardAPI } from "../services/api";

(() => {
  if (!document.getElementById("db-font")) {
    const l = document.createElement("link");
    l.id = "db-font"; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap";
    document.head.appendChild(l);
  }
  if (!document.getElementById("db-anim")) {
    const s = document.createElement("style");
    s.id = "db-anim";
    s.textContent = `
      @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
      @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
      .fu  { animation: fadeUp .45s ease both }
      .fu1 { animation-delay:.06s }  .fu2 { animation-delay:.12s }
      .fu3 { animation-delay:.18s }  .fu4 { animation-delay:.24s }
      .fu5 { animation-delay:.30s }  .fu6 { animation-delay:.36s }
      .fu7 { animation-delay:.42s }
      .live{ animation: pulse 2.2s ease-in-out infinite }
      .db-hover:hover { transform:translateY(-3px)!important; box-shadow:0 8px 28px rgba(0,0,0,.10)!important; }
    `;
    document.head.appendChild(s);
  }
})();

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";

export default function Dashboard() {
  const { user: authUser } = useAuth();
  const { darkMode } = useTheme();
  const [activeTab, setActiveTab] = useState("Both");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [showBudgetInfo, setShowBudgetInfo] = useState(false);

  const C = {
    page:   darkMode ? "#0f172a" : "#f3f4f8",
    card:   darkMode ? "#1e293b" : "#ffffff",
    hover:  darkMode ? "#334155" : "#f0f2f7",
    ink:    darkMode ? "#f1f5f9" : "#0f172a",
    body:   darkMode ? "#cbd5e1" : "#334155",
    muted:  darkMode ? "#94a3b8" : "#64748b",
    faint:  darkMode ? "#64748b" : "#94a3b8",
    border: darkMode ? "#334155" : "#e2e8f0",
    borderB:darkMode ? "#475569" : "#cbd5e1",
    blue:"#2563eb",
    blueD:"#1d4ed8",
    blueL: darkMode ? "rgba(37,99,235,0.15)" : "#eff6ff",
    blueM: darkMode ? "#1e3a8a" : "#bfdbfe",
    teal:"#0891b2",
    tealL: darkMode ? "rgba(8,145,178,0.15)" : "#ecfeff",
    tealM: darkMode ? "#164e63" : "#a5f3fc",
    green:"#059669",
    greenL: darkMode ? "rgba(5,150,105,0.15)" : "#ecfdf5",
    greenM: darkMode ? "#064e3b" : "#a7f3d0",
    amber:"#d97706",
    amberL: darkMode ? "rgba(217,119,6,0.15)" : "#fffbeb",
    amberM: darkMode ? "#78350f" : "#fde68a",
    red:"#dc2626",
    redL: darkMode ? "rgba(220,38,38,0.15)" : "#fef2f2",
    redM: darkMode ? "#7f1d1d" : "#fecaca",
    violet:"#7c3aed",
    violetL: darkMode ? "rgba(124,58,237,0.15)" : "#f5f3ff",
    violetM: darkMode ? "#4c1d95" : "#ddd6fe",
    indigo: "#4f46e5",
    indigoL: darkMode ? "rgba(79,70,229,0.15)" : "#eef2ff",
    indigoM: darkMode ? "#312e81" : "#c7d2fe",
    s1:"0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
    s2:"0 4px 16px rgba(15,23,42,.08),0 2px 4px rgba(15,23,42,.04)",
    s3:"0 12px 40px rgba(15,23,42,.10),0 4px 8px rgba(15,23,42,.04)",
  };

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardAPI.getSummary();
      if (res.data?.success) {
        setDashboardData(res.data.data);
      } else {
        setError("Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Fetch dashboard error:", err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Calculate budget limit based on budget mode
  const budgetMode  = dashboardData?.budgetMode  || "salary";
  const fixedBudget = dashboardData?.fixedBudget || 0;
  const salaryAmt   = dashboardData?.salary      || 0;
  const budgetLimit = budgetMode === "fixed"
    ? fixedBudget
    : salaryAmt > 0 ? Math.round(salaryAmt * 0.08) : 0;

  // Extract values with internet support
  const previousWaterBill = dashboardData?.previous?.waterBill || 0;
  const previousElecBill = dashboardData?.previous?.elecBill || 0;
  const previousInternetBill = dashboardData?.previous?.internetBill || 0;
  const previousWaterUnits = dashboardData?.previous?.water || 0;
  const previousElecUnits = dashboardData?.previous?.elec || 0;
  const previousTotal = dashboardData?.previous?.total || 0;

  const predictedWaterBill = dashboardData?.predictions?.waterBill || 0;
  const predictedElecBill = dashboardData?.predictions?.elecBill || 0;
  const predictedInternetBill = dashboardData?.predictions?.internetBill || 0;
  const predictedWaterUnits = dashboardData?.predictions?.water || 0;
  const predictedElecUnits = dashboardData?.predictions?.elec || 0;
  const predictedTotal = dashboardData?.predictions?.total || 0;
  const predictedWaterChange = dashboardData?.predictions?.waterChange || 0;
  const predictedElecChange = dashboardData?.predictions?.elecChange || 0;
  const predictedInternetChange = dashboardData?.predictions?.internetChange || 0;
  const predictedTotalChange = dashboardData?.predictions?.totalChange || 0;

  // Check if user has internet data
  const hasInternet = previousInternetBill > 0 || predictedInternetBill > 0;

  const nextMonthData = dashboardData?.nextMonth || {};
  const nextWaterBill = nextMonthData.waterBill || 0;
  const nextElecBill = nextMonthData.elecBill || 0;
  const nextInternetBill = nextMonthData.internetBill || 0;
  const nextWaterUnits = nextMonthData.water || 0;
  const nextElecUnits = nextMonthData.elec || 0;
  const nextTotal = nextMonthData.total || 0;

  const previousMonthLabel = dashboardData?.previousMonth || "March 2026";
  const currentMonthLabel = dashboardData?.currentMonth || "April 2026";
  const nextMonthLabel = dashboardData?.nextMonthLabel || dashboardData?.nextMonthName || "May 2026";

  // Pie chart data - conditionally include internet
  const PIE = [
    { name:"Electricity", value:dashboardData?.distribution?.electricity || 65, color:C.blue },
    { name:"Water", value:dashboardData?.distribution?.water || 35, color:C.teal },
    ...(hasInternet ? [{ name:"Internet", value:dashboardData?.distribution?.internet || 0, color:C.indigo }] : []),
  ];

  const Badge = ({ val }) => {
    const up = val >= 0;
    return (
      <span style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"2px 7px", borderRadius:20,
        fontSize:"0.68rem", fontWeight:700,
        background:up?C.greenL:C.redL, border:`1px solid ${up?C.greenM:C.redM}`, color:up?C.green:C.red }}>
        {up ? <FiArrowUp size={10}/> : <FiArrowDown size={10}/>}
        {Math.abs(val)}%
      </span>
    );
  };

  const Label = ({ children, mb=14 }) => (
    <p style={{ fontSize:"0.63rem", fontWeight:800, letterSpacing:"0.15em", textTransform:"uppercase",
      color:C.faint, margin:`0 0 ${mb}px` }}>{children}</p>
  );

  const Card = ({ children, style={}, cls="" }) => (
    <div className={`fu db-hover ${cls}`} style={{ background:C.card, borderRadius:16,
      border:`1px solid ${C.border}`, boxShadow:C.s1, overflow:"hidden",
      transition:"transform .22s ease, box-shadow .22s ease", ...style }}>
      {children}
    </div>
  );

  const ChartCard = ({ title, sub, children, action, style={} }) => (
    <Card style={style}>
      <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div>
          <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 2px" }}>{title}</h3>
          {sub && <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>{sub}</p>}
        </div>
        {action}
      </div>
      <div style={{ padding:"12px 8px 18px" }}>{children}</div>
    </Card>
  );

  const Tip = ({ active, payload, label, prefix="" }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
        padding:"10px 14px", boxShadow:C.s3, fontFamily:F, minWidth:145 }}>
        <p style={{ fontSize:"0.7rem", fontWeight:700, color:C.muted, margin:"0 0 8px",
          textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</p>
        {payload.map((p,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:i<payload.length-1?5:0 }}>
            <span style={{ width:8, height:8, borderRadius:2, background:p.color, display:"inline-block" }}/>
            <span style={{ fontSize:"0.75rem", color:C.muted, flex:1 }}>{p.name}</span>
            <span style={{ fontSize:"0.8125rem", fontWeight:700, color:C.ink }}>{prefix}{p.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    );
  };

  const ax = { fill:C.faint, fontSize:11, fontFamily:F };

  const BudgetInfoModal = () => {
    if (!showBudgetInfo) return null;
    const percentUsed = budgetLimit > 0 ? Math.min(Math.round((predictedTotal / budgetLimit) * 100), 100) : 0;
    
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 9999
      }} onClick={() => setShowBudgetInfo(false)}>
        <div style={{
          background: C.card, borderRadius: 20, padding: "24px",
          maxWidth: 320, width: "90%"
        }} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 16 }}>📊 Understanding Your Budget</h3>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            <p style={{ fontSize: "0.8rem", marginBottom: 12 }}><strong>Calculation:</strong></p>
            <ul style={{ fontSize: "0.75rem", paddingLeft: 20, marginBottom: 16 }}>
              {budgetMode === "fixed" ? (
                <>
                  <li>Fixed budget limit: <strong>Rs. {budgetLimit.toLocaleString()}</strong></li>
                  <li>Predicted bill: <strong>Rs. {predictedTotal.toLocaleString()}</strong></li>
                  <li>{predictedTotal.toLocaleString()} ÷ {budgetLimit.toLocaleString()} × 100 = <strong>{percentUsed}%</strong></li>
                </>
              ) : (
                <>
                  <li>Monthly salary: <strong>Rs. {salaryAmt.toLocaleString()}</strong></li>
                  <li>8% utility budget: <strong>Rs. {budgetLimit.toLocaleString()}</strong></li>
                  <li>Predicted bill: <strong>Rs. {predictedTotal.toLocaleString()}</strong></li>
                  <li>{predictedTotal.toLocaleString()} ÷ {budgetLimit.toLocaleString()} × 100 = <strong>{percentUsed}%</strong></li>
                </>
              )}
            </ul>
            <div style={{ background: C.blueL, borderRadius: 8, padding: "10px", textAlign: "center" }}>
              <span style={{ fontSize: "0.7rem", color: C.blue }}>
                ✅ {percentUsed}% of your {budgetMode === "fixed" ? "fixed" : "8%"} utility budget
              </span>
            </div>
          </div>
          <button onClick={() => setShowBudgetInfo(false)} style={{
            width: "100%", marginTop: 16, padding: "10px",
            background: C.blue, border: "none", borderRadius: 10,
            color: "#fff", fontWeight: 600, cursor: "pointer"
          }}>Got it</button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, color:C.ink, padding:"28px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, color:C.muted }}>
          <div style={{ width:18, height:18, border:`2px solid ${C.border}`, borderTopColor:C.blue, borderRadius:"50%", animation:"spin 0.7s linear infinite" }}/>
          Loading dashboard...
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, color:C.ink, padding:"28px 32px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"14px 18px", borderRadius:12, background:C.redL, border:`1px solid ${C.redM}`, color:C.red, fontSize:"0.875rem" }}>
          <FiAlertTriangle size={16}/>
          <div style={{ flex:1 }}>{error || "Failed to load dashboard data"}</div>
          <button onClick={fetchDashboardData} style={{ padding:"5px 12px", borderRadius:7, border:`1px solid ${C.redM}`, background:"transparent", color:C.red, cursor:"pointer" }}>Retry</button>
        </div>
      </div>
    );
  }

  const displayName = authUser?.name || "User";

  return (
    <div style={{ minHeight:"100vh", background:C.page, fontFamily:F, color:C.ink, padding:"0 0 64px" }}>
      <div style={{ padding:"28px 32px 0" }}>

        {/* HERO */}
        <div className="fu fu1" style={{ background:`linear-gradient(130deg,#1e3a8a 0%,#2563eb 55%,#0891b2 100%)`,
          borderRadius:20, padding:"28px 32px", marginBottom:28, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:-40, right:-40, width:200, height:200,
            borderRadius:"50%", background:"rgba(255,255,255,.06)" }}/>
          <div style={{ position:"absolute", bottom:-30, right:120, width:120, height:120,
            borderRadius:"50%", background:"rgba(255,255,255,.04)" }}/>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
            flexWrap:"wrap", gap:20, position:"relative" }}>
            <div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span className="live" style={{ width:7, height:7, borderRadius:"50%",
                  background:"#4ade80", display:"inline-block" }}/>
                <span style={{ fontSize:"0.7rem", fontWeight:700, color:"rgba(255,255,255,.7)",
                  letterSpacing:"0.1em", textTransform:"uppercase" }}>📊 {currentMonthLabel} · ML Prediction</span>
              </div>
              <h1 style={{ fontSize:"1.125rem", fontWeight:700, color:"rgba(255,255,255,.8)",
                margin:"0 0 4px", letterSpacing:"-0.01em" }}>
                Good morning{displayName ? `, ${displayName}` : ""} 👋
              </h1>
              <p style={{ fontSize:"0.8rem", color:"rgba(255,255,255,.6)", margin:"0 0 18px" }}>
                Your AI-powered utility forecast for this month
              </p>
              <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:8 }}>
                <span style={{ fontSize:"3rem", fontWeight:800, color:"#fff",
                  letterSpacing:"-0.05em", lineHeight:1 }}>
                  Rs. {predictedTotal.toLocaleString()}
                </span>
                <Badge val={predictedTotalChange}/>
              </div>
              <p style={{ fontSize:"0.78rem", color:"rgba(255,255,255,.6)", margin:0 }}>
                Estimated {currentMonthLabel} bill · Budget: Rs. {budgetLimit > 0 ? budgetLimit.toLocaleString() : "Not set"}
              </p>
            </div>

            {budgetLimit > 0 ? (
              <div style={{ background:"rgba(255,255,255,.12)", backdropFilter:"blur(12px)",
                border:"1px solid rgba(255,255,255,.18)", borderRadius:16, padding:"18px 22px",
                minWidth:200, flexShrink:0 }}>
                
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <p style={{ fontSize:"0.68rem", fontWeight:700, color:"rgba(255,255,255,.65)",
                    textTransform:"uppercase", letterSpacing:"0.1em", margin:0 }}>
                    {budgetMode === "fixed"
                      ? `Budget Used (vs Rs. ${budgetLimit.toLocaleString()} limit)`
                      : "Budget Used (vs 8% of salary)"}
                  </p>
                  <FiInfo 
                    size={12} 
                    color="rgba(255,255,255,.7)" 
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowBudgetInfo(true)}
                  />
                </div>
                
                <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ position:"relative", width:56, height:56, flexShrink:0 }}>
                    <svg viewBox="0 0 56 56" style={{ transform:"rotate(-90deg)", width:56, height:56 }}>
                      <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="6"/>
                      <circle cx="28" cy="28" r="22" fill="none"
                        stroke={(() => {
                          const percent = budgetLimit > 0 ? Math.min(Math.round((predictedTotal / budgetLimit) * 100), 100) : 0;
                          return percent > 90 ? "#fbbf24" : "#4ade80";
                        })()} 
                        strokeWidth="6"
                        strokeDasharray={`${2 * Math.PI * 22 * (budgetLimit > 0 ? Math.min(Math.round((predictedTotal / budgetLimit) * 100), 100) : 0) / 100} 999`}
                        strokeLinecap="round"/>
                    </svg>
                    <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:"0.75rem", fontWeight:800, color:"#fff" }}>
                      {budgetLimit > 0 ? Math.min(Math.round((predictedTotal / budgetLimit) * 100), 100) : 0}%
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize:"1rem", fontWeight:800, color:"#fff", margin:"0 0 2px" }}>
                      Rs. {predictedTotal.toLocaleString()}
                    </p>
                    <p style={{ fontSize:"0.72rem", color:"rgba(255,255,255,.6)", margin:0 }}>
                      of Rs. {budgetLimit.toLocaleString()}
                    </p>
                    <p style={{ fontSize:"0.7rem", color: (budgetLimit > 0 ? Math.min(Math.round((predictedTotal / budgetLimit) * 100), 100) : 0) > 90 ? "#fbbf24" : "#4ade80",
                      margin:"4px 0 0", fontWeight:600 }}>
                      {(budgetLimit > 0 ? Math.min(Math.round((predictedTotal / budgetLimit) * 100), 100) : 0) >= 100 ? "⚠ Over budget" : 
                       (budgetLimit > 0 ? Math.min(Math.round((predictedTotal / budgetLimit) * 100), 100) : 0) >= 85 ? "⚡ Approaching limit" : "✓ Within budget"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background:"rgba(255,255,255,.12)", backdropFilter:"blur(12px)",
                border:"1px solid rgba(255,255,255,.18)", borderRadius:16, padding:"18px 22px",
                minWidth:200, flexShrink:0, textAlign:"center" }}>
                <p style={{ fontSize:"0.8rem", color:"rgba(255,255,255,.7)", margin:"0 0 10px" }}>
                  💰 Budget not set up yet
                </p>
                <p style={{ fontSize:"0.72rem", color:"rgba(255,255,255,.5)", margin:0 }}>
                  Visit the Budget page to set your spending limit
                </p>
              </div>
            )}
          </div>
        </div>

        {/* LAST MONTH - ACTUAL */}
        <Label mb={12}>Last Month's Bill</Label>
        <p style={{ fontSize:"0.68rem", fontWeight:700, color:C.green, margin:"0 0 8px",
          display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:C.green, display:"inline-block" }}/>
          ✅ {previousMonthLabel} (Actual)
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:16 }}>
          {[
            { icon:<FiDroplet size={17}/>, title:"Water Bill", accent:C.teal, bg:C.tealL, bdr:C.tealM, cls:"fu1",
              primary:`Rs. ${previousWaterBill.toLocaleString()}`, secondary:`${previousWaterUnits} Units used` },
            { icon:<FiZap size={17}/>, title:"Electricity Bill", accent:C.blue, bg:C.blueL, bdr:C.blueM, cls:"fu2",
              primary:`Rs. ${previousElecBill.toLocaleString()}`, secondary:`${previousElecUnits} kWh used` },
            ...(hasInternet ? [{
              icon:<FiWifi size={17}/>, title:"Internet Bill", accent:C.indigo, bg:C.indigoL, bdr:C.indigoM, cls:"fu3",
              primary:`Rs. ${previousInternetBill.toLocaleString()}`, secondary:"Flat rate"
            }] : []),
            { icon:<FiDollarSign size={17}/>, title:"Total Bill", accent:C.violet, bg:C.violetL, bdr:C.violetM, cls:"fu4",
              primary:`Rs. ${previousTotal.toLocaleString()}`, secondary:`${previousMonthLabel} total` },
          ].map((s,i) => (
            <div key={i} className={`fu db-hover ${s.cls}`} style={{ background:C.card,
              border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden",
              boxShadow:C.s1, transition:"transform .22s ease, box-shadow .22s ease" }}>
              <div style={{ height:3, background:`linear-gradient(90deg,${s.accent},${s.accent}55)` }}/>
              <div style={{ padding:"15px 17px 17px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:11 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:s.bg,
                    border:`1px solid ${s.bdr}`, display:"flex", alignItems:"center",
                    justifyContent:"center", color:s.accent }}>{s.icon}</div>
                </div>
                <p style={{ fontSize:"0.67rem", fontWeight:800, color:C.muted, letterSpacing:"0.1em",
                  textTransform:"uppercase", margin:"0 0 3px" }}>{s.title}</p>
                <span style={{ fontSize:"1.35rem", fontWeight:800, color:C.ink,
                  letterSpacing:"-0.03em", lineHeight:1, display:"block", marginBottom:3 }}>{s.primary}</span>
                <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>{s.secondary}</p>
              </div>
            </div>
          ))}
        </div>

        {/* THIS MONTH - ML PREDICTION */}
        <Label mb={12}>This Month's AI Prediction</Label>
        <p style={{ fontSize:"0.68rem", fontWeight:700, color:C.amber, margin:"0 0 8px",
          display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:C.amber, display:"inline-block" }}/>
          🤖 {currentMonthLabel} (ML Estimated)
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:16 }}>
          {[
            { icon:<FiDroplet size={17}/>, title:"Water Bill", accent:C.teal, bg:C.tealL, bdr:C.tealM, cls:"fu1",
              primary:`Rs. ${predictedWaterBill.toLocaleString()}`, secondary:`${predictedWaterUnits} Units predicted`, chg:predictedWaterChange },
            { icon:<FiZap size={17}/>, title:"Electricity Bill", accent:C.blue, bg:C.blueL, bdr:C.blueM, cls:"fu2",
              primary:`Rs. ${predictedElecBill.toLocaleString()}`, secondary:`${predictedElecUnits} kWh predicted`, chg:predictedElecChange },
            ...(hasInternet ? [{
              icon:<FiWifi size={17}/>, title:"Internet Bill", accent:C.indigo, bg:C.indigoL, bdr:C.indigoM, cls:"fu3",
              primary:`Rs. ${predictedInternetBill.toLocaleString()}`, secondary:"Flat rate", chg:predictedInternetChange
            }] : []),
            { icon:<FiDollarSign size={17}/>, title:"Total Bill", accent:C.violet, bg:C.violetL, bdr:C.violetM, cls:"fu4",
              primary:`Rs. ${predictedTotal.toLocaleString()}`, secondary:`Estimated ${currentMonthLabel} total`, chg:predictedTotalChange },
          ].map((s,i) => (
            <div key={i} className={`fu db-hover ${s.cls}`} style={{ background:C.card,
              border:`1px solid ${C.border}`, borderRadius:14, overflow:"hidden",
              boxShadow:C.s1, transition:"transform .22s ease, box-shadow .22s ease" }}>
              <div style={{ height:3, background:`linear-gradient(90deg,${s.accent},${s.accent}55)` }}/>
              <div style={{ padding:"15px 17px 17px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:11 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:s.bg,
                    border:`1px solid ${s.bdr}`, display:"flex", alignItems:"center",
                    justifyContent:"center", color:s.accent }}>{s.icon}</div>
                  {s.chg !== undefined && <Badge val={s.chg}/>}
                </div>
                <p style={{ fontSize:"0.67rem", fontWeight:800, color:C.muted, letterSpacing:"0.1em",
                  textTransform:"uppercase", margin:"0 0 3px" }}>{s.title}</p>
                <span style={{ fontSize:"1.35rem", fontWeight:800, color:C.ink,
                  letterSpacing:"-0.03em", lineHeight:1, display:"block", marginBottom:3 }}>{s.primary}</span>
                <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>{s.secondary}</p>
              </div>
            </div>
          ))}
        </div>

        {/* NEXT MONTH - FORECAST */}
        <p style={{ fontSize:"0.68rem", fontWeight:700, color:C.violet, margin:"0 0 8px",
          display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:C.violet, display:"inline-block" }}/>
          📈 {nextMonthLabel} (Forecast)
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:32 }}>
          {[
            { icon:<FiDroplet size={17}/>, title:"Water Bill", accent:C.teal, bg:C.tealL, bdr:C.tealM, cls:"fu5",
              primary:`Rs. ${nextWaterBill.toLocaleString()}`, secondary:`${nextWaterUnits} Units est.` },
            { icon:<FiZap size={17}/>, title:"Electricity Bill", accent:C.blue, bg:C.blueL, bdr:C.blueM, cls:"fu6",
              primary:`Rs. ${nextElecBill.toLocaleString()}`, secondary:`${nextElecUnits} kWh est.` },
            ...(hasInternet ? [{
              icon:<FiWifi size={17}/>, title:"Internet Bill", accent:C.indigo, bg:C.indigoL, bdr:C.indigoM, cls:"fu7",
              primary:`Rs. ${nextInternetBill.toLocaleString()}`, secondary:"Flat rate est."
            }] : []),
            { icon:<FiBarChart2 size={17}/>, title:"Total Forecast", accent:C.amber, bg:C.amberL, bdr:C.amberM, cls:"fu7",
              primary:`Rs. ${nextTotal.toLocaleString()}`, secondary:`Projected ${nextMonthLabel} total` },
          ].map((s,i) => (
            <div key={i} className={`fu db-hover ${s.cls}`} style={{ background:C.card,
              border:`1px solid ${s.bdr}`, borderRadius:14, overflow:"hidden",
              boxShadow:C.s1, transition:"transform .22s ease, box-shadow .22s ease" }}>
              <div style={{ height:3,
                background:`repeating-linear-gradient(90deg,${s.accent} 0px,${s.accent} 8px,transparent 8px,transparent 14px)` }}/>
              <div style={{ padding:"15px 17px 17px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:11 }}>
                  <div style={{ width:36, height:36, borderRadius:9, background:s.bg,
                    border:`1px solid ${s.bdr}`, display:"flex", alignItems:"center",
                    justifyContent:"center", color:s.accent }}>{s.icon}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                  <p style={{ fontSize:"0.67rem", fontWeight:800, color:C.muted, letterSpacing:"0.1em",
                    textTransform:"uppercase", margin:0 }}>{s.title}</p>
                  <span style={{ fontSize:"0.58rem", fontWeight:700, color:s.accent,
                    background:s.bg, border:`1px solid ${s.bdr}`, borderRadius:4,
                    padding:"1px 5px", textTransform:"uppercase", letterSpacing:"0.06em" }}>Est.</span>
                </div>
                <span style={{ fontSize:"1.35rem", fontWeight:800, color:s.accent,
                  letterSpacing:"-0.03em", lineHeight:1, display:"block", marginBottom:3 }}>{s.primary}</span>
                <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>{s.secondary}</p>
              </div>
            </div>
          ))}
        </div>

        {/* COMPARISON TABLE */}
<Label mb={12}>Monthly Comparison</Label>
<div className="fu fu3" style={{ marginBottom:32 }}>
  <Card style={{ padding:0 }}>
    <div style={{ padding:"18px 24px 16px", borderBottom:`1px solid ${C.border}`,
      display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
      <div>
        <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 2px" }}>Bill Comparison</h3>
        <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>
          Actual vs Predicted vs Forecast
        </p>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px",
        background:C.blueL, border:`1px solid ${C.blueM}`, borderRadius:8 }}>
        <FiInfo size={12} color={C.blue}/>
        <span style={{ fontSize:"0.7rem", fontWeight:600, color:C.blue }}>Confidence: {dashboardData?.predictions?.confidence || "Medium"}</span>
      </div>
    </div>
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:F }}>
        <thead>
          <tr style={{ background:C.hover }}>
            <th style={{ padding:"10px 20px", textAlign:"left", fontSize:"0.67rem", fontWeight:800,
              color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}>Utility</th>
            <th style={{ padding:"10px 20px", textAlign:"right", fontSize:"0.67rem", fontWeight:800,
              color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}>{previousMonthLabel} (Actual)</th>
            <th style={{ padding:"10px 20px", textAlign:"center", fontSize:"0.67rem", fontWeight:800,
              color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}></th>
            <th style={{ padding:"10px 20px", textAlign:"right", fontSize:"0.67rem", fontWeight:800,
              color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}>{currentMonthLabel} (Predicted)</th>
            <th style={{ padding:"10px 20px", textAlign:"center", fontSize:"0.67rem", fontWeight:800,
              color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}></th>
            <th style={{ padding:"10px 20px", textAlign:"right", fontSize:"0.67rem", fontWeight:800,
              color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}>{nextMonthLabel} (Forecast)</th>
            <th style={{ padding:"10px 20px", textAlign:"right", fontSize:"0.67rem", fontWeight:800,
              color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em" }}>Change</th>
          </tr>
        </thead>
        <tbody>
          {[
            { icon:<FiDroplet size={15}/>, label:"Water", accent:C.teal, bg:C.tealL, bdr:C.tealM,
              actualUnits:`${previousWaterUnits} Units`, actualBill:`Rs. ${previousWaterBill.toLocaleString()}`,
              predUnits:`${predictedWaterUnits} Units`, predBill:`Rs. ${predictedWaterBill.toLocaleString()}`,
              forecastUnits:`${nextWaterUnits} Units`, forecastBill:`Rs. ${nextWaterBill.toLocaleString()}`,
              change:predictedWaterChange },
            { icon:<FiZap size={15}/>, label:"Electricity", accent:C.blue, bg:C.blueL, bdr:C.blueM,
              actualUnits:`${previousElecUnits} kWh`, actualBill:`Rs. ${previousElecBill.toLocaleString()}`,
              predUnits:`${predictedElecUnits} kWh`, predBill:`Rs. ${predictedElecBill.toLocaleString()}`,
              forecastUnits:`${nextElecUnits} kWh`, forecastBill:`Rs. ${nextElecBill.toLocaleString()}`,
              change:predictedElecChange },
            ...(hasInternet ? [{
              icon:<FiWifi size={15}/>, label:"Internet", accent:C.indigo, bg:C.indigoL, bdr:C.indigoM,
              actualUnits:"Flat rate", actualBill:`Rs. ${previousInternetBill.toLocaleString()}`,
              predUnits:"Flat rate", predBill:`Rs. ${predictedInternetBill.toLocaleString()}`,
              forecastUnits:"Flat rate", forecastBill:`Rs. ${nextInternetBill.toLocaleString()}`,
              change:predictedInternetChange
            }] : []),
          ].map((row, idx) => (
            <tr key={idx} style={{ borderBottom:`1px solid ${C.border}` }}>
              <td style={{ padding:"14px 20px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:row.bg,
                    border:`1px solid ${row.bdr}`, display:"flex", alignItems:"center",
                    justifyContent:"center", color:row.accent, flexShrink:0 }}>{row.icon}</div>
                  <span style={{ fontSize:"0.85rem", fontWeight:700, color:C.ink }}>{row.label}</span>
                </div>
              </td>
              <td style={{ padding:"14px 20px", textAlign:"right" }}>
                <p style={{ fontSize:"0.85rem", fontWeight:700, color:C.ink, margin:"0 0 2px" }}>{row.actualBill}</p>
                <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>{row.actualUnits}</p>
              </td>
              <td style={{ padding:"14px 10px", textAlign:"center" }}><FiChevronRight size={14} color={C.faint}/></td>
              <td style={{ padding:"14px 20px", textAlign:"right" }}>
                <p style={{ fontSize:"0.85rem", fontWeight:700, color:C.blue, margin:"0 0 2px" }}>{row.predBill}</p>
                <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>{row.predUnits}</p>
              </td>
              <td style={{ padding:"14px 10px", textAlign:"center" }}><FiChevronRight size={14} color={C.faint}/></td>
              <td style={{ padding:"14px 20px", textAlign:"right" }}>
                <p style={{ fontSize:"0.85rem", fontWeight:700, color:C.violet, margin:"0 0 2px" }}>{row.forecastBill}</p>
                <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>{row.forecastUnits}</p>
              </td>
              <td style={{ padding:"14px 20px", textAlign:"right" }}>
                <Badge val={row.change}/>
              </td>
            </tr>
          ))}
          <tr style={{
            background:"rgba(37, 99, 235, 0.08)",
            borderTop:`1px solid ${C.blue}30`,
            borderBottom:`1px solid ${C.blue}30`
          }}>
            <td style={{ padding:"16px 20px" }}>
              <span style={{ fontSize:"0.875rem", fontWeight:800, color:C.ink }}>Total</span>
            </td>
            <td style={{ padding:"16px 20px", textAlign:"right" }}>
              <span style={{ fontSize:"0.925rem", fontWeight:700, color:C.ink }}>Rs. {previousTotal.toLocaleString()}</span>
            </td>
            <td style={{ padding:"16px 10px", textAlign:"center" }}><FiChevronRight size={14} color={C.faint}/></td>
            <td style={{ padding:"16px 20px", textAlign:"right" }}>
              <span style={{ fontSize:"0.925rem", fontWeight:700, color:C.blue }}>Rs. {predictedTotal.toLocaleString()}</span>
            </td>
            <td style={{ padding:"16px 10px", textAlign:"center" }}><FiChevronRight size={14} color={C.faint}/></td>
            <td style={{ padding:"16px 20px", textAlign:"right" }}>
              <span style={{ fontSize:"0.925rem", fontWeight:700, color:C.violet }}>Rs. {nextTotal.toLocaleString()}</span>
            </td>
            <td style={{ padding:"16px 20px", textAlign:"right" }}><Badge val={predictedTotalChange}/></td>
          </tr>
        </tbody>
      </table>
    </div>
  </Card>
</div>

        {/* ANALYTICS CHARTS */}
        <Label mb={12}>Analytics &amp; Trends</Label>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(420px,1fr))", gap:20, marginBottom:20 }}>
          <ChartCard title="Monthly Usage Trend" sub="Water & Electricity — last 6 months"
            action={
              <div style={{ display:"flex", background:C.hover, border:`1px solid ${C.border}`,
                borderRadius:8, padding:3, gap:2 }}>
                {["Water","Elec","Both"].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    style={{ padding:"4px 10px", borderRadius:6, border:"none",
                      background:activeTab===t?C.card:"transparent",
                      color:activeTab===t?C.blue:C.muted,
                      fontFamily:F, fontSize:"0.72rem", fontWeight:600,
                      cursor:"pointer", boxShadow:activeTab===t?C.s1:"none", transition:"all .15s" }}>{t}</button>
                ))}
              </div>
            }>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={dashboardData?.trends || []} margin={{ top:10, right:16, left:-10, bottom:0 }}>
                <defs>
                  <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.teal} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.blue} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={darkMode ? "#334155" : "#e8eaf0"} vertical={false}/>
                <XAxis dataKey="m" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>
                <ReferenceLine x="Dec*" stroke={C.blue} strokeDasharray="3 3"
                  label={{ value:"Predicted", fill:C.blue, fontSize:10, position:"insideTopLeft" }}/>
                <Legend wrapperStyle={{ fontSize:"0.75rem", fontFamily:F, paddingTop:8 }}/>
                {(activeTab==="Both"||activeTab==="Water") &&
                  <Area type="monotone" dataKey="water" stroke={C.teal} strokeWidth={2.5}
                    fill="url(#gW)" name="Water (Units)" dot={false} activeDot={{ r:5 }}/>}
                {(activeTab==="Both"||activeTab==="Elec") &&
                  <Area type="monotone" dataKey="elec" stroke={C.blue} strokeWidth={2.5}
                    fill="url(#gE)" name="Electricity (kWh)" dot={false} activeDot={{ r:5 }}/>}
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Monthly Bill Trend" sub="Total billing cost over recent months (Rs.)">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={dashboardData?.trends || []} margin={{ top:10, right:16, left:-10, bottom:0 }} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="4 4" stroke={darkMode ? "#334155" : "#e8eaf0"} vertical={false}/>
                <XAxis dataKey="m" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<Tip prefix="Rs."/>}/>
                <ReferenceLine x="Dec*" stroke={C.blue} strokeDasharray="3 3"/>
                <Bar dataKey="total" radius={[6,6,0,0]} name="Total Bill (Rs.)" fill={C.blue}>
                  {(dashboardData?.trends || []).map((d,i) => (
                    <Cell key={i} fill={d.m?.includes("*") ? C.blueL : C.blue}
                      stroke={d.m?.includes("*") ? C.blue : "none"} strokeWidth={d.m?.includes("*") ? 2 : 0}/>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ margin:"0 8px", padding:"10px 14px", background:C.amberL,
              border:`1px solid ${C.amberM}`, borderRadius:9, display:"flex", gap:8, alignItems:"flex-start" }}>
              <FiAlertTriangle size={13} color={C.amber} style={{ marginTop:1, flexShrink:0 }}/>
              <p style={{ fontSize:"0.72rem", color:C.body, margin:0, lineHeight:1.55 }}>
                <strong>AI Analysis:</strong> Your usage shows seasonal patterns. ML predictions help you plan ahead.
              </p>
            </div>
          </ChartCard>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(360px,1fr))", gap:20, marginBottom:32 }}>
          <ChartCard title="Bill Distribution" sub="Share of total bill by utility category">
            <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={PIE} cx="50%" cy="50%" innerRadius={52} outerRadius={78}
                    paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {PIE.map((e,i) => <Cell key={i} fill={e.color}/>)}
                  </Pie>
                  <Tooltip formatter={v=>`${v}%`} contentStyle={{ fontFamily:F, borderRadius:9,
                    border:`1px solid ${C.border}`, boxShadow:C.s3, fontSize:"0.8rem" }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex:1, minWidth:140 }}>
                {PIE.map((d,i) => (
                  <div key={i} style={{ marginBottom:i<PIE.length-1?14:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                        <span style={{ width:10, height:10, borderRadius:3, background:d.color, display:"inline-block" }}/>
                        <span style={{ fontSize:"0.8rem", fontWeight:600, color:C.body }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize:"0.8rem", fontWeight:700, color:C.ink }}>{d.value}%</span>
                    </div>
                    <div style={{ height:5, background:C.hover, borderRadius:99 }}>
                      <div style={{ height:"100%", width:`${d.value}%`, background:d.color, borderRadius:99 }}/>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:14, padding:"10px 12px", background:C.blueL,
                  border:`1px solid ${C.blueM}`, borderRadius:8 }}>
                  <p style={{ fontSize:"0.7rem", color:C.blue, margin:0, lineHeight:1.55, fontWeight:500 }}>
                    💡 Electricity is your biggest cost driver. ML predictions help you optimize usage.
                  </p>
                </div>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Per-Utility Bill Comparison" sub="Water vs Electricity billing last 6 months (Rs.)">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={dashboardData?.comparison || []} margin={{ top:10, right:16, left:-10, bottom:0 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="4 4" stroke={darkMode ? "#334155" : "#e8eaf0"} vertical={false}/>
                <XAxis dataKey="m" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(1)}k`}/>
                <Tooltip content={<Tip prefix="Rs."/>}/>
                <Legend wrapperStyle={{ fontSize:"0.75rem", fontFamily:F, paddingTop:8 }}/>
                <ReferenceLine x="Dec*" stroke={C.blue} strokeDasharray="3 3"/>
                <Bar dataKey="waterBill" fill={C.teal} radius={[4,4,0,0]} name="Water (Rs.)"/>
                <Bar dataKey="elecBill"  fill={C.blue} radius={[4,4,0,0]} name="Electricity (Rs.)"/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* ALERTS */}
        <Label mb={12}>Alerts &amp; Recommendations</Label>
        <div className="fu fu6" style={{ display:"grid",
          gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))", gap:12, marginBottom:8 }}>
          {(dashboardData?.alerts || []).map((alert, i) => {
            const getIcon = () => {
              if (alert.icon === "water") return <FiDroplet size={17}/>;
              if (alert.icon === "elec") return <FiZap size={17}/>;
              if (alert.icon === "internet") return <FiWifi size={17}/>;
              return <FiActivity size={17}/>;
            };
            const getColors = () => {
              if (alert.type === "warning") return { accent:C.amber, bg:C.amberL, bdr:C.amberM };
              if (alert.type === "danger") return { accent:C.red, bg:C.redL, bdr:C.redM };
              if (alert.type === "success") return { accent:C.green, bg:C.greenL, bdr:C.greenM };
              return { accent:C.blue, bg:C.blueL, bdr:C.blueM };
            };
            const colors = getColors();
            return (
              <div key={i} className="db-hover"
                style={{ background:colors.bg, border:`1px solid ${colors.bdr}`, borderRadius:12,
                  padding:"14px 16px", display:"flex", alignItems:"flex-start", gap:11,
                  transition:"transform .2s ease, box-shadow .2s ease", cursor:"default" }}>
                <span style={{ color:colors.accent, marginTop:1, flexShrink:0 }}>{getIcon()}</span>
                <div>
                  <h4 style={{ fontSize:"0.83rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>{alert.title}</h4>
                  <p style={{ fontSize:"0.77rem", color:C.body, margin:0, lineHeight:1.55 }}>{alert.body}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
      <BudgetInfoModal />
    </div>
  );
}