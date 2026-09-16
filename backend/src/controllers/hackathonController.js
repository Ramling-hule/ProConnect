import { asyncHandler } from '../middlewares/asyncHandler.js';
import HackathonService from '../services/HackathonService.js';
import HackathonRegistrationService from '../services/HackathonRegistrationService.js';
import HackathonTeamService from '../services/HackathonTeamService.js';
import HackathonSubmissionService from '../services/HackathonSubmissionService.js';
import HackathonAiService from '../services/HackathonAiService.js';
import HackathonAnalyticsService from '../services/HackathonAnalyticsService.js';
import PaymentService from '../services/PaymentService.js';

export const listHackathons = asyncHandler(async (req, res) => {
  const data = await HackathonService.listHackathons(req.query);
  res.json({ success: true, ...data });
});

export const getHackathon = asyncHandler(async (req, res) => {
  const hackathon = await HackathonService.getBySlug(req.params.slug);
  res.json({ success: true, hackathon });
});

export const createHackathon = asyncHandler(async (req, res) => {
  const hackathon = await HackathonService.create(req.user._id, req.body);
  res.status(201).json({ success: true, hackathon });
});

export const updateHackathon = asyncHandler(async (req, res) => {
  const hackathon = await HackathonService.update(
    req.params.id, req.user._id, { ...req.body, _hackathon: req.hackathon }
  );
  res.json({ success: true, hackathon });
});

export const deleteHackathon = asyncHandler(async (req, res) => {
  await HackathonService.softDelete(req.hackathon);
  res.json({ success: true, message: 'Hackathon cancelled successfully' });
});

export const registerIndividual = asyncHandler(async (req, res) => {
  const registration = await HackathonRegistrationService.registerIndividual(
    req.params.id, req.user._id, req.app.get('io'),
  );
  res.status(201).json({ success: true, registration });
});

export const cancelRegistration = asyncHandler(async (req, res) => {
  const reg = await HackathonRegistrationService.cancelRegistration(
    req.params.registrationId, req.user._id,
  );
  res.json({ success: true, registration: reg });
});

export const approveRegistration = asyncHandler(async (req, res) => {
  const reg = await HackathonRegistrationService.approveRegistration(
    req.params.registrationId, req.user._id, req.app.get('io')
  );
  res.json({ success: true, registration: reg });
});

export const rejectRegistration = asyncHandler(async (req, res) => {
  const reg = await HackathonRegistrationService.rejectRegistration(
    req.params.registrationId, req.user._id, req.body.reason, req.app.get('io')
  );
  res.json({ success: true, registration: reg });
});

export const checkInRegistration = asyncHandler(async (req, res) => {
  const reg = await HackathonRegistrationService.checkIn(
    req.params.registrationId, req.user._id
  );
  res.json({ success: true, registration: reg });
});

export const assignJudges = asyncHandler(async (req, res) => {
  const hackathon = await HackathonService.assignJudges(
    req.params.id, req.user._id, req.body.judges
  );
  res.json({ success: true, hackathon });
});

export const scoreTeam = asyncHandler(async (req, res) => {
  const submission = await HackathonSubmissionService.scoreSubmission(
    req.params.id, req.params.teamId, req.user._id, req.body
  );
  res.json({ success: true, submission });
});

export const finalizeResults = asyncHandler(async (req, res) => {
  const result = await HackathonSubmissionService.finalizeResults(
    req.params.id, req.user._id, req.app.get('io')
  );
  res.json(result);
});

export const generateCertificates = asyncHandler(async (req, res) => {
  const hackathon = await HackathonService.getBySlug(req.hackathon?.slug) || req.hackathon;
  if (!hackathon) return res.status(404).json({ success: false, message: 'Hackathon not found' });
  if (hackathon.organizer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Only the organizer can generate certificates' });
  }
  
  if (hackathon.status !== 'completed') {
    return res.status(400).json({ success: false, message: 'Hackathon must be completed to generate certificates' });
  }
  const CertificateWorker = (await import('../workers/certificateWorker.js')).default;
  CertificateWorker.processCertificates(hackathon._id, req.app.get('io')).catch(console.error);

  res.status(202).json({ success: true, message: 'Certificate generation queued and is processing in the background' });
});

export const createTeam = asyncHandler(async (req, res) => {
  const team = await HackathonTeamService.createTeam(
    req.params.id, req.user._id, req.body,
  );
  res.status(201).json({ success: true, team });
});

export const inviteMember = asyncHandler(async (req, res) => {
  const hackathon = await HackathonService.getBySlug(req.hackathon?.slug) || req.hackathon;
  const team = await HackathonTeamService.inviteMember(
    req.team,
    hackathon,
    req.user._id,
    req.body.userId,
    req.app.get('io'),
  );
  res.json({ success: true, team });
});

export const acceptInvite = asyncHandler(async (req, res) => {
  const team = await HackathonTeamService.acceptInvite(
    req.params.teamId, req.user._id, req.app.get('io'),
  );
  res.json({ success: true, team });
});

export const rejectInvite = asyncHandler(async (req, res) => {
  const result = await HackathonTeamService.rejectInvite(req.params.teamId, req.user._id);
  res.json({ success: true, ...result });
});

export const leaveTeam = asyncHandler(async (req, res) => {
  const result = await HackathonTeamService.leaveTeam(req.params.teamId, req.user._id);
  res.json({ success: true, ...result });
});

export const transferCaptain = asyncHandler(async (req, res) => {
  const team = await HackathonTeamService.transferCaptain(
    req.params.teamId, req.user._id, req.body.newCaptainId,
  );
  res.json({ success: true, team });
});

export const discoverTeams = asyncHandler(async (req, res) => {
  const teams = await HackathonTeamService.discoverTeams(req.params.id, req.query);
  res.json({ success: true, teams });
});

export const upsertSubmission = asyncHandler(async (req, res) => {
  const submission = await HackathonSubmissionService.upsertSubmission(
    req.params.id, req.params.teamId, req.user._id, req.body, req.app.get('io'),
  );
  res.json({ success: true, submission });
});

export const getSubmission = asyncHandler(async (req, res) => {
  const submission = await HackathonSubmissionService.getSubmission(
    req.params.id, req.params.teamId,
  );
  res.json({ success: true, submission });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await HackathonSubmissionService.getLeaderboard(req.params.id);
  res.json({ success: true, leaderboard });
});

export const createPaymentOrder = asyncHandler(async (req, res) => {
  const result = await PaymentService.createHackathonOrder(req.body.registrationId, req.user._id);
  res.json({ success: true, ...result });
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const result = await PaymentService.verifyHackathonPayment(req.body);
  res.json({ success: true, ...result });
});

export const getAiTeamSuggestions = asyncHandler(async (req, res) => {
  const data = await HackathonAiService.getTeamSuggestions(req.params.id, req.user._id);
  res.json({ success: true, data });
});

export const getSkillGapAnalysis = asyncHandler(async (req, res) => {
  const data = await HackathonAiService.getSkillGapAnalysis(req.params.id, req.params.teamId);
  res.json({ success: true, data });
});

export const getProjectIdeas = asyncHandler(async (req, res) => {
  const data = await HackathonAiService.getProjectIdeas(req.params.id, req.body.teamSkills || []);
  res.json({ success: true, data });
});

export const createTeamPaymentOrder = asyncHandler(async (req, res) => {
  const result = await PaymentService.createTeamHackathonOrder(req.params.teamId, req.user._id);
  res.json({ success: true, ...result });
});

export const verifyTeamPayment = asyncHandler(async (req, res) => {
  const result = await PaymentService.verifyTeamHackathonPayment({ ...req.body, teamId: req.params.teamId });
  res.json(result);
});

export const getTeamBalanceAnalysis = asyncHandler(async (req, res) => {
  const data = await HackathonAiService.getTeamBalanceAnalysis(req.params.id, req.params.teamId);
  res.json({ success: true, data });
});

export const getSubmissionChecklist = asyncHandler(async (req, res) => {
  const data = await HackathonAiService.getSubmissionChecklist(req.params.id);
  res.json({ success: true, data });
});

export const getOrganizerDashboard = asyncHandler(async (req, res) => {
  const data = await HackathonAnalyticsService.getOrganizerDashboard(req.params.id, req.user._id);
  res.json({ success: true, data });
});

export const exportRegistrationsCSV = asyncHandler(async (req, res) => {
  const csvData = await HackathonRegistrationService.exportRegistrationsCSV(req.params.id);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="registrations_${req.params.id}.csv"`);
  res.send(csvData);
});

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const result = await HackathonRegistrationService.bulkUpdateStatus(
    req.params.id, req.body.registrationIds, req.body.status, req.app.get('io')
  );
  res.json({ success: true, result });
});

export { createTeammateRequest, getTeammateRequests, getGlobalTeammateRequests, expressInterest, searchTeammates } from './teammateRequestController.js';
