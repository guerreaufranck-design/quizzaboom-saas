import type { QuizGenRequest, AIQuizResponse } from '../types/quiz';

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

export const generateMultiStageQuiz = async (
  request: QuizGenRequest,
): Promise<AIQuizResponse> => {
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

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Quiz generation failed' }));
    throw new Error(error.error || 'Quiz generation failed');
  }

  return response.json();
};
