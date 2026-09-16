import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "MentorService", required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    
    status: {
      type: String,
      enum: ["Pending", "Payment Pending", "Confirmed", "Cancelled", "Completed", "Refunded", "No Show", "Expired", "PENDING_PAYMENT", "BOOKED", "CANCELLED"],
      default: "PENDING_PAYMENT"
    },
    
    meetingLink: { type: String },
    
    amount: { type: Number, required: true },
    platformFee: { type: Number, default: 0 },
    topic: { type: String, required: true, default: "General Discussion" },
    description: { type: String, required: true, default: "No description provided." },
    preferredOutcome: { type: String },
    additionalInfo: { type: String },
    attachments: [{
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String }
    }],
    
    notes: { type: String },
    cancellationReason: { type: String }
  },
  { timestamps: true }
);
bookingSchema.index({ date: 1, startTime: 1 });

export default mongoose.model("Booking", bookingSchema);
