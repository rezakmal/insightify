import express from "express";
import { createModule, getModuleById, startModule, completeModule, getModuleStatus } from "../controllers/module.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/:moduleId", getModuleById);
router.post("/", createModule);
router.post("/:moduleId/start", startModule); // Body: { userId: "...", courseId: "..." }
router.post("/:moduleId/complete", completeModule); // Body: { userId: "...", courseId: "..." }
router.get("/:moduleId/status", getModuleStatus); // Query: ?userId=...

export default router;