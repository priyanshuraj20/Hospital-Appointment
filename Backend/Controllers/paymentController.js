import crypto from "crypto";
import Razorpay from "razorpay";
import prisma from "../utils/prismaClient.js";
import { APPOINTMENT_STATUS, PAYMENT_STATUS } from "../utils/constants.js";

// Create a Razorpay SDK instance using env credentials
const getRazorpay = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// POST /api/payments/create-order
// Creates a Razorpay order for an appointment (idempotent — returns existing order if already created)
export const createRazorpayOrder = async (req, res) => {
  const { appointmentId } = req.body;

  if (!appointmentId) {
    return res.status(400).json({ success: false, message: "Appointment ID is required." });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { payment: true },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    // Only the patient who booked can pay
    if (appointment.patientId !== req.userId) {
      return res.status(403).json({ success: false, message: "You can only pay for your own appointments." });
    }

    if (appointment.status === APPOINTMENT_STATUS.CANCELLED) {
      return res.status(400).json({ success: false, message: "Cannot pay for a cancelled appointment." });
    }

    // If a payment order already exists and is pending, return it (idempotency)
    if (appointment.payment?.status === PAYMENT_STATUS.PENDING && appointment.payment?.razorpayOrderId) {
      return res.status(200).json({
        success: true,
        message: "Existing order returned.",
        data: {
          orderId: appointment.payment.razorpayOrderId,
          keyId: process.env.RAZORPAY_KEY_ID,
          amount: Math.round(appointment.amount * 100),
          currency: "INR",
          appointmentId: appointment.id,
        },
      });
    }

    // Create a new Razorpay order
    const amountInPaisa = Math.round(appointment.amount * 100);
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountInPaisa,
      currency: "INR",
      receipt: `rcpt_${appointment.id.substring(0, 10)}`,
    });

    // Save order in DB (upsert handles edge case if parallel request already created one)
    let payment;
    try {
      payment = await prisma.payment.upsert({
        where: { appointmentId: appointment.id },
        update: { razorpayOrderId: order.id, amount: appointment.amount, status: PAYMENT_STATUS.PENDING },
        create: {
          appointmentId: appointment.id,
          razorpayOrderId: order.id,
          amount: appointment.amount,
          currency: "INR",
          status: PAYMENT_STATUS.PENDING,
        },
      });
    } catch (dbError) {
      // If two requests race and both try to insert, catch the unique constraint error
      if (dbError.code === "P2002") {
        payment = await prisma.payment.findUnique({ where: { appointmentId: appointment.id } });
      } else {
        throw dbError;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: payment.razorpayOrderId,
        keyId: process.env.RAZORPAY_KEY_ID,
        amount: amountInPaisa,
        currency: "INR",
        appointmentId: appointment.id,
      },
    });
  } catch (error) {
    console.error("Create Order Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create payment order." });
  }
};

// POST /api/payments/verify
// Verifies the Razorpay payment signature and confirms the appointment
export const verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, appointmentId } = req.body;

  if (!razorpayOrderId || !appointmentId) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  try {
    // Server must have the secret key to verify signatures
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: "RAZORPAY_KEY_SECRET not configured." });
    }

    if (!razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Payment ID and signature are required." });
    }

    // Verify HMAC-SHA256 signature: hash(orderId|paymentId) must match the signature from Razorpay
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expected !== razorpaySignature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature." });
    }

    // Make sure the order in our DB actually belongs to this appointment
    const existingPayment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
      include: { appointment: true },
    });

    if (!existingPayment) {
      return res.status(404).json({ success: false, message: "Payment record not found." });
    }

    if (existingPayment.appointmentId !== appointmentId) {
      return res.status(400).json({ success: false, message: "Appointment ID does not match this order." });
    }

    // Make sure the logged-in user owns this appointment
    if (existingPayment.appointment.patientId !== req.userId) {
      return res.status(403).json({ success: false, message: "You can only verify your own payments." });
    }

    // Mark payment as PAID and appointment as CONFIRMED — atomically
    const result = await prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: { razorpayOrderId },
        data: { razorpayPaymentId, razorpaySignature, status: PAYMENT_STATUS.PAID },
      });

      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: APPOINTMENT_STATUS.CONFIRMED, paymentStatus: PAYMENT_STATUS.PAID },
      });

      return { updatedPayment, updatedAppointment };
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified. Appointment confirmed.",
      data: result,
    });
  } catch (error) {
    console.error("Verify Error:", error.message);
    return res.status(500).json({ success: false, message: "Payment verification failed." });
  }
};

// POST /api/payments/webhook
// Handles async payment events from Razorpay (server-to-server)
export const handlePaymentWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Webhook secret must be configured
  if (!webhookSecret) {
    return res.status(500).json({ success: false, message: "Webhook secret not configured." });
  }

  // Verify the webhook signature
  const signature = req.headers["x-razorpay-signature"];
  if (!signature) {
    return res.status(400).json({ success: false, message: "Missing webhook signature." });
  }

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (expected !== signature) {
    return res.status(400).json({ success: false, message: "Invalid webhook signature." });
  }

  // Process the event
  const { event, payload } = req.body;

  if (event === "payment.captured" || event === "order.paid") {
    const orderId = payload.payment?.entity?.order_id;

    if (orderId) {
      try {
        await prisma.$transaction(async (tx) => {
          const payment = await tx.payment.findUnique({ where: { razorpayOrderId: orderId } });
          if (payment) {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: PAYMENT_STATUS.PAID, razorpayPaymentId: payload.payment.entity.id },
            });
            await tx.appointment.update({
              where: { id: payment.appointmentId },
              data: { status: APPOINTMENT_STATUS.CONFIRMED, paymentStatus: PAYMENT_STATUS.PAID },
            });
          }
        });
      } catch (err) {
        console.error("Webhook Processing Error:", err.message);
      }
    }
  }

  return res.status(200).json({ status: "ok" });
};
