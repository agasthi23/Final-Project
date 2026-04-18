// server/routes/dashboardRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getDashboardSummary,
  getDashboardTrends,
  getDashboardAlerts,
} from "../controllers/dashboardController.js";

const router = express.Router();

router.use(protect);

router.get("/summary", getDashboardSummary);
router.get("/trends", getDashboardTrends);
router.get("/alerts", getDashboardAlerts);

export default router;