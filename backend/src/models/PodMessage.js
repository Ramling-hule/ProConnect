import mongoose from 'mongoose';

const podMessageSchema = new mongoose.Schema({
  podId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pod',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    fileUrl: String,
    fileType: String
  }],
  threadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PodMessage',
    sparse: true
  },
  isAnnouncement: {
    type: Boolean,
    default: false
  },
  readBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: Date
  }]
}, {
  timestamps: true
});
podMessageSchema.index({ podId: 1, createdAt: -1 });
podMessageSchema.index({ threadId: 1 });

export default mongoose.model('PodMessage', podMessageSchema);
