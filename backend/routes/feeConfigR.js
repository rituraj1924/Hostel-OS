const express = require("express");
const FeeConfig = require("../models/feeConfig");
const { auth, authorize } = require("../middleware/authmiddleware");

const router = express.Router();

/* helpers */
function currentAcademicYear() {
  const now = new Date();
  const m = now.getMonth(); // 0-based
  const y = now.getFullYear();
  // Academic year: July to June (index 6 = July)
  const start = m >= 6 ? y : y - 1;
  return `${start}-${start + 1}`;
}

async function getOrCreateConfig(year) {
  let cfg = await FeeConfig.findOne({ academicYear: year });
  if (!cfg) {
    cfg = new FeeConfig({ academicYear: year });
    await cfg.save();
  }
  return cfg;
}

// @route  GET /api/fee-config
// @desc   Get fee config for current (or specified) academic year
// @access Private (all roles)
router.get("/", auth, async (req, res) => {
  try {
    const year = req.query.year || currentAcademicYear();
    const cfg = await getOrCreateConfig(year);
    res.json({ success: true, feeConfig: cfg });
  } catch (err) {
    console.error("FeeConfig GET error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route  PUT /api/fee-config
// @desc   Update fee amounts (admin only)
// @access Admin
router.put("/", auth, authorize("admin"), async (req, res) => {
  try {
    const year = req.body.academicYear || currentAcademicYear();
    const {
      monthly_rent, mess_fee, maintenance, laundry,
      fine, security_deposit, dueDayOfMonth, lateFeePerDay,
    } = req.body;

    let cfg = await FeeConfig.findOne({ academicYear: year });
    if (!cfg) cfg = new FeeConfig({ academicYear: year });

    if (monthly_rent    !== undefined) cfg.monthly_rent    = Number(monthly_rent);
    if (mess_fee        !== undefined) cfg.mess_fee        = Number(mess_fee);
    if (maintenance     !== undefined) cfg.maintenance     = Number(maintenance);
    if (laundry         !== undefined) cfg.laundry         = Number(laundry);
    if (fine            !== undefined) cfg.fine            = Number(fine);
    if (security_deposit!== undefined) cfg.security_deposit= Number(security_deposit);
    if (dueDayOfMonth   !== undefined) cfg.dueDayOfMonth   = Number(dueDayOfMonth);
    if (lateFeePerDay   !== undefined) cfg.lateFeePerDay   = Number(lateFeePerDay);
    cfg.updatedBy = req.user._id;

    await cfg.save();
    res.json({ success: true, message: "Fee configuration updated successfully", feeConfig: cfg });
  } catch (err) {
    console.error("FeeConfig PUT error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route  GET /api/fee-config/all
// @desc   List all academic year configs (admin)
// @access Admin
router.get("/all", auth, authorize("admin"), async (req, res) => {
  try {
    const configs = await FeeConfig.find().sort({ academicYear: -1 });
    res.json({ success: true, configs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
