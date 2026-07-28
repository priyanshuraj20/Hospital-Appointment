import express from "express";
import {
  createFollowUp,
  getPatientFollowUps,
  getFollowUpByAppointment,
} from "../Controllers/followupController.js";
import { authenticate, restrict } from "../auth/verifyToken.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();

router.post("/", authenticate, restrict([ROLES.DOCTOR]), createFollowUp);
router.get("/patient", authenticate, restrict([ROLES.PATIENT]), getPatientFollowUps);
router.get("/appointment/:appointmentId", authenticate, getFollowUpByAppointment);

export default router;
