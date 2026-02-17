import React from 'react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LanguageSelector } from '../components/LanguageSelector';
import { AnimatedLogo } from '../components/AnimatedLogo';
import {
  Bot, Tv, Smartphone, Users,
  ArrowRight, Trophy, Star, DollarSign,
  BarChart3, Calendar, Shield
} from 'lucide-react';

export const BarQuizNight: React.FC = () => {
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
              Run Professional Bar Quiz Nights
            </h1>

            <p className="text-xl md:text-2xl text-white/80 mb-4 max-w-3xl mx-auto">
              AI-powered quiz platform built for bars, restaurants, and entertainment venues. Boost midweek revenue by 127%.
            </p>

            <p className="text-lg text-qb-cyan mb-8 font-bold">
              🎯 Used by 500+ venues worldwide • 30-day free trial • No credit card required
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
              <span className="text-white/80 ml-2">4.8/5 from 150+ venue owners</span>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BANNER */}
      <section className="py-12 bg-gradient-to-r from-qb-purple/20 to-qb-magenta/20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-black text-qb-cyan mb-2">127%</div>
                <div className="text-white/70 text-sm">Average Revenue Increase</div>
              </div>
              <div>
                <div className="text-4xl font-black text-qb-magenta mb-2">85min</div>
                <div className="text-white/70 text-sm">Longer Customer Stay</div>
              </div>
              <div>
                <div className="text-4xl font-black text-qb-yellow mb-2">250</div>
                <div className="text-white/70 text-sm">Max Players per Quiz</div>
              </div>
              <div>
                <div className="text-4xl font-black text-qb-purple mb-2">90sec</div>
                <div className="text-white/70 text-sm">Setup Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-white">
              Traditional Quiz Nights Are <span className="text-qb-magenta">Killing Your Margins</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="p-6 border-red-500/30">
                <div className="text-red-400 mb-3">❌</div>
                <h3 className="text-lg font-bold text-white mb-2">Staff Time Wasted</h3>
                <p className="text-white/70">Manager spends 4+ hours/week writing questions instead of running the business</p>
              </Card>

              <Card className="p-6 border-red-500/30">
                <div className="text-red-400 mb-3">❌</div>
                <h3 className="text-lg font-bold text-white mb-2">Manual Scoring Chaos</h3>
                <p className="text-white/70">Staff busy marking papers instead of serving customers. Lost sales opportunity.</p>
              </Card>

              <Card className="p-6 border-red-500/30">
                <div className="text-red-400 mb-3">❌</div>
                <h3 className="text-lg font-bold text-white mb-2">Poor Customer Experience</h3>
                <p className="text-white/70">Long waits between rounds. Disputes about answers. Players leave early.</p>
              </Card>

              <Card className="p-6 border-red-500/30">
                <div className="text-red-400 mb-3">❌</div>
                <h3 className="text-lg font-bold text-white mb-2">No Analytics</h3>
                <p className="text-white/70">Zero data on attendance, engagement, or ROI. Flying blind on business decisions.</p>
              </Card>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-qb-cyan mb-4">QuizzaBoom solves all of this 👇</p>
            </div>
          </div>
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section className="py-16 bg-gradient-to-b from-qb-dark to-qb-cyan/10">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-4 text-white">
              100% Automated Quiz Night Platform
            </h2>
            <p className="text-xl text-white/70 text-center mb-12 max-w-2xl mx-auto">
              Professional quiz nights without the work. Set it up in 90 seconds and watch your revenue soar.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="p-6 border-qb-cyan/30 hover:border-qb-cyan transition-all">
                <Bot className="w-12 h-12 text-qb-cyan mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">AI Question Generation</h3>
                <p className="text-white/70">Pick any theme. AI generates 30 unique, engaging questions in 10 seconds. No research needed.</p>
                <div className="mt-4 text-qb-cyan font-bold">⏱️ Saves 4 hours/week</div>
              </Card>

              <Card className="p-6 border-qb-purple/30 hover:border-qb-purple transition-all">
                <Smartphone className="w-12 h-12 text-qb-purple mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">QR Code Join</h3>
                <p className="text-white/70">Players scan, enter team name, and play instantly. No app download. Works on any phone, tablet, or laptop.</p>
                <div className="mt-4 text-qb-purple font-bold">📱 Zero friction</div>
              </Card>

              <Card className="p-6 border-qb-magenta/30 hover:border-qb-magenta transition-all">
                <Tv className="w-12 h-12 text-qb-magenta mb-4" />
                <h3 className="text-xl font-bold text-white mb-3">Fully Automated</h3>
                <p className="text-white/70">Auto timing, auto scoring, live leaderboard, email results. Staff focus on serving customers.</p>
                <div className="mt-4 text-qb-magenta font-bold">✨ Hands-free operation</div>
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

      {/* ROI CALCULATOR */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-white">
              The ROI is <span className="text-qb-yellow">Undeniable</span>
            </h2>

            <Card className="p-8 mb-8 border-qb-yellow/30 bg-gradient-to-br from-qb-yellow/5 to-transparent">
              <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
                <DollarSign className="text-qb-yellow" />
                Average Venue Monthly Impact
              </h3>

              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-white/70">Quiz nights per month:</span>
                  <span className="text-white font-bold">4</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-white/70">Additional customers per night:</span>
                  <span className="text-white font-bold">30-50</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-white/70">Average spend per customer:</span>
                  <span className="text-white font-bold">$25-35</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-white/70">Extended stay (extra rounds):</span>
                  <span className="text-white font-bold">+85 minutes</span>
                </div>

                <div className="border-t border-white/20 pt-4 mt-6">
                  <div className="flex justify-between items-center text-2xl font-black">
                    <span className="text-white">Monthly Revenue Increase:</span>
                    <span className="text-qb-yellow">$3,000-7,000</span>
                  </div>
                  <div className="flex justify-between items-center text-lg mt-2">
                    <span className="text-white/70">QuizzaBoom cost:</span>
                    <span className="text-white line-through">$69/month</span>
                  </div>
                  <div className="flex justify-between items-center text-3xl font-black mt-4">
                    <span className="text-qb-cyan">Net Monthly Profit:</span>
                    <span className="text-qb-cyan">$2,931-6,931</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-white/70 mt-8 text-lg">
                QuizzaBoom pays for itself in the first quiz night 🎯
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURES FOR VENUES */}
      <section className="py-16 bg-gradient-to-b from-qb-dark to-qb-purple/10">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-white">
              Built for Professional Venues
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              <Card className="p-6 border-qb-cyan/30">
                <BarChart3 className="w-10 h-10 text-qb-cyan mb-3" />
                <h3 className="text-xl font-bold text-white mb-3">Business Analytics</h3>
                <p className="text-white/70">Track attendance, engagement rates, popular themes. Export data for business decisions.</p>
              </Card>

              <Card className="p-6 border-qb-purple/30">
                <Calendar className="w-10 h-10 text-qb-purple mb-3" />
                <h3 className="text-xl font-bold text-white mb-3">Scheduled Quizzes</h3>
                <p className="text-white/70">Set up recurring weekly quizzes. Automatic email reminders to registered players.</p>
              </Card>

              <Card className="p-6 border-qb-magenta/30">
                <DollarSign className="w-10 h-10 text-qb-magenta mb-3" />
                <h3 className="text-xl font-bold text-white mb-3">Commercial Break Slots</h3>
                <p className="text-white/70">Insert branded content between rounds. Promote food specials, drink deals, upcoming events.</p>
              </Card>

              <Card className="p-6 border-qb-yellow/30">
                <Shield className="w-10 h-10 text-qb-yellow mb-3" />
                <h3 className="text-xl font-bold text-white mb-3">White Label Option</h3>
                <p className="text-white/70">Pro plan includes custom branding. Add your venue logo, colors, and style.</p>
              </Card>

              <Card className="p-6 border-qb-cyan/30">
                <Users className="w-10 h-10 text-qb-cyan mb-3" />
                <h3 className="text-xl font-bold text-white mb-3">Multi-Site Support</h3>
                <p className="text-white/70">Own multiple venues? Run simultaneous quizzes or inter-venue competitions.</p>
              </Card>

              <Card className="p-6 border-qb-purple/30">
                <Trophy className="w-10 h-10 text-qb-purple mb-3" />
                <h3 className="text-xl font-bold text-white mb-3">Strategic Jokers</h3>
                <p className="text-white/70">Players can double points on chosen questions. Adds strategy and keeps engagement high.</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-white">
              What Venue Owners Say
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-6 border-qb-cyan/30">
                <div className="flex gap-1 text-qb-yellow mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-white/90 mb-4 italic">
                  "Our Tuesday night revenue increased 140% in the first month. We're now running quiz nights on Thursdays too."
                </p>
                <p className="text-qb-cyan font-bold">— Michael Torres, Sports Bar NYC</p>
              </Card>

              <Card className="p-6 border-qb-purple/30">
                <div className="flex gap-1 text-qb-yellow mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-white/90 mb-4 italic">
                  "Setup takes 2 minutes. The AI questions are better than what we were writing. Staff love how easy it is."
                </p>
                <p className="text-qb-purple font-bold">— Sarah Chen, The Brewhouse, Austin</p>
              </Card>

              <Card className="p-6 border-qb-magenta/30">
                <div className="flex gap-1 text-qb-yellow mb-3">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                </div>
                <p className="text-white/90 mb-4 italic">
                  "We use it across all 5 locations. The multi-site tournament feature is genius. Best investment we've made."
                </p>
                <p className="text-qb-magenta font-bold">— James O'Connor, O'Connor's Pub Group</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16 bg-gradient-to-b from-qb-dark to-qb-cyan/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-black text-center mb-12 text-white">
              Get Started in 90 Seconds
            </h2>

            <div className="space-y-6">
              {[
                { step: '1', title: 'Sign Up Free', desc: 'Create account. No credit card required for 30-day trial.', color: 'qb-cyan' },
                { step: '2', title: 'AI Creates Quiz', desc: 'Pick theme (Sports, History, Movies, etc). AI generates 30 questions instantly.', color: 'qb-purple' },
                { step: '3', title: 'Display QR Code', desc: 'Show QR code on your TV/screens. Players scan and join from their phones.', color: 'qb-magenta' },
                { step: '4', title: 'Hit Start', desc: 'Questions appear on TV. Players answer on phones. Everything else is automatic.', color: 'qb-yellow' },
              ].map((item, i) => (
                <Card key={i} className={`p-6 border-${item.color}/30 flex items-start gap-4`}>
                  <div className={`text-3xl font-black text-${item.color} bg-${item.color}/10 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0`}>
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-white/70">{item.desc}</p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                onClick={() => navigate('auth')}
                icon={<ArrowRight />}
                className="text-lg px-8"
              >
                Start Your Free Trial
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6 text-white">
              Transform Your Quiz Nights
            </h2>
            <p className="text-xl text-white/70 mb-8">
              Join 500+ venues using QuizzaBoom to boost midweek revenue. 30-day free trial. No credit card required.
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
              ✅ No credit card required • ✅ Cancel anytime • ✅ 24/7 support
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-white/50 text-sm">
            <p>© 2026 QuizzaBoom. Built for venues. Powered by AI.</p>
            <p className="mt-2">Questions? Email: <a href="mailto:support@quizzaboom.app" className="text-qb-cyan hover:underline">support@quizzaboom.app</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
};
