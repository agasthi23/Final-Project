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
} from "lucide-react";
import Logo from "./Logo"; 

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const location = useLocation();

  const dashboardItems = [
    { icon: <LayoutDashboard />, label: "Dashboard", path: "/dashboard" },
    { icon: <Receipt />, label: "Billing", path: "/add-bill" },
    { icon: <BarChart3 />, label: "Analytics", path: "/analytics" },
    { icon: <LineChart />, label: "Predictions", path: "/predictions" },
    { icon: <Wallet />, label: "Budget", path: "/income" },
    { icon: <FileText />, label: "Reports", path: "/report" },
  ];

  const systemItems = [
    { icon: <Settings />, label: "Settings", path: "/profile" },
  ];

  const isMobile = window.innerWidth < 1024;

  const NavItem = ({ item, isActive, isCollapsed }) => (
    <Link to={item.path} style={{ textDecoration: "none" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 14px",
          borderRadius: "10px",
          margin: "4px 10px",
          background: isActive ? "rgba(96,165,250,0.15)" : "transparent",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: isActive ? "rgba(96,165,250,0.25)" : "rgba(30,41,59,0.5)",
            color: isActive ? "#60a5fa" : "#94a3b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: isCollapsed ? 0 : "12px",
          }}
        >
          {React.cloneElement(item.icon, { size: 20 })}
        </div>
        {!isCollapsed && (
          <span style={{ fontSize: "14px", fontWeight: isActive ? 600 : 500, color: isActive ? "#f1f5f9" : "#94a3b8" }}>
            {item.label}
          </span>
        )}
      </div>
    </Link>
  );

  return (
    <>
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: isMobile ? (isOpen ? "280px" : "0") : collapsed ? "80px" : "280px",
          background: "#0f172a",
          color: "#f1f5f9",
          zIndex: 1000,
          transition: "width 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 24px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header - Scaled Logo and Conditional Hide Icon */}
        <div 
          onClick={() => collapsed && setCollapsed(false)} // Clicking top area expands when collapsed
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            padding: "28px 20px", // Increased padding for more prominence
            minHeight: "90px",
            cursor: collapsed ? "pointer" : "default"
          }}
        >
          {/* Bigger Logo implementation */}
          <Logo 
            size={collapsed ? 32 : 42} // Scaled up significantly
            showText={!collapsed} 
            variant="light" 
            style={{ fontWeight: "800", letterSpacing: "-0.5px" }} 
          />
          
          {!isMobile && !collapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent trigger from firing expansion
                setCollapsed(true);
              }}
              style={{ 
                background: "none", 
                border: "none", 
                color: "#64748b", 
                cursor: "pointer",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                transition: "color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#f1f5f9"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#64748b"}
            >
              <PanelLeftClose size={22} />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div style={{ flex: 1, padding: "10px 0" }}>
          {dashboardItems.map((item) => (
            <NavItem key={item.label} item={item} isActive={location.pathname === item.path} isCollapsed={collapsed} />
          ))}

          <div style={{ height: "1px", background: "rgba(51,65,85,0.4)", margin: "20px 20px" }} />
          
          {systemItems.map((item) => (
            <NavItem key={item.label} item={item} isActive={location.pathname === item.path} isCollapsed={collapsed} />
          ))}
        </div>

        {/* Bottom Section */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(51,65,85,0.4)" }}>
          {!collapsed && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", background: "rgba(30,41,59,0.4)", borderRadius: "12px", marginBottom: "16px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "#94a3b8" }}>
                {darkMode ? <Moon size={18} /> : <Sun size={18} />}
                <span style={{ fontSize: "13px" }}>Dark Mode</span>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  width: "40px", height: "22px", borderRadius: "12px",
                  background: darkMode ? "#3b82f6" : "#475569", border: "none",
                  position: "relative", cursor: "pointer"
                }}
              >
                <div style={{
                  position: "absolute", top: "3px", left: darkMode ? "21px" : "3px",
                  width: "16px", height: "16px", borderRadius: "50%", background: "white", transition: "all 0.2s"
                }} />
              </button>
            </div>
          )}

          {/* User Profile */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "8px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "50%",
              background: "linear-gradient(135deg, #3b82f6, #2563eb)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold"
            }}>SA</div>
            {!collapsed && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600 }}>Saduni</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Colombo</div>
              </div>
            )}
            {!collapsed && <Link to="/logout" style={{ color: "#ef4444" }}><LogOut size={18} /></Link>}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;