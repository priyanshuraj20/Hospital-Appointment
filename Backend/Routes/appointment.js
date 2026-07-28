import express from "express";
import {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
} from "../Controllers/appointmentController.js";
import { authenticate, restrict } from "../auth/verifyToken.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();

// Booking route
router.post("/book", authenticate, restrict([ROLES.PATIENT]), bookAppointment);

// Patient appointments (supports both /my-appointments and /patient)
router.get("/my-appointments", authenticate, restrict([ROLES.PATIENT]), getPatientAppointments);
router.get("/patient", authenticate, restrict([ROLES.PATIENT]), getPatientAppointments);

// Doctor appointments (supports both /doctor-appointments and /doctor)
router.get("/doctor-appointments", authenticate, restrict([ROLES.DOCTOR]), getDoctorAppointments);
router.get("/doctor", authenticate, restrict([ROLES.DOCTOR]), getDoctorAppointments);

// Update status
router.patch("/status/:id", authenticate, restrict([ROLES.DOCTOR]), updateAppointmentStatus);
router.patch("/:id/status", authenticate, restrict([ROLES.DOCTOR]), updateAppointmentStatus);

// Cancel appointment (supports PUT /cancel/:id, PATCH /cancel/:id, and PATCH /:id/cancel)
router.put("/cancel/:id", authenticate, cancelAppointment);
router.patch("/cancel/:id", authenticate, cancelAppointment);
router.patch("/:id/cancel", authenticate, cancelAppointment);

// Reschedule appointment
router.put("/reschedule/:id", authenticate, rescheduleAppointment);
router.patch("/reschedule/:id", authenticate, rescheduleAppointment);
router.patch("/:id/reschedule", authenticate, rescheduleAppointment);

export default router;
