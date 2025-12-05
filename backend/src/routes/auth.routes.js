import express from "express";
import { signup, login, profile, logout } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/profile", protect, profile); // Query: ?userId=...
router.post("/logout", protect, logout); // Requires authentication - can only logout self

export default router;