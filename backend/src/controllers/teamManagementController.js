import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import InterestRequest from '../models/InterestRequest.js';
import HackathonTeam from '../models/HackathonTeam.js';
import Notification from '../models/Notification.js';
import Connection from '../models/Connection.js';
import TeammateRequest from '../models/TeammateRequest.js';

export const getLeaderRequests = asyncHandler(async (req, res) => {
  const teams = await HackathonTeam.find({ captain: req.user._id });
  const teamIds = teams.map(t => t._id);

  const requests = await InterestRequest.find({ team: { $in: teamIds }, status: 'pending' })
    .populate('user', 'name username profilePicture headline skills codingProfiles achievements portfolio techStack')
    .populate('teammateRequest', 'description seatsAvailable')
    .populate('hackathon', 'title slug');

  res.json({ success: true, requests });
});

export const acceptInterestRequest = asyncHandler(async (req, res) => {
  const { id, requestId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const interest = await InterestRequest.findById(requestId).session(session);
    if (!interest) throw new AppError('Request not found', 404);
    if (interest.status !== 'pending') throw new AppError('Request already processed', 400);
    const existingTeam = await HackathonTeam.findOne({ hackathon: interest.hackathon, 'members.user': interest.user }).session(session);
    if (existingTeam) throw new AppError('User is already in a team for this hackathon', 400);

    const team = await HackathonTeam.findOneAndUpdate(
      {
        _id: id,
        captain: req.user._id,
        $expr: { $lt: [{ $size: "$members" }, "$maxMembers"] }
      },
      {
        $push: { members: { user: interest.user, role: 'Member', joinedAt: new Date() } }
      },
      { session, new: true }
    );

    if (!team) {
      const checkTeam = await HackathonTeam.findById(id).session(session);
      if (!checkTeam) throw new AppError('Team not found', 404);
      if (checkTeam.captain.toString() !== req.user._id.toString()) throw new AppError('Only the captain can accept requests', 403);
      throw new AppError('Team is already full', 400);
    }
    interest.status = 'accepted';
    await interest.save({ session });
    await InterestRequest.updateMany(
      { hackathon: team.hackathon, user: interest.user, status: 'pending', _id: { $ne: interest._id } },
      { $set: { status: 'rejected' } },
      { session }
    );
    const existingConnection = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: interest.user },
        { requester: interest.user, recipient: req.user._id }
      ]
    }).session(session);

    if (!existingConnection) {
      await Connection.create([{
        requester: req.user._id,
        recipient: interest.user,
        status: 'accepted'
      }], { session });
    } else if (existingConnection.status !== 'accepted') {
      existingConnection.status = 'accepted';
      await existingConnection.save({ session });
    }
    await Notification.create([{
      recipient: interest.user,
      sender: req.user._id,
      type: 'REQUEST_ACCEPTED',
      message: `accepted your request to join ${team.name}`,
      link: `/teams/${team._id}`,
      relatedId: team._id
    }], { session });

    if (req.app.get('io')) {
      req.app.get('io').to(interest.user.toString()).emit('new_notification', { type: 'REQUEST_ACCEPTED' });
    }

    await session.commitTransaction();
    res.json({ success: true, message: 'Request accepted, user added to team' });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

export const rejectInterestRequest = asyncHandler(async (req, res) => {
  const { id, requestId } = req.params;
  const interest = await InterestRequest.findById(requestId);
  if (!interest) throw new AppError('Request not found', 404);

  const team = await HackathonTeam.findById(id);
  if (!team || team.captain.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized', 403);
  }

  interest.status = 'rejected';
  await interest.save();
  await Notification.create({
    recipient: interest.user,
    sender: req.user._id,
    type: 'REQUEST_REJECTED',
    message: `declined your request to join ${team.name}`,
    link: `/hackathons/${team.hackathon}/find-teammates`,
    relatedId: team.hackathon
  });

  if (req.app.get('io')) {
    req.app.get('io').to(interest.user.toString()).emit('new_notification', { type: 'REQUEST_REJECTED' });
  }

  res.json({ success: true, message: 'Request rejected' });
});

export const transferLeadership = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newLeaderId } = req.body;

  const team = await HackathonTeam.findById(id);
  if (!team) throw new AppError('Team not found', 404);
  if (team.captain.toString() !== req.user._id.toString()) throw new AppError('Only the captain can transfer leadership', 403);

  const isMember = team.members.some(m => m.user.toString() === newLeaderId);
  if (!isMember) throw new AppError('New leader must be an existing team member', 400);

  team.captain = newLeaderId;
  await team.save();

  await Notification.create({
    recipient: newLeaderId,
    sender: req.user._id,
    type: 'LEADER_CHANGED',
    message: `transferred leadership of ${team.name} to you`,
    link: `/teams/${team._id}`,
    relatedId: team._id
  });

  if (req.app.get('io')) {
    req.app.get('io').to(newLeaderId).emit('new_notification', { type: 'LEADER_CHANGED' });
  }

  res.json({ success: true, message: 'Leadership transferred successfully' });
});

export const getTeamDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const team = await HackathonTeam.findById(id)
    .populate('members.user', 'name username profilePicture headline skills')
    .populate('captain', 'name username profilePicture')
    .populate('hackathon', 'title slug logo');

  if (!team) {
    throw new AppError('Team not found', 404);
  }
  const isMember = team.members.some(m => m.user._id.toString() === req.user._id.toString());
  if (!isMember) {
    throw new AppError('Not authorized to view this team', 403);
  }

  res.json({ success: true, team });
});

export const removeTeammate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { memberId, reason } = req.body;

  if (!reason || reason.trim() === '') {
    throw new AppError('Reason is required for removing a teammate', 400);
  }

  const team = await HackathonTeam.findById(id);
  if (!team) throw new AppError('Team not found', 404);
  if (team.captain.toString() !== req.user._id.toString()) {
    throw new AppError('Only the captain can remove members', 403);
  }
  if (memberId === req.user._id.toString()) {
    throw new AppError('You cannot remove yourself. Transfer leadership first.', 400);
  }

  const memberExists = team.members.find(m => m.user.toString() === memberId);
  if (!memberExists) {
    throw new AppError('User is not a member of this team', 404);
  }
  team.members = team.members.filter(m => m.user.toString() !== memberId);
  await team.save();
  await Notification.create({
    recipient: memberId,
    sender: req.user._id,
    type: 'TEAMMATE_REMOVED',
    message: `removed you from team ${team.name}. Reason: ${reason}`,
    link: `/hackathons/${team.hackathon}/find-teammates`,
    relatedId: team.hackathon
  });

  if (req.app.get('io')) {
    req.app.get('io').to(memberId).emit('new_notification', { type: 'TEAMMATE_REMOVED' });
  }

  res.json({ success: true, message: 'Member removed successfully' });
});
