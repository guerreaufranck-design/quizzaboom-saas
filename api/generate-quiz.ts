import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { setCorsHeaders } from './_cors';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const SECONDS_PER_QUESTION = 86;
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

function generateMockQuiz(
  theme: string,
  totalQuestions: number,
  totalStages: number,
  questionsPerStage: number,
  difficulty: string,
  duration: number
) {
  const questions = [
    {
      question_text: "Quelle est la capitale de la France ?",
      options: ["Londres", "Paris", "Berlin", "Madrid"],
      correct_answer: "Paris",
      explanation: "Paris est la capitale de la France depuis 987.",
      fun_fact: "Paris compte plus de 400 parcs et jardins !",
    },
    {
      question_text: "Combien de joueurs composent une équipe de football ?",
      options: ["9", "10", "11", "12"],
      correct_answer: "11",
      explanation: "Une équipe de football est composée de 11 joueurs sur le terrain.",
      fun_fact: "Le football est le sport le plus populaire au monde !",
    },
    {
      question_text: "En quelle année l'homme a-t-il marché sur la Lune ?",
      options: ["1965", "1967", "1969", "1971"],
      correct_answer: "1969",
      explanation: "Neil Armstrong a marché sur la Lune le 21 juillet 1969.",
      fun_fact: "Les empreintes de pas sur la Lune peuvent durer des millions d'années !",
    },
    {
      question_text: "Quel est le plus grand océan du monde ?",
      options: ["Atlantique", "Indien", "Arctique", "Pacifique"],
      correct_answer: "Pacifique",
      explanation: "L'océan Pacifique couvre environ 165 millions de km².",
      fun_fact: "Le Pacifique contient plus de 25 000 îles !",
    },
    {
      question_text: "Qui a peint la Joconde ?",
      options: ["Picasso", "Van Gogh", "Léonard de Vinci", "Michel-Ange"],
      correct_answer: "Léonard de Vinci",
      explanation: "Léonard de Vinci a peint la Joconde entre 1503 et 1506.",
      fun_fact: "La Joconde n'a pas de sourcils !",
    },
  ];

  const stages = [];
  const THEME_NAMES = ['History & Culture', 'Science & Nature', 'Sports & Entertainment', 'Geography & Travel', 'Arts & Literature'];
  let globalQuestionIndex = 0;

  for (let stageNum = 0; stageNum < totalStages; stageNum++) {
    const stageQuestions = [];
    const stageName = THEME_NAMES[stageNum % THEME_NAMES.length];
    for (let q = 0; q < questionsPerStage && globalQuestionIndex < totalQuestions; q++) {
      const baseQuestion = questions[globalQuestionIndex % questions.length];
      stageQuestions.push({
        ...baseQuestion,
        question_type: 'multiple_choice',
        points: 100,
        time_limit: 20,
        difficulty,
      });
      globalQuestionIndex++;
    }
    stages.push({ stageNumber: stageNum + 1, theme: stageName, questions: stageQuestions });
  }

  return {
    title: `Quiz ${theme}`,
    description: `Un quiz ${difficulty} avec ${totalQuestions} questions`,
    estimatedDuration: duration,
    stages,
  };
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
      const mockResult = generateMockQuiz(theme, structure.totalQuestions, structure.totalStages, structure.questionsPerStage, difficulty, duration);
      return res.status(200).json(mockResult);
    }

    const retries = 2;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.0-flash-exp',
          generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
        });

        const fullLanguage = languageMap[language] || 'French';

        const prompt = `Create a HIGHLY ENGAGING quiz in ${fullLanguage} about: ${theme}

Generate EXACTLY ${structure.totalQuestions} questions organized in ${structure.totalStages} stages.
Each stage has ${structure.questionsPerStage} questions.

🎯 CRITICAL QUALITY RULES:

1. QUESTION DIVERSITY:
   - NEVER repeat similar questions
   - Each question must be UNIQUE and surprising
   - Avoid common/obvious trivia
   - Mix question styles (dates, names, concepts, processes)

2. DIFFICULTY & DEPTH:
   - Questions should make players THINK
   - Avoid questions answerable by simple elimination
   - Include lesser-known but fascinating facts
   - Balance "I learned something!" with "That was fun!"
   - All 4 options must be PLAUSIBLE (no obviously absurd answers)

3. EDUCATIONAL + FUN:
   - Players should laugh OR be amazed by the answer
   - Include surprising/counter-intuitive facts
   - Explanations should be engaging, not boring
   - Fun facts should be genuinely interesting

4. ANSWER DESIGN:
   - Make ALL 4 options believable
   - Don't make correct answer obvious by length/detail
   - Avoid patterns (e.g., "C is always right")
   - Wrong answers should be tempting but clearly wrong once explained

5. MICRO-THEME RULES:
   - Micro_theme = GENERAL CATEGORY (2-4 words max)
   - NEVER use specific terms from the answer
   - Be BROAD, not specific

REQUIREMENTS:
- Difficulty: ${difficulty}
- Language: ${fullLanguage}
- Use REAL facts, REAL answers
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
          const mockResult = generateMockQuiz(theme, structure.totalQuestions, structure.totalStages, structure.questionsPerStage, difficulty, duration);
          return res.status(200).json(mockResult);
        }
      }
    }

    const mockResult = generateMockQuiz(theme, structure.totalQuestions, structure.totalStages, structure.questionsPerStage, difficulty, duration);
    return res.status(200).json(mockResult);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Generate quiz error:', message);
    return res.status(500).json({ error: message });
  }
}
