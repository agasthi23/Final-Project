// server/routes/userRoutes.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Protected route - all user routes require authentication
router.use(protect);

/**
 * @route PUT /api/users/household-features
 * @desc Save household features for the authenticated user
 * @access Private
 */
router.put("/household-features", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update household features with the provided data
    user.householdFeatures = req.body;
    await user.save();

    res.json({ 
      success: true, 
      message: "Household features saved successfully", 
      data: user.householdFeatures 
    });
  } catch (error) {
    console.error("Error saving household features:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/users/household-features
 * @desc Get household features for the authenticated user
 * @access Private
 */
router.get("/household-features", async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const householdFeatures = user.householdFeatures || {
      electricity: {},
      water: {}
    };

    res.json(householdFeatures);
  } catch (error) {
    console.error("Error fetching household features:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
