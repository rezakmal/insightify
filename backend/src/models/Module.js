import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String
});

export default mongoose.model("Module", moduleSchema);