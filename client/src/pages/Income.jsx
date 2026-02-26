// src/pages/Income.jsx
import { useState, useEffect, useMemo, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, Legend,
} from "recharts";
import "./Income.css";

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icons = {
  Zap: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Droplet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  TrendUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  ),
  TrendDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/>
      <polyline points="16 17 22 17 22 11"/>
    </svg>
  ),
  Piggy: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2z"/>
      <path d="M2 9v1a2 2 0 0 0 2 2h1"/><path d="M16 11h.01"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  XCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
};

// ── Animated counter ──────────────────────────────────────────────────────────
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

// ── Toast ─────────────────────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 5500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`ic-toast ic-toast--${type}`}>
      <span>{type === "warning" ? <Icons.AlertTriangle /> : <Icons.XCircle />}</span>
      <p>{message}</p>
      <button onClick={onClose}><Icons.X /></button>
    </div>
  );
};

// ── Custom chart tooltip ──────────────────────────────────────────────────────
const CTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ic-ctip">
      <p className="ic-ctip__label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>LKR {p.value.toLocaleString()}</strong></p>
      ))}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Income() {
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

  const [rawIncome, setRawIncome]   = useState("");
  const [rawElec,   setRawElec]     = useState("3000");
  const [rawWater,  setRawWater]    = useState("1500");
  const [selectedMonth, setSelectedMonth] = useState("November 2025");
  const [toast, setToast]           = useState(null);
  const [flash, setFlash]           = useState(null);

  // Parse helpers — strip commas/spaces, parse to number
  const parseNum = (str) => parseInt(str.replace(/[^0-9]/g, ""), 10) || 0;

  const income = parseNum(rawIncome);
  const budgets = { electricity: parseNum(rawElec), water: parseNum(rawWater) };
  const hasIncome = income > 0;

  // Only allow digit keystrokes (no e, +, -, .)
  const digitsOnly = (e) => {
    if (!/[0-9]/.test(e.key) && !["Backspace","Delete","ArrowLeft","ArrowRight","Tab","Home","End"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const availableMonths = useMemo(() => {
    const months = [...new Set(billsData.map(b => b.billingMonth))];
    const order  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return months.sort((a,b) => order.indexOf(a.split(" ")[0]) - order.indexOf(b.split(" ")[0]));
  }, [billsData]);

  const M = useMemo(() => {
    const mb    = billsData.filter(b => b.billingMonth === selectedMonth);
    const elec  = mb.filter(b => b.utilityType === "Electricity").reduce((s,b) => s+b.billAmount, 0);
    const water = mb.filter(b => b.utilityType === "Water").reduce((s,b) => s+b.billAmount, 0);
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
      const exp = billsData.filter(b => b.billingMonth === month).reduce((s,b) => s+b.billAmount, 0);
      return { month: abbr(month), income, expenses: exp, savings: Math.max(income-exp, 0) };
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
    else if (M.elecPct  > 90) list.push({ type:"warning",  text:`Electricity is at ${M.elecPct.toFixed(1)}% of budget.`  });
    if (M.waterPct > 100) list.push({ type:"critical", text:`Water budget exceeded by ${(M.waterPct-100).toFixed(1)}%.` });
    else if (M.waterPct > 90) list.push({ type:"warning",  text:`Water is at ${M.waterPct.toFixed(1)}% of budget.` });
    if (!list.length) list.push({ type:"success", text:"Both utilities are within budget — great job!" });
    if (income > 0 && M.savings > 0) list.push({ type:"success",  text:`You keep LKR ${M.savings.toLocaleString()} after utility costs this month.` });
    if (income > 0 && M.savings < 0) list.push({ type:"critical", text:`Utilities exceed your income by LKR ${Math.abs(M.savings).toLocaleString()}.` });
    return list;
  }, [M, income]);

  useEffect(() => {
    const alert = insights.find(i => i.type === "critical" || i.type === "warning");
    if (alert && hasIncome) setToast({ message: alert.text, type: alert.type });
  }, [insights, hasIncome]);

  const triggerFlash = (key) => { setFlash(key); setTimeout(() => setFlash(null), 900); };

  const savePct = income > 0 ? Math.max(0, Math.min(((income - M.total) / income) * 100, 100)) : 0;
  const circumference = 2 * Math.PI * 52; // r=52

  const kpis = [
    { label:"Monthly Income",        val:income,        icon:<Icons.Piggy />,    color:"green" },
    { label:"Total Expenses",        val:M.total,       icon:<Icons.TrendUp />,  color:"red"   },
    { label:"Electricity Remaining", val:M.elecRemain,  icon:<Icons.Zap />,      color:"amber" },
    { label:"Water Remaining",       val:M.waterRemain, icon:<Icons.Droplet />,  color:"blue"  },
    { label:"Net Savings",           val:M.savings,     icon:M.savings >= 0 ? <Icons.Piggy /> : <Icons.TrendDown />, color: M.savings >= 0 ? "teal" : "rose" },
  ];

  return (
    <div className="ic">

      {/* ════════════════════════════════════════
          HERO — Salary entry
          ════════════════════════════════════════ */}
      <section className={`ic-hero ${hasIncome ? "ic-hero--filled" : ""}`}>
        <div className="ic-hero__content">

          <div className="ic-hero__badge">Step 1 · Income</div>
          <h1 className="ic-hero__title">What's your monthly take-home salary?</h1>
          <p className="ic-hero__desc">
            Everything below — expenses, savings, budget health — is calculated from this number.
          </p>

          <div className={`ic-hero__field ${flash === "income" ? "ic-hero__field--flash" : ""} ${hasIncome ? "ic-hero__field--ok" : ""}`}>
            <span className="ic-hero__currency">LKR</span>
            <input
              type="text"
              inputMode="numeric"
              className="ic-hero__input"
              placeholder="e.g. 60000"
              value={rawIncome}
              onKeyDown={digitsOnly}
              onChange={e => {
                // strip non-digits so paste is safe too
                const clean = e.target.value.replace(/[^0-9]/g, "");
                setRawIncome(clean);
                if (parseNum(clean) > 0) triggerFlash("income");
              }}
            />
            {hasIncome && (
              <span className="ic-hero__ok"><Icons.Check /></span>
            )}
          </div>

          {hasIncome && (
            <div className="ic-hero__pills">
              <span className="ic-hero__pill ic-hero__pill--red">
                <Icons.TrendUp />
                {M.incPct.toFixed(1)}% on utilities
              </span>
              <span className={`ic-hero__pill ${M.savings >= 0 ? "ic-hero__pill--green" : "ic-hero__pill--rose"}`}>
                {M.savings >= 0 ? <Icons.Piggy /> : <Icons.TrendDown />}
                {M.savings >= 0 ? "Saves" : "Deficit"} LKR {Math.abs(M.savings).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Donut ring */}
        <div className={`ic-hero__ring ${hasIncome ? "ic-hero__ring--visible" : ""}`}>
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" className="ring-track" />
            <circle
              cx="60" cy="60" r="52"
              className={`ring-prog ${M.savings < 0 ? "ring-prog--over" : ""}`}
              strokeDasharray={`${(savePct / 100) * circumference} ${circumference}`}
              strokeDashoffset="0"
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)" }}
            />
          </svg>
          <div className="ring-center">
            <span className="ring-pct">{savePct.toFixed(0)}%</span>
            <span className="ring-label">saved</span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          STEP 2 — Budgets & month
          ════════════════════════════════════════ */}
      <section className="ic-config">
        <div className="ic-config__head">
          <span className="ic-step-badge">Step 2 · Budget Settings</span>
          <p>Set limits per utility, then pick the month you want to review.</p>
        </div>

        <div className="ic-config__fields">
          <div className={`ic-field ${flash === "month" ? "ic-field--flash" : ""}`}>
            <label><Icons.Calendar /> Month</label>
            <select value={selectedMonth} onChange={e => { setSelectedMonth(e.target.value); triggerFlash("month"); }}>
              {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className={`ic-field ic-field--elec ${flash === "electricity" ? "ic-field--flash" : ""}`}>
            <label><Icons.Zap /> Electricity Budget</label>
            <div className="ic-field__wrap">
              <span className="ic-field__pfx">LKR</span>
              <input type="text" inputMode="numeric" value={rawElec}
                onKeyDown={digitsOnly}
                onChange={e => {
                  const clean = e.target.value.replace(/[^0-9]/g, "");
                  setRawElec(clean);
                  triggerFlash("electricity");
                }} />
            </div>
            <div className="ic-field__hint">
              {M.elecPct.toFixed(1)}% used &nbsp;·&nbsp; LKR {(budgets.electricity - M.elec).toLocaleString()} remaining
            </div>
          </div>

          <div className={`ic-field ic-field--water ${flash === "water" ? "ic-field--flash" : ""}`}>
            <label><Icons.Droplet /> Water Budget</label>
            <div className="ic-field__wrap">
              <span className="ic-field__pfx">LKR</span>
              <input type="text" inputMode="numeric" value={rawWater}
                onKeyDown={digitsOnly}
                onChange={e => {
                  const clean = e.target.value.replace(/[^0-9]/g, "");
                  setRawWater(clean);
                  triggerFlash("water");
                }} />
            </div>
            <div className="ic-field__hint">
              {M.waterPct.toFixed(1)}% used &nbsp;·&nbsp; LKR {(budgets.water - M.water).toLocaleString()} remaining
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          DASHBOARD (gated behind income entry)
          ════════════════════════════════════════ */}
      {hasIncome ? (
        <div className="ic-dashboard">

          {/* KPIs */}
          <section className="ic-kpis">
            {kpis.map(({ label, val, icon, color }) => (
              <div key={label} className={`ic-kpi ic-kpi--${color}`}>
                <span className="ic-kpi__icon">{icon}</span>
                <div className="ic-kpi__body">
                  <p className="ic-kpi__label">{label}</p>
                  <p className="ic-kpi__val">
                    LKR <AnimNum value={Math.abs(val)} />
                    {val < 0 && <em> deficit</em>}
                  </p>
                </div>
              </div>
            ))}
          </section>

          {/* Budget progress bars */}
          <section className="ic-bars">
            {[
              { key:"electricity", label:"Electricity", icon:<Icons.Zap />, pct:M.elecPct,  exp:M.elec,  bud:budgets.electricity },
              { key:"water",       label:"Water",       icon:<Icons.Droplet />, pct:M.waterPct, exp:M.water, bud:budgets.water },
            ].map(({ key, label, icon, pct, exp, bud }) => {
              const s = pct > 100 ? "over" : pct > 90 ? "warn" : "ok";
              return (
                <div key={key} className={`ic-bar-card ic-bar-card--${key}`}>
                  <div className="ic-bar-card__head">
                    <span className="ic-bar-card__icon">{icon}</span>
                    <span className="ic-bar-card__name">{label}</span>
                    <span className={`ic-bar-card__badge ic-bar-card__badge--${s}`}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="ic-bar-track">
                    <div className={`ic-bar-fill ic-bar-fill--${s}`} style={{ width:`${Math.min(pct,100)}%` }} />
                  </div>
                  <div className="ic-bar-card__foot">
                    <span>LKR {exp.toLocaleString()} spent</span>
                    <span>LKR {(bud - exp).toLocaleString()} left of LKR {bud.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Charts */}
          <section className="ic-charts">
            <div className="ic-chart">
              <h3>Income vs Expenses</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize:12, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:12, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CTip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:12 }} />
                  <Bar dataKey="income"   name="Income"   fill="#10b981" radius={[5,5,0,0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[5,5,0,0]} />
                  <Bar dataKey="savings"  name="Savings"  fill="#3b82f6" radius={[5,5,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="ic-chart">
              <h3>Budget History</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={historyData}>
                  <defs>
                    <linearGradient id="gElec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25}/>
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize:12, fill:"#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:12, fill:"#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(1)}k`} />
                  <Tooltip content={<CTip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize:12 }} />
                  <Area type="monotone" dataKey="electricity" name="Electricity" stroke="#f59e0b" strokeWidth={2} fill="url(#gElec)" dot={{ r:4, fill:"#f59e0b" }} />
                  <Area type="monotone" dataKey="water"       name="Water"       stroke="#3b82f6" strokeWidth={2} fill="url(#gWater)" dot={{ r:4, fill:"#3b82f6" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Insights */}
          <section className="ic-insights">
            <div className="ic-insights__head">
              <h3>Financial Insights</h3>
              <button className="ic-export-btn" onClick={() => {
                const rows = [
                  [`Budget Report — ${selectedMonth}`],[],
                  ["Monthly Income", income],[],
                  ["Utility","Budget","Expenses","Remaining"],
                  ["Electricity", budgets.electricity, M.elec,  M.elecRemain],
                  ["Water",       budgets.water,       M.water, M.waterRemain],
                  ["Net Savings", M.savings],
                ];
                const csv = rows.map(r => r.join(",")).join("\n");
                const blob = new Blob([csv], { type:"text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `budget_${selectedMonth.replace(" ","_")}.csv`;
                a.style.display="none"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
              }}>
                <Icons.Download /> Export CSV
              </button>
            </div>
            <div className="ic-insights__list">
              {insights.map((ins, i) => (
                <div key={i} className={`ic-insight ic-insight--${ins.type}`}>
                  <span>{ins.type==="success" ? <Icons.Check /> : ins.type==="warning" ? <Icons.AlertTriangle /> : <Icons.XCircle />}</span>
                  <p>{ins.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="ic-empty">
          <div className="ic-empty__icon"><Icons.Piggy /></div>
          <h2>Your dashboard is waiting</h2>
          <p>Type your monthly salary in the field above — your full budget breakdown, savings ring, charts, and insights will all appear instantly.</p>
          <div className="ic-empty__arrow">↑ Start there</div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="ic-toast-wrap">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
}