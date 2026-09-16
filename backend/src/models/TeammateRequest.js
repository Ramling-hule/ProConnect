import mongoose from 'mongoose';
import { normalizeSkills } from '../utils/skillNormalizer.js';

const TeammateRequestSchema = new mongoose.Schema({
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'HackathonTeam' }, 
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  requiredSkills: [{ type: String }],
  preferredYear: { type: String }, 
  preferredBranch: { type: String },
  preferredCodingExperience: { type: String },
  requiredTechnologies: [{ type: String }],
  seatsAvailable: { type: Number, default: 1 },
  visibility: { type: String, enum: ['public', 'connections'], default: 'public' },
  status: { type: String, enum: ['active', 'closed', 'expired'], default: 'active' },
  expiresAt: { type: Date },
}, { timestamps: true });

TeammateRequestSchema.index({ hackathon: 1, status: 1 });
TeammateRequestSchema.index({ creator: 1 });
TeammateRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
TeammateRequestSchema.pre('save', function () {
  if (this.isModified('requiredSkills')) {
    this.requiredSkills = normalizeSkills(this.requiredSkills);
  }
});

TeammateRequestSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate();
  if (update) {
    if (update.requiredSkills) update.requiredSkills = normalizeSkills(update.requiredSkills);
    if (update.$set && update.$set.requiredSkills) {
      update.$set.requiredSkills = normalizeSkills(update.$set.requiredSkills);
    }
  }
});

export default mongoose.model('TeammateRequest', TeammateRequestSchema);
