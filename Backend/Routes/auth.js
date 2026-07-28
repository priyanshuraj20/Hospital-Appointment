import express from "express";
import { register, login, refreshToken, getMe } from "../Controllers/authController.js";
import { authenticate } from "../auth/verifyToken.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.get("/me", authenticate, getMe);

export default router;
