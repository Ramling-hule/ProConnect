import AppError from '../utils/AppError.js';
import Hackathon from '../models/Hackathon.js';
export const requireOrganizer = (req, res, next) => {
  if (!req.user.isOrganizer && req.user.role !== 'admin') {
    return next(new AppError('Only verified organizers can perform this action', 403));
  }
  next();
};
export const requireHackathonOwner = async (req, res, next) => {
  try {
    const hackathon = await Hackathon.findById(req.params.id);
    if (!hackathon) return next(new AppError('Hackathon not found', 404));

    if (hackathon.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError('Not authorized — you do not own this hackathon', 403));
    }

    req.hackathon = hackathon;
    next();
  } catch (err) {
    next(err);
  }
};
export const requireTeamCaptain = async (req, res, next) => {
  try {
    const HackathonTeam = (await import('../models/HackathonTeam.js')).default;
    const team = await HackathonTeam.findById(req.params.teamId);
    if (!team) return next(new AppError('Team not found', 404));

    if (team.captain.toString() !== req.user._id.toString()) {
      return next(new AppError('Only the team captain can perform this action', 403));
    }

    req.team = team;
    next();
  } catch (err) {
    next(err);
  }
};
