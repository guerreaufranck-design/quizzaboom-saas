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

const PRAISE_COUNT = 10;
const ROAST_COUNT = 15;

function t(key: string, params?: Record<string, string | number>): string {
  return i18next.t(key, params) as string;
}

function pickTemplate(prefix: string, count: number, seed: number): string {
  const idx = (seed % count) + 1;
  return `commentary.${prefix}_${idx}`;
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

  // ── Popup 1: Stats overview ──
  if (answeredCount === 0) {
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'stat',
      emoji: '😴',
      text: t('commentary.nobodyAnswered'),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  } else if (correctCount === answeredCount && correctCount > 0) {
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'stat',
      emoji: '🤯',
      text: t('commentary.allCorrect'),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  } else if (correctCount === 0) {
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'stat',
      emoji: '💀',
      text: t('commentary.nobodyCorrect'),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  } else {
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'stat',
      emoji: '📊',
      text: t('commentary.correctCount', { correct: correctCount, total: totalPlayers }),
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
        text: t('commentary.wrongAnswerPopular', { count: popularCount, answer: popularWrong }),
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
      text: t('commentary.fastestPlayer', { name: fastest.playerName }),
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
        text: t('commentary.jokerSteal', { name: joker.playerName, target: joker.targetPlayerName }),
        delayMs: nextDelay(popups.length),
        durationMs: POPUP_DURATION,
      });
    } else if (joker.jokerType === 'block' && joker.targetPlayerName) {
      popups.push({
        id: `c-${questionIndex}-${popupIndex++}`,
        type: 'joker',
        emoji: '🚫',
        text: t('commentary.jokerBlock', { blocker: joker.playerName, target: joker.targetPlayerName }),
        delayMs: nextDelay(popups.length),
        durationMs: POPUP_DURATION,
      });
    } else if (joker.jokerType === 'double_points') {
      popups.push({
        id: `c-${questionIndex}-${popupIndex++}`,
        type: 'joker',
        emoji: '✨',
        text: t('commentary.jokerDouble', { name: joker.playerName }),
        delayMs: nextDelay(popups.length),
        durationMs: POPUP_DURATION,
      });
    } else if (joker.jokerType === 'protection') {
      popups.push({
        id: `c-${questionIndex}-${popupIndex++}`,
        type: 'joker',
        emoji: '🛡️',
        text: t('commentary.jokerProtection', { name: joker.playerName }),
        delayMs: nextDelay(popups.length),
        durationMs: POPUP_DURATION,
      });
    }
  } else if (correctStats.length > 1) {
    // Slowest correct player
    const slowest = correctStats.reduce((a, b) => a.timeTaken > b.timeTaken ? a : b);
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'highlight',
      emoji: '🐢',
      text: t('commentary.slowestPlayer', { name: slowest.playerName }),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  }

  // ── Popup 5: Funny one-liner about a random player ──
  const seed = questionIndex * 7 + answerStats.length * 3;
  if (correctStats.length > 0 && wrongStats.length > 0) {
    // Pick a wrong player to roast
    const roastTarget = wrongStats[seed % wrongStats.length];
    const key = pickTemplate('roast', ROAST_COUNT, seed);
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'roast',
      emoji: '🎤',
      text: t(key, { name: roastTarget.playerName }),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  } else if (correctStats.length > 0) {
    // Everyone correct — praise a random one
    const praiseTarget = correctStats[seed % correctStats.length];
    const key = pickTemplate('praise', PRAISE_COUNT, seed);
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'praise',
      emoji: '🎤',
      text: t(key, { name: praiseTarget.playerName }),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  } else if (wrongStats.length > 0) {
    // Everyone wrong — roast a random one
    const roastTarget = wrongStats[seed % wrongStats.length];
    const key = pickTemplate('roast', ROAST_COUNT, seed);
    popups.push({
      id: `c-${questionIndex}-${popupIndex++}`,
      type: 'roast',
      emoji: '🎤',
      text: t(key, { name: roastTarget.playerName }),
      delayMs: nextDelay(popups.length),
      durationMs: POPUP_DURATION,
    });
  }

  return popups;
}
