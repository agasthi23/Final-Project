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
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-handle token expiry — redirect to login if 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
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
  getFiltered: (params) =>
    api.get("/bills", { params }),
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
  getActive: () =>
    api.get("/tariff/active"),

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

  // GET /api/budget
  // returns: [ { _id, month, electricityBudget, waterBudget, salary } ]
  getAll: () =>
    api.get("/budget"),

  // GET /api/budget/:month
  // e.g. month = "November 2025"
  getByMonth: (month) =>
    api.get(`/budget/${encodeURIComponent(month)}`),

  // POST /api/budget
  // body: { month, electricityBudget, waterBudget, salary }
  create: (budgetData) =>
    api.post("/budget", budgetData),

  // PUT /api/budget/:id
  update: (id, budgetData) =>
    api.put(`/budget/${id}`, budgetData),

  // DELETE /api/budget/:id
  delete: (id) =>
    api.delete(`/budget/${id}`),
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
//