// src/pages/Report.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from "recharts";
import "./Report.css";

// Custom Tooltip for charts
const CustomTooltip = ({ active, payload, label, prefix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="tooltip-value" style={{ color: p.color }}>
            <span className="tooltip-dot" style={{ background: p.color }} />
            {p.name}: <strong>{prefix}{p.value?.toLocaleString()}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Report = () => {
  const [billsData] = useState([
    { id: 1,  utilityType: "Electricity", billingMonth: "June 2025",      unitsUsed: 320, billAmount: 2750 },
    { id: 2,  utilityType: "Water",       billingMonth: "June 2025",      unitsUsed: 22,  billAmount: 880  },
    { id: 3,  utilityType: "Electricity", billingMonth: "July 2025",      unitsUsed: 345, billAmount: 2950 },
    { id: 4,  utilityType: "Water",       billingMonth: "July 2025",      unitsUsed: 24,  billAmount: 960  },
    { id: 5,  utilityType: "Electricity", billingMonth: "August 2025",    unitsUsed: 380, billAmount: 3250 },
    { id: 6,  utilityType: "Water",       billingMonth: "August 2025",    unitsUsed: 26,  billAmount: 1040 },
    { id: 7,  utilityType: "Electricity", billingMonth: "September 2025", unitsUsed: 350, billAmount: 3000 },
    { id: 8,  utilityType: "Water",       billingMonth: "September 2025", unitsUsed: 23,  billAmount: 920  },
    { id: 9,  utilityType: "Electricity", billingMonth: "October 2025",   unitsUsed: 330, billAmount: 2820 },
    { id: 10, utilityType: "Water",       billingMonth: "October 2025",   unitsUsed: 21,  billAmount: 840  },
    { id: 11, utilityType: "Electricity", billingMonth: "November 2025",  unitsUsed: 310, billAmount: 2650 },
    { id: 12, utilityType: "Water",       billingMonth: "November 2025",  unitsUsed: 20,  billAmount: 800  },
    { id: 13, utilityType: "Electricity", billingMonth: "December 2025",  unitsUsed: 340, billAmount: 2900 },
    { id: 14, utilityType: "Water",       billingMonth: "December 2025",  unitsUsed: 22,  billAmount: 860  },
  ]);

  const [utilityFilter, setUtilityFilter]     = useState("Both");
  const [timeRange, setTimeRange]             = useState("Yearly");
  const [selectedMonth, setSelectedMonth]     = useState("November 2025");
  const [selectedQuarter, setSelectedQuarter] = useState("Q4 2025");
  const [selectedYear, setSelectedYear]       = useState("2025");
  const [currentPage, setCurrentPage]         = useState(1);
  const [sortConfig, setSortConfig]           = useState({ key: "billingMonth", direction: "ascending" });
  const [animatedValues, setAnimatedValues]   = useState({ units: 0, amount: 0, avg: 0 });
  const rowsPerPage = 5;

  const monthOrder = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const availableMonths = useMemo(() => {
    return [...new Set(billsData.map(b => b.billingMonth))].sort((a, b) =>
      monthOrder.indexOf(a.split(" ")[0]) - monthOrder.indexOf(b.split(" ")[0]));
  }, [billsData]);

  const availableQuarters = useMemo(() => {
    const quarters = new Set();
    billsData.forEach(bill => {
      const [month, year] = bill.billingMonth.split(" ");
      let q;
      if (["January","February","March"].includes(month))          q = `Q1 ${year}`;
      else if (["April","May","June"].includes(month))             q = `Q2 ${year}`;
      else if (["July","August","September"].includes(month))      q = `Q3 ${year}`;
      else if (["October","November","December"].includes(month))  q = `Q4 ${year}`;
      quarters.add(q);
    });
    return Array.from(quarters).sort();
  }, [billsData]);

  const availableYears = useMemo(() =>
    [...new Set(billsData.map(b => b.billingMonth.split(" ")[1]))].sort(), [billsData]);

  const filteredData = useMemo(() => {
    let f = [...billsData];
    if (utilityFilter !== "Both") f = f.filter(b => b.utilityType === utilityFilter);
    if (timeRange === "Monthly") {
      f = f.filter(b => b.billingMonth === selectedMonth);
    } else if (timeRange === "Quarterly") {
      const [q, yr] = selectedQuarter.split(" ");
      const qMonths = { Q1:["January","February","March"], Q2:["April","May","June"], Q3:["July","August","September"], Q4:["October","November","December"] };
      f = f.filter(b => { const [m, y] = b.billingMonth.split(" "); return y === yr && qMonths[q].includes(m); });
    } else {
      f = f.filter(b => b.billingMonth.includes(selectedYear));
    }
    return f;
  }, [billsData, utilityFilter, timeRange, selectedMonth, selectedQuarter, selectedYear]);

  const summaryMetrics = useMemo(() => {
    if (!filteredData.length) return { totalUnits: 0, totalAmount: 0, avgMonthlyCost: 0, highestConsumptionMonth: "N/A" };
    const totalUnits  = filteredData.reduce((s, b) => s + b.unitsUsed, 0);
    const totalAmount = filteredData.reduce((s, b) => s + b.billAmount, 0);
    let avgMonthlyCost;
    if (timeRange === "Monthly")        avgMonthlyCost = totalAmount;
    else if (timeRange === "Quarterly") avgMonthlyCost = totalAmount / 3;
    else { const months = new Set(filteredData.map(b => b.billingMonth)).size; avgMonthlyCost = totalAmount / months; }
    const highest = filteredData.reduce((max, b) => b.unitsUsed > max.unitsUsed ? b : max, filteredData[0]);
    return { totalUnits, totalAmount, avgMonthlyCost: Math.round(avgMonthlyCost), highestConsumptionMonth: highest.billingMonth };
  }, [filteredData, timeRange]);

  // Animate numbers when metrics change
  useEffect(() => {
    const start = Date.now();
    const duration = 800;
    const { totalUnits, totalAmount, avgMonthlyCost } = summaryMetrics;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimatedValues({
        units:  Math.round(totalUnits  * ease),
        amount: Math.round(totalAmount * ease),
        avg:    Math.round(avgMonthlyCost * ease),
      });
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [summaryMetrics]);

  const usageOverTimeData = useMemo(() => {
    const data = {};
    billsData.forEach(bill => {
      if (utilityFilter !== "Both" && bill.utilityType !== utilityFilter) return;
      if (!data[bill.billingMonth]) data[bill.billingMonth] = { month: bill.billingMonth.split(" ")[0] };
      if (utilityFilter === "Both") data[bill.billingMonth][bill.utilityType] = bill.unitsUsed;
      else data[bill.billingMonth].units = bill.unitsUsed;
    });
    return Object.values(data).sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
  }, [billsData, utilityFilter]);

  const monthlyExpensesData = useMemo(() => {
    const data = {};
    billsData.forEach(bill => {
      if (utilityFilter !== "Both" && bill.utilityType !== utilityFilter) return;
      const m = bill.billingMonth.split(" ")[0];
      if (!data[m]) data[m] = { month: m, expenses: 0, electricity: 0, water: 0 };
      data[m].expenses += bill.billAmount;
      if (bill.utilityType === "Electricity") data[m].electricity += bill.billAmount;
      else data[m].water += bill.billAmount;
    });
    return Object.values(data).sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
  }, [billsData, utilityFilter]);

  const utilityDistributionData = useMemo(() => {
    if (utilityFilter !== "Both") return [];
    const elecAmount  = billsData.filter(b => b.utilityType === "Electricity").reduce((s, b) => s + b.billAmount, 0);
    const waterAmount = billsData.filter(b => b.utilityType === "Water").reduce((s, b) => s + b.billAmount, 0);
    return [
      { name: "Electricity", value: elecAmount,  color: "#d97706" },
      { name: "Water",       value: waterAmount, color: "#0284c7" },
    ];
  }, [billsData, utilityFilter]);

  const tableData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "ascending" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "ascending" ? 1  : -1;
      return 0;
    });
    return sorted.map((bill, i) => {
      let usageChange = 0;
      if (i > 0 && bill.utilityType === sorted[i - 1].utilityType) {
        const prev = sorted[i - 1].unitsUsed;
        usageChange = ((bill.unitsUsed - prev) / prev) * 100;
      }
      return { ...bill, usageChange: usageChange.toFixed(1) };
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return tableData.slice(start, start + rowsPerPage);
  }, [tableData, currentPage]);
  const totalPages = Math.ceil(tableData.length / rowsPerPage);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "ascending" ? "descending" : "ascending" }));
  };

  const insights = useMemo(() => {
    const list = [];
    if (!filteredData.length) { list.push({ type: "info", text: "No data available for the selected filters." }); return list; }
    const elecBills = filteredData.filter(b => b.utilityType === "Electricity");
    if (elecBills.length >= 2) {
      const sorted = [...elecBills].sort((a, b) => monthOrder.indexOf(b.billingMonth.split(" ")[0]) - monthOrder.indexOf(a.billingMonth.split(" ")[0]));
      const latest = sorted[0];
      const prev   = sorted.find(b => {
        const [bm, by] = b.billingMonth.split(" ");
        const [lm, ly] = latest.billingMonth.split(" ");
        return by === ly && monthOrder.indexOf(bm) === monthOrder.indexOf(lm) - 1;
      });
      if (prev) {
        const pct = ((latest.unitsUsed - prev.unitsUsed) / prev.unitsUsed) * 100;
        list.push({ type: pct > 0 ? "warning" : "success", text: `Electricity usage ${pct > 0 ? "increased" : "decreased"} by ${Math.abs(pct).toFixed(1)}% compared to last month.` });
      }
    }
    const waterBills = filteredData.filter(b => b.utilityType === "Water");
    if (waterBills.length >= 3) {
      const sw = [...waterBills].sort((a, b) => monthOrder.indexOf(a.billingMonth.split(" ")[0]) - monthOrder.indexOf(b.billingMonth.split(" ")[0]));
      let inc = true, dec = true;
      for (let i = 1; i < sw.length; i++) {
        if (sw[i].unitsUsed < sw[i-1].unitsUsed) inc = false;
        if (sw[i].unitsUsed > sw[i-1].unitsUsed) dec = false;
      }
      if (inc) list.push({ type: "warning", text: "Water consumption has been steadily increasing over the selected period." });
      else if (dec) list.push({ type: "success", text: "Water consumption has been steadily decreasing over the selected period — great progress!" });
    }
    const highest = filteredData.reduce((max, b) => b.billAmount > max.billAmount ? b : max, filteredData[0]);
    list.push({ type: "info", text: `Peak expenditure was in ${highest.billingMonth} at LKR ${highest.billAmount.toLocaleString()}.` });
    return list;
  }, [filteredData]);

  const exportToCSV = () => {
    const rows = [
      [`Report — ${timeRange === "Monthly" ? selectedMonth : timeRange === "Quarterly" ? selectedQuarter : selectedYear}`],
      [],
      ["Utility Type","Billing Month","Units Used","Bill Amount (LKR)"],
      ...filteredData.map(b => [b.utilityType, b.billingMonth, b.unitsUsed, b.billAmount]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `utility_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.style.display = "none"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const sortArrow = (key) => sortConfig.key === key ? (sortConfig.direction === "ascending" ? " ↑" : " ↓") : "";

  return (
    <div className="rpt-root">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <header className="rpt-header">
        <div className="rpt-header-text">
          <p className="rpt-eyebrow">Analytics Dashboard</p>
          <h1 className="rpt-title">Utility Reports</h1>
          <p className="rpt-subtitle">Track, analyze, and optimize your consumption patterns</p>
        </div>
        <button className="rpt-export-btn" onClick={exportToCSV}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </header>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <section className="rpt-filters">
        <div className="rpt-filter-pill">
          <label>Utility</label>
          <div className="rpt-toggle-group">
            {["Both","Electricity","Water"].map(v => (
              <button key={v} className={`rpt-toggle ${utilityFilter === v ? "active" : ""}`} onClick={() => setUtilityFilter(v)}>{v}</button>
            ))}
          </div>
        </div>
        <div className="rpt-filter-pill">
          <label>Time Range</label>
          <div className="rpt-toggle-group">
            {["Monthly","Quarterly","Yearly"].map(v => (
              <button key={v} className={`rpt-toggle ${timeRange === v ? "active" : ""}`} onClick={() => setTimeRange(v)}>{v}</button>
            ))}
          </div>
        </div>
        {timeRange === "Monthly" && (
          <div className="rpt-filter-pill">
            <label>Month</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {availableMonths.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
        )}
        {timeRange === "Quarterly" && (
          <div className="rpt-filter-pill">
            <label>Quarter</label>
            <select value={selectedQuarter} onChange={e => setSelectedQuarter(e.target.value)}>
              {availableQuarters.map(q => <option key={q}>{q}</option>)}
            </select>
          </div>
        )}
        {timeRange === "Yearly" && (
          <div className="rpt-filter-pill">
            <label>Year</label>
            <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
              {availableYears.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        )}
      </section>

      {/* ── KPI Cards ───────────────────────────────────────────── */}
      <section className="rpt-kpis">
        <div className="rpt-kpi rpt-kpi--amber">
          <div className="rpt-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <div>
            <p className="rpt-kpi-label">Total Units Consumed</p>
            <p className="rpt-kpi-value">{animatedValues.units.toLocaleString()}</p>
            <p className="rpt-kpi-sub">{utilityFilter === "Both" ? "All utilities" : utilityFilter}</p>
          </div>
        </div>
        <div className="rpt-kpi rpt-kpi--sky">
          <div className="rpt-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
          </div>
          <div>
            <p className="rpt-kpi-label">Total Amount Spent</p>
            <p className="rpt-kpi-value">LKR {animatedValues.amount.toLocaleString()}</p>
            <p className="rpt-kpi-sub">{timeRange} period</p>
          </div>
        </div>
        <div className="rpt-kpi rpt-kpi--violet">
          <div className="rpt-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div>
            <p className="rpt-kpi-label">Avg Monthly Cost</p>
            <p className="rpt-kpi-value">LKR {animatedValues.avg.toLocaleString()}</p>
            <p className="rpt-kpi-sub">Calculated average</p>
          </div>
        </div>
        <div className="rpt-kpi rpt-kpi--rose">
          <div className="rpt-kpi-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <div>
            <p className="rpt-kpi-label">Peak Consumption</p>
            <p className="rpt-kpi-value">{summaryMetrics.highestConsumptionMonth}</p>
            <p className="rpt-kpi-sub">Highest usage period</p>
          </div>
        </div>
      </section>

      {/* ── Charts Grid ─────────────────────────────────────────── */}
      <section className="rpt-charts">
        {/* Area chart — usage over time */}
        <div className="rpt-chart-card rpt-chart-wide">
          <div className="rpt-chart-head">
            <div>
              <h3>Consumption Over Time</h3>
              <p>Monthly unit usage across utilities</p>
            </div>
            <div className="rpt-legend">
              {(utilityFilter === "Both" || utilityFilter === "Electricity") && <span className="rpt-legend-dot rpt-legend-elec" />}
              {(utilityFilter === "Both" || utilityFilter === "Electricity") && <span style={{fontSize:"0.75rem",color:"#94a3b8"}}>Electricity</span>}
              {(utilityFilter === "Both" || utilityFilter === "Water")       && <span className="rpt-legend-dot rpt-legend-water" />}
              {(utilityFilter === "Both" || utilityFilter === "Water")       && <span style={{fontSize:"0.75rem",color:"#94a3b8"}}>Water</span>}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={usageOverTimeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradElec" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#d97706" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradWater" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0284c7" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {(utilityFilter === "Both" || utilityFilter === "Electricity") && <Area type="monotone" dataKey="Electricity" stroke="#d97706" strokeWidth={2} fill="url(#gradElec)" dot={false} />}
              {(utilityFilter === "Both" || utilityFilter === "Water")       && <Area type="monotone" dataKey="Water"       stroke="#0284c7" strokeWidth={2} fill="url(#gradWater)" dot={false} />}
              {utilityFilter !== "Both" && <Area type="monotone" dataKey="units" name="Units Used" stroke="#d97706" strokeWidth={2} fill="url(#gradElec)" dot={false} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart — monthly expenses */}
        <div className="rpt-chart-card">
          <div className="rpt-chart-head">
            <div>
              <h3>Monthly Expenses</h3>
              <p>Total spend per month (LKR)</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyExpensesData} barSize={22} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip prefix="LKR " />} />
              {utilityFilter === "Both" ? (
                <>
                  <Bar dataKey="electricity" name="Electricity" stackId="a" fill="#d97706" radius={[0,0,0,0]} />
                  <Bar dataKey="water"       name="Water"       stackId="a" fill="#0284c7" radius={[4,4,0,0]} />
                </>
              ) : (
                <Bar dataKey="expenses" name="Expenses" fill="#d97706" radius={[4,4,0,0]}>
                  {monthlyExpensesData.map((_, i) => (
                    <Cell key={i} fill={`rgba(217,119,6,${0.4 + 0.6 * (i / monthlyExpensesData.length)})`} />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — distribution */}
        {utilityFilter === "Both" && (
          <div className="rpt-chart-card rpt-chart-pie">
            <div className="rpt-chart-head">
              <div>
                <h3>Spend Distribution</h3>
                <p>Total cost by utility type</p>
              </div>
            </div>
            <div className="rpt-pie-wrapper">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={utilityDistributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    dataKey="value" startAngle={90} endAngle={-270} paddingAngle={3}>
                    {utilityDistributionData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`LKR ${v.toLocaleString()}`, "Spend"]} contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", color: "#0f172a", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="rpt-pie-legend">
                {utilityDistributionData.map((d, i) => (
                  <div key={i} className="rpt-pie-item">
                    <span className="rpt-pie-dot" style={{ background: d.color }} />
                    <div>
                      <p className="rpt-pie-name">{d.name}</p>
                      <p className="rpt-pie-val">LKR {d.value.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Data Table ──────────────────────────────────────────── */}
      <section className="rpt-table-section">
        <div className="rpt-table-head">
          <div>
            <h3>Detailed Records</h3>
            <p>{filteredData.length} entries found</p>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="rpt-empty"><span>📂</span><p>No records match the current filters.</p></div>
        ) : (
          <>
            <div className="rpt-table-wrap">
              <table className="rpt-table">
                <thead>
                  <tr>
                    {[["billingMonth","Month"],["utilityType","Utility"],["unitsUsed","Units Used"],["billAmount","Bill Amount"],["usageChange","Change"]].map(([key, label]) => (
                      <th key={key} onClick={() => handleSort(key)}>
                        {label}<span className="sort-arrow">{sortArrow(key)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((bill) => (
                    <tr key={bill.id}>
                      <td><span className="rpt-month-badge">{bill.billingMonth}</span></td>
                      <td>
                        <span className={`rpt-utility-badge ${bill.utilityType === "Electricity" ? "elec" : "water"}`}>
                          {bill.utilityType === "Electricity" ? "⚡" : "💧"} {bill.utilityType}
                        </span>
                      </td>
                      <td><strong>{bill.unitsUsed}</strong> units</td>
                      <td className="rpt-amount">LKR {bill.billAmount.toLocaleString()}</td>
                      <td>
                        <span className={`rpt-change ${bill.usageChange > 0 ? "up" : bill.usageChange < 0 ? "down" : "neutral"}`}>
                          {bill.usageChange > 0 ? "↑" : bill.usageChange < 0 ? "↓" : "–"} {Math.abs(bill.usageChange)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rpt-pagination">
              <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1} className="rpt-page-btn">← Prev</button>
              <div className="rpt-page-dots">
                {Array.from({length: totalPages}).map((_,i) => (
                  <button key={i} className={`rpt-page-dot ${currentPage===i+1?"active":""}`} onClick={() => setCurrentPage(i+1)}>{i+1}</button>
                ))}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} disabled={currentPage===totalPages} className="rpt-page-btn">Next →</button>
            </div>
          </>
        )}
      </section>

      {/* ── Insights ────────────────────────────────────────────── */}
      <section className="rpt-insights">
        <div className="rpt-insights-head">
          <h3>AI Insights</h3>
          <p>Automated analysis of your utility patterns</p>
        </div>
        <div className="rpt-insights-grid">
          {insights.map((ins, i) => (
            <div key={i} className={`rpt-insight rpt-insight--${ins.type}`}>
              <div className="rpt-insight-icon">
                {ins.type === "success" && "✓"}
                {ins.type === "warning" && "!"}
                {ins.type === "info"    && "i"}
              </div>
              <p>{ins.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Report;