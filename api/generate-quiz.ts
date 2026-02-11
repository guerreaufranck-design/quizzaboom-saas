import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { setCorsHeaders } from './_cors';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const SECONDS_PER_QUESTION = 90;
const MINUTES_PER_QUESTION = SECONDS_PER_QUESTION / 60;
const QUESTIONS_PER_STAGE = 5;

const languageMap: Record<string, string> = {
  'en': 'English',
  'fr': 'French',
  'es': 'Spanish',
  'de': 'German',
};

function calculateQuizStructure(durationMinutes: number) {
  const totalQuestions = Math.floor(durationMinutes / MINUTES_PER_QUESTION);
  const totalStages = Math.ceil(totalQuestions / QUESTIONS_PER_STAGE);
  const questionsPerStage = Math.ceil(totalQuestions / totalStages);
  return { totalQuestions, totalStages, questionsPerStage };
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin as string);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { theme, duration, difficulty, language } = req.body;

    if (!theme || !duration || !difficulty || !language) {
      return res.status(400).json({ error: 'Missing required fields: theme, duration, difficulty, language' });
    }

    const structure = calculateQuizStructure(duration);

    if (!genAI || !GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is missing! Set GEMINI_API_KEY (without VITE_ prefix) in Vercel environment variables.');
      return res.status(503).json({
        error: 'AI service unavailable: GEMINI_API_KEY not configured. Please add GEMINI_API_KEY to your Vercel environment variables.'
      });
    }

    const retries = 2;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash',
          generationConfig: { temperature: 1.0, maxOutputTokens: 8192 },
        });

        const fullLanguage = languageMap[language] || 'French';
        const randomSeed = Math.floor(Math.random() * 1000000);
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().toLocaleString('en', { month: 'long' });

        const prompt = `Create a HIGHLY ENGAGING quiz in ${fullLanguage} about: ${theme}

UNIQUE SESSION SEED: ${randomSeed} — Use this seed to ensure completely different questions from any previous generation.

Generate EXACTLY ${structure.totalQuestions} questions organized in ${structure.totalStages} stages.
Each stage has ${structure.questionsPerStage} questions.

🎯 ABSOLUTE DIVERSITY REQUIREMENTS:

1. QUESTION UNIQUENESS (MOST IMPORTANT):
   - This quiz MUST be 100% UNIQUE — assume the same players have already played quizzes on this topic before
   - NEVER use classic/common trivia questions (capitals, famous paintings, basic history dates)
   - AVOID "standard quiz questions" that appear in every trivia game
   - Instead: dig DEEP into unusual, obscure, fascinating corners of the topic
   - Mix time periods: ancient history, medieval, modern, AND current events from ${currentYear}
   - Include at least 20% questions about recent events, discoveries, or records from ${currentMonth} ${currentYear} or the last 2 years
   - Mix question angles: statistics, records, origins, paradoxes, myths vs reality, surprising connections
   - Each question should cover a DIFFERENT sub-aspect of the theme

2. QUESTION STYLE VARIETY (vary across ALL these types):
   - "Which of these is TRUE/FALSE?" (myth-busting)
   - "What year did X happen?" (chronology)
   - "How many / What percentage?" (statistics & numbers)
   - "What is the origin of X?" (etymology, history)
   - "Which person/place holds the record for X?" (records)
   - "What surprising connection exists between X and Y?" (unexpected links)
   - "What was recently discovered about X?" (current events / science news)

3. DIFFICULTY & DEPTH:
   - Questions should make players THINK and DEBATE
   - All 4 options must be PLAUSIBLE — no obviously absurd answers
   - Include questions where the intuitive answer is WRONG
   - Balance "I learned something!" with "That was fun!"

4. EDUCATIONAL + FUN:
   - Players should laugh OR be amazed by the answer
   - Explanations must be engaging mini-stories, not dry facts
   - Fun facts should be genuinely mind-blowing
   - Include counter-intuitive facts that surprise everyone

5. ANSWER DESIGN:
   - Randomize correct answer position (A/B/C/D equally distributed)
   - Don't make correct answer obvious by length or detail
   - Wrong answers should be tempting but clearly wrong once explained

6. MICRO-THEME RULES:
   - Micro_theme = GENERAL CATEGORY (2-4 words max)
   - NEVER use specific terms from the answer
   - Be BROAD, not specific

REQUIREMENTS:
- Difficulty: ${difficulty}
- Language: ${fullLanguage}
- Use REAL facts, REAL answers — accuracy is essential
- Make players say "Wow, I didn't know that!"
- Questions should be sharable (players want to tell friends)

Return ONLY valid JSON (no markdown):
{
  "title": "Engaging Quiz Title",
  "description": "Intriguing description",
  "estimatedDuration": ${duration},
  "stages": [
    {
      "stageNumber": 1,
      "theme": "Stage Theme",
      "questions": [
        {
          "question_text": "Engaging question that makes you think?",
          "question_type": "multiple_choice",
          "options": ["Plausible answer 1", "Plausible answer 2", "Plausible answer 3", "Plausible answer 4"],
          "correct_answer": "The actual correct answer",
          "explanation": "Why this is correct + interesting context",
          "fun_fact": "Surprising additional fact that makes people go 'wow!'",
          "points": 100,
          "time_limit": 20,
          "difficulty": "${difficulty}",
          "micro_theme": "GENERAL category (2-4 words)"
        }
      ]
    }
  ]
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        let cleanedText = text.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const firstBrace = cleanedText.indexOf('{');
        if (firstBrace > 0) cleanedText = cleanedText.substring(firstBrace);
        const lastBrace = cleanedText.lastIndexOf('}');
        if (lastBrace < cleanedText.length - 1) cleanedText = cleanedText.substring(0, lastBrace + 1);

        const parsed = JSON.parse(cleanedText);
        return res.status(200).json(parsed);

      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Gemini attempt ${attempt} failed:`, message);
        if (attempt < retries) {
          await sleep(attempt * 1000);
        } else {
          console.error('❌ All Gemini retries exhausted. Returning error to client.');
          return res.status(500).json({ error: 'AI quiz generation failed after multiple attempts. Please try again.' });
        }
      }
    }

    // Should never reach here, but safety net
    return res.status(500).json({ error: 'Unexpected error in quiz generation' });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Generate quiz error:', message);
    return res.status(500).json({ error: message });
  }
}
