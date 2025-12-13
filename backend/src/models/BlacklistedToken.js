import mongoose from "mongoose";

const blacklistedTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 7 * 24 * 60 * 60 // token expires after 1 hour
  }
});

export default mongoose.model("BlacklistedToken", blacklistedTokenSchema);