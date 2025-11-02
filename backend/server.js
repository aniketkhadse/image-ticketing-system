// Only load .env in development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const ticketRoutes = require("./routes/tickets");

const app = express();

// Connect to MongoDB
connectDB();

// CORS Configuration
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://image-ticketing-system.vercel.app",
        process.env.FRONTEND_URL,
      ].filter(Boolean);

      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Allow all origins in development/testing
        callback(null, true);
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Ticketing System API",
    status: "running",
    version: "1.0.0",
  });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development",
    mongodb: "connected",
    resend: process.env.RESEND_API_KEY ? "configured" : "not configured",
    jwt: process.env.JWT_SECRET ? "configured" : "not configured",
    adminEmail: process.env.ADMIN_EMAIL ? "configured" : "not configured",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.path,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("=".repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("");

  // Email Configuration
  console.log("📧 EMAIL CONFIGURATION:");
  if (process.env.RESEND_API_KEY) {
    console.log(`   ✅ Resend API Key: Configured`);
    console.log(
      `   📝 Key starts with: ${process.env.RESEND_API_KEY.substring(0, 15)}...`
    );
  } else {
    console.log(`   ❌ Resend API Key: MISSING`);
  }
  console.log("");

  // JWT Configuration
  console.log("🔐 AUTHENTICATION:");
  console.log(
    `   ${process.env.JWT_SECRET ? "✅" : "❌"} JWT Secret: ${
      process.env.JWT_SECRET ? "Configured" : "MISSING"
    }`
  );
  console.log("");

  // Admin Configuration
  console.log("👤 ADMIN CONFIGURATION:");
  console.log(
    `   ${process.env.ADMIN_EMAIL ? "✅" : "❌"} Admin Email: ${
      process.env.ADMIN_EMAIL || "MISSING"
    }`
  );
  console.log(
    `   ${process.env.ADMIN_PASSWORD ? "✅" : "❌"} Admin Password: ${
      process.env.ADMIN_PASSWORD ? "Configured" : "MISSING"
    }`
  );
  console.log("");

  // Frontend Configuration
  console.log("🌐 FRONTEND:");
  console.log(`   Frontend URL: ${process.env.FRONTEND_URL || "Not set"}`);
  console.log("");

  // Database Configuration
  console.log("💾 DATABASE:");
  console.log(
    `   ${process.env.MONGODB_URI ? "✅" : "❌"} MongoDB URI: ${
      process.env.MONGODB_URI ? "Configured" : "MISSING"
    }`
  );
  console.log("=".repeat(50));
  console.log("");

  // Warnings
  const missingVars = [];
  if (!process.env.RESEND_API_KEY) missingVars.push("RESEND_API_KEY");
  if (!process.env.JWT_SECRET) missingVars.push("JWT_SECRET");
  if (!process.env.ADMIN_EMAIL) missingVars.push("ADMIN_EMAIL");
  if (!process.env.ADMIN_PASSWORD) missingVars.push("ADMIN_PASSWORD");
  if (!process.env.MONGODB_URI) missingVars.push("MONGODB_URI");

  if (missingVars.length > 0) {
    console.log("⚠️  WARNING: Missing environment variables:");
    missingVars.forEach((varName) => {
      console.log(`   - ${varName}`);
    });
    console.log("");
  } else {
    console.log("✅ All environment variables configured!");
    console.log("");
  }
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  console.error("Stack:", err.stack);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  console.error("Stack:", err.stack);
  process.exit(1);
});
