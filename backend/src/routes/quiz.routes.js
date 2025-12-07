import express from "express";
import { startQuiz, submitQuiz } from "../controllers/quiz.controller.js";

const router = express.Router();

router.post("/:moduleId/start", startQuiz); // Public - no userId needed
router.post("/:moduleId/submit", submitQuiz); // Body: { userId: "...", courseId: "...", answers: [...] }

export default router;
