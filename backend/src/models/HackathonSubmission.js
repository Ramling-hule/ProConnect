import mongoose from 'mongoose';

const SubmissionVersionSchema = new mongoose.Schema({
  githubUrl:  { type: String, default: null },
  demoVideo:  { type: String, default: null },
  pptUrl:     { type: String, default: null },
  pdfUrl:     { type: String, default: null },
  liveUrl:    { type: String, default: null },
  driveLink:  { type: String, default: null },
  notes:      { type: String, default: null },
  submittedBy:{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submittedAt:{ type: Date, default: Date.now },
  isDraft:    { type: Boolean, default: true },
}, { _id: true });

const hackathonSubmissionSchema = new mongoose.Schema({
  hackathon: { type: mongoose.Schema.Types.ObjectId, ref: 'Hackathon', required: true },
  team:      { type: mongoose.Schema.Types.ObjectId, ref: 'HackathonTeam', required: true },
  track:     { type: String, default: null },
  githubUrl:  { type: String, default: null },
  demoVideo:  { type: String, default: null },
  pptUrl:     { type: String, default: null },
  pdfUrl:     { type: String, default: null },
  liveUrl:    { type: String, default: null },
  driveLink:  { type: String, default: null },
  notes:      { type: String, default: null },
  isDraft:   { type: Boolean, default: true },
  isLocked:  { type: Boolean, default: false },
  scores: [{
    judge:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score:    { type: Number },
    feedback: { type: String },
    scoredAt: { type: Date, default: Date.now },
  }],
  totalScore: { type: Number, default: null },
  rank:       { type: Number, default: null },
  isWinner:   { type: Boolean, default: false },
  prizeWon:   { type: String, default: null },
  history: [SubmissionVersionSchema],
  finalSubmittedAt: { type: Date, default: null },
  finalSubmittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

}, { timestamps: true });
hackathonSubmissionSchema.index({ hackathon: 1, team: 1 }, { unique: true });
hackathonSubmissionSchema.index({ hackathon: 1, isWinner: 1 });
hackathonSubmissionSchema.index({ hackathon: 1, totalScore: -1 });
hackathonSubmissionSchema.index({ team: 1 });

export default mongoose.model('HackathonSubmission', hackathonSubmissionSchema);
