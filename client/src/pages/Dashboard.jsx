
// NOTE: The MainLayout import has been REMOVED.
// It is now handled in App.jsx to prevent duplicate sidebars.
// import MainLayout from "../layout/MainLayout"; 

import "./Dashboard.css";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";

const Dashboard = () => {
  const stats = [
    {
      icon: "📄",
      title: "Last Month Bill",
      value: "LKR 2,750",
      desc: "Previous month total",
    },
    {
      icon: "📈",
      title: "Predicted Bill",
      value: "LKR 1,700 – 1,900",
      desc: "Next month forecast",
      highlight: true,
    },
    {
      icon: "⚡",
      title: "Average Usage",
      value: "145 kWh",
      desc: "Based on history",
    },
    {
      icon: "⚠️",
      title: "Usage Status",
      value: "Normal",
      desc: "No abnormal activity",
      status: "normal",
    },
  ];

  // Sample data for consumption trend chart
  const consumptionData = [
    { month: "Jan", electricity: 120, water: 30 },
    { month: "Feb", electricity: 135, water: 35 },
    { month: "Mar", electricity: 125, water: 32 },
    { month: "Apr", electricity: 140, water: 38 },
    { month: "May", electricity: 145, water: 40 },
    { month: "Jun", electricity: 150, water: 42 },
  ];

  // Sample data for monthly comparison
  const monthlyComparison = [
    { name: "Electricity", current: 150, previous: 145 },
    { name: "Water", current: 42, previous: 38 },
  ];

  return (
    // NOTE: The MainLayout wrapper has been REMOVED.
    // The component now only returns its own content.
    // <MainLayout>
      <div className="dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p>Utility usage overview & predictions</p>
          </div>

          <div className="filters">
            <select>
              <option>Jan 2025</option>
              <option>Feb 2025</option>
            </select>
            <select>
              <option>All Utilities</option>
              <option>Water</option>
              <option>Electricity</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="stat-grid">
          {stats.map((item, index) => (
            <div
              key={index}
              className={`stat-card ${
                item.highlight ? "highlight" : ""
              } ${item.status ? item.status : ""}`}
            >
              <div className="icon">{item.icon}</div>
              <div>
                <h4>{item.title}</h4>
                <h2>{item.value}</h2>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid-2">
          <div className="box">
            <h3>Consumption Trend</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={consumptionData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="electricity" stroke="#2563EB" name="Electricity (kWh)" />
                  <Line type="monotone" dataKey="water" stroke="#10b981" name="Water (m³)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="box">
            <h3>Monthly Comparison</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={monthlyComparison}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="current" fill="#2563EB" name="Current Month" />
                  <Bar dataKey="previous" fill="#93c5fd" name="Previous Month" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="alerts">
          <h3>Alerts & Insights</h3>
          <div className="alert warning">
            ⚠️ Water usage increased by 18%
          </div>
          <div className="alert info">
            ℹ️ Electricity bill above 3-month average
          </div>
          <div className="alert danger">
            🚨 Possible water leak detected
          </div>
        </div>
      </div>
    // </MainLayout>
  );
};

export default Dashboard;