import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import MentorBusinessService from '../services/MentorBusinessService.js';

export const applyMentor = asyncHandler(async (req, res, next) => {
  const mentor = await MentorBusinessService.applyMentor(req.user._id, req.body);
  res.status(201).json({
    message: 'Mentor application submitted successfully. Waiting for admin approval.',
    mentor,
  });
});

export const getMentorProfile = asyncHandler(async (req, res, next) => {
  const mentor = await MentorBusinessService.getMentorProfile(req.user._id);
  res.json({ mentor });
});

export const updateMentorProfile = asyncHandler(async (req, res, next) => {
  const mentor = await MentorBusinessService.updateMentorProfile(req.user._id, req.body);
  res.json({ message: 'Profile updated successfully', mentor });
});

export const addService = asyncHandler(async (req, res, next) => {
  const service = await MentorBusinessService.createService(req.user._id, req.body);
  res.status(201).json({ message: 'Service added successfully', service });
});

export const updateService = asyncHandler(async (req, res, next) => {
  const service = await MentorBusinessService.updateService(
    req.params.serviceId,
    req.user._id,
    req.body
  );
  res.json({ message: 'Service updated successfully', service });
});

export const deleteService = asyncHandler(async (req, res, next) => {
  await MentorBusinessService.deleteService(req.params.serviceId, req.user._id);
  res.json({ message: 'Service deleted successfully' });
});

export const getMentorServices = asyncHandler(async (req, res, next) => {
  const services = await MentorBusinessService.getMentorServices(req.params.id);
  res.json({ services });
});

export const setAvailability = asyncHandler(async (req, res, next) => {
  const availability = await MentorBusinessService.updateAvailability(req.user._id, req.body);
  res.json({ message: 'Availability updated successfully', availability });
});

export const getAvailability = asyncHandler(async (req, res, next) => {
  const mentorId = req.params.mentorId || req.user._id;
  const availability = await MentorBusinessService.getAvailability(mentorId);
  res.json({ availability });
});

export const getMentors = asyncHandler(async (req, res, next) => {
  const mentors = await MentorBusinessService.getMentors(req.query);
  res.json({ mentors });
});

export const getMentorDetails = asyncHandler(async (req, res, next) => {
  const mentor = await MentorBusinessService.getMentorDetails(req.params.id);
  res.json({ mentor });
});

export const getMentorDashboard = asyncHandler(async (req, res, next) => {
  const data = await MentorBusinessService.getMentorDashboard(req.user._id);
  res.json(data);
});
