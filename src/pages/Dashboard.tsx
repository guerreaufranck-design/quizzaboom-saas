import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../stores/useAuthStore';
import { signOut } from '../services/auth';
import { supabase } from '../services/supabase/client';
import { Plus, LogOut, CreditCard, Trophy } from 'lucide-react';
import { useQuizStore } from '../stores/useQuizStore';

interface Purchase {
  id: string;
  plan_name: string;
  max_players: number;
  created_at: string;
  used: boolean;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { setCurrentView } = useQuizStore();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      window.location.href = '/auth';
      return;
    }

    loadPurchases();
  }, [user]);

  const loadPurchases = async () => {
    try {
      const { data, error } = await supabase
        .from('user_purchases')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Load purchases error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const availableCredits = purchases.filter(p => !p.used).length;

  return (
    <div className="min-h-screen bg-qb-dark py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-5xl font-bold text-white mb-2">My Dashboard</h1>
              <p className="text-white/70">Welcome back, {user?.email}</p>
            </div>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              icon={<LogOut />}
            >
              Sign Out
            </Button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card gradient className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-qb-cyan/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-qb-cyan" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{availableCredits}</div>
                  <div className="text-white/70">Available Credits</div>
                </div>
              </div>
            </Card>

            <Card gradient className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-qb-purple/20 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-qb-purple" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{purchases.length}</div>
                  <div className="text-white/70">Total Purchases</div>
                </div>
              </div>
            </Card>

            <Card gradient className="p-6">
              <Button
                fullWidth
                size="lg"
                gradient
                icon={<Plus />}
                onClick={() => setCurrentView('create')}
                disabled={availableCredits === 0}
              >
                Create Quiz
              </Button>
              {availableCredits === 0 && (
                <p className="text-xs text-white/60 mt-2 text-center">
                  No credits available
                </p>
              )}
            </Card>
          </div>

          {/* Purchases */}
          <Card gradient className="p-8">
            <h2 className="text-2xl font-bold text-white mb-6">My Purchases</h2>
            
            {loading ? (
              <div className="text-center py-8 text-white/50">Loading...</div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎮</div>
                <p className="text-white/70 mb-6">No purchases yet</p>
                <Button
                  gradient
                  onClick={() => window.location.href = '/pricing'}
                >
                  Browse Plans
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div>
                      <div className="text-lg font-bold text-white">{purchase.plan_name}</div>
                      <div className="text-sm text-white/60">
                        Up to {purchase.max_players} players • {new Date(purchase.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      {purchase.used ? (
                        <span className="px-4 py-2 bg-white/5 text-white/50 rounded-lg">
                          Used
                        </span>
                      ) : (
                        <Button
                          gradient
                          onClick={() => setCurrentView('create')}
                        >
                          Use Credit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
