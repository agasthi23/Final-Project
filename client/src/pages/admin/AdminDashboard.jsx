// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FiUsers, FiZap, FiDroplet, FiDollarSign,
  FiActivity, FiAlertCircle, FiCheckCircle,
  FiClock, FiAlertTriangle,
  FiRefreshCw, FiTrendingUp, FiTrendingDown,
} from "react-icons/fi";
import { adminAPI, tariffAPI } from "../../services/api";

/* ─── Font & Animations ─── */
if (!document.getElementById("db-font")) {
  const l = document.createElement("link");
  l.id = "db-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.getElementById("adm-dash-anim")) {
  const s = document.createElement("style");
  s.id = "adm-dash-anim";
  s.textContent = `
    @keyframes admFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
    .ad-fu1{animation:admFadeUp .4s .05s ease both}
    .ad-fu2{animation:admFadeUp .4s .10s ease both}
    .ad-fu3{animation:admFadeUp .4s .15s ease both}
    .ad-fu4{animation:admFadeUp .4s .20s ease both}
    .ad-fu5{animation:admFadeUp .4s .25s ease both}
    .ad-kpi:hover { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .ad-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .ad-refresh:hover { transform:rotate(180deg); background:#f0f2f7!important; }
    @keyframes spin { to { transform: rotate(360deg) } }
    .skeleton { animation: pulse 1.5s ease-in-out infinite; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; }
  `;
  document.head.appendChild(s);
}

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";
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
  s2:"0 4px 16px rgba(15,23,42,.08)",
  s3:"0 12px 40px rgba(15,23,42,.10)",
};
const ax = { fill: C.faint, fontSize: 11, fontFamily: F };

const EMPTY_STATS = {
  totalUsers: 0, activeUsers: 0, newThisMonth: 0,
  totalBills: 0, billsThisMonth: 0,
  totalRevenue: 0, revenueChange: 0,
  electricityAvg: 0, waterAvg: 0, systemAlerts: 0,
};

// ── Improved unwrap helpers matching backend response ──
const unwrapArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.monthlyStats)) return raw.monthlyStats;
  if (Array.isArray(raw?.activity)) return raw.activity;
  if (Array.isArray(raw?.records)) return raw.records;
  return [];
};

const unwrapStats = (raw) => {
  const s = raw?.stats ?? raw?.data ?? raw ?? {};
  return {
    totalUsers:      Number(s.totalUsers) || 0,
    activeUsers:     Number(s.activeUsers) || Number(s.totalUsers) || 0,
    newThisMonth:    Number(s.newThisMonth) || 0,
    totalBills:      Number(s.totalBills) || 0,
    billsThisMonth:  Number(s.billsThisMonth) || 0,
    electricityAvg:  Number(s.electricityAvg) || 0,
    waterAvg:        Number(s.waterAvg) || 0,
    totalRevenue:    Number(s.totalSpend) || Number(s.totalRevenue) || 0,
    revenueChange:   Number(s.spendChange) || Number(s.revenueChange) || 0,
    systemAlerts:    Number(s.systemAlerts) || 0,
  };
};

const unwrapTariff = (raw) => {
  if (raw?.tariff) return raw.tariff;
  if (raw?.data) return raw.data;
  if (raw?.utilityType) return raw;
  return null;
};

const formatElecRange = (tiers = []) => {
  if (!tiers || !tiers.length) return "—";
  const rates = tiers.map(t => t?.ratePerUnit).filter(Boolean);
  if (!rates.length) return "—";
  const min = Math.min(...rates).toFixed(2);
  const max = Math.max(...rates).toFixed(2);
  return min === max ? `Rs. ${min}/unit` : `Rs. ${min} – ${max}/unit`;
};

const formatWaterRate = (tiers = []) => {
  if (!tiers || !tiers.length) return "—";
  const rate = Number(tiers[0]?.ratePerUnit);
  return isNaN(rate) ? "—" : `Rs. ${rate.toFixed(2)}/unit`;
};

const formatEffectiveFrom = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch { return "—"; }
};

// ── Helper to display "—" when average is zero ──
const formatAvg = (value) => {
  if (!value || value === 0) return { display: "—", sub: "No bills this month" };
  return { display: `Rs. ${value.toLocaleString()}`, sub: "Current month average" };
};

// ── Skeleton Loader ──
const SkeletonKPICard = () => (
  <div className="skeleton" style={{ 
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 14,
    padding: "20px 22px", display: "flex", gap: 16, alignItems: "flex-start"
  }}>
    <div style={{ width: 44, height: 44, borderRadius: 12, background: "#e2e8f0" }} />
    <div style={{ flex: 1 }}>
      <div style={{ height: 12, width: 100, background: "#e2e8f0", borderRadius: 6, marginBottom: 8 }} />
      <div style={{ height: 28, width: 80, background: "#e2e8f0", borderRadius: 8, marginBottom: 6 }} />
      <div style={{ height: 10, width: 120, background: "#e2e8f0", borderRadius: 5 }} />
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
      padding: "10px 14px", boxShadow: C.s3, fontFamily: F, minWidth: 150 }}>
      <p style={{ fontSize: "0.7rem", fontWeight: 700, color: C.muted,
        margin: "0 0 7px", textTransform: "uppercase" }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8,
          marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2,
            background: p.color, display: "inline-block" }}/>
          <span style={{ fontSize: "0.75rem", color: C.muted, flex: 1 }}>{p.name}</span>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: C.ink }}>
            {p.dataKey === "users" ? p.value : `Rs. ${Number(p.value).toLocaleString()}`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const [stats,       setStats]       = useState(EMPTY_STATS);
  const [monthlyData, setMonthlyData] = useState([]);
  const [activity,    setActivity]    = useState([]);
  const [elecTariff,  setElecTariff]  = useState(null);
  const [waterTariff, setWaterTariff] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    
    try {
      const [statsRes, monthlyRes, activityRes, elecRes, waterRes] = await Promise.allSettled([
        adminAPI.getStats(),
        adminAPI.getMonthlyStats(),
        adminAPI.getRecentActivity(),
        tariffAPI.getActive({ params: { type: "electricity" } }),
        tariffAPI.getActive({ params: { type: "water" } }),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value?.data) {
        setStats({ ...EMPTY_STATS, ...unwrapStats(statsRes.value.data) });
      } else {
        console.error("Stats fetch failed:", statsRes.reason);
      }

      if (monthlyRes.status === "fulfilled" && monthlyRes.value?.data) {
        const monthly = unwrapArray(monthlyRes.value.data);
        setMonthlyData(monthly.map(item => ({
          month: item.month || "Unknown",
          electricity: Number(item.electricity) || 0,
          water: Number(item.water) || 0,
          users: Number(item.users) || 0,
        })));
      } else {
        console.error("Monthly stats fetch failed:", monthlyRes.reason);
      }

      if (activityRes.status === "fulfilled" && activityRes.value?.data) {
        const acts = unwrapArray(activityRes.value.data);
        setActivity(acts.slice(0, 10));
      } else {
        console.error("Activity fetch failed:", activityRes.reason);
      }

      if (elecRes.status === "fulfilled" && elecRes.value?.data) {
        setElecTariff(unwrapTariff(elecRes.value.data));
      }
      if (waterRes.status === "fulfilled" && waterRes.value?.data) {
        setWaterTariff(unwrapTariff(waterRes.value.data));
      }

      setLastUpdated(new Date());
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Unknown error";
      setError(`Failed to load dashboard data: ${msg}`);
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleRefresh = () => fetchAll(true);

  const activityIcon = {
    bill:   { icon: <FiCheckCircle size={14}/>, color: C.green, bg: C.greenL },
    user:   { icon: <FiUsers size={14}/>,       color: C.blue,  bg: C.blueL  },
    tariff: { icon: <FiZap size={14}/>,         color: C.amber, bg: C.amberL },
    alert:  { icon: <FiAlertCircle size={14}/>, color: C.red,   bg: C.redL   },
  };

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} onRetry={handleRefresh} />;

  const activeRate = stats.totalUsers > 0 ? Math.round((stats.activeUsers / stats.totalUsers) * 100) : 0;
  const elecAvgDisplay = formatAvg(stats.electricityAvg);
  const waterAvgDisplay = formatAvg(stats.waterAvg);

  const kpis = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), sub: `+${stats.newThisMonth} this month`, icon: <FiUsers size={20}/>, accent: C.blue, bg: C.blueL, bdr: C.blueM, trend: "up" },
    { label: "Bills This Month", value: stats.billsThisMonth.toLocaleString(), sub: `${stats.totalBills.toLocaleString()} total`, icon: <FiActivity size={20}/>, accent: C.violet, bg: C.violetL, bdr: C.violetM, trend: "up" },
    { label: "Avg Electricity Bill", value: elecAvgDisplay.display, sub: elecAvgDisplay.sub, icon: <FiZap size={20}/>, accent: C.amber, bg: C.amberL, bdr: C.amberM, trend: "down" },
    { label: "Avg Water Bill", value: waterAvgDisplay.display, sub: waterAvgDisplay.sub, icon: <FiDroplet size={20}/>, accent: C.teal, bg: C.tealL, bdr: C.tealM, trend: "down" },
    { label: "Total Revenue", value: stats.totalRevenue >= 1000 ? `Rs. ${(stats.totalRevenue / 1000).toFixed(1)}k` : `Rs. ${stats.totalRevenue.toLocaleString()}`, sub: stats.revenueChange !== 0 ? `${stats.revenueChange > 0 ? "+" : ""}${stats.revenueChange}% vs last month` : "All time", icon: <FiDollarSign size={20}/>, accent: C.green, bg: C.greenL, bdr: C.greenM, trend: stats.revenueChange >= 0 ? "up" : "down" },
    { label: "System Alerts", value: stats.systemAlerts, sub: stats.systemAlerts === 0 ? "All systems operational" : "Requires attention", icon: <FiAlertCircle size={20}/>, accent: stats.systemAlerts > 0 ? C.red : C.green, bg: stats.systemAlerts > 0 ? C.redL : C.greenL, bdr: stats.systemAlerts > 0 ? C.redM : C.greenM, trend: null },
  ];

  return (
    <div style={{ padding: "28px 32px 64px", fontFamily: F }}>
      {/* Header with Refresh */}
      <div className="ad-fu1" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: C.ink, margin: "0 0 5px", letterSpacing: "-0.03em" }}>Admin Dashboard</h1>
            <p style={{ fontSize: "0.85rem", color: C.muted, margin: 0 }}>System overview — Last updated: {lastUpdated.toLocaleTimeString()}</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {stats.systemAlerts > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 12, background: C.redL, border: `1px solid ${C.redM}` }}>
                <FiAlertCircle size={15} color={C.red}/>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: C.red }}>{stats.systemAlerts} alert{stats.systemAlerts !== 1 ? "s" : ""}</span>
              </div>
            )}
            <button onClick={handleRefresh} disabled={refreshing} className="ad-refresh" style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.card, fontFamily: F, fontSize: "0.8rem", fontWeight: 600, color: C.muted, cursor: refreshing ? "not-allowed" : "pointer", transition: "all .3s ease" }}>
              <FiRefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="ad-fu2" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>
        {kpis.map((k, i) => (
          <div key={i} className="ad-kpi" style={{ background: C.card, border: `1px solid ${C.border}`, borderTop: `3px solid ${k.accent}`, borderRadius: 14, padding: "20px 22px", display: "flex", gap: 16, alignItems: "flex-start", boxShadow: C.s1, transition: "transform .2s, box-shadow .2s" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: k.bg, border: `1px solid ${k.bdr}`, color: k.accent }}>{k.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted, margin: "0 0 5px" }}>{k.label}</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 800, color: C.ink, margin: "0 0 4px", letterSpacing: "-0.02em", lineHeight: 1 }}>{k.value}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {k.trend && (k.trend === "up" ? <FiTrendingUp size={11} color={C.green}/> : <FiTrendingDown size={11} color={C.red}/>)}
                <span style={{ fontSize: "0.7rem", color: C.faint }}>{k.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="ad-fu3" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginBottom: 24 }}>
        {/* Monthly Bill Averages */}
        <div className="ad-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px", boxShadow: C.s1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div><h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, margin: "0 0 3px" }}>Monthly Bill Averages</h3><p style={{ fontSize: "0.72rem", color: C.muted, margin: 0 }}>Electricity vs Water — system-wide averages</p></div>
            <div style={{ display: "flex", gap: 14, fontSize: "0.72rem", color: C.muted }}><span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: C.amber }} /> Electricity</span><span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal }} /> Water</span></div>
          </div>
          {monthlyData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs><linearGradient id="agE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.amber} stopOpacity={0.15}/><stop offset="95%" stopColor={C.amber} stopOpacity={0}/></linearGradient><linearGradient id="agW" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.teal} stopOpacity={0.15}/><stop offset="95%" stopColor={C.teal} stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Area type="monotone" dataKey="electricity" name="Electricity" stroke={C.amber} strokeWidth={2.5} fill="url(#agE)" dot={{ r: 4, fill: C.amber, strokeWidth: 0 }}/>
                <Area type="monotone" dataKey="water" name="Water" stroke={C.teal} strokeWidth={2.5} fill="url(#agW)" dot={{ r: 4, fill: C.teal, strokeWidth: 0 }}/>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* User Growth */}
        <div className="ad-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px", boxShadow: C.s1 }}>
          <div style={{ marginBottom: 18 }}><h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, margin: "0 0 3px" }}>User Growth</h3><p style={{ fontSize: "0.72rem", color: C.muted, margin: 0 }}>Total registered users per month</p></div>
          {monthlyData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barSize={22} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
                <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
                <YAxis tick={ax} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="users" name="Users" fill={C.blue} radius={[5, 5, 0, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="ad-fu4" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 18 }}>
        {/* Recent Activity */}
        <div className="ad-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "22px 24px", boxShadow: C.s1 }}>
          <div style={{ marginBottom: 18 }}><h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: C.ink, margin: "0 0 3px" }}>Recent Activity</h3><p style={{ fontSize: "0.72rem", color: C.muted, margin: 0 }}>Latest system events</p></div>
          {activity.length === 0 ? <EmptyActivity /> : (
            <div style={{ display: "flex", flexDirection: "column", maxHeight: 400, overflowY: "auto" }}>
              {activity.map((item, i) => {
                const ic = activityIcon[item.type] || activityIcon.bill;
                return (
                  <div key={item.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < activity.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: ic.bg, color: ic.color }}>{ic.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}><span style={{ fontSize: "0.82rem", fontWeight: 600, color: C.ink }}>{item.user || "System"}</span><span style={{ fontSize: "0.78rem", color: C.muted }}>{item.action || item.message}</span></div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}><FiClock size={11} color={C.faint}/><span style={{ fontSize: "0.7rem", color: C.faint }}>{item.time || item.createdAt}</span>{item.amount != null && <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.green, fontFamily: "monospace" }}>Rs. {Number(item.amount).toLocaleString()}</span>}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Active User Rate */}
          <div className="ad-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px", boxShadow: C.s1 }}>
            <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: C.ink, margin: "0 0 14px" }}>Active User Rate</h3>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}><span style={{ fontSize: "2rem", fontWeight: 800, color: C.blue, letterSpacing: "-1px" }}>{activeRate}%</span><span style={{ fontSize: "0.78rem", color: C.muted }}>{stats.activeUsers.toLocaleString()} of {stats.totalUsers.toLocaleString()} users active</span></div>
            <div style={{ height: 8, background: C.hover, borderRadius: 999, overflow: "hidden" }}><div style={{ height: "100%", borderRadius: 999, width: `${activeRate}%`, background: `linear-gradient(90deg,${C.blue},#818cf8)`, transition: "width .6s ease" }} /></div>
          </div>
          {/* Active Tariff Snapshot */}
          <div className="ad-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px", boxShadow: C.s1 }}>
            <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: C.ink, margin: "0 0 14px" }}>Active Tariff Snapshot</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: C.amberL, borderRadius: 10, border: `1px solid ${C.amberM}` }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><FiZap size={14} color={C.amber}/><span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.amber }}>Electricity</span></div><span style={{ fontSize: "0.78rem", fontWeight: 700, color: C.ink, fontFamily: "monospace" }}>{elecTariff?.tiers ? formatElecRange(elecTariff.tiers) : "No tariff set"}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: C.tealL, borderRadius: 10, border: `1px solid ${C.tealM}` }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><FiDroplet size={14} color={C.teal}/><span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.teal }}>Water</span></div><span style={{ fontSize: "0.78rem", fontWeight: 700, color: C.ink, fontFamily: "monospace" }}>{waterTariff?.tiers ? formatWaterRate(waterTariff.tiers) : "No tariff set"}</span></div>
              <p style={{ fontSize: "0.68rem", color: C.faint, margin: 0, textAlign: "right" }}>{elecTariff?.effectiveFrom ? `Effective from ${formatEffectiveFrom(elecTariff.effectiveFrom)}` : waterTariff?.effectiveFrom ? `Effective from ${formatEffectiveFrom(waterTariff.effectiveFrom)}` : "No active tariff"}</p>
            </div>
          </div>
          {/* System Health */}
          <div className="ad-card" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 22px", boxShadow: C.s1 }}>
            <h3 style={{ fontSize: "0.82rem", fontWeight: 700, color: C.ink, margin: "0 0 14px" }}>System Health</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[{ label: "API Response", status: "Healthy", color: C.green }, { label: "Database", status: "Healthy", color: C.green }, { label: "ML Service", status: "Standby", color: C.amber }, { label: "Tariff Engine", status: elecTariff ? "Active" : "Inactive", color: elecTariff ? C.green : C.red }].map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: "0.78rem", color: C.muted }}>{s.label}</span><span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", fontWeight: 700, color: s.color }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />{s.status}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents
const LoadingSkeleton = () => (
  <div style={{ padding: "28px 32px", fontFamily: F }}>
    <div className="ad-fu1" style={{ marginBottom: 24 }}><div className="skeleton" style={{ height: 32, width: 250, background: "#e2e8f0", borderRadius: 8, marginBottom: 8 }} /><div className="skeleton" style={{ height: 16, width: 180, background: "#e2e8f0", borderRadius: 6 }} /></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 24 }}>{[...Array(6)].map((_, i) => <SkeletonKPICard key={i} />)}</div>
    <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18, marginBottom: 24 }}><div className="skeleton" style={{ height: 300, background: C.card, borderRadius: 16 }} /><div className="skeleton" style={{ height: 300, background: C.card, borderRadius: 16 }} /></div>
  </div>
);

const ErrorState = ({ error, onRetry }) => (
  <div style={{ padding: "28px 32px", fontFamily: F, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center" }}>
    <div style={{ width: 80, height: 80, borderRadius: 40, background: C.redL, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><FiAlertTriangle size={40} color={C.red} /></div>
    <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: C.ink, marginBottom: 8 }}>Unable to Load Dashboard</h2>
    <p style={{ fontSize: "0.875rem", color: C.muted, marginBottom: 20, maxWidth: 400 }}>{error}</p>
    <button onClick={onRetry} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: C.blue, color: "#fff", fontFamily: F, fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}><FiRefreshCw size={16} /> Try Again</button>
    <p style={{ fontSize: "0.72rem", color: C.faint, marginTop: 20 }}>Check the browser console (F12 → Console) for full error details.</p>
  </div>
);

const EmptyChart = () => (
  <div style={{ height: 240, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: C.faint, fontSize: "0.82rem" }}>
    <FiAlertCircle size={32} />
    <p>No monthly data available yet.</p>
    <p style={{ fontSize: "0.72rem" }}>Add some bills to see trends here.</p>
  </div>
);

const EmptyActivity = () => (
  <div style={{ textAlign: "center", padding: "48px 20px" }}>
    <FiClock size={32} color={C.faint} style={{ marginBottom: 12 }} />
    <p style={{ fontSize: "0.82rem", color: C.faint, margin: 0 }}>No recent activity.</p>
    <p style={{ fontSize: "0.72rem", color: C.faint, marginTop: 4 }}>Activity will appear here as users interact with the system.</p>
  </div>
);