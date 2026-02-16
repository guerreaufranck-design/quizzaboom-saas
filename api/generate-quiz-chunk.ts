import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { setCorsHeaders } from './_cors';
import { checkRateLimit } from './_rateLimit';
import {
  generateBatchWithRetry,
  fetchRecentQuestionTexts,
  languageMap,
  QUESTIONS_PER_STAGE,
  SECONDS_PER_QUESTION,
} from './_quizHelpers';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * POST /api/generate-quiz-chunk
 *
 * Generates a single chunk of quiz questions (up to 15).
 * Designed to be called sequentially by the frontend for large quizzes,
 * keeping each call well within the Vercel 60s timeout.
 *
 * Body: {
 *   theme, difficulty, language, creatorId?,
 *   chunkIndex,        // 0-based index of this chunk
 *   totalChunks,       // total number of chunks
 *   questionCount,     // questions in THIS chunk (up to 15)
 *   startStageNumber,  // stage numbering offset
 *   previousThemes?,   // themes from previous chunks (dedup)
 *   previousQuestions?, // question texts from previous chunks (dedup)
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin as string);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  // More lenient rate limit for chunks (each quiz = multiple calls)
  if (!checkRateLimit(clientIp, 20, 60000)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute.' });
  }

  try {
    const {
      theme,
      difficulty,
      language,
      creatorId,
      chunkIndex = 0,
      totalChunks = 1,
      questionCount = 15,
      startStageNumber = 0,
      previousThemes = [],
      previousQuestions = [],
    } = req.body;

    if (!theme || !difficulty || !language) {
      return res.status(400).json({ error: 'Missing required fields: theme, difficulty, language' });
    }

    if (!genAI || !GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is missing!');
      return res.status(503).json({
        error: 'AI service unavailable: GEMINI_API_KEY not configured.',
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { temperature: 0.8, maxOutputTokens: 16384 },
    });

    const fullLanguage = languageMap[language] || 'French';

    // Fetch recent questions for dedup (only on first chunk to avoid redundant DB calls)
    let allPreviousQuestions = [...previousQuestions];
    if (chunkIndex === 0 && creatorId) {
      const recentQuestions = await fetchRecentQuestionTexts(creatorId);
      if (recentQuestions.length > 0) {
        console.log(`🔍 Chunk ${chunkIndex + 1}: Found ${recentQuestions.length} previous questions for dedup`);
        allPreviousQuestions = [...recentQuestions, ...previousQuestions];
      }
    }

    const clampedQuestionCount = Math.min(Math.max(questionCount, 1), 15);

    console.log(`🎯 Generating chunk ${chunkIndex + 1}/${totalChunks}: ${clampedQuestionCount} questions for theme: ${theme}`);

    const batchResult = await generateBatchWithRetry(
      model,
      theme,
      chunkIndex,
      totalChunks,
      clampedQuestionCount,
      startStageNumber,
      difficulty,
      fullLanguage,
      previousThemes,
      allPreviousQuestions,
    );

    const totalGenerated = batchResult.stages.reduce((sum, s) => sum + s.questions.length, 0);
    console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks}: generated ${totalGenerated} questions`);

    return res.status(200).json({
      title: batchResult.title,
      description: batchResult.description,
      stages: batchResult.stages,
      chunkIndex,
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Generate quiz chunk error:`, message);
    return res.status(500).json({ error: `Chunk generation failed: ${message}` });
  }
}
