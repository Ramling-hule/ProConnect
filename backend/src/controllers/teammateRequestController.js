import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import TeammateRequest from '../models/TeammateRequest.js';
import InterestRequest from '../models/InterestRequest.js';
import HackathonTeam from '../models/HackathonTeam.js';
import Notification from '../models/Notification.js';
import HackathonTeammateMatchingService from '../services/HackathonTeammateMatchingService.js';

export const createTeammateRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description, requiredSkills, preferredYear, preferredBranch, preferredCodingExperience, requiredTechnologies, seatsAvailable } = req.body;

  const team = await HackathonTeam.findOne({ hackathon: id, 'members.user': req.user._id });
  const existingRequest = await TeammateRequest.findOne({ hackathon: id, creator: req.user._id, status: 'active' });
  if (existingRequest) {
    throw new AppError('You already have an active teammate request for this hackathon. Please edit or close it first.', 400);
  }

  const request = await TeammateRequest.create({
    hackathon: id,
    team: team ? team._id : null,
    creator: req.user._id,
    description,
    requiredSkills,
    preferredYear,
    preferredBranch,
    preferredCodingExperience,
    requiredTechnologies,
    seatsAvailable,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  res.status(201).json({ success: true, request });
});

export const getTeammateRequests = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { skills, branch, year } = req.query;

  let query = { hackathon: id, status: 'active' };

  if (skills) query.requiredSkills = { $in: skills.split(',') };
  if (branch) query.preferredBranch = branch;
  if (year) query.preferredYear = year;

  const requests = await TeammateRequest.find(query)
    .populate('creator', 'name username profilePicture headline skills')
    .populate('team', 'name description maxMembers')
    .sort('-createdAt');

  res.json({ success: true, requests });
});

export const getGlobalTeammateRequests = asyncHandler(async (req, res) => {
  const requests = await TeammateRequest.find({ status: 'active' })
    .populate('creator', 'name username profilePicture headline skills')
    .populate('team', 'name description maxMembers membersCount members techStack rolesNeeded')
    .populate('hackathon', 'title slug logo startDate endDate')
    .sort('-createdAt');

  res.json({ success: true, requests });
});

export const expressInterest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const teammateRequest = await TeammateRequest.findById(id).populate('creator');
  if (!teammateRequest) throw new AppError('Request not found', 404);
  if (teammateRequest.status !== 'active') {
    throw new AppError('This teammate request is no longer accepting interest', 400);
  }

  const existingTeam = await HackathonTeam.findOne({ hackathon: teammateRequest.hackathon, 'members.user': req.user._id });
  if (existingTeam) throw new AppError('You are already in a team for this hackathon', 400);

  if (teammateRequest.creator._id.toString() === req.user._id.toString()) {
    throw new AppError('You cannot express interest in your own request', 400);
  }

  const existingInterest = await InterestRequest.findOne({ teammateRequest: id, user: req.user._id });
  if (existingInterest) throw new AppError('Already expressed interest', 400);
  const claimed = await TeammateRequest.findOneAndUpdate(
    { _id: id, status: 'active', seatsAvailable: { $gte: 1 } },
    { $inc: { seatsAvailable: -1 } },
    { new: true }
  );

  if (!claimed) {
    throw new AppError('No seats available in this teammate request', 400);
  }
  if (claimed.seatsAvailable === 0) {
    await TeammateRequest.updateOne({ _id: id }, { status: 'closed' });
  }

  let interest;
  try {
    interest = await InterestRequest.create({
      teammateRequest: id,
      hackathon: teammateRequest.hackathon,
      team: teammateRequest.team,
      user: req.user._id,
      message: req.body.message || ''
    });
  } catch (err) {
    await TeammateRequest.findOneAndUpdate({ _id: id }, { $inc: { seatsAvailable: 1 }, status: 'active' });
    throw err;
  }

  await Notification.create({
    recipient: teammateRequest.creator._id,
    sender: req.user._id,
    type: 'INTEREST_RECEIVED',
    message: 'is interested in joining your team',
    link: `/hackathons/${teammateRequest.hackathon}/team`,
    relatedId: teammateRequest.hackathon
  });

  if (req.app.get('io')) {
    req.app.get('io').to(teammateRequest.creator._id.toString()).emit('new_notification', { type: 'INTEREST_RECEIVED' });
  }

  res.status(201).json({ success: true, interest });
});

export const searchTeammates = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { skills, role, branch, year, excludeTeamed = 'true', page = 1, limit = 20 } = req.query;
  
  const results = await HackathonTeammateMatchingService.searchTeammates(
    id,
    req.user._id,
    { 
      skills: skills || '', 
      role, 
      branch, 
      year, 
      excludeTeamed: excludeTeamed === 'true', 
      page: parseInt(page), 
      limit: parseInt(limit) 
    }
  );

  res.json({ success: true, ...results });
});

export const getTeamTeammateRequest = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const request = await TeammateRequest.findOne({ team: teamId });
  res.json({ success: true, request });
});

export const updateTeammateRequest = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { description, requiredSkills, preferredYear, preferredBranch, preferredCodingExperience, requiredTechnologies, seatsAvailable, status } = req.body;

  const request = await TeammateRequest.findOne({ team: teamId });
  if (!request) {
    throw new AppError('No teammate request found for this team', 404);
  }

  if (request.creator.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this request', 403);
  }

  request.description = description !== undefined ? description : request.description;
  request.requiredSkills = requiredSkills !== undefined ? requiredSkills : request.requiredSkills;
  request.preferredYear = preferredYear !== undefined ? preferredYear : request.preferredYear;
  request.preferredBranch = preferredBranch !== undefined ? preferredBranch : request.preferredBranch;
  request.preferredCodingExperience = preferredCodingExperience !== undefined ? preferredCodingExperience : request.preferredCodingExperience;
  request.requiredTechnologies = requiredTechnologies !== undefined ? requiredTechnologies : request.requiredTechnologies;
  request.seatsAvailable = seatsAvailable !== undefined ? seatsAvailable : request.seatsAvailable;
  request.status = status !== undefined ? status : request.status;

  await request.save();

  res.json({ success: true, request });
});
