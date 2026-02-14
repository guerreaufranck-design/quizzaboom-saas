import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAppNavigate } from '../hooks/useAppNavigate';
import {
  ArrowLeft, Bot, CreditCard, Gamepad2, Users, Tv, Smartphone, QrCode,
  Shield, Swords, Trophy, Zap, ChevronDown, ChevronUp, Timer,
  Play, Pause, BarChart3, Mail, Globe, Star, Crown, BookOpen,
  MousePointer, Volume2, Download, CheckCircle, AlertCircle, Sparkles,
  MessageCircle, Settings, UserPlus, LogIn, Monitor,
} from 'lucide-react';

interface AccordionProps {
  title: string;
  icon: React.ReactNode;
  iconColor: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const Accordion: React.FC<AccordionProps> = ({ title, icon, iconColor, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white/5 hover:bg-white/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
            {icon}
          </div>
          <span className="text-lg font-bold text-white text-left">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5 text-white/60" /> : <ChevronDown className="w-5 h-5 text-white/60" />}
      </button>
      {isOpen && (
        <div className="px-5 py-4 bg-white/[0.02] space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tip?: string;
}

const Step: React.FC<StepProps> = ({ number, title, description, icon, color, tip }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center shrink-0">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${color}`}>
        {number}
      </div>
      <div className="w-0.5 flex-1 bg-white/10 mt-2" />
    </div>
    <div className="pb-8">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-white/60">{icon}</span>
        <h4 className="text-white font-bold">{title}</h4>
      </div>
      <p className="text-white/60 text-sm leading-relaxed">{description}</p>
      {tip && (
        <div className="mt-2 flex items-start gap-2 bg-qb-cyan/10 border border-qb-cyan/20 rounded-lg px-3 py-2">
          <Sparkles className="w-4 h-4 text-qb-cyan shrink-0 mt-0.5" />
          <span className="text-qb-cyan text-xs">{tip}</span>
        </div>
      )}
    </div>
  </div>
);

export const Tutorial: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useAppNavigate();

  return (
    <div className="min-h-screen bg-qb-dark py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('dashboard')}
              icon={<ArrowLeft />}
            >
              {t('common.dashboard')}
            </Button>
          </div>

          {/* Hero */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-qb-purple/20 border border-qb-purple/30 rounded-full mb-6">
              <BookOpen className="w-5 h-5 text-qb-purple" />
              <span className="text-qb-purple font-bold">{t('tutorial.badge')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t('tutorial.title')}
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              {t('tutorial.subtitle')}
            </p>
          </div>

          {/* Quick nav */}
          <Card gradient className="p-5 mb-10">
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3">{t('tutorial.tableOfContents')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { icon: <UserPlus className="w-4 h-4" />, label: t('tutorial.nav.account'), href: '#account' },
                { icon: <CreditCard className="w-4 h-4" />, label: t('tutorial.nav.credits'), href: '#credits' },
                { icon: <Bot className="w-4 h-4" />, label: t('tutorial.nav.createQuiz'), href: '#create' },
                { icon: <Settings className="w-4 h-4" />, label: t('tutorial.nav.configure'), href: '#configure' },
                { icon: <Play className="w-4 h-4" />, label: t('tutorial.nav.hostQuiz'), href: '#host' },
                { icon: <Smartphone className="w-4 h-4" />, label: t('tutorial.nav.joinQuiz'), href: '#join' },
                { icon: <Tv className="w-4 h-4" />, label: t('tutorial.nav.tvDisplay'), href: '#tv' },
                { icon: <Trophy className="w-4 h-4" />, label: t('tutorial.nav.jokers'), href: '#jokers' },
                { icon: <Star className="w-4 h-4" />, label: t('tutorial.nav.tips'), href: '#tips' },
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-colors"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </Card>

          {/* Sections */}
          <div className="space-y-4">

            {/* ====== 1. ACCOUNT ====== */}
            <div id="account">
              <Accordion
                title={t('tutorial.account.title')}
                icon={<UserPlus className="w-5 h-5 text-white" />}
                iconColor="bg-qb-purple"
                defaultOpen
              >
                <Step
                  number={1}
                  title={t('tutorial.account.step1Title')}
                  description={t('tutorial.account.step1Desc')}
                  icon={<Globe className="w-4 h-4" />}
                  color="bg-qb-purple"
                />
                <Step
                  number={2}
                  title={t('tutorial.account.step2Title')}
                  description={t('tutorial.account.step2Desc')}
                  icon={<LogIn className="w-4 h-4" />}
                  color="bg-qb-purple"
                  tip={t('tutorial.account.step2Tip')}
                />
                <Step
                  number={3}
                  title={t('tutorial.account.step3Title')}
                  description={t('tutorial.account.step3Desc')}
                  icon={<Mail className="w-4 h-4" />}
                  color="bg-qb-purple"
                />
              </Accordion>
            </div>

            {/* ====== 2. CREDITS ====== */}
            <div id="credits">
              <Accordion
                title={t('tutorial.credits.title')}
                icon={<CreditCard className="w-5 h-5 text-white" />}
                iconColor="bg-qb-cyan"
              >
                <p className="text-white/60 text-sm leading-relaxed">{t('tutorial.credits.intro')}</p>

                {/* Pricing table */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  {[
                    { name: 'Free', price: '$0', players: '5', color: 'border-white/20' },
                    { name: 'Party', price: '$1.99', players: '15', color: 'border-qb-cyan/40' },
                    { name: 'Mega Party', price: '$4.99', players: '50', color: 'border-qb-purple/40' },
                    { name: 'Pro Event', price: '$9.99', players: '150', color: 'border-qb-magenta/40' },
                  ].map((plan, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border ${plan.color} bg-white/5 text-center`}>
                      <div className="text-white font-bold text-sm">{plan.name}</div>
                      <div className="text-2xl font-bold text-white mt-1">{plan.price}</div>
                      <div className="text-white/50 text-xs mt-1">
                        <Users className="w-3 h-3 inline mr-1" />
                        {t('tutorial.credits.upToPlayers', { count: Number(plan.players) })}
                      </div>
                    </div>
                  ))}
                </div>

                <Step
                  number={1}
                  title={t('tutorial.credits.step1Title')}
                  description={t('tutorial.credits.step1Desc')}
                  icon={<CreditCard className="w-4 h-4" />}
                  color="bg-qb-cyan"
                />
                <Step
                  number={2}
                  title={t('tutorial.credits.step2Title')}
                  description={t('tutorial.credits.step2Desc')}
                  icon={<CheckCircle className="w-4 h-4" />}
                  color="bg-qb-cyan"
                />
                <Step
                  number={3}
                  title={t('tutorial.credits.step3Title')}
                  description={t('tutorial.credits.step3Desc')}
                  icon={<Gamepad2 className="w-4 h-4" />}
                  color="bg-qb-cyan"
                  tip={t('tutorial.credits.step3Tip')}
                />
              </Accordion>
            </div>

            {/* ====== 3. CREATE QUIZ ====== */}
            <div id="create">
              <Accordion
                title={t('tutorial.createQuiz.title')}
                icon={<Bot className="w-5 h-5 text-white" />}
                iconColor="bg-qb-magenta"
              >
                <Step
                  number={1}
                  title={t('tutorial.createQuiz.step1Title')}
                  description={t('tutorial.createQuiz.step1Desc')}
                  icon={<MousePointer className="w-4 h-4" />}
                  color="bg-qb-magenta"
                />
                <Step
                  number={2}
                  title={t('tutorial.createQuiz.step2Title')}
                  description={t('tutorial.createQuiz.step2Desc')}
                  icon={<Star className="w-4 h-4" />}
                  color="bg-qb-magenta"
                  tip={t('tutorial.createQuiz.step2Tip')}
                />
                <Step
                  number={3}
                  title={t('tutorial.createQuiz.step3Title')}
                  description={t('tutorial.createQuiz.step3Desc')}
                  icon={<BarChart3 className="w-4 h-4" />}
                  color="bg-qb-magenta"
                />
                <Step
                  number={4}
                  title={t('tutorial.createQuiz.step4Title')}
                  description={t('tutorial.createQuiz.step4Desc')}
                  icon={<Globe className="w-4 h-4" />}
                  color="bg-qb-magenta"
                />
                <Step
                  number={5}
                  title={t('tutorial.createQuiz.step5Title')}
                  description={t('tutorial.createQuiz.step5Desc')}
                  icon={<Bot className="w-4 h-4" />}
                  color="bg-qb-magenta"
                  tip={t('tutorial.createQuiz.step5Tip')}
                />

                {/* Quiz modes */}
                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-white font-bold mb-3">{t('tutorial.createQuiz.modesTitle')}</h4>
                  <div className="space-y-2">
                    {[
                      { emoji: '📚', name: t('tutorial.createQuiz.modeStandard'), desc: t('tutorial.createQuiz.modeStandardDesc') },
                      { emoji: '🎭', name: t('tutorial.createQuiz.modeFunny'), desc: t('tutorial.createQuiz.modeFunnyDesc') },
                      { emoji: '👶', name: t('tutorial.createQuiz.modeKids'), desc: t('tutorial.createQuiz.modeKidsDesc') },
                    ].map((mode, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <span className="text-xl">{mode.emoji}</span>
                        <div>
                          <span className="text-white font-bold text-sm">{mode.name}</span>
                          <p className="text-white/50 text-xs">{mode.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-white font-bold mb-3">{t('tutorial.createQuiz.difficultyTitle')}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: t('create.easy'), desc: t('tutorial.createQuiz.easyDesc'), color: 'text-green-400', bg: 'bg-green-500/10' },
                      { label: t('create.medium'), desc: t('tutorial.createQuiz.mediumDesc'), color: 'text-qb-yellow', bg: 'bg-qb-yellow/10' },
                      { label: t('create.hard'), desc: t('tutorial.createQuiz.hardDesc'), color: 'text-red-400', bg: 'bg-red-500/10' },
                    ].map((diff, idx) => (
                      <div key={idx} className={`p-3 rounded-xl text-center ${diff.bg}`}>
                        <div className={`font-bold text-sm ${diff.color}`}>{diff.label}</div>
                        <div className="text-white/50 text-xs mt-1">{diff.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Accordion>
            </div>

            {/* ====== 4. CONFIGURE OPTIONS ====== */}
            <div id="configure">
              <Accordion
                title={t('tutorial.configure.title')}
                icon={<Settings className="w-5 h-5 text-white" />}
                iconColor="bg-qb-orange"
              >
                {/* Strategic mode */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Swords className="w-5 h-5 text-qb-purple" />
                    <h4 className="text-white font-bold">{t('tutorial.configure.strategicTitle')}</h4>
                  </div>
                  <p className="text-white/60 text-sm mb-3">{t('tutorial.configure.strategicDesc')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: <Shield className="w-4 h-4" />, name: t('player.jokerProtection'), desc: t('tutorial.configure.jokerProtectionDesc'), color: 'text-green-400' },
                      { icon: <Swords className="w-4 h-4" />, name: t('player.jokerBlock'), desc: t('tutorial.configure.jokerBlockDesc'), color: 'text-red-400' },
                      { icon: <Crown className="w-4 h-4" />, name: t('player.jokerSteal'), desc: t('tutorial.configure.jokerStealDesc'), color: 'text-qb-yellow' },
                      { icon: <Zap className="w-4 h-4" />, name: t('player.jokerDouble'), desc: t('tutorial.configure.jokerDoubleDesc'), color: 'text-qb-cyan' },
                    ].map((joker, idx) => (
                      <div key={idx} className="p-3 bg-white/5 rounded-lg">
                        <div className={`flex items-center gap-2 mb-1 ${joker.color}`}>
                          {joker.icon}
                          <span className="font-bold text-xs">{joker.name}</span>
                        </div>
                        <p className="text-white/50 text-xs">{joker.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Commercial breaks */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Pause className="w-5 h-5 text-qb-orange" />
                    <h4 className="text-white font-bold">{t('tutorial.configure.breaksTitle')}</h4>
                  </div>
                  <p className="text-white/60 text-sm">{t('tutorial.configure.breaksDesc')}</p>
                  <div className="mt-2 flex items-start gap-2 bg-qb-orange/10 border border-qb-orange/20 rounded-lg px-3 py-2">
                    <Sparkles className="w-4 h-4 text-qb-orange shrink-0 mt-0.5" />
                    <span className="text-qb-orange text-xs">{t('tutorial.configure.breaksTip')}</span>
                  </div>
                </div>

                {/* Team mode */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 mt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-qb-cyan" />
                    <h4 className="text-white font-bold">{t('tutorial.configure.teamTitle')}</h4>
                  </div>
                  <p className="text-white/60 text-sm">{t('tutorial.configure.teamDesc')}</p>
                </div>
              </Accordion>
            </div>

            {/* ====== 5. HOST QUIZ ====== */}
            <div id="host">
              <Accordion
                title={t('tutorial.hostQuiz.title')}
                icon={<Play className="w-5 h-5 text-white" />}
                iconColor="bg-green-500"
              >
                <Step
                  number={1}
                  title={t('tutorial.hostQuiz.step1Title')}
                  description={t('tutorial.hostQuiz.step1Desc')}
                  icon={<QrCode className="w-4 h-4" />}
                  color="bg-green-500"
                />
                <Step
                  number={2}
                  title={t('tutorial.hostQuiz.step2Title')}
                  description={t('tutorial.hostQuiz.step2Desc')}
                  icon={<Monitor className="w-4 h-4" />}
                  color="bg-green-500"
                  tip={t('tutorial.hostQuiz.step2Tip')}
                />
                <Step
                  number={3}
                  title={t('tutorial.hostQuiz.step3Title')}
                  description={t('tutorial.hostQuiz.step3Desc')}
                  icon={<Users className="w-4 h-4" />}
                  color="bg-green-500"
                />
                <Step
                  number={4}
                  title={t('tutorial.hostQuiz.step4Title')}
                  description={t('tutorial.hostQuiz.step4Desc')}
                  icon={<Play className="w-4 h-4" />}
                  color="bg-green-500"
                />
                <Step
                  number={5}
                  title={t('tutorial.hostQuiz.step5Title')}
                  description={t('tutorial.hostQuiz.step5Desc')}
                  icon={<BarChart3 className="w-4 h-4" />}
                  color="bg-green-500"
                />
                <Step
                  number={6}
                  title={t('tutorial.hostQuiz.step6Title')}
                  description={t('tutorial.hostQuiz.step6Desc')}
                  icon={<Pause className="w-4 h-4" />}
                  color="bg-green-500"
                  tip={t('tutorial.hostQuiz.step6Tip')}
                />

                {/* Host controls overview */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 mt-2">
                  <h4 className="text-white font-bold mb-3">{t('tutorial.hostQuiz.controlsTitle')}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: <Play className="w-4 h-4" />, label: t('tutorial.hostQuiz.controlStart'), color: 'text-green-400' },
                      { icon: <Pause className="w-4 h-4" />, label: t('tutorial.hostQuiz.controlPause'), color: 'text-qb-yellow' },
                      { icon: <Volume2 className="w-4 h-4" />, label: t('tutorial.hostQuiz.controlMute'), color: 'text-qb-cyan' },
                      { icon: <Zap className="w-4 h-4" />, label: t('tutorial.hostQuiz.controlSkip'), color: 'text-qb-orange' },
                      { icon: <Mail className="w-4 h-4" />, label: t('tutorial.hostQuiz.controlEmail'), color: 'text-qb-purple' },
                      { icon: <Download className="w-4 h-4" />, label: t('tutorial.hostQuiz.controlExport'), color: 'text-qb-magenta' },
                    ].map((ctrl, idx) => (
                      <div key={idx} className={`flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg ${ctrl.color}`}>
                        {ctrl.icon}
                        <span className="text-xs font-medium text-white/80">{ctrl.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Accordion>
            </div>

            {/* ====== 6. JOIN QUIZ (PLAYERS) ====== */}
            <div id="join">
              <Accordion
                title={t('tutorial.joinQuiz.title')}
                icon={<Smartphone className="w-5 h-5 text-white" />}
                iconColor="bg-qb-yellow"
              >
                <Step
                  number={1}
                  title={t('tutorial.joinQuiz.step1Title')}
                  description={t('tutorial.joinQuiz.step1Desc')}
                  icon={<Globe className="w-4 h-4" />}
                  color="bg-qb-yellow"
                />
                <Step
                  number={2}
                  title={t('tutorial.joinQuiz.step2Title')}
                  description={t('tutorial.joinQuiz.step2Desc')}
                  icon={<QrCode className="w-4 h-4" />}
                  color="bg-qb-yellow"
                />
                <Step
                  number={3}
                  title={t('tutorial.joinQuiz.step3Title')}
                  description={t('tutorial.joinQuiz.step3Desc')}
                  icon={<UserPlus className="w-4 h-4" />}
                  color="bg-qb-yellow"
                  tip={t('tutorial.joinQuiz.step3Tip')}
                />
                <Step
                  number={4}
                  title={t('tutorial.joinQuiz.step4Title')}
                  description={t('tutorial.joinQuiz.step4Desc')}
                  icon={<Timer className="w-4 h-4" />}
                  color="bg-qb-yellow"
                />
                <Step
                  number={5}
                  title={t('tutorial.joinQuiz.step5Title')}
                  description={t('tutorial.joinQuiz.step5Desc')}
                  icon={<Trophy className="w-4 h-4" />}
                  color="bg-qb-yellow"
                />
              </Accordion>
            </div>

            {/* ====== 7. TV DISPLAY ====== */}
            <div id="tv">
              <Accordion
                title={t('tutorial.tvDisplay.title')}
                icon={<Tv className="w-5 h-5 text-white" />}
                iconColor="bg-qb-cyan"
              >
                <p className="text-white/60 text-sm leading-relaxed">{t('tutorial.tvDisplay.intro')}</p>
                <Step
                  number={1}
                  title={t('tutorial.tvDisplay.step1Title')}
                  description={t('tutorial.tvDisplay.step1Desc')}
                  icon={<Monitor className="w-4 h-4" />}
                  color="bg-qb-cyan"
                />
                <Step
                  number={2}
                  title={t('tutorial.tvDisplay.step2Title')}
                  description={t('tutorial.tvDisplay.step2Desc')}
                  icon={<Tv className="w-4 h-4" />}
                  color="bg-qb-cyan"
                  tip={t('tutorial.tvDisplay.step2Tip')}
                />
                <Step
                  number={3}
                  title={t('tutorial.tvDisplay.step3Title')}
                  description={t('tutorial.tvDisplay.step3Desc')}
                  icon={<Play className="w-4 h-4" />}
                  color="bg-qb-cyan"
                />

                {/* What TV shows */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 mt-2">
                  <h4 className="text-white font-bold mb-3">{t('tutorial.tvDisplay.showsTitle')}</h4>
                  <div className="space-y-2">
                    {[
                      { emoji: '📋', text: t('tutorial.tvDisplay.shows1') },
                      { emoji: '❓', text: t('tutorial.tvDisplay.shows2') },
                      { emoji: '⏱', text: t('tutorial.tvDisplay.shows3') },
                      { emoji: '📊', text: t('tutorial.tvDisplay.shows4') },
                      { emoji: '🏆', text: t('tutorial.tvDisplay.shows5') },
                      { emoji: '☕', text: t('tutorial.tvDisplay.shows6') },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span>{item.emoji}</span>
                        <span className="text-white/60 text-sm">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Accordion>
            </div>

            {/* ====== 8. STRATEGIC JOKERS ====== */}
            <div id="jokers">
              <Accordion
                title={t('tutorial.jokers.title')}
                icon={<Swords className="w-5 h-5 text-white" />}
                iconColor="bg-qb-purple"
              >
                <p className="text-white/60 text-sm leading-relaxed">{t('tutorial.jokers.intro')}</p>

                {/* Game phases */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 mt-4">
                  <h4 className="text-white font-bold mb-3">{t('tutorial.jokers.phasesTitle')}</h4>
                  <div className="space-y-3">
                    {[
                      { phase: '1', emoji: '🎯', name: t('tutorial.jokers.phase1'), desc: t('tutorial.jokers.phase1Desc'), color: 'border-qb-purple/40' },
                      { phase: '2', emoji: '🃏', name: t('tutorial.jokers.phase2'), desc: t('tutorial.jokers.phase2Desc'), color: 'border-qb-yellow/40' },
                      { phase: '3', emoji: '❓', name: t('tutorial.jokers.phase3'), desc: t('tutorial.jokers.phase3Desc'), color: 'border-qb-cyan/40' },
                      { phase: '4', emoji: '✍️', name: t('tutorial.jokers.phase4'), desc: t('tutorial.jokers.phase4Desc'), color: 'border-qb-magenta/40' },
                      { phase: '5', emoji: '📊', name: t('tutorial.jokers.phase5'), desc: t('tutorial.jokers.phase5Desc'), color: 'border-green-500/40' },
                    ].map((item, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border ${item.color} bg-white/5`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span>{item.emoji}</span>
                          <span className="text-white font-bold text-sm">{item.name}</span>
                        </div>
                        <p className="text-white/50 text-xs">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategy tips */}
                <div className="mt-4 p-4 bg-qb-purple/10 border border-qb-purple/20 rounded-xl">
                  <h4 className="text-qb-purple font-bold mb-2">{t('tutorial.jokers.strategyTitle')}</h4>
                  <ul className="space-y-1">
                    {[
                      t('tutorial.jokers.strategy1'),
                      t('tutorial.jokers.strategy2'),
                      t('tutorial.jokers.strategy3'),
                      t('tutorial.jokers.strategy4'),
                    ].map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-white/60 text-xs">
                        <span className="text-qb-purple mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Accordion>
            </div>

            {/* ====== 9. TIPS & FAQ ====== */}
            <div id="tips">
              <Accordion
                title={t('tutorial.tips.title')}
                icon={<Star className="w-5 h-5 text-white" />}
                iconColor="bg-qb-yellow"
              >
                {/* Pro tips */}
                <div className="space-y-3">
                  {[
                    { icon: <CheckCircle className="w-5 h-5 text-green-400" />, title: t('tutorial.tips.tip1Title'), desc: t('tutorial.tips.tip1Desc') },
                    { icon: <CheckCircle className="w-5 h-5 text-green-400" />, title: t('tutorial.tips.tip2Title'), desc: t('tutorial.tips.tip2Desc') },
                    { icon: <CheckCircle className="w-5 h-5 text-green-400" />, title: t('tutorial.tips.tip3Title'), desc: t('tutorial.tips.tip3Desc') },
                    { icon: <CheckCircle className="w-5 h-5 text-green-400" />, title: t('tutorial.tips.tip4Title'), desc: t('tutorial.tips.tip4Desc') },
                    { icon: <CheckCircle className="w-5 h-5 text-green-400" />, title: t('tutorial.tips.tip5Title'), desc: t('tutorial.tips.tip5Desc') },
                    { icon: <CheckCircle className="w-5 h-5 text-green-400" />, title: t('tutorial.tips.tip6Title'), desc: t('tutorial.tips.tip6Desc') },
                  ].map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl">
                      {tip.icon}
                      <div>
                        <h4 className="text-white font-bold text-sm">{tip.title}</h4>
                        <p className="text-white/50 text-xs">{tip.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* FAQ */}
                <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
                  <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-qb-cyan" />
                    {t('tutorial.tips.faqTitle')}
                  </h4>
                  <div className="space-y-4">
                    {[
                      { q: t('tutorial.tips.faq1Q'), a: t('tutorial.tips.faq1A') },
                      { q: t('tutorial.tips.faq2Q'), a: t('tutorial.tips.faq2A') },
                      { q: t('tutorial.tips.faq3Q'), a: t('tutorial.tips.faq3A') },
                      { q: t('tutorial.tips.faq4Q'), a: t('tutorial.tips.faq4A') },
                      { q: t('tutorial.tips.faq5Q'), a: t('tutorial.tips.faq5A') },
                    ].map((faq, idx) => (
                      <div key={idx}>
                        <div className="text-white font-bold text-sm">{faq.q}</div>
                        <div className="text-white/50 text-xs mt-1">{faq.a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Accordion>
            </div>
          </div>

          {/* CTA */}
          <Card gradient className="p-8 mt-10 text-center">
            <Sparkles className="w-10 h-10 text-qb-cyan mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{t('tutorial.cta.title')}</h2>
            <p className="text-white/60 mb-6">{t('tutorial.cta.subtitle')}</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button gradient size="lg" icon={<Zap />} onClick={() => navigate('create')}>
                {t('dashboard.createQuiz')}
              </Button>
              <Button variant="ghost" size="lg" onClick={() => navigate('dashboard')}>
                {t('common.dashboard')}
              </Button>
            </div>
            <p className="text-white/40 text-sm mt-4">
              {t('tutorial.cta.support')}{' '}
              <a href="mailto:support@quizzaboom.app" className="text-qb-cyan hover:underline">support@quizzaboom.app</a>
              {' '}{t('tutorial.cta.orChat')}{' '}
              <MessageCircle className="w-4 h-4 inline text-qb-cyan" />
            </p>
          </Card>

          {/* Bottom back button */}
          <div className="text-center mt-8">
            <Button
              variant="ghost"
              size="lg"
              icon={<ArrowLeft />}
              onClick={() => navigate('dashboard')}
            >
              {t('tutorial.backToDashboard')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
