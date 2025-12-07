import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  modules: [
    {
      moduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Module", required: true },
      order: { type: Number, default: 0 }
    }
  ]
});

export default mongoose.model("Course", courseSchema);