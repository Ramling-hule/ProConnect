import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  start: { type: String, required: true },
  end: { type: String, required: true }
}, { _id: false });

const availabilitySchema = new mongoose.Schema(
  {
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "Mentor", required: true, unique: true },
    timezone: { type: String, required: true, default: "Asia/Kolkata" },
    weeklySchedule: {
      monday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] },
      tuesday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] },
      wednesday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] },
      thursday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] },
      friday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] },
      saturday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] },
      sunday: { isAvailable: { type: Boolean, default: false }, slots: [slotSchema] }
    },
    exceptions: [{ type: Date }],
    
    bufferTime: { type: Number, default: 10 },
    advanceNotice: { type: Number, default: 24 }
  },
  { timestamps: true }
);

export default mongoose.model("Availability", availabilitySchema);
