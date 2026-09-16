import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Mentor from './src/models/Mentor.js';
import Booking from './src/models/Booking.js';
import Review from './src/models/Review.js';
import MentorService from './src/models/MentorService.js';
import connectDB from './src/config/db.js';

dotenv.config();

const seed = async () => {
  try {
    await connectDB();
    console.log('Connected to DB...');

    const username = 'user_divya_18';
    
    // Find the mentor
    const mentorUser = await User.findOne({ username });
    if (!mentorUser) {
      console.log(`User ${username} not found.`);
      process.exit(1);
    }

    const mentor = await Mentor.findOne({ user: mentorUser._id });
    if (!mentor) {
      console.log(`Mentor profile for ${username} not found.`);
      process.exit(1);
    }

    // Find a service to attach to bookings, or just pick the first one
    const service = await MentorService.findOne({ mentor: mentor._id });
    
    // Find some other users to be reviewers (max 5)
    const reviewers = await User.find({ _id: { $ne: mentorUser._id } }).limit(5);

    if (reviewers.length === 0) {
      console.log('No other users found to act as reviewers.');
      process.exit(1);
    }

    const reviewsData = [
      { rating: 5, text: "Divya is an amazing mentor! She completely clarified my doubts about system design." },
      { rating: 4, text: "Very helpful session. She gave me actionable feedback on my resume." },
      { rating: 5, text: "Exceeded my expectations. We went deep into react performance optimization." },
      { rating: 5, text: "Great guidance for my career transition. Highly recommended!" },
      { rating: 4, text: "Solid advice. Would definitely book another session in the future." }
    ];

    let totalRating = 0;
    let reviewCount = 0;

    for (let i = 0; i < reviewers.length; i++) {
      const user = reviewers[i];
      const rData = reviewsData[i % reviewsData.length];

      // Check if review already exists
      const existing = await Review.findOne({ mentor: mentor._id, user: user._id });
      if (existing) {
        console.log(`Review by ${user.name} already exists.`);
        continue;
      }

      // Create a dummy completed booking
      const booking = new Booking({
        user: user._id,
        mentor: mentor._id,
        service: service ? service._id : new mongoose.Types.ObjectId(),
        date: new Date().toISOString().split('T')[0],
        startTime: "10:00",
        endTime: "11:00",
        amount: 500,
        status: 'Completed'
      });
      await booking.save();

      // Create the review
      const review = new Review({
        user: user._id,
        mentor: mentor._id,
        booking: booking._id,
        rating: rData.rating,
        reviewText: rData.text,
        isAnonymous: i % 2 === 0
      });
      await review.save();

      totalRating += rData.rating;
      reviewCount++;
      console.log(`Created review by ${user.name}`);
    }

    if (reviewCount > 0) {
      const newTotalReviews = mentor.totalReviews + reviewCount;
      const newAverage = ((mentor.averageRating * mentor.totalReviews) + totalRating) / newTotalReviews;
      mentor.totalReviews = newTotalReviews;
      mentor.averageRating = newAverage;
      await mentor.save();
      console.log(`Updated mentor stats. Total Reviews: ${newTotalReviews}, Avg: ${newAverage.toFixed(1)}`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
