// server/controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// REGISTER
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && await bcrypt.compare(password, user.password)) {
      res.json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========== PROFILE FUNCTIONS ==========

// GET PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    console.log("Sending profile:", user); // Debug log
    res.json({ success: true, user });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE PROFILE - FIXED VERSION
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    console.log("Update profile request:", { name, email, userId: req.user.id });
    
    const updateData = {};
    if (name !== undefined && name !== "") updateData.name = name;
    if (email !== undefined && email !== "") updateData.email = email;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "No valid fields to update" 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select("-password");
    
    console.log("Updated user:", user);
    
    res.json({ 
      success: true, 
      user,
      message: "Profile updated successfully"
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// CHANGE PASSWORD - FIXED VERSION
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log("Change password request for user:", req.user.id);
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Current password and new password are required" 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "New password must be at least 6 characters" 
      });
    }
    
    const user = await User.findById(req.user.id);
    
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log("Password match result:", isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: "Current password is incorrect" 
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();
    
    console.log("Password changed successfully");
    
    res.json({ 
      success: true, 
      message: "Password changed successfully. Please login again."
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET PREFERENCES
export const getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("preferences");
    res.json({ 
      success: true, 
      preferences: user.preferences || {
        darkMode: false,
        emailNotifications: true,
        usageAlerts: true,
      }
    });
  } catch (error) {
    console.error("Get preferences error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE PREFERENCES
export const updatePreferences = async (req, res) => {
  try {
    const { darkMode, emailNotifications, usageAlerts } = req.body;
    console.log("Update preferences:", { darkMode, emailNotifications, usageAlerts });
    
    const updateData = {};
    if (darkMode !== undefined) updateData["preferences.darkMode"] = darkMode;
    if (emailNotifications !== undefined) updateData["preferences.emailNotifications"] = emailNotifications;
    if (usageAlerts !== undefined) updateData["preferences.usageAlerts"] = usageAlerts;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select("preferences");
    
    res.json({ 
      success: true, 
      preferences: user.preferences,
      message: "Preferences updated successfully"
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET SALARY
export const getSalary = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("salary");
    res.json({ success: true, salary: user?.salary || 0 });
  } catch (error) {
    console.error("Get salary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE SALARY
export const updateSalary = async (req, res) => {
  try {
    const { salary } = req.body;
    
    if (salary === undefined || salary < 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Valid salary amount is required" 
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { salary: Math.round(salary) },
      { new: true }
    ).select("salary name email");
    
    res.json({ success: true, salary: user.salary });
  } catch (error) {
    console.error("Update salary error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET BUDGET MODE
export const getBudgetMode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("budgetMode fixedBudget");
    res.json({
      success: true,
      budgetMode: user?.budgetMode || "salary",
      fixedBudget: user?.fixedBudget || 0,
    });
  } catch (error) {
    console.error("Get budget mode error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE BUDGET MODE
export const updateBudgetMode = async (req, res) => {
  try {
    const { budgetMode, fixedBudget } = req.body;
    if (!budgetMode || !["salary", "fixed"].includes(budgetMode)) {
      return res.status(400).json({
        success: false,
        message: "Valid budget mode is required",
      });
    }

    if (fixedBudget !== undefined && fixedBudget < 0) {
      return res.status(400).json({
        success: false,
        message: "Fixed budget must be a non-negative number",
      });
    }

    const updateData = { budgetMode };
    if (fixedBudget !== undefined) {
      updateData.fixedBudget = Math.round(fixedBudget);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select("budgetMode fixedBudget");

    res.json({
      success: true,
      budgetMode: user.budgetMode,
      fixedBudget: user.fixedBudget,
    });
  } catch (error) {
    console.error("Update budget mode error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE PROFILE PICTURE
export const updateProfilePicture = async (req, res) => {
  try {
    const { profilePicture } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture },
      { new: true }
    ).select("-password");
    
    res.json({ 
      success: true, 
      profilePicture: user.profilePicture,
      message: "Profile picture updated successfully"
    });
  } catch (error) {
    console.error("Update profile picture error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE PROFILE PICTURE
export const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePicture: "" },
      { new: true }
    ).select("-password");
    
    res.json({ 
      success: true, 
      message: "Profile picture removed successfully"
    });
  } catch (error) {
    console.error("Delete profile picture error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
};