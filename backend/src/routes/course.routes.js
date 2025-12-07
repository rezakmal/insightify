import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { createCourse, getCourses, getCourseById, getModulesByCourse, getCourseProgress, enrollCourse } from "../controllers/course.controller.js";

const router = express.Router();

// Public routes - no auth needed for reading
router.get("/", getCourses);
router.get("/:courseId", getCourseById);
router.get("/:courseId/modules", getModulesByCourse);
router.post("/", createCourse); // content creation

// Protected routes - need userId for actions
router.get("/:courseId/progress", getCourseProgress); // Query: ?userId=...
router.post("/enroll", enrollCourse); // Body: { userId: "...", courseId: "..." }

export default router;