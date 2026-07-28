import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import prisma from "../utils/prismaClient.js";
import { ROLES } from "../utils/constants.js";

// Hash the refresh token before storing in DB (prevents session hijack on DB leak)
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// Generate a short-lived access token (24 hours)
const generateAccessToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
};

// Generate a long-lived refresh token (7 days)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET_KEY,
    { expiresIn: "7d" }
  );
};

// POST /api/auth/register
export const register = async (req, res) => {
  const { email, password, name, role, phone, specialization, qualification, consultationFee } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, message: "Name, email, and password are required." });
  }

  const assignedRole = (role || "").toUpperCase() === ROLES.DOCTOR ? ROLES.DOCTOR : ROLES.PATIENT;

  try {
    let existing;
    try {
      existing = await prisma.user.findUnique({ where: { email } });
    } catch (dbErr) {
      existing = await prisma.user.findUnique({ where: { email } });
    }

    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash, name, role: assignedRole, phone: phone || null },
      });

      if (assignedRole === ROLES.DOCTOR) {
        await tx.doctorProfile.create({
          data: {
            userId: user.id,
            specialization: specialization || "General Physician",
            qualification: qualification || "MBBS",
            consultationFee: consultationFee ? parseFloat(consultationFee) : 500,
          },
        });
      }

      return user;
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    return res.status(500).json({ success: false, message: "Registration failed." });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  try {
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
        include: { doctorProfile: true },
      });
    } catch (dbErr) {
      // Retry once if Neon database was cold-starting
      user = await prisma.user.findUnique({
        where: { email },
        include: { doctorProfile: true },
      });
    }

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken(user.id);

    // Store hashed refresh token in DB
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashToken(refreshToken) },
      });
    } catch (err) {
      // Non-critical: fail-safe if refresh token update encounters a lock
    }

    const isProduction = process.env.NODE_ENV === "production";

    // Set refresh token as httpOnly cookie with cross-site support for Vercel/Render
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Remove sensitive fields before sending response
    const { passwordHash, refreshToken: _, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: accessToken,
      data: safeUser,
      role: user.role,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res.status(500).json({ success: false, message: "Login failed." });
  }
};

// POST /api/auth/refresh-token
export const refreshToken = async (req, res) => {
  const incoming = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incoming) {
    return res.status(401).json({ success: false, message: "Refresh token is required." });
  }

  try {
    const decoded = jwt.verify(
      incoming,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET_KEY
    );

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.refreshToken !== hashToken(incoming)) {
      return res.status(403).json({ success: false, message: "Invalid refresh token." });
    }

    const newAccessToken = generateAccessToken(user.id, user.role);

    return res.status(200).json({ success: true, token: newAccessToken });
  } catch (error) {
    return res.status(403).json({ success: false, message: "Refresh token expired or invalid." });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  try {
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { doctorProfile: { include: { slots: true } } },
      });
    } catch (dbErr) {
      user = await prisma.user.findUnique({
        where: { id: req.userId },
        include: { doctorProfile: { include: { slots: true } } },
      });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const { passwordHash, refreshToken, ...safeUser } = user;
    return res.status(200).json({ success: true, data: safeUser });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch profile." });
  }
};
