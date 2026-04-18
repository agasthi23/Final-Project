// src/pages/Report.jsx
import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FiZap, FiDroplet, FiWifi, FiGrid, FiDollarSign, FiTrendingUp,
  FiDownload, FiCheckCircle, FiAlertTriangle, FiInfo,
} from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { reportsAPI } from "../services/api";

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

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";

const getUtilMeta = (C) => ({
  Electricity: { color:C.amber,  bg:C.amberL,  bdr:C.amberM,  chartColor:C.amber,  icon:(s)=><FiZap size={s}/>,     flatRate:false },
  Water:       { color:C.teal,   bg:C.tealL,   bdr:C.tealM,   chartColor:C.teal,   icon:(s)=><FiDroplet size={s}/>, flatRate:false },
  Internet:    { color:C.indigo, bg:C.indigoL, bdr:C.indigoM, chartColor:C.indigo, icon:(s)=><FiWifi size={s}/>,    flatRate:true  },
});

// These are used in the component - keeping them
const UTILITIES = ["Electricity", "Water", "Internet"];
const MONTH_ORDER = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/* ════ CUSTOM TOOLTIP ════ */
const CustomTooltip = ({ active, payload, label, prefix = "", colors }) => {
  if (!active || !payload?.length) return null;
  const C = colors;
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

/* ════ TOGGLE GROUP ════ */
const ToggleGroup = ({ options, value, onChange, colors }) => {
  const C = colors;
  return (
    <div style={{ display:"flex", background:C.card, border:`1px solid ${C.border}`,
      borderRadius:9, padding:3, gap:2 }}>
      {options.map(opt => (
        <button key={opt} className="r-toggle"
          onClick={() => onChange(opt)}
          style={{ padding:"5px 12px", borderRadius:7, border:"none", fontFamily:F,
            fontSize:"0.78rem", fontWeight:600, cursor:"pointer", transition:"all .15s",
            background: value === opt ? C.blueL : "transparent",
            color:       value === opt ? C.blue  : C.muted }}>
          {opt}
        </button>
      ))}
    </div>
  );
};

/* ════ MAIN COMPONENT ════ */
const Report = () => {
  const { darkMode } = useTheme();

  const C = {
    page:    darkMode ? "#0f172a" : "#f3f4f8",
    card:    darkMode ? "#1e293b" : "#ffffff",
    hover:   darkMode ? "#334155" : "#f0f2f7",
    surface2:darkMode ? "#1e293b" : "#f8fafc",
    ink:     darkMode ? "#f1f5f9" : "#0f172a",
    body:    darkMode ? "#cbd5e1" : "#334155",
    muted:   darkMode ? "#94a3b8" : "#64748b",
    faint:   darkMode ? "#64748b" : "#94a3b8",
    border:  darkMode ? "#334155" : "#e2e8f0",
    borderB: darkMode ? "#475569" : "#cbd5e1",
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

  const UTIL_META = getUtilMeta(C);

  // ── State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [utilityFilter, setUtilityFilter] = useState("All");
  const [timeRange, setTimeRange] = useState("Yearly");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  
  // Filter options
  const [filterOptions, setFilterOptions] = useState({
    utilities: ["All", "Electricity", "Water", "Internet"],
    months: [],
    quarters: [],
    years: []
  });
  
  // Data
  const [summaryData, setSummaryData] = useState({
    totalUnits: 0,
    totalAmount: 0,
    avgMonthlyCost: 0,
    peakExpenditure: { month: "N/A", amount: 0, utility: "N/A" }
  });
  const [consumptionData, setConsumptionData] = useState([]);
  const [expensesData, setExpensesData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [recordsData, setRecordsData] = useState({ records: [], pagination: { total: 0, page: 1, pages: 1 } });
  const [insightsData, setInsightsData] = useState([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "month", direction: "descending" });
  const [animatedValues, setAnimatedValues] = useState({ units: 0, amount: 0, avg: 0 });
  const rowsPerPage = 10;

  // Now define isFlat AFTER utilityFilter is declared
  const isFlat = utilityFilter !== "All" && UTIL_META[utilityFilter]?.flatRate;

  // Build query params
  const getQueryParams = useCallback(() => {
    const params = { utility: utilityFilter, timeRange };
    if (timeRange === "Monthly" && selectedMonth) params.month = selectedMonth;
    else if (timeRange === "Quarterly" && selectedQuarter) params.quarter = selectedQuarter;
    else if (timeRange === "Yearly" && selectedYear) params.year = selectedYear;
    return params;
  }, [utilityFilter, timeRange, selectedMonth, selectedQuarter, selectedYear]);

  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = getQueryParams();
    
    try {
      const [summaryRes, consumptionRes, expensesRes, distributionRes, recordsRes, insightsRes] = await Promise.all([
        reportsAPI.getSummary(params),
        reportsAPI.getConsumption({ utility: utilityFilter, year: selectedYear }),
        reportsAPI.getExpenses({ utility: utilityFilter, year: selectedYear }),
        reportsAPI.getDistribution({ year: selectedYear }),
        reportsAPI.getRecords({ ...params, page: currentPage, limit: rowsPerPage, sort: sortConfig.direction === "ascending" ? "asc" : "desc" }),
        reportsAPI.getInsights({ year: selectedYear })
      ]);
      
      if (summaryRes.data?.success) setSummaryData(summaryRes.data.summary);
      if (consumptionRes.data?.success) setConsumptionData(consumptionRes.data.data);
      if (expensesRes.data?.success) setExpensesData(expensesRes.data.data);
      if (distributionRes.data?.success) setDistributionData(distributionRes.data.data);
      if (recordsRes.data?.success) setRecordsData(recordsRes.data);
      if (insightsRes.data?.success) setInsightsData(insightsRes.data.insights);
      
      // Animate KPI values
      const { totalUnits, totalAmount, avgMonthlyCost } = summaryRes.data?.summary || { totalUnits: 0, totalAmount: 0, avgMonthlyCost: 0 };
      const start = Date.now(), duration = 800;
      const tick = () => {
        const elapsed = Date.now() - start, progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        setAnimatedValues({
          units: Math.round(totalUnits * ease),
          amount: Math.round(totalAmount * ease),
          avg: Math.round(avgMonthlyCost * ease)
        });
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      
    } catch (err) {
      console.error("Fetch data error:", err);
      setError("Failed to load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [getQueryParams, utilityFilter, selectedYear, currentPage, sortConfig]);

 // Fetch filter options on mount
useEffect(() => {
  const fetchFilters = async () => {
    try {
      const res = await reportsAPI.getFilters();
      if (res.data?.success) {
        const filters = res.data.filters;
        setFilterOptions({
          // ✅ Force include Internet if missing
          utilities: filters.utilities?.includes("Internet") 
            ? filters.utilities 
            : ["All", "Electricity", "Water", "Internet"],
          months: filters.months || [],
          quarters: filters.quarters || [],
          years: filters.years || []
        });
        if (filters.years?.length) setSelectedYear(filters.years[filters.years.length - 1]);
        if (filters.months?.length) setSelectedMonth(filters.months[filters.months.length - 1]);
        if (filters.quarters?.length) setSelectedQuarter(filters.quarters[filters.quarters.length - 1]);
      }
    } catch (err) {
      console.error("Fetch filters error:", err);
    }
  };
  fetchFilters();
}, []);

  // Fetch data when dependencies change
  useEffect(() => {
    if (selectedYear || selectedMonth || selectedQuarter) {
      fetchAllData();
    }
  }, [fetchAllData, selectedYear, selectedMonth, selectedQuarter, utilityFilter, timeRange, currentPage, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "ascending" ? "descending" : "ascending"
    }));
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const rows = [
      [`Report — ${timeRange === "Monthly" ? selectedMonth : timeRange === "Quarterly" ? selectedQuarter : selectedYear}`],
      [],
      ["Utility Type", "Month", "Units Used", "Bill Amount (Rs.)"],
      ...recordsData.records.map(r => [r.utility, r.month, r.unitsUsed === null ? "Flat-rate" : r.unitsUsed, r.billAmount])
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `utility_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.style.display = "none"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const sortArrow = (key) => sortConfig.key === key ? (sortConfig.direction === "ascending" ? " ↑" : " ↓") : "";

  const insightStyle = {
    success: { bg: C.greenL, bdr: C.greenM, accent: C.green, icon: <FiCheckCircle size={15}/> },
    warning: { bg: C.amberL, bdr: C.amberM, accent: C.amber, icon: <FiAlertTriangle size={15}/> },
    info: { bg: C.blueL, bdr: C.blueM, accent: C.blue, icon: <FiInfo size={15}/> }
  };

  if (loading && !summaryData.totalAmount) {
    return (
      <div style={{ minHeight: "100vh", background: C.page, fontFamily: F, padding: "28px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.muted }}>
          <div style={{ width: 18, height: 18, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}/>
          Loading report data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: "100vh", background: C.page, fontFamily: F, padding: "28px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderRadius: 12, background: C.redL, border: `1px solid ${C.redM}`, color: C.red, fontSize: "0.875rem" }}>
          <FiAlertTriangle size={16}/>
          <div style={{ flex: 1 }}>{error}</div>
          <button onClick={fetchAllData} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.redM}`, background: "transparent", color: C.red, cursor: "pointer" }}>Retry</button>
        </div>
      </div>
    );
  }

  const totalPages = recordsData.pagination?.pages || 1;

  return (
    <div style={{ minHeight: "100vh", background: C.page, fontFamily: F, color: C.ink, padding: "28px 32px 64px", transition: "background 0.3s ease, color 0.3s ease" }}>

      {/* HEADER */}
      <header className="r-fu r-fu1" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${C.border}`, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: C.ink, margin: "0 0 5px", letterSpacing: "-0.03em" }}>Utility Reports</h1>
          <p style={{ fontSize: "0.875rem", color: C.muted, margin: 0 }}>Track, analyze, and optimize your consumption patterns</p>
        </div>
        <button className="r-export" onClick={exportToCSV} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 9, background: C.card, border: `1px solid ${C.borderB}`, color: C.muted, fontFamily: F, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", transition: "all .18s", whiteSpace: "nowrap" }}>
          <FiDownload size={14}/> Export CSV
        </button>
      </header>

      {/* FILTERS */}
      <section className="r-fu r-fu2" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px" }}>
          <label style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, whiteSpace: "nowrap" }}>Utility</label>
          <ToggleGroup options={filterOptions.utilities} value={utilityFilter} onChange={v => { setUtilityFilter(v); setCurrentPage(1); }} colors={C} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px" }}>
          <label style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, whiteSpace: "nowrap" }}>Time Range</label>
          <ToggleGroup options={["Monthly", "Quarterly", "Yearly"]} value={timeRange} onChange={setTimeRange} colors={C} />
        </div>

        {timeRange === "Monthly" && filterOptions.months.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>Month</label>
            <div style={{ position: "relative" }}>
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ background: "transparent", border: "none", color: C.body, fontFamily: F, fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", outline: "none", padding: "2px 20px 2px 4px", appearance: "none" }}>
                {filterOptions.months.map(m => <option key={m}>{m}</option>)}
              </select>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        )}
        {timeRange === "Quarterly" && filterOptions.quarters.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>Quarter</label>
            <div style={{ position: "relative" }}>
              <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)} style={{ background: "transparent", border: "none", color: C.body, fontFamily: F, fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", outline: "none", padding: "2px 20px 2px 4px", appearance: "none" }}>
                {filterOptions.quarters.map(q => <option key={q}>{q}</option>)}
              </select>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        )}
        {timeRange === "Yearly" && filterOptions.years.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px" }}>
            <label style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted }}>Year</label>
            <div style={{ position: "relative" }}>
              <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} style={{ background: "transparent", border: "none", color: C.body, fontFamily: F, fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", outline: "none", padding: "2px 20px 2px 4px", appearance: "none" }}>
                {filterOptions.years.map(y => <option key={y}>{y}</option>)}
              </select>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.faint} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        )}
      </section>

      {/* KPI CARDS */}
      <section className="r-fu r-fu3" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: isFlat ? "Bills Recorded" : "Total Units Consumed", value: isFlat ? `${animatedValues.units} bills` : animatedValues.units.toLocaleString(), sub: utilityFilter === "All" ? "All utilities" : utilityFilter, icon: <FiZap size={18}/>, accent: C.amber, bg: C.amberL, bdr: C.amberM },
          { label: "Total Amount Spent", value: `Rs. ${animatedValues.amount.toLocaleString()}`, sub: `${timeRange} period`, icon: <FiGrid size={18}/>, accent: C.teal, bg: C.tealL, bdr: C.tealM },
          { label: "Avg Monthly Cost", value: `Rs. ${animatedValues.avg.toLocaleString()}`, sub: "Calculated average", icon: <FiDollarSign size={18}/>, accent: C.violet, bg: C.violetL, bdr: C.violetM },
          { label: "Peak Expenditure", value: summaryData.peakExpenditure?.month || "N/A", sub: "Highest spend period", icon: <FiTrendingUp size={18}/>, accent: C.red, bg: C.redL, bdr: C.redM },
        ].map((k, i) => (
          <div key={i} className="r-kpi" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px 22px", display: "flex", gap: 16, alignItems: "flex-start", position: "relative", overflow: "hidden", boxShadow: C.s1, transition: "transform .2s ease, box-shadow .2s ease" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg,${k.accent},transparent)`, borderRadius: "14px 14px 0 0" }}/>
            <div style={{ width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: k.bg, color: k.accent }}>{k.icon}</div>
            <div>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: C.muted, margin: "0 0 5px" }}>{k.label}</p>
              <p style={{ fontSize: "1.35rem", fontWeight: 800, color: C.ink, margin: "0 0 3px", letterSpacing: "-0.02em" }}>{k.value}</p>
              <p style={{ fontSize: "0.7rem", color: C.faint, margin: 0 }}>{k.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CHARTS GRID */}
      <section className="r-fu r-fu4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
        {!isFlat && consumptionData.length > 0 && (
          <div className="r-chart" style={{ gridColumn: "1/-1", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px 18px", boxShadow: C.s1, transition: "transform .2s ease, box-shadow .2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, margin: "0 0 3px" }}>Consumption Over Time</h3>
                <p style={{ fontSize: "0.72rem", color: C.muted, margin: 0 }}>Monthly unit usage across utilities</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {(utilityFilter === "All" || utilityFilter === "Electricity") && <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: C.muted }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: C.amber, display: "inline-block" }}/> Electricity</span>}
                {(utilityFilter === "All" || utilityFilter === "Water") && <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: C.muted }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal, display: "inline-block" }}/> Water</span>}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={consumptionData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rgE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.amber} stopOpacity={0.15}/><stop offset="95%" stopColor={C.amber} stopOpacity={0}/></linearGradient>
                  <linearGradient id="rgW" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.teal} stopOpacity={0.15}/><stop offset="95%" stopColor={C.teal} stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                <XAxis dataKey="month" tick={{ fill: C.faint, fontSize: 11, fontFamily: F }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: C.faint, fontSize: 11, fontFamily: F }} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip colors={C}/>}/>
                {(utilityFilter === "All" || utilityFilter === "Electricity") && <Area type="monotone" dataKey="Electricity" stroke={C.amber} strokeWidth={2} fill="url(#rgE)" dot={false}/>}
                {(utilityFilter === "All" || utilityFilter === "Water") && <Area type="monotone" dataKey="Water" stroke={C.teal} strokeWidth={2} fill="url(#rgW)" dot={false}/>}
                {utilityFilter !== "All" && <Area type="monotone" dataKey="units" name="Units Used" stroke={C.amber} strokeWidth={2} fill="url(#rgE)" dot={false}/>}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="r-chart" style={{ gridColumn: isFlat ? "1/-1" : "auto", background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px 18px", boxShadow: C.s1, transition: "transform .2s ease, box-shadow .2s ease" }}>
          <div style={{ marginBottom: 18 }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, margin: "0 0 3px" }}>Monthly Expenses</h3>
            <p style={{ fontSize: "0.72rem", color: C.muted, margin: 0 }}>Total spend per month (Rs.)</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={expensesData} barSize={22} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
              <XAxis dataKey="month" tick={{ fill: C.faint, fontSize: 11, fontFamily: F }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: C.faint, fontSize: 11, fontFamily: F }} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip prefix="Rs. " colors={C}/>}/>
              {utilityFilter === "All" ? (
                <>
                  <Bar dataKey="Electricity" name="Electricity" stackId="a" fill={C.amber} radius={[0,0,0,0]}/>
                  <Bar dataKey="Water" name="Water" stackId="a" fill={C.teal} radius={[0,0,0,0]}/>
                  <Bar dataKey="Internet" name="Internet" stackId="a" fill={C.indigo} radius={[4,4,0,0]}/>
                </>
              ) : (
                <Bar dataKey="expenses" name="Expenses" fill={UTIL_META[utilityFilter]?.chartColor || C.blue} radius={[4,4,0,0]}/>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {utilityFilter === "All" && distributionData.length > 0 && (
          <div className="r-chart" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px 18px", boxShadow: C.s1, transition: "transform .2s ease, box-shadow .2s ease" }}>
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, margin: "0 0 3px" }}>Spend Distribution</h3>
              <p style={{ fontSize: "0.72rem", color: C.muted, margin: 0 }}>Total cost by utility type</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" startAngle={90} endAngle={-270} paddingAngle={3}>
                    {distributionData.map((e, i) => <Cell key={i} fill={e.color || [C.amber, C.teal, C.indigo][i % 3]} stroke="none"/>)}
                  </Pie>
                  <Tooltip formatter={v => [`Rs. ${v.toLocaleString()}`, "Spend"]} contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 9, color: C.ink, boxShadow: C.s3, fontFamily: F }}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
                {distributionData.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color || [C.amber, C.teal, C.indigo][i % 3], flexShrink: 0 }}/>
                    <div>
                      <p style={{ fontSize: "0.75rem", color: C.muted, margin: "0 0 2px", fontWeight: 500 }}>{d.name}</p>
                      <p style={{ fontSize: "0.9rem", fontWeight: 700, color: C.body, margin: 0, fontFamily: "monospace" }}>Rs. {d.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* DATA TABLE */}
      <section className="r-fu r-fu4" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px", marginBottom: 28, boxShadow: C.s1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, margin: "0 0 3px" }}>Detailed Records</h3>
            <p style={{ fontSize: "0.72rem", color: C.muted, margin: 0 }}>{recordsData.pagination?.total || 0} entries found</p>
          </div>
        </div>

        {recordsData.records.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 12, color: C.muted }}>
            <span style={{ fontSize: "2rem" }}>📂</span>
            <p style={{ fontSize: "0.875rem", margin: 0 }}>No records match the current filters.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {[["month", "Month"], ["utility", "Utility"], ["unitsUsed", "Units Used"], ["billAmount", "Bill Amount"], ["change", "Change"]].map(([key, label]) => (
                      <th key={key} className="r-th" onClick={() => handleSort(key)} style={{ padding: "10px 14px", textAlign: "left", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, borderBottom: `1px solid ${C.border}`, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", transition: "color .15s", fontFamily: F }}>
                        {label}
                        <span style={{ color: C.amber, marginLeft: 4 }}>{sortArrow(key)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recordsData.records.map((record, idx) => {
                    const isNetBill = record.utility === "Internet";
                    const m = UTIL_META[record.utility] || UTIL_META.Electricity;
                    return (
                      <tr key={idx} className="r-tr" style={{ transition: "background .15s", borderBottom: `1px solid ${C.border}` }}>
                        <td style={{ padding: "13px 14px", fontSize: "0.82rem", color: C.body, verticalAlign: "middle" }}>
                          <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: C.muted }}>{record.month}</span>
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: "0.82rem", color: C.body, verticalAlign: "middle" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, background: m.bg, color: m.color }}>
                            {m.icon(11)} {record.utility}
                          </span>
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: "0.82rem", color: C.body, verticalAlign: "middle" }}>
                          {isNetBill ? <span style={{ fontSize: "0.78rem", color: C.faint, fontStyle: "italic" }}>Flat-rate</span> : <><strong>{record.unitsUsed}</strong> units</>}
                        </td>
                        <td style={{ padding: "13px 14px", fontSize: "0.82rem", verticalAlign: "middle", fontFamily: "monospace", color: C.ink, fontWeight: 500 }}>Rs. {record.billAmount.toLocaleString()}</td>
                        <td style={{ padding: "13px 14px", fontSize: "0.82rem", verticalAlign: "middle" }}>
                          {isNetBill ? <span style={{ fontSize: "0.75rem", color: C.faint, fontStyle: "italic" }}>—</span> : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 9px", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600, fontFamily: "monospace", background: parseFloat(record.change) > 0 ? C.redL : parseFloat(record.change) < 0 ? C.greenL : C.hover, color: parseFloat(record.change) > 0 ? C.red : parseFloat(record.change) < 0 ? C.green : C.muted }}>
                              {parseFloat(record.change) > 0 ? "↑" : parseFloat(record.change) < 0 ? "↓" : "–"} {Math.abs(parseFloat(record.change))}%
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
                <button className="r-pageBtn" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: F, fontSize: "0.78rem", cursor: currentPage === 1 ? "not-allowed" : "pointer", opacity: currentPage === 1 ? 0.3 : 1, transition: "all .15s" }}>← Prev</button>
                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button key={i} className="r-pageDot" onClick={() => setCurrentPage(i + 1)} style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${C.border}`, background: currentPage === i + 1 ? C.blueL : "transparent", color: currentPage === i + 1 ? C.blue : C.muted, borderColor: currentPage === i + 1 ? C.blue : C.border, fontFamily: F, fontSize: "0.78rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button className="r-pageBtn" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, fontFamily: F, fontSize: "0.78rem", cursor: currentPage === totalPages ? "not-allowed" : "pointer", opacity: currentPage === totalPages ? 0.3 : 1, transition: "all .15s" }}>Next →</button>
              </div>
            )}
          </>
        )}
      </section>

      {/* INSIGHTS */}
      <section className="r-fu r-fu5" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "22px 24px", boxShadow: C.s1 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, margin: "0 0 3px" }}>AI Insights</h3>
          <p style={{ fontSize: "0.72rem", color: C.muted, margin: 0 }}>Automated analysis of your utility patterns</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
          {insightsData.map((ins, i) => {
            const ic = insightStyle[ins.type] || insightStyle.info;
            return (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 16px", borderRadius: 10, background: ic.bg, border: `1px solid ${ic.bdr}` }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${ic.accent}22`, color: ic.accent }}>{ic.icon}</div>
                <p style={{ margin: 0, fontSize: "0.8rem", lineHeight: 1.55, color: C.body }}>{ins.text}</p>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
};

export default Report;