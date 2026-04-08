// backend/services/paymentScheduler.js
const cron = require("node-cron");
const paymentNotificationService = require("./paymentNotificationService");
const Payment = require("../models/payment");
const {
  getFeeConfigForPayment,
  calendarDaysOverdue,
  computeLateFeeAmount,
} = require("../utils/feeConfigHelpers");

class PaymentScheduler {
  init() {
    // Send daily payment reminders at 9:00 AM
    cron.schedule("0 9 * * *", async () => {
      console.log("🔔 Running daily payment reminder job...");
      try {
        await paymentNotificationService.sendBulkPaymentReminders();
        console.log("✅ Daily payment reminders sent successfully");
      } catch (error) {
        console.error("❌ Error sending daily payment reminders:", error);
      }
    });

    // Send overdue alerts to admins every Monday at 10:00 AM
    cron.schedule("0 10 * * 1", async () => {
      console.log("⚠️ Running weekly overdue payment alert job...");
      try {
        await paymentNotificationService.sendOverdueAlertToAdmins();
        console.log("✅ Weekly overdue alerts sent to admins");
      } catch (error) {
        console.error("❌ Error sending overdue alerts:", error);
      }
    });

    // Recalculate late fees daily (admin-configured ₹ per day after due date)
    cron.schedule("0 0 * * *", async () => {
      console.log("💰 Running late fee recalculation job...");
      try {
        await this.generateLateFees();
        console.log("✅ Late fees recalculated successfully");
      } catch (error) {
        console.error("❌ Error generating late fees:", error);
      }
    });

    console.log("📅 Payment scheduler initialized with the following jobs:");
    console.log("  - Daily payment reminders: 9:00 AM");
    console.log("  - Weekly overdue alerts: Monday 10:00 AM");
    console.log("  - Late fee recalculation: Daily 12:00 AM (uses FeeConfig.lateFeePerDay)");
  }

  async generateLateFees() {
    try {
      const now = new Date();
      const overduePayments = await Payment.find({
        status: "pending",
        dueDate: { $lt: now },
      });

      let updated = 0;
      for (const payment of overduePayments) {
        // Checkout amount is fixed once a Razorpay order exists
        if (payment.razorpayOrderId) continue;

        const cfg = await getFeeConfigForPayment(payment);
        const daysOverdue = calendarDaysOverdue(payment.dueDate, now);
        const lateFee = computeLateFeeAmount(daysOverdue, cfg.lateFeePerDay);
        const prev = Number(payment.lateFee) || 0;
        if (Math.abs(prev - lateFee) < 0.005) continue;

        payment.lateFee = lateFee;
        await payment.save();
        updated++;
      }

      console.log(
        `Processed ${overduePayments.length} overdue pending payments; updated late fees on ${updated}`
      );
    } catch (error) {
      console.error("Error generating late fees:", error);
      throw error;
    }
  }

  // Manual function to send payment reminders (can be called via API)
  async sendManualReminders() {
    try {
      await paymentNotificationService.sendBulkPaymentReminders();
      return { success: true, message: "Payment reminders sent successfully" };
    } catch (error) {
      console.error("Error sending manual payment reminders:", error);
      return {
        success: false,
        message: "Failed to send payment reminders",
        error: error.message,
      };
    }
  }

  // Manual function to send overdue alerts
  async sendManualOverdueAlerts() {
    try {
      await paymentNotificationService.sendOverdueAlertToAdmins();
      return { success: true, message: "Overdue alerts sent to admins" };
    } catch (error) {
      console.error("Error sending manual overdue alerts:", error);
      return {
        success: false,
        message: "Failed to send overdue alerts",
        error: error.message,
      };
    }
  }
}

module.exports = new PaymentScheduler();
