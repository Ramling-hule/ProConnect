import AppError from '../utils/AppError.js';
import HackathonTeam from '../models/HackathonTeam.js';
import Hackathon from '../models/Hackathon.js';
import Group from '../models/Group.js';
import User from '../models/User.js';
import HackathonRegistrationService from './HackathonRegistrationService.js';
import notificationManager from './notificationService.js';
import { nanoid } from '../utils/slugify.js';

class TeamChatRoomFactory {
  async create(teamName, hackathonTitle, captainId) {
    return Group.create({
      name:       `[Hackathon] ${teamName}`,
      description:`Team chat for "${hackathonTitle}"`,
      admins:     [captainId],
      members:    [captainId],
      privacy:    'private',
      inviteCode:  nanoid(),
    });
  }

  async addMember(groupId, userId) {
    if (!groupId) return;
    return Group.findByIdAndUpdate(groupId, { $addToSet: { members: userId } });
  }

  async removeMember(groupId, userId) {
    if (!groupId) return;
    return Group.findByIdAndUpdate(groupId, { $pull: { members: userId } });
  }

  async transferAdmin(groupId, fromUserId, toUserId) {
    if (!groupId) return;
    return Group.findByIdAndUpdate(groupId, {
      $addToSet: { admins: toUserId },
      $pull:     { admins: fromUserId },
    });
  }
}

const chatRoomFactory = new TeamChatRoomFactory();

class HackathonTeamService {

  async createTeam(hackathonId, captainId, { name, role, rolesNeeded, techStack }) {
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    if (new Date() > hackathon.timeline.registrationClose) {
      throw new AppError('Registration deadline has passed, cannot create team', 400);
    }

    const captainUser = await User.findById(captainId);
    if (!captainUser) throw new AppError('User not found', 404);
    HackathonRegistrationService._assertEligibility(hackathon, captainUser);

    const existingTeam = await HackathonTeam.findOne({
      hackathon:     hackathonId,
      'members.user': captainId,
    });
    if (existingTeam) throw new AppError('You are already in a team for this hackathon', 409);
    
    const group = await chatRoomFactory.create(name, hackathon.title, captainId);

    const team = await HackathonTeam.create({
      hackathon: hackathonId,
      name,
      captain:  captainId,
      members:  [{ user: captainId, role: role || 'Captain' }],
      rolesNeeded:          rolesNeeded || [],
      techStack:            techStack || [],
      isLookingForMembers:  Boolean(rolesNeeded?.length),
      groupId:              group._id,
    });

    return team;
  }

  async inviteMember(team, hackathon, captainId, inviteeId, io) {
    this._assertTeamNotLocked(team);

    if (team.members.length >= hackathon.maxTeamSize) {
      throw new AppError(`Team is full (max ${hackathon.maxTeamSize} members)`, 400);
    }

    const alreadyInvited = team.invitations.find(
      inv => inv.user.toString() === inviteeId.toString() && inv.status === 'pending'
    );
    if (alreadyInvited) throw new AppError('User already has a pending invitation to this team', 409);
    const pendingInvitesCount = await HackathonTeam.countDocuments({
      hackathon: hackathon._id,
      invitations: { $elemMatch: { user: inviteeId, status: 'pending' } }
    });
    if (pendingInvitesCount >= 5) {
      throw new AppError('This user has too many pending invitations across this hackathon', 429);
    }

    team.invitations.push({
      user:      inviteeId,
      status:    'pending',
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });
    await team.save();

    await notificationManager.notify({
      recipientId: inviteeId,
      senderId:    captainId,
      type:        'hackathon_invite',
      message:     `You've been invited to join team "${team.name}" for "${hackathon.title}"`,
      link:        `/hackathons/${hackathon.slug}/team/${team._id}`,
      relatedId:   team._id,
    }, io);

    return team;
  }

  async acceptInvite(teamId, userId, io) {
    const team = await HackathonTeam.findById(teamId).populate('hackathon');
    if (!team) throw new AppError('Team not found', 404);
    this._assertTeamNotLocked(team);

    const invite = this._findPendingInvite(team, userId);
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      throw new AppError('Invitation has expired', 400);
    }

    const hackathon = team.hackathon;

    const inAnotherTeam = await HackathonTeam.findOne({
      hackathon:     hackathon._id,
      'members.user': userId,
      _id:           { $ne: teamId },
    });
    if (inAnotherTeam) throw new AppError('You are already in another team for this hackathon', 409);
    const updatedTeam = await HackathonTeam.findOneAndUpdate(
      {
        _id: teamId,
        $expr: { $lt: [{ $size: "$members" }, hackathon.maxTeamSize] }
      },
      {
        $push: { members: { user: userId, role: '' } },
        $set: { "invitations.$[inv].status": "accepted" }
      },
      {
        arrayFilters: [{ "inv.user": userId, "inv.status": "pending" }],
        new: true
      }
    );

    if (!updatedTeam) {
      throw new AppError('Team is full or invitation is no longer valid', 400);
    }

    if (updatedTeam.members.length >= hackathon.maxTeamSize) {
      await HackathonTeam.updateOne({ _id: teamId }, { isLookingForMembers: false });
    }

    await chatRoomFactory.addMember(updatedTeam.groupId, userId);

    await notificationManager.notify({
      recipientId: updatedTeam.captain,
      senderId:    userId,
      type:        'team_joined',
      message:     `A member has joined your team "${updatedTeam.name}"`,
      link:        `/hackathons/${hackathon.slug}/team/${teamId}`,
      relatedId:   updatedTeam._id,
    }, io);

    return updatedTeam;
  }

  async rejectInvite(teamId, userId) {
    const team = await HackathonTeam.findById(teamId);
    if (!team) throw new AppError('Team not found', 404);

    const invite = this._findPendingInvite(team, userId);
    invite.status = 'rejected';
    await team.save();
    return { message: 'Invitation rejected' };
  }

  async leaveTeam(teamId, userId) {
    const team = await HackathonTeam.findById(teamId);
    if (!team) throw new AppError('Team not found', 404);
    this._assertTeamNotLocked(team);

    if (team.captain.toString() === userId.toString()) {
      throw new AppError('Captain cannot leave. Transfer captaincy first or disband the team.', 400);
    }

    const idx = team.members.findIndex(m => m.user.toString() === userId.toString());
    if (idx === -1) throw new AppError('You are not a member of this team', 400);

    team.members.splice(idx, 1);
    await chatRoomFactory.removeMember(team.groupId, userId);
    await team.save();
    return { message: 'Successfully left the team' };
  }

  async transferCaptain(teamId, currentCaptainId, newCaptainId) {
    const team = await HackathonTeam.findById(teamId);
    if (!team) throw new AppError('Team not found', 404);

    if (team.captain.toString() !== currentCaptainId.toString()) {
      throw new AppError('Only the current captain can transfer captaincy', 403);
    }

    const isMember = team.members.some(m => m.user.toString() === newCaptainId.toString());
    if (!isMember) throw new AppError('New captain must be a team member', 400);

    team.captain = newCaptainId;
    await chatRoomFactory.transferAdmin(team.groupId, currentCaptainId, newCaptainId);
    await team.save();
    return team;
  }

  async discoverTeams(hackathonId, { rolesNeeded, techStack, page = 1, limit = 20 } = {}) {
    const query = { hackathon: hackathonId, isLookingForMembers: true };
    if (rolesNeeded) query.rolesNeeded = { $in: [].concat(rolesNeeded) };
    if (techStack)   query.techStack   = { $in: [].concat(techStack) };

    return HackathonTeam.find(query)
      .populate('members.user', 'name profilePicture headline skills')
      .populate('captain',      'name profilePicture headline')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();
  }

  _assertTeamNotLocked(team) {
    if (team.isLocked) throw new AppError('Team is locked after deadline', 400);
  }

  _findPendingInvite(team, userId) {
    const invite = team.invitations.find(
      inv => inv.user.toString() === userId.toString() && inv.status === 'pending'
    );
    if (!invite) throw new AppError('No pending invitation found', 404);
    return invite;
  }
}

export default new HackathonTeamService();
