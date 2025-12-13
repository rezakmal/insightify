import express from "express";
import { startQuiz, submitQuiz } from "../controllers/quiz.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/:moduleId/start", protect, startQuiz); // Public - no userId needed
router.post("/:moduleId/submit", protect, submitQuiz); // Body: { userId: "...", courseId: "...", answers: [...] }

export default router;