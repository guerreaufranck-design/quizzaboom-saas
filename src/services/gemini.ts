import type { QuizGenRequest, AIQuizResponse } from '../types/quiz';

const SECONDS_PER_QUESTION = 85; // theme(14) + display(15) + answer(24) + results(25) + intermission(7)
const QUESTIONS_PER_STAGE = 5;
const CHUNK_SIZE = 15;

export interface GenerationProgress {
  current: number;
  total: number;
  message: string;
}

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

/**
 * Chunked quiz generation — sends multiple sequential requests,
 * each generating up to 15 questions. Prevents Vercel timeout for large quizzes.
 */
const generateMultiStageQuizChunked = async (
  request: QuizGenRequest,
  creatorId?: string,
  onProgress?: (progress: GenerationProgress) => void,
): Promise<AIQuizResponse> => {
  const totalQuestions = request.questionCount || 25;
  const totalChunks = Math.ceil(totalQuestions / CHUNK_SIZE);

  const allStages: AIQuizResponse['stages'] = [];
  const collectedThemes: string[] = [];
  const collectedQuestions: string[] = [];
  let title = '';
  let description = '';

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const startQuestion = chunkIndex * CHUNK_SIZE;
    const chunkQuestionCount = Math.min(CHUNK_SIZE, totalQuestions - startQuestion);
    const startStageNumber = Math.floor(startQuestion / QUESTIONS_PER_STAGE);

    onProgress?.({
      current: chunkIndex + 1,
      total: totalChunks,
      message: `Questions ${startQuestion + 1}-${startQuestion + chunkQuestionCount}...`,
    });

    // Retry logic per chunk
    let lastError: Error | null = null;
    let chunkResult: { title: string; description: string; stages: AIQuizResponse['stages'] } | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch('/api/generate-quiz-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theme: request.theme,
            difficulty: request.difficulty,
            language: request.language,
            creatorId,
            chunkIndex,
            totalChunks,
            questionCount: chunkQuestionCount,
            startStageNumber,
            previousThemes: collectedThemes,
            previousQuestions: collectedQuestions.slice(-100), // limit payload size
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Chunk generation failed' }));
          throw new Error(error.error || `Failed to generate questions ${startQuestion + 1}-${startQuestion + chunkQuestionCount}`);
        }

        chunkResult = await response.json();
        lastError = null;
        break;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');
        if (attempt < 2) {
          console.warn(`⚠️ Chunk ${chunkIndex + 1} attempt ${attempt + 1} failed, retrying...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }

    if (lastError || !chunkResult) {
      throw lastError || new Error(`Chunk ${chunkIndex + 1} failed`);
    }

    // Collect data
    if (chunkIndex === 0) {
      title = chunkResult.title;
      description = chunkResult.description;
    }

    for (const stage of chunkResult.stages) {
      allStages.push(stage);
      collectedThemes.push(stage.theme);
      for (const q of stage.questions) {
        collectedQuestions.push(q.question_text);
      }
    }
  }

  // Re-number stages sequentially
  const allQuestions = allStages.flatMap(s => s.questions);
  const stageThemes = allStages.map(s => s.theme);
  const finalStages: AIQuizResponse['stages'] = [];

  for (let i = 0; i < allQuestions.length; i += QUESTIONS_PER_STAGE) {
    const stageIndex = Math.floor(i / QUESTIONS_PER_STAGE);
    finalStages.push({
      stageNumber: stageIndex + 1,
      theme: stageThemes[stageIndex] || `Stage ${stageIndex + 1}`,
      questions: allQuestions.slice(i, i + QUESTIONS_PER_STAGE),
    });
  }

  const estimatedDuration = Math.ceil((totalQuestions * SECONDS_PER_QUESTION) / 60);

  return { title, description, estimatedDuration, stages: finalStages };
};

/**
 * Main quiz generation function.
 * Routes to chunked approach for large quizzes (>25 questions) to avoid Vercel timeout.
 * Uses single API call for small quizzes (<=25 questions).
 */
export const generateMultiStageQuiz = async (
  request: QuizGenRequest,
  creatorId?: string,
  onProgress?: (progress: GenerationProgress) => void,
): Promise<AIQuizResponse> => {
  const questionCount = request.questionCount || 25;

  // Use chunked approach for larger quizzes to avoid Vercel 60s timeout
  if (questionCount > 25) {
    return generateMultiStageQuizChunked(request, creatorId, onProgress);
  }

  // Single-call approach for small quizzes (fast, stays under timeout)
  onProgress?.({ current: 1, total: 1, message: 'Generating...' });

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
