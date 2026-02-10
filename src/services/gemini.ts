import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizGenRequest, AIQuizResponse } from '../types/quiz';

const VITE_GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

const SECONDS_PER_QUESTION = 86;
const MINUTES_PER_QUESTION = SECONDS_PER_QUESTION / 60;
const QUESTIONS_PER_STAGE = 5;

const languageMap: Record<string, string> = {
  'en': 'English',
  'fr': 'French',
  'es': 'Spanish',
  'de': 'German',
};

export const calculateQuizStructure = (durationMinutes: number) => {
  const totalQuestions = Math.floor(durationMinutes / MINUTES_PER_QUESTION);
  const totalStages = Math.ceil(totalQuestions / QUESTIONS_PER_STAGE);
  const questionsPerStage = Math.ceil(totalQuestions / totalStages);

  return {
    totalQuestions,
    totalStages,
    questionsPerStage,
  };
};

function generateMockQuiz(
  theme: string,
  totalQuestions: number,
  totalStages: number,
  questionsPerStage: number,
  difficulty: string,
  duration: number,
): AIQuizResponse {
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
        question_type: 'multiple_choice' as const,
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

function buildPrompt(
  theme: string,
  structure: { totalQuestions: number; totalStages: number; questionsPerStage: number },
  difficulty: string,
  language: string,
  duration: number,
): string {
  const fullLanguage = languageMap[language] || 'French';
  const randomSeed = Math.floor(Math.random() * 1000000);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('en', { month: 'long' });

  return `Create a HIGHLY ENGAGING quiz in ${fullLanguage} about: ${theme}

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
}

function parseGeminiResponse(text: string): AIQuizResponse {
  let cleanedText = text.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const firstBrace = cleanedText.indexOf('{');
  if (firstBrace > 0) cleanedText = cleanedText.substring(firstBrace);
  const lastBrace = cleanedText.lastIndexOf('}');
  if (lastBrace < cleanedText.length - 1) cleanedText = cleanedText.substring(0, lastBrace + 1);
  return JSON.parse(cleanedText);
}

async function generateQuizClientSide(request: QuizGenRequest): Promise<AIQuizResponse> {
  if (!VITE_GEMINI_KEY) {
    throw new Error('No Gemini API key available');
  }

  const genAI = new GoogleGenerativeAI(VITE_GEMINI_KEY);
  const structure = calculateQuizStructure(request.duration);
  const prompt = buildPrompt(request.theme, structure, request.difficulty, request.language, request.duration);

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
    generationConfig: { temperature: 1.0, maxOutputTokens: 8192 },
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return parseGeminiResponse(response.text());
}

export const generateMultiStageQuiz = async (
  request: QuizGenRequest,
): Promise<AIQuizResponse> => {
  const structure = calculateQuizStructure(request.duration);

  // 1. Essayer le backend serverless (fonctionne avec vercel dev et en production)
  try {
    const response = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme: request.theme,
        duration: request.duration,
        difficulty: request.difficulty,
        language: request.language,
      }),
    });

    if (response.ok) {
      return response.json();
    }

    // Si erreur autre que 404, propager l'erreur
    if (response.status !== 404) {
      const error = await response.json().catch(() => ({ error: 'Quiz generation failed' }));
      throw new Error(error.error || 'Quiz generation failed');
    }

    // 404 = pas de backend → fallback client-side
    console.log('⚡ API not available, falling back to client-side Gemini...');
  } catch (error) {
    // Erreur réseau (fetch failed) → fallback client-side
    if (error instanceof TypeError) {
      console.log('⚡ Network error, falling back to client-side Gemini...');
    } else if (error instanceof Error && error.message !== 'Quiz generation failed') {
      // 404 case already logged above, continue to fallback
    } else {
      throw error;
    }
  }

  // 2. Fallback : appel Gemini direct côté client
  if (VITE_GEMINI_KEY) {
    try {
      console.log('🤖 Generating quiz with client-side Gemini...');
      return await generateQuizClientSide(request);
    } catch (error) {
      console.error('❌ Client-side Gemini failed:', error);
    }
  }

  // 3. Fallback ultime : mock quiz
  console.log('📦 Using mock quiz as last resort...');
  return generateMockQuiz(
    request.theme,
    structure.totalQuestions,
    structure.totalStages,
    structure.questionsPerStage,
    request.difficulty,
    request.duration,
  );
};
