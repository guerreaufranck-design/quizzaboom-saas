import { create } from 'zustand';
import { supabase } from '../services/supabase/client';
import type { JokerType } from '../types/joker';
import type { Question } from '../types/quiz';
import type { GamePhase } from '../types/gamePhases';
import { INITIAL_JOKER_INVENTORY } from '../types/gamePhases';
import { useQuizStore } from './useQuizStore';

interface PhaseData {
  phase: GamePhase;
  questionIndex: number;
  stageNumber: number;
  timeRemaining: number;
  phaseEndTime?: number;   // Unix ms timestamp when phase expires
  currentQuestion: Question | null;
  themeTitle?: string;
  topPlayers?: Array<{
    player_name: string;
    avatar_emoji: string;
    total_score: number;
    correct_answers: number;
    rank: number;
  }>;
  // Commercial break data
  promoMessage?: string;
  breakNumber?: number;    // e.g. 1
  totalBreaks?: number;    // e.g. 3
  // TV host commentary popups for results phase
  commentary?: Array<{
    id: string;
    type: string;
    emoji: string;
    text: string;
    delayMs: number;
    durationMs: number;
  }>;
  // Tutorial slides data
  tutorialSlides?: Array<{
    emoji: string;
    titleKey: string;
    descriptionKey: string;
    descriptionParams?: Record<string, string | number>;
  }>;
}

interface StrategicQuizState {
  currentPhase: GamePhase;
  phaseTimeRemaining: number;
  phaseEndTime: number | null;
  currentStage: number;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  currentThemeTitle: string | null;
  allQuestions: Question[];
  // Commercial break data
  breakPromoMessage: string;
  breakNumber: number;
  totalBreaks: number;
  
  playerInventory: {
    protection: number;
    block: number;
    steal: number;
    double_points: number;
  };
  
  activeEffects: {
    protections: Record<string, boolean>;
    blocks: Record<string, boolean>;
    steals: Record<string, string>;
    doublePoints: Record<string, boolean>;
  };
  
  preSelectedAnswer: string | null;
  selectedAnswer: string | null;
  hasAnswered: boolean;
  answerSubmittedAt: number | null;
  answeredCount: number;

  showTargetSelector: boolean;
  pendingJokerType: 'block' | 'steal' | null;
  commentaryPopups: Array<{
    id: string;
    type: string;
    emoji: string;
    text: string;
    delayMs: number;
    durationMs: number;
  }>;
  tutorialSlides: Array<{
    emoji: string;
    titleKey: string;
    descriptionKey: string;
    descriptionParams?: Record<string, string | number>;
  }>;

  loadQuestions: (quizId: string) => Promise<void>;
  setPhaseData: (data: PhaseData) => void;
  executeJokerAction: (jokerType: JokerType, targetPlayerId?: string) => Promise<void>;
  selectAnswer: (answer: string) => void;
  submitAnswer: (answer: string) => Promise<void>;
  confirmAnswer: () => Promise<void>;
  resetForNextQuestion: () => void;
  listenToPhaseChanges: (sessionCode: string) => void;
  reconnectToSession: (sessionId: string, sessionCode: string) => Promise<void>;
  getChannelState: () => string | null;
  broadcastPhaseChange: (sessionCode: string, data: PhaseData) => Promise<void>;

  initializeInventory: (jokerInventory: { protection: number; block: number; steal: number; double_points: number }) => void;
  openTargetSelector: (jokerType: 'block' | 'steal') => void;
  closeTargetSelector: () => void;
}

let globalRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;

// Debounce score-updated loadPlayers to avoid 250 simultaneous fetches
let _scoreUpdateTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedScoreRefresh(sessionId: string) {
  if (_scoreUpdateTimer) clearTimeout(_scoreUpdateTimer);
  _scoreUpdateTimer = setTimeout(() => {
    useQuizStore.getState().loadPlayers(sessionId);
    _scoreUpdateTimer = null;
  }, 2000);
}

export const useStrategicQuizStore = create<StrategicQuizState>((set, get) => ({
  currentPhase: 'theme_announcement',
  phaseTimeRemaining: 25,
  phaseEndTime: null,
  currentStage: 0,
  currentQuestionIndex: 0,
  currentQuestion: null,
  currentThemeTitle: null,
  allQuestions: [],
  breakPromoMessage: '',
  breakNumber: 0,
  totalBreaks: 0,
  playerInventory: INITIAL_JOKER_INVENTORY,
  preSelectedAnswer: null,
  activeEffects: {
    protections: {},
    blocks: {},
    steals: {},
    doublePoints: {},
  },
  selectedAnswer: null,
  hasAnswered: false,
  answerSubmittedAt: null,
  answeredCount: 0,
  showTargetSelector: false,
  pendingJokerType: null,
  commentaryPopups: [],
  tutorialSlides: [],

  loadQuestions: async (quizId) => {
    try {
      const { data, error } = await supabase
        .from('ai_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('global_order', { ascending: true });

      if (error) throw error;

      console.log('✅ Loaded questions:', data.length);
      set({ 
        allQuestions: data as Question[],
        currentQuestion: data[0] as Question,
      });
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  },

  setPhaseData: (data) => {
    const { allQuestions, currentQuestionIndex: prevQIdx, hasAnswered: prevHasAnswered, preSelectedAnswer, currentPhase: prevPhase } = get();
    const question = allQuestions[data.questionIndex] || null;

    console.log('📍 Phase data received:', data.phase, 'Q:', data.questionIndex);

    // Auto-submit pre-selected answer when leaving answer_selection phase
    if (prevPhase === 'answer_selection' && data.phase !== 'answer_selection' && preSelectedAnswer && !prevHasAnswered) {
      console.log('⏰ Phase changed — auto-submitting pre-selected answer:', preSelectedAnswer);
      get().submitAnswer(preSelectedAnswer);
    }

    // Quiz ended — if player didn't answer the last question, count it as wrong
    if (data.phase === 'quiz_complete' && !prevHasAnswered && prevQIdx >= 0) {
      console.log('🏁 Quiz ended — last question', prevQIdx + 1, 'was not answered, counting as wrong');
      const playerId = useQuizStore.getState().currentPlayer?.id;
      if (playerId) {
        supabase.rpc('increment_player_score', {
          p_player_id: playerId,
          p_points: 0,
          p_is_correct: false,
        }).then(({ error: rpcError }) => {
          if (rpcError) {
            // Fallback: server-side API to bypass RLS
            fetch('/api/update-player', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                playerId,
                updates: {
                  questions_answered: (useQuizStore.getState().currentPlayer?.questions_answered || 0) + 1,
                  current_streak: 0,
                },
              }),
            }).catch(() => {});
          }
          useQuizStore.setState((state) => {
            if (state.currentPlayer) {
              return {
                currentPlayer: {
                  ...state.currentPlayer,
                  questions_answered: state.currentPlayer.questions_answered + 1,
                  current_streak: 0,
                }
              };
            }
            return state;
          });
        });
      }
    }

    set({
      currentPhase: data.phase,
      phaseTimeRemaining: data.timeRemaining,
      // Always use broadcast phaseEndTime for perfect sync across all clients
      phaseEndTime: data.phaseEndTime || null,
      currentQuestionIndex: data.questionIndex,
      currentStage: data.stageNumber,
      currentQuestion: question,
      currentThemeTitle: data.themeTitle || null,
      // Store commercial break data
      breakPromoMessage: data.promoMessage || '',
      breakNumber: data.breakNumber || 0,
      totalBreaks: data.totalBreaks || 0,
      // Store commentary popups for results phase
      commentaryPopups: data.commentary || [],
      // Store tutorial slides
      tutorialSlides: data.tutorialSlides || [],
    });

    if (data.phase === 'theme_announcement') {
      // If the question index advanced, the previous question is over.
      // If the player didn't answer → count as wrong answer in DB (questions_answered + 1, streak reset)
      if (data.questionIndex !== prevQIdx && !prevHasAnswered && prevQIdx >= 0) {
        console.log('⏭️ Question', prevQIdx + 1, 'missed (not answered) — counting as wrong');
        const playerId = useQuizStore.getState().currentPlayer?.id;
        if (playerId) {
          // Increment questions_answered via RPC (SECURITY DEFINER bypasses RLS)
          supabase.rpc('increment_player_score', {
            p_player_id: playerId,
            p_points: 0,
            p_is_correct: false,
          }).then(({ error: rpcError }) => {
            if (rpcError) {
              // Fallback: server-side API to bypass RLS
              fetch('/api/update-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  playerId,
                  updates: {
                    questions_answered: (useQuizStore.getState().currentPlayer?.questions_answered || 0) + 1,
                    current_streak: 0,
                    last_activity: new Date().toISOString(),
                  },
                }),
              }).catch(() => {});
            }
            // Also reset streak via server API (RPC doesn't handle streak)
            fetch('/api/update-player', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                playerId,
                updates: { current_streak: 0 },
              }),
            }).catch(() => {});
            // Update local state
            useQuizStore.setState((state) => {
              if (state.currentPlayer) {
                return {
                  currentPlayer: {
                    ...state.currentPlayer,
                    questions_answered: state.currentPlayer.questions_answered + 1,
                    current_streak: 0,
                  }
                };
              }
              return state;
            });
          });
        }
      }

      // Reset answer state for the new question
      set({
        activeEffects: {
          protections: {},
          blocks: {},
          steals: {},
          doublePoints: {},
        },
        preSelectedAnswer: null,
        selectedAnswer: null,
        hasAnswered: false,
        answerSubmittedAt: null,
        answeredCount: 0,
        commentaryPopups: [],
      });

      // Clear persisted answer state and effects for new question
      try { sessionStorage.removeItem('qb_answered'); } catch (_) {}
      try { sessionStorage.removeItem('qb_effects'); } catch (_) {}
    }

    // On reconnect: restore active joker effects from sessionStorage
    if (data.phase === 'answer_selection' || data.phase === 'question_display' || data.phase === 'theme_announcement') {
      try {
        const savedEffects = sessionStorage.getItem('qb_effects');
        if (savedEffects) {
          const parsed = JSON.parse(savedEffects);
          if (parsed.questionIndex === data.questionIndex && parsed.effects) {
            const current = get().activeEffects;
            const hasEffects = Object.keys(parsed.effects.protections || {}).length > 0
              || Object.keys(parsed.effects.blocks || {}).length > 0
              || Object.keys(parsed.effects.steals || {}).length > 0
              || Object.keys(parsed.effects.doublePoints || {}).length > 0;
            if (hasEffects) {
              console.log('🃏 Restored active effects from sessionStorage:', parsed.effects);
              set({
                activeEffects: {
                  protections: { ...current.protections, ...parsed.effects.protections },
                  blocks: { ...current.blocks, ...parsed.effects.blocks },
                  steals: { ...current.steals, ...parsed.effects.steals },
                  doublePoints: { ...current.doublePoints, ...parsed.effects.doublePoints },
                },
              });
            }
          }
        }
      } catch (_) {}
    }

    // On reconnect during answer_selection: check if we already answered this question
    if (data.phase === 'answer_selection') {
      try {
        const saved = sessionStorage.getItem('qb_answered');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.questionIndex === data.questionIndex && parsed.answered) {
            console.log('✅ Restored: already answered Q', data.questionIndex + 1);
            set({
              hasAnswered: true,
              selectedAnswer: parsed.selectedAnswer || null,
              answerSubmittedAt: parsed.timestamp || null,
            });
          }
        }
      } catch (_) {}
    }
  },

  openTargetSelector: (jokerType) => {
    set({ showTargetSelector: true, pendingJokerType: jokerType });
  },

  closeTargetSelector: () => {
    set({ showTargetSelector: false, pendingJokerType: null });
  },

  executeJokerAction: async (jokerType, targetPlayerId) => {
    const { playerInventory, currentPhase } = get();
    const currentPlayer = useQuizStore.getState().currentPlayer;
    const playerId = currentPlayer?.id;
    
    if (!playerId) {
      throw new Error('No player ID');
    }
    
    if (currentPhase !== 'theme_announcement') {
      throw new Error('Jokers can only be activated during theme announcement');
    }
    
    if (playerInventory[jokerType] <= 0) {
      throw new Error('No uses remaining for this joker');
    }

    if ((jokerType === 'block' || jokerType === 'steal') && !targetPlayerId) {
      get().openTargetSelector(jokerType);
      return;
    }

    console.log('⚡ Executing joker:', jokerType, 'Target:', targetPlayerId);

    const sessionId = useQuizStore.getState().currentSession?.id;
    if (sessionId) {
      await supabase.from('joker_actions').insert({
        session_id: sessionId,
        player_id: playerId,
        target_player_id: targetPlayerId || null,
        action_type: jokerType,
        question_number: get().currentQuestionIndex,
        timestamp: Date.now(),
        action_order: 1,
      });
    }

    const updatedInventory = {
      ...playerInventory,
      [jokerType]: playerInventory[jokerType] - 1,
    };

    set({ playerInventory: updatedInventory });

    // ALWAYS persist inventory to sessionStorage first (instant, survives refresh)
    try {
      sessionStorage.setItem('qb_inventory', JSON.stringify(updatedInventory));
      console.log('💾 Joker inventory saved to sessionStorage:', updatedInventory);
    } catch (_) {}

    // Persist inventory to DB via server API (bypasses RLS)
    try {
      const { data: playerData } = await supabase
        .from('session_players')
        .select('settings')
        .eq('id', playerId)
        .single();

      const currentSettings = (playerData?.settings as Record<string, unknown>) || {};
      const newSettings = { ...currentSettings, jokerInventory: updatedInventory };

      const res = await fetch('/api/update-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId,
          updates: {
            settings: newSettings,
            updated_at: new Date().toISOString(),
          },
        }),
      });
      if (!res.ok) {
        console.error('❌ Failed to persist joker inventory via API:', await res.text());
      } else {
        console.log('✅ Joker inventory persisted to DB:', updatedInventory);
      }
    } catch (err) {
      console.error('Failed to persist joker inventory:', err);
    }

    // Re-read activeEffects after inventory update (may have been updated by broadcasts)
    const latestEffects = get().activeEffects;

    switch (jokerType) {
      case 'protection':
        set({
          activeEffects: {
            ...latestEffects,
            protections: { ...latestEffects.protections, [playerId]: true },
          },
        });
        break;

      case 'double_points':
        set({
          activeEffects: {
            ...latestEffects,
            doublePoints: { ...latestEffects.doublePoints, [playerId]: true },
          },
        });
        break;

      case 'block':
        if (targetPlayerId) {
          // Check if target is protected — if so, joker is wasted (already consumed above)
          if (latestEffects.protections[targetPlayerId]) {
            console.log('🛡️ Block FAILED — target is protected! Joker wasted.');
            get().closeTargetSelector();
            break;
          }
          set({
            activeEffects: {
              ...latestEffects,
              blocks: { ...latestEffects.blocks, [targetPlayerId]: true },
            },
          });
          get().closeTargetSelector();
        }
        break;

      case 'steal':
        if (targetPlayerId) {
          // Check if target is protected — if so, joker is wasted (already consumed above)
          if (latestEffects.protections[targetPlayerId]) {
            console.log('🛡️ Steal FAILED — target is protected! Joker wasted.');
            get().closeTargetSelector();
            break;
          }
          // First-come-first-served: reject if already stolen
          if (latestEffects.steals[targetPlayerId]) {
            console.log('💰 Steal FAILED — target already stolen by someone else!');
            get().closeTargetSelector();
            break;
          }
          set({
            activeEffects: {
              ...latestEffects,
              steals: { ...latestEffects.steals, [targetPlayerId]: playerId },
            },
          });
          get().closeTargetSelector();
        }
        break;
    }

    // Persist active effects to sessionStorage so they survive page refresh
    try {
      const updatedEffects = get().activeEffects;
      const questionIdx = get().currentQuestionIndex;
      sessionStorage.setItem('qb_effects', JSON.stringify({
        questionIndex: questionIdx,
        effects: updatedEffects,
      }));
    } catch (_) {}

    // Broadcast joker event for TV host commentary
    const sessionCode = useQuizStore.getState().sessionCode;
    if (sessionCode && globalRealtimeChannel) {
      const allPlayers = useQuizStore.getState().players;
      const targetPlayer = targetPlayerId ? allPlayers.find(p => p.id === targetPlayerId) : null;
      await globalRealtimeChannel.send({
        type: 'broadcast',
        event: 'joker_used',
        payload: {
          jokerType,
          playerName: currentPlayer?.player_name || '',
          playerEmoji: currentPlayer?.avatar_emoji || '',
          targetPlayerName: targetPlayer?.player_name || '',
          targetPlayerEmoji: targetPlayer?.avatar_emoji || '',
        },
      });

      // Broadcast actual effects so targeted players know they are blocked/stolen
      if (jokerType === 'block' || jokerType === 'steal' || jokerType === 'protection' || jokerType === 'double_points') {
        await globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'joker_effect',
          payload: {
            jokerType,
            playerId,
            targetPlayerId: targetPlayerId || null,
          },
        });
      }
    }
  },

  selectAnswer: (answer) => {
    const { hasAnswered } = get();
    if (hasAnswered) return; // Already submitted — can't change
    console.log('🔄 Pre-selected answer:', answer);
    set({ preSelectedAnswer: answer });
  },

  confirmAnswer: async () => {
    const { preSelectedAnswer, hasAnswered } = get();
    if (hasAnswered || !preSelectedAnswer) return;
    await get().submitAnswer(preSelectedAnswer);
  },

  submitAnswer: async (answer) => {
    const { hasAnswered, activeEffects, currentQuestion } = get();
    const currentPlayer = useQuizStore.getState().currentPlayer;
    const sessionCode = useQuizStore.getState().sessionCode;
    const playerId = currentPlayer?.id;
    
    if (!playerId) {
      console.error('❌ No player ID');
      return;
    }
    
    if (hasAnswered) {
      console.log('⚠️ Already answered');
      return;
    }
    
    if (activeEffects.blocks[playerId]) {
      console.log('🚫 Player is blocked');
      return;
    }

    const isCorrect = answer === currentQuestion?.correct_answer;
    const timestamp = Date.now();

    // Check double points from both live state AND sessionStorage fallback
    const basePoints = 5;
    let hasDoublePoints = !!activeEffects.doublePoints[playerId];

    // Fallback: check sessionStorage in case broadcast was missed
    if (!hasDoublePoints) {
      try {
        const savedEffects = sessionStorage.getItem('qb_effects');
        if (savedEffects) {
          const parsed = JSON.parse(savedEffects);
          if (parsed.questionIndex === get().currentQuestionIndex && parsed.effects?.doublePoints?.[playerId]) {
            hasDoublePoints = true;
            console.log('🃏 Double points restored from sessionStorage fallback');
          }
        }
      } catch (_) {}
    }

    let pointsToAdd = 0;
    if (isCorrect) {
      pointsToAdd = hasDoublePoints ? basePoints * 2 : basePoints;
    }

    console.log('🎯 Scoring:', { isCorrect, hasDoublePoints, basePoints, pointsToAdd, effectsState: JSON.stringify(activeEffects.doublePoints) });

    // ── STEAL: if this player is stolen, their points go to the thief ──
    const thiefId = activeEffects.steals[playerId];
    if (thiefId && pointsToAdd > 0) {
      console.log('💰 STOLEN! Transferring', pointsToAdd, 'points from', playerId, 'to thief', thiefId);
      // Give points to the thief instead
      try {
        const { error: stealRpcError } = await supabase.rpc('increment_player_score', {
          p_player_id: thiefId,
          p_points: pointsToAdd,
          p_is_correct: false, // Not their answer — just a point transfer
        });
        if (stealRpcError) {
          // Fallback: server-side API to bypass RLS
          const { data: thiefData } = await supabase
            .from('session_players')
            .select('total_score')
            .eq('id', thiefId)
            .single();
          if (thiefData) {
            await fetch('/api/update-player', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                playerId: thiefId,
                updates: { total_score: thiefData.total_score + pointsToAdd },
              }),
            });
          }
        }
      } catch (err) {
        console.error('❌ Steal transfer error:', err);
      }
      // Victim gets 0 points
      pointsToAdd = 0;
    }

    console.log('📤 Submitting answer:', answer, 'Correct:', isCorrect, 'Points to add:', pointsToAdd);

    try {
      // ✅ Essayer d'abord la fonction RPC
      const { error: rpcError } = await supabase.rpc('increment_player_score', {
        p_player_id: playerId,
        p_points: pointsToAdd,
        p_is_correct: isCorrect
      });

      if (rpcError) {
        console.log('⚠️ RPC not available, using server-side fallback:', rpcError.message);

        // Fallback: use server-side API to bypass RLS
        const { data: currentData, error: fetchError } = await supabase
          .from('session_players')
          .select('total_score, correct_answers, questions_answered, current_streak, best_streak')
          .eq('id', playerId)
          .single();

        if (fetchError || !currentData) {
          console.error('❌ Fetch error:', fetchError);
          return;
        }

        const newTotalScore = currentData.total_score + pointsToAdd;
        const newCorrectAnswers = isCorrect ? currentData.correct_answers + 1 : currentData.correct_answers;
        const newQuestionsAnswered = currentData.questions_answered + 1;
        const newStreak = isCorrect ? currentData.current_streak + 1 : 0;
        const newBestStreak = Math.max(currentData.best_streak, newStreak);

        // Use server-side API to bypass RLS
        const updateRes = await fetch('/api/update-player', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId,
            updates: {
              total_score: newTotalScore,
              correct_answers: newCorrectAnswers,
              questions_answered: newQuestionsAnswered,
              current_streak: newStreak,
              best_streak: newBestStreak,
              last_activity: new Date().toISOString(),
            },
          }),
        });

        if (!updateRes.ok) {
          console.error('❌ Server update error');
          return;
        }

        // Update local state directly (no extra fetch needed)
        useQuizStore.setState((state) => {
          if (state.currentPlayer) {
            return {
              currentPlayer: {
                ...state.currentPlayer,
                total_score: newTotalScore,
                correct_answers: newCorrectAnswers,
                questions_answered: newQuestionsAnswered,
                current_streak: newStreak,
                best_streak: newBestStreak,
              }
            };
          }
          return state;
        });
      } else {
        console.log('✅ RPC success');

        // Single fetch for score + streak after RPC
        const { data: updatedPlayer } = await supabase
          .from('session_players')
          .select('total_score, correct_answers, questions_answered, current_streak, best_streak')
          .eq('id', playerId)
          .single();

        if (updatedPlayer) {
          const newStreak = isCorrect ? updatedPlayer.current_streak + 1 : 0;
          const newBestStreak = Math.max(updatedPlayer.best_streak, newStreak);

          // Use server-side API to bypass RLS for streak update
          fetch('/api/update-player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              playerId,
              updates: { current_streak: newStreak, best_streak: newBestStreak },
            }),
          }).catch(err => console.warn('⚠️ Streak update failed:', err));

          useQuizStore.setState((state) => {
            if (state.currentPlayer) {
              return {
                currentPlayer: {
                  ...state.currentPlayer,
                  total_score: updatedPlayer.total_score,
                  correct_answers: updatedPlayer.correct_answers,
                  questions_answered: updatedPlayer.questions_answered,
                  current_streak: newStreak,
                  best_streak: newBestStreak,
                }
              };
            }
            return state;
          });
        }
      }

      // Broadcaster
      if (sessionCode && globalRealtimeChannel) {
        await globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'score_updated',
          payload: { playerId, timestamp }
        });

        await globalRealtimeChannel.send({
          type: 'broadcast',
          event: 'answer_submitted',
          payload: {
            playerId: currentPlayer?.id,
            playerName: currentPlayer?.player_name,
            avatarEmoji: currentPlayer?.avatar_emoji,
            isCorrect,
            answerText: answer,
            timeTaken: timestamp - (get().phaseEndTime
              ? get().phaseEndTime! - 24000  // answer_selection = 24s
              : timestamp),
          }
        });
      }

    } catch (error) {
      console.error('❌ Submit answer error:', error);
    }

    set({
      selectedAnswer: answer,
      hasAnswered: true,
      answerSubmittedAt: timestamp,
    });

    // Persist answer state so reconnecting player knows they already answered
    try {
      const { currentQuestionIndex } = get();
      sessionStorage.setItem('qb_answered', JSON.stringify({
        questionIndex: currentQuestionIndex,
        answered: true,
        selectedAnswer: answer,
        timestamp,
      }));
    } catch (_) {}
  },

  resetForNextQuestion: () => {
    set({
      preSelectedAnswer: null,
      selectedAnswer: null,
      hasAnswered: false,
      answerSubmittedAt: null,
    });
  },

  initializeInventory: (jokerInventory) => {
    console.log('🎯 Initializing joker inventory:', jokerInventory);
    set({ playerInventory: jokerInventory });
    // Also save to sessionStorage for instant restore on refresh
    try {
      sessionStorage.setItem('qb_inventory', JSON.stringify(jokerInventory));
    } catch (_) {}
  },

  listenToPhaseChanges: (sessionCode) => {
    if (globalRealtimeChannel) {
      console.log('🔌 Closing previous channel');
      supabase.removeChannel(globalRealtimeChannel);
      globalRealtimeChannel = null;
    }
    
    console.log('👂 Listening to phase changes for session:', sessionCode);
    
    const channelName = `quiz_session_${sessionCode}`;
    globalRealtimeChannel = supabase.channel(channelName);

    globalRealtimeChannel
      .on('broadcast', { event: 'phase_change' }, (payload: { payload: PhaseData }) => {
        console.log('📢 Phase change received:', payload.payload.phase);
        get().setPhaseData(payload.payload);
      })
      .on('broadcast', { event: 'score_updated' }, () => {
        const sessionId = useQuizStore.getState().currentSession?.id;
        if (sessionId) {
          debouncedScoreRefresh(sessionId);
        }
      })
      .on('broadcast', { event: 'answer_submitted' }, () => {
        set(state => ({ answeredCount: state.answeredCount + 1 }));
      })
      .on('broadcast', { event: 'joker_effect' }, (msg: { payload: { jokerType: string; playerId: string; targetPlayerId: string | null } }) => {
        const { jokerType, playerId, targetPlayerId } = msg.payload;
        const currentEffects = get().activeEffects;
        console.log('🃏 Joker effect received:', jokerType, 'from', playerId, 'target', targetPlayerId);

        if (jokerType === 'protection') {
          set({ activeEffects: { ...currentEffects, protections: { ...currentEffects.protections, [playerId]: true } } });
        } else if (jokerType === 'double_points') {
          set({ activeEffects: { ...currentEffects, doublePoints: { ...currentEffects.doublePoints, [playerId]: true } } });
        } else if (jokerType === 'block' && targetPlayerId) {
          if (currentEffects.protections[targetPlayerId]) {
            console.log('🛡️ Block effect ignored — target is protected');
          } else {
            set({ activeEffects: { ...currentEffects, blocks: { ...currentEffects.blocks, [targetPlayerId]: true } } });
          }
        } else if (jokerType === 'steal' && targetPlayerId) {
          if (currentEffects.protections[targetPlayerId]) {
            console.log('🛡️ Steal effect ignored — target is protected');
          } else if (currentEffects.steals[targetPlayerId]) {
            console.log('💰 Steal effect ignored — target already stolen');
          } else {
            set({ activeEffects: { ...currentEffects, steals: { ...currentEffects.steals, [targetPlayerId]: playerId } } });
          }
        }

        // Persist effects to sessionStorage so they survive page refresh
        try {
          const updatedEffects = get().activeEffects;
          const questionIdx = get().currentQuestionIndex;
          sessionStorage.setItem('qb_effects', JSON.stringify({
            questionIndex: questionIdx,
            effects: updatedEffects,
          }));
        } catch (_) {}
      })
      .subscribe((status: string) => {
        console.log('📡 Realtime status:', status);
      });
  },

  reconnectToSession: async (sessionId, sessionCode) => {
    console.log('🔄 Reconnecting player to session...');

    // 1. Check if channel is still alive; if not, re-subscribe
    const channelState = globalRealtimeChannel?.state;
    if (!globalRealtimeChannel || channelState === 'closed' || channelState === 'errored') {
      console.log('🔌 Channel dead/missing, re-subscribing...');
      get().listenToPhaseChanges(sessionCode);
    }

    // 2. Fetch current phase from DB
    try {
      const { data: session, error } = await supabase
        .from('quiz_sessions')
        .select('settings, current_question, status')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Failed to fetch session for reconnection:', error);
        return;
      }

      // If quiz ended while we were away
      if (session.status === 'finished' || session.status === 'completed') {
        console.log('🏁 Quiz ended while disconnected');
        return;
      }

      const settings = session.settings as Record<string, unknown>;
      const currentPhase = settings?.currentPhase as PhaseData | undefined;

      if (currentPhase) {
        console.log('✅ Resynced to phase:', currentPhase.phase, 'question:', currentPhase.questionIndex);
        get().setPhaseData(currentPhase);
      }
    } catch (error) {
      console.error('Reconnection error:', error);
    }
  },

  getChannelState: () => {
    if (!globalRealtimeChannel) return null;
    return globalRealtimeChannel.state || null;
  },

  broadcastPhaseChange: async (sessionCode, data) => {
    try {
      const channelName = `quiz_session_${sessionCode}`;
      const channel = supabase.channel(channelName);
      
      await channel.send({
        type: 'broadcast',
        event: 'phase_change',
        payload: data,
      });

      console.log('✅ Phase broadcast sent');
    } catch (error) {
      console.error('❌ Broadcast error:', error);
    }
  },
}));
