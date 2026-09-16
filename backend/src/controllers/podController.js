import { asyncHandler } from '../utils/asyncHandler.js';
import mongoose from 'mongoose';
import Pod from '../models/Pod.js';
import PodMember from '../models/PodMember.js';
import PodMilestone from '../models/PodMilestone.js';
import Assignment from '../models/Assignment.js';
import PodSession from '../models/PodSession.js';
import PodMessage from '../models/PodMessage.js';
import PodStateService from '../services/PodStateService.js';
import { nanoid } from '../utils/slugify.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import RecommendationExplanation from '../models/RecommendationExplanation.js';
import OpenAI from 'openai';
import { env } from '../config/env.js';
import Attendance from '../models/Attendance.js';
import GamificationService from '../services/GamificationService.js';

export const listPods = asyncHandler(async (req, res) => {
  const pods = await Pod.find({ status: { $in: ['FORMING', 'ACTIVE'] } })
    .populate('mentorId', 'name username profilePicture headline')
    .sort({ createdAt: -1 })
    .lean();
  const podsWithCounts = await Promise.all(pods.map(async (pod) => {
    const memberCount = await PodMember.countDocuments({ podId: pod._id, status: 'ACTIVE' });
    return { ...pod, memberCount };
  }));

  res.status(200).json({ success: true, pods: podsWithCounts });
});
export const getPodById = asyncHandler(async (req, res) => {
  const pod = await Pod.findById(req.params.id)
    .populate('mentorId', 'name username profilePicture headline about')
    .lean();

  if (!pod) {
    res.status(404);
    throw new Error('Pod not found');
  }
  const members = await PodMember.find({ podId: pod._id, status: 'ACTIVE' })
    .populate('userId', 'name username profilePicture headline')
    .lean();

  res.status(200).json({ success: true, pod, members, memberCount: members.length });
});
export const joinPod = asyncHandler(async (req, res) => {
  const podId = req.params.id;
  const userId = req.user._id;

  const pod = await Pod.findById(podId);
  if (!pod) {
    res.status(404);
    throw new Error('Pod not found');
  }

  if (pod.status !== 'FORMING' && pod.status !== 'ACTIVE') {
    res.status(400);
    throw new Error('This pod is not open for new members');
  }

  if (pod.status === 'ACTIVE' && !pod.lateJoinAllowed) {
    res.status(400);
    throw new Error('This pod is already active and does not allow late joins');
  }

  const session = await PodMember.startSession();
  session.startTransaction();

  try {
    const existingMember = await PodMember.findOne({ podId, userId }).session(session);
    if (existingMember && ['ACTIVE', 'PENDING_PAYMENT'].includes(existingMember.status)) {
      throw new Error('You are already a member or have a pending payment for this pod');
    }

    const currentCount = await PodMember.countDocuments({ podId, status: { $in: ['ACTIVE', 'PENDING_PAYMENT'] } }).session(session);
    if (currentCount >= pod.maxSize) {
      throw new Error('This pod is already at maximum capacity');
    }

    const { topic, description, preferredOutcome, additionalInfo, attachments } = req.body;
    const isPaid = pod.requirements && pod.requirements.budget > 0;

    let member;
    if (existingMember) {
      existingMember.status = isPaid ? 'PENDING_PAYMENT' : 'ACTIVE';
      existingMember.joinedAt = new Date();
      existingMember.topic = topic || existingMember.topic;
      existingMember.description = description || existingMember.description;
      existingMember.preferredOutcome = preferredOutcome || existingMember.preferredOutcome;
      existingMember.additionalInfo = additionalInfo || existingMember.additionalInfo;
      existingMember.attachments = attachments || existingMember.attachments;
      await existingMember.save({ session });
      member = existingMember;
    } else {
      member = await PodMember.create([{
        podId,
        userId,
        role: 'STUDENT',
        status: isPaid ? 'PENDING_PAYMENT' : 'ACTIVE',
        joinedAt: new Date(),
        topic: topic || 'Pod Registration',
        description,
        preferredOutcome,
        additionalInfo,
        attachments
      }], { session });
      member = member[0];
    }

    if (!isPaid) {
      await Pod.findByIdAndUpdate(podId, { $inc: { activeMemberCount: 1 } }, { session });
    }

    await session.commitTransaction();

    res.status(201).json({
      message: isPaid ? 'Pod join initiated. Complete payment to confirm.' : 'Successfully joined the pod',
      member
    });
  } catch (err) {
    await session.abortTransaction();
    if (err.code === 11000) {
      res.status(400);
      throw new Error('You are already a member of this pod');
    }
    throw err;
  } finally {
    session.endSession();
  }
  if (pod.status === 'FORMING') {
    await PodStateService.autoStart(podId);
  }
  if (pod.groupId) {
    await Group.findByIdAndUpdate(pod.groupId, { $addToSet: { members: userId } });
  }

  res.status(201).json({ success: true, message: 'Joined pod successfully', member });
});
export const createPod = asyncHandler(async (req, res) => {
  const group = await Group.create({
    name:       `[Pod] ${req.body.name}`,
    description:`Pod chat for "${req.body.goal}"`,
    admins:     [req.user._id],
    members:    [req.user._id],
    privacy:    'private',
    inviteCode:  nanoid(),
  });

  const pod = await Pod.create({
    ...req.body,
    mentorId: req.user._id,
    groupId: group._id,
  });

  await PodMember.create({
    podId: pod._id,
    userId: req.user._id,
    role: 'PRIMARY_MENTOR',
    status: 'ACTIVE'
  });

  res.status(201).json({ success: true, pod });
});

export const adminListPods = asyncHandler(async (req, res) => {
  const pods = await Pod.find().populate('mentorId', 'name username').lean();
  res.status(200).json({ success: true, pods });
});

export const assignStudent = asyncHandler(async (req, res) => {
  const { studentId, role } = req.body;
  const member = await PodMember.create({
    podId: req.params.id,
    userId: studentId,
    role: role || 'STUDENT',
    status: 'ACTIVE',
  });
  res.status(201).json({ success: true, member });
});
export const getMentorPods = asyncHandler(async (req, res) => {
  const memberRoles = await PodMember.find({
    userId: req.user._id,
    role: { $in: ['PRIMARY_MENTOR', 'GUEST_MENTOR'] },
    status: 'ACTIVE'
  }).select('podId');
  const podIds = memberRoles.map(m => m.podId);

  const pods = await Pod.find({
    $or: [
      { mentorId: req.user._id },
      { _id: { $in: podIds } }
    ]
  }).lean();
  res.status(200).json({ success: true, pods });
});

export const startPod = asyncHandler(async (req, res) => {
  const pod = await PodStateService.startPod(req.params.id, req.user._id);
  res.status(200).json({ success: true, pod });
});

export const completePod = asyncHandler(async (req, res) => {
  const pod = await PodStateService.completePod(req.params.id, req.user._id);
  res.status(200).json({ success: true, pod });
});

export const suggestMembers = asyncHandler(async (req, res) => {
  const pod = await Pod.findById(req.params.id);
  if (!pod) throw new AppError('Pod not found', 404);
  const students = await User.find({ role: 'student', isVerified: true }).limit(50).lean();
  if (students.length === 0) return res.status(200).json({ success: true, candidates: [] });

  const openai = new OpenAI({ apiKey: env.openaiApiKey });
  const prompt = `
  You are an AI matching engine. Given a Mentor Pod with the goal "${pod.goal}" and requirements "${pod.requirements?.skillLevel || 'any'} level in ${pod.requirements?.language || 'any'}", rank the top 5 students from the following list. Return a JSON array of objects with "userId" and "explanation".
  Students: ${JSON.stringify(students.map(s => ({ id: s._id, name: s.name, skills: s.skills, headline: s.headline })))}
  `;

  let parsed = [];
  try {
    const aiRes = await openai.chat.completions.create({
      model: env.openaiModel || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    const parsedData = JSON.parse(aiRes.choices[0].message.content);
    parsed = parsedData.candidates || parsedData.data || parsedData || [];
    if (!Array.isArray(parsed) && Array.isArray(Object.values(parsedData)[0])) {
      parsed = Object.values(parsedData)[0];
    }
  } catch (err) {
    console.error('AI Matching error:', err);
    parsed = students.slice(0, 5).map(s => ({ userId: s._id, explanation: 'Matched based on general profile availability.' }));
  }

  const recommendations = [];
  for (const match of parsed) {
    if (!match.userId) continue;
    const exp = await RecommendationExplanation.findOneAndUpdate(
      { userId: match.userId, mentorId: req.user._id },
      { explanationText: match.explanation },
      { upsert: true, new: true }
    );
    const userDoc = students.find(s => s._id.toString() === match.userId.toString());
    recommendations.push({ user: userDoc, explanation: exp.explanationText });
  }

  res.status(200).json({ success: true, candidates: recommendations });
});

export const createAssignment = asyncHandler(async (req, res) => {
  if (!req.body.milestoneId) {
    res.status(400);
    throw new Error('milestoneId is required for an assignment');
  }

  const assignment = await Assignment.create({
    podId: req.params.id,
    milestoneId: req.body.milestoneId,
    title: req.body.title,
    description: req.body.description,
    dueDate: req.body.dueDate,
    totalPoints: req.body.totalPoints
  });
  res.status(201).json({ success: true, assignment });
});

export const createMilestone = asyncHandler(async (req, res) => {
  const milestone = await PodMilestone.create({
    podId: req.params.id,
    title: req.body.title,
    description: req.body.description,
    weekNumber: req.body.weekNumber,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    resources: req.body.resources || []
  });
  res.status(201).json({ success: true, milestone });
});

export const getMilestones = asyncHandler(async (req, res) => {
  const milestones = await PodMilestone.find({ podId: req.params.id }).sort({ weekNumber: 1 });
  res.status(200).json({ success: true, milestones });
});

export const updateMilestone = asyncHandler(async (req, res) => {
  const milestone = await PodMilestone.findByIdAndUpdate(
    req.params.milestoneId,
    req.body,
    { new: true, runValidators: true }
  );
  if (!milestone) {
    res.status(404);
    throw new Error('Milestone not found');
  }
  res.status(200).json({ success: true, milestone });
});

export const deleteMilestone = asyncHandler(async (req, res) => {
  const milestone = await PodMilestone.findByIdAndDelete(req.params.milestoneId);
  if (!milestone) {
    res.status(404);
    throw new Error('Milestone not found');
  }
  res.status(200).json({ success: true, message: 'Milestone deleted' });
});

export const scheduleMeeting = asyncHandler(async (req, res) => {
  let scheduledAt = req.body.scheduledAt;
  if (!scheduledAt && req.body.date && req.body.time) {
    scheduledAt = new Date(`${req.body.date}T${req.body.time}`);
  }

  const podSession = await PodSession.create({
    mentorId: req.user._id,
    podId: req.params.id,
    title: req.body.title || 'Pod Meeting',
    description: req.body.description,
    scheduledAt: scheduledAt || new Date(),
    durationMinutes: req.body.duration || 60,
    meetingLink: req.body.meetingLink,
    status: 'scheduled'
  });
  res.status(201).json({ success: true, booking: podSession });
});

export const postAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await PodMessage.create({
    podId: req.params.id,
    senderId: req.user._id,
    content: req.body.content,
    type: 'ANNOUNCEMENT'
  });
  res.status(201).json({ success: true, announcement });
});
export const getStudentPods = asyncHandler(async (req, res) => {
  const memberships = await PodMember.find({ userId: req.user._id, status: 'ACTIVE' }).lean();
  const podIds = memberships.map(m => m.podId);
  const pods = await Pod.find({ _id: { $in: podIds } }).populate('mentorId', 'name username').lean();
  res.status(200).json({ success: true, pods });
});

export const getAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ podId: req.params.id }).lean();
  res.status(200).json({ success: true, assignments });
});

export const submitAssignment = asyncHandler(async (req, res) => {
  const assignment = await Assignment.findById(req.params.assignmentId);
  if (!assignment) {
    res.status(404);
    throw new Error('Assignment not found');
  }
  const submission = {
    userId: req.user._id,
    content: req.body.content,
    repoUrl: req.body.repoUrl,
    submittedAt: new Date()
  };
  assignment.submissions.push(submission);
  await assignment.save();
  res.status(200).json({ success: true, assignment });
});

export const assignGrade = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;
  const { userId, grade, feedback } = req.body;
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new AppError('Assignment not found', 404);

  const submission = assignment.submissions.find(s => s.userId.toString() === userId.toString());
  if (!submission) throw new AppError('Submission not found', 404);

  submission.grade = grade;
  submission.feedback = feedback;
  await assignment.save();

  await GamificationService.processAssignmentGrade(assignment.podId, userId, grade);
  res.status(200).json({ success: true, assignment });
});

export const joinSession = asyncHandler(async (req, res) => {
  const { id, sessionId } = req.params;
  const session = await PodSession.findById(sessionId);
  if (!session || session.podId.toString() !== id) throw new AppError('Session not found', 404);

  const existing = await Attendance.findOne({ podId: id, sessionId, userId: req.user._id });
  let attendance;
  if (existing) {
    existing.joinedAt = new Date();
    existing.status = 'PRESENT';
    await existing.save();
    attendance = existing;
  } else {
    attendance = await Attendance.create({
      podId: id,
      sessionId,
      userId: req.user._id,
      joinedAt: new Date(),
      status: 'PRESENT'
    });
    await GamificationService.processSessionAttendance(id, req.user._id);
  }

  res.status(200).json({ success: true, attendance });
});

export const leaveSession = asyncHandler(async (req, res) => {
  const { id, sessionId } = req.params;
  const attendance = await Attendance.findOne({ podId: id, sessionId, userId: req.user._id });
  if (!attendance) throw new AppError('Attendance not found', 404);

  attendance.leftAt = new Date();
  if (attendance.joinedAt) {
    const diffMins = Math.round((attendance.leftAt - attendance.joinedAt) / 60000);
    attendance.durationMinutes = (attendance.durationMinutes || 0) + diffMins;
  }
  await attendance.save();
  res.status(200).json({ success: true, attendance });
});

export const getAttendanceReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const attendance = await Attendance.find({ podId: id }).populate('userId', 'name username').populate('sessionId', 'title scheduledAt');
  res.status(200).json({ success: true, attendance });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const members = await PodMember.find({ podId: id, status: 'ACTIVE' })
    .populate('userId', 'name username profilePicture')
    .sort({ xp: -1 })
    .lean();
  res.status(200).json({ success: true, leaderboard: members });
});

export const leavePod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pod = await Pod.findById(id);
  if (!pod) throw new AppError('Pod not found', 404);

  const member = await PodMember.findOneAndUpdate(
    { podId: id, userId: req.user._id, status: 'ACTIVE' },
    { status: 'LEFT', leftAt: new Date() },
    { new: true }
  );

  if (!member) throw new AppError('Not an active member of this pod', 400);

  await Pod.updateOne({ _id: id }, { $inc: { activeMemberCount: -1 } });

  if (pod.groupId) {
    await Group.findByIdAndUpdate(pod.groupId, { $pull: { members: req.user._id } });
  }

  res.status(200).json({ success: true, message: 'Left pod successfully' });
});

export const getMentorDashboard = asyncHandler(async (req, res) => {
  const mentorId = req.user._id;

  const pods = await Pod.find({ mentorId }).lean();
  const podIds = pods.map(p => p._id);

  const activePods = pods.filter(p => p.status === 'ACTIVE').length;
  const totalPods = pods.length;

  const applications = await PodMember.countDocuments({ podId: { $in: podIds }, status: 'APPLIED' });
  const upcomingSessions = await PodSession.countDocuments({ mentorId, status: 'scheduled', scheduledAt: { $gte: new Date() } });
  const assignments = await Assignment.find({ podId: { $in: podIds } }).lean();
  let assignmentsAwaitingGrading = 0;
  for (const a of assignments) {
    assignmentsAwaitingGrading += a.submissions.filter(s => s.grade === undefined || s.grade === null).length;
  }

  res.status(200).json({
    success: true,
    dashboard: {
      activePods,
      totalPods,
      pendingApplications: applications,
      upcomingSessions,
      assignmentsAwaitingGrading,
      earnings: 0
    }
  });
});

