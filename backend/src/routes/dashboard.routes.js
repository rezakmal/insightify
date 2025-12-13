import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getDashboardOverview } from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/overview", protect, getDashboardOverview);

export default router;