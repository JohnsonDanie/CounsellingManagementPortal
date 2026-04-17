/**
 * Crisis Flagging Engine
 * Analyzes a student's well-being description and selected symptom tags
 * to assign a Priority Score and Session Category.
 */

const EMERGENCY_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'end it all',
  'self harm', 'self-harm', 'cut myself', 'hurt myself', 'harm myself',
  'can\'t go on', 'no reason to live', 'want to die', 'better off dead',
  'hopeless', 'worthless', 'abuse', 'being abused', 'sexual assault',
  'severe panic', 'can\'t breathe', 'crisis',
];

const URGENT_KEYWORDS = [
  'depressed', 'depression', 'anxiety attack', 'panic attack', 'overwhelmed',
  'crying constantly', 'crying every day', 'can\'t cope', 'breaking down',
  'breakdown', 'falling apart', 'can\'t sleep', 'insomnia', 'not eating',
  'failing', 'failing all', 'extremely stressed', 'losing my mind',
  'feeling lost', 'alone', 'isolated', 'rejected', 'bullied', 'harassed',
  'traumatized', 'trauma',
];

const CATEGORY_MAP = {
  Academic: [
    'grades', 'exam', 'exams', 'test', 'assignment', 'gpa', 'lecturer',
    'professor', 'class', 'course', 'failing course', 'academic', 'study',
    'studying', 'deadline', 'project', 'semester', 'thesis', 'dissertation',
  ],
  'Individual / Personal': [
    'family', 'parents', 'mother', 'father', 'sibling', 'home', 'personal',
    'grief', 'loss', 'death', 'relationship', 'partner', 'breakup',
    'identity', 'self-esteem', 'confidence', 'lonely', 'loneliness',
  ],
  'Group / Social': [
    'friends', 'peers', 'roommate', 'bully', 'bullying', 'social',
    'group', 'team', 'excluded', 'conflict', 'argument', 'harassment',
  ],
  Career: [
    'career', 'job', 'internship', 'employment', 'future', 'graduate',
    'industry', 'cv', 'resume', 'interview', 'work',
  ],
  'Mental Health': [
    'anxiety', 'depression', 'panic', 'mental health', 'therapy', 'counseling',
    'ocd', 'adhd', 'bipolar', 'eating disorder', 'trauma', 'ptsd',
  ],
};

/**
 * Normalizes text for matching
 */
const normalize = (text) => text.toLowerCase().replace(/[^\w\s']/g, ' ');

/**
 * Checks if any keyword appears in the text
 */
const matchesAny = (text, keywords) =>
  keywords.some((kw) => text.includes(kw));

/**
 * Detects the most relevant session category
 */
const detectCategory = (text) => {
  const scores = {};
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    scores[category] = keywords.filter((kw) => text.includes(kw)).length;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best && best[1] > 0 ? best[0] : 'General';
};

/**
 * Main analysis function
 * @param {string} description - Free text from the student
 * @param {string[]} selectedTags - Clicked checkbox tags (e.g. ['Academic Stress', 'Anxiety'])
 * @param {number} moodScore - 1–10 mood slider value
 * @returns {{ priority: string, category: string, isHighRisk: boolean }}
 */
export const analyzeWellbeing = (description = '', selectedTags = [], moodScore = 5) => {
  const combined = normalize(`${description} ${selectedTags.join(' ')}`);

  let priority = 'Routine';

  // 1. Initial Priority Determination
  // We've lowered the mood threshold for Urgent from 4 to 3 to be less 'trigger-happy'
  if (matchesAny(combined, EMERGENCY_KEYWORDS) || moodScore <= 2) {
    priority = 'Emergency';
  } else if (matchesAny(combined, URGENT_KEYWORDS) || moodScore <= 3) {
    priority = 'Urgent';
  }

  // 2. Resilience Protector Logic
  // If a student rates their mood as 'Fair' (6) or higher, we treat this as a significant 
  // protective factor. We downgrade 'Urgent' flags to 'Routine' because the student 
  // explicitly reports feeling stable. We NEVER downgrade 'Emergency' cases.
  if (priority === 'Urgent' && moodScore >= 6) {
    priority = 'Routine';
  }

  const category = detectCategory(combined);
  const isHighRisk = priority === 'Urgent' || priority === 'Emergency';

  return { priority, category, isHighRisk };
};
