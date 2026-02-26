// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  LineChart,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from "lucide-react";
import Logo from "./Logo";
import "./Sidebar.css";

const mainItems = [
  { icon: LayoutDashboard, label: "Dashboard",   path: "/dashboard"   },
  { icon: Receipt,         label: "Billing",     path: "/add-bill"    },
  { icon: BarChart3,       label: "Analytics",   path: "/analytics"   },
  { icon: LineChart,       label: "Predictions", path: "/predictions" },
  { icon: Wallet,          label: "Budget",      path: "/income"      },
  { icon: FileText,        label: "Reports",     path: "/report"      },
];

const systemItems = [
  { icon: Settings, label: "Settings", path: "/profile" },
];

// ── Nav Item ──────────────────────────────────────────────────────
const NavItem = ({ item, isActive, isCollapsed }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      className={`nav-item${isActive ? " nav-item--active" : ""}`}
      data-label={item.label}
      aria-label={item.label}
    >
      <span className={`nav-icon${isActive ? " nav-icon--active" : ""}`}>
        <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
      </span>

      {!isCollapsed && (
        <>
          <span className="nav-label">{item.label}</span>
          {isActive && <ChevronRight size={14} className="nav-chevron" />}
        </>
      )}

      {isActive && <span className="nav-active-bar" aria-hidden="true" />}
    </Link>
  );
};

// ── Sidebar ───────────────────────────────────────────────────────
const Sidebar = ({
  isOpen,
  setIsOpen,
  darkMode,
  onToggleDarkMode,
  user,
  onLogout,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 1024);
  const location = useLocation();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isMobile && isOpen) setIsOpen(false);
  }, [location.pathname]); // eslint-disable-line

  const isCollapsed = collapsed && !isMobile;

  const cls = [
    "sidebar",
    isCollapsed         ? "sidebar--collapsed" : "",
    isMobile && !isOpen ? "sidebar--hidden"    : "",
  ].filter(Boolean).join(" ");

  const displayUser = user ?? { initials: "SA", name: "Saduni", location: "Colombo" };

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={cls} aria-label="Main navigation">

        {/* ── Header: logo disappears when collapsed ──────── */}
        <div
          className="sidebar-header"
          onClick={() => isCollapsed && setCollapsed(false)}
          style={{ cursor: isCollapsed ? "pointer" : "default" }}
        >
          {/* Logo fades + collapses via CSS when sidebar collapses */}
          <div className="sidebar-logo">
            <Logo size={36} showText={true} variant="light" />
          </div>

          {!isMobile && (
            <button
              className="collapse-btn"
              onClick={(e) => { e.stopPropagation(); setCollapsed(p => !p); }}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed
                ? <PanelLeftOpen  size={17} />
                : <PanelLeftClose size={17} />
              }
            </button>
          )}

          {isMobile && isOpen && (
            <button
              className="collapse-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close sidebar"
            >
              <PanelLeftClose size={17} />
            </button>
          )}
        </div>

        {/* ── Nav area ────────────────────────────────────── */}
        <div className="sidebar-nav-area">
          {!isCollapsed && <p className="nav-section-label">Menu</p>}
          <nav className="nav-group" aria-label="Dashboard navigation">
            {mainItems.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                isActive={location.pathname === item.path}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>

          <div className="nav-divider" role="separator" />

          {!isCollapsed && <p className="nav-section-label">System</p>}
          <nav className="nav-group" aria-label="System navigation">
            {systemItems.map((item) => (
              <NavItem
                key={item.label}
                item={item}
                isActive={location.pathname === item.path}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>
        </div>

        {/* ── Footer ──────────────────────────────────────── */}
        <div className="sidebar-footer">
          {!isCollapsed && (
            <div className="dark-mode-row">
              <div className="dark-mode-label">
                {darkMode
                  ? <Moon size={15} strokeWidth={1.8} />
                  : <Sun  size={15} strokeWidth={1.8} />
                }
                <span>{darkMode ? "Dark mode" : "Light mode"}</span>
              </div>
              <button
                className={`toggle-pill${darkMode ? " toggle-pill--on" : ""}`}
                onClick={onToggleDarkMode}
                aria-pressed={darkMode}
                aria-label="Toggle dark mode"
              >
                <span className="toggle-pill__thumb" />
              </button>
            </div>
          )}

          <div className="user-row">
            <div className="user-avatar">{displayUser.initials}</div>

            {!isCollapsed && (
              <>
                <div className="user-info">
                  <span className="user-name">{displayUser.name}</span>
                  <span className="user-meta">{displayUser.location}</span>
                </div>
                {/* Logout — always visible, red tinted */}
                <button
                  className="logout-btn"
                  onClick={onLogout}
                  aria-label="Log out"
                  title="Log out"
                >
                  <LogOut size={15} strokeWidth={2.2} color="#f87171" stroke="#f87171" style={{display:"block",flexShrink:0}} />
                </button>
              </>
            )}
          </div>
        </div>

      </aside>
    </>
  );
};

export default Sidebar;