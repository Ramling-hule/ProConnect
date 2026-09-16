import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { normalizeSkills } from "../utils/skillNormalizer.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    institute: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "admin", "institute", "mentor", "STUDENT", "MENTOR", "ADMIN"],
      default: "student",
    },
    isVerified: { type: Boolean, default: false },
    badges: [{ type: String }],
    points: { type: Number, default: 0 },
    headline: { type: String },
    location: { type: String },
    about: { type: String },
    profilePicture: { type: String, default: "" },
    skills: [{ type: String }],
    experience: [{ type: mongoose.Schema.Types.Mixed }],
    education: [{ type: mongoose.Schema.Types.Mixed }],
    codingProfiles: {
      leetcode: { type: String, default: "" },
      codeforces: { type: String, default: "" },
      codechef: { type: String, default: "" },
      atcoder: { type: String, default: "" },
      github: { type: String, default: "" },
      hackerrank: { type: String, default: "" },
      geeksforgeeks: { type: String, default: "" },
    },
    portfolio: { type: String, default: "" },
    resume: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    personalWebsite: { type: String, default: "" },
    techStack: {
      languages: [{ type: String }],
      frameworks: [{ type: String }],
      databases: [{ type: String }],
      cloud: [{ type: String }],
      ai: [{ type: String }],
      devOps: [{ type: String }],
    },
    achievements: {
      hackathonWins: [{ type: String }],
      contestRatings: [{ type: String }],
      certifications: [{ type: String }],
      research: [{ type: String }],
      openSource: [{ type: String }],
    },
    recentPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
    pinnedProjects: [{ type: mongoose.Schema.Types.Mixed }],
    portfolioGallery: [{ type: String }],
    availability: { type: String, default: "Available" },
    preferredRoles: [{ type: String }],
    openToWork: { type: Boolean, default: false },
    openToCompete: { type: Boolean, default: false },
    visibility: { type: String, enum: ['PUBLIC', 'PRIVATE', 'CONNECTIONS_ONLY'], default: 'PUBLIC' },
    isOrganizer: { type: Boolean, default: false },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    instituteName: { type: String },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    verificationOtpHash: { type: String },
    verificationOtpExpires: { type: Date },
    verificationAttempts: { type: Number, default: 0 },
    passwordResetTokenHash: { type: String },
    passwordResetExpires: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    tokenVersion: { type: Number, default: 1 },
    googleId: { type: String, unique: true, sparse: true },
    mfaEnabled: { type: Boolean, default: false },
    mfaSecret: { type: String },
    tempMfaToken: { type: String }
  },
  { timestamps: true }
);

userSchema.index({ verificationOtpHash: 1 }, { sparse: true });
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
userSchema.pre("save", function () {
  if (this.isModified("skills")) {
    this.skills = normalizeSkills(this.skills);
  }
});
userSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (update && update.skills) {
    update.skills = normalizeSkills(update.skills);
  }
  if (update && update.$set && update.$set.skills) {
    update.$set.skills = normalizeSkills(update.$set.skills);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
