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
  FiDroplet, FiZap, FiDollarSign,
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

  const { data } = { data: dashboardData };
  // const monthName = data.currentMonth?.split(" ")[0] || "April";
  const displayName = authUser?.name || "User";
  
  const PIE = [
    { name:"Electricity", value:data.distribution?.electricity || 62, color:C.blue },
    { name:"Water", value:data.distribution?.water || 28, color:C.teal },
    { name:"Fixed Fees", value:data.distribution?.fixedFees || 10, color:C.violet },
  ];

  const overBudget = data.current?.budgetPct >= 100;
  const nearBudget = data.current?.budgetPct >= 85 && !overBudget;

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
                  letterSpacing:"0.1em", textTransform:"uppercase" }}>Live · {data.currentMonth}</span>
              </div>
              <h1 style={{ fontSize:"1.125rem", fontWeight:700, color:"rgba(255,255,255,.8)",
                margin:"0 0 4px", letterSpacing:"-0.01em" }}>
                Good morning{displayName ? `, ${displayName}` : ""} 👋
              </h1>
              <p style={{ fontSize:"0.8rem", color:"rgba(255,255,255,.6)", margin:"0 0 18px" }}>
                Here's your utility overview for this month
              </p>
              <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:8 }}>
                <span style={{ fontSize:"3rem", fontWeight:800, color:"#fff",
                  letterSpacing:"-0.05em", lineHeight:1 }}>
                  Rs. {data.current?.total?.toLocaleString() || 0}
                </span>
                <Badge val={data.predictions?.totalChange || 0}/>
              </div>
              <p style={{ fontSize:"0.78rem", color:"rgba(255,255,255,.6)", margin:0 }}>
                Current month total · Budget: Rs. {data.current?.budget?.toLocaleString() || 0}
              </p>
            </div>

            <div style={{ background:"rgba(255,255,255,.12)", backdropFilter:"blur(12px)",
              border:"1px solid rgba(255,255,255,.18)", borderRadius:16, padding:"18px 22px",
              minWidth:200, flexShrink:0 }}>
              <p style={{ fontSize:"0.68rem", fontWeight:700, color:"rgba(255,255,255,.65)",
                textTransform:"uppercase", letterSpacing:"0.1em", margin:"0 0 10px" }}>Budget Used</p>
              <div style={{ display:"flex", alignItems:"center", gap:14 }}>
                <div style={{ position:"relative", width:56, height:56, flexShrink:0 }}>
                  <svg viewBox="0 0 56 56" style={{ transform:"rotate(-90deg)", width:56, height:56 }}>
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="6"/>
                    <circle cx="28" cy="28" r="22" fill="none"
                      stroke={data.current?.budgetPct > 90 ? "#fbbf24" : "#4ade80"} strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 22 * (data.current?.budgetPct || 0) / 100} 999`}
                      strokeLinecap="round"/>
                  </svg>
                  <span style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
                    justifyContent:"center", fontSize:"0.75rem", fontWeight:800, color:"#fff" }}>
                    {data.current?.budgetPct || 0}%
                  </span>
                </div>
                <div>
                  <p style={{ fontSize:"1rem", fontWeight:800, color:"#fff", margin:"0 0 2px" }}>
                    Rs. {data.current?.total?.toLocaleString() || 0}
                  </p>
                  <p style={{ fontSize:"0.72rem", color:"rgba(255,255,255,.6)", margin:0 }}>
                    of Rs. {data.current?.budget?.toLocaleString() || 0}
                  </p>
                  <p style={{ fontSize:"0.7rem", color: (data.current?.budgetPct || 0) > 90 ? "#fbbf24" : "#4ade80",
                    margin:"4px 0 0", fontWeight:600 }}>
                    {overBudget ? "⚠ Over budget" : nearBudget ? "⚡ Approaching limit" : "✓ Within budget"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STAT CARDS - Current Month */}
        <Label mb={12}>This Month at a Glance</Label>
        <p style={{ fontSize:"0.68rem", fontWeight:700, color:C.muted, margin:"0 0 8px",
          display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:C.ink, display:"inline-block" }}/>
          Current Month
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:16 }}>
          {[
            { icon:<FiDroplet size={17}/>, title:"Water Bill", accent:C.teal, bg:C.tealL, bdr:C.tealM, cls:"fu1",
              primary:`Rs. ${data.current?.waterBill?.toLocaleString() || 0}`, secondary:`${data.current?.water || 0} Units used`, chg:data.predictions?.waterBillChange || 0 },
            { icon:<FiZap size={17}/>, title:"Electricity Bill", accent:C.blue, bg:C.blueL, bdr:C.blueM, cls:"fu2",
              primary:`Rs. ${data.current?.elecBill?.toLocaleString() || 0}`, secondary:`${data.current?.elec || 0} kWh used`, chg:data.predictions?.elecBillChange || 0 },
            { icon:<FiDollarSign size={17}/>, title:"Total Bill", accent:C.violet, bg:C.violetL, bdr:C.violetM, cls:"fu3",
              primary:`Rs. ${data.current?.total?.toLocaleString() || 0}`, secondary:"This month's total", chg:data.predictions?.totalChange || 0 },
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
                  <Badge val={s.chg}/>
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

        {/* STAT CARDS - Predictions */}
        <p style={{ fontSize:"0.68rem", fontWeight:700, color:C.amber, margin:"0 0 8px",
          display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:C.amber, display:"inline-block" }}/>
          Predicted Next Month
        </p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14, marginBottom:32 }}>
          {[
            { icon:<FiDroplet size={17}/>, title:"Water Bill", accent:C.teal, bg:C.tealL, bdr:C.tealM, cls:"fu4",
              primary:`Rs. ${data.predictions?.waterBill?.toLocaleString() || 0}`, secondary:`${data.predictions?.water || 0} Units est.`, chg:data.predictions?.waterBillChange || 0 },
            { icon:<FiZap size={17}/>, title:"Electricity Bill", accent:C.blue, bg:C.blueL, bdr:C.blueM, cls:"fu5",
              primary:`Rs. ${data.predictions?.elecBill?.toLocaleString() || 0}`, secondary:`${data.predictions?.elec || 0} kWh est.`, chg:data.predictions?.elecBillChange || 0 },
            { icon:<FiBarChart2 size={17}/>, title:"Total Predicted", accent:C.amber, bg:C.amberL, bdr:C.amberM, cls:"fu5",
              primary:`Rs. ${data.predictions?.total?.toLocaleString() || 0}`, secondary:"Overall next month", chg:data.predictions?.totalChange || 0 },
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
                  <Badge val={s.chg}/>
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

        {/* PREDICTION TABLE */}
        <Label mb={12}>Next Month Prediction</Label>
        <div className="fu fu3" style={{ marginBottom:32 }}>
          <Card style={{ padding:0 }}>
            <div style={{ padding:"18px 24px 16px", borderBottom:`1px solid ${C.border}`,
              display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
              <div>
                <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 2px" }}>Forecast Breakdown</h3>
                <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>
                  Predicted usage & billing for next month — based on 6-month trend analysis
                </p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 10px",
                background:C.blueL, border:`1px solid ${C.blueM}`, borderRadius:8 }}>
                <FiInfo size={12} color={C.blue}/>
                <span style={{ fontSize:"0.7rem", fontWeight:600, color:C.blue }}>Confidence: High</span>
              </div>
            </div>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:F }}>
                <thead>
                  <tr style={{ background:C.hover }}>
                    {["Utility","Current Month","","Predicted Next Month","Change"].map((h,i) => (
                      <th key={i} style={{ padding:"10px 20px", fontSize:"0.67rem", fontWeight:800,
                        color:C.muted, textTransform:"uppercase", letterSpacing:"0.1em",
                        textAlign:i===0?"left":"right", borderBottom:`1px solid ${C.border}`,
                        whiteSpace:"nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { icon:<FiDroplet size={15}/>, label:"Water", accent:C.teal, bg:C.tealL, bdr:C.tealM,
                      curUnits:`${data.current?.water || 0} Units`, curBill:`Rs. ${data.current?.waterBill?.toLocaleString() || 0}`,
                      predUnits:`${data.predictions?.water || 0} Units`, predBill:`Rs. ${data.predictions?.waterBill?.toLocaleString() || 0}`,
                      unitsChg:data.predictions?.waterUnitsChange || 0, billChg:data.predictions?.waterBillChange || 0 },
                    { icon:<FiZap size={15}/>, label:"Electricity", accent:C.blue, bg:C.blueL, bdr:C.blueM,
                      curUnits:`${data.current?.elec || 0} kWh`, curBill:`Rs. ${data.current?.elecBill?.toLocaleString() || 0}`,
                      predUnits:`${data.predictions?.elec || 0} kWh`, predBill:`Rs. ${data.predictions?.elecBill?.toLocaleString() || 0}`,
                      unitsChg:data.predictions?.elecUnitsChange || 0, billChg:data.predictions?.elecBillChange || 0 },
                    { icon:<FiActivity size={15}/>, label:"Fixed Fees", accent:C.violet, bg:C.violetL, bdr:C.violetM,
                      curUnits:"—", curBill:`Rs. ${data.current?.fixedFees?.toLocaleString() || 0}`,
                      predUnits:"—", predBill:`Rs. ${data.predictions?.fixedFees?.toLocaleString() || 0}`,
                      unitsChg:null, billChg:data.predictions?.fixedFeesChange || 0 },
                  ].map((row,i) => (
                    <tr key={i} style={{ borderBottom:`1px solid ${C.border}` }}>
                      <td style={{ padding:"14px 20px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                          <div style={{ width:32, height:32, borderRadius:8, background:row.bg,
                            border:`1px solid ${row.bdr}`, display:"flex", alignItems:"center",
                            justifyContent:"center", color:row.accent, flexShrink:0 }}>{row.icon}</div>
                          <span style={{ fontSize:"0.85rem", fontWeight:700, color:C.ink }}>{row.label}</span>
                        </div>
                      </td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}>
                        <p style={{ fontSize:"0.85rem", fontWeight:700, color:C.ink, margin:"0 0 2px" }}>{row.curBill}</p>
                        <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>{row.curUnits}</p>
                      </td>
                      <td style={{ padding:"14px 10px", textAlign:"center" }}><FiChevronRight size={14} color={C.faint}/></td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}>
                        <p style={{ fontSize:"0.85rem", fontWeight:700, color:C.blue, margin:"0 0 2px" }}>{row.predBill}</p>
                        <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>{row.predUnits}</p>
                      </td>
                      <td style={{ padding:"14px 20px", textAlign:"right" }}>
                        <Badge val={row.billChg}/>
                        {row.unitsChg !== null && (
                          <p style={{ fontSize:"0.68rem", color:C.faint, margin:"3px 0 0", textAlign:"right" }}>
                            Units: {row.unitsChg > 0 ? "+" : ""}{row.unitsChg}%
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                  <tr style={{
                    background:"rgba(37, 99, 235, 0.08)",
                    borderTop:`1px solid ${C.blue}30`,
                    borderBottom:`1px solid ${C.blue}30`
                  }}>
                    <td style={{ padding:"16px 20px" }}>
                      <span style={{ fontSize:"0.875rem", fontWeight:800, color:C.ink }}>Total Estimated Bill</span>
                    </td>
                    <td style={{ padding:"16px 20px", textAlign:"right" }}>
                      <span style={{ fontSize:"0.925rem", fontWeight:700, color:C.ink }}>Rs. {data.current?.total?.toLocaleString() || 0}</span>
                    </td>
                    <td style={{ padding:"16px 10px", textAlign:"center" }}><FiChevronRight size={14} color={C.blue}/></td>
                    <td style={{ padding:"16px 20px", textAlign:"right" }}>
                      <span style={{ fontSize:"1rem", fontWeight:800, color:C.blue, letterSpacing:"-0.02em" }}>
                        Rs. {data.predictions?.total?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td style={{ padding:"16px 20px", textAlign:"right" }}><Badge val={data.predictions?.totalChange || 0}/></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ padding:"16px 24px", borderTop:`1px solid ${C.border}`, background:C.hover,
              display:"flex", gap:24, flexWrap:"wrap", alignItems:"center" }}>
              <p style={{ fontSize:"0.72rem", color:C.muted, margin:0, flex:1 }}>📈 Bill trend over last 6 months</p>
              <div style={{ flex:2, minWidth:200 }}>
                <ResponsiveContainer width="100%" height={40}>
                  <AreaChart data={data.trends || []} margin={{ top:4, right:4, left:4, bottom:4 }}>
                    <defs>
                      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={C.blue} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="total" stroke={C.blue} strokeWidth={2}
                      fill="url(#trendGrad)" dot={false}/>
                    <ReferenceLine x="Dec*" stroke={C.blue} strokeDasharray="3 3" strokeOpacity={0.5}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        {/* ANALYTICS */}
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
              <AreaChart data={data.trends || []} margin={{ top:10, right:16, left:-10, bottom:0 }}>
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
              <BarChart data={data.trends || []} margin={{ top:10, right:16, left:-10, bottom:0 }} barCategoryGap="35%">
                <CartesianGrid strokeDasharray="4 4" stroke={darkMode ? "#334155" : "#e8eaf0"} vertical={false}/>
                <XAxis dataKey="m" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip content={<Tip prefix="Rs."/>}/>
                <ReferenceLine x="Dec*" stroke={C.blue} strokeDasharray="3 3"/>
                <Bar dataKey="total" radius={[6,6,0,0]} name="Total Bill (Rs.)" fill={C.blue}>
                  {(data.trends || []).map((d,i) => (
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
                <strong>Highest month</strong> predicted next month. Review your usage patterns.
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
                    💡 Electricity is your biggest cost driver. Shifting to off-peak hours can save ~15%.
                  </p>
                </div>
              </div>
            </div>
          </ChartCard>

          <ChartCard title="Per-Utility Bill Comparison" sub="Water vs Electricity billing last 6 months (Rs.)">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={data.comparison || []} margin={{ top:10, right:16, left:-10, bottom:0 }} barCategoryGap="25%">
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
          {(data.alerts || []).map((alert, i) => {
            const getIcon = () => {
              if (alert.icon === "water") return <FiDroplet size={17}/>;
              if (alert.icon === "elec") return <FiZap size={17}/>;
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
    </div>
  );
}