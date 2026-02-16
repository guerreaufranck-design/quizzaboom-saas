import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface TutorialSlide {
  emoji: string;
  titleKey: string;
  descriptionKey: string;
  descriptionParams?: Record<string, string | number>;
}

interface TutorialSlidesProps {
  slides: TutorialSlide[];
  secondsPerSlide?: number;
  variant: 'tv' | 'mobile';
}

export const TutorialSlides: React.FC<TutorialSlidesProps> = ({
  slides,
  secondsPerSlide = 6,
  variant,
}) => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    if (currentSlide >= slides.length) return;

    const timer = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
        setFadeIn(true);
      }, 400);
    }, secondsPerSlide * 1000);

    return () => clearInterval(timer);
  }, [currentSlide, slides.length, secondsPerSlide]);

  if (slides.length === 0) return null;

  const slide = slides[currentSlide];
  const isTV = variant === 'tv';
  const progress = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div className={`flex flex-col items-center justify-center ${isTV ? 'h-screen p-12' : 'min-h-[60vh] p-6'} bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900`}>
      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className={`rounded-full transition-all duration-300 ${
              idx === currentSlide
                ? (isTV ? 'w-6 h-6 bg-white' : 'w-4 h-4 bg-white')
                : idx < currentSlide
                  ? (isTV ? 'w-6 h-6 bg-white/50' : 'w-4 h-4 bg-white/50')
                  : (isTV ? 'w-6 h-6 bg-white/20' : 'w-4 h-4 bg-white/20')
            }`}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className={`text-center max-w-4xl transition-all duration-400 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className={`mb-6 ${isTV ? 'text-9xl' : 'text-6xl'}`}>
          {slide.emoji}
        </div>
        <h2 className={`font-extrabold text-white mb-6 drop-shadow-lg ${isTV ? 'text-6xl' : 'text-3xl'}`}>
          {t(slide.titleKey)}
        </h2>
        <p className={`text-white/90 font-semibold leading-relaxed ${isTV ? 'text-4xl' : 'text-xl'}`}>
          {t(slide.descriptionKey, slide.descriptionParams || {})}
        </p>
      </div>

      {/* Progress bar */}
      <div className={`mt-10 w-full max-w-md bg-white/20 rounded-full overflow-hidden ${isTV ? 'h-3' : 'h-2'}`}>
        <div
          className="h-full bg-white/70 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Build the tutorial slides based on session settings.
 */
export function buildTutorialSlides(settings: {
  hasJokers: boolean;
  jokerCount?: number;
  hasBreaks: boolean;
  breakCount?: number;
  breakDuration?: number;
}): TutorialSlide[] {
  const slides: TutorialSlide[] = [];

  // Slide 1: Welcome
  slides.push({
    emoji: '🎉',
    titleKey: 'tutorial.welcomeTitle',
    descriptionKey: 'tutorial.welcomeDesc',
  });

  // Slide 2: How it works
  slides.push({
    emoji: '📱',
    titleKey: 'tutorial.howItWorksTitle',
    descriptionKey: 'tutorial.howItWorksDesc',
  });

  // Slide 3: Answer change
  slides.push({
    emoji: '🔄',
    titleKey: 'tutorial.answerChangeTitle',
    descriptionKey: 'tutorial.answerChangeDesc',
  });

  if (settings.hasJokers) {
    // Slide 4: Jokers overview
    slides.push({
      emoji: '🃏',
      titleKey: 'tutorial.jokersTitle',
      descriptionKey: 'tutorial.jokersDesc',
      descriptionParams: { count: settings.jokerCount || 1 },
    });

    // Slide 5: Double Points
    slides.push({
      emoji: '⭐',
      titleKey: 'tutorial.doubleTitle',
      descriptionKey: 'tutorial.doubleDesc',
    });

    // Slide 6: Steal
    slides.push({
      emoji: '💰',
      titleKey: 'tutorial.stealTitle',
      descriptionKey: 'tutorial.stealDesc',
    });

    // Slide 7: Block
    slides.push({
      emoji: '🚫',
      titleKey: 'tutorial.blockTitle',
      descriptionKey: 'tutorial.blockDesc',
    });

    // Slide 8: Protection
    slides.push({
      emoji: '🛡️',
      titleKey: 'tutorial.protectionTitle',
      descriptionKey: 'tutorial.protectionDesc',
    });
  }

  if (settings.hasBreaks) {
    slides.push({
      emoji: '☕',
      titleKey: 'tutorial.breaksTitle',
      descriptionKey: 'tutorial.breaksDesc',
      descriptionParams: {
        count: settings.breakCount || 1,
        duration: settings.breakDuration || 5,
      },
    });
  }

  // Final slide: Get ready!
  slides.push({
    emoji: '🚀',
    titleKey: 'tutorial.readyTitle',
    descriptionKey: 'tutorial.readyDesc',
  });

  return slides;
}

export const TUTORIAL_SECONDS_PER_SLIDE = 8;
