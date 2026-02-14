import type { QuizGenRequest, AIQuizResponse } from '../types/quiz';

const SECONDS_PER_QUESTION = 67;
const QUESTIONS_PER_STAGE = 5;

// New: calculate structure from fixed question count
export const calculateQuizStructureFromCount = (questionCount: number) => {
  const totalQuestions = questionCount;
  const totalStages = Math.ceil(totalQuestions / QUESTIONS_PER_STAGE);
  const questionsPerStage = QUESTIONS_PER_STAGE;
  const estimatedDurationMinutes = Math.ceil((totalQuestions * SECONDS_PER_QUESTION) / 60);

  return {
    totalQuestions,
    totalStages,
    questionsPerStage,
    estimatedDurationMinutes,
  };
};

// Legacy: calculate from duration for backward compatibility
export const calculateQuizStructure = (durationMinutes: number) => {
  const minutesPerQuestion = SECONDS_PER_QUESTION / 60;
  const totalQuestions = Math.floor(durationMinutes / minutesPerQuestion);
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
  creatorId?: string,
): Promise<AIQuizResponse> => {
  const response = await fetch('/api/generate-quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      theme: request.theme,
      questionCount: request.questionCount,
      duration: request.duration,  // backward compat
      difficulty: request.difficulty,
      language: request.language,
      creatorId,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Quiz generation failed' }));
    throw new Error(error.error || 'Quiz generation failed');
  }

  return response.json();
};
