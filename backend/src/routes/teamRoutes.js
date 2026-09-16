import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import { getLeaderRequests, acceptInterestRequest, rejectInterestRequest, transferLeadership, getTeamDetails, removeTeammate } from '../controllers/teamManagementController.js';
import { getTeamTeammateRequest, updateTeammateRequest } from '../controllers/teammateRequestController.js';

const router = express.Router();
router.use(protect);

router.get('/leader/requests', getLeaderRequests);
router.get('/:id', getTeamDetails);
router.post('/:id/remove-member', removeTeammate);
router.post('/:id/requests/:requestId/accept', acceptInterestRequest);
router.post('/:id/requests/:requestId/reject', rejectInterestRequest);
router.post('/:id/transfer-leadership', transferLeadership);
router.get('/:teamId/teammate-request', getTeamTeammateRequest);
router.patch('/:teamId/teammate-request', updateTeammateRequest);

export default router;

