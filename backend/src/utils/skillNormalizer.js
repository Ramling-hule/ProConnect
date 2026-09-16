import fs from 'fs';
import path from 'path';
const ALIAS_MAP = {
  "reactjs": "react",
  "react.js": "react",
  "node.js": "nodejs",
  "node": "nodejs",
  "js": "javascript",
  "ts": "typescript",
  "ml": "machine learning",
  "ai": "artificial intelligence",
  "dl": "deep learning",
  "nlp": "natural language processing",
  "cv": "computer vision",
  "cpp": "c++",
  "cplusplus": "c++",
  "py": "python",
  "golang": "go",
  "vue.js": "vue",
  "vuejs": "vue",
  "angularjs": "angular",
  "next.js": "nextjs",
  "nuxt.js": "nuxtjs",
  "tailwind": "tailwindcss",
  "css3": "css",
  "html5": "html",
  "postgres": "postgresql",
  "k8s": "kubernetes",
  "aws": "amazon web services",
  "gcp": "google cloud",
  "google cloud platform": "google cloud",
  "rn": "react native",
};
export const normalizeSkills = (skills) => {
  if (!skills || !Array.isArray(skills)) return [];
  
  const normalized = skills.map(skill => {
    if (typeof skill !== 'string') return '';
    let s = skill.toLowerCase().trim();
    if (ALIAS_MAP[s]) {
      s = ALIAS_MAP[s];
    }
    return s;
  }).filter(s => s.length > 0);
  return [...new Set(normalized)];
};
export const normalizeSkillsString = (skillsStr) => {
  if (typeof skillsStr !== 'string') return [];
  return normalizeSkills(skillsStr.split(','));
};
