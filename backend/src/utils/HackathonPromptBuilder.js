class HackathonPromptBuilder {
  teamSuggestions(hackathon, userSkills) {
    const tracks = hackathon.tracks?.map(t => t.name).join(', ') || 'General';
    const requiredSkills = hackathon.skills?.join(', ') || 'Any';
    const userSkillsStr = userSkills?.join(', ') || 'None';
    return `You are an AI system that matches hackathon participants.
Hackathon: "${hackathon.title}"
Tracks: ${tracks}
Hackathon Required skills: ${requiredSkills}
User's current skills: ${userSkillsStr}

Analyze the user's skills against the hackathon's required skills and identify exactly what skills or roles are missing to form a balanced team.
Return ONLY a valid JSON object: { "gapDescription": "A 1-2 sentence description of what the team is missing", "missingSkills": ["skill1", "skill2"] }`;
  }
  skillGapAnalysis(hackathon, teamSkills) {
    return `Analyze this hackathon team's skill coverage.
Required skills for "${hackathon.title}": ${hackathon.skills?.join(', ') || 'Not specified'}
Team's combined skills: ${teamSkills.join(', ') || 'None yet'}

Identify skill gaps and recommend what roles/skills the team should acquire.
Return ONLY valid JSON: { "gaps": string[], "recommendations": string[], "coverageScore": number }`;
  }
  projectIdeas(hackathon, teamSkills) {
    const tracks = hackathon.tracks?.map(t => t.name).join(', ') || 'General';
    return `Generate 3 innovative project ideas for the hackathon "${hackathon.title}".
Hackathon tracks: ${tracks}
Team skills: ${teamSkills.join(', ') || 'Not specified'}

For each idea include: title, problem statement, proposed solution, recommended tech stack, and a 30-day sprint outline.
Return ONLY a valid JSON array: [{ "title": string, "problem": string, "solution": string, "techStack": string[], "sprintOutline": string[] }]`;
  }
  teamBalanceAnalysis(hackathon, team) {
    const memberSummaries = team.members.map(m =>
      `${m.user?.name || 'Unknown'} — Role: ${m.role || 'Not set'} — Skills: ${(m.user?.skills || []).join(', ') || 'None'}`
    ).join('\n');

    return `Evaluate the balance of this hackathon team for "${hackathon.title}".
Team: "${team.name}"
Members:\n${memberSummaries}

Rate the team's overall readiness (0-100), identify coverage strengths, and list recommended improvements.
Return ONLY valid JSON: { "score": number, "strengths": string[], "improvements": string[], "verdict": string }`;
  }
  submissionChecklist(hackathon) {
    const rules    = hackathon.rules?.join('\n') || 'Not specified';
    const criteria = hackathon.judgingCriteria?.map(c => `${c.criterion} (${c.weight}%)`).join(', ') || 'Not specified';
    return `Create a submission checklist for teams participating in "${hackathon.title}".
Rules:\n${rules}
Judging criteria: ${criteria}

Generate a clear, actionable checklist that a team should complete before submitting.
Return ONLY a valid JSON array: [{ "category": string, "items": string[] }]`;
  }
}

export default new HackathonPromptBuilder();
