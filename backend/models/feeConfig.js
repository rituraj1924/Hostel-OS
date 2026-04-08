const mongoose = require("mongoose");

const feeConfigSchema = new mongoose.Schema(
  {
    academicYear: {
      type: String, // e.g. "2025-2026"
      required: true,
      unique: true,
    },
    monthly_rent: { type: Number, default: 15000, min: 0 },
    mess_fee:     { type: Number, default: 8000,  min: 0 },
    maintenance:  { type: Number, default: 2000,  min: 0 },
    laundry:      { type: Number, default: 1500,  min: 0 },
    fine:         { type: Number, default: 500,   min: 0 },
    security_deposit: { type: Number, default: 3000, min: 0 },
    dueDayOfMonth: { type: Number, default: 15, min: 1, max: 28 }, // day of month payment is due
    lateFeePerDay: { type: Number, default: 50, min: 0 }, // ₹ per day after due date
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeeConfig", feeConfigSchema);
