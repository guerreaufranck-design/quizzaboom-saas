import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';
import { checkRateLimit } from './_rateLimit';
import { createHash } from 'crypto';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
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

// --- Deduplication helpers ---
function computeQuestionHash(questionText: string, correctAnswer: string): string {
  const normalized = `${questionText.trim().toLowerCase()}||${correctAnswer.trim().toLowerCase()}`;
  return createHash('md5').update(normalized).digest('hex');
}

async function fetchRecentQuestionTexts(creatorId?: string): Promise<string[]> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !creatorId) return [];
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    // Fetch the last 200 questions from this creator's quizzes
    const { data: quizzes } = await sb
      .from('ai_generated_quizzes')
      .select('id')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!quizzes || quizzes.length === 0) return [];

    const quizIds = quizzes.map(q => q.id);
    const { data: questions } = await sb
      .from('ai_questions')
      .select('question_text')
      .in('quiz_id', quizIds)
      .order('created_at', { ascending: false })
      .limit(200);

    return questions?.map(q => q.question_text) || [];
  } catch (err) {
    console.warn('⚠️ Failed to fetch recent questions for dedup:', err);
    return [];
  }
}

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
      image_search_term?: string;
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
  previousQuestions: string[] = [],
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

  // Anti-duplication: include up to 50 recent questions to avoid
  const dedupWarning = previousQuestions.length > 0
    ? `\n⚠️ DUPLICATE PREVENTION (CRITICAL):
The following questions have ALREADY been used in previous quizzes. You MUST NOT repeat them or ask very similar questions.
Generate COMPLETELY NEW and DIFFERENT questions:
${previousQuestions.slice(0, 50).map((q, i) => `${i + 1}. "${q}"`).join('\n')}\n`
    : '';

  // Detect mode from theme string
  const isFunnyMode = theme.toLowerCase().includes('funny mode') || theme.toLowerCase().includes('mode humour') || theme.toLowerCase().includes('modo humor') || theme.toLowerCase().includes('lustig');
  const isKidsMode = theme.toLowerCase().includes('kids mode') || theme.toLowerCase().includes('mode enfant') || theme.toLowerCase().includes('modo ni') || theme.toLowerCase().includes('kinder');

  // Mode-specific instructions
  let modeInstructions = '';
  if (isFunnyMode) {
    modeInstructions = `
🎭 FUN MODE — "BELIEVE IT OR NOT" PROFESSIONAL TRIVIA:
You are writing questions for a FUN pub quiz night — 100% real facts, but chosen because they are BIZARRE, SURPRISING, or COUNTER-INTUITIVE.

GOLDEN RULE: Every question must be a REAL, VERIFIABLE FACT. The fun comes from reality being stranger than fiction — NOT from making things up.

WHAT TO DO:
- 80%+ of questions should have a correct answer that makes players say "Wait, REALLY?!"
- Focus on: bizarre world records (Guinness), strange real laws, surprising statistics, unusual animal abilities, weird origins of everyday things, counter-intuitive science
- Phrasing should be lively and engaging — set up the surprise
- Wrong answers must be PLAUSIBLE and REALISTIC — they should be the "obvious" answers that are actually wrong
- Explanations: short, punchy, "believe it or not" storytelling style
- Fun facts: one more surprising nugget that makes players want to share

GREAT QUESTION PATTERNS:
- "Which country has the most X?" (where the answer is unexpected)
- "What was X originally invented for?" (where the real origin is surprising)
- "Which animal can X?" (where the ability is real but sounds made up)
- "In which country is it illegal to X?" (real bizarre laws)
- "What holds the world record for X?" (unexpected record holders)
- "How long/fast/heavy is X actually?" (counter-intuitive measurements)

WHAT NEVER TO DO:
- NEVER invent fictional facts or scenarios
- NEVER write hypothetical questions ("What would happen if...")
- NEVER use obviously silly wrong answers ("a banana", "42", "never", "nobody knows")
- NEVER include questions you are not CERTAIN are factually correct
- ALL 4 answer options must look equally credible at first glance
`;
  } else if (isKidsMode) {
    modeInstructions = `
👶 KIDS MODE — EDUCATIONAL & FUN (ages 6-12):
You are writing questions for a children's quiz show — educational, age-appropriate, and exciting.

RULES:
- Use SIMPLE, clear language — short sentences, no jargon
- Topics: animals, nature, space, the human body, geography, famous inventions, sports, music
- Every question must teach something real and interesting
- Wrong answers must be plausible for a child (not obviously silly)
- Explanations: "Did you know that..." style, like a fun teacher
- Fun facts should trigger genuine curiosity and wonder
- NEVER include: violence, politics, scary content, adult themes
- Difficulty: achievable but challenging — kids should get ~60-70% right
- TONE: Enthusiastic, encouraging, like a science show host
`;
  } else {
    modeInstructions = `
📚 STANDARD MODE — SERIOUS COMPETITION TRIVIA:
You are writing questions for a PROFESSIONAL quiz competition — like Trivial Pursuit, Who Wants to Be a Millionaire, or a national quiz championship.

ABSOLUTE RULES:
- 100% of questions must be FACTUAL, VERIFIED, and SOURCED from encyclopedias, official records, or well-documented facts
- NEVER speculate — if you are not 100% certain of a fact, DO NOT include it
- NEVER invent "unusual" or "surprising" angles — write STRAIGHT, CLASSIC trivia questions
- NEVER use words like "insolite", "surprising", "believe it or not", "bizarre" in stage themes or questions
- Stage themes must be CLASSIC and DIRECT: "European Capitals", "Olympic History", "Classical Music", "World Geography" — NOT "Surprising Facts About X" or "X Edition Insolite"
- Questions must test REAL KNOWLEDGE, not trick the player
- This is a COMPETITION — questions must have ONE objectively correct answer, no ambiguity
- All 4 answer options must be realistic, plausible, and from the same category
- Tone: Professional, neutral, authoritative — like a TV quiz show host
- Respect the chosen themes strictly — if the player chose "Geography, Sport, Art", write ONLY about those topics

QUESTION STYLE:
- "What is the capital of...?"
- "In what year did...?"
- "Who painted / composed / invented...?"
- "Which country holds the record for...?"
- "What is the chemical symbol for...?"
- "How many... are there in...?"
- Classic, direct, unambiguous questions that test knowledge
`;
  }

  return `${batchContext}You are a PROFESSIONAL QUIZ WRITER for a Trivia night event.

Your job: write ${batchQuestionCount} questions in ${fullLanguage} about: ${theme}

Organize into ${batchStageCount} stages, starting at stage ${startStageNumber + 1}.
Each stage has ${QUESTIONS_PER_STAGE} questions (last stage may have fewer).

UNIQUE SEED: ${randomSeed}
${previousThemesWarning}
${dedupWarning}
${modeInstructions}

═══════════════════════════════════════════════════
PROFESSIONAL QUIZ STANDARDS (apply to ALL modes):
═══════════════════════════════════════════════════

1. FACTUAL ACCURACY (NON-NEGOTIABLE):
   - Every correct answer must be a VERIFIED, REAL fact
   - If you are not 100% certain of a fact, DO NOT include it
   - Prefer well-documented facts from encyclopedias, official records, scientific papers
   - NEVER guess dates, numbers, or statistics — only use facts you are certain about
   - Do NOT include questions about events after 2024

2. ANSWER QUALITY:
   - All 4 options must be PLAUSIBLE and from the SAME CATEGORY
   - Example: "Which city?" → all 4 must be real cities of similar prominence
   - Example: "What year?" → all 4 must be years within a realistic range
   - NEVER mix categories: no "Paris, 42, a banana, Napoleon" as options
   - The correct answer position must be RANDOMLY distributed (roughly equal A/B/C/D)

3. QUESTION VARIETY (mix ALL these types across the quiz):
   - Factual: "What is / Who was / Where is...?"
   - Numeric: "How many / What percentage / In what year...?"
   - Ranking: "Which is the largest / fastest / oldest...?"
   - Chronological: "In what year / What came first...?"
   - Identification: "Which country / Who composed / What element...?"

4. STAGE THEMES:
   - Each stage needs a distinct sub-topic within the main theme
   - Stage theme = 2-4 words, CLASSIC and DIRECT (e.g., "European Capitals", "Olympic Champions", "Famous Paintings", "World Rivers")
   - NEVER use "surprising", "unusual", "insolite", "bizarre" in stage theme names
   - NEVER repeat a sub-topic across stages

5. DIFFICULTY LEVEL: "${difficulty}" — THIS IS CRITICAL, respect it strictly:
   ${difficulty === 'easy' ? `EASY — Casual / Family level:
   - Questions that most teenagers and adults can answer
   - Common knowledge, popular culture, basic school-level facts
   - Example: "What is the capital of France?" → Paris
   - Example: "How many legs does a spider have?" → 8
   - Example: "Who painted the Mona Lisa?" → Leonardo da Vinci
   - Wrong answers should be obviously from the same category but clearly distinguishable
   - Target: 70-80% of players should answer correctly` :
     difficulty === 'hard' ? `HARD — Expert / Competition level:
   - Questions that only well-read, knowledgeable people can answer
   - Requires specific expertise, precise dates, obscure facts, deep knowledge
   - Example: "In what year was the Treaty of Westphalia signed?" → 1648
   - Example: "What is the atomic number of Molybdenum?" → 42
   - Example: "Who won the FIFA Ballon d'Or in 1999?" → Rivaldo
   - Wrong answers must be VERY close and plausible — designed to confuse even experts
   - Example: for a date question, wrong answers should be within 10-20 years, not 200 years apart
   - Target: only 20-30% of players should answer correctly` :
     `MEDIUM — Standard pub quiz level:
   - Questions that require general culture but not expert knowledge
   - Mix of well-known facts and things you "should know but might not remember"
   - Example: "What is the longest river in Africa?" → Nile
   - Example: "In which decade was the Berlin Wall built?" → 1960s
   - Example: "Which element has the symbol 'Au'?" → Gold
   - Wrong answers should be genuinely confusing — close enough to make players hesitate
   - Target: 40-60% of players should answer correctly`}

6. LENGTH CONSTRAINTS (CRITICAL — displayed on TV screens):
   - question_text: MAX 120 characters, 1 clear sentence
   - options: MAX 50 characters each
   - explanation: MAX 200 characters, engaging mini-story
   - fun_fact: MAX 150 characters, one surprising sentence
   - Use direct phrasing: "What is...?", "Who was...?", "How many...?"
   - NEVER use "Which of the following statements about X is correct?"

7. MICRO-THEME:
   - 2-4 word general category (e.g., "Marine Biology", "European History")
   - NEVER include the answer in the micro-theme

8. IMAGE SEARCH TERM:
   - Provide a 2-3 word ENGLISH search term for finding a relevant photo on Unsplash
   - Must be CONCRETE and VISUAL (objects, places, animals — not abstract concepts)
   - The image must illustrate the THEME or TOPIC of the question, NOT the correct answer
   - NEVER search for the correct answer directly — the photo must NOT give away the answer
   - Think: "What broad visual context helps the player understand the topic?"
   - Good: Question "Which ocean is the deepest?" → image_search_term: "ocean waves" (shows the topic, not the answer)
   - Good: Question "Who painted the Mona Lisa?" → image_search_term: "art museum painting" (NOT "Mona Lisa" or "Leonardo da Vinci")
   - Good: Question "What is the largest planet?" → image_search_term: "solar system planets" (NOT "Jupiter")
   - Bad: Question "What is the capital of Japan?" → image_search_term: "Tokyo" (gives away the answer!)
   - If the question is about a specific thing (e.g., a painting, an animal species), show the CATEGORY not the specific item

9. TRANSLATION & LANGUAGE QUALITY (CRITICAL for non-English quizzes):
   - Language: ${fullLanguage}
   - ALL content MUST be written NATIVELY in ${fullLanguage} — do NOT translate from English
   - Write as a NATIVE ${fullLanguage} speaker would naturally phrase things
   - Questions must be grammatically perfect, clear, and unambiguous in ${fullLanguage}
   - Answer options must use idiomatic ${fullLanguage} phrasing — no awkward literal translations
   - NEVER use anglicisms or loan words when a proper ${fullLanguage} word exists
   - For proper nouns (city names, person names), use the ${fullLanguage} convention:
     * French: "Londres" not "London", "Pékin" not "Beijing"
     * German: "Mailand" not "Milan", "Lissabon" not "Lisbon"
     * Spanish: "Londres" not "London", "Pekín" not "Beijing"
   - Explanations and fun facts must feel natural, not machine-translated
   - If a concept doesn't translate well, ADAPT it to the ${fullLanguage} cultural context
   - Units and formats must match ${fullLanguage} conventions (dates, numbers, measurements)
   - Stage themes must be idiomatic in ${fullLanguage} — not literal translations of English phrases

REQUIREMENTS:
- Difficulty: ${difficulty}
- Language: ${fullLanguage} — write NATIVELY, not translated
- Return ONLY valid JSON, no markdown, no commentary

{
  "title": "Engaging Quiz Title in ${fullLanguage}",
  "description": "Compelling 1-sentence description in ${fullLanguage}",
  "stages": [
    {
      "stageNumber": ${startStageNumber + 1},
      "theme": "Stage Theme",
      "questions": [
        {
          "question_text": "Clear factual question?",
          "question_type": "multiple_choice",
          "options": ["Plausible A", "Plausible B", "Plausible C", "Plausible D"],
          "correct_answer": "The verified correct answer",
          "explanation": "Why + engaging context",
          "fun_fact": "Surprising related fact",
          "points": 100,
          "time_limit": 20,
          "difficulty": "${difficulty}",
          "micro_theme": "General Category",
          "image_search_term": "relevant photo term"
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
  previousQuestions: string[] = [],
): Promise<BatchResult> {
  const batchStageCount = Math.ceil(batchQuestionCount / QUESTIONS_PER_STAGE);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const prompt = buildBatchPrompt(
        theme, batchIndex, totalBatches, batchQuestionCount,
        batchStageCount, startStageNumber, difficulty, fullLanguage, previousThemes,
        previousQuestions,
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
          // Only first batch of each chunk gets the collected themes from previous chunks
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
    for (const stage of mergedStages) {
      stage.questions = stage.questions.filter(q => {
        const hash = computeQuestionHash(q.question_text, q.correct_answer);
        if (seenHashes.has(hash)) {
          console.log(`🗑️ Removed duplicate question: "${q.question_text.substring(0, 50)}..."`);
          return false;
        }
        seenHashes.add(hash);
        return true;
      });
    }
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
