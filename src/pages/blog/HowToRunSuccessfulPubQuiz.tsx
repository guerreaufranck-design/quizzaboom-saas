import React from 'react';
import { useAppNavigate } from '../../hooks/useAppNavigate';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LanguageSelector } from '../../components/LanguageSelector';
import { ArrowRight, Calendar, Clock, CheckCircle } from 'lucide-react';

export const HowToRunSuccessfulPubQuiz: React.FC = () => {
  const navigate = useAppNavigate();

  return (
    <div className="min-h-screen bg-qb-dark">
      {/* HEADER */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex justify-between items-center">
          <LanguageSelector />
          <Button
            variant="ghost"
            onClick={() => navigate('blog' as any)}
          >
            ← Back to Blog
          </Button>
        </div>
      </div>

      {/* ARTICLE */}
      <article className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Meta */}
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-qb-cyan/20 text-qb-cyan text-sm font-bold rounded-full">
                Guide
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-black mb-6 text-white leading-tight">
              How to Run a Successful Pub Quiz Night in 2026
            </h1>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-sm text-white/50 mb-8 pb-8 border-b border-white/10">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>15 Feb 2026</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>8 min read</span>
              </div>
            </div>

            {/* Intro */}
            <div className="prose prose-invert max-w-none">
              <p className="text-xl text-white/80 leading-relaxed mb-6">
                Running a pub quiz night can transform your slowest evening into your busiest—and most profitable. But there's a massive difference between a quiz that packs your venue and one that barely fills three tables.
              </p>

              <p className="text-white/70 mb-8">
                After analyzing data from 500+ UK pubs using QuizzaBoom, we've identified the exact formula that separates successful quiz nights from mediocre ones. This guide covers everything you need to know.
              </p>

              {/* TOC */}
              <Card className="p-6 border-qb-cyan/30 mb-12 bg-qb-cyan/5">
                <h2 className="text-xl font-bold text-white mb-4">What You'll Learn:</h2>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-qb-cyan mt-0.5 flex-shrink-0" />
                    <span>Choosing the right night and timing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-qb-cyan mt-0.5 flex-shrink-0" />
                    <span>Question writing strategies (or how to avoid it entirely)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-qb-cyan mt-0.5 flex-shrink-0" />
                    <span>Pricing and prize structures that maximize profit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-qb-cyan mt-0.5 flex-shrink-0" />
                    <span>Marketing tactics that fill your venue</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-qb-cyan mt-0.5 flex-shrink-0" />
                    <span>Technology that automates 90% of the work</span>
                  </li>
                </ul>
              </Card>

              {/* Section 1 */}
              <h2 className="text-3xl font-black text-white mt-12 mb-4">1. Pick the Right Night (This Matters More Than You Think)</h2>

              <p className="text-white/70 mb-4">
                Your quiz night should target your slowest evening. For most UK pubs, that's Tuesday or Wednesday. Why? Because you're creating new revenue, not cannibalizing existing business.
              </p>

              <Card className="p-6 border-qb-purple/30 mb-6">
                <h3 className="text-lg font-bold text-white mb-3">Best Nights by Venue Type:</h3>
                <ul className="space-y-2 text-white/80">
                  <li><strong className="text-qb-purple">Traditional Pubs:</strong> Tuesday or Wednesday, 8pm start</li>
                  <li><strong className="text-qb-purple">Sports Bars:</strong> Monday (avoid match nights), 7:30pm start</li>
                  <li><strong className="text-qb-purple">Gastropubs:</strong> Wednesday or Thursday, 8:30pm start (after dinner service)</li>
                  <li><strong className="text-qb-purple">Student Areas:</strong> Sunday or Monday, 8pm start</li>
                </ul>
              </Card>

              <p className="text-white/70 mb-6">
                <strong className="text-white">Pro tip:</strong> Start at 8pm or 8:30pm. Earlier than 7:30pm and people haven't finished dinner. Later than 9pm and you've lost the early crowd.
              </p>

              {/* Section 2 */}
              <h2 className="text-3xl font-black text-white mt-12 mb-4">2. Question Strategy: Write Less, Win More</h2>

              <p className="text-white/70 mb-4">
                Here's the truth most pub landlords learn the hard way: spending 4+ hours every week writing questions is unsustainable. Within 3 months, either you burn out or the quiz quality drops.
              </p>

              <p className="text-white/70 mb-4">
                <strong className="text-white">The traditional approach:</strong>
              </p>
              <ul className="list-disc list-inside text-white/70 mb-6 space-y-2">
                <li>Research questions online (2-3 hours)</li>
                <li>Verify answers and avoid duplicates (1 hour)</li>
                <li>Format and print (30 minutes)</li>
                <li>Total: 4+ hours per week</li>
              </ul>

              <p className="text-white/70 mb-4">
                <strong className="text-white">The modern approach:</strong>
              </p>
              <ul className="list-disc list-inside text-white/70 mb-6 space-y-2">
                <li>Use AI to generate 30 unique questions (10 seconds)</li>
                <li>Review and customize if needed (2 minutes)</li>
                <li>Total: 2 minutes per week</li>
              </ul>

              <Card className="p-6 border-qb-cyan/30 mb-6 bg-qb-cyan/5">
                <p className="text-white/90">
                  <strong className="text-qb-cyan">Real Example:</strong> The Red Lion in Manchester switched from manual questions to AI generation. Result: Manager saves 4 hours/week, quiz quality improved (fresh questions every week), and revenue increased 127% because they added a second quiz night with the saved time.
                </p>
              </Card>

              {/* Section 3 */}
              <h2 className="text-3xl font-black text-white mt-12 mb-4">3. Pricing & Prize Structure</h2>

              <p className="text-white/70 mb-4">
                The goal isn't to make money from entry fees—it's to keep people in your venue spending money at the bar.
              </p>

              <Card className="p-6 border-qb-magenta/30 mb-6">
                <h3 className="text-lg font-bold text-white mb-3">Proven Pricing Models:</h3>
                <div className="space-y-4 text-white/80">
                  <div>
                    <strong className="text-qb-magenta">Model 1: Entry Fee + Prize</strong>
                    <p className="text-sm text-white/70 mt-1">£2-3 per person, winner takes 60-70% of pot, 2nd place gets 30-40%</p>
                  </div>
                  <div>
                    <strong className="text-qb-magenta">Model 2: Free Entry + Bar Prizes</strong>
                    <p className="text-sm text-white/70 mt-1">No entry fee, winners get £50-100 bar tab or bottles of wine</p>
                  </div>
                  <div>
                    <strong className="text-qb-magenta">Model 3: Drinks Package</strong>
                    <p className="text-sm text-white/70 mt-1">£15 per person includes 3 drinks + quiz entry</p>
                  </div>
                </div>
              </Card>

              <p className="text-white/70 mb-6">
                <strong className="text-white">Most profitable approach:</strong> Free entry or £1-2 entry with bar prizes. Why? Because teams stay 85 minutes longer on average, ordering 3+ extra rounds per person. That's £15-25 extra per person—far more than a £3 entry fee.
              </p>

              {/* Section 4 */}
              <h2 className="text-3xl font-black text-white mt-12 mb-4">4. Marketing Your Quiz Night</h2>

              <p className="text-white/70 mb-4">
                The best quiz in the world fails if nobody knows about it. Here's what actually works:
              </p>

              <div className="space-y-4 mb-6">
                <Card className="p-4 border-qb-yellow/30">
                  <h4 className="font-bold text-white mb-2">Week 1-2: Build Awareness</h4>
                  <ul className="text-sm text-white/70 space-y-1">
                    <li>• Post on social media 3x per week</li>
                    <li>• Create Facebook event and boost for £20-30</li>
                    <li>• Put posters in your venue (5-7 visible spots)</li>
                    <li>• Train staff to mention it to regulars</li>
                  </ul>
                </Card>

                <Card className="p-4 border-qb-yellow/30">
                  <h4 className="font-bold text-white mb-2">Week 3-4: Create Urgency</h4>
                  <ul className="text-sm text-white/70 space-y-1">
                    <li>• "Only 5 team spots left!" (create scarcity)</li>
                    <li>• Post teaser questions on social media</li>
                    <li>• Run a "bring a friend" promotion</li>
                  </ul>
                </Card>

                <Card className="p-4 border-qb-yellow/30">
                  <h4 className="font-bold text-white mb-2">Ongoing: Build Momentum</h4>
                  <ul className="text-sm text-white/70 space-y-1">
                    <li>• Post winner photos (with permission)</li>
                    <li>• Share funny moments from the quiz</li>
                    <li>• Email previous participants (automated)</li>
                    <li>• Create a "season" with cumulative scoring</li>
                  </ul>
                </Card>
              </div>

              {/* Section 5 */}
              <h2 className="text-3xl font-black text-white mt-12 mb-4">5. Technology: Automate or Burn Out</h2>

              <p className="text-white/70 mb-4">
                Manual quiz nights are exhausting. You're juggling:
              </p>
              <ul className="list-disc list-inside text-white/70 mb-6 space-y-2">
                <li>Collecting and marking answer sheets</li>
                <li>Calculating scores</li>
                <li>Managing disputes ("That answer should count!")</li>
                <li>Updating the leaderboard manually</li>
              </ul>

              <p className="text-white/70 mb-4">
                Modern quiz platforms automate all of this. Players answer on their phones, scoring is automatic, and the leaderboard updates in real-time on your TV screens.
              </p>

              <Card className="p-6 border-qb-cyan/30 mb-6 bg-qb-cyan/5">
                <h3 className="text-lg font-bold text-white mb-3">What to Look for in Quiz Software:</h3>
                <ul className="space-y-2 text-white/80">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-qb-cyan mt-0.5 flex-shrink-0" />
                    <span><strong>No app download required</strong> - players join via QR code</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-qb-cyan mt-0.5 flex-shrink-0" />
                    <span><strong>AI question generation</strong> - saves 4 hours/week</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-qb-cyan mt-0.5 flex-shrink-0" />
                    <span><strong>Automatic scoring</strong> - zero manual work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-qb-cyan mt-0.5 flex-shrink-0" />
                    <span><strong>TV display mode</strong> - professional presentation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-qb-cyan mt-0.5 flex-shrink-0" />
                    <span><strong>Email results</strong> - automated follow-up</span>
                  </li>
                </ul>
              </Card>

              <p className="text-white/70 mb-6">
                <strong className="text-white">ROI Reality Check:</strong> If software saves you 4 hours/week at £15/hour, that's £240/month saved. Most quiz platforms cost £50-100/month. The math is obvious.
              </p>

              {/* Section 6 */}
              <h2 className="text-3xl font-black text-white mt-12 mb-4">6. The First Quiz Night: What to Expect</h2>

              <p className="text-white/70 mb-4">
                Your first quiz might have 8-15 teams. That's normal. Don't panic if it's not packed immediately.
              </p>

              <Card className="p-6 border-qb-purple/30 mb-6">
                <h3 className="text-lg font-bold text-white mb-3">Typical Growth Pattern:</h3>
                <ul className="space-y-2 text-white/80">
                  <li><strong className="text-qb-purple">Week 1:</strong> 8-12 teams (mostly regulars)</li>
                  <li><strong className="text-qb-purple">Week 2:</strong> 10-15 teams (word of mouth starts)</li>
                  <li><strong className="text-qb-purple">Week 3-4:</strong> 15-20 teams (regulars bring friends)</li>
                  <li><strong className="text-qb-purple">Week 6-8:</strong> 20-30 teams (fully established)</li>
                </ul>
              </Card>

              <p className="text-white/70 mb-6">
                The key is consistency. Run it every week at the same time. Cancel once and you break momentum.
              </p>

              {/* Conclusion */}
              <h2 className="text-3xl font-black text-white mt-12 mb-4">The Bottom Line</h2>

              <p className="text-white/70 mb-4">
                A successful pub quiz night comes down to three things:
              </p>

              <ol className="list-decimal list-inside text-white/70 mb-6 space-y-2">
                <li><strong className="text-white">Consistency</strong> - Same night, same time, every week</li>
                <li><strong className="text-white">Quality</strong> - Fresh questions, smooth operation, no drama</li>
                <li><strong className="text-white">Automation</strong> - Use technology to eliminate busywork</li>
              </ol>

              <p className="text-white/70 mb-8">
                Do this right and quiz night becomes your most profitable evening. Do it wrong and it's a weekly headache that eats your time and makes no money.
              </p>

              {/* CTA */}
              <Card className="p-8 border-qb-cyan/30 bg-gradient-to-br from-qb-cyan/5 to-transparent text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Want to See How Easy This Can Be?
                </h3>
                <p className="text-white/70 mb-6">
                  QuizzaBoom automates everything covered in this guide. AI generates questions, players join via QR code, and scoring is 100% automatic. Try it free for 30 days.
                </p>
                <Button
                  size="lg"
                  onClick={() => navigate('auth')}
                  icon={<ArrowRight />}
                >
                  Start Free Trial
                </Button>
                <p className="text-white/50 text-sm mt-4">
                  No credit card required • Cancel anytime
                </p>
              </Card>
            </div>
          </div>
        </div>
      </article>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center text-white/50 text-sm">
            <p>© 2026 QuizzaBoom. Powered by AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
