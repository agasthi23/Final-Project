// src/pages/Analytics.jsx
// ORIGINAL logic 100% preserved — only design tokens updated to match dashboard
import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line,
} from "recharts";
import {
  FiBarChart2, FiTrendingUp, FiDollarSign, FiZap, FiDroplet,
  FiAlertTriangle, FiCheckCircle, FiActivity, FiDownload,
  FiInfo, FiTarget, FiList, FiCpu, FiStar,
} from "react-icons/fi";

/* ─── Font (shared with dashboard) ─── */
if (!document.getElementById("db-font")) {
  const l = document.createElement("link");
  l.id = "db-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.getElementById("an-anim")) {
  const s = document.createElement("style");
  s.id = "an-anim";
  s.textContent = `
    @keyframes anFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    .an-fu  { animation: anFadeUp .4s ease both }
    .an-fu1 { animation-delay:.05s } .an-fu2 { animation-delay:.10s }
    .an-fu3 { animation-delay:.15s } .an-fu4 { animation-delay:.20s }
    .an-fu5 { animation-delay:.25s } .an-fu6 { animation-delay:.30s }
    .an-card:hover  { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .an-stat:hover  { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .an-rec:hover   { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .an-ins:hover   { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .an-export:hover { background:#0f172a!important; color:#fff!important; border-color:#0f172a!important; }
    .an-vbtn:hover   { background:#f0f2f7!important; }
    .an-fbtn:hover   { background:#f0f2f7!important; }
    .an-abtn:hover   { background:#0f172a!important; color:#fff!important; border-color:#0f172a!important; }
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
const billsData = [
  { billingMonth:"Jan", utilityType:"Electricity", unitsUsed:320, billAmount:4800 },
  { billingMonth:"Feb", utilityType:"Electricity", unitsUsed:280, billAmount:4200 },
  { billingMonth:"Mar", utilityType:"Electricity", unitsUsed:350, billAmount:5250 },
  { billingMonth:"Apr", utilityType:"Electricity", unitsUsed:310, billAmount:4650 },
  { billingMonth:"May", utilityType:"Electricity", unitsUsed:290, billAmount:4350 },
  { billingMonth:"Jun", utilityType:"Electricity", unitsUsed:340, billAmount:5100 },
  { billingMonth:"Jan", utilityType:"Water",       unitsUsed:45,  billAmount:900  },
  { billingMonth:"Feb", utilityType:"Water",       unitsUsed:42,  billAmount:840  },
  { billingMonth:"Mar", utilityType:"Water",       unitsUsed:48,  billAmount:960  },
  { billingMonth:"Apr", utilityType:"Water",       unitsUsed:44,  billAmount:880  },
  { billingMonth:"May", utilityType:"Water",       unitsUsed:46,  billAmount:920  },
  { billingMonth:"Jun", utilityType:"Water",       unitsUsed:50,  billAmount:1000 },
];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun"];

/* ════ ORIGINAL HELPERS (unchanged) ════ */
const exportToCSV = (data, filename) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(row => Object.values(row).join(",")).join("\n");
  const blob = new Blob([`${headers}\n${rows}`], { type:"text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
};

/* ════ SHARED UI BITS ════ */
const SectionLabel = ({ children }) => (
  <p style={{ fontSize:"0.63rem", fontWeight:800, letterSpacing:"0.15em",
    textTransform:"uppercase", color:C.faint, margin:"0 0 12px", fontFamily:F }}>
    {children}
  </p>
);

/* Tooltip — matches dashboard style */
const CustomTooltip = ({ active, payload, label }) => {
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
            {p.name?.toLowerCase().includes("cost") ? `Rs. ${Number(p.value).toLocaleString()}` : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

const ExportBtn = ({ onClick }) => (
  <button className="an-export" onClick={onClick}
    style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px",
      borderRadius:8, border:`1px solid ${C.border}`, background:C.card,
      color:C.muted, fontFamily:F, fontSize:"0.75rem", fontWeight:600,
      cursor:"pointer", transition:"all .18s", whiteSpace:"nowrap", flexShrink:0 }}>
    <FiDownload size={12}/> Export CSV
  </button>
);

const ChartCard = ({ children, style={}, cls="" }) => (
  <div className={`an-card ${cls}`}
    style={{ background:C.card, borderRadius:16, border:`1px solid ${C.border}`,
      boxShadow:C.s1, overflow:"hidden",
      transition:"transform .22s ease, box-shadow .22s ease", ...style }}>
    {children}
  </div>
);

const ChartHead = ({ title, sub, action }) => (
  <div style={{ padding:"20px 24px 0", display:"flex", justifyContent:"space-between",
    alignItems:"flex-start", flexWrap:"wrap", gap:12, marginBottom:16 }}>
    <div>
      <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 2px" }}>{title}</h3>
      {sub && <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>{sub}</p>}
    </div>
    {action}
  </div>
);

/* ════ MAIN COMPONENT ════ */
const Analytics = () => {
  const [filter,       setFilter]       = useState("All");
  const [analysisView, setAnalysisView] = useState("overview");

  /* ── ALL ORIGINAL DATA LOGIC — untouched ── */
  const filteredData = useMemo(() =>
    filter === "All" ? billsData : billsData.filter(b => b.utilityType === filter),
  [filter]);

  const stats = useMemo(() => {
    const totalBills  = filteredData.length;
    const totalUnits  = filteredData.reduce((s,b) => s + b.unitsUsed,  0);
    const totalAmount = filteredData.reduce((s,b) => s + b.billAmount, 0);
    const avgUsage    = totalBills ? Math.round(totalUnits / totalBills) : 0;
    const costPerUnit = totalUnits ? (totalAmount / totalUnits).toFixed(2) : 0;
    const peak        = filteredData.reduce((mx,b) => b.unitsUsed > mx.unitsUsed ? b : mx, filteredData[0] || {});
    return { totalBills, totalUnits, totalAmount, avgUsage, costPerUnit,
      peakUsage:peak.unitsUsed||0, peakMonth:peak.billingMonth||"N/A" };
  }, [filteredData]);

  const monthlyUsageData = useMemo(() => {
    const map = {};
    filteredData.forEach(b => {
      if (!map[b.billingMonth]) map[b.billingMonth] = { month:b.billingMonth };
      map[b.billingMonth][b.utilityType] = b.unitsUsed;
      map[b.billingMonth][`${b.utilityType}Cost`] = b.billAmount;
    });
    return MONTHS.filter(m => map[m]).map(m => map[m]);
  }, [filteredData]);

  const monthlyCostData = useMemo(() => {
    const map = {};
    filteredData.forEach(b => {
      if (!map[b.billingMonth]) map[b.billingMonth] = { month:b.billingMonth, total:0 };
      map[b.billingMonth][b.utilityType] = b.billAmount;
      map[b.billingMonth].total += b.billAmount;
    });
    return MONTHS.filter(m => map[m]).map(m => map[m]);
  }, [filteredData]);

  const distributionData = useMemo(() => {
    const dist = {};
    filteredData.forEach(b => {
      if (!dist[b.utilityType]) dist[b.utilityType] = { units:0, cost:0 };
      dist[b.utilityType].units += b.unitsUsed;
      dist[b.utilityType].cost  += b.billAmount;
    });
    const total = Object.values(dist).reduce((s,d) => s+d.units, 0);
    return Object.entries(dist).map(([name,d]) => ({
      name, value:d.units, cost:d.cost,
      percentage:Math.round((d.units/total)*100),
      color: name==="Electricity" ? C.blue : C.teal,
    }));
  }, [filteredData]);

  const efficiencyData = useMemo(() => {
    const map = {};
    filteredData.forEach(b => {
      if (!map[b.billingMonth]) map[b.billingMonth] = { month:b.billingMonth, units:0, cost:0 };
      map[b.billingMonth].units += b.unitsUsed;
      map[b.billingMonth].cost  += b.billAmount;
    });
    return MONTHS.filter(m => map[m]).map(m => ({
      month:m, "Cost/Unit":+(map[m].cost/map[m].units).toFixed(2),
    }));
  }, [filteredData]);

  const comparisonData = useMemo(() => {
    const map = {};
    filteredData.forEach(b => {
      if (!map[b.billingMonth]) map[b.billingMonth] = { month:b.billingMonth, Electricity:0, Water:0 };
      map[b.billingMonth][b.utilityType] = b.unitsUsed;
    });
    const rows = MONTHS.filter(m => map[m]).map(m => map[m]);
    const avg  = rows.reduce((s,r) => s+r.Electricity+r.Water, 0) / (rows.length||1);
    return rows.map(r => ({ ...r, Average:Math.round(avg) }));
  }, [filteredData]);

  const radarData = useMemo(() => {
    const elec = billsData.filter(b => b.utilityType==="Electricity");
    const watr = billsData.filter(b => b.utilityType==="Water");
    const score = (val,min,max) => Math.round(100-((val-min)/(max-min))*50);
    const eCPU = elec.reduce((s,b)=>s+b.billAmount/b.unitsUsed,0)/elec.length;
    const wCPU = watr.reduce((s,b)=>s+b.billAmount/b.unitsUsed,0)/watr.length;
    const eU=elec.map(b=>b.unitsUsed), wU=watr.map(b=>b.unitsUsed);
    const variance=arr=>{const m=arr.reduce((a,b)=>a+b,0)/arr.length;return arr.reduce((s,v)=>s+(v-m)**2,0)/arr.length;};
    const ePeak=Math.max(...eU),wPeak=Math.max(...wU);
    const eAvg=eU.reduce((a,b)=>a+b,0)/eU.length,wAvg=wU.reduce((a,b)=>a+b,0)/wU.length;
    const eTrend=eU[eU.length-1]<eU[0]?85:60, wTrend=wU[wU.length-1]<wU[0]?85:65;
    const eBudget=elec.filter(b=>b.billAmount<5000).length/elec.length*100;
    const wBudget=watr.filter(b=>b.billAmount<950).length/watr.length*100;
    return [
      { metric:"Efficiency",       Electricity:score(eCPU,12,18), Water:score(wCPU,18,22) },
      { metric:"Cost Control",     Electricity:Math.round(eBudget), Water:Math.round(wBudget) },
      { metric:"Usage Stability",  Electricity:Math.max(30,100-Math.round(variance(eU)/100)), Water:Math.max(30,100-Math.round(variance(wU)*10)) },
      { metric:"Peak Management",  Electricity:Math.round((1-(ePeak-eAvg)/eAvg)*100), Water:Math.round((1-(wPeak-wAvg)/wAvg)*100) },
      { metric:"Trend",            Electricity:eTrend, Water:wTrend },
      { metric:"Budget Adherence", Electricity:Math.round(eBudget*0.9), Water:Math.round(wBudget*0.95) },
    ];
  }, []);

  /* insights — original logic, currency changed LKR → Rs. */
  const insights = useMemo(() => {
    const result = [];
    const recent=filteredData.slice(-4), older=filteredData.slice(-8,-4);
    const rAvg=recent.reduce((s,b)=>s+b.unitsUsed,0)/(recent.length||1);
    const oAvg=older.reduce((s,b)=>s+b.unitsUsed,0)/(older.length||1);
    const trend=rAvg>oAvg?"increasing":"decreasing";
    const pct=Math.abs(Math.round(((rAvg-oAvg)/(oAvg||1))*100));
    result.push({ type:trend==="increasing"?"warning":"success", icon:<FiTrendingUp size={15}/>,
      title:"Usage Trend Analysis", text:`Consumption is ${trend} by ${pct}% vs the previous period.`,
      value:"Strategic planning needed" });
    const highCost=filteredData.filter(b=>b.billAmount/b.unitsUsed>15);
    if (highCost.length) result.push({ type:"warning", icon:<FiDollarSign size={15}/>,
      title:"Cost Efficiency Alert",
      text:`${highCost.length} period(s) show elevated cost per unit (> Rs. 15). Review pricing tiers.`,
      value:"Optimisation opportunity" });
    const peakU=Math.max(...filteredData.map(b=>b.unitsUsed));
    const peakM=filteredData.find(b=>b.unitsUsed===peakU)?.billingMonth;
    result.push({ type:"info", icon:<FiActivity size={15}/>,
      title:"Peak Usage Analysis",
      text:`Highest recorded: ${peakU} units in ${peakM}. Plan capacity for similar periods.`,
      value:"Capacity planning" });
    const waterRows=filteredData.filter(b=>b.utilityType==="Water").slice(-3);
    if (waterRows.length) {
      const avgW=waterRows.reduce((s,b)=>s+b.unitsUsed,0)/waterRows.length;
      if (avgW>44) result.push({ type:"warning", icon:<FiAlertTriangle size={15}/>,
        title:"Water Conservation Alert",
        text:`Avg water usage is elevated at ${Math.round(avgW)} units. Consider conservation measures.`,
        value:"Sustainability target" });
    }
    const elecCost=filteredData.filter(b=>b.utilityType==="Electricity").reduce((s,b)=>s+b.billAmount,0);
    result.push({ type:"success", icon:<FiCheckCircle size={15}/>,
      title:"Savings Potential",
      text:`Estimated Rs. ${Math.round(elecCost*0.1).toLocaleString()} monthly savings through electricity optimisation.`,
      value:"ROI: 3–6 months" });
    return result;
  }, [filteredData]);

  /* recommendations — original, currency changed LKR → Rs. */
  const recommendations = [
    { icon:<FiCpu size={16}/>,       title:"Temperature Optimisation", desc:"Smart thermostat controls with 2°C adjustment to reduce HVAC load.", savings:"Rs. 450/mo", roi:"4 months", impl:"2 weeks"  },
    { icon:<FiTrendingUp size={16}/>,title:"Time-of-Use Scheduling",   desc:"Shift 30% of consumption to off-peak hours via automated scheduling.", savings:"Rs. 320/mo", roi:"3 months", impl:"1 week"   },
    { icon:<FiDroplet size={16}/>,   title:"Water Conservation",       desc:"Low-flow fixtures and real-time leak detection monitoring system.", savings:"Rs. 200/mo", roi:"6 months", impl:"3 weeks"  },
    { icon:<FiActivity size={16}/>,  title:"Preventive Maintenance",   desc:"Scheduled equipment servicing to optimise efficiency and extend asset life.", savings:"Rs. 280/mo", roi:"5 months", impl:"Ongoing"  },
  ];

  /* insight type → colors */
  const iColor = { warning:{ accent:C.amber, bg:C.amberL, bdr:C.amberM }, success:{ accent:C.green, bg:C.greenL, bdr:C.greenM }, info:{ accent:C.blue, bg:C.blueL, bdr:C.blueM } };

  /* ════ VIEW RENDERERS — original chart logic, restyled ════ */
  const renderOverview = () => (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:20, marginBottom:28 }}>

      {/* Consumption Area — full width */}
      <ChartCard cls="an-fu an-fu1" style={{ gridColumn:"1/-1" }}>
        <ChartHead title="Consumption Trend" sub="Monthly usage across all utilities"
          action={<ExportBtn onClick={() => exportToCSV(filteredData,"consumption.csv")}/>}/>
        <div style={{ padding:"0 8px 20px" }}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyUsageData} margin={{ top:10, right:16, left:-10, bottom:0 }}>
              <defs>
                <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.blue} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.teal} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:"0.75rem", fontFamily:F, paddingTop:8 }}/>
              {(filter==="All"||filter==="Electricity") &&
                <Area type="monotone" dataKey="Electricity" stroke={C.blue} strokeWidth={2.5}
                  fill="url(#gE)" dot={{ fill:C.blue, r:4 }} activeDot={{ r:6 }}/>}
              {(filter==="All"||filter==="Water") &&
                <Area type="monotone" dataKey="Water" stroke={C.teal} strokeWidth={2.5}
                  fill="url(#gW)" dot={{ fill:C.teal, r:4 }} activeDot={{ r:6 }}/>}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Distribution Pie */}
      <ChartCard cls="an-fu an-fu2">
        <ChartHead title="Cost Allocation" sub="Budget distribution by utility"/>
        <div style={{ padding:"0 20px 20px" }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={distributionData} cx="50%" cy="50%" innerRadius={55} outerRadius={88}
                paddingAngle={4} dataKey="value">
                {distributionData.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily:F, borderRadius:10, border:`1px solid ${C.border}`, boxShadow:C.s3 }}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", flexDirection:"column", gap:10,
            paddingTop:12, borderTop:`1px solid ${C.border}` }}>
            {distributionData.map((e,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:9 }}>
                <span style={{ width:10, height:10, borderRadius:"50%", background:e.color, flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:"0.82rem", fontWeight:600, color:C.body }}>{e.name}</span>
                  <span style={{ fontSize:"0.72rem", color:C.faint, marginLeft:8 }}>
                    {e.value} units · {e.percentage}% · Rs. {e.cost.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      {/* Cost per unit bar */}
      <ChartCard cls="an-fu an-fu3">
        <ChartHead title="Cost per Unit" sub="Monthly unit cost efficiency"/>
        <div style={{ padding:"0 8px 20px" }}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={efficiencyData} barSize={28}>
              <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="Cost/Unit" fill={C.violet} radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );

  const renderTrends = () => (
    <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:20, marginBottom:28 }}>
      <ChartCard cls="an-fu an-fu1">
        <ChartHead title="Monthly Cost Trend" sub="Bill amount over time per utility"
          action={<ExportBtn onClick={() => exportToCSV(filteredData,"trends.csv")}/>}/>
        <div style={{ padding:"0 8px 20px" }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyCostData} margin={{ top:10, right:16, left:-10, bottom:0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:"0.75rem", fontFamily:F, paddingTop:8 }}/>
              {(filter==="All"||filter==="Electricity") &&
                <Line type="monotone" dataKey="Electricity" stroke={C.blue} strokeWidth={2.5}
                  dot={{ r:5, fill:C.blue }} activeDot={{ r:7 }}/>}
              {(filter==="All"||filter==="Water") &&
                <Line type="monotone" dataKey="Water" stroke={C.teal} strokeWidth={2.5}
                  dot={{ r:5, fill:C.teal }} activeDot={{ r:7 }}/>}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard cls="an-fu an-fu2">
        <ChartHead title="Usage vs Cost Correlation" sub="Comparing consumption units against billing amounts"/>
        <div style={{ padding:"0 8px 20px" }}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyUsageData} margin={{ top:10, right:16, left:-10, bottom:0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:"0.75rem", fontFamily:F, paddingTop:8 }}/>
              {(filter==="All"||filter==="Electricity") &&
                <Bar dataKey="Electricity" fill={C.blue}  radius={[4,4,0,0]} barSize={20}/>}
              {(filter==="All"||filter==="Water") &&
                <Bar dataKey="Water"       fill={C.teal}  radius={[4,4,0,0]} barSize={20}/>}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );

  const renderEfficiency = () => (
    <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:20, marginBottom:28 }}>
      <ChartCard cls="an-fu an-fu1">
        <ChartHead title="Performance Assessment Matrix" sub="Scores calculated from actual billing data"
          action={
            <span style={{ display:"flex", alignItems:"center", gap:6, padding:"4px 10px",
              background:C.greenL, border:`1px solid ${C.greenM}`, borderRadius:20,
              fontSize:"0.7rem", fontWeight:600, color:C.green, flexShrink:0 }}>
              <FiInfo size={11}/> Scores derived from real consumption & cost metrics
            </span>
          }/>
        <div style={{ padding:"0 8px 20px" }}>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={C.border}/>
              <PolarAngleAxis dataKey="metric" tick={{ fill:C.muted, fontSize:12, fontFamily:F }}/>
              <PolarRadiusAxis angle={90} domain={[0,100]} tick={{ fill:C.faint, fontSize:10 }}/>
              {(filter==="All"||filter==="Electricity") &&
                <Radar name="Electricity" dataKey="Electricity"
                  stroke={C.blue} fill={C.blue} fillOpacity={0.2} strokeWidth={2}/>}
              {(filter==="All"||filter==="Water") &&
                <Radar name="Water" dataKey="Water"
                  stroke={C.teal} fill={C.teal} fillOpacity={0.2} strokeWidth={2}/>}
              <Legend wrapperStyle={{ fontSize:"0.75rem", fontFamily:F }}/>
              <Tooltip contentStyle={{ fontFamily:F, borderRadius:10, border:`1px solid ${C.border}` }}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard cls="an-fu an-fu2">
        <ChartHead title="Unit Cost Efficiency by Month" sub="Rs. per unit consumed — lower is better"
          action={<ExportBtn onClick={() => exportToCSV(efficiencyData,"efficiency.csv")}/>}/>
        <div style={{ padding:"0 8px 12px" }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={efficiencyData} barSize={32}>
              <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="Cost/Unit" radius={[6,6,0,0]}>
                {efficiencyData.map((e,i) =>
                  <Cell key={i} fill={e["Cost/Unit"]>15?C.red:C.violet}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ margin:"0 20px 20px", padding:"10px 14px", background:C.amberL,
          border:`1px solid ${C.amberM}`, borderRadius:9, display:"flex", gap:8 }}>
          <FiInfo size={13} color={C.amber} style={{ marginTop:1, flexShrink:0 }}/>
          <p style={{ fontSize:"0.72rem", color:C.body, margin:0, lineHeight:1.55 }}>
            <strong>Red bars</strong> indicate months where cost exceeded Rs. 15/unit — review pricing tiers.
          </p>
        </div>
      </ChartCard>
    </div>
  );

  const renderComparison = () => (
    <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:20, marginBottom:28 }}>
      <ChartCard cls="an-fu an-fu1">
        <ChartHead title="Period-over-Period Benchmarking" sub="Monthly usage vs overall average baseline"
          action={<ExportBtn onClick={() => exportToCSV(filteredData,"comparison.csv")}/>}/>
        <div style={{ padding:"0 8px 20px" }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={comparisonData} barGap={4}>
              <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:"0.75rem", fontFamily:F, paddingTop:8 }}/>
              {(filter==="All"||filter==="Electricity") &&
                <Bar dataKey="Electricity" fill={C.blue}  radius={[4,4,0,0]} barSize={18}/>}
              {(filter==="All"||filter==="Water") &&
                <Bar dataKey="Water"       fill={C.teal}  radius={[4,4,0,0]} barSize={18}/>}
              <Bar dataKey="Average" fill={C.amber} radius={[4,4,0,0]} barSize={18}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      <ChartCard cls="an-fu an-fu2">
        <ChartHead title="Monthly Cost Breakdown" sub="Total bill amount stacked by utility type"/>
        <div style={{ padding:"0 8px 20px" }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyCostData} barSize={32}>
              <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:"0.75rem", fontFamily:F, paddingTop:8 }}/>
              {(filter==="All"||filter==="Electricity") &&
                <Bar dataKey="Electricity" stackId="a" fill={C.blue}/>}
              {(filter==="All"||filter==="Water") &&
                <Bar dataKey="Water" stackId="a" fill={C.teal} radius={[4,4,0,0]}/>}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );

  const views = { overview:renderOverview, trends:renderTrends, efficiency:renderEfficiency, comparison:renderComparison };

  /* ════ RENDER ════ */
  return (
    <div style={{ minHeight:"100vh", background:C.page, fontFamily:F,
      color:C.ink, padding:"28px 32px 64px" }}>

      {/* ── HEADER ── */}
      <div className="an-fu an-fu1" style={{ display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", flexWrap:"wrap", gap:16, marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:C.ink, margin:0, letterSpacing:"-0.03em" }}>
            Analytics Dashboard
          </h1>
          <p style={{ fontSize:"0.85rem", color:C.muted, margin:"6px 0 0" }}>
            Data-driven insights for utility optimisation and cost management
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {/* Filter buttons — original 3 options */}
          <div style={{ display:"flex", background:C.card, border:`1px solid ${C.border}`,
            borderRadius:10, padding:3, gap:2 }}>
            {["All","Electricity","Water"].map(f => (
              <button key={f} className="an-fbtn"
                onClick={() => setFilter(f)}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"6px 13px",
                  borderRadius:8, border:"none", fontFamily:F, fontSize:"0.78rem", fontWeight:600,
                  cursor:"pointer", transition:"all .15s",
                  background: filter===f ? (f==="Electricity"?C.blue:f==="Water"?C.teal:"#0f172a") : "transparent",
                  color:       filter===f ? "#fff" : C.muted,
                  boxShadow:   filter===f ? C.s1 : "none" }}>
                {f==="Electricity" && <FiZap size={11}/>}
                {f==="Water"       && <FiDroplet size={11}/>}
                {f==="All" ? "All Utilities" : f}
              </button>
            ))}
          </div>
          <ExportBtn onClick={() => exportToCSV(filteredData,"analytics-export.csv")}/>
        </div>
      </div>

      {/* ── VIEW TABS — original 4 tabs ── */}
      <div className="an-fu an-fu2" style={{ display:"flex", gap:3, marginBottom:24,
        background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:4, overflowX:"auto" }}>
        {[
          { id:"overview",   icon:<FiBarChart2 size={14}/>,   label:"Executive Overview"   },
          { id:"trends",     icon:<FiTrendingUp size={14}/>,  label:"Trend Analysis"        },
          { id:"efficiency", icon:<FiActivity size={14}/>,    label:"Efficiency Metrics"    },
          { id:"comparison", icon:<FiTarget size={14}/>,      label:"Comparative Analysis"  },
        ].map(v => (
          <button key={v.id} className="an-vbtn"
            onClick={() => setAnalysisView(v.id)}
            style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 16px",
              borderRadius:9, border:"none", fontFamily:F, fontSize:"0.82rem", fontWeight:600,
              cursor:"pointer", transition:"all .15s", whiteSpace:"nowrap", flexShrink:0,
              background: analysisView===v.id ? C.blueL : "transparent",
              color:       analysisView===v.id ? C.blue  : C.muted }}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* ── STAT CARDS — original 6 cards exactly ── */}
      <SectionLabel>At a Glance</SectionLabel>
      <div className="an-fu an-fu3" style={{ display:"grid",
        gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:28 }}>
        {[
          { icon:<FiBarChart2 size={16}/>,  label:"Billing Periods",    value:stats.totalBills,                              sub:"Complete cycle coverage",        badge:"+12% YoY",          up:true,  accent:C.blue,   bg:C.blueL,   bdr:C.blueM   },
          { icon:<FiTrendingUp size={16}/>, label:"Total Consumption",  value:`${stats.totalUnits} units`,                   sub:"Aggregate utility usage",        badge:"+5% this quarter",  up:false, accent:C.teal,   bg:C.tealL,   bdr:C.tealM   },
          { icon:<FiDollarSign size={16}/>, label:"Total Expenditure",  value:`Rs. ${stats.totalAmount.toLocaleString()}`,   sub:"Full financial overview",        badge:"+8% cost increase",  up:false, accent:C.violet, bg:C.violetL, bdr:C.violetM },
          { icon:<FiActivity size={16}/>,   label:"Avg Usage / Period", value:stats.avgUsage,                                sub:"Per-period baseline",            badge:"-3% efficiency gain",up:true,  accent:C.green,  bg:C.greenL,  bdr:C.greenM  },
          { icon:<FiDollarSign size={16}/>, label:"Cost per Unit",      value:`Rs. ${stats.costPerUnit}`,                    sub:"Unit cost efficiency",           badge:"Optimal range",      up:true,  accent:C.amber,  bg:C.amberL,  bdr:C.amberM  },
          { icon:<FiZap size={16}/>,        label:"Peak Demand",        value:stats.peakUsage,                               sub:`Recorded in ${stats.peakMonth}`, badge:"Max period",         up:null,  accent:C.red,    bg:C.redL,    bdr:C.redM    },
        ].map((s,i) => (
          <div key={i} className="an-stat"
            style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
              overflow:"hidden", boxShadow:C.s1,
              transition:"transform .22s ease, box-shadow .22s ease" }}>
            {/* colored top bar */}
            <div style={{ height:3, background:`linear-gradient(90deg,${s.accent},${s.accent}66)` }}/>
            <div style={{ padding:"16px 18px 18px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:9, background:s.bg,
                  border:`1px solid ${s.bdr}`, display:"flex", alignItems:"center",
                  justifyContent:"center", color:s.accent }}>{s.icon}</div>
                <span style={{ fontSize:"0.68rem", fontWeight:700, padding:"2px 8px",
                  borderRadius:20, whiteSpace:"nowrap",
                  background: s.up===true?C.greenL : s.up===false?C.amberL : C.blueL,
                  border:`1px solid ${s.up===true?C.greenM:s.up===false?C.amberM:C.blueM}`,
                  color: s.up===true?C.green : s.up===false?C.amber : C.blue }}>
                  {s.badge}
                </span>
              </div>
              <p style={{ fontSize:"1.45rem", fontWeight:800, color:C.ink,
                letterSpacing:"-0.03em", margin:"0 0 3px", lineHeight:1.1 }}>{s.value}</p>
              <p style={{ fontSize:"0.78rem", fontWeight:600, color:C.body, margin:"0 0 2px" }}>{s.label}</p>
              <p style={{ fontSize:"0.7rem", color:C.muted, margin:0 }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── ACTIVE VIEW ── */}
      {views[analysisView]()}

      {/* ── INSIGHTS ── */}
      <SectionLabel>Strategic Insights</SectionLabel>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:14, flexWrap:"wrap", gap:8 }}>
        <p style={{ fontSize:"0.8rem", color:C.muted, margin:0 }}>
          Actionable intelligence from consumption patterns and cost data
        </p>
        <span style={{ fontSize:"0.72rem", fontWeight:700, color:C.blue,
          background:C.blueL, border:`1px solid ${C.blueM}`, borderRadius:20, padding:"3px 10px" }}>
          {insights.length} Active
        </span>
      </div>
      <div className="an-fu an-fu5" style={{ display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14, marginBottom:28 }}>
        {insights.map((ins,i) => {
          const ic = iColor[ins.type] || iColor.info;
          return (
            <div key={i} className="an-ins"
              style={{ background:ic.bg, border:`1px solid ${ic.bdr}`,
                borderLeft:`3px solid ${ic.accent}`, borderRadius:12, overflow:"hidden",
                transition:"transform .2s ease, box-shadow .2s ease" }}>
              <div style={{ display:"flex", gap:10, padding:"14px 16px 10px" }}>
                <div style={{ width:32, height:32, borderRadius:8, background:C.card,
                  border:`1px solid ${ic.bdr}`, display:"flex", alignItems:"center",
                  justifyContent:"center", color:ic.accent, flexShrink:0 }}>{ins.icon}</div>
                <div>
                  <h4 style={{ fontSize:"0.85rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>{ins.title}</h4>
                  <p style={{ fontSize:"0.78rem", color:C.body, margin:0, lineHeight:1.55 }}>{ins.text}</p>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"8px 16px 12px", borderTop:`1px solid ${ic.bdr}` }}>
                <span style={{ fontSize:"0.72rem", fontWeight:700, color:ic.accent }}>{ins.value}</span>
                <button className="an-abtn"
                  style={{ fontSize:"0.72rem", fontWeight:600, color:C.muted,
                    background:"transparent", border:`1px solid ${C.border}`, borderRadius:6,
                    padding:"3px 10px", cursor:"pointer", fontFamily:F, transition:"all .15s" }}>
                  Analyze →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── RECOMMENDATIONS ── */}
      <SectionLabel>Optimisation Recommendations</SectionLabel>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        marginBottom:14, flexWrap:"wrap", gap:8 }}>
        <p style={{ fontSize:"0.8rem", color:C.muted, margin:0 }}>
          Data-driven initiatives with projected ROI and implementation timeline
        </p>
        <span style={{ fontSize:"0.72rem", fontWeight:700, color:C.green,
          background:C.greenL, border:`1px solid ${C.greenM}`, borderRadius:20, padding:"3px 10px" }}>
          Total: Rs. 1,250/mo
        </span>
      </div>
      <div className="an-fu an-fu6" style={{ display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
        {recommendations.map((r,i) => (
          <div key={i} className="an-rec"
            style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
              overflow:"hidden", boxShadow:C.s1,
              transition:"transform .22s ease, box-shadow .22s ease" }}>
            <div style={{ padding:"18px 18px 14px", display:"flex", gap:12, alignItems:"flex-start" }}>
              <div style={{ width:38, height:38, borderRadius:9, background:C.greenL,
                border:`1px solid ${C.greenM}`, display:"flex", alignItems:"center",
                justifyContent:"center", color:C.green, flexShrink:0 }}>{r.icon}</div>
              <div>
                <h4 style={{ fontSize:"0.875rem", fontWeight:700, color:C.ink, margin:"0 0 4px" }}>{r.title}</h4>
                <p style={{ fontSize:"0.77rem", color:C.muted, margin:0, lineHeight:1.5 }}>{r.desc}</p>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", borderTop:`1px solid ${C.border}` }}>
              {[
                { label:"Savings",    val:r.savings, color:C.green },
                { label:"ROI Period", val:r.roi,     color:C.ink   },
                { label:"Setup",      val:r.impl,    color:C.ink   },
              ].map((m,j) => (
                <div key={j} style={{ padding:"10px 8px", textAlign:"center",
                  borderRight:j<2?`1px solid ${C.border}`:"none" }}>
                  <p style={{ fontSize:"0.62rem", fontWeight:700, color:C.faint,
                    textTransform:"uppercase", letterSpacing:"0.08em", margin:"0 0 3px" }}>{m.label}</p>
                  <p style={{ fontSize:"0.82rem", fontWeight:800, color:m.color, margin:0 }}>{m.val}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Analytics;