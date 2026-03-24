// server/models/Bill.js
import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    utilityType: {
      type: String,
      enum: ["Electricity", "Water"],
      required: true,
    },
    billingMonth: {
      type: String, // stored as "YYYY-MM"
      required: true,
    },
    unitsUsed: {
      type: Number,
      required: true,
    },
    billAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate bills: same user + same utility + same month
billSchema.index({ user: 1, utilityType: 1, billingMonth: 1 }, { unique: true });

export default mongoose.model("Bill", billSchema);