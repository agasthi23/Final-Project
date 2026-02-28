// src/pages/admin/UserManagement.jsx
import { useState, useMemo } from "react";
import {
  FiSearch, FiUsers, FiUserCheck, FiUserX, FiZap, FiDroplet,
  FiMail, FiCalendar, FiDownload,
  FiChevronUp, FiChevronDown,
} from "react-icons/fi";

/* ─── Font ─── */
if (!document.getElementById("db-font")) {
  const l = document.createElement("link");
  l.id = "db-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.getElementById("usr-anim")) {
  const s = document.createElement("style");
  s.id = "usr-anim";
  s.textContent = `
    @keyframes usrFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    .u-fu1{animation:usrFadeUp .4s .05s ease both}
    .u-fu2{animation:usrFadeUp .4s .10s ease both}
    .u-fu3{animation:usrFadeUp .4s .15s ease both}
    .u-row:hover { background:#f8fafc !important; }
    .u-search:focus { border-color:#2563eb!important; box-shadow:0 0 0 3px rgba(191,219,254,.4)!important; outline:none; background:#fff!important; }
    .u-th:hover { color:#0f172a!important; cursor:pointer; }
    .u-menu-btn:hover { background:#f0f2f7!important; }
    .u-action:hover { background:#f0f2f7!important; }
    .u-export:hover { background:#0f172a!important; color:#fff!important; border-color:#0f172a!important; }
    .u-kpi:hover { transform:translateY(-2px)!important; box-shadow:0 8px 28px rgba(0,0,0,.09)!important; }
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
  s3:"0 12px 40px rgba(15,23,42,.10)",
};

/* ── Mock users (will come from /api/admin/users) ── */
const MOCK_USERS = [
  { id:1,  name:"Sarah Kim",      email:"sarah.kim@email.com",   joined:"Jun 2025", status:"active",   totalBills:14, electricityAvg:2980, waterAvg:870,  lastActive:"2 hrs ago"   },
  { id:2,  name:"James Perera",   email:"james.p@email.com",     joined:"Jun 2025", status:"active",   totalBills:12, electricityAvg:3100, waterAvg:920,  lastActive:"1 day ago"   },
  { id:3,  name:"Maria Lee",      email:"m.lee@email.com",       joined:"Jul 2025", status:"active",   totalBills:10, electricityAvg:2750, waterAvg:840,  lastActive:"3 hrs ago"   },
  { id:4,  name:"Tom Rodrigo",    email:"tom.r@email.com",       joined:"Jul 2025", status:"inactive", totalBills:6,  electricityAvg:2600, waterAvg:800,  lastActive:"2 weeks ago" },
  { id:5,  name:"Priya Sharma",   email:"priya.s@email.com",     joined:"Aug 2025", status:"active",   totalBills:9,  electricityAvg:3250, waterAvg:990,  lastActive:"5 hrs ago"   },
  { id:6,  name:"David Fernando", email:"david.f@email.com",     joined:"Aug 2025", status:"active",   totalBills:8,  electricityAvg:2820, waterAvg:860,  lastActive:"1 day ago"   },
  { id:7,  name:"Anjali Silva",   email:"anjali.s@email.com",    joined:"Sep 2025", status:"active",   totalBills:7,  electricityAvg:2700, waterAvg:810,  lastActive:"6 hrs ago"   },
  { id:8,  name:"Kasun De Mel",   email:"kasun.d@email.com",     joined:"Sep 2025", status:"inactive", totalBills:3,  electricityAvg:2500, waterAvg:780,  lastActive:"1 month ago" },
  { id:9,  name:"Nina Jayasena",  email:"nina.j@email.com",      joined:"Oct 2025", status:"active",   totalBills:6,  electricityAvg:2950, waterAvg:900,  lastActive:"Just now"    },
  { id:10, name:"Rohan Mendis",   email:"rohan.m@email.com",     joined:"Oct 2025", status:"active",   totalBills:5,  electricityAvg:3000, waterAvg:880,  lastActive:"3 days ago"  },
  { id:11, name:"Sanda Balasuriya",email:"sanda.b@email.com",   joined:"Nov 2025", status:"active",   totalBills:4,  electricityAvg:2650, waterAvg:820,  lastActive:"8 hrs ago"   },
  { id:12, name:"Chamil Wickrama",email:"chamil.w@email.com",    joined:"Nov 2025", status:"inactive", totalBills:2,  electricityAvg:2400, waterAvg:760,  lastActive:"3 weeks ago" },
];

const ROWS_PER_PAGE = 8;

export default function UserManagement() {
  const [search,      setSearch]      = useState("");
  const [statusFilter,setStatusFilter]= useState("all"); // "all" | "active" | "inactive"
  const [sortKey,     setSortKey]     = useState("joined");
  const [sortDir,     setSortDir]     = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedUser,setExpandedUser]= useState(null); // user id with expanded row

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d==="asc"?"desc":"asc");
    else { setSortKey(key); setSortDir("asc"); }
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    let data = [...MOCK_USERS];
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") data = data.filter(u => u.status === statusFilter);
    data.sort((a,b) => {
      let av = a[sortKey], bv = b[sortKey];
      if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return sortDir==="asc" ? -1 : 1;
      if (av > bv) return sortDir==="asc" ?  1 : -1;
      return 0;
    });
    return data;
  }, [search, statusFilter, sortKey, sortDir]);

  const totalPages  = Math.ceil(filtered.length / ROWS_PER_PAGE);
  const pageData    = filtered.slice((currentPage-1)*ROWS_PER_PAGE, currentPage*ROWS_PER_PAGE);
  const activeCount = MOCK_USERS.filter(u=>u.status==="active").length;
  const inactiveCount = MOCK_USERS.filter(u=>u.status==="inactive").length;
  const avgElec     = Math.round(MOCK_USERS.reduce((s,u)=>s+u.electricityAvg,0)/MOCK_USERS.length);

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <FiChevronUp size={12} style={{ opacity:.3 }}/>;
    return sortDir==="asc" ? <FiChevronUp size={12}/> : <FiChevronDown size={12}/>;
  };

  const exportCSV = () => {
    const rows = [
      ["Name","Email","Joined","Status","Total Bills","Avg Electricity","Avg Water"],
      ...filtered.map(u=>[u.name,u.email,u.joined,u.status,u.totalBills,u.electricityAvg,u.waterAvg]),
    ];
    const csv  = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download="users_export.csv";
    a.style.display="none"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const initials = (name) => name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();

  const AVATAR_COLORS = [
    ["#2563eb","#eff6ff"],["#0891b2","#ecfeff"],["#059669","#ecfdf5"],
    ["#d97706","#fffbeb"],["#7c3aed","#f5f3ff"],["#dc2626","#fef2f2"],
  ];

  return (
    <div style={{ padding:"28px 32px 64px", fontFamily:F }}>

      {/* ── HEADER ── */}
      <div className="u-fu1" style={{ display:"flex", alignItems:"flex-start",
        justifyContent:"space-between", flexWrap:"wrap", gap:14, marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:C.ink,
            margin:"0 0 5px", letterSpacing:"-0.03em" }}>User Management</h1>
          <p style={{ fontSize:"0.85rem", color:C.muted, margin:0 }}>
            {MOCK_USERS.length} registered users · {activeCount} active
          </p>
        </div>
        <button className="u-export" onClick={exportCSV}
          style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px",
            borderRadius:10, border:`1px solid ${C.border}`, background:C.card,
            fontFamily:F, fontSize:"0.8rem", fontWeight:600, color:C.muted,
            cursor:"pointer", transition:"all .18s" }}>
          <FiDownload size={14}/> Export CSV
        </button>
      </div>

      {/* ── KPI ROW ── */}
      <div className="u-fu2" style={{ display:"grid",
        gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
        {[
          { label:"Total Users",    val:MOCK_USERS.length, icon:<FiUsers size={18}/>,    accent:C.blue,  bg:C.blueL,  bdr:C.blueM  },
          { label:"Active Users",   val:activeCount,       icon:<FiUserCheck size={18}/>,accent:C.green, bg:C.greenL, bdr:C.greenM },
          { label:"Inactive Users", val:inactiveCount,     icon:<FiUserX size={18}/>,    accent:C.red,   bg:C.redL,   bdr:C.redM   },
          { label:"Avg Electricity",val:`Rs. ${avgElec.toLocaleString()}`, icon:<FiZap size={18}/>, accent:C.amber, bg:C.amberL, bdr:C.amberM },
        ].map((k,i) => (
          <div key={i} className="u-kpi"
            style={{ background:C.card, border:`1px solid ${C.border}`,
              borderTop:`3px solid ${k.accent}`, borderRadius:14,
              padding:"18px 20px", display:"flex", gap:14, alignItems:"center",
              boxShadow:C.s1, transition:"transform .2s, box-shadow .2s" }}>
            <div style={{ width:40, height:40, borderRadius:10, flexShrink:0,
              display:"flex", alignItems:"center", justifyContent:"center",
              background:k.bg, border:`1px solid ${k.bdr}`, color:k.accent }}>
              {k.icon}
            </div>
            <div>
              <p style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase",
                letterSpacing:"0.08em", color:C.muted, margin:"0 0 4px" }}>{k.label}</p>
              <p style={{ fontSize:"1.35rem", fontWeight:800, color:C.ink,
                margin:0, letterSpacing:"-0.02em" }}>{k.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABLE CARD ── */}
      <div className="u-fu3" style={{ background:C.card, border:`1px solid ${C.border}`,
        borderRadius:16, boxShadow:C.s1, overflow:"hidden" }}>

        {/* Toolbar */}
        <div style={{ padding:"16px 20px", borderBottom:`1px solid ${C.border}`,
          display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          {/* Search */}
          <div style={{ position:"relative", flex:1, minWidth:200 }}>
            <FiSearch size={15} style={{ position:"absolute", left:13, top:"50%",
              transform:"translateY(-50%)", color:C.faint, pointerEvents:"none" }}/>
            <input className="u-search" value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by name or email…"
              style={{ width:"100%", padding:"9px 14px 9px 38px",
                border:`1.5px solid ${C.border}`, borderRadius:10,
                background:C.hover, fontFamily:F, fontSize:"0.875rem",
                color:C.ink, transition:"all .15s", boxSizing:"border-box" }}/>
          </div>

          {/* Status filter */}
          <div style={{ display:"flex", background:C.hover, borderRadius:9,
            padding:3, gap:2 }}>
            {["all","active","inactive"].map(s => {
              const active = statusFilter === s;
              return (
                <button key={s} onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  style={{ padding:"6px 14px", borderRadius:7, border:"none", fontFamily:F,
                    fontSize:"0.78rem", fontWeight:600, cursor:"pointer", transition:"all .15s",
                    background:active?C.card:"transparent",
                    color:active?C.ink:C.muted,
                    boxShadow:active?C.s1:"none" }}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              );
            })}
          </div>

          <span style={{ fontSize:"0.75rem", color:C.faint, whiteSpace:"nowrap" }}>
            {filtered.length} result{filtered.length!==1?"s":""}
          </span>
        </div>

        {/* Table */}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:C.hover }}>
                {[
                  { key:"name",            label:"User"              },
                  { key:"joined",          label:"Joined"            },
                  { key:"status",          label:"Status"            },
                  { key:"totalBills",      label:"Bills"             },
                  { key:"electricityAvg",  label:"Avg Electricity"   },
                  { key:"waterAvg",        label:"Avg Water"         },
                  { key:"lastActive",      label:"Last Active"       },
                  { key:null,              label:""                  },
                ].map((col,i) => (
                  <th key={i}
                    className={col.key?"u-th":""}
                    onClick={col.key ? ()=>handleSort(col.key) : undefined}
                    style={{ padding:"11px 16px", textAlign:"left",
                      fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase",
                      letterSpacing:"0.08em", color:C.muted,
                      borderBottom:`1px solid ${C.border}`,
                      whiteSpace:"nowrap", userSelect:"none",
                      transition:"color .15s" }}>
                    <span style={{ display:"flex", alignItems:"center", gap:5 }}>
                      {col.label}
                      {col.key && <SortIcon col={col.key}/>}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign:"center", padding:"48px 20px",
                    color:C.muted, fontSize:"0.875rem" }}>
                    No users match your search.
                  </td>
                </tr>
              ) : pageData.map((user,i) => {
                const [ac, abg] = AVATAR_COLORS[user.id % AVATAR_COLORS.length];
                const isExpanded = expandedUser === user.id;
                return (
                  <>
                    <tr key={user.id} className="u-row"
                      style={{ transition:"background .15s",
                        borderBottom:`1px solid ${C.border}` }}
                      onClick={() => setExpandedUser(isExpanded?null:user.id)}>
                      {/* User */}
                      <td style={{ padding:"13px 16px", verticalAlign:"middle" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                          <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            background:abg, color:ac,
                            fontSize:"0.75rem", fontWeight:800 }}>
                            {initials(user.name)}
                          </div>
                          <div>
                            <p style={{ fontSize:"0.875rem", fontWeight:700,
                              color:C.ink, margin:"0 0 2px" }}>{user.name}</p>
                            <p style={{ fontSize:"0.72rem", color:C.faint,
                              margin:0, display:"flex", alignItems:"center", gap:4 }}>
                              <FiMail size={10}/> {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Joined */}
                      <td style={{ padding:"13px 16px", verticalAlign:"middle" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:5,
                          fontSize:"0.78rem", color:C.muted }}>
                          <FiCalendar size={12}/> {user.joined}
                        </span>
                      </td>
                      {/* Status */}
                      <td style={{ padding:"13px 16px", verticalAlign:"middle" }}>
                        <span style={{ display:"inline-flex", alignItems:"center", gap:5,
                          padding:"3px 10px", borderRadius:20, fontSize:"0.72rem",
                          fontWeight:700, letterSpacing:"0.04em",
                          background: user.status==="active" ? C.greenL : C.hover,
                          border:`1px solid ${user.status==="active"?C.greenM:C.border}`,
                          color: user.status==="active" ? C.green : C.faint }}>
                          <span style={{ width:6, height:6, borderRadius:"50%",
                            background: user.status==="active" ? C.green : C.faint }}/>
                          {user.status.charAt(0).toUpperCase()+user.status.slice(1)}
                        </span>
                      </td>
                      {/* Bills */}
                      <td style={{ padding:"13px 16px", verticalAlign:"middle",
                        fontSize:"0.875rem", fontWeight:700, color:C.ink }}>
                        {user.totalBills}
                      </td>
                      {/* Electricity avg */}
                      <td style={{ padding:"13px 16px", verticalAlign:"middle" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:5,
                          fontSize:"0.82rem", fontWeight:700, color:C.amber }}>
                          <FiZap size={12}/> Rs. {user.electricityAvg.toLocaleString()}
                        </span>
                      </td>
                      {/* Water avg */}
                      <td style={{ padding:"13px 16px", verticalAlign:"middle" }}>
                        <span style={{ display:"flex", alignItems:"center", gap:5,
                          fontSize:"0.82rem", fontWeight:700, color:C.teal }}>
                          <FiDroplet size={12}/> Rs. {user.waterAvg.toLocaleString()}
                        </span>
                      </td>
                      {/* Last active */}
                      <td style={{ padding:"13px 16px", verticalAlign:"middle",
                        fontSize:"0.78rem", color:C.faint }}>
                        {user.lastActive}
                      </td>
                      {/* Expand indicator */}
                      <td style={{ padding:"13px 16px", verticalAlign:"middle" }}>
                        <div style={{ color:C.faint, display:"flex", justifyContent:"center" }}>
                          {isExpanded ? <FiChevronUp size={15}/> : <FiChevronDown size={15}/>}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr key={`exp-${user.id}`}
                        style={{ background:C.blueL, borderBottom:`1px solid ${C.border}` }}>
                        <td colSpan={8} style={{ padding:"16px 20px" }}>
                          <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
                            {/* Usage summary */}
                            <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                              {[
                                { label:"Total Bills Logged",   val:user.totalBills,                   color:C.violet },
                                { label:"Avg Electricity / mo", val:`Rs. ${user.electricityAvg.toLocaleString()}`, color:C.amber },
                                { label:"Avg Water / mo",       val:`Rs. ${user.waterAvg.toLocaleString()}`,       color:C.teal  },
                                { label:"Combined Monthly",     val:`Rs. ${(user.electricityAvg+user.waterAvg).toLocaleString()}`, color:C.blue },
                              ].map((s,i) => (
                                <div key={i} style={{ background:C.card, borderRadius:10,
                                  padding:"12px 16px", border:`1px solid ${C.border}`,
                                  minWidth:150 }}>
                                  <p style={{ fontSize:"0.68rem", color:C.muted,
                                    textTransform:"uppercase", letterSpacing:"0.07em",
                                    fontWeight:700, margin:"0 0 5px" }}>{s.label}</p>
                                  <p style={{ fontSize:"1rem", fontWeight:800,
                                    color:s.color, margin:0 }}>{s.val}</p>
                                </div>
                              ))}
                            </div>
                            {/* Quick actions */}
                            <div style={{ marginLeft:"auto", display:"flex",
                              alignItems:"center", gap:8, flexShrink:0 }}>
                              <button className="u-action"
                                style={{ display:"flex", alignItems:"center", gap:6,
                                  padding:"7px 14px", borderRadius:9,
                                  border:`1px solid ${C.border}`, background:C.card,
                                  fontFamily:F, fontSize:"0.78rem", fontWeight:600,
                                  color:C.muted, cursor:"pointer", transition:"all .15s" }}>
                                <FiMail size={13}/> Email User
                              </button>
                              <button className="u-action"
                                style={{ display:"flex", alignItems:"center", gap:6,
                                  padding:"7px 14px", borderRadius:9,
                                  border:`1px solid ${C.redM}`, background:C.redL,
                                  fontFamily:F, fontSize:"0.78rem", fontWeight:600,
                                  color:C.red, cursor:"pointer", transition:"all .15s" }}>
                                {user.status==="active" ? <FiUserX size={13}/> : <FiUserCheck size={13}/>}
                                {user.status==="active" ? "Deactivate" : "Activate"}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding:"14px 20px", borderTop:`1px solid ${C.border}`,
            display:"flex", alignItems:"center", justifyContent:"space-between",
            flexWrap:"wrap", gap:10 }}>
            <span style={{ fontSize:"0.75rem", color:C.faint }}>
              Showing {(currentPage-1)*ROWS_PER_PAGE+1}–{Math.min(currentPage*ROWS_PER_PAGE,filtered.length)} of {filtered.length} users
            </span>
            <div style={{ display:"flex", gap:4 }}>
              <button onClick={() => setCurrentPage(p=>Math.max(p-1,1))}
                disabled={currentPage===1}
                style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${C.border}`,
                  background:"transparent", color:C.muted, fontFamily:F, fontSize:"0.78rem",
                  cursor:currentPage===1?"not-allowed":"pointer", opacity:currentPage===1?0.3:1 }}>
                ← Prev
              </button>
              {Array.from({length:totalPages}).map((_,i) => (
                <button key={i} onClick={() => setCurrentPage(i+1)}
                  style={{ width:32, height:32, borderRadius:8,
                    border:`1px solid ${currentPage===i+1?C.blue:C.border}`,
                    background:currentPage===i+1?C.blueL:"transparent",
                    color:currentPage===i+1?C.blue:C.muted,
                    fontFamily:F, fontSize:"0.78rem", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {i+1}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p=>Math.min(p+1,totalPages))}
                disabled={currentPage===totalPages}
                style={{ padding:"6px 12px", borderRadius:8, border:`1px solid ${C.border}`,
                  background:"transparent", color:C.muted, fontFamily:F, fontSize:"0.78rem",
                  cursor:currentPage===totalPages?"not-allowed":"pointer",
                  opacity:currentPage===totalPages?0.3:1 }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}