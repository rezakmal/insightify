import express from "express";
import { createModule, getModuleById, startModule, completeModule, getModuleStatus } from "../controllers/module.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:moduleId", protect, getModuleById);
router.post("/", protect, createModule);
router.post("/:moduleId/start", protect, startModule); // Body: { userId: "...", courseId: "..." }
router.post("/:moduleId/complete", protect, completeModule); // Body: { userId: "...", courseId: "..." }
router.get("/:moduleId/status", protect, getModuleStatus); // Query: ?userId=...

export default router;
