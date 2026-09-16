import Mentor from '../models/Mentor.js';
import MentorServiceModel from '../models/MentorService.js';
import Availability from '../models/Availability.js';
import Booking from '../models/Booking.js';
import AppError from '../utils/AppError.js';
class MentorBusinessService {
  _defaultWeeklySchedule() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return Object.fromEntries(days.map((d) => [d, { isAvailable: false, slots: [] }]));
  }
  _calculatePlatformFee(price) {
    return Math.round(price * 0.1);
  }
  async applyMentor(userId, profileData) {
    const existing = await Mentor.findOne({ user: userId });
    if (existing) throw new AppError('You have already applied to be a mentor.', 400);

    const mentor = new Mentor({ user: userId, ...profileData, status: 'pending' });
    await mentor.save();

    await new Availability({
      mentor: mentor._id,
      weeklySchedule: this._defaultWeeklySchedule(),
    }).save();

    return mentor;
  }

  async getMentorProfile(userId) {
    let mentor = await Mentor.findOne({ user: userId }).populate('user', 'name email profilePicture username');
    if (!mentor) {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(userId);
      if (user && (user.role === 'mentor' || user.role === 'MENTOR')) {
        mentor = new Mentor({ 
          user: userId, 
          status: 'approved',
          headline: 'Mentor',
          about: 'I am a mentor at ProConnect.',
          company: 'ProConnect',
          role: 'Mentor',
          yearsOfExperience: 0 
        });
        await mentor.save();
        await new Availability({
          mentor: mentor._id,
          weeklySchedule: this._defaultWeeklySchedule(),
        }).save();
        mentor = await Mentor.findOne({ user: userId }).populate('user', 'name email profilePicture username');
      } else {
        throw new AppError('Mentor profile not found.', 404);
      }
    }
    return mentor;
  }

  async updateMentorProfile(userId, updates) {
    const mentor = await Mentor.findOneAndUpdate(
      { user: userId },
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!mentor) throw new AppError('Mentor profile not found.', 404);
    return mentor;
  }

  async createService(userId, serviceData) {
    const mentor = await Mentor.findOne({ user: userId });
    if (!mentor) throw new AppError('Only mentors can create services.', 403);
    if (mentor.status !== 'approved') {
      throw new AppError('Your mentor profile must be approved to create services.', 403);
    }

    const service = new MentorServiceModel({ mentor: mentor._id, ...serviceData });
    await service.save();
    return service;
  }

  async updateService(serviceId, userId, updates) {
    const mentor = await Mentor.findOne({ user: userId });
    if (!mentor) throw new AppError('Mentor profile not found.', 404);

    const service = await MentorServiceModel.findOneAndUpdate(
      { _id: serviceId, mentor: mentor._id },
      { $set: updates },
      { new: true, runValidators: true },
    );
    if (!service) throw new AppError('Service not found or unauthorized.', 404);
    return service;
  }

  async deleteService(serviceId, userId) {
    const mentor = await Mentor.findOne({ user: userId });
    if (!mentor) throw new AppError('Mentor profile not found.', 404);

    const service = await MentorServiceModel.findOneAndDelete({ _id: serviceId, mentor: mentor._id });
    if (!service) throw new AppError('Service not found or unauthorized.', 404);
    return service;
  }

  async getMentorServices(mentorId) {
    return MentorServiceModel.find({ mentor: mentorId, isActive: true });
  }

  async updateAvailability(userId, availabilityData) {
    const mentor = await Mentor.findOne({ user: userId });
    if (!mentor) throw new AppError('Only mentors can update availability.', 403);

    return Availability.findOneAndUpdate(
      { mentor: mentor._id },
      { $set: availabilityData },
      { new: true, upsert: true },
    );
  }

  async getAvailability(mentorId) {
    const availability = await Availability.findOne({ mentor: mentorId });
    if (!availability) throw new AppError('Availability not found.', 404);
    return availability;
  }

  async getMentors({ search, skills, company, sort } = {}) {
    const activeServices = await MentorServiceModel.find({ isActive: true }).select('mentor');
    const mentorsWithServices = [...new Set(activeServices.map(s => s.mentor.toString()))];

    const query = { 
      status: 'approved',
      _id: { $in: mentorsWithServices }
    };

    if (search) {
      query.$or = [
        { headline: { $regex: search, $options: 'i' } },
        { about:    { $regex: search, $options: 'i' } },
        { company:  { $regex: search, $options: 'i' } },
      ];
    }
    if (skills)  query.skills  = { $in: skills.split(',') };
    if (company) query.company = { $regex: company, $options: 'i' };

    const sortOptions =
      sort === 'newest'       ? { createdAt: -1 }      :
      sort === 'highestRated' ? { averageRating: -1 }   :
                                { totalSessions: -1 };

    return Mentor.find(query)
      .populate('user', 'name profilePicture username')
      .sort(sortOptions)
      .limit(50);
  }

  async getMentorDetails(mentorId) {
    const mentor = await Mentor.findById(mentorId).populate('user', 'name profilePicture username email');
    if (!mentor) throw new AppError('Mentor not found.', 404);
    return mentor;
  }
  async getMentorDashboard(userId) {
    let mentor = await Mentor.findOne({ user: userId });
    if (!mentor) {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(userId);
      if (user && (user.role === 'mentor' || user.role === 'MENTOR')) {
        mentor = new Mentor({ 
          user: userId, 
          status: 'approved',
          headline: 'Mentor',
          about: 'I am a mentor at ProConnect.',
          company: 'ProConnect',
          role: 'Mentor',
          yearsOfExperience: 0 
        });
        await mentor.save();
        await new Availability({
          mentor: mentor._id,
          weeklySchedule: this._defaultWeeklySchedule(),
        }).save();
      } else {
        throw new AppError('Mentor profile not found.', 404);
      }
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [todaysBookings, upcomingBookings] = await Promise.all([
      Booking.find({
        mentor: mentor._id,
        date: { $gte: startOfDay, $lte: endOfDay },
        status: 'Confirmed',
      })
        .populate('user', 'name profilePicture')
        .populate('service', 'title'),

      Booking.find({
        mentor: mentor._id,
        date: { $gt: endOfDay },
        status: 'Confirmed',
      })
        .populate('user', 'name profilePicture')
        .populate('service', 'title')
        .limit(5)
        .sort({ date: 1, startTime: 1 }),
    ]);

    return {
      analytics: {
        totalEarnings: mentor.totalEarnings,
        totalSessions: mentor.totalSessions,
        averageRating: mentor.averageRating,
        totalReviews:  mentor.totalReviews,
      },
      todaysBookings,
      upcomingBookings,
    };
  }
}

export default new MentorBusinessService();
