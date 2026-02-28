// src/pages/Prediction.jsx
// ORIGINAL logic 100% preserved — only design tokens updated to match dashboard
import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  FiZap, FiDroplet, FiCalendar, FiArrowUp, FiArrowDown,
  FiBarChart2, FiStar, FiTrendingUp, FiInfo, FiShield,
} from "react-icons/fi";

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
    .p-fu  { animation: predFadeUp .4s ease both }
    .p-fu1 { animation-delay:.05s } .p-fu2 { animation-delay:.10s }
    .p-fu3 { animation-delay:.15s } .p-fu4 { animation-delay:.20s }
    .p-sc:hover  { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .p-hbc:hover { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .p-util:not(.active):hover { background:#f0f2f7!important; color:#475569!important; }
    .p-mpill:hover { background:#f1f5f9!important; }
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
  green:"#059669", greenL:"#ecfdf5", greenM:"#a7f3d0",
  amber:"#d97706", amberL:"#fffbeb", amberM:"#fde68a",
  red:"#dc2626",   redL:"#fef2f2",   redM:"#fecaca",
  violet:"#7c3aed",violetL:"#f5f3ff",violetM:"#ddd6fe",
  s1:"0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
  s2:"0 4px 16px rgba(15,23,42,.08),0 2px 4px rgba(15,23,42,.04)",
  s3:"0 12px 40px rgba(15,23,42,.10),0 4px 8px rgba(15,23,42,.04)",
};
const F = "'Plus Jakarta Sans',-apple-system,sans-serif";
const ax = { fill:C.faint, fontSize:11, fontFamily:F };

/* ════ ORIGINAL DATA (unchanged) ════ */
const INITIAL_BILLS = [
  { id:1,  utilityType:"Electricity", billingMonth:"June 2025",      unitsUsed:320, billAmount:2750 },
  { id:2,  utilityType:"Water",       billingMonth:"June 2025",      unitsUsed:22,  billAmount:880  },
  { id:3,  utilityType:"Electricity", billingMonth:"July 2025",      unitsUsed:345, billAmount:2950 },
  { id:4,  utilityType:"Water",       billingMonth:"July 2025",      unitsUsed:24,  billAmount:960  },
  { id:5,  utilityType:"Electricity", billingMonth:"August 2025",    unitsUsed:380, billAmount:3250 },
  { id:6,  utilityType:"Water",       billingMonth:"August 2025",    unitsUsed:26,  billAmount:1040 },
  { id:7,  utilityType:"Electricity", billingMonth:"September 2025", unitsUsed:350, billAmount:3000 },
  { id:8,  utilityType:"Water",       billingMonth:"September 2025", unitsUsed:23,  billAmount:920  },
  { id:9,  utilityType:"Electricity", billingMonth:"October 2025",   unitsUsed:330, billAmount:2820 },
  { id:10, utilityType:"Water",       billingMonth:"October 2025",   unitsUsed:21,  billAmount:840  },
  { id:11, utilityType:"Electricity", billingMonth:"November 2025",  unitsUsed:310, billAmount:2650 },
  { id:12, utilityType:"Water",       billingMonth:"November 2025",  unitsUsed:20,  billAmount:800  },
];

/* ════ ORIGINAL TOOLTIP (restyled to match dashboard) ════ */
const CustomTooltip = ({ active, payload, label, utilUnit }) => {
  if (!active || !payload?.length) return null;
  const isForecast = label?.includes("›");
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12,
      padding:"12px 16px", boxShadow:C.s3, fontFamily:F, minWidth:180 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontSize:"0.78rem", fontWeight:700, color:C.ink }}>
          {label?.replace(" ›","")}
        </span>
        {isForecast && (
          <span style={{ fontSize:"0.65rem", fontWeight:700, background:C.violetL,
            color:C.violet, border:`1px solid ${C.violetM}`, padding:"1px 7px", borderRadius:20 }}>
            Forecast
          </span>
        )}
      </div>
      {payload.filter(p => p.value !== null).map((p,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:i<payload.length-1?4:0 }}>
          <span style={{ width:8, height:8, borderRadius:2, background:p.color, display:"inline-block" }}/>
          <span style={{ fontSize:"0.75rem", color:C.muted, flex:1 }}>{p.name}</span>
          <span style={{ fontSize:"0.8rem", fontWeight:700, color:C.ink }}>
            {p.dataKey==="units"||p.dataKey==="forecast"
              ? `${p.value} ${utilUnit}`
              : `Rs. ${Number(p.value).toLocaleString()}`}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ════ MAIN COMPONENT ════ */
const Prediction = () => {
  const [billsData]          = useState(INITIAL_BILLS);
  const [selectedUtility,    setSelectedUtility]    = useState("Electricity");
  const [predictionMethod,   setPredictionMethod]   = useState("average");

  /* ── ALL ORIGINAL LOGIC — untouched ── */
  const isElec    = selectedUtility === "Electricity";
  const utilColor = isElec ? C.blue : C.teal;
  const utilUnit  = isElec ? "kWh" : "Units";

  const filteredData = useMemo(
    () => billsData.filter(b => b.utilityType === selectedUtility),
    [billsData, selectedUtility]
  );

  const prediction = useMemo(() => {
    if (!filteredData.length) return { predictedUnits:0, predictedAmount:0, percentChange:0, amountChange:0, confidence:"Low", explanation:"Not enough data." };
    let predictedUnits, predictedAmount;
    if (predictionMethod === "average") {
      predictedUnits  = Math.round(filteredData.reduce((s,b) => s+b.unitsUsed,  0)/filteredData.length);
      predictedAmount = Math.round(filteredData.reduce((s,b) => s+b.billAmount, 0)/filteredData.length);
    } else if (predictionMethod === "weighted") {
      let wu=0, wa=0, ws=0;
      filteredData.forEach((b,i) => { const w=i+1; wu+=b.unitsUsed*w; wa+=b.billAmount*w; ws+=w; });
      predictedUnits  = Math.round(wu/ws);
      predictedAmount = Math.round(wa/ws);
    } else {
      const n = filteredData.length;
      if (n < 2) {
        predictedUnits  = Math.round(filteredData.reduce((s,b)=>s+b.unitsUsed, 0)/n);
        predictedAmount = Math.round(filteredData.reduce((s,b)=>s+b.billAmount,0)/n);
      } else {
        const xs   = Array.from({length:n},(_,i)=>i);
        const xSum = xs.reduce((s,x)=>s+x,0), x2Sum=xs.reduce((s,x)=>s+x*x,0);
        const yU   = filteredData.map(b=>b.unitsUsed),  yA=filteredData.map(b=>b.billAmount);
        const yUSum= yU.reduce((s,y)=>s+y,0),           yASum=yA.reduce((s,y)=>s+y,0);
        const xyU  = xs.reduce((s,x,i)=>s+x*yU[i],0),  xyA=xs.reduce((s,x,i)=>s+x*yA[i],0);
        const sU=(n*xyU-xSum*yUSum)/(n*x2Sum-xSum*xSum), iU=(yUSum-sU*xSum)/n;
        const sA=(n*xyA-xSum*yASum)/(n*x2Sum-xSum*xSum), iA=(yASum-sA*xSum)/n;
        predictedUnits  = Math.round(sU*n+iU);
        predictedAmount = Math.round(sA*n+iA);
      }
    }
    const last         = filteredData[filteredData.length-1];
    const percentChange= last ? Math.round(((predictedUnits -last.unitsUsed) /last.unitsUsed) *100) : 0;
    const amountChange = last ? Math.round(((predictedAmount-last.billAmount)/last.billAmount)*100) : 0;
    const confidence   = filteredData.length<2?"Low":filteredData.length<4?"Medium":"High";
    let explanation    = predictionMethod==="average"
      ? `Based on the simple average of all ${filteredData.length} months equally.`
      : predictionMethod==="weighted"
      ? `Recent months carry more weight, making this estimate forward-leaning.`
      : `Linear regression across ${filteredData.length} data points extrapolates the trend.`;
    if (filteredData.length >= 6) {
      const highest = filteredData.reduce((m,b)=>b.unitsUsed>m.unitsUsed?b:m,filteredData[0]);
      const lowest  = filteredData.reduce((m,b)=>b.unitsUsed<m.unitsUsed?b:m,filteredData[0]);
      if (highest.unitsUsed/lowest.unitsUsed > 1.3)
        explanation += ` Seasonal variation detected — peak was ${highest.billingMonth}.`;
    }
    return { predictedUnits, predictedAmount, percentChange, amountChange, confidence, explanation };
  }, [filteredData, predictionMethod]);

  const nextMonthLabel = useMemo(() => {
    const last = filteredData[filteredData.length-1];
    if (!last) return "Next Month";
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const [mn,yr] = last.billingMonth.split(" ");
    const ni = (months.indexOf(mn)+1)%12;
    return `${months[ni]} ${ni===0?parseInt(yr)+1:yr}`;
  }, [filteredData]);

  const chartData = useMemo(() => {
    const data = filteredData.map(b => ({
      month:          b.billingMonth.split(" ")[0].slice(0,3)+" '"+b.billingMonth.split(" ")[1].slice(2),
      units:          b.unitsUsed,
      amount:         b.billAmount,
      forecast:       null,
      forecastAmount: null,
    }));
    const last = filteredData[filteredData.length-1];
    if (last) {
      data[data.length-1] = { ...data[data.length-1], forecast:last.unitsUsed, forecastAmount:last.billAmount };
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const [mn,yr] = last.billingMonth.split(" ");
      const ni = (months.indexOf(mn)+1)%12, ny=ni===0?parseInt(yr)+1:yr;
      data.push({
        month:          months[ni].slice(0,3)+" '"+String(ny).slice(2)+" ›",
        units:null, amount:null,
        forecast:       prediction.predictedUnits,
        forecastAmount: prediction.predictedAmount,
      });
    }
    return data;
  }, [filteredData, prediction]);

  const stats = useMemo(() => {
    if (filteredData.length < 2) return null;
    const amounts = filteredData.map(b=>b.billAmount), units=filteredData.map(b=>b.unitsUsed);
    const avgAmt  = Math.round(amounts.reduce((s,v)=>s+v,0)/amounts.length);
    const avgUnit = Math.round(units.reduce((s,v)=>s+v,0)/units.length);
    const totalSpend  = amounts.reduce((s,v)=>s+v,0);
    const costPerUnit = filteredData[filteredData.length-1]
      ? (filteredData[filteredData.length-1].billAmount/filteredData[filteredData.length-1].unitsUsed).toFixed(2) : 0;
    const recent = filteredData.slice(-3).reduce((s,b)=>s+b.unitsUsed,0)/Math.min(3,filteredData.length);
    const older  = filteredData.slice(0,3).reduce((s,b)=>s+b.unitsUsed,0)/Math.min(3,filteredData.length);
    const overallTrend = Math.round(((recent-older)/older)*100);
    return {
      avgAmt, avgUnit, totalSpend, costPerUnit, overallTrend,
      maxAmt:  Math.max(...amounts), minAmt:Math.min(...amounts),
      maxUnit: Math.max(...units),   minUnit:Math.min(...units),
      maxAmtMonth:  filteredData.reduce((m,b)=>b.billAmount>m.billAmount?b:m,filteredData[0]).billingMonth,
      minAmtMonth:  filteredData.reduce((m,b)=>b.billAmount<m.billAmount?b:m,filteredData[0]).billingMonth,
      maxUnitMonth: filteredData.reduce((m,b)=>b.unitsUsed>m.unitsUsed?b:m,filteredData[0]).billingMonth,
      minUnitMonth: filteredData.reduce((m,b)=>b.unitsUsed<m.unitsUsed?b:m,filteredData[0]).billingMonth,
    };
  }, [filteredData]);

  const confColor = { Low:C.red, Medium:C.amber, High:C.green }[prediction.confidence];
  const isUp      = prediction.percentChange > 0;
  const isAmtUp   = prediction.amountChange  > 0;

  /* ════ RENDER ════ */
  return (
    <div style={{ minHeight:"100vh", background:C.page, fontFamily:F,
      color:C.ink, padding:"28px 32px 64px" }}>

      {/* ── HEADER (original layout, dashboard tokens) ── */}
      <div className="p-fu p-fu1" style={{ display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", flexWrap:"wrap", gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:C.ink,
            margin:"0 0 5px", letterSpacing:"-0.03em" }}>Bill Predictions</h1>
          <p style={{ fontSize:"0.85rem", color:C.muted, margin:0 }}>
            Estimate next month's consumption and cost from your historical data
          </p>
        </div>
        {/* Next month chip */}
        <div style={{ display:"flex", alignItems:"center", gap:12, background:C.card,
          border:`1px solid ${C.border}`, borderRadius:14, padding:"12px 18px", boxShadow:C.s1 }}>
          <div style={{ color:C.violet, display:"flex" }}>
            <FiCalendar size={20}/>
          </div>
          <div>
            <span style={{ display:"block", fontSize:"0.65rem", fontWeight:700,
              color:C.faint, letterSpacing:"0.05em", textTransform:"uppercase" }}>
              Forecasting for
            </span>
            <span style={{ display:"block", fontSize:"0.95rem", fontWeight:800,
              color:C.ink, marginTop:1 }}>
              {nextMonthLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ── CONTROLS (original layout, dashboard tokens) ── */}
      <div className="p-fu p-fu2" style={{ display:"flex", alignItems:"center",
        justifyContent:"space-between", flexWrap:"wrap", gap:14, marginBottom:22 }}>
        {/* Utility toggle */}
        <div style={{ display:"flex", background:C.card, border:`1px solid ${C.border}`,
          borderRadius:12, padding:4, gap:3 }}>
          {[
            { key:"Electricity", icon:<FiZap size={15}/>, activeColor:C.blue, activeBg:C.blueL, activeBdr:C.blueM },
            { key:"Water",       icon:<FiDroplet size={15}/>, activeColor:C.teal, activeBg:C.tealL, activeBdr:C.tealM },
          ].map(u => {
            const active = selectedUtility === u.key;
            return (
              <button key={u.key} className={`p-util${active?" active":""}`}
                onClick={() => setSelectedUtility(u.key)}
                style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 18px",
                  borderRadius:9, border: active ? `1px solid ${u.activeBdr}` : "1px solid transparent",
                  background: active ? u.activeBg : "transparent",
                  color:      active ? u.activeColor : C.muted,
                  fontFamily:F, fontWeight:600, fontSize:"0.875rem",
                  cursor:"pointer", transition:"all .15s" }}>
                {u.icon} {u.key}
              </button>
            );
          })}
        </div>
        {/* Method select */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <label style={{ fontSize:"0.78rem", fontWeight:600, color:C.muted }}>Method</label>
          <div style={{ position:"relative" }}>
            <select value={predictionMethod}
              onChange={e => setPredictionMethod(e.target.value)}
              style={{ padding:"8px 36px 8px 14px", borderRadius:10,
                border:`1.5px solid ${C.border}`, background:C.card,
                color:C.body, fontFamily:F, fontSize:"0.875rem", fontWeight:500,
                cursor:"pointer", outline:"none", appearance:"none" }}
              onFocus={e => { e.target.style.borderColor=C.blue; e.target.style.boxShadow=`0 0 0 3px ${C.blueM}55`; }}
              onBlur={e  => { e.target.style.borderColor=C.border; e.target.style.boxShadow="none"; }}>
              <option value="average">Simple Average</option>
              <option value="weighted">Weighted Average</option>
              <option value="trend">Linear Trend</option>
            </select>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.faint}
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div style={{ textAlign:"center", padding:"60px 40px", background:C.card,
          borderRadius:18, border:`1px solid ${C.border}`, boxShadow:C.s1 }}>
          <p style={{ fontSize:"2.5rem", margin:"0 0 12px" }}>📭</p>
          <h3 style={{ fontSize:"1.2rem", color:C.ink, margin:"0 0 8px", fontWeight:700 }}>No Data Available</h3>
          <p style={{ color:C.muted, margin:0 }}>Add some {selectedUtility.toLowerCase()} bills to generate predictions.</p>
        </div>
      ) : (
        <>
          {/* ── HERO SECTION — original 2-col layout ── */}
          <div className="p-fu p-fu3" style={{ display:"grid",
            gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:20 }}>

            {/* Big bill card */}
            <div className="p-hbc"
              style={{ background:C.card, border:`1px solid ${C.border}`,
                borderTop:`4px solid ${utilColor}`, borderRadius:18,
                padding:24, boxShadow:C.s2,
                transition:"transform .22s ease, box-shadow .22s ease" }}>

              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20 }}>
                <div style={{ width:52, height:52, borderRadius:14,
                  background:`${utilColor}14`, display:"flex", alignItems:"center",
                  justifyContent:"center", color:utilColor, flexShrink:0 }}>
                  {isElec ? <FiZap size={26}/> : <FiDroplet size={26}/>}
                </div>
                <div>
                  <div style={{ fontSize:"0.78rem", fontWeight:600, color:C.muted, marginBottom:4 }}>
                    Predicted Bill · {nextMonthLabel}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5,
                    fontSize:"0.75rem", fontWeight:700, color:confColor }}>
                    <FiShield size={12}/> {prediction.confidence} Confidence
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:18 }}>
                <span style={{ fontSize:"1.1rem", fontWeight:700, color:C.muted }}>Rs.</span>
                <span style={{ fontSize:"3rem", fontWeight:800, color:C.ink,
                  letterSpacing:"-2px", lineHeight:1 }}>
                  {prediction.predictedAmount.toLocaleString()}
                </span>
              </div>

              <div style={{ display:"flex", alignItems:"center", gap:14,
                marginBottom:18, flexWrap:"wrap" }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5,
                  padding:"5px 12px", borderRadius:20, fontSize:"0.75rem", fontWeight:700,
                  background:isAmtUp?C.redL:C.greenL,
                  border:`1px solid ${isAmtUp?C.redM:C.greenM}`,
                  color:isAmtUp?C.red:C.green }}>
                  {isAmtUp ? <FiArrowUp size={11}/> : <FiArrowDown size={11}/>}
                  {Math.abs(prediction.amountChange)}% vs last month
                </span>
                <span style={{ fontSize:"0.8rem", color:C.faint }}>
                  Last month: Rs. {filteredData[filteredData.length-1]?.billAmount.toLocaleString()}
                </span>
              </div>

              {/* Confidence bar — original */}
              <div style={{ display:"flex", alignItems:"center", gap:5, flexWrap:"wrap" }}>
                {[1,2,3,4,5,6].map(i => (
                  <span key={i} style={{ display:"inline-block", width:30, height:6,
                    borderRadius:3, background:filteredData.length>=i?confColor:C.border,
                    transition:"background .3s" }}/>
                ))}
                <span style={{ fontSize:"0.7rem", color:C.faint, marginLeft:4 }}>
                  {filteredData.length} months of data
                </span>
              </div>
            </div>

            {/* Side cards — original 2×2 grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {/* Predicted Usage */}
              <div className="p-sc"
                style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16,
                  padding:18, display:"flex", alignItems:"flex-start", gap:12, boxShadow:C.s1,
                  transition:"transform .15s, box-shadow .15s" }}>
                <div style={{ width:38, height:38, borderRadius:10,
                  background:`${utilColor}12`, display:"flex", alignItems:"center",
                  justifyContent:"center", color:utilColor, flexShrink:0 }}>
                  {isElec ? <FiZap size={17}/> : <FiDroplet size={17}/>}
                </div>
                <div>
                  <span style={{ display:"block", fontSize:"0.65rem", fontWeight:700,
                    color:C.faint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>
                    Predicted Usage
                  </span>
                  <div style={{ fontSize:"1.25rem", fontWeight:800,
                    letterSpacing:"-0.5px", marginBottom:4, color:utilColor }}>
                    {prediction.predictedUnits}
                    <span style={{ fontSize:"0.8rem", fontWeight:500, color:C.faint }}> {utilUnit}</span>
                  </div>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:3,
                    fontSize:"0.68rem", fontWeight:700, padding:"2px 7px", borderRadius:20,
                    background:isUp?C.redL:C.greenL, border:`1px solid ${isUp?C.redM:C.greenM}`,
                    color:isUp?C.red:C.green }}>
                    {isUp ? <FiArrowUp size={10}/> : <FiArrowDown size={10}/>}
                    {Math.abs(prediction.percentChange)}% vs last month
                  </span>
                </div>
              </div>

              {stats && (
                <>
                  {/* Avg Monthly Bill */}
                  <div className="p-sc"
                    style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16,
                      padding:18, display:"flex", alignItems:"flex-start", gap:12, boxShadow:C.s1,
                      transition:"transform .15s, box-shadow .15s" }}>
                    <div style={{ width:38, height:38, borderRadius:10,
                      background:C.amberL, display:"flex", alignItems:"center",
                      justifyContent:"center", color:C.amber, flexShrink:0 }}>
                      <FiBarChart2 size={17}/>
                    </div>
                    <div>
                      <span style={{ display:"block", fontSize:"0.65rem", fontWeight:700,
                        color:C.faint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>
                        Avg Monthly Bill
                      </span>
                      <div style={{ fontSize:"1.25rem", fontWeight:800,
                        letterSpacing:"-0.5px", marginBottom:4, color:C.amber }}>
                        Rs. {stats.avgAmt.toLocaleString()}
                      </div>
                      <span style={{ fontSize:"0.7rem", color:C.faint }}>
                        Over {filteredData.length} months
                      </span>
                    </div>
                  </div>

                  {/* Rate per unit */}
                  <div className="p-sc"
                    style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16,
                      padding:18, display:"flex", alignItems:"flex-start", gap:12, boxShadow:C.s1,
                      transition:"transform .15s, box-shadow .15s" }}>
                    <div style={{ width:38, height:38, borderRadius:10,
                      background:C.greenL, display:"flex", alignItems:"center",
                      justifyContent:"center", color:C.green, flexShrink:0 }}>
                      <FiStar size={17}/>
                    </div>
                    <div>
                      <span style={{ display:"block", fontSize:"0.65rem", fontWeight:700,
                        color:C.faint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>
                        Rate per {utilUnit}
                      </span>
                      <div style={{ fontSize:"1.25rem", fontWeight:800,
                        letterSpacing:"-0.5px", marginBottom:4, color:C.green }}>
                        Rs. {stats.costPerUnit}
                      </div>
                      <span style={{ fontSize:"0.7rem", color:C.faint }}>Based on last month</span>
                    </div>
                  </div>

                  {/* Overall Trend */}
                  <div className="p-sc"
                    style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16,
                      padding:18, display:"flex", alignItems:"flex-start", gap:12, boxShadow:C.s1,
                      transition:"transform .15s, box-shadow .15s" }}>
                    <div style={{ width:38, height:38, borderRadius:10,
                      background:C.violetL, display:"flex", alignItems:"center",
                      justifyContent:"center", color:C.violet, flexShrink:0 }}>
                      <FiTrendingUp size={17}/>
                    </div>
                    <div>
                      <span style={{ display:"block", fontSize:"0.65rem", fontWeight:700,
                        color:C.faint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:4 }}>
                        Overall Trend
                      </span>
                      <div style={{ fontSize:"1.25rem", fontWeight:800,
                        letterSpacing:"-0.5px", marginBottom:4,
                        color:stats.overallTrend>0?C.red:C.green }}>
                        {stats.overallTrend>0?"+":""}{stats.overallTrend}%
                      </div>
                      <span style={{ fontSize:"0.7rem", color:C.faint }}>Recent vs earlier months</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── CHART (original logic, dashboard card style) ── */}
          <div className="p-fu p-fu4" style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:18, padding:"22px 24px", marginBottom:20, boxShadow:C.s1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
              flexWrap:"wrap", gap:12, marginBottom:18 }}>
              <div>
                <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>
                  Usage & Bill History — with {nextMonthLabel} Forecast
                </h3>
                <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>
                  Shaded area is forecast · Dashed line marks the prediction boundary
                </p>
              </div>
              {/* legend */}
              <div style={{ display:"flex", alignItems:"center", gap:14,
                fontSize:"0.72rem", color:C.muted, flexWrap:"wrap" }}>
                <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:10, height:10, borderRadius:"50%",
                    background:utilColor, display:"inline-block" }}/>
                  Usage ({utilUnit})
                </span>
                <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:10, height:10, borderRadius:"50%",
                    background:C.amber, display:"inline-block" }}/>
                  Bill (Rs.)
                </span>
                <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ width:18, height:0, borderBottom:`2.5px dashed ${utilColor}`,
                    display:"inline-block" }}/>
                  Forecast
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top:10, right:16, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="pgU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={utilColor} stopOpacity={0.12}/>
                    <stop offset="95%" stopColor={utilColor} stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="pgA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.amber} stopOpacity={0.10}/>
                    <stop offset="95%" stopColor={C.amber} stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="pgF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={utilColor} stopOpacity={0.22}/>
                    <stop offset="95%" stopColor={utilColor} stopOpacity={0.04}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                <XAxis dataKey="month" tick={ax} axisLine={{ stroke:C.border }} tickLine={false}/>
                <YAxis yAxisId="l" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="r" orientation="right" tick={ax} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip utilUnit={utilUnit}/>}/>
                <Area yAxisId="l" type="monotone" dataKey="units" name={`Usage (${utilUnit})`}
                  stroke={utilColor} strokeWidth={2.5} fill="url(#pgU)"
                  dot={{ r:4, fill:utilColor, strokeWidth:0 }} activeDot={{ r:6 }} connectNulls/>
                <Area yAxisId="r" type="monotone" dataKey="amount" name="Bill (Rs.)"
                  stroke={C.amber} strokeWidth={2.5} fill="url(#pgA)"
                  dot={{ r:4, fill:C.amber, strokeWidth:0 }} activeDot={{ r:6 }} connectNulls/>
                <Area yAxisId="l" type="monotone" dataKey="forecast" name="Forecast Usage"
                  stroke={utilColor} strokeWidth={2.5} strokeDasharray="7 4" fill="url(#pgF)"
                  dot={(props) => {
                    const { cx, cy, index } = props;
                    if (index !== chartData.length-1) return <g key={index}/>;
                    return <circle key={index} cx={cx} cy={cy} r={7}
                      fill={utilColor} stroke="#fff" strokeWidth={2.5}/>;
                  }}
                  activeDot={{ r:6 }} connectNulls/>
                <Area yAxisId="r" type="monotone" dataKey="forecastAmount" name="Forecast Bill"
                  stroke={C.amber} strokeWidth={2.5} strokeDasharray="7 4" fill="url(#pgA)"
                  dot={(props) => {
                    const { cx, cy, index } = props;
                    if (index !== chartData.length-1) return <g key={index}/>;
                    return <circle key={index} cx={cx} cy={cy} r={7}
                      fill={C.amber} stroke="#fff" strokeWidth={2.5}/>;
                  }}
                  activeDot={{ r:6 }} connectNulls/>
                {chartData.length > 1 && (
                  <ReferenceLine yAxisId="l" x={chartData[chartData.length-2]?.month}
                    stroke={C.violet} strokeDasharray="5 4" strokeWidth={1.5}
                    label={{ value:"Forecast →", fill:C.violet, fontSize:11,
                      position:"insideTopRight", fontFamily:F }}/>
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── BOTTOM GRID — original 2-col ── */}
          <div className="p-fu p-fu5" style={{ display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(380px,1fr))", gap:18 }}>

            {/* Historical Stats */}
            {stats && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`,
                borderRadius:18, padding:"22px 24px", boxShadow:C.s1 }}>
                <h3 style={{ display:"flex", alignItems:"center", gap:8,
                  fontSize:"0.875rem", fontWeight:700, color:C.ink, margin:"0 0 18px" }}>
                  <FiBarChart2 size={16} color={C.violet}/> Historical Statistics
                </h3>
                {/* original 3×2 grid */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)",
                  gap:1, background:C.border, borderRadius:12, overflow:"hidden" }}>
                  {[
                    { label:"Highest Bill",  val:`Rs. ${stats.maxAmt.toLocaleString()}`,  sub:stats.maxAmtMonth,  color:C.red    },
                    { label:"Lowest Bill",   val:`Rs. ${stats.minAmt.toLocaleString()}`,  sub:stats.minAmtMonth,  color:C.green  },
                    { label:"Highest Usage", val:`${stats.maxUnit} ${utilUnit}`,          sub:stats.maxUnitMonth, color:utilColor },
                    { label:"Lowest Usage",  val:`${stats.minUnit} ${utilUnit}`,          sub:stats.minUnitMonth, color:C.muted  },
                    { label:"Avg Monthly",   val:`Rs. ${stats.avgAmt.toLocaleString()}`,  sub:`${filteredData.length} months`, color:C.amber },
                    { label:"Total Spent",   val:`Rs. ${stats.totalSpend.toLocaleString()}`, sub:`${filteredData.length} mo. combined`, color:C.violet },
                  ].map((s,i) => (
                    <div key={i} style={{ background:C.card, padding:"16px 14px" }}>
                      <div style={{ fontSize:"0.9rem", fontWeight:800, color:s.color,
                        marginBottom:3 }}>{s.val}</div>
                      <div style={{ fontSize:"0.72rem", fontWeight:600,
                        color:C.body, marginBottom:2 }}>{s.label}</div>
                      <div style={{ fontSize:"0.68rem", color:C.faint }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How it was calculated */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`,
              borderRadius:18, padding:"22px 24px", boxShadow:C.s1 }}>
              <h3 style={{ display:"flex", alignItems:"center", gap:8,
                fontSize:"0.875rem", fontWeight:700, color:C.ink, margin:"0 0 18px" }}>
                <FiInfo size={16} color={C.violet}/> How This Was Calculated
              </h3>

              {/* Explanation box */}
              <div style={{ background:C.violetL, border:`1px solid ${C.violetM}`,
                borderRadius:12, padding:"14px 16px", marginBottom:18 }}>
                <p style={{ margin:0, fontSize:"0.82rem", color:C.body, lineHeight:1.7 }}>
                  {prediction.explanation}
                </p>
              </div>

              {/* Method pills — original 3 */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                {[
                  { key:"average",  label:"📊 Simple Avg"  },
                  { key:"weighted", label:"⚖️ Weighted"    },
                  { key:"trend",    label:"📈 Trend"        },
                ].map(m => {
                  const active = predictionMethod === m.key;
                  return (
                    <button key={m.key} className="p-mpill"
                      onClick={() => setPredictionMethod(m.key)}
                      style={{ padding:"6px 14px", borderRadius:20, fontFamily:F,
                        fontSize:"0.75rem", fontWeight:600, cursor:"pointer", transition:"all .15s",
                        border: active ? `1px solid ${utilColor}55` : `1px solid ${C.border}`,
                        background: active ? `${utilColor}14` : C.hover,
                        color: active ? utilColor : C.muted }}>
                      {m.label}
                    </button>
                  );
                })}
              </div>

              <p style={{ fontSize:"0.8rem", color:C.muted, margin:"0 0 16px", lineHeight:1.6 }}>
                {predictionMethod==="average"
                  ? "Treats every month equally. Best for stable, consistent usage with no clear trend."
                  : predictionMethod==="weighted"
                  ? "Gives more weight to recent months. Ideal when usage has been gradually changing."
                  : "Extrapolates the direction of change. Best when there's a clear upward or downward trend."}
              </p>

              {/* Tip box — original */}
              {stats && (
                <div style={{ display:"flex", alignItems:"flex-start", gap:10,
                  background:C.amberL, border:`1px solid ${C.amberM}`,
                  borderRadius:12, padding:"12px 14px" }}>
                  <FiStar size={14} color={C.amber} style={{ marginTop:2, flexShrink:0 }}/>
                  <p style={{ margin:0, fontSize:"0.8rem", color:C.body, lineHeight:1.6 }}>
                    {stats.overallTrend < -5
                      ? `Usage is trending down ${Math.abs(stats.overallTrend)}% — great progress!`
                      : stats.overallTrend > 5
                      ? `Usage is trending up ${stats.overallTrend}% — consider reviewing high-usage appliances.`
                      : `Your usage has been fairly stable across the tracked period.`}
                  </p>
                </div>
              )}
            </div>

          </div>
        </>
      )}

    </div>
  );
};

export default Prediction;