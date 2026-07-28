import express from "express";
import {
  getAllDoctors,
  getDoctorById,
  addDoctorSlot,
  deleteDoctorSlot,
} from "../Controllers/doctorController.js";
import { authenticate, restrict } from "../auth/verifyToken.js";
import { ROLES } from "../utils/constants.js";

const router = express.Router();

router.get("/", getAllDoctors);
router.get("/:id", getDoctorById);
router.post("/slots", authenticate, restrict([ROLES.DOCTOR]), addDoctorSlot);
router.delete("/slots/:slotId", authenticate, restrict([ROLES.DOCTOR]), deleteDoctorSlot);

export default router;