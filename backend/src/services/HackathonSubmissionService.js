import AppError from '../utils/AppError.js';
import HackathonSubmission from '../models/HackathonSubmission.js';
import HackathonTeam from '../models/HackathonTeam.js';
import Hackathon from '../models/Hackathon.js';
import notificationManager from './notificationService.js';
class HackathonSubmissionService {

  async _assertTeamMembership(teamId, userId) {
    const team = await HackathonTeam.findById(teamId);
    if (!team) throw new AppError('Team not found', 404);
    const isMember = team.members.some(m => m.user.toString() === userId.toString());
    if (!isMember) throw new AppError('You are not a member of this team', 403);
    return team;
  }

  async _assertDeadlineNotPassed(hackathon) {
    if (hackathon.timeline.hackathonEnd < new Date()) {
      throw new AppError('Submission deadline has passed', 400);
    }
  }

  async upsertSubmission(hackathonId, teamId, userId, data, io) {
    const [hackathon, team] = await Promise.all([
      Hackathon.findById(hackathonId),
      this._assertTeamMembership(teamId, userId),
    ]);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    let submission = await HackathonSubmission.findOne({ hackathon: hackathonId, team: teamId });

    if (submission?.isLocked) {
      throw new AppError('Submission is locked — deadline has passed', 400);
    }

    const versionEntry = { ...data, submittedBy: userId, isDraft: data.isDraft ?? true };

    if (!submission) {
      submission = await HackathonSubmission.create({
        hackathon: hackathonId,
        team: teamId,
        ...data,
        isDraft: data.isDraft ?? true,
        history: [versionEntry],
      });
    } else {
      Object.assign(submission, data);
      submission.isDraft = data.isDraft ?? submission.isDraft;
      submission.history.push(versionEntry);
      await submission.save();
    }
    if (!submission.isDraft) {
      submission.finalSubmittedAt = new Date();
      submission.finalSubmittedBy = userId;
      await submission.save();
      await notificationManager.notify({
        recipientId: hackathon.organizer,
        senderId: userId,
        type: 'hackathon_submission',
        message: `Team "${team.name}" submitted for "${hackathon.title}"`,
        link: `/hackathons/${hackathon.slug}/dashboard`,
        relatedId: hackathon._id,
      }, io);
    }

    return submission;
  }

  async scoreSubmission(hackathonId, teamId, judgeId, scoreData) {
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);

    const isJudge = hackathon.judges && hackathon.judges.some(j => j.toString() === judgeId.toString());
    if (!isJudge) {
      throw new AppError('Only assigned judges can score submissions', 403);
    }

    const submission = await HackathonSubmission.findOne({ hackathon: hackathonId, team: teamId });
    if (!submission) {
      throw new AppError('Submission not found', 404);
    }
    const existingScoreIdx = submission.scores.findIndex(s => s.judge.toString() === judgeId.toString());
    if (existingScoreIdx >= 0) {
      submission.scores[existingScoreIdx].score = scoreData.score;
      submission.scores[existingScoreIdx].feedback = scoreData.feedback;
      submission.scores[existingScoreIdx].scoredAt = new Date();
    } else {
      submission.scores.push({
        judge: judgeId,
        score: scoreData.score,
        feedback: scoreData.feedback,
        scoredAt: new Date()
      });
    }
    submission.totalScore = submission.scores.reduce((sum, s) => sum + (s.score || 0), 0);
    await submission.save();

    return submission;
  }

  async getSubmission(hackathonId, teamId) {
    return HackathonSubmission.findOne({ hackathon: hackathonId, team: teamId })
      .populate('finalSubmittedBy', 'name profilePicture')
      .lean();
  }

  async getLeaderboard(hackathonId) {
    return HackathonSubmission.find({ hackathon: hackathonId, isDraft: false })
      .sort({ totalScore: -1 })
      .populate('team', 'name captain members')
      .select('team totalScore rank isWinner prizeWon')
      .limit(100)
      .lean();
  }

  async lockAllSubmissions(hackathonId) {
    await HackathonSubmission.updateMany(
      { hackathon: hackathonId },
      { $set: { isLocked: true } },
    );
  }

  async finalizeResults(hackathonId, organizerId, io) {
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);
    if (hackathon.organizer.toString() !== organizerId.toString()) {
      throw new AppError('Only the organizer can finalize results', 403);
    }

    const submissions = await HackathonSubmission.find({ hackathon: hackathonId })
      .sort({ totalScore: -1 })
      .exec();

    const topCount = 3;

    for (let i = 0; i < submissions.length; i++) {
      const sub = submissions[i];
      sub.isLocked = true;
      sub.rank = i + 1;
      
      if (sub.rank <= topCount) {
        sub.isWinner = true;
        if (hackathon.prizes && hackathon.prizes.length >= sub.rank) {
          sub.prizeWon = hackathon.prizes[sub.rank - 1].title;
        }
      }

      await sub.save();
      if (sub.isWinner) {
        const team = await HackathonTeam.findById(sub.team);
        if (team) {
          team.members.forEach(m => {
            notificationManager.notify({
              recipientId: m.user,
              type: 'hackathon_result',
              message: `Congratulations! Your team "${team.name}" ranked #${sub.rank} in "${hackathon.title}"!`,
              link: `/hackathons/${hackathon.slug}/leaderboard`,
              relatedId: hackathon._id,
            }, io).catch(console.error);
          });
        }
      }
    }

    hackathon.status = 'completed';
    await hackathon.save();

    return { success: true, finalizedCount: submissions.length };
  }
}

export default new HackathonSubmissionService();
