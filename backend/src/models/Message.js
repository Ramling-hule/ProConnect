import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' }, 
  
  encryptedMessage: { type: String },
  iv: { type: String },
  authTag: { type: String },
  keyVersion: { type: Number, default: 1 },
  messageType: { type: String, enum: ['text', 'file', 'system'], default: 'text' },
  fileUrl: { type: String },
  fileType: { type: String, enum: ['image', 'video', 'pdf', 'ppt', 'none', 'file'], default: 'none' },
  fileName: { type: String },
  
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  readAt: { type: Date },
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Message', messageSchema);