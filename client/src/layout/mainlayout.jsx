import { useState } from "react";
import Sidebar from "../components/Sidebar";

const MainLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      color: 'var(--text-dark)',
      margin: 0,
      padding: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden'
    }}>
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div style={{
        flex: 1,
        padding: '2rem',
        marginLeft: sidebarOpen ? '260px' : '80px',
        backgroundColor: 'var(--background)',
        color: 'var(--text-dark)',
        transition: 'margin-left 0.3s ease',
        width: '100%',
        height: '100%',
        overflowY: 'auto'
      }}>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;