import Webinar from '../models/Webinar.js';
import WebinarRegistration from '../models/WebinarRegistration.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import Mentor from '../models/Mentor.js';

export const getWebinars = asyncHandler(async (req, res, next) => {
  const query = { status: { $in: ['Upcoming', 'Live'] } };
  if (req.query.mentorId) {
    query.mentor = req.query.mentorId;
  }
  const webinars = await Webinar.find(query)
    .populate('mentor', 'headline company')
    .sort({ date: 1 });
  res.json({ webinars });
});

export const getWebinarById = asyncHandler(async (req, res, next) => {
  const webinar = await Webinar.findById(req.params.id)
    .populate('mentor', 'headline company user');
  if (!webinar) throw new AppError('Webinar not found', 404);
  res.json({ webinar });
});

export const createWebinar = asyncHandler(async (req, res, next) => {
  const mentor = await Mentor.findOne({ user: req.user._id });
  if (!mentor) throw new AppError('Only mentors can create webinars', 403);

  const { title, description, date, time, duration, price, maxAttendees, coverImage } = req.body;

  const webinar = new Webinar({
    title,
    description,
    mentor: mentor._id,
    date,
    time,
    duration,
    price,
    maxAttendees,
    coverImage
  });

  await webinar.save();
  res.status(201).json({ message: 'Webinar created successfully', webinar });
});

export const registerForWebinar = asyncHandler(async (req, res, next) => {
  const webinar = await Webinar.findById(req.params.id);
  if (!webinar) throw new AppError('Webinar not found', 404);

  const session = await WebinarRegistration.startSession();
  session.startTransaction();

  try {
    const abandonedRegistrations = await WebinarRegistration.find({
      webinar: webinar._id,
      user: req.user._id,
      status: 'PENDING_PAYMENT'
    }).session(session);

    for (const abandoned of abandonedRegistrations) {
      abandoned.status = 'CANCELLED';
      await abandoned.save({ session });
    }

    const existingRegistration = await WebinarRegistration.findOne({
      webinar: webinar._id,
      user: req.user._id,
      status: { $in: ['REGISTERED', 'ATTENDED'] }
    }).session(session);

    if (existingRegistration) {
      throw new AppError('You are already registered for this webinar.', 409);
    }

    const { topic, description, preferredOutcome, additionalInfo, attachments } = req.body;

    const registration = new WebinarRegistration({
      webinar: webinar._id,
      user: req.user._id,
      topic,
      description,
      preferredOutcome,
      additionalInfo,
      attachments,
      status: webinar.price > 0 ? 'PENDING_PAYMENT' : 'REGISTERED'
    });

    await registration.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      message: webinar.price > 0 ? 'Registration initialized. Complete payment to confirm.' : 'Registered successfully.',
      registration
    });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
  }
});

export const getMyWebinars = asyncHandler(async (req, res, next) => {
  const registrations = await WebinarRegistration.find({ user: req.user._id })
    .populate({
      path: 'webinar',
      populate: { path: 'mentor', select: 'headline company' }
    })
    .sort({ createdAt: -1 });
  res.json({ registrations });
});
