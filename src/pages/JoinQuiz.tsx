import React, { useState, useEffect } from 'react';
import { useQuizStore } from '../stores/useQuizStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ArrowLeft, QrCode, UserCircle } from 'lucide-react';

export const JoinQuiz: React.FC = () => {
  const { setCurrentView, joinSession, isLoading, error } = useQuizStore();
  
  const [code, setCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😀');

  // Check URL params for code
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlCode = urlParams.get('code');
    if (urlCode) {
      setCode(urlCode.toUpperCase());
    }
  }, []);

  const emojis = ['😀', '😎', '🤓', '🥳', '🤩', '😇', '🤠', '🥸', '🤡', '👻', '🦄', '🐱', '🐶', '🦊', '🐼', '🦁'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinSession(code.toUpperCase(), playerName, email || undefined);
      setCurrentView('lobby');
    } catch (err) {
      console.error('Failed to join session:', err);
    }
  };

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentView('home')}
              icon={<ArrowLeft />}
            >
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
                Join a Quiz
              </h1>
              <p className="text-white/70 mt-2">
                Enter the session code to join the battle!
              </p>
            </div>
          </div>

          {/* Form */}
          <Card gradient className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Session Code */}
              <div>
                <label className="block text-white font-medium mb-2 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-qb-cyan" />
                  Session Code *
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character code"
                  maxLength={6}
                  className="w-full px-4 py-3 rounded-lg bg-qb-darker text-white text-center text-2xl font-mono tracking-widest border border-white/20 focus:border-qb-cyan focus:outline-none focus:ring-2 focus:ring-qb-cyan/30 uppercase"
                />
                <p className="text-sm text-white/50 mt-2 text-center">
                  Scan the QR code or enter the code manually
                </p>
              </div>

              {/* Player Name */}
              <div>
                <label className="block text-white font-medium mb-2 flex items-center gap-2">
                  <UserCircle className="w-5 h-5 text-qb-magenta" />
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-lg bg-qb-darker text-white border border-white/20 focus:border-qb-magenta focus:outline-none focus:ring-2 focus:ring-qb-magenta/30"
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-white font-medium mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Get your results by email"
                  className="w-full px-4 py-3 rounded-lg bg-qb-darker text-white border border-white/20 focus:border-qb-purple focus:outline-none focus:ring-2 focus:ring-qb-purple/30"
                />
                <p className="text-sm text-white/50 mt-2">
                  Receive your performance summary and special offers!
                </p>
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-white font-medium mb-3">
                  Choose Your Avatar
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`text-4xl p-3 rounded-lg transition-all ${
                        selectedEmoji === emoji
                          ? 'bg-qb-cyan scale-110'
                          : 'bg-qb-darker hover:bg-white/10'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-200">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                size="xl"
                gradient
                fullWidth
                loading={isLoading}
                disabled={!code.trim() || !playerName.trim() || code.length !== 6}
              >
                {isLoading ? 'Joining...' : '🎮 Join the Battle!'}
              </Button>
            </form>
          </Card>

          {/* Info */}
          <Card className="p-6 text-center">
            <p className="text-white/70">
              <span className="font-bold text-qb-cyan">Tip:</span> Make sure you're connected to the internet and the host has started the session!
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
