import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import MentorBusinessService from './src/services/MentorBusinessService.js';
import User from './src/models/User.js';
import Mentor from './src/models/Mentor.js';

dotenv.config();

async function test() {
  await connectDB();
  const user = await User.findOne({ role: { $in: ['mentor', 'MENTOR'] } });
  
  if (!user) {
     console.log('No mentor user found');
     process.exit(0);
  }

  // Delete existing mentor profile if any to trigger auto-create
  await Mentor.deleteMany({ user: user._id });

  try {
     console.log('Testing getMentorProfile for user:', user._id);
     const profile = await MentorBusinessService.getMentorProfile(user._id);
     console.log('Profile created successfully:', profile);
  } catch (e) {
     console.error('Error in getMentorProfile:', e);
  }
  process.exit(0);
}

test();
