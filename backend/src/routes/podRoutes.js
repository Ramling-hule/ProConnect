import express from 'express';
import { protect, authorizeRole } from '../middlewares/authMiddleware.js';
import { 
  listPods, getPodById, joinPod,
  createPod, adminListPods, assignStudent,
  getMentorPods, startPod, completePod, suggestMembers, createAssignment, scheduleMeeting, postAnnouncement, assignGrade, getMentorDashboard,
  getStudentPods, getAssignments, submitAssignment, joinSession, leaveSession, getAttendanceReport, getLeaderboard, leavePod,
  createMilestone, getMilestones, updateMilestone, deleteMilestone
} from '../controllers/podController.js';

import { requirePodMentor } from '../middlewares/podGuards.js';

const router = express.Router();
router.get('/', listPods);
router.get('/:id', getPodById);
router.post('/:id/join', protect, joinPod);
router.post('/admin/create', protect, authorizeRole('admin'), createPod);
router.get('/admin/all', protect, authorizeRole('admin'), adminListPods);
router.post('/admin/:id/assign', protect, authorizeRole('admin'), assignStudent);
router.get('/mentor/dashboard', protect, authorizeRole('mentor'), getMentorDashboard);
router.get('/mentor/my-pods', protect, getMentorPods);
router.post('/:id/start', protect, requirePodMentor, startPod);
router.post('/:id/complete', protect, requirePodMentor, completePod);
router.post('/:id/ai/suggest-members', protect, requirePodMentor, suggestMembers);
router.post('/:id/milestones', protect, requirePodMentor, createMilestone);
router.get('/:id/milestones', protect, getMilestones);
router.patch('/:id/milestones/:milestoneId', protect, requirePodMentor, updateMilestone);
router.delete('/:id/milestones/:milestoneId', protect, requirePodMentor, deleteMilestone);
router.post('/:id/assignments', protect, requirePodMentor, createAssignment);
router.post('/:id/assignments/:assignmentId/grade', protect, requirePodMentor, assignGrade);
router.post('/:id/meetings', protect, requirePodMentor, scheduleMeeting);
router.get('/:id/attendance', protect, requirePodMentor, getAttendanceReport);
router.post('/:id/announcements', protect, requirePodMentor, postAnnouncement);
router.get('/student/my-pods', protect, authorizeRole('student'), getStudentPods);
router.get('/:id/assignments', protect, getAssignments);
router.post('/:id/assignments/:assignmentId/submit', protect, submitAssignment);
router.post('/:id/sessions/:sessionId/join', protect, joinSession);
router.post('/:id/sessions/:sessionId/leave', protect, leaveSession);
router.get('/:id/leaderboard', protect, getLeaderboard);
router.post('/:id/leave', protect, leavePod);

export default router;
