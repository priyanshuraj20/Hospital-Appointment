import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./utils/prismaClient.js";
import authRoutes from "./Routes/auth.js";
import doctorRoutes from "./Routes/doctor.js";
import appointmentRoutes from "./Routes/appointment.js";
import paymentRoutes from "./Routes/payment.js";
import followupRoutes from "./Routes/followup.js";
import { seedDatabase } from "./utils/seeder.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// -- CORS Setup --
// Only allow requests from our frontend domains
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.CLIENT_SITE_URL
    ? process.env.CLIENT_SITE_URL.trim().replace(/\/$/, "")
    : null,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server calls (no origin header)
      if (!origin) return callback(null, true);

      const normalized = origin.trim().replace(/\/$/, "");

      if (allowedOrigins.includes(normalized) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      return callback(new Error("CORS policy violation: Origin not allowed."));
    },
    credentials: true,
  })
);

// -- Middleware --
app.use(express.json());
app.use(cookieParser());

// -- Health Check --
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// -- API Routes --
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/followups", followupRoutes);

// -- 404 Handler --
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// -- Global Error Handler --
app.use((err, req, res, next) => {
  if (err.message?.includes("CORS policy violation")) {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error("Server Error:", err.message);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

// -- Start Server --
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected.");
    await seedDatabase();
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
};

app.listen(port, () => {
  startServer();
  console.log(`Server running on port ${port}`);
});
