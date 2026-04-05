// server/controllers/adminController.js
import User from "../models/User.js";
import Bill from "../models/Bill.js";
import Tariff from "../models/Tariff.js";

// ─────────────────────────────────────────
// GET /api/admin/stats
// System-wide stats for admin dashboard
// ─────────────────────────────────────────
export const getAdminStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // User stats
    const totalUsers   = await User.countDocuments({ role: "user" });
    const newThisMonth = await User.countDocuments({
      role: "user",
      createdAt: { $gte: startOfMonth },
    });
    // ✅ FIXED: count users who are explicitly active OR have no status field
    const activeUsers  = await User.countDocuments({
      role: "user",
      $or: [{ status: "active" }, { status: { $exists: false } }],
    });

    // Bill stats
    const totalBills     = await Bill.countDocuments();
    const billsThisMonth = await Bill.countDocuments({
      createdAt: { $gte: startOfMonth },
    });

    // Average bills this month
    const elecAvgResult = await Bill.aggregate([
      { $match: { utilityType: "Electricity", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, avg: { $avg: "$billAmount" } } },
    ]);
    const waterAvgResult = await Bill.aggregate([
      { $match: { utilityType: "Water", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, avg: { $avg: "$billAmount" } } },
    ]);

    // Total spend tracked
    const totalSpendResult = await Bill.aggregate([
      { $group: { _id: null, total: { $sum: "$billAmount" } } },
    ]);
    const lastMonthSpendResult = await Bill.aggregate([
      { $match: { createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$billAmount" } } },
    ]);

    const totalSpend     = totalSpendResult[0]?.total || 0;
    const lastMonthSpend = lastMonthSpendResult[0]?.total || 0;
    const spendChange    = lastMonthSpend > 0
      ? parseFloat(((totalSpend - lastMonthSpend) / lastMonthSpend * 100).toFixed(1))
      : 0;

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        newThisMonth,
        totalBills,
        billsThisMonth,
        electricityAvg: Math.round(elecAvgResult[0]?.avg  || 0),
        waterAvg:       Math.round(waterAvgResult[0]?.avg || 0),
        totalSpend:     Math.round(totalSpend),
        spendChange,
        systemAlerts:   0,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET /api/admin/monthly-stats
// Last 7 months of avg electricity, water, user counts
// ─────────────────────────────────────────
export const getMonthlyStats = async (req, res) => {
  try {
    const months = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date  = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = date.toLocaleString("default", { month: "short" });

      const [elec, water, users] = await Promise.all([
        Bill.aggregate([
          { $match: { utilityType: "Electricity", createdAt: { $gte: date, $lt: end } } },
          { $group: { _id: null, avg: { $avg: "$billAmount" } } },
        ]),
        Bill.aggregate([
          { $match: { utilityType: "Water", createdAt: { $gte: date, $lt: end } } },
          { $group: { _id: null, avg: { $avg: "$billAmount" } } },
        ]),
        User.countDocuments({ role: "user", createdAt: { $lt: end } }),
      ]);

      months.push({
        month:       label,
        electricity: Math.round(elec[0]?.avg  || 0),
        water:       Math.round(water[0]?.avg || 0),
        users,
      });
    }

    res.json({ success: true, monthlyStats: months });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET /api/admin/users
// All users with their bill summary stats
// ─────────────────────────────────────────
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password")
      .sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const bills = await Bill.find({ user: user._id });

        const elecBills  = bills.filter(b => b.utilityType === "Electricity");
        const waterBills = bills.filter(b => b.utilityType === "Water");

        const electricityAvg = elecBills.length
          ? Math.round(elecBills.reduce((s, b) => s + b.billAmount, 0) / elecBills.length)
          : 0;
        const waterAvg = waterBills.length
          ? Math.round(waterBills.reduce((s, b) => s + b.billAmount, 0) / waterBills.length)
          : 0;

        const lastBill = bills.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        )[0];

        return {
          _id:           user._id,
          name:          user.name,
          email:         user.email,
          role:          user.role,
          status:        user.status || "active",
          totalBills:    bills.length,
          electricityAvg,
          waterAvg,
          createdAt:     user.createdAt,
          joined:        user.createdAt.toLocaleString("default", { month: "short", year: "numeric" }),
          lastActive:    lastBill
            ? timeAgo(new Date(lastBill.createdAt))
            : "No activity",
        };
      })
    );

    res.json({ success: true, users: usersWithStats });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// PUT /api/admin/users/:id/status
// Activate or deactivate a user
// body: { status: "active" | "inactive" }
// ─────────────────────────────────────────
export const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ success: false, message: "status must be 'active' or 'inactive'" });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: `User ${status}d successfully`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET /api/admin/activity
// Recent bill additions and user registrations
// ─────────────────────────────────────────
export const getRecentActivity = async (req, res) => {
  try {
    const [recentBills, recentUsers] = await Promise.all([
      Bill.find().sort({ createdAt: -1 }).limit(5).populate("user", "name"),
      User.find({ role: "user" }).sort({ createdAt: -1 }).limit(3).select("name createdAt"),
    ]);

    // ✅ FIXED: store raw Date for sorting, then convert to string
    const billActivity = recentBills.map(b => ({
      id:        b._id,
      user:      b.user?.name || "Unknown",
      action:    `Added ${b.utilityType.toLowerCase()} bill`,
      amount:    b.billAmount,
      time:      timeAgo(new Date(b.createdAt)),
      _sortDate: b.createdAt,   // ← real Date for sorting
      type:      "bill",
    }));

    const userActivity = recentUsers.map(u => ({
      id:        u._id,
      user:      u.name,
      action:    "Registered account",
      amount:    null,
      time:      timeAgo(new Date(u.createdAt)),
      _sortDate: u.createdAt,   // ← real Date for sorting
      type:      "user",
    }));

    // ✅ FIXED: sort by real timestamp, not by "3 days ago" string
    const activity = [...billActivity, ...userActivity]
      .sort((a, b) => new Date(b._sortDate) - new Date(a._sortDate))
      .slice(0, 8)
      .map(({ _sortDate, ...rest }) => rest); // strip internal field before sending

    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Helper: human-readable time ago ──
const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60)     return "Just now";
  if (seconds < 3600)   return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400)  return `${Math.floor(seconds / 3600)} hrs ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return `${Math.floor(seconds / 604800)} weeks ago`;
};