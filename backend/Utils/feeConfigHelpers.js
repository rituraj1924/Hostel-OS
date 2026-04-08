const FeeConfig = require("../models/feeConfig");

/** Academic year label e.g. "2025-2026" for a calendar month (0–11). */
function academicYearLabelFromMonth(year, monthIndex) {
  const m = monthIndex;
  const y = year;
  const start = m >= 6 ? y : y - 1;
  return `${start}-${start + 1}`;
}

/** Due date for a billing month using admin-configured day (clamped 1–28). */
function dueDateForBillingMonth(year, monthIndex, dueDayOfMonth) {
  const day = Math.min(Math.max(1, Number(dueDayOfMonth) || 15), 28);
  return new Date(year, monthIndex, day, 23, 59, 59, 999);
}

/** Calendar days overdue after the due date (0 if not yet overdue). */
function calendarDaysOverdue(dueDate, now = new Date()) {
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const n = new Date(now);
  n.setHours(0, 0, 0, 0);
  const diff = Math.floor((n - due) / 86400000);
  return diff > 0 ? diff : 0;
}

/** Sum of recurring monthly fees (excludes one-time security deposit). */
function monthBundleBaseAmount(cfg) {
  const keys = [
    "monthly_rent",
    "mess_fee",
    "maintenance",
    "laundry",
    "fine",
  ];
  return keys.reduce((s, k) => s + Number(cfg[k] || 0), 0);
}

/** Expected base amount for a payment type from fee config. */
function expectedBaseAmount(cfg, paymentType) {
  if (paymentType === "full_month") {
    return monthBundleBaseAmount(cfg);
  }
  if (paymentType === "monthly_rent") return Number(cfg.monthly_rent || 0);
  if (paymentType === "mess_fee") return Number(cfg.mess_fee || 0);
  if (paymentType === "maintenance") return Number(cfg.maintenance || 0);
  if (paymentType === "laundry") return Number(cfg.laundry || 0);
  if (paymentType === "fine") return Number(cfg.fine || 0);
  if (paymentType === "security_deposit") return Number(cfg.security_deposit || 0);
  return 0;
}

async function getFeeConfigForBillingMonth(year, monthIndex) {
  const label = academicYearLabelFromMonth(year, monthIndex);
  let cfg = await FeeConfig.findOne({ academicYear: label });
  if (!cfg) {
    cfg = new FeeConfig({ academicYear: label });
    await cfg.save();
  }
  return cfg;
}

/** Resolve fee config for an existing payment (prefers billing period fields). */
async function getFeeConfigForPayment(payment) {
  if (
    payment.billingYear != null &&
    payment.billingMonth != null
  ) {
    return getFeeConfigForBillingMonth(
      payment.billingYear,
      payment.billingMonth
    );
  }
  const d = new Date(payment.dueDate);
  return getFeeConfigForBillingMonth(d.getFullYear(), d.getMonth());
}

/**
 * Late fee in rupees for a base amount + days overdue (per-day rate from admin config).
 */
function computeLateFeeAmount(daysOverdue, lateFeePerDay) {
  const rate = Number(lateFeePerDay) || 0;
  if (daysOverdue <= 0 || rate <= 0) return 0;
  return Math.round(daysOverdue * rate * 100) / 100;
}

module.exports = {
  academicYearLabelFromMonth,
  dueDateForBillingMonth,
  calendarDaysOverdue,
  monthBundleBaseAmount,
  expectedBaseAmount,
  getFeeConfigForBillingMonth,
  getFeeConfigForPayment,
  computeLateFeeAmount,
};
