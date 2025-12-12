import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getMyActivity,
  getMyActivityDaily,
  getMyQuizResults,
  getMyProgress,
} from "../controllers/learning.controller.js";

const router = express.Router();

router.get("/me/activity", protect, getMyActivity);
router.get("/me/activity/daily", protect, getMyActivityDaily);
router.get("/me/quiz-results", protect, getMyQuizResults);
router.get("/me/progress", protect, getMyProgress);

export default router;