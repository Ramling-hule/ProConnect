import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  joinRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  privacy: { type: String, enum: ['public', 'private'], default: 'public' },
  memberLimit: { type: Number, default: 50 },
  institute: { type: String }, 
  image: { type: String, default: "" },
  inviteCode: { type: String, unique: true }, 
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Group', groupSchema);