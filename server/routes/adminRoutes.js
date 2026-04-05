// server/routes/adminRoutes.js
import express from "express";
import {
  getAdminStats,
  getMonthlyStats,
  getAllUsers,
  updateUserStatus,
  getRecentActivity,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All admin routes require authentication
// (add an isAdmin middleware later for extra security)
router.get("/stats",           protect, getAdminStats);
router.get("/monthly-stats",   protect, getMonthlyStats);
router.get("/users",           protect, getAllUsers);
router.get("/activity",        protect, getRecentActivity);
router.put("/users/:id/status",protect, updateUserStatus);

export default router;