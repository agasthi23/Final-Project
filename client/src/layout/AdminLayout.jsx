// src/layouts/AdminLayout.jsx
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiGrid, FiZap, FiUsers, FiLogOut, FiChevronsLeft } from "react-icons/fi";
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
    .adm-nav-link:hover:not(.active-nav) .adm-nav-icon { color:rgba(255,255,255,.85) !important; }
    .adm-nav-link.active-nav {
      background: rgba(37,99,235,.35) !important;
      color: #93c5fd !important;
      border-right: 3px solid #3b82f6 !important;
    }
    .adm-nav-link.active-nav .adm-nav-icon { color: #93c5fd !important; }
    .adm-signout:hover { background:rgba(239,68,68,.15) !important; color:#fca5a5 !important; }
    .adm-main::-webkit-scrollbar { width: 6px; }
    .adm-main::-webkit-scrollbar-track { background: transparent; }
    .adm-main::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 999px; }
    .adm-main::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    .adm-toggle:hover { background:rgba(255,255,255,.15) !important; color:rgba(255,255,255,.8) !important; }

    /* ── Sidebar transition ── */
    .adm-sidebar { transition: width .25s cubic-bezier(.4,0,.2,1) !important; }
    .adm-sidebar .adm-nav-label,
    .adm-sidebar .adm-section-label,
    .adm-sidebar .adm-signout-text {
      transition: opacity .2s ease, max-width .25s ease !important;
      overflow: hidden !important;
      white-space: nowrap !important;
    }
    .adm-sidebar:not(.collapsed) .adm-nav-label,
    .adm-sidebar:not(.collapsed) .adm-section-label,
    .adm-sidebar:not(.collapsed) .adm-signout-text {
      opacity: 1 !important;
      max-width: 160px !important;
    }
    .adm-sidebar.collapsed .adm-nav-label,
    .adm-sidebar.collapsed .adm-section-label,
    .adm-sidebar.collapsed .adm-signout-text {
      opacity: 0 !important;
      max-width: 0 !important;
      display: none !important;
    }

    /* ── Collapsed: center everything ── */
    .adm-sidebar.collapsed .adm-top-row { 
      justify-content: center !important; 
      padding: 18px 0 16px !important;
      flex-direction: column !important;
      gap: 16px !important;
    }
    .adm-sidebar.collapsed .adm-section-row { justify-content: center !important; }
    .adm-sidebar.collapsed .adm-nav-link { 
      justify-content: center !important; 
      padding: 10px 0 !important; 
      border-right: 3px solid transparent !important; 
      border-left: 3px solid transparent !important; 
    }
    .adm-sidebar.collapsed .adm-nav-link.active-nav { 
      border-left: 3px solid #3b82f6 !important; 
      border-right: none !important; 
    }
    .adm-sidebar.collapsed .adm-signout { justify-content: center !important; padding: 10px 0 !important; }
    .adm-sidebar.collapsed .adm-bottom-row { justify-content: center !important; }

    /* Logo clickable area */
    .logo-clickable {
      cursor: pointer;
      transition: opacity .15s;
    }
    .logo-clickable:hover {
      opacity: 0.85;
    }

    /* ── Collapsed: tooltip on hover ── */
    .adm-sidebar.collapsed .adm-nav-link { position: relative; }
    .adm-sidebar.collapsed .adm-nav-link::after {
      content: attr(data-tip);
      position: absolute;
      left: calc(100% + 12px);
      top: 50%;
      transform: translateY(-50%) scale(0.9);
      background: #1e293b;
      color: #e2e8f0;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity .15s, transform .15s;
      box-shadow: 0 4px 12px rgba(0,0,0,.25);
      z-index: 100;
    }
    .adm-sidebar.collapsed .adm-nav-link:hover::after {
      opacity: 1;
      transform: translateY(-50%) scale(1);
    }
    .adm-sidebar.collapsed .adm-signout { position: relative; }
    .adm-sidebar.collapsed .adm-signout::after {
      content: "Sign Out";
      position: absolute;
      left: calc(100% + 12px);
      top: 50%;
      transform: translateY(-50%) scale(0.9);
      background: #1e293b;
      color: #e2e8f0;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity .15s, transform .15s;
      box-shadow: 0 4px 12px rgba(0,0,0,.25);
      z-index: 100;
    }
    .adm-sidebar.collapsed .adm-signout:hover::after {
      opacity: 1;
      transform: translateY(-50%) scale(1);
    }
  `;
  document.head.appendChild(s);
}

const F = "'Plus Jakarta Sans',-apple-system,sans-serif";
const C = {
  page:"#f3f4f8", card:"#fff", ink:"#0f172a", muted:"#64748b", faint:"#94a3b8",
  border:"#e2e8f0", blue:"#2563eb", blueL:"#eff6ff",
};

const NAV_ITEMS = [
  { to:"/admin",          label:"Dashboard",        icon:<FiGrid size={18}/> },
  { to:"/admin/tariff",   label:"Tariff Management",icon:<FiZap size={18}/> },
  { to:"/admin/users",    label:"User Management",  icon:<FiUsers size={18}/> },
];

const WIDE = 240;
const NARROW = 72;

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    navigate("/login");
  };

  const handleLogoClick = () => {
    if (collapsed) {
      setCollapsed(false);
    }
  };

  return (
    <div style={{
      display:"flex",
      height:"100vh",
      overflow:"hidden",
      background:C.page,
      fontFamily:F,
    }}>

      {/* ── Sidebar ── */}
      <aside
        className={`adm-sidebar${collapsed ? " collapsed" : ""}`}
        style={{
          width: collapsed ? NARROW : WIDE,
          height:"100vh",
          background:"#0f172a",
          display:"flex",
          flexDirection:"column",
          flexShrink:0,
          boxShadow:"4px 0 24px rgba(0,0,0,.18)",
        }}
      >

        {/* ── Top: Logo + Toggle ── */}
        <div className="adm-top-row" style={{
          display:"flex",
          alignItems:"center",
          gap:10,
          padding: collapsed ? "18px 0 16px" : "24px 20px 20px",
          borderBottom:"1px solid rgba(255,255,255,.08)",
          justifyContent: collapsed ? "center" : undefined,
          flexDirection: collapsed ? "column" : "row",
        }}>
          {/* Logo - click to expand when collapsed */}
          <div 
            className="logo-clickable"
            style={{ flexShrink:0, display:"flex" }}
            onClick={handleLogoClick}
            title={collapsed ? "Click to expand" : ""}
          >
            <Logo size={collapsed ? 28 : 32} showText={!collapsed} variant="light"/>
          </div>

          {/* Toggle - only visible when expanded */}
          {!collapsed && (
            <button
              className="adm-toggle"
              onClick={() => setCollapsed(true)}
              title="Collapse"
              style={{
                width:28, height:28, borderRadius:7, border:"none",
                background:"rgba(255,255,255,.06)",
                color:"rgba(255,255,255,.5)",
                display:"flex", alignItems:"center", justifyContent:"center",
                cursor:"pointer", flexShrink:0, transition:"all .15s",
                marginLeft:"auto",
              }}
            >
              <FiChevronsLeft size={14}/>
            </button>
          )}
        </div>

        {/* ── Section label — Hidden when collapsed ── */}
        {!collapsed && (
          <div className="adm-section-row" style={{
            padding: "18px 20px 8px",
            display:"flex",
          }}>
            <span className="adm-section-label" style={{
              fontSize:"0.62rem", fontWeight:800, color:"rgba(255,255,255,.3)",
              letterSpacing:"0.12em", textTransform:"uppercase",
            }}>
              Management
            </span>
          </div>
        )}

        {/* ── Nav items ── */}
        <nav style={{ flex:1, padding: collapsed ? "0 10px" : "0 10px" }}>
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) => `adm-nav-link${isActive ? " active-nav" : ""}`}
              data-tip={item.label}
              style={{
                display:"flex", alignItems:"center", gap:12,
                padding: collapsed ? "10px 0" : "10px 14px",
                borderRadius:10, marginBottom:3, textDecoration:"none",
                fontSize:"0.875rem", fontWeight:600,
                color:"rgba(255,255,255,.55)",
                borderRight:"3px solid transparent",
              }}
            >
              {/* Icon — always visible */}
              <span className="adm-nav-icon" style={{
                display:"flex",
                color: collapsed ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.55)",
                flexShrink:0,
                transition:"color .15s",
              }}>
                {item.icon}
              </span>
              {/* Label — hidden when collapsed */}
              {!collapsed && (
                <span className="adm-nav-label">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Sign out ── */}
        <div className="adm-bottom-row" style={{
          padding: collapsed ? "12px 10px 20px" : "12px 10px 20px",
          borderTop:"1px solid rgba(255,255,255,.08)",
          display:"flex",
          justifyContent: collapsed ? "center" : undefined,
        }}>
          <button
            className="adm-signout"
            onClick={handleLogout}
            style={{
              display:"flex", alignItems:"center", gap:12, width:"100%",
              padding: collapsed ? "10px 0" : "10px 14px",
              borderRadius:10, border:"none", fontFamily:F,
              fontSize:"0.875rem", fontWeight:600, cursor:"pointer",
              background:"transparent",
              color: collapsed ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.55)",
              transition:"all .15s",
            }}
          >
            <FiLogOut size={17} style={{ flexShrink:0 }}/>
            {!collapsed && (
              <span className="adm-signout-text">Sign Out</span>
            )}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="adm-main" style={{
        flex:1,
        overflowY:"auto",
        overflowX:"hidden",
      }}>
        {children}
      </main>
    </div>
  );
}