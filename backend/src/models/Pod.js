import mongoose from 'mongoose';

const podSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  goal: {
    type: String,
    required: true,
    index: true,
    trim: true
  },
  description: {
    type: String
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['FORMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'FORMING',
    index: true
  },
  activeMemberCount: {
    type: Number,
    default: 0
  },
  minSize: {
    type: Number,
    default: 3
  },
  maxSize: {
    type: Number,
    default: 5
  },
  schedule: {
    timezone: { type: String, required: true },
    liveSessionDay: { type: String },
    liveSessionTime: { type: String }
  },
  requirements: {
    skillLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
    },
    language: String,
    budget: Number
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  lateJoinAllowed: {
    type: Boolean,
    default: false
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});
podSchema.index({ status: 1, 'requirements.skillLevel': 1, 'schedule.timezone': 1 });

export default mongoose.model('Pod', podSchema);
