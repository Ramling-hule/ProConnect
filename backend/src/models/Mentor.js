import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
  degree:      { type: String, required: true },
  institution: { type: String, required: true },
  year:        { type: Number, required: true },
}, { _id: false });

const mentorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    phone:       { type: String },
    city:        { type: String },
    state:       { type: String },
    country:     { type: String },
    dateOfBirth: { type: Date },
    headline:          { type: String, required: true },
    about:             { type: String, required: true },
    company:           { type: String, required: true },
    role:              { type: String, required: true },
    yearsOfExperience: { type: Number, required: true },
    education:    [educationSchema],
    achievements: [{ type: String }],
    linkedin:    { type: String },
    github:      { type: String },
    portfolio:   { type: String },
    twitter:     { type: String },
    leetcode:    { type: String },
    codeforces:  { type: String },
    hackerrank:  { type: String },
    skills:        [{ type: String }],
    languages:     [{ type: String }],
    resumeUrl:     { type: String },
    videoIntroUrl: { type: String },
    identityProofUrl: { type: String },
    companyIdUrl:     { type: String },
    isApproved: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    totalSessions:  { type: Number, default: 0 },
    totalEarnings:  { type: Number, default: 0 },
    averageRating:  { type: Number, default: 0 },
    totalReviews:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Mentor", mentorSchema);
