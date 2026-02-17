import React from 'react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LanguageSelector } from '../components/LanguageSelector';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

const blogPosts = [
  {
    slug: 'how-to-run-successful-pub-quiz-night',
    title: 'How to Run a Successful Pub Quiz Night in 2026',
    excerpt: 'Complete guide for pub landlords: from choosing themes to maximizing revenue. Learn the exact strategy used by top-performing UK pubs.',
    date: '2026-02-15',
    readTime: '8 min read',
    category: 'Guides',
    image: '/blog/pub-quiz-guide.jpg'
  },
  {
    slug: 'best-pub-quiz-software-uk-comparison',
    title: 'Best Pub Quiz Software UK: 2026 Comparison Guide',
    excerpt: 'Compare the top 5 pub quiz platforms for UK venues. Features, pricing, pros & cons. Find the perfect fit for your pub.',
    date: '2026-02-10',
    readTime: '10 min read',
    category: 'Reviews',
    image: '/blog/software-comparison.jpg'
  },
  {
    slug: '50-pub-quiz-questions-ideas-themes',
    title: '50+ Pub Quiz Question Ideas & Winning Themes',
    excerpt: 'Fresh quiz themes that pack your pub. From UK History to 90s Britpop, discover what works in 2026.',
    date: '2026-02-05',
    readTime: '6 min read',
    category: 'Resources',
    image: '/blog/quiz-themes.jpg'
  },
  {
    slug: 'pub-quiz-revenue-how-much-money-can-you-make',
    title: 'Pub Quiz Revenue: How Much Money Can You Actually Make?',
    excerpt: 'Real numbers from 50 UK pubs. Average revenue, profit margins, and ROI. Plus the exact formula to calculate your potential.',
    date: '2026-01-30',
    readTime: '7 min read',
    category: 'Business',
    image: '/blog/quiz-revenue.jpg'
  },
];

export const BlogIndex: React.FC = () => {
  const navigate = useAppNavigate();

  return (
    <div className="min-h-screen bg-qb-dark">
      {/* HEADER */}
      <div className="container mx-auto px-4 pt-6">
        <div className="flex justify-between items-center">
          <LanguageSelector />
          <Button
            variant="ghost"
            onClick={() => navigate('home')}
          >
            Back to Home
          </Button>
        </div>
      </div>

      {/* HERO */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-qb-magenta via-qb-cyan to-qb-purple bg-clip-text text-transparent">
              QuizzaBoom Blog
            </h1>
            <p className="text-xl text-white/70">
              Guides, tips, and insights for running profitable pub quiz nights
            </p>
          </div>
        </div>
      </section>

      {/* BLOG POSTS */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {blogPosts.map((post, i) => (
                <div
                  key={i}
                  className="cursor-pointer"
                  onClick={() => navigate(`blog/${post.slug}` as any)}
                >
                <Card
                  className="p-6 border-white/10 hover:border-qb-cyan/50 transition-all group h-full"
                >
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-qb-cyan/20 text-qb-cyan text-sm font-bold rounded-full">
                      {post.category}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-qb-cyan transition-colors">
                    {post.title}
                  </h2>

                  <p className="text-white/70 mb-4">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-white/50">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(post.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button variant="ghost" icon={<ArrowRight />} size="sm">
                      Read Article
                    </Button>
                  </div>
                </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-b from-qb-dark to-qb-purple/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-black mb-4 text-white">
              Ready to Start Your Quiz Night?
            </h2>
            <p className="text-lg text-white/70 mb-6">
              Try QuizzaBoom free for 30 days. No credit card required.
            </p>
            <Button
              size="lg"
              onClick={() => navigate('auth')}
              icon={<ArrowRight />}
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center text-white/50 text-sm">
            <p>© 2026 QuizzaBoom. Powered by AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
