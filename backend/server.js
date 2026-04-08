const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const socketIo = require("socket.io");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require("./routes/AuthR");
const userRoutes = require("./routes/UserR");
const roomRoutes = require("./routes/Room");
const paymentRoutes = require("./routes/PaymentR");
const complaintRoutes = require("./routes/ComplaintR");
const visitorRoutes = require("./routes/VisitorR");
const dashboardRoutes = require("./routes/DashboardR");
const gateRoutes = require("./routes/gateRoutes");
const messFeedbackRoutes = require("./routes/messFeedbackRoutes");
const reportRoutes = require("./routes/ReportR");
const vacationRequestRoutes = require("./routes/vacationRequestRoutes");
const chatbotRoutes = require("./routes/chatbotR");
const paymentWebhook = require("./routes/paymentWebhook");
const feeConfigRoutes = require("./routes/feeConfigR");
const announcementRoutes = require("./routes/announcementR");
const documentRoutes = require("./routes/documentRoutes");
const settingsRoutes = require("./routes/settingsRoutes");

const app = express();
const server = http.createServer(app);

const defaultDevOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:5173",
];

const envOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? envOrigins.length > 0
      ? envOrigins
      : defaultDevOrigins
    : [...new Set([...defaultDevOrigins, ...envOrigins])];

if (process.env.NODE_ENV === "production" && envOrigins.length === 0) {
  console.warn(
    "⚠️ ALLOWED_ORIGINS is empty — using localhost dev defaults. Set ALLOWED_ORIGINS for production."
  );
}

// ------------------ 1️⃣ EXPRESS CORS ------------------
const corsOptions = {
  origin: function (origin, callback) {
    // In development, allow all origins (covers network IP access)
    if (process.env.NODE_ENV !== "production") return callback(null, true);
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
  ],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ------------------ 2️⃣ SECURITY ------------------
app.use(helmet());
app.use(compression());

// ------------------ Razorpay webhook (raw body; must be before express.json) ----
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  paymentWebhook
);

// ------------------ 3️⃣ RATE LIMITING ------------------
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.API_RATE_LIMIT_MAX || 500),
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.method === "OPTIONS") return true;
    const p = req.originalUrl || "";
    if (p.includes("/payments/webhook")) return true;
    return process.env.NODE_ENV === "development" && req.method === "GET";
  },
});
app.use("/api/", limiter);

// ------------------ 4️⃣ BODY PARSING ------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ------------------ 5️⃣ DEBUGGING (development only) ------------------
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    if (req.path === "/payments/webhook") return next();
    console.log(`🌐 ${req.method} ${req.path}`);
    next();
  });
}

// ------------------ 6️⃣ SOCKET.IO ------------------
const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id);

  socket.on("joinAdmin", (adminData) => {
    socket.join("admin");
    console.log(`👨‍💼 Admin ${adminData.name} joined admin room`);
  });

  socket.on("joinStudent", (studentData) => {
    socket.join(`student_${studentData.id}`);
    console.log(`🎓 Student ${studentData.name} joined their room`);
  });

  socket.on("trackMovement", (data) => {
    io.to("admin").emit("liveMovement", {
      type: "movement_update",
      student: data.student,
      gate: data.gate,
      action: data.action,
      timestamp: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log("👋 User disconnected:", socket.id);
  });
});

// Make io accessible to routes
app.set("io", io);

// ------------------ 7️⃣ DATABASE ------------------
const connectDB = require("./config/databaseC");
connectDB();

// ------------------ 8️⃣ ROUTES ------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/visitors", visitorRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/gates", gateRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/mess-feedback", messFeedbackRoutes);
app.use("/api/vacation-requests", vacationRequestRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/fee-config", feeConfigRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/uploads", express.static(require("path").join(__dirname, "uploads")));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Smart Hostel Management System API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ------------------ 9️⃣ ERROR HANDLING ------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// ------------------ 10️⃣ SERVER START ------------------
const PORT = process.env.PORT || 5000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);

    const paymentScheduler = require("./services/paymentScheduler");
    paymentScheduler.init();
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM received, shutting down gracefully");
    server.close(() => {
      console.log("Process terminated");
    });
  });
}

module.exports = { app, server };
