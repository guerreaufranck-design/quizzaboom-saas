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
} from 'lucide-react';

const SALES_PASSWORD = import.meta.env.VITE_SALES_PASSWORD || '';

interface Lead {
  id: string;
  venue_name: string;
  email: string;
  status: 'pending' | 'sent' | 'failed';
  sent_at: string | null;
  created_at: string;
  notes: string | null;
}

// Password gate
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

// Status badge
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

export function SalesOutreach() {
  const [authed, setAuthed] = useState(sessionStorage.getItem('sales_auth') === '1');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);

  // Form
  const [venueName, setVenueName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');

  // Stats
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
      if (res.ok) setLeads(data.leads || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (authed) fetchLeads();
  }, [authed, fetchLeads]);

  const addLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!venueName.trim()) return setFormError('Venue name required');
    if (!email.trim() || !email.includes('@')) return setFormError('Valid email required');

    // Check duplicate
    if (leads.some((l) => l.email.toLowerCase() === email.toLowerCase().trim())) {
      return setFormError('Email already in list');
    }

    // Optimistic add as local lead (will be saved to DB on send)
    const newLead: Lead = {
      id: crypto.randomUUID(),
      venue_name: venueName.trim(),
      email: email.trim().toLowerCase(),
      status: 'pending',
      sent_at: null,
      created_at: new Date().toISOString(),
      notes: null,
    };
    setLeads((prev) => [newLead, ...prev]);
    setVenueName('');
    setEmail('');
  };

  const removeLead = (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  };

  const sendOne = async (lead: Lead) => {
    setSendingId(lead.id);
    try {
      const res = await fetch('/api/sales-outreach-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: SALES_PASSWORD,
          prospects: [{ id: lead.id, venueName: lead.venue_name, email: lead.email }],
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
          prospects: pending.map((l) => ({ id: l.id, venueName: l.venue_name, email: l.email })),
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
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <SendHorizonal className="w-8 h-8 text-qb-purple" />
              Sales Outreach
            </h1>
            <p className="text-white/50 mt-1">B2B prospecting — UK & Ireland pubs/bars</p>
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
            <Button type="submit" variant="primary" icon={<Plus className="w-4 h-4" />} className="shrink-0">
              Add
            </Button>
          </form>
          {formError && <p className="text-red-400 text-sm mt-2">{formError}</p>}
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
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-white/30 shrink-0" />
                          <span className="text-white/70 text-sm">{lead.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="py-3 px-2 text-white/40 text-sm">
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
