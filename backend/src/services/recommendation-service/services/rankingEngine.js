
class RankingEngine {
  async rankCandidates(pineconeMatches, studentProfile) {
    const W_SEMANTIC = 0.5;
    const W_BUSINESS = 0.3;
    const W_PERSONALIZATION = 0.2;

    const scoredCandidates = pineconeMatches.map(match => {
      const semanticScore = match.score;
      const meta = match.metadata || {};
      const responseRate = meta.responseRate || 0.8;
      const completionRate = meta.completionRate || 0.8;
      const sessions = meta.totalSessions || 1;
      
      const businessScore = (responseRate * 0.4) + (completionRate * 0.4) + (Math.min(Math.log10(sessions) / 3, 1) * 0.2);
      let personalizationScore = 1.0;
      if (meta.hourlyPrice > studentProfile.budget) {
        personalizationScore -= 0.5;
      }
      if (meta.timezone !== studentProfile.timezone) {
        personalizationScore -= 0.2;
      }
      const totalScore = (semanticScore * W_SEMANTIC) + (businessScore * W_BUSINESS) + (personalizationScore * W_PERSONALIZATION);

      return {
        mentorId: match.id,
        metadata: meta,
        totalScore,
        breakdown: { semanticScore, businessScore, personalizationScore }
      };
    });
    scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);
    const reranked = this._applyDiversityPenalty(scoredCandidates);
    return reranked.slice(0, 20);
  }

  _applyDiversityPenalty(candidates) {
    return candidates; 
  }
}

export default new RankingEngine();
