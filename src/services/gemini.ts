import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizGenRequest, AIQuizResponse } from '../types/quiz';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export const generateMultiStageQuiz = async (
  request: QuizGenRequest
): Promise<AIQuizResponse> => {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are a professional quiz creator. Create a REAL, high-quality quiz on "${request.theme}" in ${request.language}.

CRITICAL REQUIREMENTS:
- Generate REAL questions with REAL facts, not generic templates
- Each question must have SPECIFIC, FACTUAL content
- Options must be REAL alternatives, not "Option A/B/C/D"
- Explanations must be INFORMATIVE and FACTUAL
- Fun facts must be INTERESTING and TRUE

QUIZ PARAMETERS:
- Duration: ${request.duration} minutes
- Difficulty: ${request.difficulty}
- Language: ${request.language}
- Include strategic joker rounds: ${request.includeJokers}

STRUCTURE CALCULATION:
- For ${request.duration} min quiz: Generate ${Math.floor(request.duration / 2)} questions
- Organize in ${Math.ceil(request.duration / 15)} stages
- Each question should take ~2 minutes (including reading, thinking, jokers, results)

DIFFICULTY LEVELS:
- easy: Common knowledge, straightforward questions
- medium: Requires general culture and reasoning
- hard: Specialist knowledge, complex questions

EXAMPLE OF GOOD QUESTION (${request.theme}):
{
  "question_text": "Which country won the FIFA World Cup in 2018?",
  "question_type": "multiple_choice",
  "options": ["Germany", "France", "Brazil", "Argentina"],
  "correct_answer": "France",
  "explanation": "France won the 2018 FIFA World Cup held in Russia, defeating Croatia 4-2 in the final.",
  "fun_fact": "This was France's second World Cup victory, their first being in 1998 when they hosted the tournament.",
  "points": 100,
  "time_limit": 20,
  "difficulty": "${request.difficulty}"
}

BAD EXAMPLE (DO NOT DO THIS):
{
  "question_text": "Sample question about ${request.theme}",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "explanation": "This is correct because..."
}

Return ONLY valid JSON in this EXACT format:
{
  "title": "Engaging Quiz Title",
  "description": "Brief description",
  "estimatedDuration": ${request.duration},
  "stages": [
    {
      "stageNumber": 1,
      "theme": "Specific Sub-Topic",
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

IMPORTANT: 
- NO generic "Option A/B/C/D" 
- NO template questions
- ONLY real, factual, specific content
- Questions must be appropriate for ${request.difficulty} difficulty
- All content in ${request.language} language`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean markdown code blocks
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleanedText);
    
    console.log('✅ Gemini generated quiz:', parsed.title);
    console.log('📊 Total questions:', parsed.stages.reduce((sum: number, s: any) => sum + s.questions.length, 0));
    
    return parsed;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
};
