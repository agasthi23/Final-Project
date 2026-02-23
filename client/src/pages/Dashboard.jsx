// src/pages/Dashboard.jsx
import { useState, useMemo, useRef, useEffect } from "react";
import "./Dashboard.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
// Using react-icons/fi
import {
  FiTrendingUp,
  FiTrendingDown,
  FiDroplet,
  FiZap,
  FiAlertCircle,
  FiInfo,
  FiActivity,
  FiDollarSign,
  FiCalendar,
  FiChevronDown,
} from "react-icons/fi";

const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState("October");
  const [selectedYear, setSelectedYear] = useState("2023");
  const [selectedUtility, setSelectedUtility] = useState("All Utilities");
  const [activeChartTab, setActiveChartTab] = useState("Monthly");
  
  // State for the new period menus
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
  const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
  const monthMenuRef = useRef(null);
  const yearMenuRef = useRef(null);

  // Close month menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (monthMenuRef.current && !monthMenuRef.current.contains(event.target)) {
        setIsMonthMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close year menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearMenuRef.current && !yearMenuRef.current.contains(event.target)) {
        setIsYearMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const consumptionDataSets = {
    Monthly: [
      { month: "Jan", electricity: 120, water: 30 },
      { month: "Feb", electricity: 135, water: 35 },
      { month: "Mar", electricity: 125, water: 32 },
      { month: "Apr", electricity: 140, water: 38 },
      { month: "May", electricity: 145, water: 40 },
      { month: "Jun", electricity: 150, water: 42 },
      { month: "Jul", electricity: 155, water: 45 },
      { month: "Aug", electricity: 148, water: 43 },
    ],
    Weekly: [
      { week: "W1", electricity: 380, water: 95 },
      { week: "W2", electricity: 410, water: 105 },
      { week: "W3", electricity: 395, water: 100 },
      { week: "W4", electricity: 425, water: 110 },
    ],
    Daily: [
      { day: "Mon", electricity: 22, water: 5 },
      { day: "Tue", electricity: 25, water: 6 },
      { day: "Wed", electricity: 18, water: 4 },
      { day: "Thu", electricity: 28, water: 7 },
      { day: "Fri", electricity: 24, water: 5 },
      { day: "Sat", electricity: 30, water: 8 },
      { day: "Sun", electricity: 26, water: 6 },
    ],
  };

  const consumptionData = useMemo(
    () => consumptionDataSets[activeChartTab],
    [activeChartTab]
  );

  const dailyUsage = consumptionDataSets.Daily;

  const stats = [
    {
      icon: <FiDollarSign size={20} />,
      title: "Current Bill",
      value: "Rs.1420.50",
      desc: "This month's total",
      change: "+12%",
      trend: "up",
      color: "#3b82f6",
    },
    {
      icon: <FiZap size={20} />,
      title: "Electricity",
      value: "850 kWh",
      desc: "This month's usage",
      change: "-8%",
      trend: "down",
      color: "#10b981",
    },
    {
      icon: <FiDroplet size={20} />,
      title: "Water",
      value: "3.2k Gal",
      desc: "This month's usage",
      change: "+2%",
      trend: "up",
      color: "#06b6d4",
    },
    {
      icon: <FiActivity size={20} />,
      title: "Projected End",
      value: "Rs.1580.00",
      desc: "Estimated final bill",
      change: "+5%",
      trend: "up",
      color: "#8b5cf6",
    },
  ];

  const filteredStats = stats.filter(
    (s) =>
      selectedUtility === "All Utilities" ||
      s.title.toLowerCase().includes(selectedUtility.toLowerCase())
  );

  const monthlyComparison = [
    { name: "Electricity", current: 150, previous: 145, projected: 160 },
    { name: "Water", current: 42, previous: 38, projected: 45 },
  ];
  
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = ["2024", "2023", "2022", "2021"];
  const utilities = ["All Utilities", "Electricity", "Water"];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="header-title">
            {/* FiHome Icon Removed Here */}
            <h1>Utility Overview</h1>
          </div>
          <p className="period-text">
            <FiCalendar size={16} className="inline-icon" />
            Monitoring period: {selectedMonth} 1 – 31, {selectedYear}
          </p>
        </div>

        <div className="header-filters">
          {/* New Cooler Period Segmented Control with Menus */}
          <div className="filter-group">
            <label>Period</label>
            <div className="segmented-control">
              {/* Month Tile */}
              <div className="segmented-item-with-menu" ref={monthMenuRef}>
                <button
                  className="segmented-trigger"
                  onClick={() => setIsMonthMenuOpen(!isMonthMenuOpen)}
                >
                  <span>{selectedMonth}</span>
                  <FiChevronDown className={`chevron ${isMonthMenuOpen ? "open" : ""}`} size={18} />
                </button>
                {isMonthMenuOpen && (
                  <div className="dropdown-menu">
                    {months.map((month) => (
                      <button
                        key={month}
                        className="dropdown-item"
                        onClick={() => {
                          setSelectedMonth(month);
                          setIsMonthMenuOpen(false);
                        }}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Year Tile */}
              <div className="segmented-item-with-menu" ref={yearMenuRef}>
                <button
                  className="segmented-trigger"
                  onClick={() => setIsYearMenuOpen(!isYearMenuOpen)}
                >
                  <span>{selectedYear}</span>
                  <FiChevronDown className={`chevron ${isYearMenuOpen ? "open" : ""}`} size={18} />
                </button>
                {isYearMenuOpen && (
                  <div className="dropdown-menu">
                    {years.map((year) => (
                      <button
                        key={year}
                        className="dropdown-item"
                        onClick={() => {
                          setSelectedYear(year);
                          setIsYearMenuOpen(false);
                        }}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Utility Segmented Control (unchanged) */}
          <div className="filter-group">
            <label>Utility</label>
            <div className="segmented-control">
              {utilities.map((utility) => (
                <button
                  key={utility}
                  className={`segmented-item ${selectedUtility === utility ? "active" : ""}`}
                  onClick={() => setSelectedUtility(utility)}
                >
                  {utility}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="stats-section">
        <div className="stat-grid">
          {filteredStats.map((item, i) => (
            <div key={i} className="stat-card" style={{ '--accent-color': item.color }}>
              <div className="stat-icon-wrapper">
                <div className="stat-icon" style={{ background: `${item.color}15` }}>
                  {item.icon}
                </div>
              </div>
              <div className="stat-main">
                <h3 className="stat-title">{item.title}</h3>
                <div className="stat-value">{item.value}</div>
                <p className="stat-desc">{item.desc}</p>
              </div>
              <div className={`stat-trend ${item.trend}`}>
                {item.trend === "up" ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
                <span>{item.change}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="charts-section">
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Consumption Trend</h2>
            <div className="chart-controls">
              <div className="tab-group">
                {["Monthly", "Weekly", "Daily"].map((tab) => (
                  <button
                    key={tab}
                    className={`tab-btn ${activeChartTab === tab ? "active" : ""}`}
                    onClick={() => setActiveChartTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={consumptionData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="elecGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey={activeChartTab === "Daily" ? "day" : activeChartTab === "Weekly" ? "week" : "month"}
                  stroke="#94a3b8"
                />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ 
                    background: "#ffffff", 
                    border: "1px solid #e2e8f0", 
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                  }}
                />
                <Legend />
                <Area dataKey="electricity" stroke="#3b82f6" fill="url(#elecGradient)" name="Electricity (kWh)" />
                <Area dataKey="water" stroke="#06b6d4" fill="url(#waterGradient)" name="Water (Gal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h2 className="chart-title">Monthly Comparison</h2>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyComparison} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ 
                    background: "#ffffff", 
                    border: "1px solid #e2e8f0", 
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                  }}
                />
                <Legend />
                <Bar dataKey="previous" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Previous" />
                <Bar dataKey="current" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Current" />
                <Bar dataKey="projected" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Projected" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card full-width">
          <h2 className="chart-title">Daily Usage Pattern (This Week)</h2>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyUsage} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ 
                    background: "#ffffff", 
                    border: "1px solid #e2e8f0", 
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)"
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="electricity" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Electricity (kWh)" />
                <Line type="monotone" dataKey="water" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Water (Gal)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="alerts-section">
        <h2 className="section-title">Alerts & Insights</h2>
        <div className="alerts-grid">
          <div className="alert-card warning">
            <FiAlertCircle className="alert-icon" size={20} />
            <div>
              <h3>Unusual Water Usage</h3>
              <p>18% increase this month – check for leaks.</p>
            </div>
          </div>
          <div className="alert-card info">
            <FiInfo className="alert-icon" size={20} />
            <div>
              <h3>Optimization Tip</h3>
              <p>Use off-peak hours to save up to 15% on electricity.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;