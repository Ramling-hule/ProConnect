import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: [
      'connection_request', 'connection_accepted', 'message',
      'like', 'comment', 'GROUP_JOIN_REQUEST', 'GROUP_APPROVED',
      'hackathon_invite', 'hackathon_accepted', 'hackathon_rejected',
      'hackathon_submission', 'hackathon_reminder', 'hackathon_winner',
      'team_join_request', 'team_joined', 'hackathon_payment',
      'INTEREST_RECEIVED', 'REQUEST_ACCEPTED', 'REQUEST_REJECTED',
      'TEAM_INVITATION', 'TEAM_JOINED', 'TEAM_LEFT', 'LEADER_CHANGED',
      'TEAM_DELETED', 'TEAM_REGISTRATION_COMPLETE'
    ], 
    required: true 
  },
  message: { type: String },
  isRead: { type: Boolean, default: false },
  link: { type: String },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);