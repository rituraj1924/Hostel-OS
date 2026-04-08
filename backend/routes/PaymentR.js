const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/payment");
const User = require("../models/db");
const Room = require("../models/room");
const { auth, authorize } = require("../middleware/authmiddleware");
const paymentNotificationService = require("../services/paymentNotificationService");
const paymentScheduler = require("../services/paymentScheduler");
const emailService = require("../services/emailService");
const {
  getFeeConfigForBillingMonth,
  dueDateForBillingMonth,
  calendarDaysOverdue,
  expectedBaseAmount,
  computeLateFeeAmount,
} = require("../utils/feeConfigHelpers");

const router = express.Router();

const AMOUNT_TOLERANCE = 1.51; // ₹ rounding vs client

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return null;
  }
  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// ======= SPECIFIC ROUTES MUST COME FIRST (before generic / and /:id routes) =======
// Order: Specific named routes first (/create-order, /verify, /webhook, /user/:userId, /stats/*, /overdue, /analytics, /manual, etc.)
// Then: Generic routes (POST /, PUT /:id, GET /:id, GET /)

// @route   POST /api/payments/create-order
// @desc    Create Razorpay order
// @access  Private
router.post("/create-order", auth, async (req, res) => {
  try {
    const { amount, paymentType, description, roomId, year, month } = req.body;

    // Validate required fields
    if (amount == null || !paymentType) {
      return res.status(400).json({
        success: false,
        message: "Amount and payment type are required",
      });
    }

    const now = new Date();
    const billingY =
      year != null ? Number(year) : now.getFullYear();
    const billingM =
      month != null ? Number(month) : now.getMonth();

    if (
      !Number.isFinite(billingY) ||
      !Number.isFinite(billingM) ||
      billingY < 2000 ||
      billingY > 2100 ||
      billingM < 0 ||
      billingM > 11
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid billing year and month (0–11) are required",
      });
    }

    const cfg = await getFeeConfigForBillingMonth(billingY, billingM);
    const dueDate = dueDateForBillingMonth(
      billingY,
      billingM,
      cfg.dueDayOfMonth
    );

    const base = parseFloat(amount);
    if (!Number.isFinite(base) || base < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    const expected = expectedBaseAmount(cfg, paymentType);
    if (expected > 0 && Math.abs(base - expected) > AMOUNT_TOLERANCE) {
      return res.status(400).json({
        success: false,
        message: `Amount must match admin fee for this period (expected ₹${expected})`,
      });
    }

    const daysLate = calendarDaysOverdue(dueDate, now);
    const lateFee = computeLateFeeAmount(daysLate, cfg.lateFeePerDay);
    const chargeTotal = base + lateFee;

    // Create payment record with pending status
    const paymentData = {
      user: req.user._id,
      amount: base,
      paymentType,
      description:
        (description && String(description).slice(0, 200)) ||
        `${paymentType.replace(/_/g, " ")} payment`,
      status: "pending",
      dueDate,
      billingYear: billingY,
      billingMonth: billingM,
      lateFee,
      discount: 0,
      finalAmount: chargeTotal,
    };

    if (roomId) {
      paymentData.room = roomId;
    }

    const payment = new Payment(paymentData);
    await payment.save();

    // Create Razorpay order (charge includes per-day late fee if past due)
    const options = {
      amount: Math.round(chargeTotal * 100), // paise
      currency: "INR",
      receipt: `rcpt_${payment._id}`,
      notes: {
        paymentId: payment._id.toString(),
        userId: req.user._id.toString(),
        paymentType: paymentType,
        billingYear: String(billingY),
        billingMonth: String(billingM),
      },
    };

    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message:
          "Payment gateway is not configured (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)",
      });
    }

    const razorpayOrder = await razorpay.orders.create(options);

    // Update payment with Razorpay order ID
    payment.razorpayOrderId = razorpayOrder.id;
    await payment.save();

    res.json({
      success: true,
      order: razorpayOrder,
      payment: payment,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create payment order",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment
// @access  Private
router.post("/verify", auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentId,
    } = req.body;

    // Validate required fields
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !paymentId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification data",
      });
    }

    // Find the payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed
      payment.status = "failed";
      await payment.save();

      return res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature",
      });
    }

    // Payment successful - update payment record
    payment.status = "completed";
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.razorpaySignature = razorpay_signature;
    payment.paidDate = new Date();
    payment.paymentMethod = "razorpay";

    await payment.save();

    // Populate user data for email
    await payment.populate("user", "name email studentId phoneNumber");

    // Send payment confirmation email
    await paymentNotificationService.sendPaymentConfirmation(payment._id);

    // Send payment acknowledgment email
    await emailService
      .sendPaymentAcknowledgmentEmail(payment.user, payment)
      .then((result) => {
        if (result.success) {
          console.log(
            `📧 Payment acknowledgment email sent to ${payment.user.email}`
          );
        } else {
          console.error(
            `❌ Failed to send payment acknowledgment email:`,
            result.error
          );
        }
      })
      .catch((error) => {
        console.error(`❌ Error sending payment acknowledgment email:`, error);
      });

    // Populate room data for response
    await payment.populate("room", "roomNumber building floor");

    res.json({
      success: true,
      message: "Payment verified successfully",
      payment: payment,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Webhook is registered in server.js with express.raw() for correct signature verification.

// @route   POST /api/payments/bulk-assign
// @desc    Create bulk payments for students by floor/year
// @access  Admin/Warden
router.post(
  "/bulk-assign",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const {
        floor,
        collegeYear,
        amount,
        paymentType,
        description,
        dueDate,
        billingYear,
        billingMonth,
      } = req.body;

      if (!amount || !paymentType) {
        return res.status(400).json({ success: false, message: "Amount and Payment Type are required." });
      }

      let resolvedDueDate = dueDate ? new Date(dueDate) : null;
      let billingY;
      let billingM;

      if (billingYear != null && billingMonth != null) {
        billingY = Number(billingYear);
        billingM = Number(billingMonth);
        if (
          !Number.isFinite(billingY) ||
          !Number.isFinite(billingM) ||
          billingM < 0 ||
          billingM > 11
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid billingYear or billingMonth (month 0–11).",
          });
        }
        const cfg = await getFeeConfigForBillingMonth(billingY, billingM);
        resolvedDueDate = dueDateForBillingMonth(
          billingY,
          billingM,
          cfg.dueDayOfMonth
        );
      } else if (!resolvedDueDate || Number.isNaN(resolvedDueDate.getTime())) {
        resolvedDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }

      // Find users matching collegeYear or floor
      let userQuery = { role: "student", isActive: true };
      
      if (collegeYear) {
        userQuery.collegeYear = Number(collegeYear);
      }

      let usersToCharge = [];

      // If floor is specified, we must find users residing on that floor
      if (floor) {
        const Room = require("../models/room");
        const roomsOnFloor = await Room.find({ floor: Number(floor) });
        const roomIds = roomsOnFloor.map((r) => r._id);
        
        userQuery.room = { $in: roomIds };
      }

      const User = require("../models/db"); // Using main db.js which exports User model
      usersToCharge = await User.find(userQuery);

      if (usersToCharge.length === 0) {
        return res.status(404).json({ success: false, message: "No active students found matching criteria." });
      }

      const amt = Number(amount);
      const paymentDocs = usersToCharge.map((user) => ({
        user: user._id,
        room: user.room,
        amount: amt,
        paymentType,
        paymentMethod: "razorpay", // Typically these will be pending online payments
        description,
        dueDate: resolvedDueDate,
        billingYear: billingY,
        billingMonth: billingM,
        lateFee: 0,
        discount: 0,
        status: "pending",
        finalAmount: amt,
      }));

      // Bulk insert
      const Payment = require("../models/payment"); // Ensuring we have access if not globally scoped
      const insertedPayments = await Payment.insertMany(paymentDocs);

      // Optionally emit sockets or send emails (omitted for brevity)

      res.status(201).json({
        success: true,
        message: `Successfully created ${insertedPayments.length} payments.`,
        count: insertedPayments.length,
      });
    } catch (error) {
      console.error("Bulk payment error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during bulk payment assignment.",
      });
    }
  }
);

// @route   POST /api/payments
// @desc    Create manual payment (Admin/Warden)
// @access  Admin/Warden
router.post("/", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    const {
      userId,
      amount,
      paymentType,
      paymentMethod,
      description,
      dueDate,
      billingYear,
      billingMonth,
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let resolvedDue = dueDate ? new Date(dueDate) : null;
    let billingY;
    let billingM;
    if (billingYear != null && billingMonth != null) {
      billingY = Number(billingYear);
      billingM = Number(billingMonth);
      const cfg = await getFeeConfigForBillingMonth(billingY, billingM);
      resolvedDue = dueDateForBillingMonth(billingY, billingM, cfg.dueDayOfMonth);
    } else if (!resolvedDue || Number.isNaN(resolvedDue.getTime())) {
      resolvedDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const base = parseFloat(amount);
    const payment = new Payment({
      user: userId,
      room: user.room,
      amount: base,
      paymentType,
      paymentMethod,
      description,
      dueDate: resolvedDue,
      billingYear: billingY,
      billingMonth: billingM,
      lateFee: 0,
      discount: 0,
      status: paymentMethod === "cash" ? "completed" : "pending",
      paidDate: paymentMethod === "cash" ? new Date() : undefined,
    });

    await payment.save();
    await payment.populate("user", "name email studentId phoneNumber");

    // Emit real-time notification
    const io = req.app.get("io");
    io.emit("paymentCreated", payment);

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      payment,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   PUT /api/payments/:id
// @desc    Update payment
// @access  Admin/Warden
router.put("/:id", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("user", "name email studentId phoneNumber");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Emit real-time update
    const io = req.app.get("io");
    io.emit("paymentUpdated", payment);

    res.json({
      success: true,
      message: "Payment updated successfully",
      payment,
    });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/payments/user/:userId
// @desc    Get payments for specific user
// @access  Admin/Warden/Own user
router.get("/user/:userId", auth, async (req, res) => {
  try {
    // Check authorization
    if (
      req.user.role === "student" &&
      req.user._id.toString() !== req.params.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const payments = await Payment.find({ user: req.params.userId })
      .populate("user", "name email studentId phoneNumber")
      .populate("room", "roomNumber building floor")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get user payments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/payments/stats/summary
// @desc    Get payment statistics
// @access  Admin/Warden
router.get(
  "/stats/summary",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const stats = await Payment.aggregate([
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalAmount: { $sum: "$finalAmount" },
            completedPayments: {
              $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
            },
            pendingPayments: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            completedAmount: {
              $sum: {
                $cond: [{ $eq: ["$status", "completed"] }, "$finalAmount", 0],
              },
            },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ["$status", "pending"] }, "$finalAmount", 0],
              },
            },
          },
        },
      ]);

      const paymentStats = stats[0] || {
        totalPayments: 0,
        totalAmount: 0,
        completedPayments: 0,
        pendingPayments: 0,
        completedAmount: 0,
        pendingAmount: 0,
      };

      res.json({
        success: true,
        stats: paymentStats,
      });
    } catch (error) {
      console.error("Get payment stats error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/payments/stats/my-summary
// @desc    Get user's own payment statistics
// @access  Private (students can access their own stats)
router.get("/stats/my-summary", auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Payment.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          completedPayments: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          failedPayments: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
          completedAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0],
            },
          },
          pendingAmount: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
            },
          },
        },
      },
    ]);

    const paymentStats = stats[0] || {
      totalPayments: 0,
      totalAmount: 0,
      completedPayments: 0,
      pendingPayments: 0,
      failedPayments: 0,
      completedAmount: 0,
      pendingAmount: 0,
    };

    res.json({
      success: true,
      stats: paymentStats,
    });
  } catch (error) {
    console.error("Get user payment stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/payments/manual
// @desc    Create manual payment (admin only)
// @access  Admin/Warden
router.post("/manual", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    const {
      userId,
      amount,
      paymentType,
      paymentMethod,
      description,
      roomId,
      billingYear,
      billingMonth,
    } = req.body;

    // Validate required fields
    if (!userId || !amount || !paymentType || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message:
          "User ID, amount, payment type, and payment method are required",
      });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let dueD = new Date();
    let billingY;
    let billingM;
    if (billingYear != null && billingMonth != null) {
      billingY = Number(billingYear);
      billingM = Number(billingMonth);
      const cfg = await getFeeConfigForBillingMonth(billingY, billingM);
      dueD = dueDateForBillingMonth(billingY, billingM, cfg.dueDayOfMonth);
    }

    const base = parseFloat(amount);
    // Create payment record
    const paymentData = {
      user: userId,
      amount: base,
      paymentType,
      paymentMethod,
      description:
        description || `Manual ${paymentType.replace("_", " ")} payment`,
      status: "completed",
      dueDate: dueD,
      billingYear: billingY,
      billingMonth: billingM,
      lateFee: 0,
      discount: 0,
      paidDate: new Date(),
    };

    if (roomId) {
      paymentData.room = roomId;
    }

    const payment = new Payment(paymentData);
    await payment.save();

    // Populate user and room data
    await payment.populate("user", "name email studentId phoneNumber");
    await payment.populate("room", "roomNumber building floor");

    res.json({
      success: true,
      message: "Manual payment created successfully",
      payment: payment,
    });
  } catch (error) {
    console.error("Create manual payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create manual payment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   POST /api/payments/:id/refund
// @desc    Process refund (admin only)
// @access  Admin/Warden
router.post(
  "/:id/refund",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const { amount: refundAmount, reason } = req.body;
      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      if (payment.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "Can only refund completed payments",
        });
      }

      let refundAmountToProcess = refundAmount || payment.finalAmount;

      // Process refund through Razorpay if it was a Razorpay payment
      if (payment.paymentMethod === "razorpay" && payment.razorpayPaymentId) {
        try {
          const razorpay = getRazorpay();
          if (!razorpay) {
            return res.status(503).json({
              success: false,
              message: "Payment gateway is not configured",
            });
          }
          const refund = await razorpay.payments.refund(
            payment.razorpayPaymentId,
            {
              amount: Math.round(refundAmountToProcess * 100), // Convert to paise
              notes: {
                reason: reason || "Refund processed by admin",
                refundedBy: req.user._id.toString(),
              },
            }
          );

          payment.status = "refunded";
          payment.description = `${payment.description} - Refunded: ₹${refundAmountToProcess}`;
          await payment.save();

          res.json({
            success: true,
            message: "Refund processed successfully",
            refund: refund,
            payment: payment,
          });
        } catch (razorpayError) {
          console.error("Razorpay refund error:", razorpayError);
          res.status(500).json({
            success: false,
            message: "Failed to process refund through Razorpay",
            error: razorpayError.message,
          });
        }
      } else {
        // Manual refund for non-Razorpay payments
        payment.status = "refunded";
        payment.description = `${payment.description} - Manual Refund: ₹${refundAmountToProcess}`;
        await payment.save();

        res.json({
          success: true,
          message: "Manual refund processed successfully",
          payment: payment,
        });
      }
    } catch (error) {
      console.error("Process refund error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process refund",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   GET /api/payments/overdue
// @desc    Get overdue payments
// @access  Admin/Warden
router.get("/overdue", auth, authorize("admin", "warden"), async (req, res) => {
  try {
    console.log("📊 Fetching overdue payments...");
    const overduePayments = await Payment.find({
      status: "pending",
      dueDate: { $lt: new Date() },
    })
      .populate("user", "name email studentId phoneNumber")
      .populate("room", "roomNumber building floor")
      .sort({ dueDate: 1 });

    console.log("✅ Found overdue payments:", overduePayments.length);
    res.json({
      success: true,
      count: overduePayments.length,
      payments: overduePayments,
    });
  } catch (error) {
    console.error("❌ Get overdue payments error:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({
      success: false,
      message: "Failed to fetch overdue payments",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/payments/analytics
// @desc    Get payment analytics
// @access  Admin/Warden
router.get(
  "/analytics",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      console.log("📊 Fetching payment analytics...");
      const { startDate, endDate } = req.query;
      const filter = {};

      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      console.log("📋 Using filter:", filter);

      // Get analytics data
      const [
        totalRevenue,
        pendingPayments,
        completedPayments,
        overduePayments,
        paymentsByType,
        monthlyRevenue,
      ] = await Promise.all([
        Payment.aggregate([
          { $match: { ...filter, status: "completed" } },
          { $group: { _id: null, total: { $sum: "$finalAmount" } } },
        ]),
        Payment.countDocuments({ ...filter, status: "pending" }),
        Payment.countDocuments({ ...filter, status: "completed" }),
        Payment.countDocuments({
          ...filter,
          status: "pending",
          dueDate: { $lt: new Date() },
        }),
        Payment.aggregate([
          { $match: { ...filter, status: "completed" } },
          {
            $group: {
              _id: "$paymentType",
              total: { $sum: "$finalAmount" },
              count: { $sum: 1 },
            },
          },
        ]),
        Payment.aggregate([
          { $match: { ...filter, status: "completed" } },
          {
            $group: {
              _id: {
                year: { $year: "$paidDate" },
                month: { $month: "$paidDate" },
              },
              revenue: { $sum: "$finalAmount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]),
      ]);

      const analytics = {
        totalRevenue: totalRevenue[0]?.total || 0,
        pendingPayments,
        completedPayments,
        overduePayments,
        paymentsByType,
        monthlyRevenue,
        totalPayments: pendingPayments + completedPayments,
      };

      console.log("✅ Analytics data ready");
      res.json({
        success: true,
        analytics,
      });
    } catch (error) {
      console.error("❌ Get payment analytics error:", error);
      console.error("❌ Error stack:", error.stack);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment analytics",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/payments/send-reminders
// @desc    Send payment reminders manually
// @access  Admin/Warden
router.post(
  "/send-reminders",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const result = await paymentScheduler.sendManualReminders();
      res.json(result);
    } catch (error) {
      console.error("Send reminders error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send payment reminders",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// @route   POST /api/payments/send-overdue-alerts
// @desc    Send overdue alerts to admins manually
// @access  Admin/Warden
router.post(
  "/send-overdue-alerts",
  auth,
  authorize("admin", "warden"),
  async (req, res) => {
    try {
      const result = await paymentScheduler.sendManualOverdueAlerts();
      res.json(result);
    } catch (error) {
      console.error("Send overdue alerts error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send overdue alerts",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// ======= GENERIC ROUTES (at the end, after all specific routes) =======

// @route   GET /api/payments
// @desc    Get all payments (with filters)
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { status, paymentType, user: userId } = req.query;
    const filter = {};

    // Students can only see their own payments
    if (req.user.role === "student") {
      filter.user = req.user._id;
    } else if (userId) {
      filter.user = userId;
    }

    if (status) filter.status = status;
    if (paymentType) filter.paymentType = paymentType;

    const payments = await Payment.find(filter)
      .populate("user", "name email studentId phoneNumber")
      .populate("room", "roomNumber building floor")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// @route   GET /api/payments/:id
// @desc    Get single payment
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("user", "name email studentId phoneNumber")
      .populate("room", "roomNumber building floor");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Students can only view their own payments
    if (
      req.user.role === "student" &&
      payment.user._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
