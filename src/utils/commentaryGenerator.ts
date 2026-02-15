import i18next from 'i18next';

export interface AnswerStat {
  playerId: string;
  playerName: string;
  avatarEmoji: string;
  isCorrect: boolean;
  answerText: string;
  timeTaken: number; // ms since answer_selection started
}

export interface JokerEvent {
  jokerType: 'steal' | 'block' | 'protection' | 'double_points';
  playerName: string;
  playerEmoji: string;
  targetPlayerName?: string;
  targetPlayerEmoji?: string;
}

export interface CommentaryPopup {
  id: string;
  type: 'stat' | 'highlight' | 'roast' | 'praise' | 'joker';
  emoji: string;
  text: string;
  delayMs: number;
  durationMs: number;
}

interface CommentaryInput {
  answerStats: AnswerStat[];
  jokerEvents: JokerEvent[];
  totalPlayers: number;
  correctAnswer: string;
  questionIndex: number;
  language: string;
}

// Variant counts per category
const VARIANT_COUNTS = {
  nobodyAnswered: 4,
  allCorrect: 4,
  nobodyCorrect: 4,
  correctCount: 4,
  wrongAnswerPopular: 4,
  fastestPlayer: 8,
  slowestPlayer: 8,
  jokerSteal: 4,
  jokerBlock: 4,
  jokerDouble: 4,
  jokerProtection: 4,
  praise: 10,
  roast: 15,
};

function t(key: string, params?: Record<string, string | number>): string {
  return i18next.t(key, params) as string;
}

/**
 * Pick a random variant using a seed that changes per question.
 * Uses a prime-based hash to avoid repetitive patterns across questions.
 */
function pickVariant(prefix: string, count: number, seed: number, params?: Record<string, string | number>): string {
  // Use a different prime multiplier per popup type to avoid correlated selections
  const hash = Math.abs(seed * 31 + prefix.length * 17) % count;
  const idx = hash + 1;
  const key = `commentary.${prefix}_${idx}`;
  return params ? t(key, params) : t(key);
}

// Each popup stays on screen for 4s, with 500ms gap between them
const POPUP_DURATION = 4000;
const POPUP_GAP = 500;

function nextDelay(popupsSoFar: number): number {
  return popupsSoFar * (POPUP_DURATION + POPUP_GAP);
}

export function generateCommentary(input: CommentaryInput): CommentaryPopup[] {
  const { answerStats, jokerEvents, totalPlayers, questionIndex } = input;
  const popups: CommentaryPopup[] = [];
  let popupIndex = 0;

  const correctStats = answerStats.filter(s => s.isCorrect);
  const wrongStats = answerStats.filter(s => !s.isCorrect);
  const correctCount = correctStats.length;
  const answeredCount = answerStats.length;

  // Seed varies per question + player count for maximum diversity
  const seed = questionIndex * 13 + answeredCount * 7 + totalPlayers * 3;

  // ── Popup 1: Stats overview ──
  if (answeredCount === 0) {
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'stat',
      emoji: '😴',
      text: pickVariant('nobodyAnswered', VARIANT_COUNTS.nobodyAnswered, seed),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  } else if (correctCount === answeredCount && correctCount > 0) {
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'stat',
      emoji: '🤯',
      text: pickVariant('allCorrect', VARIANT_COUNTS.allCorrect, seed),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  } else if (correctCount === 0) {
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'stat',
      emoji: '💀',
      text: pickVariant('nobodyCorrect', VARIANT_COUNTS.nobodyCorrect, seed),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  } else {
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'stat',
      emoji: '📊',
      text: pickVariant('correctCount', VARIANT_COUNTS.correctCount, seed, { correct: correctCount, total: totalPlayers }),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  }

  // ── Popup 2: Most popular wrong answer ──
  if (wrongStats.length > 0) {
    const wrongAnswerCounts = new Map<string, number>();
    for (const s of wrongStats) {
      wrongAnswerCounts.set(s.answerText, (wrongAnswerCounts.get(s.answerText) || 0) + 1);
    }
    const [popularWrong, popularCount] = [...wrongAnswerCounts.entries()]
      .sort((a, b) => b[1] - a[1])[0];

    if (popularCount >= 2) {
      popups.push({
        id: `c-${questionIndex}-${popupIndex++}`,
        type: 'stat',
        emoji: '🤔',
        text: pickVariant('wrongAnswerPopular', VARIANT_COUNTS.wrongAnswerPopular, seed + 1, { count: popularCount, answer: popularWrong }),
        delayMs: nextDelay(popups.length),
        durationMs: POPUP_DURATION,
      });
    }
  }

  // ── Popup 3: Fastest correct player ──
  if (correctStats.length > 0) {
    const fastest = correctStats.reduce((a, b) => a.timeTaken < b.timeTaken ? a : b);
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'highlight',
      emoji: '⚡',
      text: pickVariant('fastestPlayer', VARIANT_COUNTS.fastestPlayer, seed + 2, { name: fastest.playerName }),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  }

  // ── Popup 4: Joker drama or slowest player ──
  if (jokerEvents.length > 0) {
    const joker = jokerEvents[0];
    if (joker.jokerType === 'steal' && joker.targetPlayerName) {
      popups.push({
        id: `c-${questionIndex}-${popupIndex++}`,
        type: 'joker',
        emoji: '🦹',
        text: pickVariant('jokerSteal', VARIANT_COUNTS.jokerSteal, seed + 3, { name: joker.playerName, target: joker.targetPlayerName }),
        delayMs: nextDelay(popups.length),
        durationMs: POPUP_DURATION,
      });
    } else if (joker.jokerType === 'block' && joker.targetPlayerName) {
      popups.push({
        id: `c-${questionIndex}-${popupIndex++}`,
        type: 'joker',
        emoji: '🚫',
        text: pickVariant('jokerBlock', VARIANT_COUNTS.jokerBlock, seed + 3, { blocker: joker.playerName, target: joker.targetPlayerName }),
        delayMs: nextDelay(popups.length),
        durationMs: POPUP_DURATION,
      });
    } else if (joker.jokerType === 'double_points') {
      popups.push({
        id: `c-${questionIndex}-${popupIndex++}`,
        type: 'joker',
        emoji: '✨',
        text: pickVariant('jokerDouble', VARIANT_COUNTS.jokerDouble, seed + 3, { name: joker.playerName }),
        delayMs: nextDelay(popups.length),
        durationMs: POPUP_DURATION,
      });
    } else if (joker.jokerType === 'protection') {
      popups.push({
        id: `c-${questionIndex}-${popupIndex++}`,
        type: 'joker',
        emoji: '🛡️',
        text: pickVariant('jokerProtection', VARIANT_COUNTS.jokerProtection, seed + 3, { name: joker.playerName }),
        delayMs: nextDelay(popups.length),
        durationMs: POPUP_DURATION,
      });
    }
  } else if (correctStats.length > 1) {
    const slowest = correctStats.reduce((a, b) => a.timeTaken > b.timeTaken ? a : b);
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'highlight',
      emoji: '🐢',
      text: pickVariant('slowestPlayer', VARIANT_COUNTS.slowestPlayer, seed + 3, { name: slowest.playerName }),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  }

  // ── Popup 5: Funny one-liner about a random player ──
  if (correctStats.length > 0 && wrongStats.length > 0) {
    const roastTarget = wrongStats[(seed + 4) % wrongStats.length];
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'roast',
      emoji: '🎤',
      text: pickVariant('roast', VARIANT_COUNTS.roast, seed + 4, { name: roastTarget.playerName }),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  } else if (correctStats.length > 0) {
    const praiseTarget = correctStats[(seed + 4) % correctStats.length];
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'praise',
      emoji: '🎤',
      text: pickVariant('praise', VARIANT_COUNTS.praise, seed + 4, { name: praiseTarget.playerName }),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  } else if (wrongStats.length > 0) {
    const roastTarget = wrongStats[(seed + 4) % wrongStats.length];
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'roast',
      emoji: '🎤',
      text: pickVariant('roast', VARIANT_COUNTS.roast, seed + 4, { name: roastTarget.playerName }),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  }

  return popups;
}
