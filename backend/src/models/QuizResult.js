import mongoose from "mongoose";

const quizResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("QuizResult", quizResultSchema);