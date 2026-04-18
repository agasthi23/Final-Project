// src/services/api.js
// Central API service — all HTTP calls go through here
// Import this in your pages: import api, { authAPI, billsAPI, ... } from "../services/api";

import axios from "axios";

// ─────────────────────────────────────────────
//  BASE INSTANCE
// ─────────────────────────────────────────────
const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Auto-attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-handle token expiry — redirect to login if 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userData");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;


// ─────────────────────────────────────────────
//  AUTH  —  /api/auth
// ─────────────────────────────────────────────
export const authAPI = {

  // POST /api/auth/login
  // body: { email, password }
  // returns: { token, user: { id, name, email, role } }
  login: (email, password) =>
    api.post("/auth/login", { email, password }),

  // POST /api/auth/signup
  // body: { name, email, password }
  // returns: { success, message }
  signup: (name, email, password) =>
    api.post("/auth/signup", { name, email, password }),

  // GET /api/auth/me
  // returns: { id, name, email, role }
  getMe: () =>
    api.get("/auth/me"),
  
  // Salary endpoints (NEW)
  getSalary: () =>
    api.get("/auth/salary"),
  updateSalary: (salary) =>
    api.put("/auth/salary", { salary }),
  
  // Profile endpoints (NEW)
  getProfile: () =>
    api.get("/auth/profile"),
  updateProfile: (data) => {
    console.log("Sending update profile request:", data);
    return api.put("/auth/profile", data);
  },
  
  // Profile Picture
  updateProfilePicture: (profilePicture) => api.put("/auth/profile-picture", { profilePicture }),
  deleteProfilePicture: () => api.delete("/auth/profile-picture"),
  
  // NEW - Profile page
  changePassword: (currentPassword, newPassword) => {
    console.log("Sending change password request");
    return api.put("/auth/password", { currentPassword, newPassword });
  },
  
  getPreferences: () => api.get("/auth/preferences"),
  updatePreferences: (preferences) => {
    console.log("Sending update preferences:", preferences);
    return api.put("/auth/preferences", preferences);
  },
  
  logout: () => api.post("/auth/logout"),
};


// ─────────────────────────────────────────────
//  BILLS  —  /api/bills
//  Used by: Dashboard, AddBill, Analytics,
//           Prediction, Report, Income
// ─────────────────────────────────────────────
export const billsAPI = {

  // GET /api/bills
  // returns: [ { _id, utilityType, billingMonth, unitsUsed, billAmount, tariffId, createdAt } ]
  getAll: () =>
    api.get("/bills"),

  // GET /api/bills/:id
  getById: (id) =>
    api.get(`/bills/${id}`),

  // POST /api/bills
  // body: { utilityType, billingMonth, unitsUsed, billAmount }
  create: (billData) =>
    api.post("/bills", billData),

  // PUT /api/bills/:id
  // body: { utilityType, billingMonth, unitsUsed, billAmount }
  update: (id, billData) =>
    api.put(`/bills/${id}`, billData),

  // DELETE /api/bills/:id
  delete: (id) =>
    api.delete(`/bills/${id}`),

  // GET /api/bills?utilityType=Electricity
  // GET /api/bills?utilityType=Water
  // GET /api/bills?month=November 2025
  getFiltered: (config) =>
    api.get("/bills", config),
};


// ─────────────────────────────────────────────
//  TARIFF  —  /api/tariff
//  Used by: AddBill (to calculate bill amount),
//           TariffManagement (admin),
//           AdminDashboard (snapshot)
// ─────────────────────────────────────────────
export const tariffAPI = {

  // GET /api/tariff/active
  // returns current active tariff
  // { _id, utilityType, tiers, fixedCharge, effectiveFrom, effectiveTo }
  getActive: (config) =>
    api.get("/tariff/active", config),

  // GET /api/tariff/history
  // returns all tariffs sorted by effectiveFrom desc
  getHistory: () =>
    api.get("/tariff/history"),

  // POST /api/tariff  [ADMIN ONLY]
  // body: { utilityType, tiers, fixedCharge, effectiveFrom }
  create: (tariffData) =>
    api.post("/tariff", tariffData),

  // PUT /api/tariff/:id  [ADMIN ONLY]
  update: (id, tariffData) =>
    api.put(`/tariff/${id}`, tariffData),
};


// ─────────────────────────────────────────────
//  PREDICTION  —  /api/prediction
//  Used by: Prediction page
// ─────────────────────────────────────────────
export const predictionAPI = {

  // GET /api/prediction
  // Sends user's bill history to ML service,
  // returns prediction for next month
  // returns: { predictedUnits, predictedAmount, confidence, method, targetMonth }
  getNextMonth: () =>
    api.get("/prediction"),

  // GET /api/prediction/history
  // returns: [ { targetMonth, predictedUnits, predictedAmount, confidence, createdAt } ]
  getHistory: () =>
    api.get("/prediction/history"),
};


// ─────────────────────────────────────────────
//  BUDGET  —  /api/budget
//  Used by: Income (Budget/Income page)
// ─────────────────────────────────────────────
export const budgetAPI = {
  // GET /api/budget - Get all budgets (legacy)
  getAll: () => api.get("/budget"),
  
  // GET /api/budget/dashboard - Get auto-calculated budget dashboard
  getDashboard: () => api.get("/budget/dashboard"),
  
  // GET /api/budget/summary - Get quick summary for dashboard widget
  getSummary: () => api.get("/budget/summary"),
  
  // GET /api/budget/:month - Get budget by month
  getByMonth: (month) => api.get(`/budget/${encodeURIComponent(month)}`),
  
  // POST /api/budget - Create new budget
  create: (budgetData) => api.post("/budget", budgetData),
  
  // PUT /api/budget/:id - Update budget
  update: (id, budgetData) => api.put(`/budget/${id}`, budgetData),
  
  // PUT /api/budget/salary - Update user's salary
  updateSalary: (salary) => api.put("/budget/salary", { salary }),
  
  // DELETE /api/budget/:id - Delete budget
  delete: (id) => api.delete(`/budget/${id}`),
};


// ─────────────────────────────────────────────
//  PROFILE  —  /api/profile
//  Used by: ProfilePage
// ─────────────────────────────────────────────
export const profileAPI = {

  // GET /api/profile
  // returns: { name, email, role, createdAt }
  get: () =>
    api.get("/profile"),

  // PUT /api/profile
  // body: { name, email }
  update: (profileData) =>
    api.put("/profile", profileData),

  // PUT /api/profile/password
  // body: { currentPassword, newPassword }
  changePassword: (passwordData) =>
    api.put("/profile/password", passwordData),
};


// ─────────────────────────────────────────────
//  ADMIN  —  /api/admin
//  Used by: AdminDashboard, UserManagement
// ─────────────────────────────────────────────
export const adminAPI = {

  // GET /api/admin/stats
  // returns system-wide stats for admin dashboard
  // { totalUsers, activeUsers, newThisMonth, totalBills,
  //   billsThisMonth, electricityAvg, waterAvg, systemAlerts }
  getStats: () =>
    api.get("/admin/stats"),

  // GET /api/admin/users
  // returns all users with their usage summaries
  // [ { _id, name, email, role, status, totalBills,
  //     electricityAvg, waterAvg, lastActive, createdAt } ]
  getAllUsers: () =>
    api.get("/admin/users"),

  // PUT /api/admin/users/:id/status
  // body: { status: "active" | "inactive" }
  updateUserStatus: (id, status) =>
    api.put(`/admin/users/${id}/status`, { status }),

  // GET /api/admin/activity
  // returns recent system activity log
  // [ { user, action, amount, time, type } ]
  getRecentActivity: () =>
    api.get("/admin/activity"),

  // GET /api/admin/monthly-stats
  // returns monthly bill averages + user counts for charts
  // [ { month, electricity, water, users } ]
  getMonthlyStats: () =>
    api.get("/admin/monthly-stats"),
};
// ─────────────────────────────────────────────
//  REPORTS  —  /api/reports
//  Used by: Report page
// ─────────────────────────────────────────────
export const reportsAPI = {

  // GET /api/reports/summary
  // returns KPI summary: totalUnits, totalAmount, avgMonthlyCost, peakExpenditure
  getSummary: (params) =>
    api.get("/reports/summary", { params }),

  // GET /api/reports/consumption
  // returns consumption chart data: { month, Electricity, Water }
  getConsumption: (params) =>
    api.get("/reports/consumption", { params }),

  // GET /api/reports/expenses
  // returns stacked bar chart data: { month, Electricity, Water, Internet }
  getExpenses: (params) =>
    api.get("/reports/expenses", { params }),

  // GET /api/reports/distribution
  // returns pie chart data: { name, value } for each utility
  getDistribution: (params) =>
    api.get("/reports/distribution", { params }),

  // GET /api/reports/records
  // returns detailed records with pagination: { records, pagination }
  getRecords: (params) =>
    api.get("/reports/records", { params }),

  // GET /api/reports/insights
  // returns AI-generated insights: { type, text }
  getInsights: (params) =>
    api.get("/reports/insights", { params }),

  // GET /api/reports/filters
  // returns filter options: { utilities, months, quarters, years }
  getFilters: () =>
    api.get("/reports/filters"),
};
// ─────────────────────────────────────────────
//  PREDICTIONS  —  /api/predictions
//  Used by: Prediction page
// ─────────────────────────────────────────────
export const predictionsAPI = {
  // GET /api/predictions/next-month
  getNextMonth: (params) => api.get("/predictions/next-month", { params }),
  
  // GET /api/predictions/history
  getHistory: (params) => api.get("/predictions/history", { params }),
  
  // GET /api/predictions/summary
  getSummary: () => api.get("/predictions/summary"),
};
export const analyticsAPI = {
  getStats: (params) => api.get("/analytics/stats", { params }),
  getMonthlyUsage: (params) => api.get("/analytics/monthly-usage", { params }),
  getMonthlyCost: (params) => api.get("/analytics/monthly-cost", { params }),
  getDistribution: (params) => api.get("/analytics/distribution", { params }),
  getInsights: (params) => api.get("/analytics/insights", { params }),
};
// Add to your api.js

export const dashboardAPI = {
  getSummary: () => api.get("/dashboard/summary"),
  getTrends: () => api.get("/dashboard/trends"),
  getAlerts: () => api.get("/dashboard/alerts"),
};

// ─────────────────────────────────────────────
//  USAGE GUIDE — how to use in your pages
// ─────────────────────────────────────────────
//
//  REPLACE THIS (mock data):
//  ─────────────────────────
//  const [bills, setBills] = useState(MOCK_BILLS);
//
//  WITH THIS (real API):
//  ─────────────────────
//  import { billsAPI } from "../services/api";
//
//  const [bills, setBills] = useState([]);
//  const [loading, setLoading] = useState(true);
//  const [error, setError] = useState(null);
//
//  useEffect(() => {
//    const fetchBills = async () => {
//      try {
//        const res = await billsAPI.getAll();
//        setBills(res.data);
//      } catch (err) {
//        setError("Failed to load bills.");
//      } finally {
//        setLoading(false);
//      }
//    };
//    fetchBills();
//  }, []);
//
// ─────────────────────────────────────────────
//  PAGE → API MAPPING (quick reference)
// ─────────────────────────────────────────────
//
//  Dashboard       → billsAPI.getAll(), tariffAPI.getActive()
//  AddBill         → billsAPI.create(), billsAPI.update(),
//                    billsAPI.delete(), tariffAPI.getActive()
//  Analytics       → billsAPI.getAll()
//  Prediction      → predictionAPI.getNextMonth(),
//                    predictionAPI.getHistory()
//  Income/Budget   → billsAPI.getAll(), budgetAPI.getAll(),
//                    budgetAPI.create(), budgetAPI.update()
//  Report          → billsAPI.getFiltered()
//  ProfilePage     → profileAPI.get(), profileAPI.update(),
//                    profileAPI.changePassword()
//  AdminDashboard  → adminAPI.getStats(),
//                    adminAPI.getMonthlyStats(),
//                    adminAPI.getRecentActivity(),
//                    tariffAPI.getActive()
//  UserManagement  → adminAPI.getAllUsers(),
//                    adminAPI.updateUserStatus()
//  TariffManagement→ tariffAPI.getActive(),
//                    tariffAPI.getHistory(),
//                    tariffAPI.create()