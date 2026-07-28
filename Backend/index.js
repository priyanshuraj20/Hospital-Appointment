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

// -- Bulletproof CORS Setup --
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server calls (no origin header)
      if (!origin) return callback(null, true);

      const normalized = origin.trim().replace(/\/$/, "").toLowerCase();
      const configuredClient = process.env.CLIENT_SITE_URL
        ? process.env.CLIENT_SITE_URL.trim().replace(/\/$/, "").toLowerCase()
        : "";

      // Check if origin matches allowed domains
      const isAllowed =
        normalized.endsWith(".vercel.app") ||
        normalized.includes("localhost") ||
        normalized.includes("127.0.0.1") ||
        (configuredClient && (normalized === configuredClient || normalized.startsWith(configuredClient))) ||
        process.env.NODE_ENV !== "production";

      if (isAllowed) {
        return callback(null, true);
      }

      return callback(null, false);
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
