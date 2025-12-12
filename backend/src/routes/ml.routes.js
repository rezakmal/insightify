import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  generateProfile,
  generateRecommendations,
  getMyProfile,
  getMyRecommendations,
} from "../controllers/ml.controller.js";

const router = express.Router();

router.post("/profile/generate", protect, generateProfile);
router.post("/recommendations/generate", protect, generateRecommendations);
router.get("/profile", protect, getMyProfile);
router.get("/recommendations", protect, getMyRecommendations);

export default router;