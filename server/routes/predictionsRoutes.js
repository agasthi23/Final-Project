// server/routes/predictionsRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNextMonthPrediction,
  getPredictionHistory,
  getPredictionSummary,
  getBatchPredictions,
  getCurrentPredictions,
  getForecastPredictions,
  getSinglePrediction,
} from "../controllers/predictionsController.js";

const router = express.Router();

router.use(protect);

// Existing routes
router.get("/next-month", getNextMonthPrediction);
router.get("/history", getPredictionHistory);
router.get("/summary", getPredictionSummary);

// NEW routes for Budget page
router.post("/batch", getBatchPredictions);
router.get("/current", getCurrentPredictions);
router.get("/forecast", getForecastPredictions);
router.get("/single", getSinglePrediction);

export default router;