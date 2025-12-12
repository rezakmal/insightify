import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
  deadlineAt: {
    type: Date,
    required: false, // optional, bisa diisi admin kalau mau pake deadline
  },
  maximumDuration: {
  type: Number,
  default: 600, // 10 menit  
  },
  questions: [
    {
      _id: false,
      id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() }, // unique per question
      question: { type: String, required: true },
      options: { type: [String], required: true }, // expect 4 options
      answer: { type: Number, required: true } // index 0..3
    }
  ]
});

export default mongoose.model("Quiz", quizSchema);