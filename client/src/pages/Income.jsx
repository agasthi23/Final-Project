// src/pages/Income.jsx
// ORIGINAL logic 100% preserved — only design tokens updated to match dashboard
import { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend,
} from "recharts";
import {
  FiZap, FiDroplet, FiTrendingUp, FiTrendingDown, FiDollarSign,
  FiCheck, FiAlertTriangle, FiXCircle, FiX, FiDownload, FiCalendar,
} from "react-icons/fi";

/* ─── Font (shared with dashboard) ─── */
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
    @keyframes incFieldFlash { 0%,100%{background:transparent} 40%{background:rgba(37,99,235,.04);border-radius:10px} }
    .inc-fu  { animation: incFadeUp .4s ease both }
    .inc-fu1 { animation-delay:.05s } .inc-fu2 { animation-delay:.10s }
    .inc-fu3 { animation-delay:.15s } .inc-fu4 { animation-delay:.20s }
    .inc-kpi:hover    { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .inc-bar-card:hover { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .inc-chart-card:hover { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .inc-hero-flash  { animation: incHeroFlash .5s ease !important; }
    .inc-field-flash { animation: incFieldFlash .5s ease !important; }
    .inc-export:hover { background:#0f172a!important; color:#fff!important; border-color:#0f172a!important; }
  `;
  document.head.appendChild(s);
}

/* ════ TOKENS — identical to Dashboard ════ */
const C = {
  page:"#f3f4f8", card:"#fff", hover:"#f0f2f7",
  ink:"#0f172a", body:"#334155", muted:"#64748b", faint:"#94a3b8",
  border:"#e2e8f0",
  blue:"#2563eb", blueL:"#eff6ff", blueM:"#bfdbfe",
  teal:"#0891b2", tealL:"#ecfeff", tealM:"#a5f3fc",
  green:"#059669", greenL:"#ecfdf5", greenM:"#a7f3d0", greenD:"#065f46",
  amber:"#d97706", amberL:"#fffbeb", amberM:"#fde68a", amberD:"#92400e",
  red:"#dc2626",   redL:"#fef2f2",   redM:"#fecaca",   redD:"#991b1b",
  violet:"#7c3aed",violetL:"#f5f3ff",violetM:"#ddd6fe",
  s1:"0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
  s2:"0 4px 16px rgba(15,23,42,.08),0 2px 4px rgba(15,23,42,.04)",
  s3:"0 12px 40px rgba(15,23,42,.10),0 4px 8px rgba(15,23,42,.04)",
};
const F = "'Plus Jakarta Sans',-apple-system,sans-serif";
const ax = { fill:C.faint, fontSize:11, fontFamily:F };

/* ════ ANIMATED COUNTER (original, unchanged) ════ */
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

/* ════ TOAST (original logic, dashboard styling) ════ */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 5500); return () => clearTimeout(t); }, [onClose]);
  const isWarn = type === "warning";
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:12, padding:"14px 18px",
      borderRadius:12, maxWidth:360, fontSize:"0.875rem", fontWeight:500,
      color:"#fff", boxShadow:C.s3, fontFamily:F,
      background: isWarn ? C.amber : C.red,
    }}>
      <span style={{ display:"flex", flexShrink:0 }}>
        {isWarn ? <FiAlertTriangle size={17}/> : <FiXCircle size={17}/>}
      </span>
      <p style={{ margin:0, flex:1 }}>{message}</p>
      <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer",
        display:"flex", padding:0, color:"rgba(255,255,255,.65)" }}>
        <FiX size={15}/>
      </button>
    </div>
  );
};

/* ════ CUSTOM TOOLTIP (original logic, dashboard styling) ════ */
const CTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
      padding:"10px 14px", boxShadow:C.s3, fontFamily:F, minWidth:150 }}>
      <p style={{ fontSize:"0.7rem", fontWeight:700, color:C.muted, margin:"0 0 7px",
        textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</p>
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

/* ════ MAIN COMPONENT ════ */
export default function Income() {

  /* ── ORIGINAL STATE & DATA (unchanged) ── */
  const [billsData] = useState([
    { id:1,  utilityType:"Electricity", billingMonth:"June 2025",      billAmount:2750 },
    { id:2,  utilityType:"Water",       billingMonth:"June 2025",      billAmount:880  },
    { id:3,  utilityType:"Electricity", billingMonth:"July 2025",      billAmount:2950 },
    { id:4,  utilityType:"Water",       billingMonth:"July 2025",      billAmount:960  },
    { id:5,  utilityType:"Electricity", billingMonth:"August 2025",    billAmount:3250 },
    { id:6,  utilityType:"Water",       billingMonth:"August 2025",    billAmount:1040 },
    { id:7,  utilityType:"Electricity", billingMonth:"September 2025", billAmount:3000 },
    { id:8,  utilityType:"Water",       billingMonth:"September 2025", billAmount:920  },
    { id:9,  utilityType:"Electricity", billingMonth:"October 2025",   billAmount:2820 },
    { id:10, utilityType:"Water",       billingMonth:"October 2025",   billAmount:840  },
    { id:11, utilityType:"Electricity", billingMonth:"November 2025",  billAmount:2650 },
    { id:12, utilityType:"Water",       billingMonth:"November 2025",  billAmount:800  },
  ]);

  const [rawIncome,     setRawIncome]     = useState("");
  const [rawElec,       setRawElec]       = useState("3000");
  const [rawWater,      setRawWater]      = useState("1500");
  const [selectedMonth, setSelectedMonth] = useState("November 2025");
  const [toast,         setToast]         = useState(null);
  const [flash,         setFlash]         = useState(null);

  /* ── ORIGINAL HELPERS (unchanged) ── */
  const parseNum = (str) => parseInt(str.replace(/[^0-9]/g, ""), 10) || 0;
  const income   = parseNum(rawIncome);
  const budgets  = { electricity: parseNum(rawElec), water: parseNum(rawWater) };
  const hasIncome = income > 0;

  const digitsOnly = (e) => {
    if (!/[0-9]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"].includes(e.key))
      e.preventDefault();
  };

  const availableMonths = useMemo(() => {
    const months = [...new Set(billsData.map(b => b.billingMonth))];
    const order  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return months.sort((a,b) => order.indexOf(a.split(" ")[0]) - order.indexOf(b.split(" ")[0]));
  }, [billsData]);

  const M = useMemo(() => {
    const mb    = billsData.filter(b => b.billingMonth === selectedMonth);
    const elec  = mb.filter(b => b.utilityType==="Electricity").reduce((s,b) => s+b.billAmount, 0);
    const water = mb.filter(b => b.utilityType==="Water").reduce((s,b) => s+b.billAmount, 0);
    const total = elec + water;
    return {
      total, elec, water,
      elecRemain:  budgets.electricity - elec,
      waterRemain: budgets.water - water,
      elecPct:     budgets.electricity > 0 ? (elec  / budgets.electricity)*100 : 0,
      waterPct:    budgets.water       > 0 ? (water / budgets.water)*100       : 0,
      incPct:      income > 0 ? (total / income)*100 : 0,
      savings:     income - total,
    };
  }, [billsData, selectedMonth, income, budgets]);

  const chartData = useMemo(() => {
    const abbr = m => m.split(" ")[0].slice(0,3);
    return availableMonths.slice(-6).map(month => {
      const exp = billsData.filter(b => b.billingMonth===month).reduce((s,b) => s+b.billAmount, 0);
      return { month:abbr(month), income, expenses:exp, savings:Math.max(income-exp,0) };
    });
  }, [availableMonths, billsData, income]);

  const historyData = [
    { month:"Jun", electricity:2800, water:1200 },
    { month:"Jul", electricity:2900, water:1300 },
    { month:"Aug", electricity:3000, water:1400 },
    { month:"Sep", electricity:3100, water:1450 },
    { month:"Oct", electricity:3200, water:1500 },
    { month:"Nov", electricity:3000, water:1500 },
  ];

  const insights = useMemo(() => {
    const list = [];
    if (M.elecPct  > 100) list.push({ type:"critical", text:`Electricity budget exceeded by ${(M.elecPct-100).toFixed(1)}%.`  });
    else if (M.elecPct  > 90) list.push({ type:"warning", text:`Electricity is at ${M.elecPct.toFixed(1)}% of budget.`  });
    if (M.waterPct > 100) list.push({ type:"critical", text:`Water budget exceeded by ${(M.waterPct-100).toFixed(1)}%.` });
    else if (M.waterPct > 90) list.push({ type:"warning", text:`Water is at ${M.waterPct.toFixed(1)}% of budget.` });
    if (!list.length) list.push({ type:"success", text:"Both utilities are within budget — great job!" });
    if (income > 0 && M.savings > 0) list.push({ type:"success", text:`You keep Rs. ${M.savings.toLocaleString()} after utility costs this month.` });
    if (income > 0 && M.savings < 0) list.push({ type:"critical", text:`Utilities exceed your income by Rs. ${Math.abs(M.savings).toLocaleString()}.` });
    return list;
  }, [M, income]);

  useEffect(() => {
    const alert = insights.find(i => i.type==="critical" || i.type==="warning");
    if (alert && hasIncome) setToast({ message:alert.text, type:alert.type });
  }, [insights, hasIncome]);

  const triggerFlash = (key) => { setFlash(key); setTimeout(() => setFlash(null), 900); };

  const savePct       = income > 0 ? Math.max(0, Math.min(((income-M.total)/income)*100, 100)) : 0;
  const circumference = 2 * Math.PI * 52;

  const kpis = [
    { label:"Monthly Income",        val:income,       icon:<FiDollarSign size={18}/>,  colorKey:"green" },
    { label:"Total Expenses",        val:M.total,      icon:<FiTrendingUp size={18}/>,  colorKey:"red"   },
    { label:"Electricity Remaining", val:M.elecRemain, icon:<FiZap size={18}/>,         colorKey:"amber" },
    { label:"Water Remaining",       val:M.waterRemain,icon:<FiDroplet size={18}/>,     colorKey:"teal"  },
    { label:"Net Savings",           val:M.savings,    icon:M.savings>=0?<FiDollarSign size={18}/>:<FiTrendingDown size={18}/>, colorKey:M.savings>=0?"green":"red" },
  ];

  const kpiColors = {
    green: { accent:C.green,  bg:C.greenL,  bdr:C.greenM  },
    red:   { accent:C.red,    bg:C.redL,    bdr:C.redM    },
    amber: { accent:C.amber,  bg:C.amberL,  bdr:C.amberM  },
    teal:  { accent:C.teal,   bg:C.tealL,   bdr:C.tealM   },
  };

  const insightColors = {
    success:  { accent:C.green,  bg:C.greenL,  bdr:C.greenM,  icon:<FiCheck size={16}/> },
    warning:  { accent:C.amber,  bg:C.amberL,  bdr:C.amberM,  icon:<FiAlertTriangle size={16}/> },
    critical: { accent:C.red,    bg:C.redL,    bdr:C.redM,    icon:<FiXCircle size={16}/> },
  };

  /* ════ RENDER ════ */
  return (
    <div style={{ minHeight:"100vh", background:C.page, fontFamily:F,
      color:C.ink, padding:"28px 32px 64px" }}>

      {/* ════════════════════════
          HERO — salary entry
          (original layout, dashboard styling)
          ════════════════════════ */}
      <section className="inc-fu inc-fu1" style={{
        background:C.ink, borderRadius:20, padding: hasIncome ? "36px 44px" : "44px 48px",
        marginBottom:20, display:"flex", alignItems:"center",
        justifyContent:"space-between", gap:40, position:"relative",
        overflow:"hidden", transition:"padding .3s ease",
        boxShadow:"0 8px 40px rgba(15,23,42,.20)",
      }}>
        {/* subtle texture overlay */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", opacity:0.03,
          backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")" }}/>

        <div style={{ flex:1, minWidth:0, position:"relative", zIndex:1 }}>
          {/* Step badge */}
          <span style={{ display:"inline-block", padding:"4px 12px", borderRadius:999,
            background:"rgba(255,255,255,.1)", color:"rgba(255,255,255,.65)",
            fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.08em",
            textTransform:"uppercase", marginBottom:14 }}>
            Step 1 · Income
          </span>

          <h1 style={{ fontSize:"1.65rem", fontWeight:800, color:"#fff",
            margin:"0 0 8px", letterSpacing:"-0.03em", lineHeight:1.15 }}>
            What's your monthly take-home salary?
          </h1>
          <p style={{ fontSize:"0.875rem", color:"rgba(255,255,255,.5)",
            margin:"0 0 22px", maxWidth:440 }}>
            Everything below — expenses, savings, budget health — is calculated from this number.
          </p>

          {/* Input field */}
          <div className={flash==="income" ? "inc-hero-flash" : ""}
            style={{ display:"flex", alignItems:"center",
              background: hasIncome ? "rgba(5,150,105,.15)" : "rgba(255,255,255,.08)",
              border:`1.5px solid ${hasIncome ? "rgba(5,150,105,.5)" : "rgba(255,255,255,.12)"}`,
              borderRadius:14, padding:"0 18px", maxWidth:400,
              transition:"border-color .2s, background .2s" }}>
            <span style={{ fontFamily:"monospace", fontSize:"0.85rem", fontWeight:600,
              color:"rgba(255,255,255,.4)", marginRight:10, flexShrink:0 }}>Rs.</span>
            <input type="text" inputMode="numeric"
              placeholder="e.g. 60000"
              value={rawIncome}
              onKeyDown={digitsOnly}
              onChange={e => {
                const clean = e.target.value.replace(/[^0-9]/g, "");
                setRawIncome(clean);
                if (parseNum(clean) > 0) triggerFlash("income");
              }}
              style={{ flex:1, background:"transparent", border:"none", outline:"none",
                fontFamily:"monospace", fontSize:"1.5rem", fontWeight:600,
                color:"#fff", padding:"18px 0", minWidth:0 }}/>
            {hasIncome && (
              <span style={{ display:"flex", width:28, height:28, borderRadius:"50%",
                background:C.green, color:"#fff", alignItems:"center", justifyContent:"center",
                flexShrink:0, marginLeft:10,
                animation:"incPopIn .25s cubic-bezier(.34,1.56,.64,1)" }}>
                <FiCheck size={14}/>
              </span>
            )}
          </div>

          {/* Pills — original logic */}
          {hasIncome && (
            <div style={{ display:"flex", gap:10, marginTop:16, flexWrap:"wrap",
              animation:"incFadeUp .3s ease" }}>
              <span style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
                borderRadius:999, fontSize:"0.82rem", fontWeight:600,
                background:"rgba(220,38,38,.2)", color:"#fca5a5" }}>
                <FiTrendingUp size={13}/>
                {M.incPct.toFixed(1)}% on utilities
              </span>
              <span style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px",
                borderRadius:999, fontSize:"0.82rem", fontWeight:600,
                background: M.savings>=0 ? "rgba(5,150,105,.2)" : "rgba(220,38,38,.2)",
                color:       M.savings>=0 ? "#6ee7b7" : "#fca5a5" }}>
                {M.savings>=0 ? <FiDollarSign size={13}/> : <FiTrendingDown size={13}/>}
                {M.savings>=0 ? "Saves" : "Deficit"} Rs. {Math.abs(M.savings).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Donut ring — original */}
        <div style={{ position:"relative", width:130, height:130, flexShrink:0,
          opacity: hasIncome ? 1 : 0,
          transform: hasIncome ? "scale(1)" : "scale(0.8)",
          transition:"opacity .4s ease, transform .4s cubic-bezier(.34,1.56,.64,1)" }}>
          <svg viewBox="0 0 120 120" style={{ width:"100%", height:"100%" }}>
            <circle cx="60" cy="60" r="52" fill="none"
              stroke="rgba(255,255,255,.1)" strokeWidth="10"/>
            <circle cx="60" cy="60" r="52" fill="none"
              stroke={M.savings<0 ? C.red : C.green}
              strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${(savePct/100)*circumference} ${circumference}`}
              transform="rotate(-90 60 60)"
              style={{ transition:"stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)" }}/>
          </svg>
          <div style={{ position:"absolute", inset:0, display:"flex",
            flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
            <span style={{ fontFamily:"monospace", fontSize:"1.6rem",
              fontWeight:700, color:"#fff", lineHeight:1 }}>
              {savePct.toFixed(0)}%
            </span>
            <span style={{ fontSize:"0.7rem", color:"rgba(255,255,255,.45)",
              fontWeight:500, marginTop:2, textTransform:"uppercase", letterSpacing:".06em" }}>
              saved
            </span>
          </div>
        </div>
      </section>

      {/* ════════════════════════
          STEP 2 — budgets & month
          (original layout, dashboard card style)
          ════════════════════════ */}
      <section className="inc-fu inc-fu2" style={{
        background:C.card, borderRadius:16, padding:"22px 26px",
        border:`1px solid ${C.border}`, boxShadow:C.s1, marginBottom:20 }}>

        <div style={{ marginBottom:18 }}>
          <span style={{ display:"inline-block", fontSize:"0.68rem", fontWeight:700,
            textTransform:"uppercase", letterSpacing:".1em", color:C.muted,
            background:C.hover, padding:"3px 10px", borderRadius:999, marginBottom:6 }}>
            Step 2 · Budget Settings
          </span>
          <p style={{ margin:0, fontSize:"0.875rem", color:C.muted }}>
            Set limits per utility, then pick the month you want to review.
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16 }}>
          {/* Month */}
          <div className={flash==="month" ? "inc-field-flash" : ""}
            style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.72rem",
              fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:C.muted }}>
              <FiCalendar size={12}/> Month
            </label>
            <div style={{ position:"relative" }}>
              <select value={selectedMonth}
                onChange={e => { setSelectedMonth(e.target.value); triggerFlash("month"); }}
                style={{ fontFamily:F, fontSize:"0.875rem", color:C.body,
                  background:C.hover, border:`1.5px solid ${C.border}`,
                  borderRadius:10, padding:"10px 36px 10px 14px",
                  width:"100%", appearance:"none", cursor:"pointer", outline:"none",
                  transition:"border-color .15s, box-shadow .15s" }}
                onFocus={e => { e.target.style.borderColor=C.blue; e.target.style.boxShadow=`0 0 0 3px ${C.blueM}55`; e.target.style.background=C.card; }}
                onBlur={e  => { e.target.style.borderColor=C.border; e.target.style.boxShadow="none"; e.target.style.background=C.hover; }}>
                {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                stroke={C.faint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ position:"absolute", right:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          {/* Electricity Budget */}
          <div className={flash==="electricity" ? "inc-field-flash" : ""}
            style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.72rem",
              fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:C.amber }}>
              <FiZap size={12}/> Electricity Budget
            </label>
            <div style={{ display:"flex", border:`1.5px solid ${C.border}`,
              borderRadius:10, background:C.hover, overflow:"hidden",
              transition:"border-color .15s, box-shadow .15s" }}
              onFocusCapture={e => { e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.boxShadow=`0 0 0 3px ${C.blueM}55`; e.currentTarget.style.background=C.card; }}
              onBlurCapture={e  => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.background=C.hover; }}>
              <span style={{ fontSize:"0.72rem", fontWeight:700, color:C.faint,
                background:"transparent", padding:"0 12px", display:"flex",
                alignItems:"center", borderRight:`1.5px solid ${C.border}`, whiteSpace:"nowrap" }}>
                Rs.
              </span>
              <input type="text" inputMode="numeric" value={rawElec}
                onKeyDown={digitsOnly}
                onChange={e => { const c=e.target.value.replace(/[^0-9]/g,""); setRawElec(c); triggerFlash("electricity"); }}
                style={{ fontFamily:F, fontSize:"0.9rem", color:C.body,
                  background:"transparent", border:"none", outline:"none",
                  padding:"10px 14px", flex:1, minWidth:0 }}/>
            </div>
            <span style={{ fontSize:"0.7rem", color:C.faint, fontFamily:"monospace" }}>
              {M.elecPct.toFixed(1)}% used · Rs. {(budgets.electricity-M.elec).toLocaleString()} remaining
            </span>
          </div>

          {/* Water Budget */}
          <div className={flash==="water" ? "inc-field-flash" : ""}
            style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.72rem",
              fontWeight:700, textTransform:"uppercase", letterSpacing:".06em", color:C.teal }}>
              <FiDroplet size={12}/> Water Budget
            </label>
            <div style={{ display:"flex", border:`1.5px solid ${C.border}`,
              borderRadius:10, background:C.hover, overflow:"hidden",
              transition:"border-color .15s, box-shadow .15s" }}
              onFocusCapture={e => { e.currentTarget.style.borderColor=C.blue; e.currentTarget.style.boxShadow=`0 0 0 3px ${C.blueM}55`; e.currentTarget.style.background=C.card; }}
              onBlurCapture={e  => { e.currentTarget.style.borderColor=C.border; e.currentTarget.style.boxShadow="none"; e.currentTarget.style.background=C.hover; }}>
              <span style={{ fontSize:"0.72rem", fontWeight:700, color:C.faint,
                background:"transparent", padding:"0 12px", display:"flex",
                alignItems:"center", borderRight:`1.5px solid ${C.border}`, whiteSpace:"nowrap" }}>
                Rs.
              </span>
              <input type="text" inputMode="numeric" value={rawWater}
                onKeyDown={digitsOnly}
                onChange={e => { const c=e.target.value.replace(/[^0-9]/g,""); setRawWater(c); triggerFlash("water"); }}
                style={{ fontFamily:F, fontSize:"0.9rem", color:C.body,
                  background:"transparent", border:"none", outline:"none",
                  padding:"10px 14px", flex:1, minWidth:0 }}/>
            </div>
            <span style={{ fontSize:"0.7rem", color:C.faint, fontFamily:"monospace" }}>
              {M.waterPct.toFixed(1)}% used · Rs. {(budgets.water-M.water).toLocaleString()} remaining
            </span>
          </div>
        </div>
      </section>

      {/* ════════════════════════
          DASHBOARD (gated on income)
          ════════════════════════ */}
      {hasIncome ? (
        <div style={{ animation:"incFadeUp .35s ease" }}>

          {/* KPI CARDS — original 5 cards */}
          <section className="inc-fu inc-fu3" style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:20 }}>
            {kpis.map(({ label, val, icon, colorKey }) => {
              const col = kpiColors[colorKey] || kpiColors.green;
              return (
                <div key={label} className="inc-kpi"
                  style={{ background:C.card, borderRadius:14, padding:"18px 20px",
                    display:"flex", alignItems:"center", gap:14,
                    boxShadow:C.s1, border:`1px solid ${C.border}`,
                    borderTop:`3px solid ${col.accent}`,
                    transition:"transform .18s, box-shadow .18s" }}>
                  <div style={{ width:40, height:40, borderRadius:10, flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background:col.bg, color:col.accent }}>
                    {icon}
                  </div>
                  <div>
                    <p style={{ fontSize:"0.68rem", fontWeight:700,
                      textTransform:"uppercase", letterSpacing:".06em",
                      color:C.muted, margin:"0 0 4px" }}>{label}</p>
                    <p style={{ fontFamily:"monospace", fontSize:"1.05rem",
                      fontWeight:600, color:C.ink, margin:0 }}>
                      Rs. <AnimNum value={Math.abs(val)}/>
                      {val < 0 && <em style={{ fontStyle:"normal", fontSize:"0.75rem", color:C.red }}> deficit</em>}
                    </p>
                  </div>
                </div>
              );
            })}
          </section>

          {/* PROGRESS BARS — original 2 bars */}
          <section style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:14, marginBottom:20 }}>
            {[
              { key:"electricity", label:"Electricity", icon:<FiZap size={16}/>, pct:M.elecPct,  exp:M.elec,  bud:budgets.electricity, accent:C.amber, bg:C.amberL, bdr:C.amberM },
              { key:"water",       label:"Water",       icon:<FiDroplet size={16}/>, pct:M.waterPct, exp:M.water, bud:budgets.water,    accent:C.teal,  bg:C.tealL,  bdr:C.tealM  },
            ].map(({ key, label, icon, pct, exp, bud, accent, bg, bdr }) => {
              const barColor = pct > 100 ? C.red : pct > 90 ? C.amber : C.green;
              const badgeBg  = pct > 100 ? C.redL : pct > 90 ? C.amberL : C.greenL;
              const badgeBdr = pct > 100 ? C.redM : pct > 90 ? C.amberM : C.greenM;
              const badgeClr = pct > 100 ? C.red  : pct > 90 ? C.amber  : C.green;
              return (
                <div key={key} className="inc-bar-card"
                  style={{ background:C.card, borderRadius:14, padding:"20px 22px",
                    boxShadow:C.s1, border:`1px solid ${C.border}`,
                    transition:"transform .18s, box-shadow .18s" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10,
                    marginBottom:14, fontSize:"0.95rem", fontWeight:600, color:C.ink }}>
                    <div style={{ width:34, height:34, borderRadius:8, background:bg,
                      border:`1px solid ${bdr}`, display:"flex", alignItems:"center",
                      justifyContent:"center", color:accent }}>{icon}</div>
                    <span>{label}</span>
                    <span style={{ marginLeft:"auto", fontFamily:"monospace", fontSize:"0.78rem",
                      fontWeight:700, padding:"3px 10px", borderRadius:999,
                      background:badgeBg, border:`1px solid ${badgeBdr}`, color:badgeClr }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                  {/* Progress track */}
                  <div style={{ height:10, background:C.hover, borderRadius:999,
                    overflow:"hidden", marginBottom:10 }}>
                    <div style={{ height:"100%", borderRadius:999,
                      width:`${Math.min(pct,100)}%`,
                      background:`linear-gradient(90deg,${barColor},${barColor}aa)`,
                      transition:"width .55s cubic-bezier(.4,0,.2,1)" }}/>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    fontSize:"0.75rem", fontFamily:"monospace", color:C.faint }}>
                    <span>Rs. {exp.toLocaleString()} spent</span>
                    <span>Rs. {(bud-exp).toLocaleString()} left of Rs. {bud.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* CHARTS — original 2 charts */}
          <section style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(440px,1fr))", gap:14, marginBottom:20 }}>
            {/* Income vs Expenses */}
            <div className="inc-chart-card"
              style={{ background:C.card, borderRadius:14, padding:"22px 24px",
                boxShadow:C.s1, border:`1px solid ${C.border}`,
                transition:"transform .18s, box-shadow .18s" }}>
              <h3 style={{ fontSize:"0.75rem", fontWeight:700, color:C.muted,
                textTransform:"uppercase", letterSpacing:".07em", margin:"0 0 18px" }}>
                Income vs Expenses
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                  <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                  <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                  <Tooltip content={<CTip/>}/>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:"0.75rem", fontFamily:F }}/>
                  <Bar dataKey="income"   name="Income"   fill={C.green} radius={[5,5,0,0]}/>
                  <Bar dataKey="expenses" name="Expenses" fill={C.red}   radius={[5,5,0,0]}/>
                  <Bar dataKey="savings"  name="Savings"  fill={C.blue}  radius={[5,5,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Budget History */}
            <div className="inc-chart-card"
              style={{ background:C.card, borderRadius:14, padding:"22px 24px",
                boxShadow:C.s1, border:`1px solid ${C.border}`,
                transition:"transform .18s, box-shadow .18s" }}>
              <h3 style={{ fontSize:"0.75rem", fontWeight:700, color:C.muted,
                textTransform:"uppercase", letterSpacing:".07em", margin:"0 0 18px" }}>
                Budget History
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="igE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.amber} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={C.amber} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="igW" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.blue} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                  <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                  <YAxis tick={ax} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(1)}k`}/>
                  <Tooltip content={<CTip/>}/>
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:"0.75rem", fontFamily:F }}/>
                  <Area type="monotone" dataKey="electricity" name="Electricity"
                    stroke={C.amber} strokeWidth={2} fill="url(#igE)" dot={{ r:4, fill:C.amber }}/>
                  <Area type="monotone" dataKey="water" name="Water"
                    stroke={C.blue} strokeWidth={2} fill="url(#igW)" dot={{ r:4, fill:C.blue }}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* INSIGHTS — original logic */}
          <section style={{ background:C.card, borderRadius:14, padding:"22px 24px",
            boxShadow:C.s1, border:`1px solid ${C.border}`, marginBottom:20 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:16, gap:12, flexWrap:"wrap" }}>
              <h3 style={{ fontSize:"0.75rem", fontWeight:700, color:C.muted,
                textTransform:"uppercase", letterSpacing:".07em", margin:0 }}>
                Financial Insights
              </h3>
              <button className="inc-export"
                onClick={() => {
                  const rows = [
                    [`Budget Report — ${selectedMonth}`],[],
                    ["Monthly Income", income],[],
                    ["Utility","Budget","Expenses","Remaining"],
                    ["Electricity", budgets.electricity, M.elec,  M.elecRemain],
                    ["Water",       budgets.water,       M.water, M.waterRemain],
                    ["Net Savings", M.savings],
                  ];
                  const csv  = rows.map(r => r.join(",")).join("\n");
                  const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
                  const url  = URL.createObjectURL(blob);
                  const a    = document.createElement("a");
                  a.href=url; a.download=`budget_${selectedMonth.replace(" ","_")}.csv`;
                  a.style.display="none"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
                }}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 14px",
                  borderRadius:9, border:`1px solid ${C.border}`, background:C.card,
                  fontFamily:F, fontSize:"0.78rem", fontWeight:600, color:C.muted,
                  cursor:"pointer", transition:"all .18s" }}>
                <FiDownload size={13}/> Export CSV
              </button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {insights.map((ins,i) => {
                const ic = insightColors[ins.type] || insightColors.success;
                return (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12,
                    padding:"12px 16px", borderRadius:10,
                    background:ic.bg, border:`1px solid ${ic.bdr}`,
                    fontSize:"0.875rem", fontWeight:500 }}>
                    <span style={{ display:"flex", flexShrink:0, color:ic.accent }}>{ic.icon}</span>
                    <p style={{ margin:0, color:ic.accent }}>{ins.text}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : (
        /* Empty state — original */
        <div style={{ textAlign:"center", padding:"80px 32px",
          animation:"incFadeUp .3s ease" }}>
          <div style={{ width:72, height:72, background:C.card, borderRadius:20,
            display:"flex", alignItems:"center", justifyContent:"center",
            margin:"0 auto 20px", color:C.faint, boxShadow:C.s2 }}>
            <FiDollarSign size={34}/>
          </div>
          <h2 style={{ fontSize:"1.3rem", fontWeight:700, color:C.ink, margin:"0 0 10px" }}>
            Your dashboard is waiting
          </h2>
          <p style={{ fontSize:"0.9rem", color:C.muted, maxWidth:380,
            margin:"0 auto 20px", lineHeight:1.6 }}>
            Type your monthly salary in the field above — your full budget breakdown,
            savings ring, charts, and insights will all appear instantly.
          </p>
          <div style={{ fontSize:"0.9rem", fontWeight:600, color:C.faint,
            animation:"incBounce 1.8s ease infinite" }}>
            ↑ Start there
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", bottom:28, right:28, zIndex:9999,
          animation:"incFadeUp .3s ease" }}>
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>
        </div>
      )}
    </div>
  );
}