import authRoutes from './authRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import groupRoutes from './groupRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import messageRoutes from './messageRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import careerRoutes from './careerRoutes.js';
import mentorRoutes from './mentorRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import hackathonRoutes from './hackathonRoutes.js';
import publicRoutes from './publicRoutes.js';
import podRoutes from './podRoutes.js';
import teamRoutes from './teamRoutes.js';
import webinarRoutes from './webinarRoutes.js';
import adminRoutes from './adminRoutes.js';

const routes = [
  ['/api/public', publicRoutes],
  ['/api/auth', authRoutes],
  ['/api/dashboard', dashboardRoutes],
  ['/api/groups', groupRoutes],
  ['/api/notifications', notificationRoutes],
  ['/api/messages', messageRoutes],
  ['/api/upload', uploadRoutes],
  ['/api/career', careerRoutes],
  ['/api/mentor', mentorRoutes],
  ['/api/booking', bookingRoutes],
  ['/api/payment', paymentRoutes],
  ['/api/review', reviewRoutes],
  ['/api/hackathons', hackathonRoutes],
  ['/api/pods', podRoutes],
  ['/api/teams', teamRoutes],
  ['/api/webinars', webinarRoutes],
  ['/api/admin', adminRoutes],
];

export const registerRoutes = (app) => {
  routes.forEach(([path, router]) => app.use(path, router));
};
