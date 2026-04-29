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
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // User stats
    const totalUsers   = await User.countDocuments({ role: "user" });
    const newThisMonth = await User.countDocuments({
      role: "user",
      createdAt: { $gte: startOfMonth },
    });
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

    // ============================================
    // SYSTEM ALERTS - COUNT ALL ALERT TYPES
    // ============================================
    let alertCount = 0;
    const alertDetails = {
      anomaly: 0,
      missingData: 0,
      budget: 0,
      email: 0,
      reminder: 0
    };

    // 1. ANOMALY ALERTS (usage spike >20% in last 30 days)
    const allBills = await Bill.find({ createdAt: { $gte: last30Days } });
    const billsByUser = {};
    for (const bill of allBills) {
      const key = `${bill.user}_${bill.utilityType}`;
      if (!billsByUser[key]) billsByUser[key] = [];
      billsByUser[key].push(bill);
    }
    
    for (const [key, userBills] of Object.entries(billsByUser)) {
      if (userBills.length >= 4) {
        userBills.sort((a, b) => new Date(b.billingMonth) - new Date(a.billingMonth));
        const current = userBills[0].billAmount;
        const prevThree = userBills.slice(1, 4);
        const avgPrev = prevThree.reduce((s, b) => s + b.billAmount, 0) / prevThree.length;
        const percentIncrease = ((current - avgPrev) / avgPrev) * 100;
        
        if (percentIncrease > 20) {
          alertCount++;
          alertDetails.anomaly++;
        }
      }
    }

    // 2. MISSING DATA ALERTS (users with <3 months of bills but >0)
    const allUsers = await User.find({ role: "user" });
    for (const user of allUsers) {
      const userBillCount = await Bill.countDocuments({ user: user._id });
      if (userBillCount > 0 && userBillCount < 3) {
        alertCount++;
        alertDetails.missingData++;
      }
    }

    // 3. BUDGET EXCEEDED ALERTS (predicted >8% of salary)
    for (const user of allUsers) {
      if (user.salary && user.salary > 0) {
        const userBills = await Bill.find({ user: user._id }).sort({ billingMonth: -1 }).limit(6);
        if (userBills.length >= 3) {
          const recentBills = userBills.slice(0, 3);
          const avgBill = recentBills.reduce((s, b) => s + b.billAmount, 0) / recentBills.length;
          const percentOfSalary = (avgBill / user.salary) * 100;
          
          if (percentOfSalary > 8) {
            alertCount++;
            alertDetails.budget++;
          }
        }
      }
    }

    // 4. EMAIL NOTIFICATION ALERTS (users receiving prediction emails)
    const usersWithEmailEnabled = await User.countDocuments({
      'preferences.emailNotifications': true
    });
    
    if (usersWithEmailEnabled > 0) {
      alertCount += usersWithEmailEnabled;
      alertDetails.email = usersWithEmailEnabled;
    }

    // 5. MONTH-END REMINDERS (users who haven't added current month bill)
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const usersWhoAddedThisMonth = await Bill.distinct("user", { 
      createdAt: { $gte: currentMonthStart } 
    });
    const usersWithoutCurrentMonth = allUsers.filter(
      user => !usersWhoAddedThisMonth.includes(user._id.toString())
    ).length;
    
    if (usersWithoutCurrentMonth > 0) {
      alertCount += usersWithoutCurrentMonth;
      alertDetails.reminder = usersWithoutCurrentMonth;
    }

    console.log(`📊 System Alerts: ${alertCount} total`);
    console.log(`   - Anomaly: ${alertDetails.anomaly}`);
    console.log(`   - Missing Data: ${alertDetails.missingData}`);
    console.log(`   - Budget Exceeded: ${alertDetails.budget}`);
    console.log(`   - Email Notifications: ${alertDetails.email}`);
    console.log(`   - Month-end Reminders: ${alertDetails.reminder}`);

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
        systemAlerts:   alertCount,  // ✅ NOW COUNTS ALL ALERT TYPES!
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
    console.error(error);
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
          salary:        user.salary || 0,
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
    console.error(error);
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
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ─────────────────────────────────────────
// GET /api/admin/activity
// Recent bill additions and user registrations (WITH anomaly detection)
// ─────────────────────────────────────────
export const getRecentActivity = async (req, res) => {
  try {
    const [recentBills, recentUsers] = await Promise.all([
      Bill.find().sort({ createdAt: -1 }).limit(10).populate("user", "name"),
      User.find({ role: "user" }).sort({ createdAt: -1 }).limit(5).select("name createdAt"),
    ]);

    const billActivity = [];
    
    // Process each bill and check for anomalies
    for (const bill of recentBills) {
      // Get previous 3 bills for this user and utility
      const olderBills = await Bill.find({
        user: bill.user,
        utilityType: bill.utilityType,
        _id: { $ne: bill._id }
      }).sort({ billingMonth: -1 }).limit(3);
      
      let isAnomaly = false;
      let percentIncrease = 0;
      
      if (olderBills.length >= 3) {
        const avgPrev = olderBills.reduce((s, b) => s + b.billAmount, 0) / olderBills.length;
        percentIncrease = ((bill.billAmount - avgPrev) / avgPrev) * 100;
        isAnomaly = percentIncrease > 20;
      }
      
      billActivity.push({
        id:        bill._id,
        user:      bill.user?.name || "Unknown",
        action:    isAnomaly 
          ? `⚠️ UNUSUAL: ${bill.utilityType} bill is ${percentIncrease.toFixed(0)}% above average` 
          : `Added ${bill.utilityType.toLowerCase()} bill`,
        amount:    bill.billAmount,
        time:      timeAgo(new Date(bill.createdAt)),
        _sortDate: bill.createdAt,
        type:      isAnomaly ? "alert" : "bill",
      });
    }

    const userActivity = recentUsers.map(u => ({
      id:        u._id,
      user:      u.name,
      action:    "Registered account",
      amount:    null,
      time:      timeAgo(new Date(u.createdAt)),
      _sortDate: u.createdAt,
      type:      "user",
    }));

    // Sort by real timestamp
    const activity = [...billActivity, ...userActivity]
      .sort((a, b) => new Date(b._sortDate) - new Date(a._sortDate))
      .slice(0, 10)
      .map(({ _sortDate, ...rest }) => rest);

    res.json({ success: true, activity });
  } catch (error) {
    console.error(error);
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