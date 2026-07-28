import jwt from "jsonwebtoken";
import prisma from "../utils/prismaClient.js";

// Verify the JWT access token from request header or cookie
export const authenticate = async (req, res, next) => {
  let token = null;

  // Check Authorization header first, then fall back to cookie
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired." });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

// Check if the logged-in user has the required role (PATIENT or DOCTOR)
export const restrict = (allowedRoles = []) => async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, role: true, doctorProfile: { select: { id: true } } },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    const normalizedRoles = allowedRoles.map((r) => r.toUpperCase());
    if (!normalizedRoles.includes(user.role.toUpperCase())) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    // Attach user info and doctor profile ID for IDOR checks later
    req.user = user;
    if (user.doctorProfile) {
      req.doctorId = user.doctorProfile.id;
    }

    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: "Authorization check failed." });
  }
};
