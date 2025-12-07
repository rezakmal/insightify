import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
  status: { type: String, enum: ["started", "completed"], required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Activity", activitySchema);