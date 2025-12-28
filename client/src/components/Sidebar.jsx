import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiHome,
  FiPlusCircle,
  FiBarChart2,
  FiTrendingUp,
  FiDollarSign,
  FiFile,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
} from "react-icons/fi";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // FIX: Added the missing parentheses () here
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOpen(mobile ? false : true);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, [setIsOpen]);

  const toggle = () => setIsOpen(!isOpen);

  const menuItems = [
    { icon: <FiHome size={22} />, label: "Dashboard", path: "/dashboard" },
    { icon: <FiPlusCircle size={22} />, label: "Add Bill", path: "/add-bill" },
    { icon: <FiBarChart2 size={22} />, label: "Analytics", path: "/analytics" },
    { icon: <FiTrendingUp size={22} />, label: "Predictions", path: "/predictions" },
    { icon: <FiDollarSign size={22} />, label: "Income", path: "/income" },
    { icon: <FiFile size={22} />, label: "Report", path: "/report" },
    { icon: <FiUser size={22} />, label: "Profile", path: "/profile" },
  ];

  return (
    <>
      {/* Overlay on mobile */}
      {isMobile && isOpen && (
        <div style={styles.overlay} onClick={() => setIsOpen(false)} />
      )}

      <div
        style={{
          ...styles.sidebar,
          width: isMobile ? (isOpen ? "260px" : "0") : isOpen ? "260px" : "80px",
          transform: isMobile ? (isOpen ? "translateX(0)" : "translateX(-100%)") : "none",
        }}
      >
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.logo}>
            {isOpen ? "💡 Utility Manager" : "💡"}
          </h2>
          <button onClick={toggle} style={styles.toggleBtn}>
            {isMobile && isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Main Navigation */}
        <nav style={styles.nav}>
          {menuItems.map((item, index) => (
            <Link to={item.path} key={index} style={{ textDecoration: 'none' }}>
              <SidebarItem
                icon={item.icon}
                label={item.label}
                isOpen={isOpen}
                isActive={location.pathname === item.path}
              />
            </Link>
          ))}
        </nav>

        {/* Logout - Bottom */}
        <div style={styles.logoutContainer}>
          <SidebarItem
            icon={<FiLogOut size={22} />}
            label="Logout"
            isOpen={isOpen}
            isLogout={true}
            onClick={() => console.log("Logout clicked")}
          />
        </div>
      </div>
    </>
  );
};

const SidebarItem = ({ icon, label, isOpen, isActive = false, isLogout = false, onClick }) => (
  <div
    style={{
      ...styles.item,
      justifyContent: isOpen ? "flex-start" : "center",
      padding: "12px 16px",
      background: isActive ? "rgba(255, 255, 255, 0.2)" : "transparent",
      borderLeft: isActive ? "4px solid white" : "4px solid transparent",
    }}
    onClick={onClick}
    onMouseEnter={(e) =>
      !isActive && (e.currentTarget.style.background = isLogout ? "rgba(239, 68, 68, 0.3)" : "rgba(255,255,255,0.15)")
    }
    onMouseLeave={(e) =>
      !isActive && (e.currentTarget.style.background = "transparent")
    }
  >
    <div style={{ color: isLogout ? "#fee2e2" : "white" }}>{icon}</div>
    {isOpen && (
      <span style={{ ...styles.label, color: isLogout ? "#fca5a5" : "white", fontWeight: isLogout ? "600" : "normal" }}>
        {label}
      </span>
    )}
  </div>
);

const styles = {
  sidebar: {
    height: "100vh",
    background: "#2563EB",
    color: "#fff",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 1000,
    transition: "all 0.3s ease",
    overflow: "hidden",
    boxShadow: "8px 0 20px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "24px 20px 40px 20px",
  },
  logo: {
    fontSize: "22px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
    overflow: "hidden",
    margin: 0,
  },
  toggleBtn: {
    background: "rgba(255,255,255,0.15)",
    color: "#fff",
    border: "none",
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "0 12px",
    flex: 1,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    cursor: "pointer",
    borderRadius: "10px",
    transition: "all 0.2s",
  },
  label: {
    fontSize: "15.5px",
    whiteSpace: "nowrap",
  },
  logoutContainer: {
    padding: "20px 12px 30px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    marginTop: "auto",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    zIndex: 999,
  },
};

export default Sidebar;