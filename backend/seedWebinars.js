import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Mentor from './src/models/Mentor.js';
import Webinar from './src/models/Webinar.js';
import connectDB from './src/config/db.js';

dotenv.config();

const seed = async () => {
  const connected = await connectDB();
  if (!connected) process.exit(1);

  const mentors = await Mentor.find({});
  console.log(`Found ${mentors.length} mentors.`);

  for (const mentor of mentors) {
    const existingWebinars = await Webinar.find({ mentor: mentor._id });
    if (existingWebinars.length === 0) {
      console.log(`Adding webinars for mentor ${mentor._id}...`);
      await Webinar.create([
        {
          title: 'How to crack technical interviews',
          description: 'Join me in this 1-hour session where I will walk you through the most common data structures and system design patterns needed to clear top tech interviews.',
          mentor: mentor._id,
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          time: '18:00',
          duration: 60,
          price: 0,
          maxAttendees: 100,
          status: 'Upcoming'
        },
        {
          title: 'Mastering System Design',
          description: 'A deep dive into building scalable systems, microservices, and handling high throughput for modern web apps.',
          mentor: mentor._id,
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          time: '19:00',
          duration: 90,
          price: 500,
          maxAttendees: 50,
          status: 'Upcoming'
        }
      ]);
    } else {
      console.log(`Mentor ${mentor._id} already has ${existingWebinars.length} webinars.`);
    }
  }

  console.log('Done seeding webinars!');
  process.exit(0);
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
