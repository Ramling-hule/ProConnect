import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  podId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pod',
    required: true,
    index: true
  },
  overallScore: {
    type: Number,
    default: 0
  },
  metrics: {
    assignmentsCompleted: { type: Number, default: 0 },
    attendanceRate: { type: Number, default: 0 },
    quizScoresAvg: { type: Number, default: 0 },
    peerReviewAvg: { type: Number, default: 0 },
    activityScore: { type: Number, default: 0 },
    consistencyStreak: { type: Number, default: 0 }
  },
  badges: [{
    name: String,
    awardedAt: Date,
    iconUrl: String
  }],
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW'
  }
}, {
  timestamps: true
});

progressSchema.index({ userId: 1, podId: 1 }, { unique: true });
progressSchema.index({ 'metrics.consistencyStreak': -1 });

export default mongoose.model('Progress', progressSchema);
