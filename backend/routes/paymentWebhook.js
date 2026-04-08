const crypto = require("crypto");
const Payment = require("../models/payment");
const WebhookEvent = require("../models/webhookEvent");

function verifyWebhookSignature(rawBodyBuffer, signature, secret) {
  if (!secret || !signature || !(rawBodyBuffer instanceof Buffer)) {
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBodyBuffer)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(String(signature), "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

async function handlePaymentCaptured(paymentEntity) {
  if (!paymentEntity?.order_id) return;

  const payment = await Payment.findOne({
    razorpayOrderId: paymentEntity.order_id,
  });

  if (!payment || payment.status !== "pending") {
    return;
  }

  payment.status = "completed";
  payment.razorpayPaymentId = paymentEntity.id;
  payment.paidDate = new Date();
  payment.razorpaySignature = paymentEntity.id
    ? `webhook:${paymentEntity.id}`
    : payment.razorpaySignature;
  await payment.save();
}

async function handlePaymentFailed(paymentEntity) {
  if (!paymentEntity?.order_id) return;

  const payment = await Payment.findOne({
    razorpayOrderId: paymentEntity.order_id,
  });

  if (!payment || payment.status !== "pending") {
    return;
  }

  payment.status = "failed";
  await payment.save();
}

async function handleRefundCreated(refundEntity) {
  if (!refundEntity?.payment_id) return;

  const payment = await Payment.findOne({
    razorpayPaymentId: refundEntity.payment_id,
  });

  if (!payment) {
    return;
  }

  payment.status = "refunded";
  await payment.save();
}

/**
 * Razorpay webhook — must be mounted with express.raw({ type: 'application/json' }).
 * Use RAZORPAY_WEBHOOK_SECRET from the Razorpay Dashboard (preferred); falls back to key secret only for dev.
 */
module.exports = async function paymentWebhookController(req, res) {
  try {
    const secret =
      process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(503).json({
        success: false,
        message: "Webhook secret not configured",
      });
    }

    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body;

    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).json({ success: false, message: "Invalid JSON" });
    }

    const eventId =
      req.headers["x-razorpay-event-id"] ||
      parsed.id ||
      crypto.createHash("sha256").update(rawBody).digest("hex");

    const already = await WebhookEvent.findOne({ eventId });
    if (already) {
      return res.json({ success: true, duplicate: true });
    }

    const { event, payload } = parsed;

    switch (event) {
      case "payment.captured":
        await handlePaymentCaptured(payload?.payment?.entity);
        break;
      case "payment.failed":
        await handlePaymentFailed(payload?.payment?.entity);
        break;
      case "refund.processed":
      case "refund.created":
        await handleRefundCreated(payload?.refund?.entity);
        break;
      default:
        console.log(`Razorpay webhook (unhandled): ${event}`);
    }

    try {
      await WebhookEvent.create({
        eventId,
        eventType: event || "unknown",
        receivedAt: new Date(),
      });
    } catch (err) {
      if (err.code !== 11000) {
        throw err;
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error("Razorpay webhook error:", err);
    return res.status(500).json({ success: false, message: "Webhook failed" });
  }
};
