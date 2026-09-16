import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  requireOrganizer,
  requireHackathonOwner,
  requireTeamCaptain,
} from '../middlewares/hackathonGuards.js';
import { apiLimiter } from '../middlewares/rateLimiter.js';
import {
  listHackathons, getHackathon,
  createHackathon, updateHackathon, deleteHackathon,
  registerIndividual, cancelRegistration, approveRegistration, rejectRegistration, checkInRegistration,
  createTeam, inviteMember, acceptInvite, rejectInvite,
  leaveTeam, transferCaptain, discoverTeams,
  upsertSubmission, getSubmission, getLeaderboard,
  createPaymentOrder, verifyPayment,
  getAiTeamSuggestions, getSkillGapAnalysis, getProjectIdeas,
  getTeamBalanceAnalysis, getSubmissionChecklist,
  createTeammateRequest,
  getTeammateRequests,
  getGlobalTeammateRequests,
  expressInterest,
  searchTeammates,
  getOrganizerDashboard,
  exportRegistrationsCSV,
  bulkUpdateStatus,
  createTeamPaymentOrder,
  verifyTeamPayment,
  assignJudges,
  scoreTeam,
  finalizeResults,
  generateCertificates,
} from '../controllers/hackathonController.js';

const router = express.Router();
router.get('/',                listHackathons);
router.get('/teammate-requests/all', getGlobalTeammateRequests);
router.get('/:slug',           getHackathon);
router.get('/:id/leaderboard', getLeaderboard);
router.use(protect);
router.post('/',           requireOrganizer,                     createHackathon);
router.patch('/:id',       requireHackathonOwner,               updateHackathon);
router.delete('/:id',      requireHackathonOwner,               deleteHackathon);
router.get('/:id/registrations/export', requireHackathonOwner, exportRegistrationsCSV);
router.patch('/:id/registrations/bulk', requireHackathonOwner, bulkUpdateStatus);
router.patch('/:id/registrations/:registrationId/approve', requireHackathonOwner, approveRegistration);
router.patch('/:id/registrations/:registrationId/reject', requireHackathonOwner, rejectRegistration);
router.post('/:id/registrations/:registrationId/checkin', checkInRegistration);
router.post('/:id/register',                    apiLimiter, registerIndividual);
router.delete('/registrations/:registrationId', cancelRegistration);
router.post('/:id/teams',                             apiLimiter, createTeam);
router.get('/:id/teams/discover',                     discoverTeams);
router.post('/:id/teammate-requests',                 apiLimiter, createTeammateRequest);
router.get('/:id/teammate-requests',                  getTeammateRequests);
router.get('/:id/teammates/search',                   searchTeammates);
router.post('/teammate-requests/:id/interest',        apiLimiter, expressInterest);
router.post('/:id/teams/:teamId/invite',  requireTeamCaptain, apiLimiter, inviteMember);
router.post('/:id/teams/:teamId/accept',              apiLimiter, acceptInvite);
router.post('/:id/teams/:teamId/reject',              rejectInvite);
router.post('/:id/teams/:teamId/leave',               leaveTeam);
router.patch('/:id/teams/:teamId/captain',            transferCaptain);
router.post('/:id/teams/:teamId/payment/create', requireTeamCaptain, createTeamPaymentOrder);
router.post('/:id/teams/:teamId/payment/verify', verifyTeamPayment);
router.post('/:id/teams/:teamId/submission',  upsertSubmission);
router.get('/:id/teams/:teamId/submission',   getSubmission);
router.post('/:id/judges', requireHackathonOwner, assignJudges);
router.post('/:id/teams/:teamId/score', scoreTeam);
router.post('/:id/finalize-results', requireHackathonOwner, finalizeResults);
router.post('/:id/certificates/generate', requireHackathonOwner, generateCertificates);
router.post('/payment/create',  createPaymentOrder);
router.post('/payment/verify',  verifyPayment);
router.get('/:id/ai/team-suggestions',              getAiTeamSuggestions);
router.get('/:id/ai/submission-checklist',          getSubmissionChecklist);
router.get('/:id/teams/:teamId/ai/skill-gap',       getSkillGapAnalysis);
router.get('/:id/teams/:teamId/ai/team-balance',    getTeamBalanceAnalysis);
router.post('/:id/ai/project-ideas',                getProjectIdeas);
router.get('/:id/dashboard', getOrganizerDashboard);

export default router;
