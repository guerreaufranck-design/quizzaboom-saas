import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  ArrowLeft, ChevronDown, ChevronRight,
  Rocket, Clock, Swords, Monitor, Tv, Globe, Users, Mail, BookOpen,
} from 'lucide-react';

interface GuideSection {
  key: string;
  icon: React.ReactNode;
  color: string;
}

const SECTIONS: GuideSection[] = [
  { key: 'gettingStarted', icon: <Rocket className="w-6 h-6" />, color: 'text-qb-cyan' },
  { key: 'gamePhases', icon: <Clock className="w-6 h-6" />, color: 'text-qb-purple' },
  { key: 'jokers', icon: <Swords className="w-6 h-6" />, color: 'text-qb-magenta' },
  { key: 'hosting', icon: <Monitor className="w-6 h-6" />, color: 'text-qb-orange' },
  { key: 'tvDisplay', icon: <Tv className="w-6 h-6" />, color: 'text-qb-cyan' },
  { key: 'remotePlay', icon: <Globe className="w-6 h-6" />, color: 'text-qb-yellow' },
  { key: 'playerExperience', icon: <Users className="w-6 h-6" />, color: 'text-qb-purple' },
  { key: 'emailResults', icon: <Mail className="w-6 h-6" />, color: 'text-qb-magenta' },
];

export const Guide: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openSections, setOpenSections] = useState<Set<number>>(new Set([0]));

  const toggleSection = (index: number) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const renderContent = (sectionKey: string) => {
    const items: string[] = [];
    // Collect all numbered content items for this section
    for (let i = 1; i <= 20; i++) {
      const key = `guide.${sectionKey}.step${i}`;
      const val = t(key, '');
      if (val && val !== key) {
        items.push(val);
      } else {
        break;
      }
    }

    return (
      <div className="space-y-3">
        <p className="text-white/80 text-lg leading-relaxed">
          {t(`guide.${sectionKey}.description`)}
        </p>
        {items.length > 0 && (
          <ul className="space-y-2 ml-1">
            {items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-white/70">
                <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold text-white/90 shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
        {/* Optional tip */}
        {t(`guide.${sectionKey}.tip`, '') !== `guide.${sectionKey}.tip` && t(`guide.${sectionKey}.tip`, '') && (
          <div className="mt-4 p-3 bg-qb-cyan/10 border border-qb-cyan/30 rounded-lg">
            <p className="text-qb-cyan text-sm font-medium">
              {t(`guide.${sectionKey}.tip`)}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              icon={<ArrowLeft />}
            >
              {t('guide.back')}
            </Button>
          </div>

          <div className="text-center mb-12">
            <BookOpen className="w-16 h-16 text-qb-cyan mx-auto mb-4" />
            <h1 className="text-5xl font-bold gradient-primary bg-clip-text text-transparent mb-4">
              {t('guide.title')}
            </h1>
            <p className="text-xl text-white/70">
              {t('guide.subtitle')}
            </p>
          </div>

          {/* Accordion Sections */}
          <div className="space-y-4">
            {SECTIONS.map((section, index) => {
              const isOpen = openSections.has(index);
              return (
                <Card key={section.key} gradient className="overflow-hidden">
                  <button
                    onClick={() => toggleSection(index)}
                    className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ${section.color}`}>
                        {section.icon}
                      </div>
                      <h2 className="text-xl font-bold text-white">
                        {t(`guide.${section.key}.title`)}
                      </h2>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-5 h-5 text-white/50" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-white/50" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 pt-0 border-t border-white/10">
                      <div className="pt-4">
                        {renderContent(section.key)}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Footer CTA */}
          <div className="mt-12 text-center">
            <Card gradient className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">{t('guide.readyTitle')}</h3>
              <p className="text-white/70 mb-6">{t('guide.readyDesc')}</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Button gradient size="lg" onClick={() => navigate('/create')}>
                  {t('guide.createQuiz')}
                </Button>
                <Button variant="secondary" size="lg" onClick={() => navigate('/join')}>
                  {t('guide.joinQuiz')}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
