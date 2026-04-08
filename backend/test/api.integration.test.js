const { describe, it, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const request = require("supertest");

const User = require("../models/db");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "integration-test-jwt-secret-min-32-chars";
process.env.RAZORPAY_WEBHOOK_SECRET = "test-webhook-secret-for-signature";

const TEST_MONGODB_URI =
  process.env.TEST_MONGODB_URI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/shms_integration_test";

describe(
  "API integration",
  { timeout: 30_000 },
  () => {
    let app;

    before(async () => {
      process.env.MONGODB_URI = TEST_MONGODB_URI;

      const path = require("path");
      const serverPath = path.join(__dirname, "..", "server.js");
      delete require.cache[serverPath];

      ({ app } = require("../server.js"));
      await new Promise((resolve, reject) => {
        const t = setTimeout(
          () => reject(new Error("MongoDB connection timeout — is MongoDB running?")),
          15_000
        );
        if (mongoose.connection.readyState === 1) {
          clearTimeout(t);
          return resolve();
        }
        mongoose.connection.once("connected", () => {
          clearTimeout(t);
          resolve();
        });
        mongoose.connection.once("error", (e) => {
          clearTimeout(t);
          reject(e);
        });
      });
    });

    after(async () => {
      await User.deleteMany({
        email: {
          $in: ["student-int@test.com", "admin-int@test.com"],
        },
      }).catch(() => {});
      await mongoose.connection.close().catch(() => {});
    });

    it("GET /api/health returns OK", async () => {
      const res = await request(app).get("/api/health").expect(200);
      assert.strictEqual(res.body.status, "OK");
    });

    it("POST /api/auth/login rejects unknown user", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "nobody@example.com",
        password: "wrong",
      });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it("POST /api/payments/webhook rejects invalid signature", async () => {
      const raw = Buffer.from(
        JSON.stringify({ event: "payment.captured", payload: {} }),
        "utf8"
      );
      const res = await request(app)
        .post("/api/payments/webhook")
        .set("Content-Type", "application/json")
        .set("x-razorpay-signature", "invalid")
        .send(raw);
      assert.strictEqual(res.status, 400);
    });

    it("RBAC: student cannot list users", async () => {
      const student = await User.create({
        name: "Test Student",
        email: "student-int@test.com",
        password: "StudentPass123",
        phoneNumber: "9999999999",
        role: "student",
      });

      const jwt = require("jsonwebtoken");
      const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET);

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(res.status, 403);
    });

    it("admin can list users", async () => {
      const admin = await User.create({
        name: "Test Admin",
        email: "admin-int@test.com",
        password: "AdminPass123",
        phoneNumber: "9999999998",
        role: "admin",
      });

      const jwt = require("jsonwebtoken");
      const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);

      const res = await request(app)
        .get("/api/users")
        .set("Authorization", `Bearer ${token}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(Array.isArray(res.body.users));
    });
  }
);
