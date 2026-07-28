import prisma from "../utils/prismaClient.js";
import { APPOINTMENT_STATUS } from "../utils/constants.js";

// POST /api/followups/create
// Doctor adds clinical notes and prescription after a consultation
export const createFollowUp = async (req, res) => {
  const { appointmentId, notes, prescription, followUpDate } = req.body;

  if (!appointmentId || !notes) {
    return res.status(400).json({ success: false, message: "Appointment ID and notes are required." });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    // Only the assigned doctor can write follow-up notes
    const doctor = await prisma.doctorProfile.findUnique({ where: { userId: req.userId } });
    if (!doctor || doctor.id !== appointment.doctorId) {
      return res.status(403).json({ success: false, message: "Only the assigned doctor can add follow-up." });
    }

    // Save follow-up notes and mark the appointment as COMPLETED
    const followUp = await prisma.$transaction(async (tx) => {
      const created = await tx.followUp.upsert({
        where: { appointmentId },
        update: {
          notes,
          prescription: prescription || null,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
        },
        create: {
          appointmentId,
          patientId: appointment.patientId,
          doctorId: appointment.doctorId,
          notes,
          prescription: prescription || null,
          followUpDate: followUpDate ? new Date(followUpDate) : null,
        },
      });

      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: APPOINTMENT_STATUS.COMPLETED },
      });

      return created;
    });

    return res.status(201).json({ success: true, message: "Follow-up saved.", data: followUp });
  } catch (error) {
    console.error("Follow-up Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to save follow-up." });
  }
};

// GET /api/followups/my-followups
// Patient views all their follow-up notes
export const getPatientFollowUps = async (req, res) => {
  try {
    const followUps = await prisma.followUp.findMany({
      where: { patientId: req.userId },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        appointment: { select: { appointmentDate: true, timeSlot: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: followUps });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch follow-ups." });
  }
};

// GET /api/followups/appointment/:appointmentId
// Get the follow-up note for a specific appointment
export const getFollowUpByAppointment = async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const followUp = await prisma.followUp.findUnique({
      where: { appointmentId },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        patient: { select: { name: true, email: true } },
      },
    });

    if (!followUp) {
      return res.status(404).json({ success: false, message: "No follow-up found." });
    }

    return res.status(200).json({ success: true, data: followUp });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch follow-up." });
  }
};
