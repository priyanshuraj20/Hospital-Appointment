import express from "express";
import { authenticate } from "../auth/verifyToken.js";
import { analyzeSymptoms } from "../Controllers/aiController.js";

const router = express.Router({ mergeParams: true });

router.post("/analyze", authenticate, analyzeSymptoms);

export default router;
