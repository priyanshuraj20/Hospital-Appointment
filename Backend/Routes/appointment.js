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

router.post("/book", authenticate, restrict([ROLES.PATIENT]), bookAppointment);
router.get("/patient", authenticate, restrict([ROLES.PATIENT]), getPatientAppointments);
router.get("/doctor", authenticate, restrict([ROLES.DOCTOR]), getDoctorAppointments);
router.patch("/:id/status", authenticate, restrict([ROLES.DOCTOR]), updateAppointmentStatus);
router.patch("/:id/cancel", authenticate, cancelAppointment);
router.patch("/:id/reschedule", authenticate, rescheduleAppointment);

export default router;
