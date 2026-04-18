// server/routes/analyticsRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getAnalyticsStats,
  getMonthlyUsage,
  getMonthlyCost,
  getDistribution,
  getAnalyticsInsights,
} from "../controllers/analyticsController.js";

const router = express.Router();

router.use(protect);

router.get("/stats", getAnalyticsStats);
router.get("/monthly-usage", getMonthlyUsage);
router.get("/monthly-cost", getMonthlyCost);
router.get("/distribution", getDistribution);
router.get("/insights", getAnalyticsInsights);

export default router;