// server/routes/predictionsRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNextMonthPrediction,
  getPredictionHistory,
  getPredictionSummary,
} from "../controllers/predictionsController.js";

const router = express.Router();

router.use(protect);

router.get("/next-month", getNextMonthPrediction);
router.get("/history", getPredictionHistory);
router.get("/summary", getPredictionSummary);

export default router;