import express from 'express';
import { protect, authorizeRole } from '../middlewares/authMiddleware.js';
import {
  adminListMentors,
  adminApproveMentor,
  adminRejectMentor,
  adminGetStats,
} from '../controllers/adminController.js';

const router = express.Router();
router.use(protect, authorizeRole('admin', 'ADMIN'));

router.get('/stats', adminGetStats);
router.get('/mentors', adminListMentors);
router.patch('/mentors/:id/approve', adminApproveMentor);
router.patch('/mentors/:id/reject', adminRejectMentor);

export default router;
