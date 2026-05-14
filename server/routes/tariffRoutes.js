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

// ==================== TEMPORARY DEBUG ROUTE ====================
router.get("/debug-tariff", async (req, res) => {
  try {
    const Tariff = (await import("../models/Tariff.js")).default;
    const tariffs = await Tariff.find({}).sort({ effectiveFrom: -1 });
    
    res.json({
      count: tariffs.length,
      tariffs: tariffs.map(t => ({
        utilityType: t.utilityType,
        status: t.status,
        fixedCharge: t.fixedCharge,
        tiers: t.tiers,
        effectiveFrom: t.effectiveFrom?.toISOString().split('T')[0]
      }))
    });
  } catch (err) {
    console.error("Debug tariff error:", err);
    res.status(500).json({ error: err.message });
  }
});
// ============================================================

// Admin only
router.post("/",           protect, publishTariff);

export default router;