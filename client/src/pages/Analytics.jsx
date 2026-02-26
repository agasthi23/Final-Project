import React, { useState, useMemo } from 'react';
import './Analytics.css';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line
} from 'recharts';

// ── Icons ──────────────────────────────────────────────────────────────────
const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
  </svg>
);
const TrendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const CostIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const EfficiencyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const InsightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const SavingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5Z"/>
    <path d="M12 5L8 21l4-7 4 7-4-16Z"/>
  </svg>
);
const PerformanceIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
);
const ExportIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const WaterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
);

// ── Sample Data ────────────────────────────────────────────────────────────
const billsData = [
  { billingMonth: "Jan", utilityType: "Electricity", unitsUsed: 320, billAmount: 4800 },
  { billingMonth: "Feb", utilityType: "Electricity", unitsUsed: 280, billAmount: 4200 },
  { billingMonth: "Mar", utilityType: "Electricity", unitsUsed: 350, billAmount: 5250 },
  { billingMonth: "Apr", utilityType: "Electricity", unitsUsed: 310, billAmount: 4650 },
  { billingMonth: "May", utilityType: "Electricity", unitsUsed: 290, billAmount: 4350 },
  { billingMonth: "Jun", utilityType: "Electricity", unitsUsed: 340, billAmount: 5100 },
  { billingMonth: "Jan", utilityType: "Water", unitsUsed: 45, billAmount: 900 },
  { billingMonth: "Feb", utilityType: "Water", unitsUsed: 42, billAmount: 840 },
  { billingMonth: "Mar", utilityType: "Water", unitsUsed: 48, billAmount: 960 },
  { billingMonth: "Apr", utilityType: "Water", unitsUsed: 44, billAmount: 880 },
  { billingMonth: "May", utilityType: "Water", unitsUsed: 46, billAmount: 920 },
  { billingMonth: "Jun", utilityType: "Water", unitsUsed: 50, billAmount: 1000 },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

// ── Helpers ────────────────────────────────────────────────────────────────
const exportToCSV = (data, filename) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]).join(",");
  const rows = data.map(row => Object.values(row).join(",")).join("\n");
  const blob = new Blob([`${headers}\n${rows}`], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

// ── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="tooltip-value" style={{ color: entry.color }}>
          {entry.name}: <strong>{entry.value}{entry.name?.toLowerCase().includes("cost") ? " LKR" : ""}</strong>
        </p>
      ))}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
const Analytics = () => {
  const [filter, setFilter] = useState("All");
  const [analysisView, setAnalysisView] = useState("overview");

  // ── Filtered data ──────────────────────────────────────────────────────
  const filteredData = useMemo(() =>
    filter === "All" ? billsData : billsData.filter(b => b.utilityType === filter),
    [filter]
  );

  // ── Summary stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalBills = filteredData.length;
    const totalUnits = filteredData.reduce((s, b) => s + b.unitsUsed, 0);
    const totalAmount = filteredData.reduce((s, b) => s + b.billAmount, 0);
    const avgUsage = totalBills ? Math.round(totalUnits / totalBills) : 0;
    const costPerUnit = totalUnits ? (totalAmount / totalUnits).toFixed(2) : 0;
    const peak = filteredData.reduce((mx, b) => b.unitsUsed > mx.unitsUsed ? b : mx, filteredData[0] || {});
    return { totalBills, totalUnits, totalAmount, avgUsage, costPerUnit, peakUsage: peak.unitsUsed || 0, peakMonth: peak.billingMonth || "N/A" };
  }, [filteredData]);

  // ── Monthly usage (for area / line chart) ─────────────────────────────
  const monthlyUsageData = useMemo(() => {
    const map = {};
    filteredData.forEach(b => {
      if (!map[b.billingMonth]) map[b.billingMonth] = { month: b.billingMonth };
      map[b.billingMonth][b.utilityType] = b.unitsUsed;
      map[b.billingMonth][`${b.utilityType}Cost`] = b.billAmount;
    });
    return MONTHS.filter(m => map[m]).map(m => map[m]);
  }, [filteredData]);

  // ── Cost per month ─────────────────────────────────────────────────────
  const monthlyCostData = useMemo(() => {
    const map = {};
    filteredData.forEach(b => {
      if (!map[b.billingMonth]) map[b.billingMonth] = { month: b.billingMonth, total: 0 };
      map[b.billingMonth][b.utilityType] = b.billAmount;
      map[b.billingMonth].total += b.billAmount;
    });
    return MONTHS.filter(m => map[m]).map(m => map[m]);
  }, [filteredData]);

  // ── Distribution (pie) ─────────────────────────────────────────────────
  const distributionData = useMemo(() => {
    const dist = {};
    filteredData.forEach(b => {
      if (!dist[b.utilityType]) dist[b.utilityType] = { units: 0, cost: 0 };
      dist[b.utilityType].units += b.unitsUsed;
      dist[b.utilityType].cost += b.billAmount;
    });
    const total = Object.values(dist).reduce((s, d) => s + d.units, 0);
    return Object.entries(dist).map(([name, d]) => ({
      name, value: d.units, cost: d.cost,
      percentage: Math.round((d.units / total) * 100),
      color: name === "Electricity" ? "#4F46E5" : "#10B981"
    }));
  }, [filteredData]);

  // ── Cost efficiency ────────────────────────────────────────────────────
  const efficiencyData = useMemo(() => {
    const map = {};
    filteredData.forEach(b => {
      if (!map[b.billingMonth]) map[b.billingMonth] = { month: b.billingMonth, units: 0, cost: 0 };
      map[b.billingMonth].units += b.unitsUsed;
      map[b.billingMonth].cost += b.billAmount;
    });
    return MONTHS.filter(m => map[m]).map(m => ({
      month: m,
      "Cost/Unit": +(map[m].cost / map[m].units).toFixed(2)
    }));
  }, [filteredData]);

  // ── Comparison ────────────────────────────────────────────────────────
  const comparisonData = useMemo(() => {
    const map = {};
    filteredData.forEach(b => {
      if (!map[b.billingMonth]) map[b.billingMonth] = { month: b.billingMonth, Electricity: 0, Water: 0 };
      map[b.billingMonth][b.utilityType] = b.unitsUsed;
    });
    const rows = MONTHS.filter(m => map[m]).map(m => map[m]);
    const avg = rows.reduce((s, r) => s + r.Electricity + r.Water, 0) / (rows.length || 1);
    return rows.map(r => ({ ...r, Average: Math.round(avg) }));
  }, [filteredData]);

  // ── RADAR — calculated from real data ─────────────────────────────────
  const radarData = useMemo(() => {
    const elec = billsData.filter(b => b.utilityType === "Electricity");
    const watr = billsData.filter(b => b.utilityType === "Water");

    const score = (val, min, max) => Math.round(100 - ((val - min) / (max - min)) * 50);

    const eCPU = elec.reduce((s, b) => s + b.billAmount / b.unitsUsed, 0) / elec.length;
    const wCPU = watr.reduce((s, b) => s + b.billAmount / b.unitsUsed, 0) / watr.length;

    const eUnits = elec.map(b => b.unitsUsed);
    const wUnits = watr.map(b => b.unitsUsed);

    const variance = arr => { const m = arr.reduce((a, b) => a + b, 0) / arr.length; return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length; };
    const eVar = variance(eUnits); const wVar = variance(wUnits);

    const ePeak = Math.max(...eUnits); const wPeak = Math.max(...wUnits);
    const eAvg = eUnits.reduce((a, b) => a + b, 0) / eUnits.length;
    const wAvg = wUnits.reduce((a, b) => a + b, 0) / wUnits.length;

    const eTrend = eUnits[eUnits.length - 1] < eUnits[0] ? 85 : 60;
    const wTrend = wUnits[wUnits.length - 1] < wUnits[0] ? 85 : 65;

    const eBudget = elec.filter(b => b.billAmount < 5000).length / elec.length * 100;
    const wBudget = watr.filter(b => b.billAmount < 950).length / watr.length * 100;

    return [
      { metric: "Efficiency",        Electricity: score(eCPU, 12, 18),       Water: score(wCPU, 18, 22) },
      { metric: "Cost Control",      Electricity: Math.round(eBudget),        Water: Math.round(wBudget) },
      { metric: "Usage Stability",   Electricity: Math.max(30, 100 - Math.round(eVar / 100)), Water: Math.max(30, 100 - Math.round(wVar * 10)) },
      { metric: "Peak Management",   Electricity: Math.round((1 - (ePeak - eAvg) / eAvg) * 100), Water: Math.round((1 - (wPeak - wAvg) / wAvg) * 100) },
      { metric: "Trend",             Electricity: eTrend,                     Water: wTrend },
      { metric: "Budget Adherence",  Electricity: Math.round(eBudget * 0.9),  Water: Math.round(wBudget * 0.95) },
    ];
  }, []);

  // ── Insights ───────────────────────────────────────────────────────────
  const insights = useMemo(() => {
    const result = [];
    const recent = filteredData.slice(-4);
    const older  = filteredData.slice(-8, -4);
    const rAvg = recent.reduce((s, b) => s + b.unitsUsed, 0) / (recent.length || 1);
    const oAvg = older.reduce((s, b) => s + b.unitsUsed, 0)  / (older.length  || 1);
    const trend = rAvg > oAvg ? "increasing" : "decreasing";
    const pct   = Math.abs(Math.round(((rAvg - oAvg) / (oAvg || 1)) * 100));

    result.push({ type: trend === "increasing" ? "warning" : "success", icon: <TrendIcon />, title: "Usage Trend Analysis", text: `Consumption is ${trend} by ${pct}% vs the previous period.`, value: "Strategic planning needed" });

    const highCost = filteredData.filter(b => b.billAmount / b.unitsUsed > 15);
    if (highCost.length) result.push({ type: "warning", icon: <CostIcon />, title: "Cost Efficiency Alert", text: `${highCost.length} period(s) show elevated cost per unit (> LKR 15). Review pricing tiers.`, value: "Optimization opportunity" });

    const peakU = Math.max(...filteredData.map(b => b.unitsUsed));
    const peakM = filteredData.find(b => b.unitsUsed === peakU)?.billingMonth;
    result.push({ type: "info", icon: <PerformanceIcon />, title: "Peak Usage Analysis", text: `Highest recorded: ${peakU} units in ${peakM}. Plan capacity for similar periods.`, value: "Capacity planning" });

    const waterRows = filteredData.filter(b => b.utilityType === "Water").slice(-3);
    if (waterRows.length) {
      const avgW = waterRows.reduce((s, b) => s + b.unitsUsed, 0) / waterRows.length;
      if (avgW > 44) result.push({ type: "warning", icon: <AlertIcon />, title: "Water Conservation Alert", text: `Avg water usage is elevated at ${Math.round(avgW)} units. Consider conservation measures.`, value: "Sustainability target" });
    }

    const elecCost = filteredData.filter(b => b.utilityType === "Electricity").reduce((s, b) => s + b.billAmount, 0);
    result.push({ type: "success", icon: <SavingsIcon />, title: "Savings Potential", text: `Estimated LKR ${Math.round(elecCost * 0.1).toLocaleString()} monthly savings through electricity optimisation.`, value: "ROI: 3–6 months" });

    return result;
  }, [filteredData]);

  // ── Export handler ─────────────────────────────────────────────────────
  const handleExport = () => exportToCSV(filteredData, `analytics-${filter.toLowerCase()}-${Date.now()}.csv`);

  // ── Recommendation cards data ──────────────────────────────────────────
  const recommendations = [
    { icon: <EfficiencyIcon />, title: "Temperature Optimisation", desc: "Smart thermostat controls with 2°C adjustment to reduce HVAC load.", savings: "LKR 450/mo", roi: "4 months", impl: "2 weeks" },
    { icon: <TrendIcon />,      title: "Time-of-Use Scheduling",  desc: "Shift 30% of consumption to off-peak hours via automated load scheduling.", savings: "LKR 320/mo", roi: "3 months", impl: "1 week" },
    { icon: <WaterIcon />,      title: "Water Conservation",      desc: "Low-flow fixtures and real-time leak detection monitoring system.", savings: "LKR 200/mo", roi: "6 months", impl: "3 weeks" },
    { icon: <PerformanceIcon />,title: "Preventive Maintenance",  desc: "Scheduled equipment servicing to optimise efficiency and extend asset life.", savings: "LKR 280/mo", roi: "5 months", impl: "Ongoing" },
  ];

  // ══════════════════════════════════════════════════════════════════════
  // VIEW RENDERERS
  // ══════════════════════════════════════════════════════════════════════

  const renderOverview = () => (
    <div className="charts-grid">
      {/* Consumption Area Chart */}
      <div className="chart-container span-2">
        <div className="chart-header">
          <div><h3>Consumption Trend</h3><p>Monthly usage across all utilities</p></div>
          <button className="chart-action-btn" onClick={handleExport}><ExportIcon /> Export CSV</button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyUsageData}>
            <defs>
              <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {(filter === "All" || filter === "Electricity") && <Area type="monotone" dataKey="Electricity" stroke="#4F46E5" strokeWidth={2} fill="url(#elecGrad)" dot={{ fill: '#4F46E5', r: 4 }} />}
            {(filter === "All" || filter === "Water") && <Area type="monotone" dataKey="Water" stroke="#10B981" strokeWidth={2} fill="url(#waterGrad)" dot={{ fill: '#10B981', r: 4 }} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution Pie */}
      <div className="chart-container">
        <div className="chart-header">
          <div><h3>Cost Allocation</h3><p>Budget distribution by utility</p></div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={distributionData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
              {distributionData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="distribution-legend">
          {distributionData.map((e, i) => (
            <div key={i} className="legend-item">
              <div className="legend-dot" style={{ background: e.color }} />
              <div className="legend-info">
                <span className="legend-name">{e.name}</span>
                <span className="legend-sub">{e.value} units · {e.percentage}% · LKR {e.cost.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cost Efficiency Bar */}
      <div className="chart-container">
        <div className="chart-header">
          <div><h3>Cost per Unit</h3><p>Monthly unit cost efficiency</p></div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={efficiencyData} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Cost/Unit" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderTrends = () => (
    <div className="charts-grid">
      {/* Monthly Cost Line */}
      <div className="chart-container span-2">
        <div className="chart-header">
          <div><h3>Monthly Cost Trend</h3><p>Bill amount over time per utility</p></div>
          <button className="chart-action-btn" onClick={handleExport}><ExportIcon /> Export CSV</button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyCostData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {(filter === "All" || filter === "Electricity") && <Line type="monotone" dataKey="Electricity" stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 5, fill: '#4F46E5' }} activeDot={{ r: 7 }} />}
            {(filter === "All" || filter === "Water") && <Line type="monotone" dataKey="Water" stroke="#10B981" strokeWidth={2.5} dot={{ r: 5, fill: '#10B981' }} activeDot={{ r: 7 }} />}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Usage vs Cost Bars */}
      <div className="chart-container span-2">
        <div className="chart-header">
          <div><h3>Usage vs Cost Correlation</h3><p>Comparing consumption units against billing amounts</p></div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyUsageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {(filter === "All" || filter === "Electricity") && <Bar dataKey="Electricity" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={20} />}
            {(filter === "All" || filter === "Water") && <Bar dataKey="Water" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderEfficiency = () => (
    <div className="charts-grid">
      {/* Radar */}
      <div className="chart-container span-2">
        <div className="chart-header">
          <div><h3>Performance Assessment Matrix</h3><p>Scores calculated from actual billing data</p></div>
          <div className="radar-note">Scores derived from real consumption & cost metrics</div>
        </div>
        <ResponsiveContainer width="100%" height={360}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#E2E8F0" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748B', fontSize: 12 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 10 }} />
            {(filter === "All" || filter === "Electricity") && <Radar name="Electricity" dataKey="Electricity" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.25} strokeWidth={2} />}
            {(filter === "All" || filter === "Water") && <Radar name="Water" dataKey="Water" stroke="#10B981" fill="#10B981" fillOpacity={0.25} strokeWidth={2} />}
            <Legend /><Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Cost per Unit */}
      <div className="chart-container span-2">
        <div className="chart-header">
          <div><h3>Unit Cost Efficiency by Month</h3><p>LKR per unit consumed — lower is better</p></div>
          <button className="chart-action-btn" onClick={handleExport}><ExportIcon /> Export CSV</button>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={efficiencyData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Cost/Unit" radius={[6, 6, 0, 0]}>
              {efficiencyData.map((e, i) => <Cell key={i} fill={e["Cost/Unit"] > 15 ? "#EF4444" : "#8B5CF6"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="charts-grid">
      {/* Grouped Bar Comparison */}
      <div className="chart-container span-2">
        <div className="chart-header">
          <div><h3>Period-over-Period Benchmarking</h3><p>Monthly usage vs overall average baseline</p></div>
          <button className="chart-action-btn" onClick={handleExport}><ExportIcon /> Export CSV</button>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {(filter === "All" || filter === "Electricity") && <Bar dataKey="Electricity" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={18} />}
            {(filter === "All" || filter === "Water") && <Bar dataKey="Water" fill="#10B981" radius={[4, 4, 0, 0]} barSize={18} />}
            <Bar dataKey="Average" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Cost Breakdown */}
      <div className="chart-container span-2">
        <div className="chart-header">
          <div><h3>Monthly Cost Breakdown</h3><p>Total bill amount stacked by utility type</p></div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={monthlyCostData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {(filter === "All" || filter === "Electricity") && <Bar dataKey="Electricity" stackId="a" fill="#4F46E5" />}
            {(filter === "All" || filter === "Water") && <Bar dataKey="Water" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const views = {
    overview:   renderOverview,
    trends:     renderTrends,
    efficiency: renderEfficiency,
    comparison: renderComparison,
  };

  // ══════════════════════════════════════════════════════════════════════
  return (
    <div className="analytics-container">

      {/* ── Header ── */}
      <div className="analytics-header-with-filter">
        <div className="analytics-header">
          <h1>Analytics Dashboard</h1>
          <p>Data-driven insights for utility optimisation and cost management</p>
        </div>
        <div className="header-controls">
          <div className="filter-buttons">
            {["All", "Electricity", "Water"].map(f => (
              <button key={f} className={`filter-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f === "All" ? "All Utilities" : f}
              </button>
            ))}
          </div>
          <button className="export-all-btn" onClick={handleExport}>
            <ExportIcon /> Export CSV
          </button>
        </div>
      </div>

      {/* ── View Tabs ── */}
      <div className="analysis-view-selector">
        {[
          { id: "overview",   icon: <DashboardIcon />,    label: "Executive Overview" },
          { id: "trends",     icon: <TrendIcon />,        label: "Trend Analysis" },
          { id: "efficiency", icon: <EfficiencyIcon />,   label: "Efficiency Metrics" },
          { id: "comparison", icon: <PerformanceIcon />,  label: "Comparative Analysis" },
        ].map(v => (
          <button key={v.id} className={`view-btn ${analysisView === v.id ? "active" : ""}`} onClick={() => setAnalysisView(v.id)}>
            {v.icon} <span>{v.label}</span>
          </button>
        ))}
      </div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        {[
          { label: "Billing Periods",   value: stats.totalBills,                         sub: "Complete cycle coverage",    change: "+12% YoY",          up: true,  icon: <DashboardIcon /> },
          { label: "Total Consumption", value: `${stats.totalUnits} units`,              sub: "Aggregate utility usage",    change: "+5% this quarter",   up: false, icon: <TrendIcon /> },
          { label: "Total Expenditure", value: `LKR ${stats.totalAmount.toLocaleString()}`, sub: "Full financial overview", change: "+8% cost increase",  up: false, icon: <CostIcon /> },
          { label: "Avg Usage/Period",  value: stats.avgUsage,                           sub: "Per-period baseline",        change: "-3% efficiency gain", up: true,  icon: <EfficiencyIcon /> },
          { label: "Cost per Unit",     value: `LKR ${stats.costPerUnit}`,               sub: "Unit cost efficiency",       change: "Optimal range",       up: true,  icon: <CostIcon /> },
          { label: "Peak Demand",       value: stats.peakUsage,                          sub: `Recorded in ${stats.peakMonth}`, change: "Max period",    up: null,  icon: <PerformanceIcon /> },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-top">
              <div className="stat-icon">{s.icon}</div>
              <span className={`stat-badge ${s.up === true ? "up" : s.up === false ? "down" : "neutral"}`}>{s.change}</span>
            </div>
            <p className="stat-value">{s.value}</p>
            <p className="stat-label">{s.label}</p>
            <p className="stat-description">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Active View Charts ── */}
      {views[analysisView]()}

      {/* ── Insights ── */}
      <div className="insights-section">
        <div className="section-header">
          <div>
            <h2><InsightIcon /> Strategic Insights</h2>
            <p>Actionable intelligence from consumption patterns and cost data</p>
          </div>
          <span className="section-badge blue">{insights.length} Active</span>
        </div>
        <div className="insights-grid">
          {insights.map((ins, i) => (
            <div key={i} className={`insight-card ${ins.type}`}>
              <div className="insight-body">
                <div className="insight-icon">{ins.icon}</div>
                <div>
                  <h4>{ins.title}</h4>
                  <p>{ins.text}</p>
                </div>
              </div>
              <div className="insight-footer">
                <span className="insight-tag">{ins.value}</span>
                <button className="action-btn">Analyze →</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recommendations ── */}
      <div className="recommendations-section">
        <div className="section-header">
          <div>
            <h2><SavingsIcon /> Optimisation Recommendations</h2>
            <p>Data-driven initiatives with projected ROI and implementation timeline</p>
          </div>
          <span className="section-badge green">Total: LKR 1,250/mo</span>
        </div>
        <div className="recommendations-grid">
          {recommendations.map((rec, i) => (
            <div key={i} className="recommendation-card">
              <div className="rec-header">
                <div className="rec-icon">{rec.icon}</div>
                <div>
                  <h4>{rec.title}</h4>
                  <p>{rec.desc}</p>
                </div>
              </div>
              <div className="rec-metrics">
                <div className="rec-metric">
                  <span className="rec-metric-label">Savings</span>
                  <span className="rec-metric-value savings">{rec.savings}</span>
                </div>
                <div className="rec-metric">
                  <span className="rec-metric-label">ROI Period</span>
                  <span className="rec-metric-value">{rec.roi}</span>
                </div>
                <div className="rec-metric">
                  <span className="rec-metric-label">Setup</span>
                  <span className="rec-metric-value">{rec.impl}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Analytics;