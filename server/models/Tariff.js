// server/models/Tariff.js
import mongoose from "mongoose";

const tierSchema = new mongoose.Schema({
  upTo:        { type: Number, default: null },
  ratePerUnit: { type: Number, required: true },
}, { _id: false });

const tariffSchema = new mongoose.Schema(
  {
    // New schema fields
    utilityType: {
      type: String,
      enum: ["electricity", "water"],
      required: true,
    },
    tiers: {
      type: [tierSchema],
      required: true,
    },
    fixedCharge: {
      type: Number,
      required: true,
      default: 0,
    },
    effectiveFrom: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

tariffSchema.index({ utilityType: 1, status: 1 });

export default mongoose.model("Tariff", tariffSchema);