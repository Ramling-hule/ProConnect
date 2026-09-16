import mongoose from "mongoose";

const webinarSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true },
    
    date: { type: Date, required: true },
    time: { type: String, required: true },
    duration: { type: Number, required: true },
    
    price: { type: Number, default: 0 },
    maxAttendees: { type: Number, default: 100 },
    
    status: {
      type: String,
      enum: ["Upcoming", "Live", "Completed", "Cancelled"],
      default: "Upcoming"
    },
    
    meetingLink: { type: String },
    recordingLink: { type: String },
    
    resources: [{
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String }
    }],
    
    coverImage: { type: String }
  },
  { timestamps: true }
);

webinarSchema.index({ date: 1, status: 1 });

export default mongoose.model("Webinar", webinarSchema);
