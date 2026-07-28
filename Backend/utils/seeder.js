import bcrypt from "bcryptjs";
import prisma from "./prismaClient.js";
import { ROLES } from "./constants.js";

export const seedDatabase = async () => {
  try {
    const existingDoctors = await prisma.user.count({ where: { role: ROLES.DOCTOR } });
    if (existingDoctors >= 6) {
      console.log("Database already contains doctor data.");
      return;
    }

    console.log("Seeding database with comprehensive doctor & patient profiles...");
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash("password123", salt);

    // 1. Seed Demo Patient if not present
    const demoPatient = await prisma.user.findUnique({ where: { email: "patient@healthbridge.com" } });
    if (!demoPatient) {
      await prisma.user.create({
        data: {
          email: "patient@healthbridge.com",
          passwordHash: defaultPassword,
          name: "Rahul Sharma",
          role: ROLES.PATIENT,
          phone: "+91 9876543210",
          bloodGroup: "O+",
        },
      });
    }

    // 2. Comprehensive Doctor List with Local Public Image References
    const mockDoctors = [
      {
        name: "Dr. Ananya Roy",
        email: "ananya.roy@healthbridge.com",
        specialization: "Cardiology",
        qualification: "MD, DM (Cardiology)",
        experienceYears: 14,
        consultationFee: 900,
        bio: "Senior Consultant Cardiologist specializing in preventive heart health, interventional cardiology, and echocardiography.",
        photoUrl: "/images/doctors/ananya.png",
        slots: [
          { dayOfWeek: "Monday", startTime: "09:00", endTime: "10:00" },
          { dayOfWeek: "Monday", startTime: "10:30", endTime: "11:30" },
          { dayOfWeek: "Wednesday", startTime: "14:00", endTime: "15:00" },
          { dayOfWeek: "Friday", startTime: "16:00", endTime: "17:00" },
        ],
      },
      {
        name: "Dr. Vikram Seth",
        email: "vikram.seth@healthbridge.com",
        specialization: "Dermatology",
        qualification: "MBBS, MD (Dermatology)",
        experienceYears: 9,
        consultationFee: 650,
        bio: "Expert dermatologist specializing in clinical skin care, acne treatments, laser therapies, and aesthetic dermatology.",
        photoUrl: "/images/doctors/vikram.png",
        slots: [
          { dayOfWeek: "Tuesday", startTime: "10:00", endTime: "11:00" },
          { dayOfWeek: "Thursday", startTime: "15:00", endTime: "16:00" },
          { dayOfWeek: "Saturday", startTime: "11:00", endTime: "12:00" },
        ],
      },
      {
        name: "Dr. Meera Patel",
        email: "meera.patel@healthbridge.com",
        specialization: "Pediatrics",
        qualification: "MBBS, DCH, MD (Pediatrics)",
        experienceYears: 11,
        consultationFee: 550,
        bio: "Compassionate pediatrician providing child immunization, developmental tracking, and general adolescent care.",
        photoUrl: "/images/doctors/meera.png",
        slots: [
          { dayOfWeek: "Monday", startTime: "11:00", endTime: "12:00" },
          { dayOfWeek: "Wednesday", startTime: "09:00", endTime: "10:00" },
          { dayOfWeek: "Friday", startTime: "10:00", endTime: "11:00" },
        ],
      },
      {
        name: "Dr. Rajesh Kulkarni",
        email: "rajesh.kulkarni@healthbridge.com",
        specialization: "Neurology",
        qualification: "MBBS, MD, DM (Neurology)",
        experienceYears: 16,
        consultationFee: 1100,
        bio: "Consultant Neurologist focused on headache management, stroke care, epilepsy treatment, and movement disorders.",
        photoUrl: "/images/doctors/rajesh.png",
        slots: [
          { dayOfWeek: "Tuesday", startTime: "14:00", endTime: "15:00" },
          { dayOfWeek: "Thursday", startTime: "10:00", endTime: "11:00" },
          { dayOfWeek: "Saturday", startTime: "09:30", endTime: "10:30" },
        ],
      },
      {
        name: "Dr. Kavita Deshmukh",
        email: "kavita.deshmukh@healthbridge.com",
        specialization: "Orthopedics",
        qualification: "MS (Orthopedics), DNB",
        experienceYears: 13,
        consultationFee: 850,
        bio: "Orthopedic surgeon specializing in joint replacement, sports injury rehabilitation, and arthroscopic surgery.",
        photoUrl: "/images/doctors/kavita.png",
        slots: [
          { dayOfWeek: "Monday", startTime: "15:00", endTime: "16:00" },
          { dayOfWeek: "Wednesday", startTime: "11:00", endTime: "12:00" },
          { dayOfWeek: "Friday", startTime: "14:00", endTime: "15:00" },
        ],
      },
      {
        name: "Dr. Arjun Kapoor",
        email: "arjun.kapoor@healthbridge.com",
        specialization: "General Physician",
        qualification: "MBBS, MD (Internal Medicine)",
        experienceYears: 10,
        consultationFee: 500,
        bio: "Internal medicine consultant providing routine health checks, fever management, diabetes control, and lifestyle advice.",
        photoUrl: "/images/doctors/arjun.png",
        slots: [
          { dayOfWeek: "Monday", startTime: "08:30", endTime: "09:30" },
          { dayOfWeek: "Tuesday", startTime: "09:00", endTime: "10:00" },
          { dayOfWeek: "Wednesday", startTime: "16:00", endTime: "17:00" },
          { dayOfWeek: "Thursday", startTime: "09:00", endTime: "10:00" },
          { dayOfWeek: "Friday", startTime: "08:30", endTime: "09:30" },
        ],
      },
      {
        name: "Dr. Sneha Verma",
        email: "sneha.verma@healthbridge.com",
        specialization: "Cardiology",
        qualification: "MD, DNB (Cardiology)",
        experienceYears: 7,
        consultationFee: 750,
        bio: "Clinical cardiologist specializing in hypertension management, arrhythmia treatment, and non-invasive cardiac care.",
        photoUrl: "/images/doctors/sneha.png",
        slots: [
          { dayOfWeek: "Tuesday", startTime: "11:00", endTime: "12:00" },
          { dayOfWeek: "Thursday", startTime: "14:00", endTime: "15:00" },
        ],
      },
      {
        name: "Dr. Rohan Mehta",
        email: "rohan.mehta@healthbridge.com",
        specialization: "Dermatology",
        qualification: "MBBS, DVD, MD",
        experienceYears: 12,
        consultationFee: 700,
        bio: "Dermatologist and hair care specialist specializing in trichology, psoriasis management, and pediatric skin ailments.",
        photoUrl: "/images/doctors/rohan.png",
        slots: [
          { dayOfWeek: "Monday", startTime: "14:00", endTime: "15:00" },
          { dayOfWeek: "Wednesday", startTime: "10:00", endTime: "11:00" },
          { dayOfWeek: "Saturday", startTime: "15:00", endTime: "16:00" },
        ],
      },
    ];

    for (const doc of mockDoctors) {
      const existing = await prisma.user.findUnique({ where: { email: doc.email } });
      if (existing) {
        // Update photoUrl if existing
        const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: existing.id } });
        if (doctorProfile) {
          await prisma.doctorProfile.update({
            where: { id: doctorProfile.id },
            data: { photoUrl: doc.photoUrl },
          });
        }
        continue;
      }

      const user = await prisma.user.create({
        data: {
          email: doc.email,
          passwordHash: defaultPassword,
          name: doc.name,
          role: ROLES.DOCTOR,
        },
      });

      await prisma.doctorProfile.create({
        data: {
          userId: user.id,
          specialization: doc.specialization,
          qualification: doc.qualification,
          experienceYears: doc.experienceYears,
          consultationFee: doc.consultationFee,
          bio: doc.bio,
          photoUrl: doc.photoUrl,
          slots: {
            create: doc.slots,
          },
        },
      });
    }

    console.log("Comprehensive doctor data with local image paths seeded successfully.");
  } catch (error) {
    console.error("Seeding Error:", error);
  }
};
