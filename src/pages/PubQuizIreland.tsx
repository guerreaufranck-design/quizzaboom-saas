import React from 'react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LanguageSelector } from '../components/LanguageSelector';
import { AnimatedLogo } from '../components/AnimatedLogo';
import {
  Bot, Tv, Smartphone, Users, TrendingUp, CheckCircle,
  ArrowRight, Trophy, Clock, Star, Zap, Beer
} from 'lucide-react';

export const PubQuizIreland: React.FC = () => {
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
              Ireland's Smartest Pub Quiz Platform
            </h1>

            <p className="text-xl md:text-2xl text-white/80 mb-4 max-w-3xl mx-auto">
              Bring the craic to your quiz night with AI-powered automation. No question writing, no paper, no hassle.
            </p>

            <p className="text-lg text-qb-cyan mb-8 font-bold">
              🇮🇪 Trusted by Irish pubs from Dublin to Galway • 30-day free trial
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
              <span className="text-white/80 ml-2">4.8/5 from Irish publicans</span>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-16 bg-gradient-to-b from-qb-dark to-qb-purple/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-white">
              Traditional Pub Quizzes Are <span className="text-qb-magenta">Grand... Until They're Not</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="p-6 border-red-500/30">
                <div className="text-red-400 mb-3">❌</div>
                <h3 className="text-lg font-bold text-white mb-2">Hours Writing Questions</h3>
                <p className="text-white/70">Every week, researching Irish history, GAA stats, local trivia. Sure, it's fierce time-consuming.</p>
              </Card>

              <Card className="p-6 border-red-500/30">
                <div className="text-red-400 mb-3">❌</div>
                <h3 className="text-lg font-bold text-white mb-2">Manual Marking Madness</h3>
                <p className="text-white/70">Collecting sheets, marking answers, adding scores while punters are gasping for their pints</p>
              </Card>

              <Card className="p-6 border-red-500/30">
                <div className="text-red-400 mb-3">❌</div>
                <h3 className="text-lg font-bold text-white mb-2">Paper & Printing Costs</h3>
                <p className="text-white/70">€200-400/year on paper, ink, and answer sheets. Money down the drain, so it is.</p>
              </Card>

              <Card className="p-6 border-red-500/30">
                <div className="text-red-400 mb-3">❌</div>
                <h3 className="text-lg font-bold text-white mb-2">Arguments & Craic-Killers</h3>
                <p className="text-white/70">"Ah no, that's not right!" - half the night spent debating answers and keeping the peace</p>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-qb-cyan mb-4">There's a better way, altogether 👇</p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-4 text-white">
              QuizzaBoom: Let the AI Do the Work
            </h2>
            <p className="text-xl text-white/70 text-center mb-12 max-w-2xl mx-auto">
              Set up in 90 seconds. AI handles the questions. You handle the pints. Sorted.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 border-qb-cyan/30 hover:border-qb-cyan transition-all">
                <Bot className="w-12 h-12 text-qb-cyan mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">AI Writes Questions</h3>
                <p className="text-white/70">Pick a theme (Irish History, GAA, Trad Music). AI generates 30 unique questions in seconds. Fresh every week.</p>
                <div className="mt-4 text-qb-cyan font-bold">⏱️ Saves 4 hours/week</div>
              </Card>

              <Card className="p-6 border-qb-purple/30 hover:border-qb-purple transition-all">
                <Smartphone className="w-12 h-12 text-qb-purple mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">Phones Are Buzzers</h3>
                <p className="text-white/70">Punters scan QR code, join on their phones. No app to download. Answer in real-time. Works on any device, so it does.</p>
                <div className="mt-4 text-qb-purple font-bold">📱 Zero setup for players</div>
              </Card>

              <Card className="p-6 border-qb-magenta/30 hover:border-qb-magenta transition-all">
                <Tv className="w-12 h-12 text-qb-magenta mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">100% Automatic</h3>
                <p className="text-white/70">Questions on the telly, automatic scoring, live leaderboard, email results. You just hit "Start" and pull pints.</p>
                <div className="mt-4 text-qb-magenta font-bold">✨ Grand, so</div>
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
              The Business Case is <span className="text-qb-yellow">Sound Out</span>
            </h2>

            <Card className="p-8 mb-8 border-qb-yellow/30 bg-gradient-to-br from-qb-yellow/5 to-transparent">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="text-qb-yellow" />
                    Average Irish Pub Results
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Quiz night revenue:</span>
                      <span className="text-2xl font-bold text-qb-cyan">+134%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Average stay time:</span>
                      <span className="text-2xl font-bold text-qb-cyan">+90 mins</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70">Extra pints sold:</span>
                      <span className="text-2xl font-bold text-qb-cyan">+3.5/person</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <Beer className="text-qb-yellow" />
                    Monthly ROI Calculator
                  </h3>
                  <div className="space-y-3 text-white/90">
                    <div>30 extra punters × €28 avg spend = <span className="text-qb-yellow font-bold">€840</span></div>
                    <div>4 quiz nights/month = <span className="text-qb-yellow font-bold">€3,360</span></div>
                    <div className="border-t border-white/20 pt-3">
                      <div>QuizzaBoom cost: <span className="line-through text-white/50">€69</span></div>
                      <div className="text-2xl font-bold text-qb-yellow">Net profit: €3,291/month</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="text-center">
              <p className="text-xl text-white/70 mb-4">
                QuizzaBoom pays for itself after the first quiz night. Deadly! 💰
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
              What Irish Publicans Say
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 border-qb-cyan/30">
                <div className="flex gap-1 text-qb-yellow mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-white/90 mb-4 italic">
                  "Tuesday nights went from dead quiet to packed out. We're running two quiz nights a week now. Absolutely brilliant, so it is."
                </p>
                <p className="text-qb-cyan font-bold">— Seán O'Brien, The Cobblestone, Dublin</p>
              </Card>

              <Card className="p-6 border-qb-purple/30">
                <div className="flex gap-1 text-qb-yellow mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-white/90 mb-4 italic">
                  "I was spending hours every week on questions. Now it's sorted in 2 minutes. The AI questions are class!"
                </p>
                <p className="text-qb-purple font-bold">— Mairead Kelly, The Long Hall, Galway</p>
              </Card>

              <Card className="p-6 border-qb-magenta/30">
                <div className="flex gap-1 text-qb-yellow mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-white/90 mb-4 italic">
                  "Punters love it. No more rows about scores. Everything's automatic. We'll never go back to paper, I'm telling ya."
                </p>
                <p className="text-qb-magenta font-bold">— Paddy Murphy, Murphy's Bar, Cork</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* IRISH PRIDE SECTION */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-gradient-to-br from-green-900/20 to-orange-900/20 border-green-500/30">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                🇮🇪 Built for Irish Pub Culture
              </h3>
              <div className="grid md:grid-cols-2 gap-6 text-white/90">
                <div>
                  <h4 className="font-bold text-qb-cyan mb-2">Irish Themes Ready</h4>
                  <p className="text-sm">GAA, Irish History, Trad Music, Irish Literature, Local Knowledge</p>
                </div>
                <div>
                  <h4 className="font-bold text-qb-purple mb-2">Multi-Currency Support</h4>
                  <p className="text-sm">Accept payments in € (Euro). Pricing tailored for Irish market.</p>
                </div>
                <div>
                  <h4 className="font-bold text-qb-magenta mb-2">Irish Time Zone</h4>
                  <p className="text-sm">Automated emails and timing in IST/GMT. Grand for scheduling.</p>
                </div>
                <div>
                  <h4 className="font-bold text-qb-yellow mb-2">Local Support</h4>
                  <p className="text-sm">European support team who understand the Irish pub trade.</p>
                </div>
              </div>
            </Card>
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
              Join Irish pubs already using QuizzaBoom. 30-day free trial. No credit card required.
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
              ✅ No credit card required • ✅ Cancel anytime • ✅ European support
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-white/50 text-sm">
            <p>© 2026 QuizzaBoom. Made for Irish pubs. Powered by AI.</p>
            <p className="mt-2">🇮🇪 Questions? Email: <a href="mailto:support@quizzaboom.app" className="text-qb-cyan hover:underline">support@quizzaboom.app</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
};
