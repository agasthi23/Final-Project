// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import tariffRoutes from "./routes/tariffRoutes.js";
import adminRoutes  from "./routes/adminRoutes.js";
import reportsRoutes from "./routes/reportsRoutes.js";
import predictionsRoutes from "./routes/predictionsRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import userRoutes from "./routes/userRoutes.js";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Auth routes
app.use("/api/auth", authRoutes);

app.use("/api/bills", billRoutes);
app.use("/api/tariff", tariffRoutes);
app.use("/api/admin",  adminRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/predictions", predictionsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);

import scheduler from './services/scheduler.js';
scheduler.start();



// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ MongoDB connection error:", err);
  });