import mongoose from 'mongoose';

const userInteractionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mentor',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['VIEW', 'CLICK', 'BOOKMARK', 'BOOK', 'COMPLETE_SESSION', 'REJECT'],
    required: true
  },
  context: {
    query: String,
    recommendationVersion: String,
    rankPosition: Number,
    source: String
  },
  sessionDurationMinutes: Number,
  rating: Number
}, {
  timestamps: true
});
userInteractionSchema.index({ userId: 1, action: 1, createdAt: -1 });
userInteractionSchema.index({ mentorId: 1, action: 1 });

export default mongoose.model('UserInteraction', userInteractionSchema);
