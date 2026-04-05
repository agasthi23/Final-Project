// server/routes/tariffRoutes.js
import express from "express";
import {
  getActiveTariff,
  getTariffHistory,
  publishTariff,
  calculateBill,
} from "../controllers/tariffController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public-ish (any logged in user needs tariff for bill calculation)
router.get("/active",      protect, getActiveTariff);
router.get("/history",     protect, getTariffHistory);
router.get("/calculate",   protect, calculateBill);

// Admin only
router.post("/",           protect, publishTariff);

export default router;