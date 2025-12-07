import mongoose from "mongoose";

const userCourseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },

  completedModules: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module"
    }
  ],

  progress: {
    type: Number,
    default: 0
  },

  isCompleted: {
    type: Boolean,
    default: false
  },

  quizResults: [
    {
      moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module" },
      correct: Number,
      total: Number,
      score: Number,
      passed: Boolean,
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

export default mongoose.model("UserCourse", userCourseSchema);