import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  RefreshCw,
  Ticket,
  Users,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Mail,
  Gamepad2,
  Play,
} from 'lucide-react';

const SALES_PASSWORD = import.meta.env.VITE_SALES_PASSWORD || '';

// ─── Types ──────────────────────────────────────────────────────
interface SessionInfo {
  session_code: string;
  status: string;
  total_players: number;
  quiz_title: string | null;
  started_at: string | null;
}

interface Redemption {
  user_id: string;
  email: string | null;
  redeemed_at: string;
  quiz_used: boolean;
  quizzes_created: number;
  sessions_hosted: number;
  total_players_reached: number;
  sessions: SessionInfo[];
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

// ─── Helpers ────────────────────────────────────────────────────
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
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

// ─── Create Code Form ───────────────────────────────────────────
function CreateCodeForm({ onCreated }: { onCreated: () => void }) {
  const [code, setCode] = useState('');
  const [planName, setPlanName] = useState('Pro');
  const [maxPlayers, setMaxPlayers] = useState(250);
  const [maxUses, setMaxUses] = useState(50);
  const [expiresIn, setExpiresIn] = useState('30');
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card gradient className="mb-4">
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
          <Input type="number" value={maxPlayers} onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">Max Uses</label>
          <Input type="number" value={maxUses} onChange={(e) => setMaxUses(parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className="text-white/60 text-xs mb-1 block">Expires (days)</label>
          <Input type="number" placeholder="30" value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)} />
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

// ─── Code Row with expanded redemption details ──────────────────
function CodeRow({ code, onRefresh }: { code: PromoCode; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isExpired = code.expires_at && new Date(code.expires_at) < new Date();
  const isExhausted = code.used_count >= code.max_uses;
  const usagePercent = Math.min(100, Math.round((code.used_count / code.max_uses) * 100));

  const totalPlayersReached = code.redemptions.reduce((sum, r) => sum + r.total_players_reached, 0);
  const totalSessionsHosted = code.redemptions.reduce((sum, r) => sum + r.sessions_hosted, 0);
  const emailsCollected = code.redemptions.filter(r => r.email).length;

  const statusColor = !code.is_active
    ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    : isExpired
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : isExhausted
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-green-500/20 text-green-400 border-green-500/30';

  const statusLabel = !code.is_active ? 'Disabled' : isExpired ? 'Expired' : isExhausted ? 'Exhausted' : 'Active';

  const toggleActive = async () => {
    setToggling(true);
    try {
      await fetch('/api/promo-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: SALES_PASSWORD, action: 'toggle_active', codeId: code.id, isActive: !code.is_active }),
      });
      onRefresh();
    } finally { setToggling(false); }
  };

  const deleteCode = async () => {
    if (!confirm(`Delete code ${code.code}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await fetch('/api/promo-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: SALES_PASSWORD, action: 'delete_code', codeId: code.id }),
      });
      onRefresh();
    } finally { setDeleting(false); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Code name */}
        <div className="min-w-[140px]">
          <button
            onClick={(e) => { e.stopPropagation(); copyCode(); }}
            className="text-base font-mono font-bold text-qb-cyan hover:text-white transition-colors flex items-center gap-1.5"
          >
            {code.code}
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3 h-3 opacity-40" />}
          </button>
        </div>

        {/* Plan */}
        <span className="bg-qb-purple/30 text-qb-purple border border-qb-purple/30 px-2 py-0.5 rounded-full text-xs font-medium shrink-0">
          {code.plan_name}
        </span>

        {/* Usage bar */}
        <div className="flex-1 min-w-[100px]">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            <span className="text-white/70 text-xs font-mono shrink-0">{code.used_count}/{code.max_uses}</span>
          </div>
        </div>

        {/* Emails collected */}
        <div className="text-white/60 text-xs min-w-[50px] flex items-center gap-1" title="Emails collected">
          <Mail className="w-3 h-3" /> {emailsCollected}
        </div>

        {/* Sessions */}
        <div className="text-white/60 text-xs min-w-[50px] flex items-center gap-1" title="Sessions hosted">
          <Play className="w-3 h-3" /> {totalSessionsHosted}
        </div>

        {/* Players reached */}
        <div className="text-white/60 text-xs min-w-[50px] flex items-center gap-1" title="Total players reached">
          <Users className="w-3 h-3" /> {totalPlayersReached}
        </div>

        {/* Status */}
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColor} min-w-[65px] text-center shrink-0`}>
          {statusLabel}
        </span>

        {/* Expiry */}
        <div className="text-white/50 text-xs min-w-[80px] hidden md:block">
          {code.expires_at
            ? new Date(code.expires_at) < new Date()
              ? <span className="text-red-400">Expired</span>
              : <span>Exp. {new Date(code.expires_at).toLocaleDateString()}</span>
            : <span className="text-white/30">No expiry</span>}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); toggleActive(); }} disabled={toggling}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white" title={code.is_active ? 'Disable' : 'Enable'}>
            {code.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); deleteCode(); }} disabled={deleting}
            className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors text-white/50 hover:text-red-400" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
        </div>
      </div>

      {/* Expanded: enriched redemption details */}
      {expanded && (
        <div className="border-t border-white/10 px-4 py-3 bg-white/[0.02]">
          {code.redemptions.length === 0 ? (
            <p className="text-white/40 text-sm text-center py-2">No redemptions yet</p>
          ) : (
            <div className="space-y-0.5">
              {/* Header */}
              <div className="grid grid-cols-12 text-white/40 text-xs font-medium pb-1.5 border-b border-white/10 gap-2">
                <span className="col-span-1">#</span>
                <span className="col-span-3">Email</span>
                <span className="col-span-1">Redeemed</span>
                <span className="col-span-1">Quiz Used</span>
                <span className="col-span-1">Quizzes</span>
                <span className="col-span-1">Sessions</span>
                <span className="col-span-1">Players</span>
                <span className="col-span-3">Recent Sessions</span>
              </div>
              {code.redemptions
                .sort((a, b) => new Date(b.redeemed_at).getTime() - new Date(a.redeemed_at).getTime())
                .map((r, i) => (
                  <div key={i} className="grid grid-cols-12 text-sm text-white/70 items-center py-1.5 gap-2 border-b border-white/5 last:border-0 hover:bg-white/5 rounded transition-colors">
                    <span className="col-span-1 text-white/40 text-xs">{i + 1}</span>
                    <span className="col-span-3 font-mono text-xs truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 text-qb-cyan shrink-0" />
                      {r.email || <span className="text-white/30 italic">no email</span>}
                    </span>
                    <span className="col-span-1 text-xs">{timeAgo(r.redeemed_at)}</span>
                    <span className="col-span-1">
                      {r.quiz_used
                        ? <span className="text-green-400 flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Yes</span>
                        : <span className="text-white/30 flex items-center gap-0.5"><Clock className="w-3 h-3" /> No</span>}
                    </span>
                    <span className="col-span-1 text-xs">
                      <span className={`font-medium ${r.quizzes_created > 0 ? 'text-qb-cyan' : 'text-white/30'}`}>
                        {r.quizzes_created}
                      </span>
                    </span>
                    <span className="col-span-1 text-xs">
                      <span className={`font-medium ${r.sessions_hosted > 0 ? 'text-green-400' : 'text-white/30'}`}>
                        {r.sessions_hosted}
                      </span>
                    </span>
                    <span className="col-span-1 text-xs">
                      <span className={`font-medium ${r.total_players_reached > 0 ? 'text-amber-400' : 'text-white/30'}`}>
                        {r.total_players_reached}
                      </span>
                    </span>
                    <div className="col-span-3 flex flex-wrap gap-1">
                      {r.sessions.length === 0 ? (
                        <span className="text-white/20 text-xs italic">No sessions</span>
                      ) : (
                        r.sessions.slice(0, 3).map((s, si) => (
                          <span key={si} className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${
                            s.status === 'finished' ? 'bg-green-500/15 text-green-400' :
                            s.status === 'playing' ? 'bg-amber-500/15 text-amber-400' :
                            'bg-white/5 text-white/40'
                          }`}>
                            <Gamepad2 className="w-2.5 h-2.5" />
                            {s.quiz_title ? s.quiz_title.slice(0, 20) : s.session_code}
                            {s.total_players > 0 && <span className="opacity-70">({s.total_players}p)</span>}
                          </span>
                        ))
                      )}
                      {r.sessions.length > 3 && (
                        <span className="text-white/30 text-[10px]">+{r.sessions.length - 3} more</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component (exported for use in SalesOutreach) ─────────
export function PromoTrackingPanel() {
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
    fetchCodes();
  }, [fetchCodes]);

  // Stats
  const totalCodes = codes.length;
  const activeCodes = codes.filter(c => c.is_active && !(c.expires_at && new Date(c.expires_at) < new Date())).length;
  const totalRedemptions = codes.reduce((sum, c) => sum + c.used_count, 0);
  const totalEmails = codes.reduce((sum, c) => sum + c.redemptions.filter(r => r.email).length, 0);
  const totalSessionsHosted = codes.reduce((sum, c) => sum + c.redemptions.reduce((s, r) => s + r.sessions_hosted, 0), 0);
  const totalPlayersReached = codes.reduce((sum, c) => sum + c.redemptions.reduce((s, r) => s + r.total_players_reached, 0), 0);
  const communityCodes = codes.filter(c => c.max_uses > 1);
  const recentRedemptions = codes.reduce((sum, c) =>
    sum + c.redemptions.filter(r => Date.now() - new Date(r.redeemed_at).getTime() < 7 * 86400000).length, 0);

  // Filtered codes
  const filteredCodes = codes.filter(c => {
    if (filter === 'active') return c.is_active && !(c.expires_at && new Date(c.expires_at) < new Date());
    if (filter === 'community') return c.max_uses > 1;
    if (filter === 'single') return c.max_uses === 1;
    return true;
  });

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<Ticket className="w-5 h-5 text-white" />} label="Total Codes" value={totalCodes} sub={`${activeCodes} active`} color="bg-qb-purple/30" />
        <StatCard icon={<Users className="w-5 h-5 text-white" />} label="Redemptions" value={totalRedemptions} sub={`${totalEmails} emails collected`} color="bg-qb-cyan/30" />
        <StatCard icon={<Play className="w-5 h-5 text-white" />} label="Sessions Hosted" value={totalSessionsHosted} sub={`${totalPlayersReached} players reached`} color="bg-green-500/30" />
        <StatCard icon={<TrendingUp className="w-5 h-5 text-white" />} label="Last 7 Days" value={recentRedemptions} sub="recent redemptions" color="bg-amber-500/30" />
      </div>

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(['all', 'active', 'community', 'single'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f ? 'bg-qb-purple text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
              }`}
            >
              {f === 'all' ? `All (${codes.length})` :
               f === 'active' ? `Active (${activeCodes})` :
               f === 'community' ? `Community (${communityCodes.length})` :
               `Single (${codes.filter(c => c.max_uses === 1).length})`}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />} onClick={fetchCodes} disabled={loading}>
            Refresh
          </Button>
          <Button size="sm" gradient icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(!showCreate)}>
            New Code
          </Button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && <CreateCodeForm onCreated={() => { fetchCodes(); setShowCreate(false); }} />}

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
          filteredCodes.map(c => <CodeRow key={c.id} code={c} onRefresh={fetchCodes} />)
        )}
      </div>
    </>
  );
}

// Keep backward compatibility for standalone route
export function PromoTracking() {
  return (
    <div className="min-h-screen bg-qb-dark p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Ticket className="w-8 h-8 text-qb-cyan" />
          Promo Code Tracking
        </h1>
        <PromoTrackingPanel />
      </div>
    </div>
  );
}
