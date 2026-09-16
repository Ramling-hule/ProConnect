import mongoose from 'mongoose';
const hackathonRegistrationSchema = new mongoose.Schema({
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team:      { type: mongoose.Schema.Types.ObjectId, ref: 'HackathonTeam', default: null },

  registrationType: { type: String, enum: ['individual', 'team'], default: 'individual' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'waitlisted', 'cancelled', 'rejected'],
    default: 'pending',
  },
  payment:       { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },
  paymentStatus: { type: String, enum: ['not_required', 'pending', 'paid', 'refunded'], default: 'not_required' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  rejectedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },
  waitlistPosition: { type: Number, default: null },
  checkedIn:   { type: Boolean, default: false },
  checkInTime: { type: Date, default: null },
  certificateIssued: { type: Boolean, default: false },
  certificateUrl:    { type: String, default: null },
  submittedAt: { type: Date, default: Date.now },

}, { timestamps: true });
hackathonRegistrationSchema.index({ hackathon: 1, user: 1 }, { unique: true });
hackathonRegistrationSchema.index({ hackathon: 1, status: 1 });
hackathonRegistrationSchema.index({ user: 1, status: 1 });
hackathonRegistrationSchema.index({ hackathon: 1, waitlistPosition: 1 }, { sparse: true });
hackathonRegistrationSchema.index({ team: 1 }, { sparse: true });

export default mongoose.model('HackathonRegistration', hackathonRegistrationSchema);
