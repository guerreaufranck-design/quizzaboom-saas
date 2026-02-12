import { useRef, useCallback, useState, useEffect } from 'react';
import type { LanguageCode } from '../types/quiz';

const LANG_MAP: Record<LanguageCode, string[]> = {
  en: ['en-US', 'en-GB', 'en'],
  fr: ['fr-FR', 'fr'],
  de: ['de-DE', 'de'],
  es: ['es-ES', 'es-MX', 'es'],
};

const TTS_STORAGE_KEY = 'quizzaboom_tts_enabled';
const SPEECH_RATE = 0.85;
const WORDS_PER_SECOND = 2.5; // At rate 0.85

export function useQuizTTS(language: LanguageCode) {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const voicesLoadedRef = useRef(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(TTS_STORAGE_KEY) !== 'false'; // Default ON
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(false);

  // Find the best voice for the given language
  const findVoice = useCallback((lang: LanguageCode) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const voices = speechSynthesis.getVoices();
    if (!voices.length) return;

    voicesLoadedRef.current = true;
    const preferredLangs = LANG_MAP[lang];

    // Try each preferred language tag in order
    for (const preferred of preferredLangs) {
      // Exact match first
      const exact = voices.find(v => v.lang === preferred);
      if (exact) {
        voiceRef.current = exact;
        setIsVoiceAvailable(true);
        return;
      }
      // Prefix match (e.g., "fr" matches "fr-CA")
      const prefix = voices.find(v => v.lang.startsWith(preferred.split('-')[0]));
      if (prefix) {
        voiceRef.current = prefix;
        setIsVoiceAvailable(true);
        return;
      }
    }

    // No voice found for this language — we'll still try with utterance.lang
    voiceRef.current = null;
    setIsVoiceAvailable(false);
  }, []);

  // Load voices on mount + handle Chrome async voice loading
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    // Try immediately
    findVoice(language);

    // Chrome: voices may load asynchronously
    const handleVoicesChanged = () => {
      findVoice(language);
    };

    speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, [language, findVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!isTTSEnabled) return;
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    if (!text.trim()) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Set language (always works, even without specific voice)
    const langTag = LANG_MAP[language][0]; // e.g., 'fr-FR'
    utterance.lang = langTag;

    // Set voice if we found one (skip on iOS Safari where voice selection is unreliable)
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }

    utterance.rate = SPEECH_RATE;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  }, [isTTSEnabled, language]);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const toggleTTS = useCallback(() => {
    setIsTTSEnabled(prev => {
      const newValue = !prev;
      localStorage.setItem(TTS_STORAGE_KEY, String(newValue));
      if (!newValue) {
        // Disabling — cancel any ongoing speech
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          speechSynthesis.cancel();
        }
        setIsSpeaking(false);
      }
      return newValue;
    });
  }, []);

  const estimateDuration = useCallback((text: string): number => {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return Math.ceil(wordCount / WORDS_PER_SECOND) + 1; // +1s for synthesis startup
  }, []);

  return {
    speak,
    cancel,
    isSpeaking,
    isTTSEnabled,
    toggleTTS,
    isVoiceAvailable,
    estimateDuration,
  };
}
