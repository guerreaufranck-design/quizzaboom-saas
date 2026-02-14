import type { Player } from '../types/quiz';

export interface Badge {
  key: string;
  emoji: string;
  playerName: string;
  playerEmoji: string;
}

export function calculateBadges(players: Player[]): Badge[] {
  if (players.length === 0) return [];

  const badges: Badge[] = [];

  // Quiz Master: best accuracy (>80%, min 5 questions answered)
  const eligibleForAccuracy = players.filter(p => p.questions_answered >= 5);
  if (eligibleForAccuracy.length > 0) {
    const quizMaster = eligibleForAccuracy.reduce((best, p) => {
      const acc = p.questions_answered > 0 ? p.correct_answers / p.questions_answered : 0;
      const bestAcc = best.questions_answered > 0 ? best.correct_answers / best.questions_answered : 0;
      return acc > bestAcc ? p : best;
    });
    const accuracy = quizMaster.questions_answered > 0 ? quizMaster.correct_answers / quizMaster.questions_answered : 0;
    if (accuracy >= 0.8) {
      badges.push({
        key: 'quizMaster',
        emoji: '🏆',
        playerName: quizMaster.player_name,
        playerEmoji: quizMaster.avatar_emoji,
      });
    }
  }

  // Speed Demon: most questions answered + best accuracy among top answerers
  if (players.length > 0) {
    const maxAnswered = Math.max(...players.map(p => p.questions_answered));
    const topAnswerers = players.filter(p => p.questions_answered === maxAnswered);
    const speedDemon = topAnswerers.reduce((best, p) => {
      const acc = p.questions_answered > 0 ? p.correct_answers / p.questions_answered : 0;
      const bestAcc = best.questions_answered > 0 ? best.correct_answers / best.questions_answered : 0;
      return acc > bestAcc ? p : best;
    });
    if (speedDemon.questions_answered >= 5) {
      badges.push({
        key: 'speedDemon',
        emoji: '⚡',
        playerName: speedDemon.player_name,
        playerEmoji: speedDemon.avatar_emoji,
      });
    }
  }

  // Streak King: best streak (min 3)
  const streakKing = players.reduce((best, p) => p.best_streak > best.best_streak ? p : best);
  if (streakKing.best_streak >= 3) {
    badges.push({
      key: 'streakKing',
      emoji: '🔥',
      playerName: streakKing.player_name,
      playerEmoji: streakKing.avatar_emoji,
    });
  }

  // Social Butterfly: answered all questions
  if (players.length > 0) {
    const maxQuestions = Math.max(...players.map(p => p.questions_answered));
    const fullParticipants = players.filter(p => p.questions_answered === maxQuestions && maxQuestions >= 5);
    if (fullParticipants.length > 0 && fullParticipants.length <= Math.ceil(players.length * 0.3)) {
      // Only award if ≤30% of players answered all questions (otherwise it's not special)
      const socialButterfly = fullParticipants.reduce((best, p) => p.total_score > best.total_score ? p : best);
      badges.push({
        key: 'socialButterfly',
        emoji: '🦋',
        playerName: socialButterfly.player_name,
        playerEmoji: socialButterfly.avatar_emoji,
      });
    }
  }

  return badges;
}
