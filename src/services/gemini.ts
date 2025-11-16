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

CRITICAL MICRO-THEME RULES:
1. The micro_theme must be a GENERAL CATEGORY (2-4 words maximum)
2. NEVER use specific terms that appear in the answer
3. Be BROAD, not specific

EXAMPLES:
✅ GOOD micro_themes:
- Question about "Capgras Syndrome" → micro_theme: "Medical Syndromes" (NOT "Capgras Syndrome")
- Question about "Camembert cheese" → micro_theme: "French Cheeses" (NOT "Camembert")
- Question about "Tour Eiffel" → micro_theme: "Paris Landmarks" (NOT "Eiffel Tower")
- Question about "1969 Moon Landing" → micro_theme: "Space Exploration" (NOT "Moon Landing")
- Question about "Vincent Van Gogh" → micro_theme: "Famous Painters" (NOT "Van Gogh")

❌ BAD micro_themes (TOO SPECIFIC):
- "Capgras Syndrome" when answer contains "Capgras"
- "Eiffel Tower" when answer is about the tower
- "1969" when asking about the year

REQUIREMENTS:
- Use real facts, real answers (not "Option A/B/C/D")
- Difficulty: ${request.difficulty}
- Language: ${fullLanguage}
- Each micro_theme should be a category that groups 5-10 similar questions

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
          "micro_theme": "GENERAL category (2-4 words, no specific terms from answer)"
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
