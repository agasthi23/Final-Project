// server/routes/authRoutes.js
import express from "express";
import { 
  registerUser, 
  loginUser,
  getSalary,
  updateSalary,
  getBudgetMode,
  updateBudgetMode,
  getProfile,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  updateProfilePicture,
  deleteProfilePicture,
  logout,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.use(protect);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.put("/password", changePassword);
router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);
router.get("/budget-mode", getBudgetMode);
router.put("/budget-mode", updateBudgetMode);
router.put("/profile-picture", updateProfilePicture);
router.delete("/profile-picture", deleteProfilePicture);
router.get("/salary", getSalary);
router.put("/salary", updateSalary);
router.post("/logout", logout);

export default router;