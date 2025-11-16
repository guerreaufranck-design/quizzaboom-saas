import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizGenRequest, AIQuizResponse } from '../types/quiz';
import { generateMockQuiz } from './mockQuiz';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const SECONDS_PER_QUESTION = 86;
const MINUTES_PER_QUESTION = SECONDS_PER_QUESTION / 60;
const QUESTIONS_PER_STAGE = 5;

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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateMultiStageQuiz = async (
  request: QuizGenRequest,
  retries = 2
): Promise<AIQuizResponse> => {
  const structure = calculateQuizStructure(request.duration);
  
  console.log('🎨 Quiz generation requested:', {
    theme: request.theme,
    totalQuestions: structure.totalQuestions,
    stages: structure.totalStages,
    difficulty: request.difficulty,
    language: request.language,
    hasApiKey: !!GEMINI_API_KEY,
  });

  if (!genAI || !GEMINI_API_KEY) {
    console.warn('⚠️ No Gemini API key found, using mock quiz');
    return generateMockQuiz(
      request.theme,
      structure.totalQuestions,
      structure.totalStages,
      structure.questionsPerStage,
      request.difficulty,
      request.language,
      request.duration
    );
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📡 Gemini attempt ${attempt}/${retries}...`);
      
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      });

      const languageMap: Record<string, string> = {
        'en': 'English',
        'fr': 'French',
        'es': 'Spanish',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
      };

      const fullLanguage = languageMap[request.language] || 'French';

      const prompt = `Create a quiz in ${fullLanguage} about: ${request.theme}

Generate EXACTLY ${structure.totalQuestions} questions organized in ${structure.totalStages} stages.
Each stage has ${structure.questionsPerStage} questions.

CRITICAL REQUIREMENTS:
1. Each question must have a SPECIFIC MICRO-THEME (1-3 words) that describes what it's about
   Examples: "French Cheese", "Roman History", "NBA Players", "Ocean Animals", "Renaissance Art"
2. The micro-theme should be SPECIFIC to that question, not generic
3. Use real facts, real answers (not "Option A/B/C/D")
4. Difficulty: ${request.difficulty}
5. Language: ${fullLanguage}

Return ONLY valid JSON (no markdown):
{
  "title": "Quiz Title",
  "description": "Description",
  "estimatedDuration": ${request.duration},
  "stages": [
    {
      "stageNumber": 1,
      "theme": "General Stage Theme",
      "questions": [
        {
          "question_text": "Real question?",
          "question_type": "multiple_choice",
          "options": ["Real answer 1", "Real answer 2", "Real answer 3", "Real answer 4"],
          "correct_answer": "Real answer X",
          "explanation": "Why this is correct",
          "fun_fact": "Interesting fact",
          "points": 100,
          "time_limit": 20,
          "difficulty": "${request.difficulty}",
          "micro_theme": "Specific 1-3 word theme for THIS question"
        }
      ]
    }
  ]
}`;

      console.log('📤 Sending to Gemini...');
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('📥 Response received, length:', text.length);

      let cleanedText = text.trim()
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const firstBrace = cleanedText.indexOf('{');
      if (firstBrace > 0) cleanedText = cleanedText.substring(firstBrace);

      const lastBrace = cleanedText.lastIndexOf('}');
      if (lastBrace < cleanedText.length - 1) {
        cleanedText = cleanedText.substring(0, lastBrace + 1);
      }

      console.log('🧹 Cleaned, parsing...');

      const parsed = JSON.parse(cleanedText);
      
      const actualQuestions = parsed.stages.reduce((sum: number, s: any) => sum + s.questions.length, 0);
      
      console.log('✅ Gemini success:', {
        title: parsed.title,
        questions: actualQuestions,
        stages: parsed.stages.length,
      });
      
      return parsed;
      
    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        const waitTime = attempt * 1000;
        console.log(`⏳ Retry in ${waitTime}ms...`);
        await sleep(waitTime);
      } else {
        console.warn('⚠️ Gemini failed, falling back to mock quiz');
        return generateMockQuiz(
          request.theme,
          structure.totalQuestions,
          structure.totalStages,
          structure.questionsPerStage,
          request.difficulty,
          request.language,
          request.duration
        );
      }
    }
  }

  return generateMockQuiz(
    request.theme,
    structure.totalQuestions,
    structure.totalStages,
    structure.questionsPerStage,
    request.difficulty,
    request.language,
    request.duration
  );
};
