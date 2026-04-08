/**
 * Create bootstrap admin and warden users if they do not exist.
 * Set passwords via env in production; defaults are for local dev only.
 *
 *   BOOTSTRAP_ADMIN_EMAIL    (default admin@shms.com)
 *   BOOTSTRAP_ADMIN_PASSWORD
 *   BOOTSTRAP_WARDEN_EMAIL   (default warden@shms.com)
 *   BOOTSTRAP_WARDEN_PASSWORD
 */
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const User = require("../models/db");

const ADMIN_EMAIL =
  process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@shms.com";
const ADMIN_PASSWORD =
  process.env.BOOTSTRAP_ADMIN_PASSWORD || "ChangeMeAdmin!123";
const WARDEN_EMAIL =
  process.env.BOOTSTRAP_WARDEN_EMAIL || "warden@shms.com";
const WARDEN_PASSWORD =
  process.env.BOOTSTRAP_WARDEN_PASSWORD || "ChangeMeWarden!123";

async function upsertStaffUser({
  email,
  password,
  name,
  role,
  phoneNumber,
}) {
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`⏭️  ${role} already exists: ${email}`);
    return existing;
  }
  const user = await User.create({
    name,
    email,
    password,
    phoneNumber,
    role,
    isActive: true,
  });
  console.log(`✅ Created ${role}: ${email}`);
  return user;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI is required");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  await upsertStaffUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    name: "System Administrator",
    role: "admin",
    phoneNumber: "0000000000",
  });

  await upsertStaffUser({
    email: WARDEN_EMAIL,
    password: WARDEN_PASSWORD,
    name: "Hostel Warden",
    role: "warden",
    phoneNumber: "0000000001",
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("\n📋 Dev bootstrap (change passwords before production):");
    console.log(`   Admin:  ${ADMIN_EMAIL}`);
    console.log(`   Warden: ${WARDEN_EMAIL}`);
  } else {
    console.log(
      "\n🔐 Production: ensure BOOTSTRAP_*_PASSWORD were set for first run."
    );
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
