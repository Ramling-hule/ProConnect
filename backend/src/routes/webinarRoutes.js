import express from 'express';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';
import {
  getWebinars,
  getWebinarById,
  createWebinar,
  registerForWebinar,
  getMyWebinars
} from '../controllers/webinarController.js';

const router = express.Router();

router.get('/', getWebinars);
router.post('/', authenticate, authorize('mentor', 'admin', 'MENTOR', 'ADMIN'), createWebinar);
router.get('/my', authenticate, getMyWebinars);
router.get('/:id', authenticate, getWebinarById);
router.post('/:id/register', authenticate, authorize('student', 'STUDENT'), registerForWebinar);

export default router;
