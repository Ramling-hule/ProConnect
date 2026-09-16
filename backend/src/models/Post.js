import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String },
  image: { type: String },
  media: {
    url:              { type: String },
    resourceType:     { type: String, enum: ['image', 'video', 'raw'] },
    format:           { type: String },
    originalFilename: { type: String },
    bytes:            { type: Number },
  },
  likes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [
    {
      user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      text:      String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  visibility: { type: String, enum: ['PUBLIC', 'PRIVATE', 'CONNECTIONS_ONLY'], default: 'PUBLIC' },
  postType: {
    type: String,
    enum: ['regular', 'hackathon_lfm'],
    default: 'regular',
  },
  hackathonMeta: {
    hackathonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', default: null },
    teamId:      { type: mongoose.Schema.Types.ObjectId, ref: 'HackathonTeam', default: null },
    rolesNeeded: [{ type: String }],
    techStack:   [{ type: String }],
  },
}, { timestamps: true });

postSchema.index({ createdAt: -1, _id: -1 });
postSchema.index({ user: 1 });
postSchema.index({ postType: 1, createdAt: -1 });

export default mongoose.model('Post', postSchema);