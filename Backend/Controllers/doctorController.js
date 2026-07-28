import prisma from "../utils/prismaClient.js";

// GET /api/doctors
// Search doctors by specialization or name
export const getAllDoctors = async (req, res) => {
  const { specialization, query } = req.query;

  try {
    const where = { user: { role: "DOCTOR" } };

    if (specialization) {
      where.specialization = { contains: specialization, mode: "insensitive" };
    }

    if (query) {
      where.OR = [
        { user: { name: { contains: query, mode: "insensitive" } } },
        { specialization: { contains: query, mode: "insensitive" } },
      ];
    }

    const doctors = await prisma.doctorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        slots: { where: { isAvailable: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    console.error("Get Doctors Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to fetch doctors." });
  }
};

// GET /api/doctors/:id
// Get a single doctor's full profile and available slots
export const getDoctorById = async (req, res) => {
  const { id } = req.params;

  try {
    // Look up by doctor profile ID or user ID
    const doctor = await prisma.doctorProfile.findFirst({
      where: { OR: [{ id }, { userId: id }] },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        slots: true,
      },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found." });
    }

    return res.status(200).json({ success: true, data: doctor });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch doctor." });
  }
};

// POST /api/doctors/slots
// Add a new available time slot (doctors only)
export const addDoctorSlot = async (req, res) => {
  const { dayOfWeek, startTime, endTime } = req.body;

  if (!dayOfWeek || !startTime || !endTime) {
    return res.status(400).json({ success: false, message: "Day, start time, and end time are required." });
  }

  // 1. Validation: End time must be strictly after start time
  if (startTime >= endTime) {
    return res.status(400).json({ success: false, message: "End time must be after start time." });
  }

  try {
    // 2. IDOR Protection: Doctor can only add slots to their own profile
    const doctor = await prisma.doctorProfile.findUnique({ where: { userId: req.userId } });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found." });
    }

    // 3. Duplicate Recurring Slot Prevention
    const existingSlot = await prisma.slot.findFirst({
      where: { doctorId: doctor.id, dayOfWeek, startTime },
    });

    if (existingSlot) {
      return res.status(409).json({
        success: false,
        message: "A consultation slot already exists for this day and start time.",
      });
    }

    const slot = await prisma.slot.create({
      data: { doctorId: doctor.id, dayOfWeek, startTime, endTime, isAvailable: true },
    });

    return res.status(201).json({ success: true, message: "Slot created successfully.", data: slot });
  } catch (error) {
    console.error("Add Slot Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to create slot." });
  }
};

// DELETE /api/doctors/slots/:slotId
// Remove a time slot (doctors only — IDOR protected & SetNull behavior on existing appointments)
export const deleteDoctorSlot = async (req, res) => {
  const { slotId } = req.params;

  try {
    // IDOR Protection: Query doctor profile associated with req.userId
    const doctor = await prisma.doctorProfile.findUnique({ where: { userId: req.userId } });
    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found." });
    }

    // Ensure slot belongs to this doctor before deleting
    const deleteResult = await prisma.slot.deleteMany({
      where: { id: slotId, doctorId: doctor.id },
    });

    if (deleteResult.count === 0) {
      return res.status(404).json({ success: false, message: "Slot not found or unauthorized." });
    }

    return res.status(200).json({ success: true, message: "Slot deleted successfully." });
  } catch (error) {
    console.error("Delete Slot Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to delete slot." });
  }
};
