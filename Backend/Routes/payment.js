import express from "express";
import {
  createRazorpayOrder,
  verifyPayment,
  handlePaymentWebhook,
} from "../Controllers/paymentController.js";
import { authenticate } from "../auth/verifyToken.js";

const router = express.Router();

router.post("/create-order", authenticate, createRazorpayOrder);
router.post("/verify", authenticate, verifyPayment);
router.post("/webhook", express.json({ type: "application/json" }), handlePaymentWebhook);

export default router;
