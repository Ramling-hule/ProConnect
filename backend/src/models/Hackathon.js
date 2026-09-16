import mongoose from 'mongoose';

const PrizeSchema = new mongoose.Schema({
  rank:        { type: String, required: true },
  title:       { type: String, required: true },
  amount:      { type: Number, default: 0 },
  description: { type: String },
}, { _id: false });

const TrackSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: { type: String },
  skills:      [{ type: String }],
}, { _id: false });

const JudgingCriteriaSchema = new mongoose.Schema({
  criterion: { type: String, required: true },
  weight:    { type: Number, default: 0 },
}, { _id: false });

const FaqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer:   { type: String, required: true },
}, { _id: false });

const SponsorSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  logo:    { type: String },
  website: { type: String },
  tier:    { type: String, enum: ['title', 'gold', 'silver', 'bronze', 'community'], default: 'community' },
}, { _id: false });

const hackathonSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  tagline:     { type: String },
  banner:      { type: String },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  judges:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  category:   { type: String, required: true },
  skills:     [{ type: String }],
  mode:       { type: String, enum: ['online', 'offline', 'hybrid'], default: 'online' },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'open'], default: 'open' },
  eligibility: {
    college:      { type: String },
    minYear:      { type: Number },
    maxYear:      { type: Number },
    openToPublic: { type: Boolean, default: true },
  },
  timeline: {
    registrationOpen:  { type: Date, required: true },
    registrationClose: { type: Date, required: true },
    hackathonStart:    { type: Date, required: true },
    hackathonEnd:      { type: Date, required: true },
    resultAnnouncement:{ type: Date },
  },
  minTeamSize: { type: Number, default: 1 },
  maxTeamSize: { type: Number, default: 4 },
  soloAllowed: { type: Boolean, default: true },
  maxParticipants:   { type: Number, default: null },
  registrationCount: { type: Number, default: 0 },
  waitlistEnabled:   { type: Boolean, default: false },
  waitlistCount:     { type: Number, default: 0 },
  approvalRequired:  { type: Boolean, default: false },
  isFree:          { type: Boolean, default: true },
  registrationFee: { type: Number, default: 0 },
  feeModel:        { type: String, enum: ['per_team', 'per_participant'], default: 'per_participant' },
  currency:        { type: String, default: 'INR' },
  refundPolicy: {
    fullRefundBeforeDate: { type: Date },
    partialRefundPercent: { type: Number, min: 0, max: 100 },
    noRefundAfterDate: { type: Date }
  },
  tracks:          [TrackSchema],
  prizes:          [PrizeSchema],
  judgingCriteria: [JudgingCriteriaSchema],
  faqs:            [FaqSchema],
  sponsors:        [SponsorSchema],
  rules:           [{ type: String }],
  resources:       [{ url: String, label: String }],
  certificateEnabled: { type: Boolean, default: false },
  certificateTemplate:{ type: String },
  status:     { type: String, enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'], default: 'draft' },
  visibility: { type: String, enum: ['public', 'private', 'unlisted'], default: 'public' },
  isFeatured: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },

}, { timestamps: true });
hackathonSchema.index({ slug: 1 }, { unique: true });
hackathonSchema.index({ status: 1, visibility: 1, 'timeline.registrationClose': 1 });
hackathonSchema.index({ skills: 1, category: 1 });
hackathonSchema.index({ isFeatured: -1, createdAt: -1 });
hackathonSchema.index({ organizer: 1 });
hackathonSchema.index({ mode: 1, difficulty: 1 });
hackathonSchema.index({ 'timeline.hackathonStart': 1 });
hackathonSchema.index({ deletedAt: 1 });
hackathonSchema.index({ isFree: 1, registrationFee: 1 });
hackathonSchema.virtual('isRegistrationOpen').get(function () {
  const now = Date.now();
  return (
    this.status === 'published' &&
    this.timeline.registrationOpen <= now &&
    this.timeline.registrationClose >= now
  );
});

export default mongoose.model('Hackathon', hackathonSchema);
