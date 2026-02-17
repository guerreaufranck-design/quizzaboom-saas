import { useState, useEffect, useCallback } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Lock,
  Plus,
  Send,
  SendHorizonal,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  Mail,
  BarChart3,
  RefreshCw,
  Beer,
  UtensilsCrossed,
  Hotel,
  PartyPopper,
} from 'lucide-react';

const SALES_PASSWORD = import.meta.env.VITE_SALES_PASSWORD || '';

// ─── Template definitions ────────────────────────────────────────
type TemplateId =
  | 'pub_with_quiz'
  | 'pub_no_quiz'
  | 'restaurant_with_quiz'
  | 'restaurant_no_quiz'
  | 'hotel_with_quiz'
  | 'hotel_no_quiz'
  | 'animation_with_quiz'
  | 'animation_no_quiz';

interface TemplateOption {
  id: TemplateId;
  label: string;
  description: string;
  icon: typeof Beer;
  color: string;
}

const TEMPLATE_GROUPS: { group: string; templates: TemplateOption[] }[] = [
  {
    group: 'Pub / Bar',
    templates: [
      {
        id: 'pub_with_quiz',
        label: 'Has quiz nights',
        description: 'They already run quizzes — pitch the upgrade',
        icon: Beer,
        color: 'text-amber-400',
      },
      {
        id: 'pub_no_quiz',
        label: 'No quiz yet',
        description: 'They don\'t do quizzes — pitch the opportunity',
        icon: Beer,
        color: 'text-amber-400',
      },
    ],
  },
  {
    group: 'Restaurant',
    templates: [
      {
        id: 'restaurant_with_quiz',
        label: 'Has quiz/events',
        description: 'They run events — pitch a polished upgrade',
        icon: UtensilsCrossed,
        color: 'text-orange-400',
      },
      {
        id: 'restaurant_no_quiz',
        label: 'No events',
        description: 'No entertainment — pitch midweek table filler',
        icon: UtensilsCrossed,
        color: 'text-orange-400',
      },
    ],
  },
  {
    group: 'Hotel',
    templates: [
      {
        id: 'hotel_with_quiz',
        label: 'Has entertainment',
        description: 'They offer activities — pitch quiz as add-on',
        icon: Hotel,
        color: 'text-blue-400',
      },
      {
        id: 'hotel_no_quiz',
        label: 'No entertainment',
        description: 'Keep guests on-site & spending at the bar',
        icon: Hotel,
        color: 'text-blue-400',
      },
    ],
  },
  {
    group: 'Animation / Events',
    templates: [
      {
        id: 'animation_with_quiz',
        label: 'Offers quizzes',
        description: 'They do quizzes — pitch scaling with AI + white label',
        icon: PartyPopper,
        color: 'text-pink-400',
      },
      {
        id: 'animation_no_quiz',
        label: 'No quiz service',
        description: 'Add quiz nights to their catalogue instantly',
        icon: PartyPopper,
        color: 'text-pink-400',
      },
    ],
  },
];

const ALL_TEMPLATES = TEMPLATE_GROUPS.flatMap((g) => g.templates);

// ─── Interfaces ──────────────────────────────────────────────────
interface Lead {
  id: string;
  venue_name: string;
  email: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  created_at: string;
  notes: string | null;
  template?: TemplateId;
}

// ─── Password gate ───────────────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === SALES_PASSWORD) {
      sessionStorage.setItem('sales_auth', '1');
      onAuth();
    } else {
      setError('Wrong password');
    }
  };

  return (
    <div className="min-h-screen bg-qb-dark flex items-center justify-center p-4">
      <Card gradient className="max-w-sm w-full text-center">
        <Lock className="w-12 h-12 text-qb-purple mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Sales Outreach</h1>
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

// ─── Status badge ────────────────────────────────────────────────
function StatusBadge({ status }: { status: Lead['status'] }) {
  const config = {
    pending: { icon: Clock, color: 'text-yellow-400 bg-yellow-400/10', label: 'Pending' },
    sent: { icon: CheckCircle2, color: 'text-green-400 bg-green-400/10', label: 'Sent' },
    failed: { icon: XCircle, color: 'text-red-400 bg-red-400/10', label: 'Failed' },
  };
  const c = config[status];
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {c.label}
    </span>
  );
}

// ─── Template badge ──────────────────────────────────────────────
function TemplateBadge({ templateId }: { templateId?: TemplateId }) {
  if (!templateId) return null;
  const tpl = ALL_TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return null;
  const Icon = tpl.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${tpl.color} bg-white/5`}>
      <Icon className="w-3 h-3" />
      {tpl.label}
    </span>
  );
}

// ─── Main component ──────────────────────────────────────────────
export function SalesOutreach() {
  const [authed, setAuthed] = useState(sessionStorage.getItem('sales_auth') === '1');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Form
  const [venueName, setVenueName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('pub_with_quiz');
  const [formError, setFormError] = useState('');

  // View
  const [tab, setTab] = useState<'today' | 'history'>('today');

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales-outreach-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: SALES_PASSWORD, days: tab === 'today' ? 1 : 30 }),
      });
      const data = await res.json();
      if (res.ok) {
        // Map DB leads — notes field stores the template id
        const mapped = (data.leads || []).map((l: Lead & { notes?: string }) => ({
          ...l,
          template: l.notes as TemplateId || undefined,
        }));
        setLeads(mapped);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (authed) fetchLeads();
  }, [authed, fetchLeads]);

  // ─── Add lead → save to DB immediately ─────────────────────────
  const addLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!venueName.trim()) return setFormError('Venue name required');
    if (!email.trim() || !email.includes('@')) return setFormError('Valid email required');

    if (leads.some((l) => l.email.toLowerCase() === email.toLowerCase().trim())) {
      return setFormError('Email already in list');
    }

    setAdding(true);
    try {
      const res = await fetch('/api/sales-outreach-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: SALES_PASSWORD,
          venueName: venueName.trim(),
          email: email.trim().toLowerCase(),
          template: selectedTemplate,
        }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setFormError('Email already exists in database');
        return;
      }

      if (!res.ok) {
        setFormError(data.error || 'Failed to add');
        return;
      }

      // Add the DB-saved lead to the list
      const newLead: Lead = {
        ...data.lead,
        template: selectedTemplate,
      };
      setLeads((prev) => [newLead, ...prev]);
      setVenueName('');
      setEmail('');
    } catch {
      setFormError('Network error — try again');
    } finally {
      setAdding(false);
    }
  };

  // ─── Delete lead from DB ───────────────────────────────────────
  const removeLead = async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    // Fire-and-forget DB delete
    fetch('/api/sales-outreach-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: SALES_PASSWORD, id }),
    }).catch(() => {});
  };

  const sendOne = async (lead: Lead) => {
    setSendingId(lead.id);
    try {
      const res = await fetch('/api/sales-outreach-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: SALES_PASSWORD,
          prospects: [{ id: lead.id, venueName: lead.venue_name, email: lead.email, template: lead.template || 'pub_no_quiz' }],
        }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === lead.id
              ? { ...l, status: data.results[0]?.status || 'failed', sent_at: new Date().toISOString() }
              : l
          )
        );
      }
    } catch {
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: 'failed' } : l))
      );
    } finally {
      setSendingId(null);
    }
  };

  const sendAllPending = async () => {
    const pending = leads.filter((l) => l.status === 'pending');
    if (pending.length === 0) return;

    setSending(true);
    try {
      const res = await fetch('/api/sales-outreach-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: SALES_PASSWORD,
          prospects: pending.map((l) => ({
            id: l.id,
            venueName: l.venue_name,
            email: l.email,
            template: l.template || 'pub_no_quiz',
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.results) {
        const resultMap = new Map(data.results.map((r: { email: string; status: string }) => [r.email, r.status]));
        setLeads((prev) =>
          prev.map((l) => {
            const newStatus = resultMap.get(l.email);
            if (newStatus) return { ...l, status: newStatus as Lead['status'], sent_at: new Date().toISOString() };
            return l;
          })
        );
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  };

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  const pendingCount = leads.filter((l) => l.status === 'pending').length;
  const sentCount = leads.filter((l) => l.status === 'sent').length;
  const failedCount = leads.filter((l) => l.status === 'failed').length;

  return (
    <div className="min-h-screen bg-qb-dark p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <SendHorizonal className="w-8 h-8 text-qb-purple" />
              Sales Outreach
            </h1>
            <p className="text-white/50 mt-1">B2B prospecting — UK & Ireland venues</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchLeads}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card gradient>
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-400">{pendingCount}</p>
              <p className="text-white/60 text-sm mt-1">Pending</p>
            </div>
          </Card>
          <Card gradient>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">{sentCount}</p>
              <p className="text-white/60 text-sm mt-1">Sent</p>
            </div>
          </Card>
          <Card gradient>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-400">{failedCount}</p>
              <p className="text-white/60 text-sm mt-1">Failed</p>
            </div>
          </Card>
        </div>

        {/* Template selector */}
        <Card gradient>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-qb-cyan" />
            Email Template
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATE_GROUPS.map((group) => (
              <div key={group.group}>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">{group.group}</p>
                <div className="space-y-2">
                  {group.templates.map((tpl) => {
                    const Icon = tpl.icon;
                    const isSelected = selectedTemplate === tpl.id;
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => setSelectedTemplate(tpl.id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-qb-purple bg-qb-purple/20'
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${tpl.color}`} />
                          <span className="text-white text-sm font-medium">{tpl.label}</span>
                        </div>
                        <p className="text-white/40 text-xs">{tpl.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Add prospect form */}
        <Card gradient>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-qb-cyan" />
            Add Prospect
          </h2>
          <form onSubmit={addLead} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Venue name (e.g. The Crown Pub)"
                value={venueName}
                onChange={(e) => { setVenueName(e.target.value); setFormError(''); }}
              />
            </div>
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFormError(''); }}
              />
            </div>
            <Button type="submit" variant="primary" icon={<Plus className="w-4 h-4" />} className="shrink-0" loading={adding}>
              Add
            </Button>
          </form>
          {formError && <p className="text-red-400 text-sm mt-2">{formError}</p>}
          <p className="text-white/30 text-xs mt-2">
            Template: <TemplateBadge templateId={selectedTemplate} /> — change above before adding
          </p>
        </Card>

        {/* Tabs + Send All */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={tab === 'today' ? 'primary' : 'ghost'}
              onClick={() => setTab('today')}
              icon={<Clock className="w-4 h-4" />}
            >
              Today
            </Button>
            <Button
              size="sm"
              variant={tab === 'history' ? 'primary' : 'ghost'}
              onClick={() => setTab('history')}
              icon={<BarChart3 className="w-4 h-4" />}
            >
              Last 30 days
            </Button>
          </div>
          {pendingCount > 0 && (
            <Button
              gradient
              size="sm"
              icon={<Send className="w-4 h-4" />}
              onClick={sendAllPending}
              loading={sending}
            >
              Send All Pending ({pendingCount})
            </Button>
          )}
        </div>

        {/* Leads table */}
        <Card>
          {leads.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">No prospects yet. Add your first one above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white/60 text-xs uppercase tracking-wider py-3 px-2">Venue</th>
                    <th className="text-left text-white/60 text-xs uppercase tracking-wider py-3 px-2">Email</th>
                    <th className="text-left text-white/60 text-xs uppercase tracking-wider py-3 px-2">Template</th>
                    <th className="text-left text-white/60 text-xs uppercase tracking-wider py-3 px-2">Status</th>
                    <th className="text-left text-white/60 text-xs uppercase tracking-wider py-3 px-2">Date</th>
                    <th className="text-right text-white/60 text-xs uppercase tracking-wider py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-qb-purple shrink-0" />
                          <span className="text-white font-medium text-sm">{lead.venue_name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-white/70 text-sm">{lead.email}</span>
                      </td>
                      <td className="py-3 px-2">
                        <TemplateBadge templateId={lead.template} />
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="py-3 px-2 text-white/40 text-sm whitespace-nowrap">
                        {new Date(lead.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center justify-end gap-2">
                          {lead.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="success"
                              icon={<Send className="w-3.5 h-3.5" />}
                              onClick={() => sendOne(lead)}
                              loading={sendingId === lead.id}
                            >
                              Send
                            </Button>
                          )}
                          {lead.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="danger"
                              icon={<RefreshCw className="w-3.5 h-3.5" />}
                              onClick={() => {
                                setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, status: 'pending' } : l));
                              }}
                            >
                              Retry
                            </Button>
                          )}
                          {lead.status !== 'sent' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                              onClick={() => removeLead(lead.id)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
