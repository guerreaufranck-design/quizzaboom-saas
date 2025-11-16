import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizGenRequest, AIQuizResponse } from '../types/quiz';

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
  retries = 3
): Promise<AIQuizResponse> => {
  if (!genAI) {
    throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  const structure = calculateQuizStructure(request.duration);
  
  console.log('🎨 Starting quiz generation:', {
    theme: request.theme,
    totalQuestions: structure.totalQuestions,
    stages: structure.totalStages,
    difficulty: request.difficulty,
    language: request.language,
  });

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📡 Attempt ${attempt}/${retries}...`);
      
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
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

      const fullLanguage = languageMap[request.language] || 'English';

      // Prompt ultra simplifié
      const prompt = `Create a quiz in ${fullLanguage}.

Theme: ${request.theme}
Questions: ${structure.totalQuestions} total
Stages: ${structure.totalStages} stages with ${structure.questionsPerStage} questions each
Difficulty: ${request.difficulty}

Rules:
- Real factual questions only
- Real answer options (not "Option A/B/C/D")
- ${request.difficulty} difficulty level
- Language: ${fullLanguage}

Return ONLY this JSON structure (no markdown, no code blocks):
{
  "title": "Quiz Title",
  "description": "Quiz description",
  "estimatedDuration": ${request.duration},
  "stages": [
    {
      "stageNumber": 1,
      "theme": "Stage Theme",
      "questions": [
        {
          "question_text": "Question?",
          "question_type": "multiple_choice",
          "options": ["Answer1", "Answer2", "Answer3", "Answer4"],
          "correct_answer": "Answer1",
          "explanation": "Why this is correct",
          "fun_fact": "Interesting fact",
          "points": 100,
          "time_limit": 20,
          "difficulty": "${request.difficulty}"
        }
      ]
    }
  ]
}

Generate ${structure.totalQuestions} questions now.`;

      console.log('📤 Sending request to Gemini...');
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('📥 Received response, length:', text.length);

      // Nettoyer le texte
      let cleanedText = text.trim();
      
      // Enlever les markdown code blocks
      cleanedText = cleanedText.replace(/```json\s*/g, '');
      cleanedText = cleanedText.replace(/```\s*/g, '');
      cleanedText = cleanedText.trim();

      // Si le texte commence par autre chose que {, trouver le premier {
      const firstBrace = cleanedText.indexOf('{');
      if (firstBrace > 0) {
        cleanedText = cleanedText.substring(firstBrace);
      }

      // Si le texte se termine par autre chose que }, trouver le dernier }
      const lastBrace = cleanedText.lastIndexOf('}');
      if (lastBrace < cleanedText.length - 1) {
        cleanedText = cleanedText.substring(0, lastBrace + 1);
      }

      console.log('🧹 Cleaned text, length:', cleanedText.length);
      console.log('🔍 First 200 chars:', cleanedText.substring(0, 200));

      const parsed = JSON.parse(cleanedText);
      
      const actualQuestions = parsed.stages.reduce((sum: number, s: any) => sum + s.questions.length, 0);
      
      console.log('✅ Quiz successfully generated:', {
        title: parsed.title,
        targetQuestions: structure.totalQuestions,
        actualQuestions: actualQuestions,
        stages: parsed.stages.length,
      });

      if (actualQuestions < structure.totalQuestions * 0.5) {
        throw new Error(`Not enough questions generated: ${actualQuestions} < ${structure.totalQuestions}`);
      }
      
      return parsed;
      
    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        const waitTime = attempt * 2000; // 2s, 4s, 6s
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await sleep(waitTime);
      } else {
        // Dernière tentative échouée
        console.error('❌ All attempts failed');
        throw new Error(`Failed after ${retries} attempts: ${error.message}`);
      }
    }
  }

  throw new Error('Failed to generate quiz');
};
