import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { setCorsHeaders } from './_cors';
import { checkRateLimit } from './_rateLimit';
import {
  SECONDS_PER_QUESTION,
  QUESTIONS_PER_STAGE,
  BATCH_SIZE,
  MAX_CONCURRENCY,
  languageMap,
  calculateQuizStructure,
  calculateFromDuration,
  fetchRecentQuestionTexts,
  computeQuestionHash,
  generateBatchWithRetry,
  mergeAndRenumberStages,
  type BatchResult,
} from './_quizHelpers';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin as string);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp, 5, 60000)) {
    return res.status(429).json({ error: 'Too many requests. Please wait a minute before generating another quiz.' });
  }

  try {
    const { theme, duration, questionCount, difficulty, language, creatorId } = req.body;

    if (!theme || !difficulty || !language) {
      return res.status(400).json({ error: 'Missing required fields: theme, difficulty, language' });
    }

    if (!questionCount && !duration) {
      return res.status(400).json({ error: 'Missing required field: questionCount or duration' });
    }

    // Calculate total questions: prefer questionCount, fallback to duration
    const totalQuestions = questionCount
      ? Number(questionCount)
      : calculateFromDuration(Number(duration)).totalQuestions;

    const structure = calculateQuizStructure(totalQuestions);

    if (!genAI || !GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is missing!');
      return res.status(503).json({
        error: 'AI service unavailable: GEMINI_API_KEY not configured.'
      });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.8, maxOutputTokens: 16384 },
    });

    const fullLanguage = languageMap[language] || 'French';

    // --- Deduplication: fetch recent questions from this creator ---
    const previousQuestions = await fetchRecentQuestionTexts(creatorId);
    if (previousQuestions.length > 0) {
      console.log(`🔍 Found ${previousQuestions.length} previous questions for dedup`);
    }

    // Calculate batches
    const batchCount = Math.ceil(totalQuestions / BATCH_SIZE);
    console.log(`🎯 Generating ${totalQuestions} questions in ${batchCount} batch(es) for theme: ${theme}`);

    const allBatchResults: BatchResult[] = [];
    const collectedThemes: string[] = [];
    // Track all generated question texts across batches for within-quiz dedup
    const generatedQuestionTexts: string[] = [...previousQuestions];

    // Process batches in parallel chunks of MAX_CONCURRENCY
    for (let chunkStart = 0; chunkStart < batchCount; chunkStart += MAX_CONCURRENCY) {
      const chunkEnd = Math.min(chunkStart + MAX_CONCURRENCY, batchCount);
      const chunkIndices = Array.from({ length: chunkEnd - chunkStart }, (_, j) => chunkStart + j);

      const chunkPromises = chunkIndices.map(batchIndex => {
        const startQuestion = batchIndex * BATCH_SIZE;
        const batchQuestionCount = Math.min(BATCH_SIZE, totalQuestions - startQuestion);
        const startStageNumber = Math.floor(startQuestion / QUESTIONS_PER_STAGE);

        return generateBatchWithRetry(
          model, theme, batchIndex, batchCount, batchQuestionCount,
          startStageNumber, difficulty, fullLanguage,
          [...collectedThemes],
          generatedQuestionTexts,
        );
      });

      const chunkResults = await Promise.all(chunkPromises);
      allBatchResults.push(...chunkResults);

      // Collect themes and questions from this chunk for future batches
      for (const result of chunkResults) {
        for (const stage of result.stages) {
          if (stage.theme) collectedThemes.push(stage.theme);
          for (const q of stage.questions || []) {
            generatedQuestionTexts.push(q.question_text);
          }
        }
      }
    }

    // Merge all batch results
    const mergedStages = mergeAndRenumberStages(allBatchResults);

    // --- Post-generation dedup: remove exact duplicates within the quiz ---
    const seenHashes = new Set<string>();
    let dedupRemoved = 0;
    for (const stage of mergedStages) {
      const before = stage.questions.length;
      stage.questions = stage.questions.filter(q => {
        const hash = computeQuestionHash(q.question_text, q.correct_answer);
        if (seenHashes.has(hash)) {
          console.log(`🗑️ Removed duplicate question: "${q.question_text.substring(0, 50)}..."`);
          return false;
        }
        seenHashes.add(hash);
        return true;
      });
      dedupRemoved += before - stage.questions.length;
    }

    // After dedup, re-balance stages so each has QUESTIONS_PER_STAGE (except possibly last)
    if (dedupRemoved > 0) {
      const allQuestionsFlat = mergedStages.flatMap(s => s.questions);
      const stageThemesDedup = mergedStages.map(s => s.theme);
      mergedStages.length = 0;
      for (let i = 0; i < allQuestionsFlat.length; i += QUESTIONS_PER_STAGE) {
        const stageIdx = Math.floor(i / QUESTIONS_PER_STAGE);
        mergedStages.push({
          stageNumber: stageIdx + 1,
          theme: stageThemesDedup[stageIdx] || `Stage ${stageIdx + 1}`,
          questions: allQuestionsFlat.slice(i, i + QUESTIONS_PER_STAGE),
        });
      }
      console.log(`⚠️ Dedup removed ${dedupRemoved} questions. Rebalanced to ${mergedStages.length} stages.`);
    }

    // Remove any empty stages
    const finalStages = mergedStages.filter(s => s.questions.length > 0);

    const estimatedDuration = Math.ceil((totalQuestions * SECONDS_PER_QUESTION) / 60);

    const finalResponse = {
      title: allBatchResults[0]?.title || 'Quiz',
      description: allBatchResults[0]?.description || '',
      estimatedDuration,
      stages: finalStages,
    };

    const totalGenerated = finalStages.reduce((sum, s) => sum + s.questions.length, 0);
    console.log(`✅ Quiz complete: ${totalGenerated}/${totalQuestions} questions in ${finalStages.length} stages (~${estimatedDuration} min)`);

    return res.status(200).json(finalResponse);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Generate quiz error:', message);
    return res.status(500).json({ error: `AI quiz generation failed: ${message}` });
  }
}
