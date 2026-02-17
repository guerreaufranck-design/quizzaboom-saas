import React from 'react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LanguageSelector } from '../components/LanguageSelector';
import { AnimatedLogo } from '../components/AnimatedLogo';
import {
  Bot, Tv, Smartphone, Users, TrendingUp, CheckCircle,
  ArrowRight, Trophy, Clock, PoundSterling, Star, Zap
} from 'lucide-react';

export const PubQuizUK: React.FC = () => {
  const navigate = useAppNavigate();

  return (
    <div className="min-h-screen bg-qb-dark">
      {/* HEADER */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex justify-between items-center">
          <LanguageSelector />
          <Button
            variant="ghost"
            onClick={() => navigate('auth')}
          >
            Start Free Trial
          </Button>
        </div>
      </div>

      {/* HERO SECTION */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <AnimatedLogo banner className="mx-auto max-w-3xl mb-6" />

            <h1 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-qb-magenta via-qb-cyan to-qb-purple bg-clip-text text-transparent">
              The UK's Smartest Pub Quiz Platform
            </h1>

            <p className="text-xl md:text-2xl text-white/80 mb-4 max-w-3xl mx-auto">
              Transform your pub quiz night with AI-powered automation. No question writing, no paper, no manual scoring.
            </p>

            <p className="text-lg text-qb-cyan mb-8 font-bold">
              🇬🇧 Trusted by 500+ UK pubs and bars • 30-day free trial
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button
                size="lg"
                onClick={() => navigate('auth')}
                icon={<ArrowRight />}
                className="text-lg px-8"
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => navigate('pricing')}
                className="text-lg px-8"
              >
                See Pricing
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-2 text-qb-yellow">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
              <span className="text-white/80 ml-2">4.8/5 from 150+ UK landlords</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-16 bg-gradient-to-b from-qb-dark to-qb-purple/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-white">
              Running a Traditional Pub Quiz is <span className="text-qb-magenta">Exhausting</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="p-6 border-red-500/30">
                <div className="text-red-400 mb-3">❌</div>
                <h3 className="text-lg font-bold text-white mb-2">4+ Hours Writing Questions</h3>
                <p className="text-white/70">Every single week, spending your precious time researching and writing 30-50 questions</p>
              </Card>

              <Card className="p-6 border-red-500/30">
                <div className="text-red-400 mb-3">❌</div>
                <h3 className="text-lg font-bold text-white mb-2">Manual Scoring Chaos</h3>
                <p className="text-white/70">Collecting answer sheets, marking them, calculating scores while punters wait impatiently</p>
              </Card>

              <Card className="p-6 border-red-500/30">
                <div className="text-red-400 mb-3">❌</div>
                <h3 className="text-lg font-bold text-white mb-2">Printing Costs Stack Up</h3>
                <p className="text-white/70">£200-400/year on paper, ink, and answer sheets that get binned after one use</p>
              </Card>

              <Card className="p-6 border-red-500/30">
                <div className="text-red-400 mb-3">❌</div>
                <h3 className="text-lg font-bold text-white mb-2">Arguments & Disputes</h3>
                <p className="text-white/70">"My answer was right!", "That's not fair!" - spending 20 mins debating answers</p>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-qb-cyan mb-4">There's a better way 👇</p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-4 text-white">
              QuizzaBoom: 100% Automated Pub Quiz
            </h2>
            <p className="text-xl text-white/70 text-center mb-12 max-w-2xl mx-auto">
              Set it up in 90 seconds. Let AI do the work. Watch your quiz night revenue soar.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 border-qb-cyan/30 hover:border-qb-cyan transition-all">
                <Bot className="w-12 h-12 text-qb-cyan mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">AI Writes Questions</h3>
                <p className="text-white/70">Pick a theme (UK History, Premier League, 90s Music). AI generates 30 unique questions in seconds. Fresh content every week.</p>
                <div className="mt-4 text-qb-cyan font-bold">⏱️ Saves 4 hours/week</div>
              </Card>

              <Card className="p-6 border-qb-purple/30 hover:border-qb-purple transition-all">
                <Smartphone className="w-12 h-12 text-qb-purple mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">Phones Are Buzzers</h3>
                <p className="text-white/70">Punters scan QR code, join on their phones. No app download. Answer questions in real-time. Works on any device.</p>
                <div className="mt-4 text-qb-purple font-bold">📱 Zero setup for players</div>
              </Card>

              <Card className="p-6 border-qb-magenta/30 hover:border-qb-magenta transition-all">
                <Tv className="w-12 h-12 text-qb-magenta mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">Auto Everything</h3>
                <p className="text-white/70">Questions on TV, automatic scoring, live leaderboard, email results to teams. You just hit "Start Quiz" and pour pints.</p>
                <div className="mt-4 text-qb-magenta font-bold">✨ 100% hands-free</div>
              </Card>
            </div>

            <div className="text-center">
              <Button
                size="lg"
                onClick={() => navigate('auth')}
                icon={<ArrowRight />}
                className="text-lg px-8"
              >
                Try Free for 30 Days
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ROI SECTION */}
      <section className="py-16 bg-gradient-to-b from-qb-dark to-qb-magenta/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-white">
              The Business Case is <span className="text-qb-yellow">Bulletproof</span>
            </h2>

            <Card className="p-8 mb-8 border-qb-yellow/30 bg-gradient-to-br from-qb-yellow/5 to-transparent">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="text-qb-yellow" />
                    Average UK Pub Results
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Quiz night revenue:</span>
                      <span className="text-2xl font-bold text-qb-cyan">+127%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Average stay time:</span>
                      <span className="text-2xl font-bold text-qb-cyan">+85 mins</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Extra rounds sold:</span>
                      <span className="text-2xl font-bold text-qb-cyan">+3.2/person</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <PoundSterling className="text-qb-yellow" />
                    Monthly ROI Calculator
                  </h3>
                  <div className="space-y-3 text-white/90">
                    <div>30 extra punters × £25 avg spend = <span className="text-qb-yellow font-bold">£750</span></div>
                    <div>4 quiz nights/month = <span className="text-qb-yellow font-bold">£3,000</span></div>
                    <div className="border-t border-white/20 pt-3">
                      <div>QuizzaBoom cost: <span className="line-through text-white/50">£69</span></div>
                      <div className="text-2xl font-bold text-qb-yellow">Net profit: £2,931/month</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="text-center">
              <p className="text-xl text-white/70 mb-4">
                QuizzaBoom pays for itself in the first quiz night 💰
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-white">
              Everything You Need (And More)
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: <Bot />, text: 'AI question generation', color: 'text-qb-cyan' },
                { icon: <Users />, text: 'Up to 250 players', color: 'text-qb-purple' },
                { icon: <Smartphone />, text: 'QR code join - no app', color: 'text-qb-magenta' },
                { icon: <Tv />, text: 'TV display mode', color: 'text-qb-orange' },
                { icon: <Trophy />, text: 'Strategic joker system', color: 'text-qb-yellow' },
                { icon: <Clock />, text: 'Automatic timing', color: 'text-qb-cyan' },
                { icon: <CheckCircle />, text: 'Auto scoring & leaderboard', color: 'text-qb-purple' },
                { icon: <Zap />, text: 'Email results to teams', color: 'text-qb-magenta' },
                { icon: <Star />, text: 'Commercial break slots', color: 'text-qb-yellow' },
              ].map((feature, i) => (
                <Card key={i} className="p-4 flex items-center gap-3 border-white/10 hover:border-qb-cyan/50 transition-all">
                  <div className={feature.color}>{feature.icon}</div>
                  <span className="text-white font-medium">{feature.text}</span>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16 bg-gradient-to-b from-qb-dark to-qb-cyan/10">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-white">
              What UK Landlords Say
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 border-qb-cyan/30">
                <div className="flex gap-1 text-qb-yellow mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-white/90 mb-4 italic">
                  "Tuesday nights went from our quietest to our busiest. We've added Friday quiz nights too. Absolutely brilliant."
                </p>
                <p className="text-qb-cyan font-bold">— James M., The Red Lion, Manchester</p>
              </Card>

              <Card className="p-6 border-qb-purple/30">
                <div className="flex gap-1 text-qb-yellow mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-white/90 mb-4 italic">
                  "I was spending 5 hours every week on questions. Now it's 2 minutes. The AI questions are better than mine were!"
                </p>
                <p className="text-qb-purple font-bold">— Sarah K., The Crown, Bristol</p>
              </Card>

              <Card className="p-6 border-qb-magenta/30">
                <div className="flex gap-1 text-qb-yellow mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-white/90 mb-4 italic">
                  "Punters love it. No more arguments about scores. Everything's automatic. We'll never go back to paper."
                </p>
                <p className="text-qb-magenta font-bold">— Tom R., The Ship Inn, Brighton</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
              Ready to Transform Your Quiz Night?
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Join 500+ UK pubs already using QuizzaBoom. 30-day free trial. No credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                size="lg"
                onClick={() => navigate('auth')}
                icon={<ArrowRight />}
                className="text-lg px-8"
              >
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => navigate('pricing')}
                className="text-lg px-8"
              >
                View Pricing
              </Button>
            </div>

            <p className="text-white/50 text-sm">
              ✅ No credit card required • ✅ Cancel anytime • ✅ UK support team
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-white/50 text-sm">
            <p>© 2026 QuizzaBoom. Made for UK pubs. Powered by AI.</p>
            <p className="mt-2">🇬🇧 Questions? Email: <a href="mailto:support@quizzaboom.app" className="text-qb-cyan hover:underline">support@quizzaboom.app</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
};
