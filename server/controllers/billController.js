// server/controllers/billController.js
import Bill from "../models/Bill.js";
import { checkAndAlertAnomaly } from "./predictionsController.js";  // ✅ ADD THIS IMPORT

// GET all bills for logged-in user
export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find({ user: req.user.id }).sort({ billingMonth: -1 });
    res.json({ success: true, bills });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST create a new bill
export const createBill = async (req, res) => {
  const { utilityType, billingMonth, unitsUsed, billAmount } = req.body;

  try {
    // Validate utility type
    const validUtilities = ["Electricity", "Water", "Internet"];
    if (!validUtilities.includes(utilityType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid utility type. Must be Electricity, Water, or Internet",
      });
    }

    // Check for duplicate
    const existing = await Bill.findOne({
      user: req.user.id,
      utilityType,
      billingMonth,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A ${utilityType} bill for ${billingMonth} already exists.`,
      });
    }

    const bill = await Bill.create({
      user: req.user.id,
      utilityType,
      billingMonth,
      unitsUsed,
      billAmount,
    });

    // ✅ ✅ ✅ ADD ANOMALY CHECK HERE ✅ ✅ ✅
    // After successfully creating the bill, check for unusual usage
    // Don't await - let it run in background (fire and forget)
    checkAndAlertAnomaly(req.user.id, utilityType).catch(err => 
      console.error("Anomaly check failed:", err)
    );

    res.status(201).json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT update a bill
export const updateBill = async (req, res) => {
  const { unitsUsed, billAmount } = req.body;

  try {
    const bill = await Bill.findOne({ _id: req.params.id, user: req.user.id });

    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }

    bill.unitsUsed  = unitsUsed  ?? bill.unitsUsed;
    bill.billAmount = billAmount ?? bill.billAmount;
    await bill.save();

    // ✅ OPTIONAL: Also check anomaly when bill is updated
    // (if amount increased significantly)
    checkAndAlertAnomaly(req.user.id, bill.utilityType).catch(err => 
      console.error("Anomaly check failed on update:", err)
    );

    res.json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE a bill
export const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }

    res.json({ success: true, message: "Bill deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};