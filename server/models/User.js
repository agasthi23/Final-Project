import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  salary: { type: Number, default: 0 },

  // ── Budget Mode ──────────────────────────────────────────────────────────────
  budgetMode: {
    type: String,
    enum: ["salary", "fixed"],
    default: "salary",
  },
  fixedBudget: {
    type: Number,
    default: 0,
    min: 0,
  },
  // ─────────────────────────────────────────────────────────────────────────────

  profilePicture: { type: String, default: "" },
  preferences: {
    darkMode: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    usageAlerts: { type: Boolean, default: true },
  },
  householdFeatures: {
    electricity: {
      num_ac: { type: Number, default: 0 },
      ac_type: { type: String, default: "non_inverter" },
      num_refrigerators: { type: Number, default: 1 },
      fridge_age_years: { type: Number, default: 5 },
      num_tvs: { type: Number, default: 1 },
      num_computers: { type: Number, default: 0 },
      has_electric_water_heater: { type: Boolean, default: false },
      has_washing_machine: { type: Boolean, default: false },
      has_solar: { type: Boolean, default: false },
      has_electric_vehicle: { type: Boolean, default: false },
      num_floors: { type: Number, default: 1 },
      house_area_sqft: { type: Number, default: 1000 },
    },
    water: {
      num_bathrooms: { type: Number, default: 1 },
      num_people: { type: Number, default: 1 },
      has_water_heater: { type: Boolean, default: false },
      has_washing_machine: { type: Boolean, default: false },
      has_garden: { type: Boolean, default: false },
      has_pool: { type: Boolean, default: false },
      has_water_tank: { type: Boolean, default: false },
      building_type: { type: String, default: "house" },
    },
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);