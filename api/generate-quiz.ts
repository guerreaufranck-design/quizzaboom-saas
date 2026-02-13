import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { setCorsHeaders } from './_cors';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const SECONDS_PER_QUESTION = 41;
const MINUTES_PER_QUESTION = SECONDS_PER_QUESTION / 60;
const QUESTIONS_PER_STAGE = 5;
const BATCH_SIZE = 15;
const MAX_CONCURRENCY = 3;
const MAX_RETRIES = 3;

const languageMap: Record<string, string> = {
  'en': 'English',
  'fr': 'French',
  'es': 'Spanish',
  'de': 'German',
};

function calculateQuizStructure(totalQuestions: number) {
  const totalStages = Math.ceil(totalQuestions / QUESTIONS_PER_STAGE);
  const questionsPerStage = QUESTIONS_PER_STAGE;
  return { totalQuestions, totalStages, questionsPerStage };
}

// Legacy: calculate from duration for backward compatibility
function calculateFromDuration(durationMinutes: number) {
  const totalQuestions = Math.floor(durationMinutes / MINUTES_PER_QUESTION);
  return calculateQuizStructure(totalQuestions);
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface BatchResult {
  title: string;
  description: string;
  stages: Array<{
    stageNumber: number;
    theme: string;
    questions: Array<{
      question_text: string;
      question_type: string;
      options: string[];
      correct_answer: string;
      explanation: string;
      fun_fact: string;
      points: number;
      time_limit: number;
      difficulty: string;
      micro_theme?: string;
    }>;
  }>;
}

function cleanAndParseJSON(text: string): BatchResult {
  let cleaned = text.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  if (firstBrace > 0) cleaned = cleaned.substring(firstBrace);
  const lastBrace = cleaned.lastIndexOf('}');
  if (lastBrace < cleaned.length - 1) cleaned = cleaned.substring(0, lastBrace + 1);
  return JSON.parse(cleaned);
}

function buildBatchPrompt(
  theme: string,
  batchIndex: number,
  totalBatches: number,
  batchQuestionCount: number,
  batchStageCount: number,
  startStageNumber: number,
  difficulty: string,
  fullLanguage: string,
  previousThemes: string[],
): string {
  const randomSeed = Math.floor(Math.random() * 1000000);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('en', { month: 'long' });

  const batchContext = totalBatches > 1
    ? `This is BATCH ${batchIndex + 1} of ${totalBatches} for this quiz. `
    : '';

  const previousThemesWarning = previousThemes.length > 0
    ? `\nIMPORTANT: Previous batches already covered these themes/sub-topics: ${previousThemes.join(', ')}.
Use COMPLETELY DIFFERENT sub-topics and angles. DO NOT repeat any questions or themes from previous batches.`
    : '';

  // Detect mode from theme string
  const isFunnyMode = theme.toLowerCase().includes('funny mode') || theme.toLowerCase().includes('mode humour') || theme.toLowerCase().includes('modo humor') || theme.toLowerCase().includes('lustig');
  const isKidsMode = theme.toLowerCase().includes('kids mode') || theme.toLowerCase().includes('mode enfant') || theme.toLowerCase().includes('modo ni') || theme.toLowerCase().includes('kinder');

  // Mode-specific instructions
  let modeInstructions = '';
  if (isFunnyMode) {
    modeInstructions = `
🤣 FUNNY MODE — CRITICAL INSTRUCTIONS:
- This is COMEDY QUIZ TIME! Questions and answers MUST be HILARIOUS, QUIRKY, and SURPRISING
- Focus on: absurd true facts, bizarre world records, ridiculous laws, funny historical anecdotes, weird animal behaviors, surprising food facts
- Question phrasing should be PLAYFUL and WITTY — make players laugh just reading the question
- Wrong answers should be FUNNY too — each option should make people smile
- Explanations should be told like a comedy bit — short, punchy, unexpected punchline
- Fun facts should make players say "No way, that's actually real?!"
- Prioritize UNUSUAL and BIZARRE real facts over standard trivia
- Include questions about: weird world records, absurd inventions, funny mistranslations, bizarre animal facts, ridiculous historical events
- TONE: Like a stand-up comedian hosting a quiz night — fun, irreverent, surprising
- ALL facts must still be TRUE and REAL — the humor comes from reality being stranger than fiction
`;
  } else if (isKidsMode) {
    modeInstructions = `
👶 KIDS MODE — CRITICAL INSTRUCTIONS (ages 6-12):
- Questions must be FUN, COLORFUL, and ACCESSIBLE for children
- Use SIMPLE, clear language — no complex vocabulary or abstract concepts
- Topics kids LOVE: animals, dinosaurs, space, cartoons, superheroes, nature, food, sports, video games, fun science experiments
- Make it EDUCATIONAL but ENTERTAINING — kids should learn while having a blast
- Include visual/imaginative questions: "If a T-Rex tried to clap, what would happen?"
- Wrong answers can be SILLY and IMAGINATIVE — kids love goofy options
- Explanations should be like talking to a curious kid — "Did you know that..." style
- Fun facts should trigger "WOW! Cool!" reactions
- NEVER include: scary content, violence, complex politics, adult humor, or anything inappropriate
- Difficulty should be AGE-APPROPRIATE: easy enough to feel good, challenging enough to learn
- TONE: Like a fun teacher or a cool older sibling — enthusiastic, encouraging, playful
`;
  } else {
    modeInstructions = `
📚 STANDARD MODE:
- Classic quiz format with a good balance of education and entertainment
- Questions should be interesting, informative, and engaging
- Mix of well-known facts and surprising discoveries
- Professional but accessible tone — suitable for all audiences
`;
  }

  return `${batchContext}Create a HIGHLY ENGAGING quiz segment in ${fullLanguage} about: ${theme}

UNIQUE BATCH SEED: ${randomSeed} — Use this seed to ensure completely different questions.

Generate EXACTLY ${batchQuestionCount} questions organized in ${batchStageCount} stages.
Stage numbers should start at ${startStageNumber + 1}.
Each stage has ${QUESTIONS_PER_STAGE} questions (last stage may have fewer).
${previousThemesWarning}
${modeInstructions}

🎯 ABSOLUTE DIVERSITY REQUIREMENTS:

1. QUESTION UNIQUENESS (MOST IMPORTANT):
   - This quiz MUST be 100% UNIQUE — assume players have already played quizzes on this topic
   - NEVER use classic/common trivia questions (capitals, famous paintings, basic history dates)
   - AVOID "standard quiz questions" that appear in every trivia game
   - Dig DEEP into unusual, obscure, fascinating corners of the topic
   - Mix time periods: ancient history, medieval, modern, AND current events from ${currentYear}
   - Include at least 20% questions about recent events from ${currentMonth} ${currentYear} or last 2 years
   - Mix question angles: statistics, records, origins, paradoxes, myths vs reality, surprising connections

2. QUESTION STYLE VARIETY (vary across ALL these types):
   - "Which of these is TRUE/FALSE?" (myth-busting)
   - "What year did X happen?" (chronology)
   - "How many / What percentage?" (statistics & numbers)
   - "What is the origin of X?" (etymology, history)
   - "Which person/place holds the record for X?" (records)
   - "What surprising connection exists between X and Y?" (unexpected links)
   - "What was recently discovered about X?" (current events / science news)

3. DIFFICULTY & DEPTH:
   - All 4 options must be PLAUSIBLE — no obviously absurd answers
   - Include questions where the intuitive answer is WRONG
   - Balance "I learned something!" with "That was fun!"

4. EDUCATIONAL + FUN:
   - Explanations must be engaging mini-stories, not dry facts
   - Fun facts should be genuinely mind-blowing

5. ANSWER DESIGN:
   - Randomize correct answer position (A/B/C/D equally distributed)
   - Wrong answers should be tempting but clearly wrong once explained

6. MICRO-THEME RULES:
   - Micro_theme = GENERAL CATEGORY (2-4 words max)
   - NEVER use specific terms from the answer — Be BROAD

7. LENGTH CONSTRAINTS (CRITICAL for TV screen readability):
   - question_text: MAXIMUM 120 characters (1 short sentence, must be readable in 5 seconds)
   - options: MAXIMUM 50 characters each (short, punchy, instantly scannable)
   - explanation: MAXIMUM 200 characters (brief but engaging)
   - fun_fact: MAXIMUM 150 characters (one mind-blowing sentence)
   - NEVER use long compound sentences like "Which of the following statements about..."
   - Prefer direct phrasing: "What is...?", "Who was...?", "How many...?"

REQUIREMENTS:
- Difficulty: ${difficulty}
- Language: ${fullLanguage}
- Use REAL facts, REAL answers — accuracy is essential

Return ONLY valid JSON (no markdown, no extra text):
{
  "title": "Engaging Quiz Title",
  "description": "Intriguing description",
  "stages": [
    {
      "stageNumber": ${startStageNumber + 1},
      "theme": "Stage Theme",
      "questions": [
        {
          "question_text": "Engaging question?",
          "question_type": "multiple_choice",
          "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
          "correct_answer": "The actual correct answer",
          "explanation": "Why this is correct + interesting context",
          "fun_fact": "Surprising additional fact",
          "points": 100,
          "time_limit": 20,
          "difficulty": "${difficulty}",
          "micro_theme": "GENERAL category"
        }
      ]
    }
  ]
}`;
}

async function generateBatchWithRetry(
  model: GenerativeModel,
  theme: string,
  batchIndex: number,
  totalBatches: number,
  batchQuestionCount: number,
  startStageNumber: number,
  difficulty: string,
  fullLanguage: string,
  previousThemes: string[],
): Promise<BatchResult> {
  const batchStageCount = Math.ceil(batchQuestionCount / QUESTIONS_PER_STAGE);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const prompt = buildBatchPrompt(
        theme, batchIndex, totalBatches, batchQuestionCount,
        batchStageCount, startStageNumber, difficulty, fullLanguage, previousThemes,
      );

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const parsed = cleanAndParseJSON(text);

      // Validate that we got stages with questions
      if (!parsed.stages || parsed.stages.length === 0) {
        throw new Error('Empty stages in response');
      }

      // Enforce length limits (safety net — Gemini may exceed prompt constraints)
      for (const stage of parsed.stages) {
        for (const q of stage.questions || []) {
          if (q.question_text && q.question_text.length > 150) {
            q.question_text = q.question_text.substring(0, 147) + '...';
          }
          if (q.options) {
            q.options = q.options.map((opt: string) =>
              opt.length > 60 ? opt.substring(0, 57) + '...' : opt
            );
          }
          if (q.explanation && q.explanation.length > 250) {
            q.explanation = q.explanation.substring(0, 247) + '...';
          }
          if (q.fun_fact && q.fun_fact.length > 200) {
            q.fun_fact = q.fun_fact.substring(0, 197) + '...';
          }
        }
      }

      const totalQs = parsed.stages.reduce((sum, s) => sum + (s.questions?.length || 0), 0);
      console.log(`✅ Batch ${batchIndex + 1}/${totalBatches}: got ${totalQs} questions in ${parsed.stages.length} stages`);

      return parsed;

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Batch ${batchIndex + 1} attempt ${attempt}/${MAX_RETRIES} failed:`, message);

      if (attempt < MAX_RETRIES) {
        await sleep(attempt * 1500);
      } else {
        throw new Error(`Batch ${batchIndex + 1} failed after ${MAX_RETRIES} attempts: ${message}`);
      }
    }
  }

  throw new Error(`Batch ${batchIndex + 1} failed unexpectedly`);
}

function mergeAndRenumberStages(allBatchResults: BatchResult[]): BatchResult['stages'] {
  // Collect all questions from all batches
  const allQuestions = allBatchResults.flatMap(batch =>
    batch.stages.flatMap(stage => stage.questions)
  );

  // Collect stage themes in order
  const stageThemes = allBatchResults.flatMap(batch =>
    batch.stages.map(stage => stage.theme)
  );

  // Re-group into stages of QUESTIONS_PER_STAGE
  const stages: BatchResult['stages'] = [];
  for (let i = 0; i < allQuestions.length; i += QUESTIONS_PER_STAGE) {
    const stageIndex = Math.floor(i / QUESTIONS_PER_STAGE);
    stages.push({
      stageNumber: stageIndex + 1,
      theme: stageThemes[stageIndex] || `Stage ${stageIndex + 1}`,
      questions: allQuestions.slice(i, i + QUESTIONS_PER_STAGE),
    });
  }

  return stages;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin as string);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { theme, duration, questionCount, difficulty, language } = req.body;

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
      generationConfig: { temperature: 1.0, maxOutputTokens: 16384 },
    });

    const fullLanguage = languageMap[language] || 'French';

    // Calculate batches
    const batchCount = Math.ceil(totalQuestions / BATCH_SIZE);
    console.log(`🎯 Generating ${totalQuestions} questions in ${batchCount} batch(es) for theme: ${theme}`);

    const allBatchResults: BatchResult[] = [];
    const collectedThemes: string[] = [];

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
          // Only first batch of each chunk gets the collected themes from previous chunks
          [...collectedThemes],
        );
      });

      const chunkResults = await Promise.all(chunkPromises);
      allBatchResults.push(...chunkResults);

      // Collect themes from this chunk for future batches
      for (const result of chunkResults) {
        for (const stage of result.stages) {
          if (stage.theme) collectedThemes.push(stage.theme);
        }
      }
    }

    // Merge all batch results
    const mergedStages = mergeAndRenumberStages(allBatchResults);
    const estimatedDuration = Math.ceil((totalQuestions * SECONDS_PER_QUESTION) / 60);

    const finalResponse = {
      title: allBatchResults[0]?.title || 'Quiz',
      description: allBatchResults[0]?.description || '',
      estimatedDuration,
      stages: mergedStages,
    };

    const totalGenerated = mergedStages.reduce((sum, s) => sum + s.questions.length, 0);
    console.log(`✅ Quiz complete: ${totalGenerated} questions in ${mergedStages.length} stages (~${estimatedDuration} min)`);

    return res.status(200).json(finalResponse);

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Generate quiz error:', message);
    return res.status(500).json({ error: `AI quiz generation failed: ${message}` });
  }
}
