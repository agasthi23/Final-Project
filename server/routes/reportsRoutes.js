import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getReportSummary,
  getConsumptionData,
  getMonthlyExpenses,
  getSpendDistribution,
  getDetailedRecords,
  getInsights,
  getFilterOptions,
} from "../controllers/reportsController.js";

const router = express.Router();

router.use(protect);

router.get("/summary", getReportSummary);
router.get("/consumption", getConsumptionData);
router.get("/expenses", getMonthlyExpenses);
router.get("/distribution", getSpendDistribution);
router.get("/records", getDetailedRecords);
router.get("/insights", getInsights);
router.get("/filters", getFilterOptions);

export default router;