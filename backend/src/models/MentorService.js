import mongoose from "mongoose";

const mentorServiceSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    tags: [{ type: String }],
    meetingType: { type: String, enum: ["online", "offline"], default: "online" },
    maxBookingsPerDay: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model("MentorService", mentorServiceSchema);
