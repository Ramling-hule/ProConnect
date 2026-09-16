import mongoose from 'mongoose';
import { normalizeSkills } from '../utils/skillNormalizer.js';

const MemberSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role:     { type: String, default: '' },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const InviteSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:    { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  sentAt:    { type: Date, default: Date.now },
  expiresAt: { type: Date },
}, { _id: false });

const hackathonTeamSchema = new mongoose.Schema({
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  name:      { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  captain:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:    { type: String, enum: ['active', 'locked', 'deleted'], default: 'active' },
  maxMembers: { type: Number, default: 4 },

  members:      [MemberSchema],
  invitations:  [InviteSchema],
  joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isLookingForMembers: { type: Boolean, default: false },
  rolesNeeded:         [{ type: String }],
  techStack:           [{ type: String }],
  isLocked:    { type: Boolean, default: false },
  isSubmitted: { type: Boolean, default: false },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
}, { timestamps: true });
hackathonTeamSchema.index({ hackathon: 1, 'members.user': 1 });
hackathonTeamSchema.index({ hackathon: 1, captain: 1 });
hackathonTeamSchema.index({ hackathon: 1, isLookingForMembers: 1 });
hackathonTeamSchema.index({ 'invitations.user': 1, 'invitations.status': 1 });
hackathonTeamSchema.pre('save', function () {
  if (this.isModified('techStack')) {
    this.techStack = normalizeSkills(this.techStack);
  }
  if (this.isModified('rolesNeeded')) {
    this.rolesNeeded = normalizeSkills(this.rolesNeeded);
  }
});

hackathonTeamSchema.pre('findOneAndUpdate', function () {
  const update = this.getUpdate();
  if (update) {
    if (update.techStack) update.techStack = normalizeSkills(update.techStack);
    if (update.rolesNeeded) update.rolesNeeded = normalizeSkills(update.rolesNeeded);
    
    if (update.$set) {
      if (update.$set.techStack) update.$set.techStack = normalizeSkills(update.$set.techStack);
      if (update.$set.rolesNeeded) update.$set.rolesNeeded = normalizeSkills(update.$set.rolesNeeded);
    }
  }
});

export default mongoose.model('HackathonTeam', hackathonTeamSchema);
