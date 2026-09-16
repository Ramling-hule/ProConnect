import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Mentor from './src/models/Mentor.js';
import MentorService from './src/models/MentorService.js';
import connectDB from './src/config/db.js';

dotenv.config();

const seed = async () => {
  const connected = await connectDB();
  if (!connected) process.exit(1);

  const mentors = await Mentor.find({});
  console.log(`Found ${mentors.length} mentors.`);

  for (const mentor of mentors) {
    const existingServices = await MentorService.find({ mentor: mentor._id });
    if (existingServices.length === 0) {
      console.log(`Adding services for mentor ${mentor._id}...`);
      await MentorService.create([
        {
          mentor: mentor._id,
          title: '1-on-1 Mentorship',
          description: 'A 30-minute career guidance session where we can discuss your goals and strategies.',
          duration: 30,
          price: 500,
          currency: 'INR',
          isActive: true
        },
        {
          mentor: mentor._id,
          title: 'Resume Review',
          description: 'Detailed resume feedback to help you stand out to recruiters and hiring managers.',
          duration: 45,
          price: 800,
          currency: 'INR',
          isActive: true
        }
      ]);
    } else {
      console.log(`Mentor ${mentor._id} already has ${existingServices.length} services.`);
    }
  }

  console.log('Done seeding services!');
  process.exit(0);
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
