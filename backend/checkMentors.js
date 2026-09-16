import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Mentor from './src/models/Mentor.js';
import MentorBusinessService from './src/services/MentorBusinessService.js';

async function check() {
  await connectDB();
  const users = await User.find({ role: { $in: ['mentor', 'MENTOR'] } });
  console.log(`Found ${users.length} mentors`);
  for (const user of users) {
      console.log(`\nUser: ${user.name} (${user.email})`);
      const mentor = await Mentor.findOne({ user: user._id });
      if (mentor) {
          console.log(`  Has Mentor document: ${mentor._id}`);
      } else {
          console.log(`  No Mentor document!`);
          try {
             await MentorBusinessService.getMentorProfile(user._id);
             console.log(`  -> getMentorProfile succeeded!`);
          } catch(e) {
             console.error(`  -> getMentorProfile FAILED:`, e.message, e.stack);
          }
      }
  }
  process.exit(0);
}
check();
