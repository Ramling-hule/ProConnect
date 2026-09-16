import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Mentor from "../models/Mentor.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createReview = asyncHandler(async (req, res, next) => {
  const { mentorId, bookingId, rating, reviewText, comment, isAnonymous } = req.body;

  const actualComment = comment || reviewText;
  const actualMentorId = mentorId;

  if (!actualMentorId || !rating || !actualComment) {
    return next(new AppError('Mentor ID, rating, and review text are required.', 400));
  }
  const booking = await Booking.findOne({
    user: req.user._id,
    mentor: actualMentorId,
    status: 'Completed'
  });

  if (!booking) {
    return next(new AppError('You can only leave a review if you have a completed session with this mentor.', 403));
  }

  const existingReview = await Review.findOne({ booking: booking._id });
  if (existingReview) {
    return next(new AppError('You have already left a review for your session.', 409));
  }

  const review = new Review({
    user: req.user._id,
    mentor: actualMentorId,
    booking: booking._id,
    rating,
    reviewText: actualComment,
    isAnonymous
  });

  await review.save();
  const mentor = await Mentor.findById(booking.mentor);
  const totalReviews = mentor.totalReviews + 1;
  const averageRating = ((mentor.averageRating * mentor.totalReviews) + rating) / totalReviews;
  
  mentor.totalReviews = totalReviews;
  mentor.averageRating = averageRating;
  await mentor.save();

  res.status(201).json({ review });
});

export const getMentorReviews = asyncHandler(async (req, res, next) => {
  const reviews = await Review.find({ mentor: req.params.mentorId })
    .populate("user", "name profilePicture")
    .sort({ createdAt: -1 });
  res.json({ reviews });
});
