// src/pages/admin/AdminDashboard.jsx
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  FiUsers, FiZap, FiDroplet, FiDollarSign,
  FiActivity, FiAlertCircle, FiCheckCircle,
  FiClock, FiArrowUp, FiArrowDown,
} from "react-icons/fi";

/* ─── Font ─── */
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
    .ad-fu1{animation:admFadeUp .4s .05s ease both}
    .ad-fu2{animation:admFadeUp .4s .10s ease both}
    .ad-fu3{animation:admFadeUp .4s .15s ease both}
    .ad-fu4{animation:admFadeUp .4s .20s ease both}
    .ad-fu5{animation:admFadeUp .4s .25s ease both}
    .ad-kpi:hover { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
    .ad-card:hover { box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
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
const ax = { fill:C.faint, fontSize:11, fontFamily:F };

/* ── Mock data (will come from API) ── */
const MOCK_STATS = {
  totalUsers:     124,
  activeUsers:    98,
  newThisMonth:   12,
  totalBills:     1847,
  billsThisMonth: 203,
  totalRevenue:   486200,
  revenueChange:  8.4,
  electricityAvg: 3020,
  waterAvg:       890,
  systemAlerts:   2,
};

const MONTHLY_BILLS = [
  { month:"Jun", electricity:2750, water:880,  users:88  },
  { month:"Jul", electricity:2950, water:960,  users:91  },
  { month:"Aug", electricity:3250, water:1040, users:95  },
  { month:"Sep", electricity:3000, water:920,  users:98  },
  { month:"Oct", electricity:2820, water:840,  users:105 },
  { month:"Nov", electricity:2650, water:800,  users:112 },
  { month:"Dec", electricity:2900, water:860,  users:124 },
];

const RECENT_ACTIVITY = [
  { id:1, user:"Sarah K.",   action:"Added electricity bill",  amount:2850, time:"2 min ago",   type:"bill",  status:"ok"   },
  { id:2, user:"James P.",   action:"Registered account",      amount:null, time:"18 min ago",  type:"user",  status:"ok"   },
  { id:3, user:"Admin",      action:"Updated tariff rates",    amount:null, time:"1 hr ago",    type:"tariff",status:"warn" },
  { id:4, user:"Maria L.",   action:"Added water bill",        amount:920,  time:"2 hrs ago",   type:"bill",  status:"ok"   },
  { id:5, user:"Tom R.",     action:"Failed login attempt",    amount:null, time:"3 hrs ago",   type:"alert", status:"err"  },
  { id:6, user:"Priya S.",   action:"Added electricity bill",  amount:3100, time:"4 hrs ago",   type:"bill",  status:"ok"   },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:10,
      padding:"10px 14px", boxShadow:C.s3, fontFamily:F, minWidth:150 }}>
      <p style={{ fontSize:"0.7rem", fontWeight:700, color:C.muted,
        margin:"0 0 7px", textTransform:"uppercase" }}>{label}</p>
      {payload.map((p,i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:8,
          marginBottom:i<payload.length-1?4:0 }}>
          <span style={{ width:8, height:8, borderRadius:2,
            background:p.color, display:"inline-block" }}/>
          <span style={{ fontSize:"0.75rem", color:C.muted, flex:1 }}>{p.name}</span>
          <span style={{ fontSize:"0.8rem", fontWeight:700, color:C.ink }}>
            {p.dataKey==="users" ? p.value : `Rs. ${p.value.toLocaleString()}`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const kpis = [
    {
      label:"Total Users", value:MOCK_STATS.totalUsers,
      sub:`+${MOCK_STATS.newThisMonth} this month`,
      icon:<FiUsers size={20}/>, accent:C.blue, bg:C.blueL, bdr:C.blueM,
      trend:"up",
    },
    {
      label:"Bills This Month", value:MOCK_STATS.billsThisMonth,
      sub:`${MOCK_STATS.totalBills} total`,
      icon:<FiActivity size={20}/>, accent:C.violet, bg:C.violetL, bdr:C.violetM,
      trend:"up",
    },
    {
      label:"Avg Electricity Bill", value:`Rs. ${MOCK_STATS.electricityAvg.toLocaleString()}`,
      sub:"Current month average",
      icon:<FiZap size={20}/>, accent:C.amber, bg:C.amberL, bdr:C.amberM,
      trend:"down",
    },
    {
      label:"Avg Water Bill", value:`Rs. ${MOCK_STATS.waterAvg.toLocaleString()}`,
      sub:"Current month average",
      icon:<FiDroplet size={20}/>, accent:C.teal, bg:C.tealL, bdr:C.tealM,
      trend:"down",
    },
    {
      label:"Total Spend Tracked", value:`Rs. ${(MOCK_STATS.totalRevenue/1000).toFixed(0)}k`,
      sub:`+${MOCK_STATS.revenueChange}% vs last month`,
      icon:<FiDollarSign size={20}/>, accent:C.green, bg:C.greenL, bdr:C.greenM,
      trend:"up",
    },
    {
      label:"System Alerts", value:MOCK_STATS.systemAlerts,
      sub:"Requires attention",
      icon:<FiAlertCircle size={20}/>, accent:C.red, bg:C.redL, bdr:C.redM,
      trend:null,
    },
  ];

  const activityIcon = {
    bill:   { icon:<FiCheckCircle size={14}/>, color:C.green,  bg:C.greenL  },
    user:   { icon:<FiUsers size={14}/>,       color:C.blue,   bg:C.blueL   },
    tariff: { icon:<FiZap size={14}/>,         color:C.amber,  bg:C.amberL  },
    alert:  { icon:<FiAlertCircle size={14}/>, color:C.red,    bg:C.redL    },
  };

  return (
    <div style={{ padding:"28px 32px 64px", fontFamily:F }}>

      {/* ── HEADER ── */}
      <div className="ad-fu1" style={{ marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"flex-start",
          justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:C.ink,
              margin:"0 0 5px", letterSpacing:"-0.03em" }}>Admin Dashboard</h1>
            <p style={{ fontSize:"0.85rem", color:C.muted, margin:0 }}>
              System overview — {new Date().toLocaleDateString("en-US",{ month:"long", year:"numeric" })}
            </p>
          </div>
          {/* Alert badge */}
          {MOCK_STATS.systemAlerts > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:8,
              padding:"8px 16px", borderRadius:12, background:C.redL,
              border:`1px solid ${C.redM}` }}>
              <FiAlertCircle size={15} color={C.red}/>
              <span style={{ fontSize:"0.8rem", fontWeight:700, color:C.red }}>
                {MOCK_STATS.systemAlerts} alerts need attention
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── KPI GRID — 3×2 ── */}
      <div className="ad-fu2" style={{ display:"grid",
        gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
        {kpis.map((k,i) => (
          <div key={i} className="ad-kpi"
            style={{ background:C.card, border:`1px solid ${C.border}`,
              borderTop:`3px solid ${k.accent}`, borderRadius:14,
              padding:"20px 22px", display:"flex", gap:16, alignItems:"flex-start",
              boxShadow:C.s1, transition:"transform .2s, box-shadow .2s" }}>
            <div style={{ width:44, height:44, borderRadius:12, flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:k.bg, border:`1px solid ${k.bdr}`, color:k.accent }}>
              {k.icon}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase",
                letterSpacing:"0.08em", color:C.muted, margin:"0 0 5px" }}>{k.label}</p>
              <p style={{ fontSize:"1.5rem", fontWeight:800, color:C.ink,
                margin:"0 0 4px", letterSpacing:"-0.02em", lineHeight:1 }}>
                {k.value}
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                {k.trend && (
                  <span style={{ color:k.trend==="up"?C.green:C.red, display:"flex" }}>
                    {k.trend==="up" ? <FiArrowUp size={11}/> : <FiArrowDown size={11}/>}
                  </span>
                )}
                <span style={{ fontSize:"0.7rem", color:C.faint }}>{k.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="ad-fu3" style={{ display:"grid",
        gridTemplateColumns:"1.6fr 1fr", gap:18, marginBottom:24 }}>

        {/* Bills trend */}
        <div className="ad-card" style={{ background:C.card, border:`1px solid ${C.border}`,
          borderRadius:16, padding:"22px 24px", boxShadow:C.s1, transition:"box-shadow .2s" }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"flex-start", marginBottom:18, flexWrap:"wrap", gap:10 }}>
            <div>
              <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>
                Monthly Bill Averages
              </h3>
              <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>
                Electricity vs Water — system-wide averages
              </p>
            </div>
            <div style={{ display:"flex", gap:14, fontSize:"0.72rem", color:C.muted }}>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ width:8, height:8, borderRadius:"50%",
                  background:C.amber, display:"inline-block" }}/>
                Electricity
              </span>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                <span style={{ width:8, height:8, borderRadius:"50%",
                  background:C.teal, display:"inline-block" }}/>
                Water
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={MONTHLY_BILLS} margin={{ top:5, right:10, left:0, bottom:0 }}>
              <defs>
                <linearGradient id="agE" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.amber} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={C.amber} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="agW" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.teal} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={C.teal} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="electricity" name="Electricity"
                stroke={C.amber} strokeWidth={2.5} fill="url(#agE)"
                dot={{ r:4, fill:C.amber, strokeWidth:0 }}/>
              <Area type="monotone" dataKey="water" name="Water"
                stroke={C.teal} strokeWidth={2.5} fill="url(#agW)"
                dot={{ r:4, fill:C.teal, strokeWidth:0 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* User growth */}
        <div className="ad-card" style={{ background:C.card, border:`1px solid ${C.border}`,
          borderRadius:16, padding:"22px 24px", boxShadow:C.s1, transition:"box-shadow .2s" }}>
          <div style={{ marginBottom:18 }}>
            <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>
              User Growth
            </h3>
            <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>
              Total registered users per month
            </p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={MONTHLY_BILLS} barSize={22}
              margin={{ top:5, right:10, left:0, bottom:0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#eaecf2" vertical={false}/>
              <XAxis dataKey="month" tick={ax} axisLine={false} tickLine={false}/>
              <YAxis tick={ax} axisLine={false} tickLine={false}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="users" name="Users" fill={C.blue} radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── BOTTOM ROW — activity + quick stats ── */}
      <div className="ad-fu4" style={{ display:"grid",
        gridTemplateColumns:"1.4fr 1fr", gap:18 }}>

        {/* Recent Activity */}
        <div className="ad-card" style={{ background:C.card, border:`1px solid ${C.border}`,
          borderRadius:16, padding:"22px 24px", boxShadow:C.s1, transition:"box-shadow .2s" }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"center", marginBottom:18 }}>
            <div>
              <h3 style={{ fontSize:"0.9rem", fontWeight:700, color:C.ink, margin:"0 0 3px" }}>
                Recent Activity
              </h3>
              <p style={{ fontSize:"0.72rem", color:C.muted, margin:0 }}>
                Latest system events
              </p>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
            {RECENT_ACTIVITY.map((item,i) => {
              const ic = activityIcon[item.type] || activityIcon.bill;
              return (
                <div key={item.id} style={{ display:"flex", alignItems:"center", gap:12,
                  padding:"12px 0", borderBottom:i<RECENT_ACTIVITY.length-1?`1px solid ${C.border}`:"none" }}>
                  <div style={{ width:32, height:32, borderRadius:9, flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background:ic.bg, color:ic.color }}>
                    {ic.icon}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                      <span style={{ fontSize:"0.82rem", fontWeight:600, color:C.ink }}>
                        {item.user}
                      </span>
                      <span style={{ fontSize:"0.78rem", color:C.muted }}>{item.action}</span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:2 }}>
                      <FiClock size={11} color={C.faint}/>
                      <span style={{ fontSize:"0.7rem", color:C.faint }}>{item.time}</span>
                      {item.amount && (
                        <span style={{ fontSize:"0.7rem", fontWeight:700, color:C.green,
                          fontFamily:"monospace" }}>
                          Rs. {item.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {/* Active users ratio */}
          <div className="ad-card" style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:16, padding:"20px 22px", boxShadow:C.s1, transition:"box-shadow .2s" }}>
            <h3 style={{ fontSize:"0.82rem", fontWeight:700, color:C.ink, margin:"0 0 14px" }}>
              Active User Rate
            </h3>
            <div style={{ display:"flex", alignItems:"baseline", gap:8, marginBottom:10 }}>
              <span style={{ fontSize:"2rem", fontWeight:800, color:C.blue, letterSpacing:"-1px" }}>
                {Math.round((MOCK_STATS.activeUsers/MOCK_STATS.totalUsers)*100)}%
              </span>
              <span style={{ fontSize:"0.78rem", color:C.muted }}>
                {MOCK_STATS.activeUsers} of {MOCK_STATS.totalUsers} users active
              </span>
            </div>
            <div style={{ height:8, background:C.hover, borderRadius:999, overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:999,
                width:`${Math.round((MOCK_STATS.activeUsers/MOCK_STATS.totalUsers)*100)}%`,
                background:`linear-gradient(90deg,${C.blue},#818cf8)`,
                transition:"width .6s ease" }}/>
            </div>
          </div>

          {/* Current tariff snapshot */}
          <div className="ad-card" style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:16, padding:"20px 22px", boxShadow:C.s1, transition:"box-shadow .2s" }}>
            <h3 style={{ fontSize:"0.82rem", fontWeight:700, color:C.ink, margin:"0 0 14px" }}>
              Active Tariff Snapshot
            </h3>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"10px 12px", background:C.amberL, borderRadius:10,
                border:`1px solid ${C.amberM}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <FiZap size={14} color={C.amber}/>
                  <span style={{ fontSize:"0.8rem", fontWeight:600, color:C.amber }}>Electricity</span>
                </div>
                <span style={{ fontSize:"0.78rem", fontWeight:700, color:C.ink,
                  fontFamily:"monospace" }}>Rs. 2.50 – 32.00/unit</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"10px 12px", background:C.tealL, borderRadius:10,
                border:`1px solid ${C.tealM}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <FiDroplet size={14} color={C.teal}/>
                  <span style={{ fontSize:"0.8rem", fontWeight:600, color:C.teal }}>Water</span>
                </div>
                <span style={{ fontSize:"0.78rem", fontWeight:700, color:C.ink,
                  fontFamily:"monospace" }}>Rs. 40.00/unit</span>
              </div>
              <p style={{ fontSize:"0.68rem", color:C.faint, margin:0, textAlign:"right" }}>
                Effective from January 2025
              </p>
            </div>
          </div>

          {/* System health */}
          <div className="ad-card" style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:16, padding:"20px 22px", boxShadow:C.s1, transition:"box-shadow .2s" }}>
            <h3 style={{ fontSize:"0.82rem", fontWeight:700, color:C.ink, margin:"0 0 14px" }}>
              System Health
            </h3>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"API Response",  status:"Healthy",  color:C.green },
                { label:"Database",      status:"Healthy",  color:C.green },
                { label:"ML Service",    status:"Standby",  color:C.amber },
              ].map((s,i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center" }}>
                  <span style={{ fontSize:"0.78rem", color:C.muted }}>{s.label}</span>
                  <span style={{ display:"flex", alignItems:"center", gap:5,
                    fontSize:"0.72rem", fontWeight:700, color:s.color }}>
                    <span style={{ width:7, height:7, borderRadius:"50%",
                      background:s.color, display:"inline-block" }}/>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}