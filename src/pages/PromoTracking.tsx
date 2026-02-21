import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Lock,
  BarChart3,
  RefreshCw,
  Ticket,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  TrendingUp,
  Zap,
  Gift,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const SALES_PASSWORD = import.meta.env.VITE_SALES_PASSWORD || '';

// ─── Types ──────────────────────────────────────────────────────
interface Redemption {
  user_id: string;
  redeemed_at: string;
  quiz_used: boolean;
}

interface PromoCode {
  id: string;
  code: string;
  plan_name: string;
  max_players: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  redemptions: Redemption[];
}

// ─── Password Gate ──────────────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === SALES_PASSWORD) {
      sessionStorage.setItem('promo_auth', '1');
      onAuth();
    } else {
      setError('Wrong password');
    }
  };

  return (
    <div className="min-h-screen bg-qb-dark flex items-center justify-center p-4">
      <Card gradient className="max-w-sm w-full text-center">
        <Ticket className="w-12 h-12 text-qb-purple mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Promo Code Tracking</h1>
        <p className="text-white/60 mb-6 text-sm">Enter password to access</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(''); }}
            error={error}
            autoFocus
          />
          <Button type="submit" gradient fullWidth icon={<Lock className="w-4 h-4" />}>
            Access
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
}) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-white/60 text-xs">{label}</div>
        {sub && <div className="text-white/40 text-[10px] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── Create Code Modal ──────────────────────────────────────────
function CreateCodeForm({ onCreated }: { onCreated: () => void }) {
  const [code, setCode] = useState('');
  const [planName, setPlanName] = useState('Pro');
  const [maxPlayers, setMaxPlayers] = useState(250);
  const [maxUses, setMaxUses] = useState(50);
  const [expiresIn, setExpiresIn] = useState('30'); // days
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { setError('Code is required'); return; }
    setLoading(true);
    setError('');

    const expiresAt = expiresIn
      ? new Date(Date.now() + parseInt(expiresIn) * 86400000).toISOString()
      : null;

    try {
      const res = await fetch('/api/promo-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: SALES_PASSWORD,
          action: 'create_code',
          code: code.trim().toUpperCase(),
          planName,
          maxPlayers,
          maxUses,
          expiresAt,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCode('');
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card gradient className="mb-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-qb-cyan" /> Create New Promo Code
      </h2>
      <form onSubmit={handleCreate} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
        <div>
          <label className="text-white/60 text-xs mb-1 block">Code</label>
          <Input
            placeholder="e.g. TRIVIAHOSTS"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">Plan</label>
          <select
            className="w-full px-4 py-3 rounded-xl bg-qb-darker border-2 border-white/20 text-white focus:border-qb-cyan focus:outline-none"
            value={planName}
            onChange={(e) => {
              setPlanName(e.target.value);
              const plans: Record<string, number> = {
                Solo: 5, Friends: 15, Party: 50, 'Pro Event': 100, Pro: 250,
              };
              setMaxPlayers(plans[e.target.value] || 250);
            }}
          >
            <option value="Solo">Solo (5p)</option>
            <option value="Friends">Friends (15p)</option>
            <option value="Party">Party (50p)</option>
            <option value="Pro Event">Pro Event (100p)</option>
            <option value="Pro">Pro (250p)</option>
          </select>
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">Max Players</label>
          <Input
            type="number"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">Max Uses</label>
          <Input
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(parseInt(e.target.value) || 0)}
          />
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">Expires in (days)</label>
          <Input
            type="number"
            placeholder="30"
            value={expiresIn}
            onChange={(e) => setExpiresIn(e.target.value)}
          />
        </div>
        <div>
          <Button type="submit" gradient fullWidth loading={loading} icon={<Plus className="w-4 h-4" />}>
            Create
          </Button>
        </div>
      </form>
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </Card>
  );
}

// ─── Code Row ───────────────────────────────────────────────────
function CodeRow({ code, onRefresh }: { code: PromoCode; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
  const isExhausted = code.used_count >= code.max_uses;
  const usagePercent = Math.min(100, Math.round((code.used_count / code.max_uses) * 100));
  const conversionRate = code.redemptions.length > 0
    ? Math.round((code.redemptions.filter(r => r.quiz_used).length / code.redemptions.length) * 100)
    : 0;

  const statusColor = !code.is_active
    ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    : isExpired
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : isExhausted
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-green-500/20 text-green-400 border-green-500/30';

  const statusLabel = !code.is_active
    ? 'Disabled'
    : isExpired
      ? 'Expired'
      : isExhausted
        ? 'Exhausted'
        : 'Active';

  const toggleActive = async () => {
    setToggling(true);
    try {
      await fetch('/api/promo-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: SALES_PASSWORD,
          action: 'toggle_active',
          codeId: code.id,
          isActive: !code.is_active,
        }),
      });
      onRefresh();
    } finally {
      setToggling(false);
    }
  };

  const deleteCode = async () => {
    if (!confirm(`Delete code ${code.code}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch('/api/promo-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: SALES_PASSWORD,
          action: 'delete_code',
          codeId: code.id,
        }),
      });
      onRefresh();
    } finally {
      setDeleting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Main row */}
      <div
        className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Code name */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <button
            onClick={(e) => { e.stopPropagation(); copyCode(); }}
            className="text-lg font-mono font-bold text-qb-cyan hover:text-white transition-colors flex items-center gap-1.5"
          >
            {code.code}
            {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-3.5 h-3.5 opacity-40" />}
          </button>
        </div>

        {/* Plan */}
        <div className="text-white/70 text-sm min-w-[80px]">
          <span className="bg-qb-purple/30 text-qb-purple border border-qb-purple/30 px-2 py-0.5 rounded-full text-xs font-medium">
            {code.plan_name}
          </span>
        </div>

        {/* Max players */}
        <div className="text-white/60 text-sm min-w-[60px] flex items-center gap-1">
          <Users className="w-3.5 h-3.5" /> {code.max_players}p
        </div>

        {/* Usage bar */}
        <div className="flex-1 min-w-[120px]">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 50 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <span className="text-white/70 text-xs font-mono shrink-0">
              {code.used_count}/{code.max_uses}
            </span>
          </div>
        </div>

        {/* Conversion */}
        <div className="text-white/60 text-sm min-w-[70px] flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" /> {conversionRate}%
        </div>

        {/* Status */}
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor} min-w-[70px] text-center`}>
          {statusLabel}
        </span>

        {/* Expiry */}
        <div className="text-white/50 text-xs min-w-[90px]">
          {code.expires_at
            ? new Date(code.expires_at) < new Date()
              ? <span className="text-red-400">Expired {timeAgo(code.expires_at)}</span>
              : <span>Exp. {new Date(code.expires_at).toLocaleDateString()}</span>
            : <span className="text-white/30">No expiry</span>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); toggleActive(); }}
            disabled={toggling}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            title={code.is_active ? 'Disable' : 'Enable'}
          >
            {code.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteCode(); }}
            disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors text-white/50 hover:text-red-400"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>
      </div>

      {/* Expanded: redemption details */}
      {expanded && (
        <div className="border-t border-white/10 px-4 py-3 bg-white/[0.02]">
          {code.redemptions.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-2">No redemptions yet</p>
          ) : (
            <div className="space-y-1.5">
              <div className="grid grid-cols-4 text-white/40 text-xs font-medium pb-1 border-b border-white/10">
                <span>#</span>
                <span>User ID</span>
                <span>Redeemed</span>
                <span>Quiz Used</span>
              </div>
              {code.redemptions
                .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime())
                .map((r, i) => (
                  <div key={i} className="grid grid-cols-4 text-sm text-white/70 items-center">
                    <span className="text-white/40 text-xs">{i + 1}</span>
                    <span className="font-mono text-xs truncate pr-2">{r.user_id.slice(0, 12)}…</span>
                    <span className="text-xs">{timeAgo(r.redeemed_at)}</span>
                    <span>
                      {r.quiz_used
                        ? <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                        : <span className="text-white/40 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Not yet</span>}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Main Component ─────────────────────────────────────────────
export function PromoTracking() {
  const [authed, setAuthed] = useState(sessionStorage.getItem('promo_auth') === '1');
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'community' | 'single'>('all');

  const fetchCodes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/promo-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: SALES_PASSWORD, action: 'get_codes' }),
      });
      const data = await res.json();
      if (res.ok) setCodes(data.codes || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchCodes();
  }, [authed, fetchCodes]);

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  // Stats
  const totalCodes = codes.length;
  const activeCodes = codes.filter(c => c.is_active && !(c.expires_at && new Date(c.expires_at) < new Date())).length;
  const totalRedemptions = codes.reduce((sum, c) => sum + c.used_count, 0);
  const totalQuizUsed = codes.reduce((sum, c) => sum + c.redemptions.filter(r => r.quiz_used).length, 0);
  const overallConversion = totalRedemptions > 0 ? Math.round((totalQuizUsed / totalRedemptions) * 100) : 0;
  const communityCodes = codes.filter(c => c.max_uses > 1);
  const communityRedemptions = communityCodes.reduce((sum, c) => sum + c.used_count, 0);

  // Filtered codes
  const filteredCodes = codes.filter(c => {
    if (filter === 'active') return c.is_active && !(c.expires_at && new Date(c.expires_at) < new Date());
    if (filter === 'community') return c.max_uses > 1;
    if (filter === 'single') return c.max_uses === 1;
    return true;
  });

  return (
    <div className="min-h-screen bg-qb-dark">
      {/* Header */}
      <div className="bg-qb-darker/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="w-7 h-7 text-qb-cyan" />
            <h1 className="text-xl font-bold text-white">Promo Code Tracking</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={fetchCodes}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              gradient
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setShowCreate(!showCreate)}
            >
              New Code
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard
            icon={<Ticket className="w-5 h-5 text-white" />}
            label="Total Codes"
            value={totalCodes}
            color="bg-qb-purple/30"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-white" />}
            label="Active"
            value={activeCodes}
            color="bg-green-500/30"
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-white" />}
            label="Total Redemptions"
            value={totalRedemptions}
            color="bg-qb-cyan/30"
          />
          <StatCard
            icon={<Zap className="w-5 h-5 text-white" />}
            label="Quiz Conversion"
            value={`${overallConversion}%`}
            sub={`${totalQuizUsed} quizzes played`}
            color="bg-amber-500/30"
          />
          <StatCard
            icon={<Gift className="w-5 h-5 text-white" />}
            label="Community Codes"
            value={communityCodes.length}
            sub={`${communityRedemptions} redemptions`}
            color="bg-pink-500/30"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            label="Last 7 Days"
            value={codes.reduce((sum, c) =>
              sum + c.redemptions.filter(r =>
                Date.now() - new Date(r.redeemed_at).getTime() < 7 * 86400000
              ).length, 0
            )}
            sub="recent redemptions"
            color="bg-blue-500/30"
          />
        </div>

        {/* Create form */}
        {showCreate && <CreateCodeForm onCreated={() => { fetchCodes(); setShowCreate(false); }} />}

        {/* Filter tabs */}
        <div className="flex items-center gap-2">
          {(['all', 'active', 'community', 'single'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-qb-purple text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {f === 'all' ? `All (${codes.length})` :
               f === 'active' ? `Active (${activeCodes})` :
               f === 'community' ? `Community (${communityCodes.length})` :
               `Single-use (${codes.filter(c => c.max_uses === 1).length})`}
            </button>
          ))}
        </div>

        {/* Code list */}
        <div className="space-y-2">
          {loading && codes.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
              Loading codes...
            </div>
          ) : filteredCodes.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <Ticket className="w-8 h-8 mx-auto mb-3 opacity-40" />
              No promo codes found
            </div>
          ) : (
            filteredCodes.map(code => (
              <CodeRow key={code.id} code={code} onRefresh={fetchCodes} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
