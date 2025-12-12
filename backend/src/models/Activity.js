import mongoose from "mongoose";

const { Schema } = mongoose;

const activitySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: "Course",
    },
    module: {
      type: Schema.Types.ObjectId,
      ref: "Module",
    },
    type: {
      type: String,
      enum: [
        "course_enroll",
        "course_view",
        "course_revisit",
        "course_complete",
        "module_start",
        "module_complete",
        "quiz_start",
        "quiz_submit",
      ],
      required: true,
    },
    durationMinutes: {
      type: Number,
      min: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ user: 1, occurredAt: -1 });

export default mongoose.model("Activity", activitySchema);