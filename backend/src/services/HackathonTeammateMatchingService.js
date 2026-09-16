import User from '../models/User.js';
import HackathonRegistration from '../models/HackathonRegistration.js';
import HackathonTeam from '../models/HackathonTeam.js';
import TeammateRequest from '../models/TeammateRequest.js';
import { normalizeSkills } from '../utils/skillNormalizer.js';

class HackathonTeammateMatchingService {
  scoreCandidate(user, requestedSkills, hasOpenRequest) {
    if (!requestedSkills || requestedSkills.length === 0) {
      return { score: 0, matchedSkills: [], missingSkills: [] };
    }

    const userSkills = user.skills || [];
    const matchedSkills = requestedSkills.filter(s => userSkills.includes(s));
    const missingSkills = requestedSkills.filter(s => !userSkills.includes(s));

    let score = matchedSkills.length / requestedSkills.length;

    if (user.openToCompete) score += 0.1;
    if (hasOpenRequest) score += 0.2;

    return { score, matchedSkills, missingSkills };
  }
  async searchTeammates(hackathonId, requestingUserId, { skills = [], role, branch, year, excludeTeamed = true, page = 1, limit = 20 }) {
    const normalizedRequestedSkills = Array.isArray(skills) ? normalizeSkills(skills) : normalizeSkills(skills.split(','));
    const registrations = await HackathonRegistration.find({ hackathon: hackathonId, status: 'confirmed' })
      .populate('user', 'name username profilePicture headline skills techStack preferredRoles openToCompete education')
      .lean();
    let candidates = registrations
      .map(r => r.user)
      .filter(u => u && u._id.toString() !== requestingUserId.toString());
    if (excludeTeamed) {
      const candidateIds = candidates.map(c => c._id);
      const teams = await HackathonTeam.find({ hackathon: hackathonId, 'members.user': { $in: candidateIds } }).lean();
      
      const teamedUserIds = new Set();
      teams.forEach(t => t.members.forEach(m => teamedUserIds.add(m.user.toString())));

      candidates = candidates.filter(c => !teamedUserIds.has(c._id.toString()));
    }
    if (role) {
      candidates = candidates.filter(c => c.preferredRoles && c.preferredRoles.includes(role));
    }
    if (branch || year) {
      candidates = candidates.filter(c => {
        if (!c.education || c.education.length === 0) return false;
        const latestEdu = c.education[0];
        const branchMatch = !branch || (latestEdu.fieldOfStudy && latestEdu.fieldOfStudy.toLowerCase().includes(branch.toLowerCase()));
        const yearMatch = !year || (latestEdu.currentYear && latestEdu.currentYear.toString() === year.toString());
        return branchMatch && yearMatch;
      });
    }
    const activeRequests = await TeammateRequest.find({ hackathon: hackathonId, status: 'active', creator: { $in: candidates.map(c => c._id) } }).lean();
    const activeRequestCreatorIds = new Set(activeRequests.map(r => r.creator.toString()));
    const scoredCandidates = candidates.map(c => {
      const { score, matchedSkills, missingSkills } = this.scoreCandidate(c, normalizedRequestedSkills, activeRequestCreatorIds.has(c._id.toString()));
      return {
        user: {
          _id: c._id,
          name: c.name,
          username: c.username,
          profilePicture: c.profilePicture,
          headline: c.headline,
          skills: c.skills,
          techStack: c.techStack,
          preferredRoles: c.preferredRoles,
          openToCompete: c.openToCompete
        },
        score,
        matchedSkills,
        missingSkills
      };
    });
    scoredCandidates.sort((a, b) => b.score - a.score);
    const startIndex = (page - 1) * limit;
    const paginated = scoredCandidates.slice(startIndex, startIndex + Number(limit));

    return {
      total: scoredCandidates.length,
      page: Number(page),
      limit: Number(limit),
      candidates: paginated
    };
  }
}

export default new HackathonTeammateMatchingService();
