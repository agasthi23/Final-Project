// src/pages/Analytics.jsx
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line,
} from "recharts";
import {
  FiBarChart2, FiTrendingUp, FiDollarSign, FiZap, FiDroplet, FiWifi,
  FiAlertTriangle, FiCheckCircle, FiActivity, FiDownload,
  FiInfo, FiTarget, FiCpu,
} from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";
import { billsAPI } from "../services/api";

/* ─── Font ─── */
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

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";
const MONTHS_ORDER = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const UTILITIES = ["Electricity", "Water", "Internet"];

/* ════ HELPERS ════ */
const exportToCSV = (data, filename) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows    = data.map(r => Object.values(r).join(",")).join("\n");
  const blob    = new Blob([`${headers}\n${rows}`], { type:"text/csv" });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement("a");
  a.href=url; a.download=filename; a.click();
  URL.revokeObjectURL(url);
};

/* ════ MAIN COMPONENT ════ */
const Analytics = () => {
  const { darkMode } = useTheme();

  // ⭐ C is memoized to prevent dependency changes in child hooks
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
  }), [darkMode]);

  // Utility meta (memoized to prevent dependency array issues in child useMemo hooks)
  const UTIL_META = useMemo(() => ({
    Electricity: { color:C.blue,   bg:C.blueL,   bdr:C.blueM,   icon:(s)=><FiZap size={s}/>,     flatRate:false },
    Water:       { color:C.teal,   bg:C.tealL,   bdr:C.tealM,   icon:(s)=><FiDroplet size={s}/>, flatRate:false },
    Internet:    { color:C.indigo, bg:C.indigoL, bdr:C.indigoM, icon:(s)=><FiWifi size={s}/>,    flatRate:true  },
  }), [C]);

  // ── State ──
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [analysisView, setAnalysisView] = useState("overview");
  const [billsData, setBillsData] = useState([]);

  const isFlat = filter !== "All" && UTIL_META[filter]?.flatRate;

  // Fetch bills from API
  const fetchBills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await billsAPI.getAll();
      let bills = res.data || [];
      if (Array.isArray(res.data?.bills)) bills = res.data.bills;
      if (Array.isArray(res.data?.data)) bills = res.data.data;
      
      // Transform bills to match expected format with month abbreviation
      const transformedBills = bills.map(bill => ({
        ...bill,
        billingMonth: bill.billingMonth ? new Date(bill.billingMonth).toLocaleDateString("en-US", { month: "short" }) : bill.billingMonth,
      }));
      
      setBillsData(transformedBills);
    } catch (err) {
      console.error("Fetch bills error:", err);
      setError("Failed to load analytics data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  /* ── Filtered data ── */
  const filteredData = useMemo(() =>
    filter === "All" ? billsData : billsData.filter(b => b.utilityType === filter),
  [billsData, filter]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    if (!filteredData.length) {
      return {
        totalBills: 0,
        totalUnits: 0,
        totalAmount: 0,
        avgUsage: 0,
        costPerUnit: "N/A",
        peakUsage: 0,
        peakMonth: "N/A",
      };
    }
    const totalBills = filteredData.length;
    const totalAmount = filteredData.reduce((s, b) => s + b.billAmount, 0);
    const meteredRows = isFlat ? [] : filteredData.filter(b => !UTIL_META[b.utilityType]?.flatRate);
    const totalUnits = meteredRows.reduce((s, b) => s + (b.unitsUsed || 0), 0);
    const avgUsage = meteredRows.length ? Math.round(totalUnits / meteredRows.length) : 0;
    const costPerUnit = totalUnits ? (meteredRows.reduce((s, b) => s + b.billAmount, 0) / totalUnits).toFixed(2) : "N/A";
    const peak = meteredRows.length
      ? meteredRows.reduce((mx, b) => (b.unitsUsed || 0) > (mx.unitsUsed || 0) ? b : mx, meteredRows[0])
      : filteredData.reduce((mx, b) => b.billAmount > mx.billAmount ? b : mx, filteredData[0] || {});
    return {
      totalBills,
      totalUnits,
      totalAmount,
      avgUsage,
      costPerUnit,
      peakUsage: isFlat ? `Rs. ${(peak.billAmount || 0).toLocaleString()}` : (peak.unitsUsed || 0),
      peakMonth: peak.billingMonth || "N/A",
    };
  }, [filteredData, isFlat, UTIL_META]);

  /* ── Monthly usage chart ── */
  const monthlyUsageData = useMemo(() => {
    const map = {};
    filteredData.forEach(b => {
      if (UTIL_META[b.utilityType]?.flatRate) return;
      if (!map[b.billingMonth]) map[b.billingMonth] = { month: b.billingMonth };
      map[b.billingMonth][b.utilityType] = b.unitsUsed;
      map[b.billingMonth][`${b.utilityType}Cost`] = b.billAmount;
    });
    return Object.values(map).sort((a, b) => MONTHS_ORDER.indexOf(a.month) - MONTHS_ORDER.indexOf(b.month));
  }, [filteredData, UTIL_META]);

  /* ── Monthly cost chart ── */
  const monthlyCostData = useMemo(() => {
    const map = {};
    filteredData.forEach(b => {
      if (!map[b.billingMonth]) map[b.billingMonth] = { month: b.billingMonth, total: 0 };
      map[b.billingMonth][b.utilityType] = b.billAmount;
      map[b.billingMonth].total += b.billAmount;
    });
    return Object.values(map).sort((a, b) => MONTHS_ORDER.indexOf(a.month) - MONTHS_ORDER.indexOf(b.month));
  }, [filteredData]);

  /* ── Pie distribution ── */
  const distributionData = useMemo(() => {
    const dist = {};
    filteredData.forEach(b => {
      if (!dist[b.utilityType]) dist[b.utilityType] = { units: 0, cost: 0 };
      dist[b.utilityType].units += b.unitsUsed || 0;
      dist[b.utilityType].cost += b.billAmount;
    });
    const totalCost = Object.values(dist).reduce((s, d) => s + d.cost, 0);
    return Object.entries(dist).map(([name, d]) => ({
      name,
      value: d.cost,
      units: d.units,
      percentage: Math.round((d.cost / totalCost) * 100),
      color: UTIL_META[name]?.color || C.blue,
    }));
  }, [filteredData, UTIL_META, C]);

  /* ── Efficiency data ── */
  const efficiencyData = useMemo(() => {
    const map = {};
    filteredData.forEach(b => {
      if (UTIL_META[b.utilityType]?.flatRate) return;
      if (!map[b.billingMonth]) map[b.billingMonth] = { month: b.billingMonth, units: 0, cost: 0 };
      map[b.billingMonth].units += b.unitsUsed || 0;
      map[b.billingMonth].cost += b.billAmount;
    });
    return Object.values(map).sort((a, b) => MONTHS_ORDER.indexOf(a.month) - MONTHS_ORDER.indexOf(b.month)).map(m => ({
      month: m.month,
      "Cost/Unit": +(m.cost / m.units).toFixed(2),
    }));
  }, [filteredData, UTIL_META]);

  /* ── Comparison data ── */
  const comparisonData = useMemo(() => {
    const map = {};
    filteredData.forEach(b => {
      if (UTIL_META[b.utilityType]?.flatRate) return;
      if (!map[b.billingMonth]) map[b.billingMonth] = { month: b.billingMonth, Electricity: 0, Water: 0 };
      map[b.billingMonth][b.utilityType] = b.unitsUsed;
    });
    const rows = Object.values(map).sort((a, b) => MONTHS_ORDER.indexOf(a.month) - MONTHS_ORDER.indexOf(b.month));
    const avg = rows.reduce((s, r) => s + (r.Electricity || 0) + (r.Water || 0), 0) / (rows.length || 1);
    return rows.map(r => ({ ...r, Average: Math.round(avg) }));
  }, [filteredData, UTIL_META]);

  /* ── Radar data (using all bills, not filtered) ── */
  const radarData = useMemo(() => {
    const elec = billsData.filter(b => b.utilityType === "Electricity");
    const watr = billsData.filter(b => b.utilityType === "Water");
    const net = billsData.filter(b => b.utilityType === "Internet");
    
    const score = (val, min, max) => Math.round(100 - ((val - min) / (max - min)) * 50);
    const eCPU = elec.reduce((s, b) => s + b.billAmount / b.unitsUsed, 0) / elec.length;
    const wCPU = watr.reduce((s, b) => s + b.billAmount / b.unitsUsed, 0) / watr.length;
    const eU = elec.map(b => b.unitsUsed);
    const wU = watr.map(b => b.unitsUsed);
    const variance = arr => {
      const m = arr.reduce((a, b) => a + b, 0) / arr.length;
      return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
    };
    const ePeak = Math.max(...eU);
    const wPeak = Math.max(...wU);
    const eAvg = eU.reduce((a, b) => a + b, 0) / eU.length;
    const wAvg = wU.reduce((a, b) => a + b, 0) / wU.length;
    const eTrend = eU[eU.length - 1] < eU[0] ? 85 : 60;
    const wTrend = wU[wU.length - 1] < wU[0] ? 85 : 65;
    const eBudget = elec.filter(b => b.billAmount < 5000).length / elec.length * 100;
    const wBudget = watr.filter(b => b.billAmount < 950).length / watr.length * 100;
    const nAmts = net.map(b => b.billAmount);
    const nVar = variance(nAmts);
    const nConsistency = Math.max(50, 100 - Math.round(nVar / 10000));
    const nBudget = net.filter(b => b.billAmount <= 4200).length / net.length * 100;
    
    return [
      { metric: "Efficiency", Electricity: score(eCPU, 12, 18), Water: score(wCPU, 18, 22), Internet: nConsistency },
      { metric: "Cost Control", Electricity: Math.round(eBudget), Water: Math.round(wBudget), Internet: Math.round(nBudget) },
      { metric: "Usage Stability", Electricity: Math.max(30, 100 - Math.round(variance(eU) / 100)), Water: Math.max(30, 100 - Math.round(variance(wU) * 10)), Internet: nConsistency },
      { metric: "Peak Management", Electricity: Math.round((1 - (ePeak - eAvg) / eAvg) * 100), Water: Math.round((1 - (wPeak - wAvg) / wAvg) * 100), Internet: nConsistency },
      { metric: "Trend", Electricity: eTrend, Water: wTrend, Internet: nAmts[nAmts.length - 1] <= nAmts[0] ? 85 : 65 },
      { metric: "Budget Adherence", Electricity: Math.round(eBudget * 0.9), Water: Math.round(wBudget * 0.95), Internet: Math.round(nBudget * 0.97) },
    ];
  }, [billsData]);

  /* ── Insights ── */
  const insights = useMemo(() => {
    const result = [];
    if (!filteredData.length) return result;
    
    const recent = filteredData.slice(-4), older = filteredData.slice(-8, -4);
    const rAvg = recent.reduce((s, b) => s + b.billAmount, 0) / (recent.length || 1);
    const oAvg = older.reduce((s, b) => s + b.billAmount, 0) / (older.length || 1);
    const trend = rAvg > oAvg ? "increasing" : "decreasing";
    const pct = Math.abs(Math.round(((rAvg - oAvg) / (oAvg || 1)) * 100));
    result.push({
      type: trend === "increasing" ? "warning" : "success",
      icon: <FiTrendingUp size={15}/>,
      title: "Spend Trend Analysis",
      text: `Total spend is ${trend} by ${pct}% vs the previous period.`,
      value: "Strategic planning needed"
    });

    if (!isFlat) {
      const highCost = filteredData.filter(b => !UTIL_META[b.utilityType]?.flatRate && b.billAmount / b.unitsUsed > 15);
      if (highCost.length) {
        result.push({
          type: "warning",
          icon: <FiDollarSign size={15}/>,
          title: "Cost Efficiency Alert",
          text: `${highCost.length} period(s) show elevated cost per unit (> Rs. 15). Review pricing tiers.`,
          value: "Optimisation opportunity"
        });
      }
    }

    const peakB = filteredData.reduce((mx, b) => b.billAmount > mx.billAmount ? b : mx, filteredData[0]);
    result.push({
      type: "info",
      icon: <FiActivity size={15}/>,
      title: "Peak Expenditure",
      text: `Highest bill: Rs. ${peakB.billAmount?.toLocaleString()} (${peakB.utilityType}) in ${peakB.billingMonth}.`,
      value: "Capacity planning"
    });

    const waterRows = filteredData.filter(b => b.utilityType === "Water").slice(-3);
    if (waterRows.length) {
      const avgW = waterRows.reduce((s, b) => s + b.unitsUsed, 0) / waterRows.length;
      if (avgW > 44) {
        result.push({
          type: "warning",
          icon: <FiAlertTriangle size={15}/>,
          title: "Water Conservation Alert",
          text: `Avg water usage is elevated at ${Math.round(avgW)} units. Consider conservation measures.`,
          value: "Sustainability target"
        });
      }
    }

    const netRows = filteredData.filter(b => b.utilityType === "Internet");
    if (netRows.length >= 2) {
      const changed = netRows.some((b, i) => i > 0 && b.billAmount !== netRows[i - 1].billAmount);
      result.push({
        type: changed ? "warning" : "success",
        icon: <FiWifi size={15}/>,
        title: "Internet Plan Status",
        text: changed
          ? `Internet charges varied — a possible plan upgrade detected. Latest: Rs. ${netRows[netRows.length - 1]?.billAmount?.toLocaleString()}.`
          : `Internet plan is stable at Rs. ${netRows[0]?.billAmount?.toLocaleString()}/month.`,
        value: changed ? "Review plan options" : "Consistent spend"
      });
    }

    const elecCost = filteredData.filter(b => b.utilityType === "Electricity").reduce((s, b) => s + b.billAmount, 0);
    if (elecCost) {
      result.push({
        type: "success",
        icon: <FiCheckCircle size={15}/>,
        title: "Savings Potential",
        text: `Estimated Rs. ${Math.round(elecCost * 0.1).toLocaleString()} monthly savings through electricity optimisation.`,
        value: "ROI: 3–6 months"
      });
    }

    return result;
  }, [filteredData, isFlat, UTIL_META]);

  const recommendations = [
    { icon: <FiCpu size={16}/>, title: "Temperature Optimisation", desc: "Smart thermostat controls with 2°C adjustment to reduce HVAC load.", savings: "Rs. 450/mo", roi: "4 months", impl: "2 weeks" },
    { icon: <FiTrendingUp size={16}/>, title: "Time-of-Use Scheduling", desc: "Shift 30% of consumption to off-peak hours via automated scheduling.", savings: "Rs. 320/mo", roi: "3 months", impl: "1 week" },
    { icon: <FiDroplet size={16}/>, title: "Water Conservation", desc: "Low-flow fixtures and real-time leak detection monitoring system.", savings: "Rs. 200/mo", roi: "6 months", impl: "3 weeks" },
    { icon: <FiWifi size={16}/>, title: "Internet Plan Review", desc: "Compare available ISP plans. A bundle or downgrade could cut monthly costs significantly.", savings: "Rs. 500/mo", roi: "1 month", impl: "1 week" },
    { icon: <FiActivity size={16}/>, title: "Preventive Maintenance", desc: "Scheduled equipment servicing to optimise efficiency and extend asset life.", savings: "Rs. 280/mo", roi: "5 months", impl: "Ongoing" },
  ];

  const iColor = {
    warning: { accent: C.amber, bg: C.amberL, bdr: C.amberM },
    success: { accent: C.green, bg: C.greenL, bdr: C.greenM },
    info: { accent: C.blue, bg: C.blueL, bdr: C.blueM },
  };

  // Shared components that need C
  const SectionLabel = ({ children }) => (
    <p style={{
      fontSize: "0.63rem", fontWeight: 800, letterSpacing: "0.15em",
      textTransform: "uppercase", color: C.faint, margin: "0 0 12px", fontFamily: F
    }}>
      {children}
    </p>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: "10px 14px", boxShadow: C.s3, fontFamily: F, minWidth: 150 }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 700, color: C.muted, margin: "0 0 7px",
          textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</p>
        {payload.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color, display: "inline-block" }}/>
            <span style={{ fontSize: "0.75rem", color: C.muted, flex: 1 }}>{p.name}</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: C.ink }}>
              {p.name?.toLowerCase().includes("cost") || p.name === "Internet"
                ? `Rs. ${Number(p.value).toLocaleString()}` : p.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const ExportBtn = ({ onClick }) => (
    <button className="an-export" onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
        borderRadius: 8, border: `1px solid ${C.border}`, background: C.card,
        color: C.muted, fontFamily: F, fontSize: "0.75rem", fontWeight: 600,
        cursor: "pointer", transition: "all .18s", whiteSpace: "nowrap", flexShrink: 0 }}>
      <FiDownload size={12}/> Export CSV
    </button>
  );

  const ChartCard = ({ children, style = {}, cls = "" }) => (
    <div className={`an-card ${cls}`}
      style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`,
        boxShadow: C.s1, overflow: "hidden",
        transition: "transform .22s ease, box-shadow .22s ease", ...style }}>
      {children}
    </div>
  );

  const ChartHead = ({ title, sub, action }) => (
    <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between",
      alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
      <div>
        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, margin: "0 0 2px" }}>{title}</h3>
        {sub && <p style={{ fontSize: "0.72rem", color: C.muted, margin: 0 }}>{sub}</p>}
      </div>
      {action}
    </div>
  );

  const ax = { fill: C.faint, fontSize: 11, fontFamily: F };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.page, fontFamily: F, padding: "28px 32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: C.muted }}>
          <div style={{ width: 18, height: 18, border: `2px solid ${C.border}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin 0.7s linear infinite" }}/>
          Loading analytics data...
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
          <button onClick={fetchBills} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${C.redM}`, background: "transparent", color: C.red, cursor: "pointer" }}>Retry</button>
        </div>
      </div>
    );
  }

  /* ── VIEW RENDERERS (keep the same as original) ── */
  const renderOverview = () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 20, marginBottom: 28 }}>
      {!isFlat ? (
        <ChartCard cls="an-fu an-fu1" style={{ gridColumn: "1/-1" }}>
          <ChartHead title="Consumption Trend" sub="Monthly unit usage (metered utilities)"
            action={<ExportBtn onClick={() => exportToCSV(filteredData, "consumption.csv")}/>}/>
          <div style={{ padding: "0 8px 20px" }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyUsageData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.blue} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={C.blue} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gW" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.teal} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Legend wrapperStyle={{ fontSize: "0.75rem", fontFamily: F, paddingTop: 8 }}/>
                {(filter === "All" || filter === "Electricity") &&
                  <Area type="monotone" dataKey="Electricity" stroke={C.blue} strokeWidth={2.5}
                    fill="url(#gE)" dot={{ fill: C.blue, r: 4 }} activeDot={{ r: 6 }}/>}
                {(filter === "All" || filter === "Water") &&
                  <Area type="monotone" dataKey="Water" stroke={C.teal} strokeWidth={2.5}
                    fill="url(#gW)" dot={{ fill: C.teal, r: 4 }} activeDot={{ r: 6 }}/>}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      ) : (
        <ChartCard cls="an-fu an-fu1" style={{ gridColumn: "1/-1" }}>
          <ChartHead title="Monthly Internet Bill Trend" sub="Flat-rate plan charges over time"
            action={<ExportBtn onClick={() => exportToCSV(filteredData, "internet-cost.csv")}/>}/>
          <div style={{ padding: "0 8px 20px" }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyCostData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.indigo} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={C.indigo} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Area type="monotone" dataKey="Internet" stroke={C.indigo} strokeWidth={2.5}
                  fill="url(#gI)" dot={{ fill: C.indigo, r: 4 }} activeDot={{ r: 6 }}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <ChartCard cls="an-fu an-fu2">
        <ChartHead title="Cost Allocation" sub="Budget distribution by utility (Rs.)"/>
        <div style={{ padding: "0 20px 20px" }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={distributionData} cx="50%" cy="50%" innerRadius={55} outerRadius={88}
                paddingAngle={4} dataKey="value">
                {distributionData.map((e, i) => <Cell key={i} fill={e.color}/>)}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: F, borderRadius: 10, border: `1px solid ${C.border}`, boxShadow: C.s3 }}
                formatter={v => [`Rs. ${v.toLocaleString()}`, "Spend"]}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: 10,
            paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            {distributionData.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: e.color, flexShrink: 0 }}/>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: C.body }}>{e.name}</span>
                  <span style={{ fontSize: "0.72rem", color: C.faint, marginLeft: 8 }}>
                    {UTIL_META[e.name]?.flatRate ? "Flat-rate" : `${e.units} units`} · {e.percentage}% · Rs. {e.value.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ChartCard>

      {!isFlat ? (
        <ChartCard cls="an-fu an-fu3">
          <ChartHead title="Cost per Unit" sub="Monthly unit cost efficiency"/>
          <div style={{ padding: "0 8px 20px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={efficiencyData} barSize={28}>
                <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="Cost/Unit" fill={C.violet} radius={[6, 6, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      ) : (
        <ChartCard cls="an-fu an-fu3">
          <ChartHead title="Monthly Spend Breakdown" sub="Total bill amount per month"/>
          <div style={{ padding: "0 8px 20px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyCostData} barSize={28}>
                <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="Internet" fill={C.indigo} radius={[6, 6, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}
    </div>
  );

  const renderTrends = () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 28 }}>
      <ChartCard cls="an-fu an-fu1">
        <ChartHead title="Monthly Cost Trend" sub="Bill amount over time per utility"
          action={<ExportBtn onClick={() => exportToCSV(filteredData, "trends.csv")}/>}/>
        <div style={{ padding: "0 8px 20px" }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyCostData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip />}/>
              <Legend wrapperStyle={{ fontSize: "0.75rem", fontFamily: F, paddingTop: 8 }}/>
              {(filter === "All" || filter === "Electricity") &&
                <Line type="monotone" dataKey="Electricity" stroke={C.blue} strokeWidth={2.5}
                  dot={{ r: 5, fill: C.blue }} activeDot={{ r: 7 }}/>}
              {(filter === "All" || filter === "Water") &&
                <Line type="monotone" dataKey="Water" stroke={C.teal} strokeWidth={2.5}
                  dot={{ r: 5, fill: C.teal }} activeDot={{ r: 7 }}/>}
              {(filter === "All" || filter === "Internet") &&
                <Line type="monotone" dataKey="Internet" stroke={C.indigo} strokeWidth={2.5}
                  strokeDasharray="6 3"
                  dot={{ r: 5, fill: C.indigo }} activeDot={{ r: 7 }}/>}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {!isFlat && (
        <ChartCard cls="an-fu an-fu2">
          <ChartHead title="Usage vs Cost Correlation" sub="Comparing consumption units against billing amounts"/>
          <div style={{ padding: "0 8px 20px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyUsageData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Legend wrapperStyle={{ fontSize: "0.75rem", fontFamily: F, paddingTop: 8 }}/>
                {(filter === "All" || filter === "Electricity") &&
                  <Bar dataKey="Electricity" fill={C.blue} radius={[4, 4, 0, 0]} barSize={20}/>}
                {(filter === "All" || filter === "Water") &&
                  <Bar dataKey="Water" fill={C.teal} radius={[4, 4, 0, 0]} barSize={20}/>}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      {isFlat && (
        <ChartCard cls="an-fu an-fu2">
          <div style={{ padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: C.indigoL,
              border: `1px solid ${C.indigoM}`, display: "flex", alignItems: "center",
              justifyContent: "center", color: C.indigo, flexShrink: 0 }}>
              <FiInfo size={16}/>
            </div>
            <div>
              <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>
                No Unit Consumption Data
              </h4>
              <p style={{ fontSize: "0.8rem", color: C.muted, margin: 0, lineHeight: 1.6 }}>
                Internet is billed at a flat rate — there are no units to track. The cost trend chart above shows
                your plan charges over time. Switch to "All" to compare against metered utilities.
              </p>
            </div>
          </div>
        </ChartCard>
      )}
    </div>
  );

  const renderEfficiency = () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 28 }}>
      <ChartCard cls="an-fu an-fu1">
        <ChartHead title="Performance Assessment Matrix"
          sub="Scores calculated from billing data — Internet uses plan consistency metrics"
          action={
            <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px",
              background: C.greenL, border: `1px solid ${C.greenM}`, borderRadius: 20,
              fontSize: "0.7rem", fontWeight: 600, color: C.green, flexShrink: 0 }}>
              <FiInfo size={11}/> Scores derived from real consumption & cost metrics
            </span>
          }/>
        <div style={{ padding: "0 8px 20px" }}>
          <ResponsiveContainer width="100%" height={340}>
            <RadarChart data={radarData}>
              <PolarGrid stroke={C.border}/>
              <PolarAngleAxis dataKey="metric" tick={{ fill: C.muted, fontSize: 12, fontFamily: F }}/>
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: C.faint, fontSize: 10 }}/>
              {(filter === "All" || filter === "Electricity") &&
                <Radar name="Electricity" dataKey="Electricity"
                  stroke={C.blue} fill={C.blue} fillOpacity={0.2} strokeWidth={2}/>}
              {(filter === "All" || filter === "Water") &&
                <Radar name="Water" dataKey="Water"
                  stroke={C.teal} fill={C.teal} fillOpacity={0.2} strokeWidth={2}/>}
              {(filter === "All" || filter === "Internet") &&
                <Radar name="Internet" dataKey="Internet"
                  stroke={C.indigo} fill={C.indigo} fillOpacity={0.15} strokeWidth={2}/>}
              <Legend wrapperStyle={{ fontSize: "0.75rem", fontFamily: F }}/>
              <Tooltip contentStyle={{ fontFamily: F, borderRadius: 10, border: `1px solid ${C.border}` }}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {!isFlat && (
        <ChartCard cls="an-fu an-fu2">
          <ChartHead title="Unit Cost Efficiency by Month" sub="Rs. per unit consumed — lower is better"
            action={<ExportBtn onClick={() => exportToCSV(efficiencyData, "efficiency.csv")}/>}/>
          <div style={{ padding: "0 8px 12px" }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={efficiencyData} barSize={32}>
                <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="Cost/Unit" radius={[6, 6, 0, 0]}>
                  {efficiencyData.map((e, i) =>
                    <Cell key={i} fill={e["Cost/Unit"] > 15 ? C.red : C.violet}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ margin: "0 20px 20px", padding: "10px 14px", background: C.amberL,
            border: `1px solid ${C.amberM}`, borderRadius: 9, display: "flex", gap: 8 }}>
            <FiInfo size={13} color={C.amber} style={{ marginTop: 1, flexShrink: 0 }}/>
            <p style={{ fontSize: "0.72rem", color: C.body, margin: 0, lineHeight: 1.55 }}>
              <strong>Red bars</strong> indicate months where cost exceeded Rs. 15/unit — review pricing tiers.
            </p>
          </div>
        </ChartCard>
      )}

      {isFlat && (
        <ChartCard cls="an-fu an-fu2">
          <ChartHead title="Plan Charge Consistency" sub="Monthly Internet bill vs plan average"/>
          <div style={{ padding: "0 8px 20px" }}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyCostData} barSize={32}>
                <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="Internet" radius={[6, 6, 0, 0]}>
                  {monthlyCostData.map((e, i) => {
                    const avg = monthlyCostData.reduce((s, r) => s + (r.Internet || 0), 0) / monthlyCostData.length;
                    return <Cell key={i} fill={(e.Internet || 0) > avg ? C.red : C.indigo}/>;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ margin: "0 20px 20px", padding: "10px 14px", background: C.indigoL,
            border: `1px solid ${C.indigoM}`, borderRadius: 9, display: "flex", gap: 8 }}>
            <FiInfo size={13} color={C.indigo} style={{ marginTop: 1, flexShrink: 0 }}/>
            <p style={{ fontSize: "0.72rem", color: C.body, margin: 0, lineHeight: 1.55 }}>
              <strong>Red bars</strong> are months where the charge was above your period average — possible plan upgrade.
            </p>
          </div>
        </ChartCard>
      )}
    </div>
  );

  const renderComparison = () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginBottom: 28 }}>
      {!isFlat && (
        <ChartCard cls="an-fu an-fu1">
          <ChartHead title="Period-over-Period Benchmarking" sub="Monthly usage vs overall average baseline"
            action={<ExportBtn onClick={() => exportToCSV(filteredData, "comparison.csv")}/>}/>
          <div style={{ padding: "0 8px 20px" }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparisonData} barGap={4}>
                <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Legend wrapperStyle={{ fontSize: "0.75rem", fontFamily: F, paddingTop: 8 }}/>
                {(filter === "All" || filter === "Electricity") &&
                  <Bar dataKey="Electricity" fill={C.blue} radius={[4, 4, 0, 0]} barSize={18}/>}
                {(filter === "All" || filter === "Water") &&
                  <Bar dataKey="Water" fill={C.teal} radius={[4, 4, 0, 0]} barSize={18}/>}
                <Bar dataKey="Average" fill={C.amber} radius={[4, 4, 0, 0]} barSize={18}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      )}

      <ChartCard cls="an-fu an-fu2">
        <ChartHead title="Monthly Cost Breakdown" sub="Total bill amount stacked by utility type"/>
        <div style={{ padding: "0 8px 20px" }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyCostData} barSize={32}>
              <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip />}/>
              <Legend wrapperStyle={{ fontSize: "0.75rem", fontFamily: F, paddingTop: 8 }}/>
              {(filter === "All" || filter === "Electricity") &&
                <Bar dataKey="Electricity" stackId="a" fill={C.blue}/>}
              {(filter === "All" || filter === "Water") &&
                <Bar dataKey="Water" stackId="a" fill={C.teal}/>}
              {(filter === "All" || filter === "Internet") &&
                <Bar dataKey="Internet" stackId="a" fill={C.indigo} radius={filter === "All" ? [4, 4, 0, 0] : undefined}/>}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>
    </div>
  );

  const views = { overview: renderOverview, trends: renderTrends, efficiency: renderEfficiency, comparison: renderComparison };

  return (
    <div style={{ minHeight: "100vh", background: C.page, fontFamily: F,
      color: C.ink, padding: "28px 32px 64px", transition: "background 0.3s ease, color 0.3s ease" }}>

      {/* HEADER */}
      <div className="an-fu an-fu1" style={{ display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: C.ink, margin: 0, letterSpacing: "-0.03em" }}>
            Analytics Dashboard
          </h1>
          <p style={{ fontSize: "0.85rem", color: C.muted, margin: "6px 0 0" }}>
            Data-driven insights for utility optimisation and cost management
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: 3, gap: 2 }}>
            {["All", ...UTILITIES].map(f => {
              const m = UTIL_META[f];
              const active = filter === f;
              const activeBg = f === "All" ? "#0f172a" : m.color;
              return (
                <button key={f} className="an-fbtn" onClick={() => setFilter(f)}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 13px",
                    borderRadius: 8, border: "none", fontFamily: F, fontSize: "0.78rem", fontWeight: 600,
                    cursor: "pointer", transition: "all .15s",
                    background: active ? activeBg : "transparent",
                    color: active ? "#fff" : C.muted,
                    boxShadow: active ? C.s1 : "none" }}>
                  {f === "Electricity" && <FiZap size={11}/>}
                  {f === "Water" && <FiDroplet size={11}/>}
                  {f === "Internet" && <FiWifi size={11}/>}
                  {f === "All" ? "All Utilities" : f}
                </button>
              );
            })}
          </div>
          <ExportBtn onClick={() => exportToCSV(filteredData, "analytics-export.csv")}/>
        </div>
      </div>

      {/* VIEW TABS */}
      <div className="an-fu an-fu2" style={{ display: "flex", gap: 3, marginBottom: 24,
        background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, overflowX: "auto" }}>
        {[
          { id: "overview", icon: <FiBarChart2 size={14}/>, label: "Executive Overview" },
          { id: "trends", icon: <FiTrendingUp size={14}/>, label: "Trend Analysis" },
          { id: "efficiency", icon: <FiActivity size={14}/>, label: "Efficiency Metrics" },
          { id: "comparison", icon: <FiTarget size={14}/>, label: "Comparative Analysis" },
        ].map(v => (
          <button key={v.id} className="an-vbtn" onClick={() => setAnalysisView(v.id)}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px",
              borderRadius: 9, border: "none", fontFamily: F, fontSize: "0.82rem", fontWeight: 600,
              cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap", flexShrink: 0,
              background: analysisView === v.id ? C.blueL : "transparent",
              color: analysisView === v.id ? C.blue : C.muted }}>
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* STAT CARDS */}
      <SectionLabel>At a Glance</SectionLabel>
      <div className="an-fu an-fu3" style={{ display: "grid",
        gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { icon: <FiBarChart2 size={16}/>, label: "Billing Periods", value: stats.totalBills, sub: "Complete cycle coverage", badge: "+12% YoY", up: true, accent: C.blue, bg: C.blueL, bdr: C.blueM },
          { icon: <FiTrendingUp size={16}/>, label: isFlat ? "Bills Tracked" : "Total Consumption",
            value: isFlat ? `${stats.totalBills} bills` : `${stats.totalUnits} units`,
            sub: isFlat ? "Flat-rate plan" : "Aggregate utility usage", badge: "+5% this quarter", up: false, accent: C.teal, bg: C.tealL, bdr: C.tealM },
          { icon: <FiDollarSign size={16}/>, label: "Total Expenditure", value: `Rs. ${stats.totalAmount.toLocaleString()}`, sub: "Full financial overview", badge: "+8% cost increase", up: false, accent: C.violet, bg: C.violetL, bdr: C.violetM },
          { icon: <FiActivity size={16}/>, label: isFlat ? "Avg Monthly Spend" : "Avg Usage / Period",
            value: isFlat ? `Rs. ${Math.round(stats.totalAmount / (stats.totalBills || 1)).toLocaleString()}` : stats.avgUsage,
            sub: isFlat ? "Average plan charge" : "Per-period baseline", badge: "-3% efficiency gain", up: true, accent: C.green, bg: C.greenL, bdr: C.greenM },
          { icon: <FiDollarSign size={16}/>, label: "Cost per Unit", value: isFlat ? "Flat-rate" : `Rs. ${stats.costPerUnit}`, sub: isFlat ? "No unit billing" : "Unit cost efficiency", badge: "Optimal range", up: true, accent: C.amber, bg: C.amberL, bdr: C.amberM },
          { icon: <FiZap size={16}/>, label: isFlat ? "Peak Bill" : "Peak Demand",
            value: isFlat ? stats.peakUsage : stats.peakUsage,
            sub: `Recorded in ${stats.peakMonth}`, badge: "Max period", up: null, accent: C.red, bg: C.redL, bdr: C.redM },
        ].map((s, i) => (
          <div key={i} className="an-stat"
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
              overflow: "hidden", boxShadow: C.s1,
              transition: "transform .22s ease, box-shadow .22s ease" }}>
            <div style={{ height: 3, background: `linear-gradient(90deg,${s.accent},${s.accent}66)` }}/>
            <div style={{ padding: "16px 18px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: s.bg,
                  border: `1px solid ${s.bdr}`, display: "flex", alignItems: "center",
                  justifyContent: "center", color: s.accent }}>{s.icon}</div>
                <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px",
                  borderRadius: 20, whiteSpace: "nowrap",
                  background: s.up === true ? C.greenL : s.up === false ? C.amberL : C.blueL,
                  border: `1px solid ${s.up === true ? C.greenM : s.up === false ? C.amberM : C.blueM}`,
                  color: s.up === true ? C.green : s.up === false ? C.amber : C.blue }}>
                  {s.badge}
                </span>
              </div>
              <p style={{ fontSize: "1.45rem", fontWeight: 800, color: C.ink,
                letterSpacing: "-0.03em", margin: "0 0 3px", lineHeight: 1.1 }}>{s.value}</p>
              <p style={{ fontSize: "0.78rem", fontWeight: 600, color: C.body, margin: "0 0 2px" }}>{s.label}</p>
              <p style={{ fontSize: "0.7rem", color: C.muted, margin: 0 }}>{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ACTIVE VIEW */}
      {views[analysisView]()}

      {/* INSIGHTS */}
      <SectionLabel>Strategic Insights</SectionLabel>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontSize: "0.8rem", color: C.muted, margin: 0 }}>
          Actionable intelligence from consumption patterns and cost data
        </p>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.blue,
          background: C.blueL, border: `1px solid ${C.blueM}`, borderRadius: 20, padding: "3px 10px" }}>
          {insights.length} Active
        </span>
      </div>
      <div className="an-fu an-fu5" style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14, marginBottom: 28 }}>
        {insights.map((ins, i) => {
          const ic = iColor[ins.type] || iColor.info;
          return (
            <div key={i} className="an-ins"
              style={{ background: ic.bg, border: `1px solid ${ic.bdr}`,
                borderLeft: `3px solid ${ic.accent}`, borderRadius: 12, overflow: "hidden",
                transition: "transform .2s ease, box-shadow .2s ease" }}>
              <div style={{ display: "flex", gap: 10, padding: "14px 16px 10px" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: C.card,
                  border: `1px solid ${ic.bdr}`, display: "flex", alignItems: "center",
                  justifyContent: "center", color: ic.accent, flexShrink: 0 }}>{ins.icon}</div>
                <div>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: C.ink, margin: "0 0 3px" }}>{ins.title}</h4>
                  <p style={{ fontSize: "0.78rem", color: C.body, margin: 0, lineHeight: 1.55 }}>{ins.text}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "8px 16px 12px", borderTop: `1px solid ${ic.bdr}` }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: ic.accent }}>{ins.value}</span>
                <button className="an-abtn"
                  style={{ fontSize: "0.72rem", fontWeight: 600, color: C.muted,
                    background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6,
                    padding: "3px 10px", cursor: "pointer", fontFamily: F, transition: "all .15s" }}>
                  Analyze →
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* RECOMMENDATIONS */}
      <SectionLabel>Optimisation Recommendations</SectionLabel>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <p style={{ fontSize: "0.8rem", color: C.muted, margin: 0 }}>
          Data-driven initiatives with projected ROI and implementation timeline
        </p>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.green,
          background: C.greenL, border: `1px solid ${C.greenM}`, borderRadius: 20, padding: "3px 10px" }}>
          Total: Rs. 1,750/mo
        </span>
      </div>
      <div className="an-fu an-fu6" style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {recommendations.map((r, i) => (
          <div key={i} className="an-rec"
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
              overflow: "hidden", boxShadow: C.s1,
              transition: "transform .22s ease, box-shadow .22s ease" }}>
            <div style={{ padding: "18px 18px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: C.greenL,
                border: `1px solid ${C.greenM}`, display: "flex", alignItems: "center",
                justifyContent: "center", color: C.green, flexShrink: 0 }}>{r.icon}</div>
              <div>
                <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: C.ink, margin: "0 0 4px" }}>{r.title}</h4>
                <p style={{ fontSize: "0.77rem", color: C.muted, margin: 0, lineHeight: 1.5 }}>{r.desc}</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", borderTop: `1px solid ${C.border}` }}>
              {[
                { label: "Savings", val: r.savings, color: C.green },
                { label: "ROI Period", val: r.roi, color: C.ink },
                { label: "Setup", val: r.impl, color: C.ink },
              ].map((m, j) => (
                <div key={j} style={{ padding: "10px 8px", textAlign: "center",
                  borderRight: j < 2 ? `1px solid ${C.border}` : "none" }}>
                  <p style={{ fontSize: "0.62rem", fontWeight: 700, color: C.faint,
                    textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 3px" }}>{m.label}</p>
                  <p style={{ fontSize: "0.82rem", fontWeight: 800, color: m.color, margin: 0 }}>{m.val}</p>
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