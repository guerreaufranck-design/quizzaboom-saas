import { useRef, useCallback, useState } from 'react';
import type { GamePhase } from '../types/gamePhases';

export function useQuizAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Play a single note with envelope
  const playNote = useCallback((freq: number, duration: number, volume: number = 0.15, type: OscillatorType = 'triangle') => {
    if (isMuted) return;
    try {
      const ctx = getAudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context issues - fail silently
    }
  }, [isMuted, getAudioCtx]);

  // Tick-tock during answer_selection phase
  const startTicking = useCallback((timeRemaining: number) => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
    }

    let remaining = timeRemaining;
    const tick = () => {
      if (isMuted) return;
      // Normal tick
      const freq = remaining <= 5 ? 1200 : 800; // Higher pitch when urgent
      const vol = remaining <= 5 ? 0.2 : 0.12;
      playNote(freq, 0.05, vol, 'square');

      // Double-tick when < 5 seconds (tik-tak-tik-tak)
      if (remaining <= 5) {
        setTimeout(() => {
          playNote(freq * 0.8, 0.04, vol * 0.7, 'square');
        }, 150);
      }

      remaining--;
    };

    tick(); // Play first tick immediately
    tickIntervalRef.current = setInterval(tick, 1000);
  }, [isMuted, playNote]);

  const stopTicking = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  // Correct answer jingle
  const playCorrectSound = useCallback(() => {
    if (isMuted) return;
    playNote(523.25, 0.15, 0.15, 'triangle'); // C5
    setTimeout(() => playNote(659.25, 0.15, 0.15, 'triangle'), 100); // E5
    setTimeout(() => playNote(783.99, 0.3, 0.15, 'triangle'), 200); // G5
  }, [isMuted, playNote]);

  // Wrong answer buzz
  const playWrongSound = useCallback(() => {
    if (isMuted) return;
    playNote(200, 0.3, 0.1, 'sawtooth');
  }, [isMuted, playNote]);

  // Handle phase transitions — tick-tock only during answer_selection
  const onPhaseChange = useCallback((phase: GamePhase, timeRemaining: number) => {
    stopTicking();

    if (phase === 'answer_selection') {
      startTicking(timeRemaining);
    }
  }, [stopTicking, startTicking]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
        // Muting — stop ticking
        stopTicking();
      }
      return !prev;
    });
  }, [stopTicking]);

  const stopAll = useCallback(() => {
    stopTicking();
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try { audioCtxRef.current.close(); } catch (e) {}
      audioCtxRef.current = null;
    }
  }, [stopTicking]);

  return {
    startTicking,
    stopTicking,
    onPhaseChange,
    playCorrectSound,
    playWrongSound,
    toggleMute,
    stopAll,
    isMuted,
  };
}
