import Booking from '../models/Booking.js';
import MentorServiceModel from '../models/MentorService.js';
import Mentor from '../models/Mentor.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import CacheService from '../services/CacheService.js';
import crypto from 'crypto';

export const createBooking = asyncHandler(async (req, res, next) => {
  const { mentorId, serviceId, date, startTime, endTime, notes, topic, description, preferredOutcome, additionalInfo, attachments } = req.body;

  const service = await MentorServiceModel.findById(serviceId);
  if (!service) throw new AppError('Service not found', 404);
  
  const lockKey   = `booking_lock:${mentorId}:${date}:${startTime}`;
  const lockValue = crypto.randomUUID();
  const acquired  = await CacheService.acquireLock(lockKey, lockValue, 120);

  if (!acquired) {
    return next(new AppError(
      'This slot is currently being booked by someone else. Please try again or choose another slot.',
      409,
    ));
  }

  const session = await Booking.startSession();
  session.startTransaction();

  try {
    const existingBooking = await Booking.findOne({
      mentor: mentorId,
      date,
      startTime,
      status: { $in: ['Confirmed', 'Completed', 'Payment Pending', 'PENDING_PAYMENT', 'BOOKED'] },
    }).session(session);

    if (existingBooking) {
      throw new AppError('Slot already booked or pending payment', 409);
    }
    const abandonedBookings = await Booking.find({
      user: req.user._id,
      service: serviceId,
      status: { $in: ['Payment Pending', 'PENDING_PAYMENT'] }
    }).session(session);

    for (const abandoned of abandonedBookings) {
      abandoned.status = 'Cancelled';
      abandoned.cancellationReason = 'Abandoned checkout - replaced by new attempt';
      await abandoned.save({ session });
    }
    const duplicateUserBooking = await Booking.findOne({
      user: req.user._id,
      service: serviceId,
      date,
      startTime,
      status: { $in: ['Confirmed', 'BOOKED'] }
    }).session(session);

    if (duplicateUserBooking) {
        throw new AppError('You already have a confirmed booking for this exact slot.', 409);
    }

    const platformFee = Math.round(service.price * 0.1);

    const booking = new Booking({
      user: req.user._id,
      mentor: mentorId,
      service: serviceId,
      date,
      startTime,
      endTime,
      amount: service.price,
      platformFee,
      notes,
      topic: topic || "General Discussion",
      description: description || "No description provided.",
      preferredOutcome,
      additionalInfo,
      attachments,
      status: 'PENDING_PAYMENT',
    });

    await booking.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      message: 'Booking initialized. Complete payment to confirm.',
      booking,
      lockKey,
      lockValue,
    });
  } catch (error) {
    await session.abortTransaction();
    return next(error);
  } finally {
    session.endSession();
    await CacheService.releaseLock(lockKey);
  }
});

export const getUserBookings = asyncHandler(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('mentor', 'headline company')
    .populate('service', 'title')
    .sort({ date: 1 });
  res.json({ bookings });
});

export const getMentorBookings = asyncHandler(async (req, res, next) => {
  const mentor = await Mentor.findOne({ user: req.user._id });
  if (!mentor) throw new AppError();

  const bookings = await Booking.find({ mentor: mentor._id })
    .populate('user', 'name email profilePicture')
    .populate('service', 'title')
    .sort({ date: 1 });
  res.json({ bookings });
});

export const cancelBooking = asyncHandler(async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError();

  if (booking.user.toString() !== req.user._id.toString()) {
    throw new AppError();
  }

  booking.status = 'Cancelled';
  booking.cancellationReason = req.body.reason || 'User Cancelled';
  await booking.save();

  res.json({ message: 'Booking cancelled successfully' });
});
