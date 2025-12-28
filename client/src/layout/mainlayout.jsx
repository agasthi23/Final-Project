import { useState } from "react";
import Sidebar from "../components/Sidebar"; // This is the ONLY place Sidebar is imported for the layout
import "./MainLayout.css";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="main-layout">
      {/* The Sidebar is rendered here, inside the layout */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      {/* The main content area (like the Dashboard) is rendered here */}
      <div className={`content ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;