import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  createCourse,
  getCourses,
  getCourseById,
  getModulesByCourse,
  getCourseProgress,
  enrollCourse,
} from "../controllers/course.controller.js";

const router = express.Router();

// Public (read-only)
router.get("/", getCourses);
router.get("/:courseId", getCourseById);
router.get("/:courseId/modules", getModulesByCourse);

// Create course sebaiknya protected (minimal login, idealnya admin)
router.post("/", protect, createCourse);

// Protected actions
router.get("/:courseId/progress", protect, getCourseProgress);
router.post("/enroll", protect, enrollCourse);

export default router;
