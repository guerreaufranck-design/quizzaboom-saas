import { useCallback, useRef } from 'react';

/**
 * Web Audio API sound effects hook.
 * Generates sounds via oscillators — no audio files needed.
 */
export const useSoundEffects = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Silently fail if audio context not available
    }
  };

  const playCorrect = useCallback(() => {
    // Rising two-note chime
    playTone(523, 0.15, 'sine', 0.25); // C5
    setTimeout(() => playTone(659, 0.25, 'sine', 0.25), 100); // E5
  }, []);

  const playIncorrect = useCallback(() => {
    // Low buzz
    playTone(200, 0.3, 'sawtooth', 0.15);
  }, []);

  const playTick = useCallback(() => {
    // Short click
    playTone(800, 0.05, 'square', 0.1);
  }, []);

  const playVictory = useCallback(() => {
    // Quick ascending fanfare
    playTone(523, 0.15, 'sine', 0.2);  // C5
    setTimeout(() => playTone(659, 0.15, 'sine', 0.2), 120);  // E5
    setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 240);  // G5
    setTimeout(() => playTone(1047, 0.4, 'sine', 0.25), 360); // C6
  }, []);

  return { playCorrect, playIncorrect, playTick, playVictory };
};
