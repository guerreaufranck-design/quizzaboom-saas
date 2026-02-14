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

  // ═══════════════════════════════════════════════════════════════
  // THEME ANNOUNCEMENT — Dramatic ascending fanfare C→E→G→C octave
  // ═══════════════════════════════════════════════════════════════
  const playFanfare = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      // Bass rumble underneath
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.value = 65;
      bassGain.gain.setValueAtTime(0, now);
      bassGain.gain.linearRampToValueAtTime(0.08, now + 0.1);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 1.5);

      // Ascending notes: C4→E4→G4→C5
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = now + i * 0.15;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.6);
        // Harmony: add third above for richness
        if (i === 3) {
          const harm = ctx.createOscillator();
          const harmGain = ctx.createGain();
          harm.type = 'sine';
          harm.frequency.value = freq * 1.25; // Major third above
          harmGain.gain.setValueAtTime(0, start);
          harmGain.gain.linearRampToValueAtTime(0.06, start + 0.03);
          harmGain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
          harm.connect(harmGain);
          harmGain.connect(ctx.destination);
          harm.start(start);
          harm.stop(start + 0.8);
        }
      });
    } catch (e) {}
  }, [isMuted, getAudioCtx]);

  // ═══════════════════════════════════════════════════════════════
  // QUESTION REVEAL — Whoosh sweep + bell strike
  // ═══════════════════════════════════════════════════════════════
  const playQuestionReveal = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      // Whoosh: frequency sweep down
      const swoosh = ctx.createOscillator();
      const swooshGain = ctx.createGain();
      swoosh.type = 'sawtooth';
      swoosh.frequency.setValueAtTime(1500, now);
      swoosh.frequency.exponentialRampToValueAtTime(300, now + 0.3);
      swooshGain.gain.setValueAtTime(0.06, now);
      swooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      swoosh.connect(swooshGain);
      swooshGain.connect(ctx.destination);
      swoosh.start(now);
      swoosh.stop(now + 0.4);

      // Bell strike at end of whoosh
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.type = 'sine';
      bell.frequency.value = 1046.5; // C6
      bellGain.gain.setValueAtTime(0, now + 0.25);
      bellGain.gain.linearRampToValueAtTime(0.1, now + 0.28);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      bell.connect(bellGain);
      bellGain.connect(ctx.destination);
      bell.start(now + 0.25);
      bell.stop(now + 1.2);
      // Bell harmonic
      const bellH = ctx.createOscillator();
      const bellHGain = ctx.createGain();
      bellH.type = 'sine';
      bellH.frequency.value = 1046.5 * 2.5;
      bellHGain.gain.setValueAtTime(0, now + 0.25);
      bellHGain.gain.linearRampToValueAtTime(0.03, now + 0.28);
      bellHGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      bellH.connect(bellHGain);
      bellHGain.connect(ctx.destination);
      bellH.start(now + 0.25);
      bellH.stop(now + 0.8);
    } catch (e) {}
  }, [isMuted, getAudioCtx]);

  // ═══════════════════════════════════════════════════════════════
  // APPLAUSE — Filtered white noise burst (simulated crowd)
  // ═══════════════════════════════════════════════════════════════
  const playApplause = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      const duration = 1.8;
      // Create white noise buffer
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Highpass filter to simulate applause texture
      const hpFilter = ctx.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.value = 800;
      hpFilter.Q.value = 0.5;

      // Bandpass for body
      const bpFilter = ctx.createBiquadFilter();
      bpFilter.type = 'bandpass';
      bpFilter.frequency.value = 3000;
      bpFilter.Q.value = 0.3;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.1);
      gain.gain.setValueAtTime(0.08, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(hpFilter);
      hpFilter.connect(bpFilter);
      bpFilter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + duration);
    } catch (e) {}
  }, [isMuted, getAudioCtx]);

  // ═══════════════════════════════════════════════════════════════
  // FOGHORN — Low sawtooth with amplitude modulation wobble
  // ═══════════════════════════════════════════════════════════════
  const playFoghorn = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      // Main low tone
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 100;

      // LFO for amplitude modulation (wobble)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 3;
      lfoGain.gain.value = 0.04;
      lfo.connect(lfoGain);

      const mainGain = ctx.createGain();
      mainGain.gain.setValueAtTime(0, now);
      mainGain.gain.linearRampToValueAtTime(0.1, now + 0.05);
      mainGain.gain.setValueAtTime(0.1, now + 0.3);
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      lfoGain.connect(mainGain.gain);
      osc.connect(mainGain);
      mainGain.connect(ctx.destination);

      osc.start(now);
      lfo.start(now);
      osc.stop(now + 0.7);
      lfo.stop(now + 0.7);
    } catch (e) {}
  }, [isMuted, getAudioCtx]);

  // ═══════════════════════════════════════════════════════════════
  // TRANSITION — Smooth 3-detuned-sine pad for intermission
  // ═══════════════════════════════════════════════════════════════
  const playTransition = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      const freqs = [440, 442, 438]; // Slightly detuned for richness
      freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.3); // Slow attack
        gain.gain.setValueAtTime(0.06, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5); // Slow release
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.5);
      });
    } catch (e) {}
  }, [isMuted, getAudioCtx]);

  // ═══════════════════════════════════════════════════════════════
  // JINGLE — Quick bright notes for commercial break
  // ═══════════════════════════════════════════════════════════════
  const playJingle = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5-E5-G5-C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const start = now + i * 0.1;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.25);
      });
    } catch (e) {}
  }, [isMuted, getAudioCtx]);

  // ═══════════════════════════════════════════════════════════════
  // VICTORY — Ascending arpeggio + white noise "fireworks"
  // ═══════════════════════════════════════════════════════════════
  const playVictory = useCallback(() => {
    if (isMuted) return;
    try {
      const ctx = getAudioCtx();
      const now = ctx.currentTime;
      // Ascending arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5→E5→G5→C6→E6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = now + i * 0.12;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.12, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.8);
      });

      // Sustained major chord at end (C5+E5+G5)
      [523.25, 659.25, 783.99].forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = now + 0.6;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.05, start + 0.1);
        gain.gain.setValueAtTime(0.05, start + 1.5);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 2.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 2.5);
      });

      // "Fireworks" noise bursts
      [0.3, 0.8, 1.3].forEach(delay => {
        const bufSize = ctx.sampleRate * 0.3;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1);
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2000;
        const gain = ctx.createGain();
        const start = now + delay;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.04, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        noise.connect(hp);
        hp.connect(gain);
        gain.connect(ctx.destination);
        noise.start(start);
        noise.stop(start + 0.3);
      });
    } catch (e) {}
  }, [isMuted, getAudioCtx]);

  // ═══════════════════════════════════════════════════════════════
  // TICK-TOCK — Progressive pitch acceleration during answer phase
  // ═══════════════════════════════════════════════════════════════
  const startTicking = useCallback((timeRemaining: number) => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
    }

    let remaining = timeRemaining;
    const totalTime = timeRemaining;
    const tick = () => {
      if (isMuted) return;
      // Progressive pitch: 800Hz → 1200Hz as time runs out
      const progress = 1 - (remaining / totalTime);
      const freq = 800 + progress * 400;
      const vol = 0.12 + progress * 0.1;
      playNote(freq, 0.05, vol, 'square');

      // Double-tick when < 5 seconds
      if (remaining <= 5) {
        setTimeout(() => {
          playNote(freq * 0.8, 0.04, vol * 0.7, 'square');
        }, 150);
      }

      remaining--;
    };

    tick();
    tickIntervalRef.current = setInterval(tick, 1000);
  }, [isMuted, playNote]);

  const stopTicking = useCallback(() => {
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  }, []);

  // Correct answer jingle (enhanced)
  const playCorrectSound = useCallback(() => {
    if (isMuted) return;
    playNote(523.25, 0.15, 0.15, 'triangle'); // C5
    setTimeout(() => playNote(659.25, 0.15, 0.15, 'triangle'), 100); // E5
    setTimeout(() => playNote(783.99, 0.3, 0.15, 'triangle'), 200); // G5
  }, [isMuted, playNote]);

  // Wrong answer buzz
  const playWrongSound = useCallback(() => {
    if (isMuted) return;
    playFoghorn();
  }, [isMuted, playFoghorn]);

  // Handle phase transitions — dispatch sounds per phase
  const onPhaseChange = useCallback((phase: GamePhase, timeRemaining: number) => {
    stopTicking();

    switch (phase) {
      case 'theme_announcement':
        playFanfare();
        break;
      case 'question_display':
        playQuestionReveal();
        break;
      case 'answer_selection':
        startTicking(timeRemaining);
        break;
      case 'intermission':
        playTransition();
        break;
      case 'commercial_break':
        playJingle();
        break;
      case 'quiz_complete':
        playVictory();
        break;
      // 'results' is handled by PlayerView (correct/incorrect)
    }
  }, [stopTicking, playFanfare, playQuestionReveal, startTicking, playTransition, playJingle, playVictory]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) {
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
    playApplause,
    playFoghorn,
    playFanfare,
    playQuestionReveal,
    playTransition,
    playJingle,
    playVictory,
    toggleMute,
    stopAll,
    isMuted,
  };
}
