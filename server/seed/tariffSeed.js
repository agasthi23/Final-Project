/**
 * Tariff Seed Script — Sri Lanka (April 2026)
 * Run: node server/seed/tariffSeed.js
 * Format matches models/Tariff.js exactly — no slabs, only tiers
 */

import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const MONGO_URI = process.env.MONGO_URI;

// Use the REAL model — same schema, same validation
const tariffSchema = new mongoose.Schema({
  utilityType: { type: String, enum: ["electricity", "water"], required: true },
  tiers: [{ upTo: { type: Number, default: null }, ratePerUnit: { type: Number, required: true } }],
  fixedCharge: { type: Number, required: true, default: 0 },
  effectiveFrom: { type: Date, required: true },
  status: { type: String, enum: ["active", "archived"], default: "active" },
  createdBy: mongoose.Schema.Types.ObjectId,
}, { timestamps: true, strict: true });

const Tariff = mongoose.models.Tariff || mongoose.model("Tariff", tariffSchema);

// ── Electricity Tariffs ──────────────────────────────────────
const electricityTariff2026 = {
  utilityType: "electricity",
  effectiveFrom: new Date("2026-04-01"),
  status: "active",
  fixedCharge: 80,
  tiers: [
    { upTo: 30,   ratePerUnit: 5.00  },   // 0-30 units: Rs. 5.00
    { upTo: 60,   ratePerUnit: 9.00  },   // 31-60 units: Rs. 9.00
    { upTo: 90,   ratePerUnit: 20.00 },   // 61-90 units: Rs. 20.00
    { upTo: 120,  ratePerUnit: 28.00 },   // 91-120 units: Rs. 28.00
    { upTo: 180,  ratePerUnit: 44.00 },   // 121-180 units: Rs. 44.00
    { upTo: null, ratePerUnit: 85.00 },   // 181+ units: Rs. 85.00
  ],
};

const electricityTariff2024 = {
  utilityType: "electricity",
  effectiveFrom: new Date("2024-01-01"),
  status: "archived",
  fixedCharge: 60,
  tiers: [
    { upTo: 30,   ratePerUnit: 2.50 },   // 0-30 units: Rs. 2.50
    { upTo: null, ratePerUnit: 4.85 },   // 31+ units: Rs. 4.85
  ],
};

// ── Water Tariff (Corrected with proper fixed charge and rates) ──
const waterTariffData = {
  utilityType: "water",
  effectiveFrom: new Date("2024-08-21"),
  status: "active",
  fixedCharge: 300,  // ✅ Fixed monthly service charge (was 0, now corrected)
  tiers: [
    { upTo: 5,    ratePerUnit: 50  },    // 0-5 units: Rs. 50.00
    { upTo: 10,   ratePerUnit: 80  },    // 6-10 units: Rs. 80.00 (corrected from 70)
    { upTo: 15,   ratePerUnit: 100 },    // 11-15 units: Rs. 100.00 (corrected from 90)
    { upTo: 20,   ratePerUnit: 120 },    // 16-20 units: Rs. 120.00 (corrected from 100)
    { upTo: 25,   ratePerUnit: 150 },    // 21-25 units: Rs. 150.00 (corrected from 120)
    { upTo: 30,   ratePerUnit: 170 },    // 26-30 units: Rs. 170.00 (corrected from 150)
    { upTo: 40,   ratePerUnit: 195 },    // 31-40 units: Rs. 195.00 (corrected from 170)
    { upTo: 50,   ratePerUnit: 225 },    // 41-50 units: Rs. 225.00 (corrected from 195)
    { upTo: 75,   ratePerUnit: 250 },    // 51-75 units: Rs. 250.00 (corrected from 225)
    { upTo: 100,  ratePerUnit: 280 },    // 76-100 units: Rs. 280.00 (corrected from 250)
    { upTo: null, ratePerUnit: 300 },    // 101+ units: Rs. 300.00 (corrected from 280)
  ],
};

// ── Seeder ────────────────────────────────────────────────────
async function seedTariffs() {
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI not defined!");
    await mongoose.connect(MONGO_URI);
    console.log("✅  Connected to MongoDB\n");

    // Wipe ALL tariffs — start fresh with correct schema
    await Tariff.deleteMany({});
    console.log("🧹 Cleared all existing tariffs\n");

    // Insert all three
    await Tariff.create(electricityTariff2026);
    console.log("⚡  Electricity April 2026 (ACTIVE) — 6 tiers, Fixed: Rs.80");

    await Tariff.create(electricityTariff2024);
    console.log("📊  Electricity Jan 2024 (ARCHIVED) — 2 tiers, Fixed: Rs.60");

    await Tariff.create(waterTariffData);
    console.log("💧  Water Aug 2024 (ACTIVE) — 11 tiers, Fixed: Rs.300\n");

    // Verify
    const all = await Tariff.find({}).sort({ effectiveFrom: 1 });
    console.log("─── FINAL DATABASE STATE ────────────────────────");
    all.forEach(t => {
      const icon = t.utilityType === "electricity" ? "⚡" : "💧";
      const active = t.status === "active" ? "🟢 ACTIVE" : "⚪ ARCHIVED";
      console.log(`  ${icon} ${t.utilityType.padEnd(12)} | ${active.padEnd(12)} | Tiers: ${t.tiers.length} | Fixed: Rs.${t.fixedCharge}`);
    });

    console.log("\n🎉  Seed complete. Data matches model schema exactly.");
  } catch (err) {
    console.error("❌  Seed failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedTariffs();