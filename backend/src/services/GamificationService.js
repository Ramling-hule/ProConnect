import PodMember from '../models/PodMember.js';

class GamificationService {
  async addXP(podId, userId, amount) {
    const member = await PodMember.findOne({ podId, userId });
    if (!member) return null;

    member.xp += amount;
    const newLevel = Math.floor(member.xp / 500) + 1;
    if (newLevel > member.level) {
      member.level = newLevel;
    }

    await member.save();
    return member;
  }

  async processSessionAttendance(podId, userId) {
    return this.addXP(podId, userId, 50);
  }

  async processAssignmentGrade(podId, userId, grade) {
    const xp = Math.round((grade || 0) * 2);
    return this.addXP(podId, userId, xp);
  }
}

export default new GamificationService();
