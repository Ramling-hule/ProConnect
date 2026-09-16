import mongoose from 'mongoose';

const podSessionSchema = new mongoose.Schema({
  podId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pod', required: true },
  mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 60 },
  meetingLink: { type: String },
  status: { 
    type: String, 
    enum: ['scheduled', 'live', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  attendeesExpected: { type: Number, default: 0 },
  recordingUrl: { type: String }
}, { timestamps: true });

export default mongoose.model('PodSession', podSessionSchema);
