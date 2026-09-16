import AppError from '../utils/AppError.js';
import AiService from './AiService.js';
import CacheService from './CacheService.js';
import CacheKeys from '../utils/CacheKeys.js';
import HackathonPromptBuilder from '../utils/HackathonPromptBuilder.js';
import HackathonRepository from '../repositories/HackathonRepository.js';
import HackathonTeam from '../models/HackathonTeam.js';
import User from '../models/User.js';
import HackathonTeammateMatchingService from './HackathonTeammateMatchingService.js';

class HackathonAiService {

  async _callAi(prompt, cacheKey, cacheTtl = 600) {
    const cached = await CacheService.get(cacheKey);
    if (cached) return cached;

    const raw    = await AiService.generateContent({ contents: prompt, responseMimeType: 'application/json' });
    const parsed = JSON.parse(raw);
    await CacheService.set(cacheKey, parsed, cacheTtl);
    return parsed;
  }

  async _getHackathon(hackathonId) {
    const hackathon = await HackathonRepository.findByIdLean(hackathonId);
    if (!hackathon) throw new AppError('Hackathon not found', 404);
    return hackathon;
  }

  async getTeamSuggestions(hackathonId, userId) {
    const hackathon = await this._getHackathon(hackathonId);
    const team = await HackathonTeam.findOne({ hackathon: hackathonId, 'members.user': userId })
      .populate('members.user', 'skills').lean();
    
    let currentSkills = [];
    if (team) {
      currentSkills = [...new Set(team.members.flatMap(m => m.user?.skills || []))];
    } else {
      const user = await User.findById(userId).lean();
      currentSkills = user?.skills || [];
    }

    const prompt = HackathonPromptBuilder.teamSuggestions(hackathon, currentSkills);
    const aiResponse = await this._callAi(prompt, CacheKeys.aiTeamSuggestions(hackathonId, userId), 300);
    const missingSkills = aiResponse.missingSkills || [];

    let suggestedTeammates = [];
    if (missingSkills.length > 0) {
      const matches = await HackathonTeammateMatchingService.searchTeammates(
        hackathonId, 
        userId, 
        { skills: missingSkills, excludeTeamed: true, limit: 5 }
      );
      suggestedTeammates = matches.candidates || [];
    }

    return {
      inspiration: aiResponse.gapDescription,
      suggestedTeammates
    };
  }

  async getSkillGapAnalysis(hackathonId, teamId) {
    const [hackathon, team] = await Promise.all([
      HackathonRepository.findByIdLean(hackathonId),
      HackathonTeam.findById(teamId).populate('members.user', 'skills headline name').lean(),
    ]);
    if (!hackathon) throw new AppError('Hackathon not found', 404);
    if (!team)      throw new AppError('Team not found', 404);

    const teamSkills = [...new Set(team.members.flatMap(m => m.user?.skills || []))];
    const prompt     = HackathonPromptBuilder.skillGapAnalysis(hackathon, teamSkills);

    return this._callAi(prompt, CacheKeys.aiSkillGap(hackathonId, teamId));
  }

  async getProjectIdeas(hackathonId, teamSkills = []) {
    const hackathon = await this._getHackathon(hackathonId);
    const prompt    = HackathonPromptBuilder.projectIdeas(hackathon, teamSkills);
    return this._callAi(prompt, `ai:project_ideas:${hackathonId}:${teamSkills.join(',')}`, 300);
  }

  async getTeamBalanceAnalysis(hackathonId, teamId) {
    const [hackathon, team] = await Promise.all([
      HackathonRepository.findByIdLean(hackathonId),
      HackathonTeam.findById(teamId).populate('members.user', 'skills name headline').lean(),
    ]);
    if (!hackathon) throw new AppError('Hackathon not found', 404);
    if (!team)      throw new AppError('Team not found', 404);

    const prompt = HackathonPromptBuilder.teamBalanceAnalysis(hackathon, team);
    return this._callAi(prompt, `ai:team_balance:${hackathonId}:${teamId}`);
  }

  async getSubmissionChecklist(hackathonId) {
    const hackathon = await this._getHackathon(hackathonId);
    const prompt    = HackathonPromptBuilder.submissionChecklist(hackathon);
    return this._callAi(prompt, `ai:submission_checklist:${hackathonId}`, 3600);
  }
}

export default new HackathonAiService();
