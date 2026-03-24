// src/pages/Report.jsx
import { useState, useEffect, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import {
  FiZap, FiDroplet, FiWifi, FiGrid, FiDollarSign, FiTrendingUp,
  FiDownload, FiCheckCircle, FiAlertTriangle, FiInfo,
} from "react-icons/fi";

/* ─── Font ─── */
if (!document.getElementById("db-font")) {
  const l = document.createElement("link");
  l.id = "db-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.getElementById("rpt-anim")) {
  const s = document.createElement("style");
  s.id = "rpt-anim";
  s.textContent = `
    @keyframes rptFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    .r-fu  { animation: rptFadeUp .4s ease both }
    .r-fu1 { animation-delay:.05s } .r-fu2 { animation-delay:.10s }
    .r-fu3 { animation-delay:.15s } .r-fu4 { animation-delay:.20s }
    .r-fu5 { animation-delay:.25s }
    .r-kpi:hover        { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .r-chart:hover      { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .r-export:hover     { background:#0f172a!important; color:#fff!important; border-color:#0f172a!important; }
    .r-toggle:hover     { background:#f0f2f7!important; }
    .r-pageBtn:hover:not(:disabled) { border-color:#2563eb!important; color:#2563eb!important; }
    .r-pageDot:hover:not(.active)   { background:#f0f2f7!important; }
    .r-th:hover { color:#0f172a!important; }
    .r-tr:hover { background:#f8fafc!important; }
  `;
  document.head.appendChild(s);
}

/* ════ TOKENS ════ */
const C = {
  page:"#f3f4f8", card:"#fff", hover:"#f0f2f7", surface2:"#f8fafc",
  ink:"#0f172a", body:"#334155", muted:"#64748b", faint:"#94a3b8",
  border:"#e2e8f0", borderB:"#cbd5e1",
  blue:"#2563eb", blueL:"#eff6ff", blueM:"#bfdbfe",
  teal:"#0891b2", tealL:"#ecfeff", tealM:"#a5f3fc",
  green:"#059669", greenL:"#ecfdf5", greenM:"#a7f3d0",
  amber:"#d97706", amberL:"#fffbeb", amberM:"#fde68a",
  red:"#dc2626",   redL:"#fef2f2",   redM:"#fecaca",
  violet:"#7c3aed",violetL:"#f5f3ff",violetM:"#ddd6fe",
  indigo:"#4f46e5",indigoL:"#eef2ff",indigoM:"#c7d2fe",
  s1:"0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
  s2:"0 4px 16px rgba(15,23,42,.08),0 2px 4px rgba(15,23,42,.04)",
  s3:"0 12px 40px rgba(15,23,42,.10),0 4px 8px rgba(15,23,42,.04)",
};
const F = "'Plus Jakarta Sans',-apple-system,sans-serif";
const ax = { fill:C.faint, fontSize:11, fontFamily:F };

/* ── Utility meta ── */
const UTIL_META = {
  Electricity: { color:C.amber,  bg:C.amberL,  bdr:C.amberM,  chartColor:C.amber,  icon:(s)=><FiZap size={s}/>,     flatRate:false },
  Water:       { color:C.teal,   bg:C.tealL,   bdr:C.tealM,   chartColor:C.teal,   icon:(s)=><FiDroplet size={s}/>, flatRate:false },
  Internet:    { color:C.indigo, bg:C.indigoL, bdr:C.indigoM, chartColor:C.indigo, icon:(s)=><FiWifi size={s}/>,    flatRate:true  },
};
const UTILITIES = Object.keys(UTIL_META);

/* ════ CUSTOM TOOLTIP ════ */
const CustomTooltip = ({ active, payload, label, prefix="" }) => {
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
            {prefix}{p.value?.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ════ MAIN COMPONENT ════ */
const Report = () => {

  const [billsData] = useState([
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
    { id:13, utilityType:"Electricity", billingMonth:"December 2025",  unitsUsed:340, billAmount:2900 },
    { id:14, utilityType:"Water",       billingMonth:"December 2025",  unitsUsed:22,  billAmount:860  },
    // ── Internet (flat-rate) ──
    { id:15, utilityType:"Internet",    billingMonth:"June 2025",      unitsUsed:0,   billAmount:3500 },
    { id:16, utilityType:"Internet",    billingMonth:"July 2025",      unitsUsed:0,   billAmount:3500 },
    { id:17, utilityType:"Internet",    billingMonth:"August 2025",    unitsUsed:0,   billAmount:4200 },
    { id:18, utilityType:"Internet",    billingMonth:"September 2025", unitsUsed:0,   billAmount:4200 },
    { id:19, utilityType:"Internet",    billingMonth:"October 2025",   unitsUsed:0,   billAmount:4200 },
    { id:20, utilityType:"Internet",    billingMonth:"November 2025",  unitsUsed:0,   billAmount:4200 },
    { id:21, utilityType:"Internet",    billingMonth:"December 2025",  unitsUsed:0,   billAmount:4200 },
  ]);

  // "All" replaces "Both" now that there are 3 utilities
  const [utilityFilter,    setUtilityFilter]    = useState("All");
  const [timeRange,        setTimeRange]        = useState("Yearly");
  const [selectedMonth,    setSelectedMonth]    = useState("November 2025");
  const [selectedQuarter,  setSelectedQuarter]  = useState("Q4 2025");
  const [selectedYear,     setSelectedYear]     = useState("2025");
  const [currentPage,      setCurrentPage]      = useState(1);
  const [sortConfig,       setSortConfig]       = useState({ key:"billingMonth", direction:"ascending" });
  const [animatedValues,   setAnimatedValues]   = useState({ units:0, amount:0, avg:0 });
  const rowsPerPage = 5;

  const monthOrder = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  /* ── Derived filter helpers ── */
  // Which utility types are currently active
  const activeTypes = useMemo(() =>
    utilityFilter === "All" ? UTILITIES : [utilityFilter],
  [utilityFilter]);

  const isFlat = utilityFilter !== "All" && UTIL_META[utilityFilter]?.flatRate;

  /* ── Available time selectors ── */
  const availableMonths = useMemo(() =>
    [...new Set(billsData.map(b => b.billingMonth))].sort((a,b) =>
      monthOrder.indexOf(a.split(" ")[0]) - monthOrder.indexOf(b.split(" ")[0])),
  [billsData]);

  const availableQuarters = useMemo(() => {
    const quarters = new Set();
    billsData.forEach(bill => {
      const [month, year] = bill.billingMonth.split(" ");
      let q;
      if (["January","February","March"].includes(month))         q = `Q1 ${year}`;
      else if (["April","May","June"].includes(month))            q = `Q2 ${year}`;
      else if (["July","August","September"].includes(month))     q = `Q3 ${year}`;
      else if (["October","November","December"].includes(month)) q = `Q4 ${year}`;
      quarters.add(q);
    });
    return Array.from(quarters).sort();
  }, [billsData]);

  const availableYears = useMemo(() =>
    [...new Set(billsData.map(b => b.billingMonth.split(" ")[1]))].sort(), [billsData]);

  /* ── Filtered data ── */
  const filteredData = useMemo(() => {
    let f = [...billsData];
    if (utilityFilter !== "All") f = f.filter(b => b.utilityType === utilityFilter);
    if (timeRange === "Monthly") {
      f = f.filter(b => b.billingMonth === selectedMonth);
    } else if (timeRange === "Quarterly") {
      const [q, yr] = selectedQuarter.split(" ");
      const qMonths = { Q1:["January","February","March"], Q2:["April","May","June"], Q3:["July","August","September"], Q4:["October","November","December"] };
      f = f.filter(b => { const [m,y] = b.billingMonth.split(" "); return y===yr && qMonths[q].includes(m); });
    } else {
      f = f.filter(b => b.billingMonth.includes(selectedYear));
    }
    return f;
  }, [billsData, utilityFilter, timeRange, selectedMonth, selectedQuarter, selectedYear]);

  /* ── Summary metrics ──
     For Internet (flat-rate) totalUnits is meaningless — show bill count instead */
  const summaryMetrics = useMemo(() => {
    if (!filteredData.length) return { totalUnits:0, totalAmount:0, avgMonthlyCost:0, highestConsumptionMonth:"N/A" };
    const totalUnits  = isFlat ? filteredData.length : filteredData.reduce((s,b) => s+b.unitsUsed, 0);
    const totalAmount = filteredData.reduce((s,b) => s+b.billAmount, 0);
    let avgMonthlyCost;
    if (timeRange === "Monthly")        avgMonthlyCost = totalAmount;
    else if (timeRange === "Quarterly") avgMonthlyCost = totalAmount / 3;
    else { const months = new Set(filteredData.map(b => b.billingMonth)).size; avgMonthlyCost = totalAmount / months; }
    const highest = filteredData.reduce((max,b) => b.billAmount > max.billAmount ? b : max, filteredData[0]);
    return { totalUnits, totalAmount, avgMonthlyCost:Math.round(avgMonthlyCost), highestConsumptionMonth:highest.billingMonth };
  }, [filteredData, timeRange, isFlat]);

  useEffect(() => {
    const start = Date.now(), duration = 800;
    const { totalUnits, totalAmount, avgMonthlyCost } = summaryMetrics;
    const tick = () => {
      const elapsed = Date.now()-start, progress = Math.min(elapsed/duration, 1);
      const ease = 1-Math.pow(1-progress, 3);
      setAnimatedValues({ units:Math.round(totalUnits*ease), amount:Math.round(totalAmount*ease), avg:Math.round(avgMonthlyCost*ease) });
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [summaryMetrics]);

  /* ── Chart: usage over time ──
     Internet has no units — only shown in amount chart, not usage chart */
  const usageOverTimeData = useMemo(() => {
    const data = {};
    billsData.forEach(bill => {
      if (!activeTypes.includes(bill.utilityType)) return;
      if (bill.utilityType === "Internet") return; // flat-rate, skip usage chart
      const key = bill.billingMonth;
      if (!data[key]) data[key] = { month:bill.billingMonth.split(" ")[0] };
      if (utilityFilter === "All") data[key][bill.utilityType] = bill.unitsUsed;
      else data[key].units = bill.unitsUsed;
    });
    return Object.values(data).sort((a,b) => monthOrder.indexOf(a.month)-monthOrder.indexOf(b.month));
  }, [billsData, utilityFilter, activeTypes]);

  /* ── Chart: monthly expenses — includes Internet ── */
  const monthlyExpensesData = useMemo(() => {
    const data = {};
    billsData.forEach(bill => {
      if (!activeTypes.includes(bill.utilityType)) return;
      const m = bill.billingMonth.split(" ")[0];
      if (!data[m]) data[m] = { month:m, expenses:0, Electricity:0, Water:0, Internet:0 };
      data[m].expenses += bill.billAmount;
      data[m][bill.utilityType] += bill.billAmount;
    });
    return Object.values(data).sort((a,b) => monthOrder.indexOf(a.month)-monthOrder.indexOf(b.month));
  }, [billsData, activeTypes]);

  /* ── Chart: distribution pie — 3 slices when "All" ── */
  const utilityDistributionData = useMemo(() => {
    if (utilityFilter !== "All") return [];
    return UTILITIES.map(t => ({
      name: t,
      value: billsData.filter(b => b.utilityType===t).reduce((s,b) => s+b.billAmount, 0),
      color: UTIL_META[t].chartColor,
    })).filter(d => d.value > 0);
  }, [billsData, utilityFilter]);

  /* ── Table ── */
  const tableData = useMemo(() => {
    const sorted = [...filteredData].sort((a,b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction==="ascending" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction==="ascending" ?  1 : -1;
      return 0;
    });
    return sorted.map((bill,i) => {
      let usageChange = 0;
      if (!isFlat && i > 0 && bill.utilityType === sorted[i-1].utilityType) {
        const prev = sorted[i-1].unitsUsed;
        if (prev > 0) usageChange = ((bill.unitsUsed-prev)/prev)*100;
      }
      return { ...bill, usageChange:usageChange.toFixed(1) };
    });
  }, [filteredData, sortConfig, isFlat]);

  const paginatedData = useMemo(() => {
    const start = (currentPage-1)*rowsPerPage;
    return tableData.slice(start, start+rowsPerPage);
  }, [tableData, currentPage]);
  const totalPages = Math.ceil(tableData.length/rowsPerPage);

  const handleSort = (key) =>
    setSortConfig(prev => ({ key, direction:prev.key===key && prev.direction==="ascending" ? "descending" : "ascending" }));

  /* ── Insights — extended for Internet ── */
  const insights = useMemo(() => {
    const list = [];
    if (!filteredData.length) { list.push({ type:"info", text:"No data available for the selected filters." }); return list; }

    // Electricity MoM
    const elecBills = filteredData.filter(b => b.utilityType==="Electricity");
    if (elecBills.length >= 2) {
      const s = [...elecBills].sort((a,b) => monthOrder.indexOf(b.billingMonth.split(" ")[0])-monthOrder.indexOf(a.billingMonth.split(" ")[0]));
      const latest = s[0];
      const prev   = s.find(b => {
        const [bm,by]=b.billingMonth.split(" "), [lm,ly]=latest.billingMonth.split(" ");
        return by===ly && monthOrder.indexOf(bm)===monthOrder.indexOf(lm)-1;
      });
      if (prev) {
        const pct = ((latest.unitsUsed-prev.unitsUsed)/prev.unitsUsed)*100;
        list.push({ type:pct>0?"warning":"success", text:`Electricity usage ${pct>0?"increased":"decreased"} by ${Math.abs(pct).toFixed(1)}% compared to last month.` });
      }
    }

    // Water trend
    const waterBills = filteredData.filter(b => b.utilityType==="Water");
    if (waterBills.length >= 3) {
      const sw = [...waterBills].sort((a,b) => monthOrder.indexOf(a.billingMonth.split(" ")[0])-monthOrder.indexOf(b.billingMonth.split(" ")[0]));
      let inc=true, dec=true;
      for (let i=1; i<sw.length; i++) {
        if (sw[i].unitsUsed < sw[i-1].unitsUsed) inc=false;
        if (sw[i].unitsUsed > sw[i-1].unitsUsed) dec=false;
      }
      if (inc) list.push({ type:"warning", text:"Water consumption has been steadily increasing over the selected period." });
      else if (dec) list.push({ type:"success", text:"Water consumption has been steadily decreasing — great progress!" });
    }

    // Internet plan change detection
    const netBills = filteredData.filter(b => b.utilityType==="Internet");
    if (netBills.length >= 2) {
      const sortedNet = [...netBills].sort((a,b) => monthOrder.indexOf(a.billingMonth.split(" ")[0])-monthOrder.indexOf(b.billingMonth.split(" ")[0]));
      const changed = sortedNet.some((b,i) => i>0 && b.billAmount !== sortedNet[i-1].billAmount);
      if (changed) {
        const max = Math.max(...sortedNet.map(b=>b.billAmount));
        const min = Math.min(...sortedNet.map(b=>b.billAmount));
        list.push({ type:"info", text:`Internet plan charges varied between Rs. ${min.toLocaleString()} and Rs. ${max.toLocaleString()} — a possible plan upgrade occurred.` });
      } else {
        list.push({ type:"success", text:`Internet bill has been consistent at Rs. ${sortedNet[0].billAmount.toLocaleString()} — no plan changes detected.` });
      }
    }

    // Peak expenditure (by amount, works for all types incl. Internet)
    const highest = filteredData.reduce((max,b) => b.billAmount>max.billAmount?b:max, filteredData[0]);
    list.push({ type:"info", text:`Peak expenditure was in ${highest.billingMonth} at Rs. ${highest.billAmount.toLocaleString()}.` });

    return list;
  }, [filteredData]);

  const exportToCSV = () => {
    const rows = [
      [`Report — ${timeRange==="Monthly"?selectedMonth:timeRange==="Quarterly"?selectedQuarter:selectedYear}`],
      [],
      ["Utility Type","Billing Month","Units Used","Bill Amount (Rs.)"],
      ...filteredData.map(b => [b.utilityType, b.billingMonth, b.utilityType==="Internet"?"Flat-rate":b.unitsUsed, b.billAmount]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`utility_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.style.display="none"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const sortArrow = (key) => sortConfig.key===key ? (sortConfig.direction==="ascending" ? " ↑" : " ↓") : "";

  const ToggleGroup = ({ options, value, onChange }) => (
    <div style={{ display:"flex", background:C.card, border:`1px solid ${C.border}`,
      borderRadius:9, padding:3, gap:2 }}>
      {options.map(opt => (
        <button key={opt} className={`r-toggle${value===opt?" active":""}`}
          onClick={() => onChange(opt)}
          style={{ padding:"5px 12px", borderRadius:7, border:"none", fontFamily:F,
            fontSize:"0.78rem", fontWeight:600, cursor:"pointer", transition:"all .15s",
            background: value===opt ? C.blueL : "transparent",
            color:       value===opt ? C.blue  : C.muted }}>
          {opt}
        </button>
      ))}
    </div>
  );

  const insightStyle = {
    success: { bg:C.greenL,  bdr:C.greenM,  accent:C.green,  icon:<FiCheckCircle size={15}/> },
    warning: { bg:C.amberL,  bdr:C.amberM,  accent:C.amber,  icon:<FiAlertTriangle size={15}/> },
    info:    { bg:C.blueL,   bdr:C.blueM,   accent:C.blue,   icon:<FiInfo size={15}/> },
  };

  /* ════ RENDER ════ */
  return (
    <div style={{ minHeight:"100vh", background:C.page, fontFamily:F,
      color:C.ink, padding:"28px 32px 64px" }}>

      {/* HEADER */}
      <header className="r-fu r-fu1" style={{ display:"flex", alignItems:"flex-end",
        justifyContent:"space-between", marginBottom:28, paddingBottom:24,
        borderBottom:`1px solid ${C.border}`, flexWrap:"wrap", gap:16 }}>
        <div>
          <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:C.ink,
            margin:"0 0 5px", letterSpacing:"-0.03em" }}>Utility Reports</h1>
          <p style={{ fontSize:"0.875rem", color:C.muted, margin:0 }}>
            Track, analyze, and optimize your consumption patterns
          </p>
        </div>
        <button className="r-export" onClick={exportToCSV}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px",
            borderRadius:9, background:C.card, border:`1px solid ${C.borderB}`,
            color:C.muted, fontFamily:F, fontSize:"0.8rem", fontWeight:600,
            cursor:"pointer", transition:"all .18s", whiteSpace:"nowrap" }}>
          <FiDownload size={14}/> Export CSV
        </button>
      </header>

      {/* FILTERS */}
      <section className="r-fu r-fu2" style={{ display:"flex", flexWrap:"wrap",
        gap:12, marginBottom:28, alignItems:"center" }}>

        {/* Utility — now "All" + 3 individual options */}
        <div style={{ display:"flex", alignItems:"center", gap:10,
          background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 14px" }}>
          <label style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase",
            letterSpacing:"0.08em", color:C.muted, whiteSpace:"nowrap" }}>Utility</label>
          <ToggleGroup
            options={["All", ...UTILITIES]}
            value={utilityFilter}
            onChange={v => { setUtilityFilter(v); setCurrentPage(1); }}/>
        </div>

        {/* Time Range */}
        <div style={{ display:"flex", alignItems:"center", gap:10,
          background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 14px" }}>
          <label style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase",
            letterSpacing:"0.08em", color:C.muted, whiteSpace:"nowrap" }}>Time Range</label>
          <ToggleGroup options={["Monthly","Quarterly","Yearly"]} value={timeRange} onChange={v => setTimeRange(v)}/>
        </div>

        {timeRange === "Monthly" && (
          <div style={{ display:"flex", alignItems:"center", gap:10,
            background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 14px" }}>
            <label style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase",
              letterSpacing:"0.08em", color:C.muted }}>Month</label>
            <div style={{ position:"relative" }}>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
                style={{ background:"transparent", border:"none", color:C.body,
                  fontFamily:F, fontSize:"0.82rem", fontWeight:500,
                  cursor:"pointer", outline:"none", padding:"2px 20px 2px 4px", appearance:"none" }}>
                {availableMonths.map(m => <option key={m}>{m}</option>)}
              </select>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.faint}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        )}
        {timeRange === "Quarterly" && (
          <div style={{ display:"flex", alignItems:"center", gap:10,
            background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 14px" }}>
            <label style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase",
              letterSpacing:"0.08em", color:C.muted }}>Quarter</label>
            <div style={{ position:"relative" }}>
              <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)}
                style={{ background:"transparent", border:"none", color:C.body,
                  fontFamily:F, fontSize:"0.82rem", fontWeight:500,
                  cursor:"pointer", outline:"none", padding:"2px 20px 2px 4px", appearance:"none" }}>
                {availableQuarters.map(q => <option key={q}>{q}</option>)}
              </select>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.faint}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        )}
        {timeRange === "Yearly" && (
          <div style={{ display:"flex", alignItems:"center", gap:10,
            background:C.card, border:`1px solid ${C.border}`, borderRadius:10, padding:"8px 14px" }}>
            <label style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase",
              letterSpacing:"0.08em", color:C.muted }}>Year</label>
            <div style={{ position:"relative" }}>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                style={{ background:"transparent", border:"none", color:C.body,
                  fontFamily:F, fontSize:"0.82rem", fontWeight:500,
                  cursor:"pointer", outline:"none", padding:"2px 20px 2px 4px", appearance:"none" }}>
                {availableYears.map(y => <option key={y}>{y}</option>)}
              </select>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.faint}
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        )}
      </section>

      {/* KPI CARDS */}
      <section className="r-fu r-fu3" style={{ display:"grid",
        gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        {[
          {
            label: isFlat ? "Bills Recorded" : "Total Units Consumed",
            value: isFlat ? `${animatedValues.units} bills` : animatedValues.units.toLocaleString(),
            sub:   utilityFilter==="All" ? "All utilities" : utilityFilter,
            icon:  <FiZap size={18}/>, accent:C.amber, bg:C.amberL, bdr:C.amberM,
          },
          { label:"Total Amount Spent",   value:`Rs. ${animatedValues.amount.toLocaleString()}`, sub:`${timeRange} period`,   icon:<FiGrid size={18}/>,       accent:C.teal,   bg:C.tealL,   bdr:C.tealM   },
          { label:"Avg Monthly Cost",     value:`Rs. ${animatedValues.avg.toLocaleString()}`,    sub:"Calculated average",    icon:<FiDollarSign size={18}/>, accent:C.violet, bg:C.violetL, bdr:C.violetM },
          { label:"Peak Expenditure",     value:summaryMetrics.highestConsumptionMonth,          sub:"Highest spend period",  icon:<FiTrendingUp size={18}/>, accent:C.red,    bg:C.redL,    bdr:C.redM    },
        ].map((k,i) => (
          <div key={i} className="r-kpi"
            style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14,
              padding:"20px 22px", display:"flex", gap:16, alignItems:"flex-start",
              position:"relative", overflow:"hidden", boxShadow:C.s1,
              transition:"transform .2s ease, box-shadow .2s ease" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
              background:`linear-gradient(90deg,${k.accent},transparent)`, borderRadius:"14px 14px 0 0" }}/>
            <div style={{ width:40, height:40, borderRadius:10, display:"flex",
              alignItems:"center", justifyContent:"center", flexShrink:0,
              background:k.bg, color:k.accent }}>{k.icon}</div>
            <div>
              <p style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase",
                letterSpacing:"0.07em", color:C.muted, margin:"0 0 5px" }}>{k.label}</p>
              <p style={{ fontSize:"1.35rem", fontWeight:800, color:C.ink,
                margin:"0 0 3px", letterSpacing:"-0.02em" }}>{k.value}</p>
              <p style={{ fontSize:"0.7rem", color:C.faint, margin:0 }}>{k.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CHARTS GRID */}
      <section className="r-fu r-fu4" style={{ display:"grid",
        gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:28 }}>

        {/* Area chart — usage over time — hidden when Internet-only (no units) */}
        {!isFlat && (
          <div className="r-chart"
            style={{ gridColumn:"1/-1", background:C.card, border:`1px solid ${C.border}`,
              borderRadius:14, padding:"22px 24px 18px", boxShadow:C.s1,
              transition:"transform .2s ease, box-shadow .2s ease" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
              flexWrap:"wrap", gap:12, marginBottom:18 }}>
              <div>
                <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>Consumption Over Time</h3>
                <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>Monthly unit usage across utilities</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                {(utilityFilter==="All"||utilityFilter==="Electricity") && (
                  <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:"0.72rem", color:C.muted }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:C.amber, display:"inline-block" }}/>
                    Electricity
                  </span>
                )}
                {(utilityFilter==="All"||utilityFilter==="Water") && (
                  <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:"0.72rem", color:C.muted }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:C.teal, display:"inline-block" }}/>
                    Water
                  </span>
                )}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={usageOverTimeData} margin={{ top:10, right:20, left:0, bottom:0 }}>
                <defs>
                  <linearGradient id="rgE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.amber} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={C.amber} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="rgW" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={C.teal} stopOpacity={0.15}/>
                    <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                {(utilityFilter==="All"||utilityFilter==="Electricity") &&
                  <Area type="monotone" dataKey="Electricity" stroke={C.amber} strokeWidth={2} fill="url(#rgE)" dot={false}/>}
                {(utilityFilter==="All"||utilityFilter==="Water") &&
                  <Area type="monotone" dataKey="Water" stroke={C.teal} strokeWidth={2} fill="url(#rgW)" dot={false}/>}
                {utilityFilter !== "All" &&
                  <Area type="monotone" dataKey="units" name="Units Used" stroke={C.amber} strokeWidth={2} fill="url(#rgE)" dot={false}/>}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Bar chart — monthly expenses (always shown, spans full width for Internet-only) */}
        <div className="r-chart"
          style={{ gridColumn: isFlat ? "1/-1" : "auto",
            background:C.card, border:`1px solid ${C.border}`,
            borderRadius:14, padding:"22px 24px 18px", boxShadow:C.s1,
            transition:"transform .2s ease, box-shadow .2s ease" }}>
          <div style={{ marginBottom:18 }}>
            <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>Monthly Expenses</h3>
            <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>Total spend per month (Rs.)</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyExpensesData} barSize={22} margin={{ top:10, right:10, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip prefix="Rs. "/>}/>
              {utilityFilter === "All" ? (
                <>
                  <Bar dataKey="Electricity" name="Electricity" stackId="a" fill={C.amber}  radius={[0,0,0,0]}/>
                  <Bar dataKey="Water"       name="Water"       stackId="a" fill={C.teal}   radius={[0,0,0,0]}/>
                  <Bar dataKey="Internet"    name="Internet"    stackId="a" fill={C.indigo} radius={[4,4,0,0]}/>
                </>
              ) : (
                <Bar dataKey="expenses" name="Expenses"
                  fill={UTIL_META[utilityFilter]?.chartColor || C.blue} radius={[4,4,0,0]}>
                  {monthlyExpensesData.map((_,i) => {
                    const base = UTIL_META[utilityFilter]?.chartColor || C.blue;
                    return <Cell key={i} fill={`${base}${Math.round(102+153*(i/monthlyExpensesData.length)).toString(16)}`}/>;
                  })}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — 3-way distribution when "All" */}
        {utilityFilter === "All" && (
          <div className="r-chart"
            style={{ background:C.card, border:`1px solid ${C.border}`,
              borderRadius:14, padding:"22px 24px 18px", boxShadow:C.s1,
              transition:"transform .2s ease, box-shadow .2s ease" }}>
            <div style={{ marginBottom:18 }}>
              <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>Spend Distribution</h3>
              <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>Total cost by utility type</p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:24 }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={utilityDistributionData} cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    dataKey="value" startAngle={90} endAngle={-270} paddingAngle={3}>
                    {utilityDistributionData.map((e,i) => <Cell key={i} fill={e.color} stroke="none"/>)}
                  </Pie>
                  <Tooltip formatter={v => [`Rs. ${v.toLocaleString()}`, "Spend"]}
                    contentStyle={{ background:C.card, border:`1px solid ${C.border}`,
                      borderRadius:9, color:C.ink, boxShadow:C.s3, fontFamily:F }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", flexDirection:"column", gap:16, flex:1 }}>
                {utilityDistributionData.map((d,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ width:10, height:10, borderRadius:"50%",
                      background:d.color, flexShrink:0 }}/>
                    <div>
                      <p style={{ fontSize:"0.75rem", color:C.muted, margin:"0 0 2px", fontWeight:500 }}>{d.name}</p>
                      <p style={{ fontSize:"0.9rem", fontWeight:700, color:C.body,
                        margin:0, fontFamily:"monospace" }}>Rs. {d.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* DATA TABLE */}
      <section className="r-fu r-fu4" style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:14, padding:"22px 24px", marginBottom:28, boxShadow:C.s1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          marginBottom:18, flexWrap:"wrap", gap:12 }}>
          <div>
            <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>Detailed Records</h3>
            <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>{filteredData.length} entries found</p>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
            justifyContent:"center", padding:"60px 20px", gap:12, color:C.muted }}>
            <span style={{ fontSize:"2rem" }}>📂</span>
            <p style={{ fontSize:"0.875rem", margin:0 }}>No records match the current filters.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    {[["billingMonth","Month"],["utilityType","Utility"],["unitsUsed","Units Used"],["billAmount","Bill Amount"],["usageChange","Change"]].map(([key,label]) => (
                      <th key={key} className="r-th"
                        onClick={() => handleSort(key)}
                        style={{ padding:"10px 14px", textAlign:"left", fontSize:"0.68rem",
                          fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em",
                          color:C.muted, borderBottom:`1px solid ${C.border}`,
                          cursor:"pointer", userSelect:"none", whiteSpace:"nowrap",
                          transition:"color .15s", fontFamily:F }}>
                        {label}
                        <span style={{ color:C.amber, marginLeft:4 }}>{sortArrow(key)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map(bill => {
                    const m = UTIL_META[bill.utilityType] || UTIL_META.Electricity;
                    const isNetBill = bill.utilityType === "Internet";
                    return (
                      <tr key={bill.id} className="r-tr" style={{ transition:"background .15s" }}>
                        <td style={{ padding:"13px 14px", fontSize:"0.82rem", color:C.body,
                          borderBottom:`1px solid ${C.border}`, verticalAlign:"middle" }}>
                          <span style={{ fontFamily:"monospace", fontSize:"0.78rem", color:C.muted }}>
                            {bill.billingMonth}
                          </span>
                        </td>
                        <td style={{ padding:"13px 14px", fontSize:"0.82rem", color:C.body,
                          borderBottom:`1px solid ${C.border}`, verticalAlign:"middle" }}>
                          <span style={{ display:"inline-flex", alignItems:"center", gap:5,
                            padding:"3px 10px", borderRadius:20, fontSize:"0.75rem", fontWeight:600,
                            background:m.bg, color:m.color }}>
                            {m.icon(11)} {bill.utilityType}
                          </span>
                        </td>
                        <td style={{ padding:"13px 14px", fontSize:"0.82rem", color:C.body,
                          borderBottom:`1px solid ${C.border}`, verticalAlign:"middle" }}>
                          {isNetBill
                            ? <span style={{ fontSize:"0.78rem", color:C.faint, fontStyle:"italic" }}>Flat-rate</span>
                            : <><strong>{bill.unitsUsed}</strong> units</>}
                        </td>
                        <td style={{ padding:"13px 14px", fontSize:"0.82rem",
                          borderBottom:`1px solid ${C.border}`, verticalAlign:"middle",
                          fontFamily:"monospace", color:C.ink, fontWeight:500 }}>
                          Rs. {bill.billAmount.toLocaleString()}
                        </td>
                        <td style={{ padding:"13px 14px", fontSize:"0.82rem",
                          borderBottom:`1px solid ${C.border}`, verticalAlign:"middle" }}>
                          {isNetBill ? (
                            <span style={{ fontSize:"0.75rem", color:C.faint, fontStyle:"italic" }}>—</span>
                          ) : (
                            <span style={{ display:"inline-flex", alignItems:"center", gap:3,
                              padding:"3px 9px", borderRadius:20, fontSize:"0.75rem",
                              fontWeight:600, fontFamily:"monospace",
                              background: bill.usageChange > 0 ? C.redL  : bill.usageChange < 0 ? C.greenL : C.hover,
                              color:      bill.usageChange > 0 ? C.red   : bill.usageChange < 0 ? C.green  : C.muted }}>
                              {bill.usageChange > 0 ? "↑" : bill.usageChange < 0 ? "↓" : "–"} {Math.abs(bill.usageChange)}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
              gap:10, marginTop:18, paddingTop:16, borderTop:`1px solid ${C.border}` }}>
              <button className="r-pageBtn"
                onClick={() => setCurrentPage(p => Math.max(p-1,1))}
                disabled={currentPage===1}
                style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${C.border}`,
                  background:"transparent", color:C.muted, fontFamily:F, fontSize:"0.78rem",
                  cursor:currentPage===1?"not-allowed":"pointer",
                  opacity:currentPage===1?0.3:1, transition:"all .15s" }}>
                ← Prev
              </button>
              <div style={{ display:"flex", gap:4 }}>
                {Array.from({ length:totalPages }).map((_,i) => (
                  <button key={i} className={`r-pageDot${currentPage===i+1?" active":""}`}
                    onClick={() => setCurrentPage(i+1)}
                    style={{ width:30, height:30, borderRadius:7, border:`1px solid ${C.border}`,
                      background: currentPage===i+1 ? C.blueL : "transparent",
                      color:      currentPage===i+1 ? C.blue  : C.muted,
                      borderColor:currentPage===i+1 ? C.blue  : C.border,
                      fontFamily:F, fontSize:"0.78rem", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all .15s" }}>
                    {i+1}
                  </button>
                ))}
              </div>
              <button className="r-pageBtn"
                onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))}
                disabled={currentPage===totalPages}
                style={{ padding:"7px 14px", borderRadius:7, border:`1px solid ${C.border}`,
                  background:"transparent", color:C.muted, fontFamily:F, fontSize:"0.78rem",
                  cursor:currentPage===totalPages?"not-allowed":"pointer",
                  opacity:currentPage===totalPages?0.3:1, transition:"all .15s" }}>
                Next →
              </button>
            </div>
          </>
        )}
      </section>

      {/* INSIGHTS */}
      <section className="r-fu r-fu5" style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:14, padding:"22px 24px", boxShadow:C.s1 }}>
        <div style={{ marginBottom:16 }}>
          <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>AI Insights</h3>
          <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>Automated analysis of your utility patterns</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
          {insights.map((ins,i) => {
            const ic = insightStyle[ins.type] || insightStyle.info;
            return (
              <div key={i} style={{ display:"flex", alignItems:"flex-start", gap:12,
                padding:"13px 16px", borderRadius:10,
                background:ic.bg, border:`1px solid ${ic.bdr}` }}>
                <div style={{ width:22, height:22, borderRadius:"50%", display:"flex",
                  alignItems:"center", justifyContent:"center", flexShrink:0,
                  background:`${ic.accent}22`, color:ic.accent }}>
                  {ic.icon}
                </div>
                <p style={{ margin:0, fontSize:"0.8rem", lineHeight:1.55, color:C.body }}>{ins.text}</p>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};

export default Report;