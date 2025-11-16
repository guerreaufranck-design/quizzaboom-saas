import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizGenRequest, AIQuizResponse } from '../types/quiz';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export const generateMultiStageQuiz = async (
  request: QuizGenRequest
): Promise<AIQuizResponse> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-latest' });

    const prompt = `Create an interactive multi-stage quiz on "${request.theme}" with EXACT duration ${request.duration} minutes.

REQUIRED DURATION CALCULATIONS:
- Reading time = (word count × 60) / 200 seconds
- Thinking time = ${request.difficulty} × 10-20 seconds
- Response time = 3-5 seconds
- Total per question = reading + thinking + response

ADAPTIVE STRUCTURE:
- 15 min: 3-4 stages, 3-4 questions/stage
- 30 min: 5-6 stages, 4-6 questions/stage
- 60 min: 8-10 stages, 6-8 questions/stage
- 120 min: 12-15 stages, 8-10 questions/stage

Include joker rounds: ${request.includeJokers}
Language: ${request.language}
Difficulty: ${request.difficulty}

Return ONLY valid JSON in this EXACT format:
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
          "question_text": "Question text",
          "question_type": "multiple_choice",
          "options": ["A", "B", "C", "D"],
          "correct_answer": "A",
          "explanation": "Why this is correct",
          "fun_fact": "Interesting fact",
          "points": 100,
          "time_limit": 30,
          "is_joker_question": false
        }
      ]
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean markdown code blocks if present
    const cleanedText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleanedText);
    return parsed;
  } catch (error) {
    console.error('Gemini API Error:', error);
    // Return mock quiz as fallback
    return getMockQuiz(request);
  }
};

// Fallback mock quiz generator
const getMockQuiz = (request: QuizGenRequest): AIQuizResponse => {
  const stagesCount = Math.max(3, Math.floor(request.duration / 15));
  const questionsPerStage = 4;

  return {
    title: `${request.theme} Quiz`,
    description: `An exciting quiz about ${request.theme}`,
    estimatedDuration: request.duration,
    stages: Array.from({ length: stagesCount }, (_, i) => ({
      stageNumber: i + 1,
      theme: `${request.theme} - Part ${i + 1}`,
      questions: Array.from({ length: questionsPerStage }, (_, j) => ({
        id: `q-${i}-${j}`,
        quiz_id: '',
        stage_id: `stage-${i}`,
        question_text: `Sample question ${j + 1} about ${request.theme}`,
        question_type: 'multiple_choice' as const,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: 'Option A',
        explanation: 'This is the correct answer because...',
        fun_fact: `Did you know... interesting fact about ${request.theme}!`,
        points: 100,
        time_limit: 30,
        stage_order: j,
        global_order: i * questionsPerStage + j,
        is_joker_question: request.includeJokers && j === questionsPerStage - 1,
      })),
    })),
  };
};
