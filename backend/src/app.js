import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import courseRoutes from "./routes/course.routes.js";
import moduleRoutes from "./routes/module.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import learningRoutes from "./routes/learning.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import mlRoutes from "./routes/ml.routes.js";
import rateLimit from "express-rate-limit";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // allow Postman / no-origin requests
      if (!origin) return cb(null, true);

      // if not configured, allow all (dev-friendly)
      if (allowedOrigins.length === 0) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

const mlLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});


app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/quiz", quizRoutes);

app.use("/api/users", learningRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use("/api/ml", mlRoutes);
app.use("/api/auth", authLimiter);
app.use("/api/ml", mlLimiter);

// CHANGED: 404 handler (JSON, not HTML)
app.use((req, res) => {
  return res.status(404).json({ message: "Route not found" });
});

// CHANGED: centralized error handler (JSON)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  return res.status(500).json({ message: "Internal server error" });
});

export default app;
