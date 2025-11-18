import { GoogleGenerativeAI } from '@google/generative-ai';
import type { QuizGenRequest, AIQuizResponse } from '../types/quiz';
import { generateMockQuiz } from './mockQuiz';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateMultiStageQuiz = async (
  request: QuizGenRequest,
  retries = 2
): Promise<AIQuizResponse> => {
  const structure = calculateQuizStructure(request.duration);
  
  console.log('🎨 Quiz generation requested:', {
    theme: request.theme,
    totalQuestions: structure.totalQuestions,
    stages: structure.totalStages,
    difficulty: request.difficulty,
    language: request.language,
    hasApiKey: !!GEMINI_API_KEY,
  });

  if (!genAI || !GEMINI_API_KEY) {
    console.warn('⚠️ No Gemini API key found, using mock quiz');
    return generateMockQuiz(
      request.theme,
      structure.totalQuestions,
      structure.totalStages,
      structure.questionsPerStage,
      request.difficulty,
      request.language,
      request.duration
    );
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📡 Gemini attempt ${attempt}/${retries}...`);
      
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 8192,
        },
      });

      const languageMap: Record<string, string> = {
        'en': 'English',
        'fr': 'French',
        'es': 'Spanish',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
      };

      const fullLanguage = languageMap[request.language] || 'French';

      const prompt = `Create a HIGHLY ENGAGING quiz in ${fullLanguage} about: ${request.theme}

Generate EXACTLY ${structure.totalQuestions} questions organized in ${structure.totalStages} stages.
Each stage has ${structure.questionsPerStage} questions.

🎯 CRITICAL QUALITY RULES:

1. QUESTION DIVERSITY:
   - NEVER repeat similar questions
   - Each question must be UNIQUE and surprising
   - Avoid common/obvious trivia
   - Mix question styles (dates, names, concepts, processes)

2. DIFFICULTY & DEPTH:
   - Questions should make players THINK
   - Avoid questions answerable by simple elimination
   - Include lesser-known but fascinating facts
   - Balance "I learned something!" with "That was fun!"
   - All 4 options must be PLAUSIBLE (no obviously absurd answers)

3. EDUCATIONAL + FUN:
   - Players should laugh OR be amazed by the answer
   - Include surprising/counter-intuitive facts
   - Explanations should be engaging, not boring
   - Fun facts should be genuinely interesting

4. ANSWER DESIGN:
   - Make ALL 4 options believable
   - Don't make correct answer obvious by length/detail
   - Avoid patterns (e.g., "C is always right")
   - Wrong answers should be tempting but clearly wrong once explained

5. MICRO-THEME RULES:
   - Micro_theme = GENERAL CATEGORY (2-4 words max)
   - NEVER use specific terms from the answer
   - Be BROAD, not specific

EXAMPLES OF GOOD QUESTIONS:

✅ Myths & Urban Legends:
Q: "Which popular belief about the Great Wall of China is FALSE?"
A: "It's visible from space with naked eye" (wrong - it's a myth)
Explanation: Despite popular belief, the Great Wall is NOT visible from space without aid. This myth has been debunked by astronauts.

✅ Etymology:
Q: "The word 'quarantine' comes from Italian 'quaranta'. What does it mean?"
A: "Forty" (the number of days ships were isolated)
Fun fact: Venice used 40-day isolation periods during plague outbreaks in the 1300s.

✅ Everyday Objects:
Q: "Why were high heels originally invented in the 17th century?"
A: "For Persian cavalry soldiers to secure feet in stirrups"
Fun fact: King Louis XIV popularized them in France, making heels a fashion symbol!

✅ Absurd Laws:
Q: "In Switzerland, it's illegal after 10 PM to:"
A: "Flush the toilet in apartment buildings"
Fun fact: This law exists to prevent noise complaints in multi-story buildings.

✅ Human Bizarre (True/False format):
Q: "TRUE or FALSE: Humans are the only animals that can blush"
A: "TRUE"
Explanation: Blushing is caused by adrenaline affecting facial blood vessels, unique to humans due to our complex emotional responses.

❌ BAD QUESTIONS (TOO EASY/OBVIOUS):
- "What color is the sky?" (too simple)
- "In what year was 1+1=2 discovered?" (absurd option makes answer obvious)
- "Who painted the Mona Lisa?" with options: "Da Vinci, My uncle Bob, A potato, Aliens" (obviously bad options)

REQUIREMENTS:
- Difficulty: ${request.difficulty}
- Language: ${fullLanguage}
- Use REAL facts, REAL answers
- Make players say "Wow, I didn't know that!"
- Questions should be sharable (players want to tell friends)

Return ONLY valid JSON (no markdown):
{
  "title": "Engaging Quiz Title",
  "description": "Intriguing description",
  "estimatedDuration": ${request.duration},
  "stages": [
    {
      "stageNumber": 1,
      "theme": "Stage Theme",
      "questions": [
        {
          "question_text": "Engaging question that makes you think?",
          "question_type": "multiple_choice",
          "options": ["Plausible answer 1", "Plausible answer 2", "Plausible answer 3", "Plausible answer 4"],
          "correct_answer": "The actual correct answer",
          "explanation": "Why this is correct + interesting context",
          "fun_fact": "Surprising additional fact that makes people go 'wow!'",
          "points": 100,
          "time_limit": 20,
          "difficulty": "${request.difficulty}",
          "micro_theme": "GENERAL category (2-4 words)"
        }
      ]
    }
  ]
}`;

      console.log('📤 Sending to Gemini...');
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log('📥 Response received, length:', text.length);

      let cleanedText = text.trim()
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const firstBrace = cleanedText.indexOf('{');
      if (firstBrace > 0) cleanedText = cleanedText.substring(firstBrace);

      const lastBrace = cleanedText.lastIndexOf('}');
      if (lastBrace < cleanedText.length - 1) {
        cleanedText = cleanedText.substring(0, lastBrace + 1);
      }

      console.log('🧹 Cleaned, parsing...');

      const parsed = JSON.parse(cleanedText);
      
      const actualQuestions = parsed.stages.reduce((sum: number, s: any) => sum + s.questions.length, 0);
      
      console.log('✅ Gemini success:', {
        title: parsed.title,
        questions: actualQuestions,
        stages: parsed.stages.length,
      });
      
      return parsed;
      
    } catch (error: any) {
      console.error(`❌ Attempt ${attempt} failed:`, error.message);
      
      if (attempt < retries) {
        const waitTime = attempt * 1000;
        console.log(`⏳ Retry in ${waitTime}ms...`);
        await sleep(waitTime);
      } else {
        console.warn('⚠️ Gemini failed, falling back to mock quiz');
        return generateMockQuiz(
          request.theme,
          structure.totalQuestions,
          structure.totalStages,
          structure.questionsPerStage,
          request.difficulty,
          request.language,
          request.duration
        );
      }
    }
  }

  return generateMockQuiz(
    request.theme,
    structure.totalQuestions,
    structure.totalStages,
    structure.questionsPerStage,
    request.difficulty,
    request.language,
    request.duration
  );
};
