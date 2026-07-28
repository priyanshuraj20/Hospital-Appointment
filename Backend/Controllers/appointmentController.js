import prisma from "../utils/prismaClient.js";
import { APPOINTMENT_STATUS, PAYMENT_STATUS } from "../utils/constants.js";

// Strip extra whitespace and seconds from time strings
// Example: " 10:30:00 - 11:30:00 " → "10:30-11:30"
const normalizeTimeSlot = (slot) => {
  if (!slot) return "";
  return slot.trim().toLowerCase().replace(/\s+/g, "").replace(/(\d{1,2}:\d{2}):00/g, "$1");
};

// Convert any date input to UTC midnight to avoid timezone issues
const normalizeDate = (dateInput) => {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) throw new Error("INVALID_DATE");
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

// POST /api/appointments/book
export const bookAppointment = async (req, res) => {
  const { doctorId, slotId, appointmentDate, timeSlot, symptoms } = req.body;
  const patientId = req.userId;

  if (!doctorId || !appointmentDate || !timeSlot) {
    return res.status(400).json({ success: false, message: "Doctor, date, and time slot are required." });
  }

  try {
    const doctor = await prisma.doctorProfile.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    const date = normalizeDate(appointmentDate);
    const slot = normalizeTimeSlot(timeSlot);

    // Use a transaction to prevent double-booking
    // Only active appointments (PENDING/CONFIRMED) block the slot
    const appointment = await prisma.$transaction(async (tx) => {
      const existing = await tx.appointment.findFirst({
        where: {
          doctorId,
          appointmentDate: date,
          timeSlot: slot,
          status: { in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
        },
      });

      if (existing) throw new Error("SLOT_TAKEN");

      return tx.appointment.create({
        data: {
          patientId,
          doctorId,
          slotId: slotId || null,
          appointmentDate: date,
          timeSlot: slot,
          amount: doctor.consultationFee,
          status: APPOINTMENT_STATUS.PENDING,
          paymentStatus: PAYMENT_STATUS.PENDING,
          symptoms: symptoms || null,
        },
        include: {
          doctor: { include: { user: { select: { name: true } } } },
          patient: { select: { name: true, email: true } },
        },
      });
    });

    return res.status(201).json({
      success: true,
      message: "Appointment booked. Please complete payment.",
      data: appointment,
    });
  } catch (error) {
    if (error.message === "SLOT_TAKEN") {
      return res.status(409).json({ success: false, message: "This slot is already booked." });
    }
    if (error.message === "INVALID_DATE") {
      return res.status(400).json({ success: false, message: "Invalid date format." });
    }
    console.error("Book Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to book appointment." });
  }
};

// PUT /api/appointments/cancel/:id
export const cancelAppointment = async (req, res) => {
  const { id } = req.params;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { payment: true, followUp: true },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    // Only the patient or assigned doctor can cancel
    if (appointment.patientId !== req.userId && req.doctorId !== appointment.doctorId) {
      return res.status(403).json({ success: false, message: "You can only cancel your own appointments." });
    }

    if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
      return res.status(400).json({ success: false, message: "Completed appointments cannot be cancelled." });
    }

    // Cancel appointment, mark refund if paid, and invalidate follow-up — all in one transaction
    const result = await prisma.$transaction(async (tx) => {
      const wasPaid = appointment.paymentStatus === PAYMENT_STATUS.PAID;

      const updated = await tx.appointment.update({
        where: { id },
        data: {
          status: APPOINTMENT_STATUS.CANCELLED,
          paymentStatus: wasPaid ? PAYMENT_STATUS.REFUNDED : appointment.paymentStatus,
        },
      });

      if (wasPaid && appointment.payment) {
        await tx.payment.update({
          where: { appointmentId: id },
          data: { status: PAYMENT_STATUS.REFUNDED },
        });
      }

      if (appointment.followUp) {
        await tx.followUp.update({
          where: { appointmentId: id },
          data: { status: "INVALIDATED" },
        });
      }

      return updated;
    });

    return res.status(200).json({ success: true, message: "Appointment cancelled.", data: result });
  } catch (error) {
    console.error("Cancel Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to cancel." });
  }
};

// PUT /api/appointments/reschedule/:id
export const rescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { newDate, newTimeSlot, newSlotId } = req.body;

  if (!newDate || !newTimeSlot) {
    return res.status(400).json({ success: false, message: "New date and time slot are required." });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { followUp: true },
    });

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    // Only the patient or assigned doctor can reschedule
    if (appointment.patientId !== req.userId && req.doctorId !== appointment.doctorId) {
      return res.status(403).json({ success: false, message: "You can only reschedule your own appointments." });
    }

    if ([APPOINTMENT_STATUS.COMPLETED, APPOINTMENT_STATUS.CANCELLED].includes(appointment.status)) {
      return res.status(400).json({ success: false, message: "Only active appointments can be rescheduled." });
    }

    const date = normalizeDate(newDate);
    const slot = normalizeTimeSlot(newTimeSlot);

    // Check new slot is free, then update — all in one transaction
    const updated = await prisma.$transaction(async (tx) => {
      const conflict = await tx.appointment.findFirst({
        where: {
          doctorId: appointment.doctorId,
          appointmentDate: date,
          timeSlot: slot,
          status: { in: [APPOINTMENT_STATUS.PENDING, APPOINTMENT_STATUS.CONFIRMED] },
          id: { not: id },
        },
      });

      if (conflict) throw new Error("SLOT_TAKEN");

      const rescheduled = await tx.appointment.update({
        where: { id },
        data: { appointmentDate: date, timeSlot: slot, slotId: newSlotId || null },
      });

      // Old follow-up notes no longer valid after rescheduling
      if (appointment.followUp) {
        await tx.followUp.update({
          where: { appointmentId: id },
          data: { status: "INVALIDATED" },
        });
      }

      return rescheduled;
    });

    return res.status(200).json({ success: true, message: "Appointment rescheduled.", data: updated });
  } catch (error) {
    if (error.message === "SLOT_TAKEN") {
      return res.status(409).json({ success: false, message: "That slot is already booked." });
    }
    console.error("Reschedule Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to reschedule." });
  }
};

// GET /api/appointments/my-appointments
export const getPatientAppointments = async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId: req.userId },
      include: {
        doctor: { include: { user: { select: { name: true, email: true, phone: true } } } },
        payment: true,
        followUp: true,
      },
      orderBy: { appointmentDate: "desc" },
    });

    return res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch appointments." });
  }
};

// GET /api/appointments/doctor-appointments
export const getDoctorAppointments = async (req, res) => {
  try {
    const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.userId } });
    if (!profile) {
      return res.status(404).json({ success: false, message: "Doctor profile not found." });
    }

    const appointments = await prisma.appointment.findMany({
      where: { doctorId: profile.id },
      include: {
        patient: { select: { id: true, name: true, email: true, phone: true, bloodGroup: true, allergies: true } },
        payment: true,
        followUp: true,
      },
      orderBy: { appointmentDate: "desc" },
    });

    return res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch appointments." });
  }
};

// PATCH /api/appointments/status/:id
export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!Object.values(APPOINTMENT_STATUS).includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid status value." });
  }

  try {
    const appointment = await prisma.appointment.findUnique({ where: { id } });
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found." });
    }

    // Only the assigned doctor can change the appointment status
    const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.userId } });
    if (!profile || appointment.doctorId !== profile.id) {
      return res.status(403).json({ success: false, message: "Only the assigned doctor can update status." });
    }

    const updated = await prisma.appointment.update({ where: { id }, data: { status } });
    return res.status(200).json({ success: true, message: `Status updated to ${status}.`, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update status." });
  }
};
