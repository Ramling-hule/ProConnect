import { env } from '../config/env.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import AiService from '../services/AiService.js';
const buildProfileText = (user) => `
Name: ${user.name}
Headline: ${user.headline || 'None'}
Institute: ${user.institute}
Skills: ${user.skills?.join(', ') || 'None'}
Experience: ${JSON.stringify(user.experience) || 'None'}
Education: ${JSON.stringify(user.education) || 'None'}
Badges: ${user.badges?.join(', ') || 'None'}
Points: ${user.points || 0}
About: ${user.about || 'None'}
`.trim();

export const getCareerRecommendations = asyncHandler(async (req, res, next) => {
  if (!AiService.isAvailable) {
    throw new AppError();
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError();

  const systemPrompt =
    'You are an AI Academic and Career Copilot. Analyze the student profile and output a JSON object only. ' +
    'Format: { "profileScore": 85, "suggestions": ["add about page", "add project experience"], ' +
    '"skillsToLearn": ["Docker", "TypeScript"], "targetRoles": ["Frontend Developer", "React Architect"], ' +
    '"badgesToTarget": ["Group Leader badge", "Hackathon Champ"], ' +
    '"roadmap": { "shortTerm": "Learn styling libraries and build portfolio", "longTerm": "Master Cloud deployments and Node architectures" } }';

  const text = await AiService.generateContent({
    contents:         `Analyze this student profile and generate the career insights:\n${buildProfileText(user)}`,
    systemInstruction: systemPrompt,
    responseMimeType:  'application/json',
  });

  const result = JSON.parse(text);
  res.json({ success: true, ...result });
});

export const handleCareerChat = asyncHandler(async (req, res, next) => {
  if (!AiService.isAvailable) {
    throw new AppError();
  }

  const { query } = req.body;
  if (!query || query.trim() === '') {
    throw new AppError();
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new AppError();

  const systemPrompt = `You are the ProConnect AI Career and Academic Copilot. Your role is to guide students on their educational and professional paths.
You have access to the student's profile context. Tailor all advice to their profile details.

Student Profile:
- Name: ${user.name}
- Headline: ${user.headline || 'None'}
- Institute: ${user.institute}
- Skills: ${user.skills?.join(', ') || 'None'}
- Experience: ${JSON.stringify(user.experience) || 'None'}
- Education: ${JSON.stringify(user.education) || 'None'}
- Badges: ${user.badges?.join(', ') || 'None'}
- Points: ${user.points || 0}
- About: ${user.about || 'None'}

RULES:
1. Provide highly conversational, encouraging, and clear guidance.
2. Keep spoken/audio responses concise. Try to answer in 2-4 sentences max so it reads aloud nicely, but provide detailed bullet points if appropriate for longer roadmap descriptions.
3. Reference their profile details directly in your response where relevant.`;

  const text = await AiService.generateContent({
    contents:          query,
    systemInstruction: systemPrompt,
  });

  res.json({ success: true, text });
});
