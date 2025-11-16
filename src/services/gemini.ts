import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizGenRequest, AIQuizResponse } from '../types/quiz';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// Time calculation constants
const SECONDS_PER_QUESTION = 86; // 25 + 15 + 20 + 20 + 6
const MINUTES_PER_QUESTION = SECONDS_PER_QUESTION / 60; // ≈ 1.43 minutes
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

export const generateMultiStageQuiz = async (
  request: QuizGenRequest
): Promise<AIQuizResponse> => {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // Calculate quiz structure based on duration
    const structure = calculateQuizStructure(request.duration);
    
    console.log('📊 Quiz structure:', {
      duration: `${request.duration} minutes`,
      totalQuestions: structure.totalQuestions,
      totalStages: structure.totalStages,
      questionsPerStage: structure.questionsPerStage,
    });

    const prompt = `You are a professional quiz creator. Create a REAL, high-quality quiz on "${request.theme}" in ${request.language}.

CRITICAL REQUIREMENTS:
- Generate REAL questions with REAL facts, not generic templates
- Each question must have SPECIFIC, FACTUAL content
- Options must be REAL alternatives, not "Option A/B/C/D"
- Explanations must be INFORMATIVE and FACTUAL
- Fun facts must be INTERESTING and TRUE

QUIZ PARAMETERS:
- Duration: ${request.duration} minutes
- Total Questions: ${structure.totalQuestions} (calculated for ${request.duration} min)
- Total Stages: ${structure.totalStages}
- Questions per Stage: ${structure.questionsPerStage}
- Difficulty: ${request.difficulty}
- Language: ${request.language}
- Include strategic joker rounds: ${request.includeJokers}

TIME CALCULATION:
Each question takes approximately 1.5 minutes (including all phases: theme announcement, question reading, answer selection, results, and intermission).
For a ${request.duration}-minute quiz, we need exactly ${structure.totalQuestions} questions organized in ${structure.totalStages} stages.

STAGE ORGANIZATION:
Create ${structure.totalStages} stages, each with ${structure.questionsPerStage} questions.
Each stage should have a specific sub-theme related to "${request.theme}".

DIFFICULTY LEVELS:
- easy: Common knowledge, straightforward questions, suitable for general audience
- medium: Requires general culture and reasoning, moderately challenging
- hard: Specialist knowledge, complex reasoning, challenging for experts

EXAMPLE OF GOOD QUESTION FORMAT:
{
  "question_text": "Which country won the FIFA World Cup in 2018?",
  "question_type": "multiple_choice",
  "options": ["Germany", "France", "Brazil", "Argentina"],
  "correct_answer": "France",
  "explanation": "France won the 2018 FIFA World Cup held in Russia, defeating Croatia 4-2 in the final. It was their second World Cup victory.",
  "fun_fact": "France's coach Didier Deschamps became only the third person to win the World Cup as both a player (1998) and a coach (2018).",
  "points": 100,
  "time_limit": 20,
  "difficulty": "${request.difficulty}"
}

BAD EXAMPLES (DO NOT DO THIS):
❌ "Sample question about ${request.theme}"
❌ Options: ["Option A", "Option B", "Option C", "Option D"]
❌ Explanation: "This is correct because..."
❌ Fun fact: "Did you know... interesting fact about ${request.theme}!"

IMPORTANT CONTENT GUIDELINES:
- Questions must be specific, not generic templates
- Options must be realistic alternatives that could plausibly be correct
- Correct answers must be factually accurate
- Explanations should teach something valuable
- Fun facts should be genuinely interesting and true
- All content must be in ${request.language} language
- Difficulty must match ${request.difficulty} level

Return ONLY valid JSON in this EXACT format (no markdown, no code blocks):
{
  "title": "Engaging Quiz Title About ${request.theme}",
  "description": "A ${request.difficulty} quiz with ${structure.totalQuestions} questions covering various aspects of ${request.theme}",
  "estimatedDuration": ${request.duration},
  "stages": [
    {
      "stageNumber": 1,
      "theme": "First Specific Sub-Topic of ${request.theme}",
      "questions": [
        {
          "question_text": "REAL SPECIFIC QUESTION with factual content",
          "question_type": "multiple_choice",
          "options": ["Real Option 1", "Real Option 2", "Real Option 3", "Real Option 4"],
          "correct_answer": "Real Option X",
          "explanation": "Detailed factual explanation of why this is correct",
          "fun_fact": "Interesting true fact related to the question",
          "points": 100,
          "time_limit": 20,
          "difficulty": "${request.difficulty}"
        }
      ]
    }
  ]
}

STRUCTURE REQUIREMENTS:
- Generate exactly ${structure.totalStages} stages
- Each stage must have exactly ${structure.questionsPerStage} questions
- Total questions across all stages must equal ${structure.totalQuestions}
- Each stage should have a distinct sub-theme related to "${request.theme}"

START GENERATING NOW - Remember: ONLY real, factual, specific content in ${request.language}!`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean markdown code blocks
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleanedText);
    
    const actualQuestions = parsed.stages.reduce((sum: number, s: any) => sum + s.questions.length, 0);
    
    console.log('✅ Gemini generated quiz:', {
      title: parsed.title,
      targetQuestions: structure.totalQuestions,
      actualQuestions: actualQuestions,
      stages: parsed.stages.length,
    });
    
    if (actualQuestions < structure.totalQuestions * 0.8) {
      console.warn('⚠️ Generated fewer questions than expected:', actualQuestions, 'vs', structure.totalQuestions);
    }
    
    return parsed;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};
