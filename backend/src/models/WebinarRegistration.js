import mongoose from "mongoose";

const webinarRegistrationSchema = new mongoose.Schema(
  {
    webinar: { type: mongoose.Schema.Types.ObjectId, ref: "Webinar", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "REGISTERED", "CANCELLED", "ATTENDED"],
      default: "PENDING_PAYMENT"
    },
    topic: { type: String, default: "Webinar Registration" },
    description: { type: String },
    preferredOutcome: { type: String },
    additionalInfo: { type: String },
    attachments: [{
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String }
    }],
    
    cancellationReason: { type: String }
  },
  { timestamps: true }
);

webinarRegistrationSchema.index({ webinar: 1, user: 1 }, { unique: true });

export default mongoose.model("WebinarRegistration", webinarRegistrationSchema);
