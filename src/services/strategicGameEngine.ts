import type {
  JokerAction,
  JokerEffects,
  JokerResolution,
  JokerType,
} from '../types/joker';
import type { Player } from '../types/quiz';

export class StrategicGameEngine {
  // Resolve joker actions chronologically
  resolveJokerActions(actions: JokerAction[]): JokerResolution {
    const effects: JokerEffects = {
      protections: {},
      blocks: {},
      steals: {},
      doublePoints: {},
    };

    const conflicts: JokerAction[] = [];
    const sorted = [...actions].sort((a, b) => a.timestamp - b.timestamp);

    for (const action of sorted) {
      switch (action.action_type) {
        case 'protection':
          effects.protections[action.player_id] = true;
          break;

        case 'block':
          if (action.target_player_id) {
            if (!effects.protections[action.target_player_id]) {
              effects.blocks[action.target_player_id] = true;
            } else {
              conflicts.push(action);
            }
          }
          break;

        case 'steal':
          if (action.target_player_id) {
            if (!effects.protections[action.target_player_id]) {
              effects.steals[action.target_player_id] = action.player_id;
            } else {
              conflicts.push(action);
            }
          }
          break;

        case 'double_points':
          effects.doublePoints[action.player_id] = true;
          break;
      }
    }

    return {
      effects,
      conflicts,
      resolutionOrder: sorted,
    };
  }

  // Calculate point redistribution after steal effects
  calculatePointRedistribution(
    baseScores: Record<string, number>,
    stealEffects: Record<string, string>
  ): Record<string, number> {
    const finalScores = { ...baseScores };

    Object.entries(stealEffects).forEach(([victimId, thiefId]) => {
      const stolenPoints = finalScores[victimId] || 0;
      finalScores[victimId] = 0;
      finalScores[thiefId] = (finalScores[thiefId] || 0) + stolenPoints;
    });

    return finalScores;
  }

  // Validate if a player can perform an action
  validatePlayerAction(
    playerId: string,
    actionType: JokerType,
    inventory: Record<string, number>
  ): boolean {
    const remaining = inventory[actionType] || 0;
    return remaining > 0;
  }

  // Calculate threat level based on player performance
  calculateThreatLevel(player: Player): 'low' | 'medium' | 'high' | 'extreme' {
    const score = player.total_score;
    const accuracy = player.accuracy_percentage;
    const streak = player.current_streak;

    const threatScore = score * 0.4 + accuracy * 0.3 + streak * 10 * 0.3;

    if (threatScore > 1000) return 'extreme';
    if (threatScore > 600) return 'high';
    if (threatScore > 300) return 'medium';
    return 'low';
  }

  // Get recommended joker actions based on game state
  getJokerRecommendations(
    player: Player,
    opponents: Player[]
  ): { action: JokerType; target?: string; reason: string }[] {
    const recommendations: { action: JokerType; target?: string; reason: string }[] = [];

    // Find highest threat opponent
    const highestThreat = opponents
      .filter((p) => p.id !== player.id)
      .sort((a, b) => b.total_score - a.total_score)[0];

    if (player.block_uses_remaining > 0 && highestThreat) {
      recommendations.push({
        action: 'block',
        target: highestThreat.id,
        reason: `Block ${highestThreat.player_name} (current leader)`,
      });
    }

    if (player.steal_uses_remaining > 0 && highestThreat) {
      recommendations.push({
        action: 'steal',
        target: highestThreat.id,
        reason: `Steal points from ${highestThreat.player_name}`,
      });
    }

    if (player.protection_uses_remaining > 0 && player.total_score > 500) {
      recommendations.push({
        action: 'protection',
        reason: 'Protect yourself (you have high score)',
      });
    }

    if (player.double_points_uses_remaining > 0) {
      recommendations.push({
        action: 'double_points',
        reason: 'Double your points this round',
      });
    }

    return recommendations;
  }
}

export const gameEngine = new StrategicGameEngine();
