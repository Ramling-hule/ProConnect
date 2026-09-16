import Mentor     from '../models/Mentor.js';
import User       from '../models/User.js';
import Booking    from '../models/Booking.js';
import Post       from '../models/Post.js';
import Hackathon  from '../models/Hackathon.js';
import Pod        from '../models/Pod.js';
import Payment    from '../models/Payment.js';
import Review     from '../models/Review.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
export const adminListMentors = asyncHandler(async (req, res) => {
  const { status = 'pending' } = req.query;
  const query = status === 'all' ? {} : { status };

  const mentors = await Mentor.find(query)
    .populate('user', 'name username email profilePicture')
    .sort({ createdAt: -1 });

  res.json({ mentors });
});
export const adminApproveMentor = asyncHandler(async (req, res) => {
  const mentor = await Mentor.findById(req.params.id);
  if (!mentor) throw new AppError('Mentor not found', 404);

  mentor.status = 'approved';
  mentor.isApproved = true;
  await mentor.save();

  res.json({ message: 'Mentor approved successfully', mentor });
});
export const adminRejectMentor = asyncHandler(async (req, res) => {
  const mentor = await Mentor.findById(req.params.id);
  if (!mentor) throw new AppError('Mentor not found', 404);

  mentor.status = 'rejected';
  mentor.isApproved = false;
  await mentor.save();

  res.json({ message: 'Mentor rejected', mentor });
});
export const adminGetStats = asyncHandler(async (req, res) => {
  const now       = new Date();
  const startOfDay = new Date(now.setHours(0, 0, 0, 0));

  const [
    totalUsers,
    newUsersToday,
    pendingMentors,
    approvedMentors,
    rejectedMentors,
    totalBookings,
    totalPosts,
    totalHackathons,
    totalPods,
    totalReviews,
    recentMentors,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: startOfDay } }),
    Mentor.countDocuments({ status: 'pending' }),
    Mentor.countDocuments({ status: 'approved' }),
    Mentor.countDocuments({ status: 'rejected' }),
    Booking.countDocuments(),
    Post.countDocuments(),
    Hackathon.countDocuments(),
    Pod.countDocuments(),
    Review.countDocuments(),
    Mentor.find({ status: 'pending' })
      .populate('user', 'name username profilePicture')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    User.find()
      .select('name username profilePicture createdAt role')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  res.json({
    users:    { total: totalUsers, newToday: newUsersToday },
    mentors:  { pending: pendingMentors, approved: approvedMentors, rejected: rejectedMentors },
    bookings: { total: totalBookings },
    posts:    { total: totalPosts },
    hackathons:{ total: totalHackathons },
    pods:     { total: totalPods },
    reviews:  { total: totalReviews },
    recentMentors,
    recentUsers,
  });
});
