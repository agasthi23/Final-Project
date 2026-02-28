// src/layouts/AdminLayout.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { FiGrid, FiZap, FiUsers, FiLogOut } from "react-icons/fi";
import Logo from "../components/Logo";

/* ─── Font ─── */
if (!document.getElementById("db-font")) {
  const l = document.createElement("link");
  l.id = "db-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
  document.head.appendChild(l);
}
if (!document.getElementById("adm-lay-anim")) {
  const s = document.createElement("style");
  s.id = "adm-lay-anim";
  s.textContent = `
    @keyframes admSlideIn { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
    .adm-nav-link { transition: all .15s ease !important; }
    .adm-nav-link:hover:not(.active-nav) { background:rgba(255,255,255,.07) !important; color:#fff !important; }
    .adm-nav-link.active-nav {
      background: rgba(37,99,235,.35) !important;
      color: #93c5fd !important;
      border-right: 3px solid #3b82f6 !important;
    }
    .adm-nav-link.active-nav .adm-nav-icon { color: #93c5fd !important; }
    .adm-signout:hover { background:rgba(239,68,68,.15) !important; color:#fca5a5 !important; }
    .adm-topbar-btn:hover { background:#f0f2f7 !important; }
  `;
  document.head.appendChild(s);
}

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";
const C = {
  page:"#f3f4f8", card:"#fff", ink:"#0f172a", muted:"#64748b", faint:"#94a3b8",
  border:"#e2e8f0", blue:"#2563eb", blueL:"#eff6ff",
  s1:"0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)",
  s2:"0 4px 16px rgba(15,23,42,.08)",
};

const NAV_ITEMS = [
  { to:"/admin",          label:"Dashboard",        icon:<FiGrid size={18}/>   },
  { to:"/admin/tariff",   label:"Tariff Management",icon:<FiZap size={18}/>    },
  { to:"/admin/users",    label:"User Management",  icon:<FiUsers size={18}/>  },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // clear token etc when backend is wired
    navigate("/login");
  };

  const Sidebar = () => (
    <aside style={{
      width: 240, minHeight:"100vh", background:"#0f172a",
      borderRight:"none", display:"flex",
      flexDirection:"column", fontFamily:F, flexShrink:0,
      boxShadow:"4px 0 24px rgba(0,0,0,.18)", position:"sticky", top:0, height:"100vh",
    }}>
      {/* Logo */}
      <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid rgba(255,255,255,.08)" }}>
        <Logo size={32} showText variant="light"/>
      </div>

      {/* Nav label */}
      <div style={{ padding:"18px 20px 8px" }}>
        <span style={{ fontSize:"0.62rem", fontWeight:800, color:"rgba(255,255,255,.3)",
          letterSpacing:"0.12em", textTransform:"uppercase" }}>
          Management
        </span>
      </div>

      {/* Nav items */}
      <nav style={{ flex:1, padding:"0 10px" }}>
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to==="/admin"}
            className={({ isActive }) => `adm-nav-link${isActive?" active-nav":""}`}
            style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px",
              borderRadius:10, marginBottom:3, textDecoration:"none",
              fontSize:"0.875rem", fontWeight:600, color:"rgba(255,255,255,.55)",
              borderRight:"3px solid transparent" }}>
            <span className="adm-nav-icon" style={{ display:"flex", color:"rgba(255,255,255,.35)" }}>
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — sign out */}
      <div style={{ padding:"12px 10px 20px", borderTop:"1px solid rgba(255,255,255,.08)" }}>
        <button className="adm-signout" onClick={handleLogout}
          style={{ display:"flex", alignItems:"center", gap:12, width:"100%",
            padding:"10px 14px", borderRadius:10, border:"none", fontFamily:F,
            fontSize:"0.875rem", fontWeight:600, cursor:"pointer",
            background:"transparent", color:"rgba(255,255,255,.4)", transition:"all .15s" }}>
          <FiLogOut size={17} style={{ flexShrink:0 }}/> Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display:"flex", minHeight:"100vh", background:C.page, fontFamily:F }}>
      {/* Sidebar */}
      <Sidebar/>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0 }}>
        {/* Page content */}
        <main style={{ flex:1, overflowY:"auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}