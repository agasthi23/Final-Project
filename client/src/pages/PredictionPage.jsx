// src/pages/Prediction.jsx
import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts";
import "./Prediction.css";

/* ── Icons ──────────────────────────────────────────────────────────────── */
const ZapIcon     = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const DropIcon    = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
const CalIcon     = ({ size = 20 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
const ArrowUpIcon = ({ size = 13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>;
const ArrowDnIcon = ({ size = 13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>;
const BarIcon     = ({ size = 17 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const SparkIcon   = ({ size = 17 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z"/></svg>;
const ShieldIcon  = ({ size = 13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const TrendIcon   = ({ size = 17 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
const InfoIcon    = ({ size = 15 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;

/* ── Tooltip ────────────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label, utilUnit }) => {
  if (!active || !payload?.length) return null;
  const isForecast = label?.includes("›");
  return (
    <div className="ct-wrap">
      <div className="ct-head">
        <span className="ct-month">{label?.replace(" ›", "")}</span>
        {isForecast && <span className="ct-ftag">Forecast</span>}
      </div>
      {payload.filter(p => p.value !== null).map((p, i) => (
        <div key={i} className="ct-row">
          <span className="ct-dot" style={{ background: p.color }} />
          <span className="ct-name">{p.name}</span>
          <span className="ct-val">
            {p.dataKey === "units" || p.dataKey === "forecast"
              ? `${p.value} ${utilUnit}`
              : `LKR ${Number(p.value).toLocaleString()}`}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Main ───────────────────────────────────────────────────────────────── */
const Prediction = () => {
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
  ]);

  const [selectedUtility, setSelectedUtility] = useState("Electricity");
  const [predictionMethod, setPredictionMethod] = useState("average");

  const isElec    = selectedUtility === "Electricity";
  const utilColor = isElec ? "#6366f1" : "#0ea5e9";
  const utilUnit  = isElec ? "kWh" : "kL";

  const filteredData = useMemo(
    () => billsData.filter(b => b.utilityType === selectedUtility),
    [billsData, selectedUtility]
  );

  const prediction = useMemo(() => {
    if (!filteredData.length) return { predictedUnits: 0, predictedAmount: 0, percentChange: 0, amountChange: 0, confidence: "Low", explanation: "Not enough data." };

    let predictedUnits, predictedAmount;
    if (predictionMethod === "average") {
      predictedUnits  = Math.round(filteredData.reduce((s, b) => s + b.unitsUsed,  0) / filteredData.length);
      predictedAmount = Math.round(filteredData.reduce((s, b) => s + b.billAmount, 0) / filteredData.length);
    } else if (predictionMethod === "weighted") {
      let wu = 0, wa = 0, ws = 0;
      filteredData.forEach((b, i) => { const w = i + 1; wu += b.unitsUsed * w; wa += b.billAmount * w; ws += w; });
      predictedUnits  = Math.round(wu / ws);
      predictedAmount = Math.round(wa / ws);
    } else {
      const n = filteredData.length;
      if (n < 2) {
        predictedUnits  = Math.round(filteredData.reduce((s, b) => s + b.unitsUsed,  0) / n);
        predictedAmount = Math.round(filteredData.reduce((s, b) => s + b.billAmount, 0) / n);
      } else {
        const xs = Array.from({ length: n }, (_, i) => i);
        const xSum = xs.reduce((s, x) => s + x, 0);
        const x2Sum = xs.reduce((s, x) => s + x * x, 0);
        const yU = filteredData.map(b => b.unitsUsed);
        const yA = filteredData.map(b => b.billAmount);
        const yUSum = yU.reduce((s, y) => s + y, 0);
        const yASum = yA.reduce((s, y) => s + y, 0);
        const xyU = xs.reduce((s, x, i) => s + x * yU[i], 0);
        const xyA = xs.reduce((s, x, i) => s + x * yA[i], 0);
        const sU = (n * xyU - xSum * yUSum) / (n * x2Sum - xSum * xSum);
        const iU = (yUSum - sU * xSum) / n;
        const sA = (n * xyA - xSum * yASum) / (n * x2Sum - xSum * xSum);
        const iA = (yASum - sA * xSum) / n;
        predictedUnits  = Math.round(sU * n + iU);
        predictedAmount = Math.round(sA * n + iA);
      }
    }

    const last          = filteredData[filteredData.length - 1];
    const percentChange = last ? Math.round(((predictedUnits  - last.unitsUsed)   / last.unitsUsed)   * 100) : 0;
    const amountChange  = last ? Math.round(((predictedAmount - last.billAmount)  / last.billAmount)  * 100) : 0;
    const confidence    = filteredData.length < 2 ? "Low" : filteredData.length < 4 ? "Medium" : "High";

    let explanation = predictionMethod === "average"
      ? `Based on the simple average of all ${filteredData.length} months equally.`
      : predictionMethod === "weighted"
      ? `Recent months carry more weight, making this estimate forward-leaning.`
      : `Linear regression across ${filteredData.length} data points extrapolates the trend.`;

    if (filteredData.length >= 6) {
      const highest = filteredData.reduce((m, b) => b.unitsUsed > m.unitsUsed ? b : m, filteredData[0]);
      const lowest  = filteredData.reduce((m, b) => b.unitsUsed < m.unitsUsed ? b : m, filteredData[0]);
      if (highest.unitsUsed / lowest.unitsUsed > 1.3)
        explanation += ` Seasonal variation detected — peak was ${highest.billingMonth}.`;
    }

    return { predictedUnits, predictedAmount, percentChange, amountChange, confidence, explanation };
  }, [filteredData, predictionMethod]);

  const nextMonthLabel = useMemo(() => {
    const last = filteredData[filteredData.length - 1];
    if (!last) return "Next Month";
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const [mn, yr] = last.billingMonth.split(" ");
    const ni = (months.indexOf(mn) + 1) % 12;
    return `${months[ni]} ${ni === 0 ? parseInt(yr) + 1 : yr}`;
  }, [filteredData]);

  const chartData = useMemo(() => {
    const data = filteredData.map(b => ({
      month:          b.billingMonth.split(" ")[0].slice(0, 3) + " '" + b.billingMonth.split(" ")[1].slice(2),
      units:          b.unitsUsed,
      amount:         b.billAmount,
      forecast:       null,
      forecastAmount: null,
    }));
    const last = filteredData[filteredData.length - 1];
    if (last) {
      data[data.length - 1] = { ...data[data.length - 1], forecast: last.unitsUsed, forecastAmount: last.billAmount };
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      const [mn, yr] = last.billingMonth.split(" ");
      const ni = (months.indexOf(mn) + 1) % 12;
      const ny = ni === 0 ? parseInt(yr) + 1 : yr;
      data.push({
        month:          months[ni].slice(0, 3) + " '" + String(ny).slice(2) + " ›",
        units:          null,
        amount:         null,
        forecast:       prediction.predictedUnits,
        forecastAmount: prediction.predictedAmount,
      });
    }
    return data;
  }, [filteredData, prediction]);

  const stats = useMemo(() => {
    if (filteredData.length < 2) return null;
    const amounts = filteredData.map(b => b.billAmount);
    const units   = filteredData.map(b => b.unitsUsed);
    const avgAmt  = Math.round(amounts.reduce((s, v) => s + v, 0) / amounts.length);
    const avgUnit = Math.round(units.reduce((s, v) => s + v, 0) / units.length);
    const totalSpend  = amounts.reduce((s, v) => s + v, 0);
    const costPerUnit = filteredData[filteredData.length - 1]
      ? (filteredData[filteredData.length - 1].billAmount / filteredData[filteredData.length - 1].unitsUsed).toFixed(2)
      : 0;
    const recent = filteredData.slice(-3).reduce((s, b) => s + b.unitsUsed, 0) / Math.min(3, filteredData.length);
    const older  = filteredData.slice(0, 3).reduce((s, b) => s + b.unitsUsed, 0) / Math.min(3, filteredData.length);
    const overallTrend = Math.round(((recent - older) / older) * 100);
    return {
      avgAmt, avgUnit, totalSpend, costPerUnit, overallTrend,
      maxAmt:  Math.max(...amounts), minAmt: Math.min(...amounts),
      maxUnit: Math.max(...units),   minUnit: Math.min(...units),
      maxAmtMonth:  filteredData.reduce((m,b) => b.billAmount > m.billAmount ? b : m, filteredData[0]).billingMonth,
      minAmtMonth:  filteredData.reduce((m,b) => b.billAmount < m.billAmount ? b : m, filteredData[0]).billingMonth,
      maxUnitMonth: filteredData.reduce((m,b) => b.unitsUsed > m.unitsUsed ? b : m, filteredData[0]).billingMonth,
      minUnitMonth: filteredData.reduce((m,b) => b.unitsUsed < m.unitsUsed ? b : m, filteredData[0]).billingMonth,
    };
  }, [filteredData]);

  const confColor  = { Low: "#ef4444", Medium: "#f59e0b", High: "#10b981" }[prediction.confidence];
  const isUp       = prediction.percentChange > 0;
  const isAmtUp    = prediction.amountChange  > 0;

  return (
    <div className="pred-page">

      {/* HEADER */}
      <div className="pred-header">
        <div>
          <span className="pred-eyebrow">UTILITY FORECASTING</span>
          <h1 className="pred-title">Bill Predictions</h1>
          <p className="pred-sub">Estimate next month's consumption and cost from your historical data</p>
        </div>
        <div className="next-month-chip">
          <div className="nmc-icon"><CalIcon size={20} /></div>
          <div>
            <span className="chip-label">Forecasting for</span>
            <span className="chip-month">{nextMonthLabel}</span>
          </div>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="pred-controls">
        <div className="utility-toggle">
          <button className={`util-btn ${isElec ? "active elec" : ""}`} onClick={() => setSelectedUtility("Electricity")}>
            <ZapIcon /> Electricity
          </button>
          <button className={`util-btn ${!isElec ? "active water" : ""}`} onClick={() => setSelectedUtility("Water")}>
            <DropIcon /> Water
          </button>
        </div>
        <div className="method-select-wrap">
          <label className="method-label">Method</label>
          <select value={predictionMethod} onChange={e => setPredictionMethod(e.target.value)} className="method-select">
            <option value="average">Simple Average</option>
            <option value="weighted">Weighted Average</option>
            <option value="trend">Linear Trend</option>
          </select>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="no-data">
          <span className="no-data-icon">📭</span>
          <h3>No Data Available</h3>
          <p>Add some {selectedUtility.toLowerCase()} bills to generate predictions.</p>
        </div>
      ) : (
        <>
          {/* HERO */}
          <div className="hero-section">

            {/* Big bill card */}
            <div className="hero-bill-card" style={{ "--hc": utilColor }}>
              <div className="hbc-top">
                <div className="hbc-icon" style={{ background: `${utilColor}15`, color: utilColor }}>
                  {isElec ? <ZapIcon size={26} /> : <DropIcon size={26} />}
                </div>
                <div>
                  <div className="hbc-label">Predicted Bill · {nextMonthLabel}</div>
                  <div className="hbc-conf" style={{ color: confColor }}>
                    <ShieldIcon size={12} /> {prediction.confidence} Confidence
                  </div>
                </div>
              </div>

              <div className="hbc-amount">
                <span className="hbc-cur">LKR</span>
                <span className="hbc-val">{prediction.predictedAmount.toLocaleString()}</span>
              </div>

              <div className="hbc-footer">
                <span className={`hbc-pill ${isAmtUp ? "up" : "down"}`}>
                  {isAmtUp ? <ArrowUpIcon /> : <ArrowDnIcon />}
                  {Math.abs(prediction.amountChange)}% vs last month
                </span>
                <span className="hbc-prev">
                  Last month: LKR {filteredData[filteredData.length - 1]?.billAmount.toLocaleString()}
                </span>
              </div>

              <div className="hbc-bar">
                {[1,2,3,4,5,6].map(i => (
                  <span key={i} className="hbc-seg"
                    style={{ background: filteredData.length >= i ? confColor : "#e2e8f0" }} />
                ))}
                <span className="hbc-bar-label">{filteredData.length} months of data</span>
              </div>
            </div>

            {/* Side cards */}
            <div className="side-cards">
              <div className="side-card">
                <div className="sc-icon" style={{ background: `${utilColor}12`, color: utilColor }}>
                  {isElec ? <ZapIcon size={17} /> : <DropIcon size={17} />}
                </div>
                <div className="sc-body">
                  <span className="sc-label">Predicted Usage</span>
                  <div className="sc-val" style={{ color: utilColor }}>
                    {prediction.predictedUnits}<span className="sc-unit"> {utilUnit}</span>
                  </div>
                  <span className={`sc-change ${isUp ? "up" : "down"}`}>
                    {isUp ? <ArrowUpIcon size={10}/> : <ArrowDnIcon size={10}/>}
                    {Math.abs(prediction.percentChange)}% vs last month
                  </span>
                </div>
              </div>

              {stats && (
                <>
                  <div className="side-card">
                    <div className="sc-icon" style={{ background: "#f59e0b12", color: "#d97706" }}>
                      <BarIcon size={17} />
                    </div>
                    <div className="sc-body">
                      <span className="sc-label">Avg Monthly Bill</span>
                      <div className="sc-val" style={{ color: "#d97706" }}>LKR {stats.avgAmt.toLocaleString()}</div>
                      <span className="sc-sub">Over {filteredData.length} months</span>
                    </div>
                  </div>

                  <div className="side-card">
                    <div className="sc-icon" style={{ background: "#10b98112", color: "#10b981" }}>
                      <SparkIcon size={17} />
                    </div>
                    <div className="sc-body">
                      <span className="sc-label">Rate per {utilUnit}</span>
                      <div className="sc-val" style={{ color: "#059669" }}>LKR {stats.costPerUnit}</div>
                      <span className="sc-sub">Based on last month</span>
                    </div>
                  </div>

                  <div className="side-card">
                    <div className="sc-icon" style={{ background: "#8b5cf612", color: "#8b5cf6" }}>
                      <TrendIcon size={17} />
                    </div>
                    <div className="sc-body">
                      <span className="sc-label">Overall Trend</span>
                      <div className={`sc-val ${stats.overallTrend > 0 ? "trend-up" : "trend-dn"}`}>
                        {stats.overallTrend > 0 ? "+" : ""}{stats.overallTrend}%
                      </div>
                      <span className="sc-sub">Recent vs earlier months</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CHART */}
          <div className="pred-chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Usage & Bill History — with {nextMonthLabel} Forecast</h3>
                <p className="chart-sub">Shaded area is forecast · Dashed line marks the prediction boundary</p>
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="ld" style={{ background: utilColor }} />Usage ({utilUnit})</span>
                <span className="legend-item"><span className="ld" style={{ background: "#f59e0b" }} />Bill (LKR)</span>
                <span className="legend-item"><span className="ld ld-dash" style={{ borderColor: utilColor }} />Forecast</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={utilColor} stopOpacity={0.12}/>
                    <stop offset="95%" stopColor={utilColor} stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.10}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="gF" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={utilColor} stopOpacity={0.22}/>
                    <stop offset="95%" stopColor={utilColor} stopOpacity={0.04}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                <YAxis yAxisId="l" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="r" orientation="right" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip utilUnit={utilUnit} />} />
                <Area yAxisId="l" type="monotone" dataKey="units"  name={`Usage (${utilUnit})`}
                  stroke={utilColor} strokeWidth={2.5} fill="url(#gU)"
                  dot={{ r: 4, fill: utilColor, strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
                <Area yAxisId="r" type="monotone" dataKey="amount" name="Bill (LKR)"
                  stroke="#f59e0b" strokeWidth={2.5} fill="url(#gA)"
                  dot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }} activeDot={{ r: 6 }} connectNulls />
                <Area yAxisId="l" type="monotone" dataKey="forecast" name="Forecast Usage"
                  stroke={utilColor} strokeWidth={2.5} strokeDasharray="7 4" fill="url(#gF)"
                  dot={(props) => {
                    const { cx, cy, index } = props;
                    if (index !== chartData.length - 1) return <g key={index}/>;
                    return <circle key={index} cx={cx} cy={cy} r={7} fill={utilColor} stroke="#fff" strokeWidth={2.5}/>;
                  }}
                  activeDot={{ r: 6 }} connectNulls />
                <Area yAxisId="r" type="monotone" dataKey="forecastAmount" name="Forecast Bill"
                  stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="7 4" fill="url(#gA)"
                  dot={(props) => {
                    const { cx, cy, index } = props;
                    if (index !== chartData.length - 1) return <g key={index}/>;
                    return <circle key={index} cx={cx} cy={cy} r={7} fill="#f59e0b" stroke="#fff" strokeWidth={2.5}/>;
                  }}
                  activeDot={{ r: 6 }} connectNulls />
                {chartData.length > 1 && (
                  <ReferenceLine yAxisId="l" x={chartData[chartData.length - 2]?.month}
                    stroke="#8b5cf6" strokeDasharray="5 4" strokeWidth={1.5}
                    label={{ value: "Forecast →", fill: "#8b5cf6", fontSize: 11, position: "insideTopRight" }} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* BOTTOM */}
          <div className="pred-bottom-grid">

            {stats && (
              <div className="pred-stats-card">
                <h3 className="section-title"><BarIcon /> Historical Statistics</h3>
                <div className="stats-grid">
                  {[
                    { label: "Highest Bill",   val: `LKR ${stats.maxAmt.toLocaleString()}`,  sub: stats.maxAmtMonth,  color: "#ef4444" },
                    { label: "Lowest Bill",    val: `LKR ${stats.minAmt.toLocaleString()}`,  sub: stats.minAmtMonth,  color: "#10b981" },
                    { label: "Highest Usage",  val: `${stats.maxUnit} ${utilUnit}`,          sub: stats.maxUnitMonth, color: utilColor },
                    { label: "Lowest Usage",   val: `${stats.minUnit} ${utilUnit}`,          sub: stats.minUnitMonth, color: "#64748b" },
                    { label: "Avg Monthly",    val: `LKR ${stats.avgAmt.toLocaleString()}`,  sub: `${filteredData.length} months`, color: "#f59e0b" },
                    { label: "Total Spent",    val: `LKR ${stats.totalSpend.toLocaleString()}`, sub: `${filteredData.length} months combined`, color: "#8b5cf6" },
                  ].map((s, i) => (
                    <div key={i} className="stat-tile">
                      <div className="st-val" style={{ color: s.color }}>{s.val}</div>
                      <div className="st-label">{s.label}</div>
                      <div className="st-sub">{s.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pred-explain-card">
              <h3 className="section-title"><InfoIcon /> How This Was Calculated</h3>
              <div className="explain-box">
                <p>{prediction.explanation}</p>
              </div>

              <div className="method-pills">
                {[
                  { key: "average",  label: "📊 Simple Avg" },
                  { key: "weighted", label: "⚖️ Weighted" },
                  { key: "trend",    label: "📈 Trend" },
                ].map(m => (
                  <button key={m.key}
                    className={`method-pill ${predictionMethod === m.key ? "active" : ""}`}
                    style={predictionMethod === m.key ? { background: `${utilColor}14`, color: utilColor, borderColor: `${utilColor}50` } : {}}
                    onClick={() => setPredictionMethod(m.key)}
                  >{m.label}</button>
                ))}
              </div>
              <p className="method-desc">
                {predictionMethod === "average"
                  ? "Treats every month equally. Best for stable, consistent usage with no clear trend."
                  : predictionMethod === "weighted"
                  ? "Gives more weight to recent months. Ideal when usage has been gradually changing."
                  : "Extrapolates the direction of change. Best when there's a clear upward or downward trend."}
              </p>

              {stats && (
                <div className="tip-box">
                  <SparkIcon size={14} />
                  <p>
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