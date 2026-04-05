// server/controllers/tariffController.js
import Tariff from "../models/Tariff.js";

// GET /api/tariff/active?type=electricity
export const getActiveTariff = async (req, res) => {
  try {
    const { type } = req.query;
    if (!type || !["electricity", "water"].includes(type)) {
      return res.status(400).json({ success: false, message: "type must be 'electricity' or 'water'" });
    }

    const tariff = await Tariff.findOne({
      utilityType: type,
      status: "active",
    }).sort({ effectiveFrom: -1 });

    if (!tariff) {
      return res.status(404).json({ success: false, message: "No active tariff found" });
    }

    // Return directly — model format matches frontend format perfectly
    res.json({ success: true, tariff });
  } catch (error) {
    console.error("getActiveTariff error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/tariff/history
export const getTariffHistory = async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { utilityType: type } : {};
    const tariffs = await Tariff.find(query)
      .sort({ effectiveFrom: -1 })
      .populate("createdBy", "name email");
    res.json({ success: true, tariffs });
  } catch (error) {
    console.error("getTariffHistory error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/tariff
export const publishTariff = async (req, res) => {
  try {
    const { utilityType, tiers, fixedCharge, effectiveFrom } = req.body;

    if (!utilityType || !["electricity", "water"].includes(utilityType)) {
      return res.status(400).json({ success: false, message: "Valid utilityType required" });
    }
    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
      return res.status(400).json({ success: false, message: "At least one tier is required" });
    }
    if (!effectiveFrom) {
      return res.status(400).json({ success: false, message: "effectiveFrom date is required" });
    }

    // Archive old active tariff
    await Tariff.updateMany(
      { utilityType, status: "active" },
      { $set: { status: "archived" } }
    );

    // Insert new tariff — tiers format matches model exactly
    const newTariff = await Tariff.create({
      utilityType,
      tiers,
      fixedCharge: fixedCharge || 0,
      effectiveFrom: new Date(effectiveFrom),
      status: "active",
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, message: "Tariff published successfully", tariff: newTariff });
  } catch (error) {
    console.error("publishTariff error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/tariff/calculate?type=electricity&units=100
export const calculateBill = async (req, res) => {
  try {
    const { type, units } = req.query;
    if (!type || !units) {
      return res.status(400).json({ success: false, message: "type and units are required" });
    }

    const tariff = await Tariff.findOne({
      utilityType: type,
      status: "active",
    }).sort({ effectiveFrom: -1 });

    if (!tariff) {
      return res.status(404).json({ success: false, message: "No active tariff found" });
    }

    const unitsNum = parseFloat(units);
    let amount = tariff.fixedCharge || 0;
    let remaining = unitsNum;
    let prevMax = 0;

    for (const tier of tariff.tiers) {
      if (remaining <= 0) break;
      const tierMax = tier.upTo === null ? Infinity : tier.upTo;
      const tierSize = Math.min(remaining, tierMax - prevMax + 1);
      amount += tierSize * (tier.ratePerUnit || 0);
      remaining -= tierSize;
      prevMax = tierMax === Infinity ? prevMax : tierMax;
    }

    res.json({
      success: true,
      units: unitsNum,
      fixedCharge: tariff.fixedCharge || 0,
      totalAmount: parseFloat(amount.toFixed(2)),
      tariff,
    });
  } catch (error) {
    console.error("calculateBill error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};