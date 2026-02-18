import { useState, useEffect, useCallback, useRef } from 'react';
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
  Users,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  Globe,
  MapPin,
  Shield,
  Sparkles,
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

interface Signup {
  id: string;
  name: string;
  type: string;
  plan: string;
  status: string;
  trial_ends_at: string | null;
  quizzes_used: number;
  quiz_limit: number;
  created_at: string;
  country: string;
  city: string;
  business_type: string;
  verification_status: string;
}

interface PendingRequest {
  id: string;
  user_id: string;
  name: string;
  country: string;
  city: string;
  region: string;
  business_type: string;
  business_description: string;
  phone: string;
  full_name: string;
  registration_type: string;
  status: string;
  created_at: string;
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

// ─── Verification badge ─────────────────────────────────────────
function VerifBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    approved: { color: 'text-green-400 bg-green-400/10', label: 'Verified' },
    pending: { color: 'text-yellow-400 bg-yellow-400/10', label: 'Pending' },
    rejected: { color: 'text-red-400 bg-red-400/10', label: 'Rejected' },
    none: { color: 'text-white/30 bg-white/5', label: 'No verif' },
  };
  const c = config[status] || config.none;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
      <Shield className="w-3 h-3" />
      {c.label}
    </span>
  );
}

// ─── Sub badge ───────────────────────────────────────────────────
function SubBadge({ status, plan }: { status: string; plan: string }) {
  const color =
    status === 'active' ? 'text-green-400 bg-green-400/10' :
    status === 'trial' ? 'text-cyan-400 bg-cyan-400/10' :
    status === 'cancelled' ? 'text-red-400 bg-red-400/10' :
    'text-white/30 bg-white/5';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <Sparkles className="w-3 h-3" />
      {plan} / {status}
    </span>
  );
}

// ─── Venue type icon ─────────────────────────────────────────────
function VenueTypeIcon({ type }: { type: string }) {
  const icons: Record<string, typeof Beer> = {
    bar: Beer,
    restaurant: UtensilsCrossed,
    hotel: Hotel,
    event_company: PartyPopper,
  };
  const Icon = icons[type] || Building2;
  return <Icon className="w-4 h-4 text-qb-purple shrink-0" />;
}

// ─── CSV parser (client-side) ────────────────────────────────────
function parseCsv(text: string): { venueName: string; email: string; template: string }[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return []; // Need header + at least 1 row

  const header = lines[0].toLowerCase();
  const sep = header.includes('\t') ? '\t' : header.includes(';') ? ';' : ',';
  const cols = header.split(sep).map((c) => c.trim().replace(/"/g, ''));

  // Find column indices
  const nameIdx = cols.findIndex((c) => c.includes('name') || c.includes('venue') || c.includes('nom') || c.includes('etablissement'));
  const emailIdx = cols.findIndex((c) => c.includes('email') || c.includes('mail'));
  const templateIdx = cols.findIndex((c) => c.includes('template') || c.includes('type'));

  if (nameIdx === -1 || emailIdx === -1) return [];

  const rows: { venueName: string; email: string; template: string }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(sep).map((v) => v.trim().replace(/"/g, ''));
    const venueName = vals[nameIdx] || '';
    const email = vals[emailIdx] || '';
    const template = templateIdx >= 0 ? (vals[templateIdx] || '') : '';
    if (venueName && email && email.includes('@')) {
      rows.push({ venueName, email, template });
    }
  }
  return rows;
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

  // Main navigation tabs
  const [section, setSection] = useState<'outreach' | 'signups' | 'import'>('outreach');

  // Outreach sub-tabs
  const [tab, setTab] = useState<'today' | 'history'>('today');

  // Signups
  const [signups, setSignups] = useState<Signup[]>([]);
  const [signupsLoading, setSignupsLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Import CSV
  const [csvPreview, setCsvPreview] = useState<{ venueName: string; email: string; template: string }[]>([]);
  const [importTemplate, setImportTemplate] = useState<TemplateId>('pub_with_quiz');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const fetchSignups = useCallback(async () => {
    setSignupsLoading(true);
    try {
      const res = await fetch('/api/sales-outreach-signups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: SALES_PASSWORD, days: 90 }),
      });
      const data = await res.json();
      if (res.ok) {
        setSignups(data.signups || []);
        setPendingRequests(data.pending || []);
      }
    } catch {
      // silent
    } finally {
      setSignupsLoading(false);
    }
  }, []);

  const handleApprove = async (requestId: string, action: 'approve' | 'reject') => {
    setApprovingId(requestId);
    try {
      const res = await fetch('/api/sales-outreach-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: SALES_PASSWORD,
          verificationRequestId: requestId,
          action,
        }),
      });
      if (res.ok) {
        // Remove from pending list
        setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
        // Refresh signups to show the newly approved org
        if (action === 'approve') {
          fetchSignups();
        }
      }
    } catch {
      // silent
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    if (authed && section === 'outreach') fetchLeads();
  }, [authed, section, fetchLeads]);

  useEffect(() => {
    if (authed && section === 'signups') fetchSignups();
  }, [authed, section, fetchSignups]);

  // ─── Add lead ─────────────────────────────────────────────────
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

  // ─── Delete lead ──────────────────────────────────────────────
  const removeLead = async (id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    fetch('/api/sales-outreach-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: SALES_PASSWORD, id }),
    }).catch(() => {});
  };

  // ─── Send emails ──────────────────────────────────────────────
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

  // ─── CSV file handler ─────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCsv(text);
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (csvPreview.length === 0) return;
    setImporting(true);
    setImportResult(null);

    try {
      const rows = csvPreview.map((r) => ({
        venueName: r.venueName,
        email: r.email,
        template: r.template || importTemplate,
      }));

      const res = await fetch('/api/sales-outreach-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: SALES_PASSWORD, rows }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult({ imported: data.imported, skipped: data.skipped, errors: data.errors });
        // Refresh leads list
        if (data.imported > 0) {
          fetchLeads();
        }
      }
    } catch {
      setImportResult({ imported: 0, skipped: 0, errors: csvPreview.length });
    } finally {
      setImporting(false);
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
        </div>

        {/* Main Navigation */}
        <div className="flex gap-2 border-b border-white/10 pb-1">
          <button
            onClick={() => setSection('outreach')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all ${
              section === 'outreach'
                ? 'bg-qb-purple/20 text-qb-purple border-b-2 border-qb-purple'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Mail className="w-4 h-4" />
            Outreach
          </button>
          <button
            onClick={() => setSection('signups')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all ${
              section === 'signups'
                ? 'bg-qb-cyan/20 text-qb-cyan border-b-2 border-qb-cyan'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4" />
            Pro Signups
            {pendingRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold animate-pulse">{pendingRequests.length}</span>
            )}
            {signups.length > 0 && pendingRequests.length === 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-qb-cyan/20 text-qb-cyan text-xs">{signups.length}</span>
            )}
          </button>
          <button
            onClick={() => setSection('import')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all ${
              section === 'import'
                ? 'bg-green-500/20 text-green-400 border-b-2 border-green-400'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SECTION: OUTREACH
           ══════════════════════════════════════════════════════════════ */}
        {section === 'outreach' && (
          <>
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

            {/* Sub-tabs + Send All */}
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
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<RefreshCw className="w-4 h-4" />}
                  onClick={fetchLeads}
                  loading={loading}
                >
                  Refresh
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
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION: PRO SIGNUPS
           ══════════════════════════════════════════════════════════════ */}
        {section === 'signups' && (
          <>
            {/* Pending Approvals */}
            {pendingRequests.length > 0 && (
              <Card className="border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Pending Approvals ({pendingRequests.length})
                  </h2>
                </div>
                <div className="space-y-3">
                  {pendingRequests.map((r) => (
                    <div key={r.id} className="bg-qb-darker/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="text-white font-semibold text-sm truncate">{r.name}</span>
                          <span className="text-white/30 text-xs">({r.registration_type})</span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-white/50">
                          {r.business_type && (
                            <span className="flex items-center gap-1 capitalize">
                              <Building2 className="w-3 h-3" />
                              {r.business_type}
                            </span>
                          )}
                          {r.country && (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <span className="uppercase">{r.country}</span>
                            </span>
                          )}
                          {r.city && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {r.city}{r.region ? `, ${r.region}` : ''}
                            </span>
                          )}
                          {r.full_name && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {r.full_name}
                            </span>
                          )}
                          {r.phone && (
                            <span className="text-white/40">{r.phone}</span>
                          )}
                        </div>
                        {r.business_description && (
                          <p className="text-white/40 text-xs mt-1 line-clamp-2">{r.business_description}</p>
                        )}
                        <p className="text-white/30 text-xs mt-1">
                          Submitted {new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="success"
                          icon={<CheckCircle2 className="w-4 h-4" />}
                          onClick={() => handleApprove(r.id, 'approve')}
                          loading={approvingId === r.id}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          icon={<XCircle className="w-4 h-4" />}
                          onClick={() => handleApprove(r.id, 'reject')}
                          loading={approvingId === r.id}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
              <Card gradient>
                <div className="text-center">
                  <p className="text-3xl font-bold text-qb-cyan">{signups.length}</p>
                  <p className="text-white/60 text-sm mt-1">Total (90d)</p>
                </div>
              </Card>
              <Card gradient>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">
                    {signups.filter((s) => s.status === 'active').length}
                  </p>
                  <p className="text-white/60 text-sm mt-1">Active</p>
                </div>
              </Card>
              <Card gradient>
                <div className="text-center">
                  <p className="text-3xl font-bold text-cyan-400">
                    {signups.filter((s) => s.status === 'trial').length}
                  </p>
                  <p className="text-white/60 text-sm mt-1">Trial</p>
                </div>
              </Card>
              <Card gradient>
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-400">
                    {signups.filter((s) => s.quizzes_used > 0).length}
                  </p>
                  <p className="text-white/60 text-sm mt-1">Used quiz</p>
                </div>
              </Card>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-qb-cyan" />
                Pro Registrations (last 90 days)
              </h2>
              <Button
                variant="ghost"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={fetchSignups}
                loading={signupsLoading}
              >
                Refresh
              </Button>
            </div>

            <Card>
              {signupsLoading && signups.length === 0 ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-8 h-8 text-white/20 mx-auto mb-3 animate-spin" />
                  <p className="text-white/40">Loading signups...</p>
                </div>
              ) : signups.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40">No pro signups yet in the last 90 days.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-white/60 text-xs uppercase tracking-wider py-3 px-2">Organisation</th>
                        <th className="text-left text-white/60 text-xs uppercase tracking-wider py-3 px-2">Type</th>
                        <th className="text-left text-white/60 text-xs uppercase tracking-wider py-3 px-2">Location</th>
                        <th className="text-left text-white/60 text-xs uppercase tracking-wider py-3 px-2">Plan</th>
                        <th className="text-left text-white/60 text-xs uppercase tracking-wider py-3 px-2">Verif</th>
                        <th className="text-left text-white/60 text-xs uppercase tracking-wider py-3 px-2">Usage</th>
                        <th className="text-left text-white/60 text-xs uppercase tracking-wider py-3 px-2">Signed up</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signups.map((s) => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <VenueTypeIcon type={s.type} />
                              <span className="text-white font-medium text-sm">{s.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <span className="text-white/60 text-sm capitalize">{s.business_type || s.type || '—'}</span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1.5 text-white/60 text-sm">
                              {s.country && (
                                <>
                                  <Globe className="w-3 h-3" />
                                  <span className="uppercase">{s.country}</span>
                                </>
                              )}
                              {s.city && (
                                <>
                                  <MapPin className="w-3 h-3 ml-1" />
                                  <span>{s.city}</span>
                                </>
                              )}
                              {!s.country && !s.city && <span className="text-white/30">—</span>}
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <SubBadge status={s.status} plan={s.plan} />
                          </td>
                          <td className="py-3 px-2">
                            <VerifBadge status={s.verification_status} />
                          </td>
                          <td className="py-3 px-2">
                            <span className={`text-sm font-medium ${s.quizzes_used > 0 ? 'text-green-400' : 'text-white/30'}`}>
                              {s.quizzes_used}/{s.quiz_limit || '?'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-white/40 text-sm whitespace-nowrap">
                            {new Date(s.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION: IMPORT CSV
           ══════════════════════════════════════════════════════════════ */}
        {section === 'import' && (
          <>
            {/* Instructions */}
            <Card gradient>
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-400" />
                Import Prospects from CSV
              </h2>
              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <p className="text-white/70 text-sm mb-2">Your CSV file should have these columns:</p>
                <div className="bg-qb-darker rounded p-3 font-mono text-xs text-qb-cyan">
                  name,email,template<br />
                  The Crown Pub,info@thecrownpub.co.uk,pub_with_quiz<br />
                  The Red Lion,hello@redlion.ie,pub_no_quiz<br />
                  Hotel Marais,contact@hotelmarais.com,hotel_no_quiz
                </div>
                <p className="text-white/40 text-xs mt-2">
                  Accepted separators: comma, semicolon, or tab. Column names are flexible (name/venue/nom, email/mail).
                  Template is optional — if missing, the default template below will be used.
                </p>
                <p className="text-white/40 text-xs mt-1">
                  Valid templates: <span className="text-white/60">pub_with_quiz, pub_no_quiz, restaurant_with_quiz, restaurant_no_quiz, hotel_with_quiz, hotel_no_quiz, animation_with_quiz, animation_no_quiz</span>
                </p>
              </div>

              {/* Default template for rows without one */}
              <div className="mb-4">
                <p className="text-white/50 text-sm mb-2">Default template for rows without a template column:</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_TEMPLATES.map((tpl) => {
                    const Icon = tpl.icon;
                    return (
                      <button
                        key={tpl.id}
                        onClick={() => setImportTemplate(tpl.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                          importTemplate === tpl.id
                            ? 'bg-qb-purple/20 border border-qb-purple text-white'
                            : 'bg-white/5 border border-white/10 text-white/50 hover:border-white/20'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${tpl.color}`} />
                        {tpl.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* File upload */}
              <div className="flex gap-3 items-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  icon={<Upload className="w-4 h-4" />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose CSV File
                </Button>
                {csvPreview.length > 0 && (
                  <span className="text-white/60 text-sm">
                    {csvPreview.length} rows detected
                  </span>
                )}
              </div>
            </Card>

            {/* Preview */}
            {csvPreview.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-green-400" />
                    Preview ({csvPreview.length} rows)
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setCsvPreview([]); setImportResult(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      gradient
                      icon={<Upload className="w-4 h-4" />}
                      onClick={handleImport}
                      loading={importing}
                    >
                      Import {csvPreview.length} prospects
                    </Button>
                  </div>
                </div>

                {importResult && (
                  <div className={`mb-4 p-3 rounded-lg border text-sm flex items-center gap-2 ${
                    importResult.errors > 0
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-green-500/10 border-green-500/30 text-green-400'
                  }`}>
                    {importResult.errors > 0 ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>
                      <strong>{importResult.imported}</strong> imported, <strong>{importResult.skipped}</strong> skipped (duplicates), <strong>{importResult.errors}</strong> errors
                    </span>
                  </div>
                )}

                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-white/60 text-xs uppercase tracking-wider py-2 px-2">#</th>
                        <th className="text-left text-white/60 text-xs uppercase tracking-wider py-2 px-2">Venue</th>
                        <th className="text-left text-white/60 text-xs uppercase tracking-wider py-2 px-2">Email</th>
                        <th className="text-left text-white/60 text-xs uppercase tracking-wider py-2 px-2">Template</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 100).map((row, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-2 px-2 text-white/30 text-xs">{i + 1}</td>
                          <td className="py-2 px-2 text-white text-sm">{row.venueName}</td>
                          <td className="py-2 px-2 text-white/70 text-sm">{row.email}</td>
                          <td className="py-2 px-2">
                            {row.template ? (
                              <TemplateBadge templateId={row.template as TemplateId} />
                            ) : (
                              <span className="text-white/30 text-xs">default: <TemplateBadge templateId={importTemplate} /></span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvPreview.length > 100 && (
                    <p className="text-white/30 text-xs text-center py-2">
                      Showing first 100 of {csvPreview.length} rows
                    </p>
                  )}
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
