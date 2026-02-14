import type { Player } from '../types/quiz';

export interface TeamScore {
  teamName: string;
  totalScore: number;
  playerCount: number;
  correctAnswers: number;
}

export function calculateTeamScores(players: Player[]): TeamScore[] {
  const teamMap = new Map<string, TeamScore>();

  players.forEach(p => {
    if (!p.team_name) return;
    const existing = teamMap.get(p.team_name);
    if (existing) {
      existing.totalScore += p.total_score;
      existing.playerCount += 1;
      existing.correctAnswers += p.correct_answers;
    } else {
      teamMap.set(p.team_name, {
        teamName: p.team_name,
        totalScore: p.total_score,
        playerCount: 1,
        correctAnswers: p.correct_answers,
      });
    }
  });

  return Array.from(teamMap.values()).sort((a, b) => b.totalScore - a.totalScore);
}

export function getMVP(players: Player[]): Player | null {
  if (players.length === 0) return null;
  return players.reduce((best, p) => (p.total_score > best.total_score ? p : best), players[0]);
}
