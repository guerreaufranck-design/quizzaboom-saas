import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { supabase } from '../services/supabase/client';
import {
  Lock,
  MessageCircle,
  Send,
  CheckCircle2,
  AlertTriangle,
  Bot,
  Headset,
  RefreshCw,
  ArrowLeft,
  RotateCcw,
  Loader2,
} from 'lucide-react';

const SUPPORT_ADMIN_PASSWORD = import.meta.env.VITE_SUPPORT_ADMIN_PASSWORD || '';

// ── Types ──────────────────────────────────────────────────────────
interface Conversation {
  id: string;
  status: string;
  language: string;
  user_page: string | null;
  user_ip: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  escalated_at: string | null;
  last_message: string;
  last_message_role: string;
  message_count: number;
}

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface Stats {
  waiting: number;
  active: number;
  ai_handling: number;
  resolved_today: number;
  total: number;
}

type Tab = 'escalated' | 'active' | 'ai' | 'resolved';

// ── Helpers ────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const langFlags: Record<string, string> = {
  en: '🇬🇧', English: '🇬🇧',
  fr: '🇫🇷', French: '🇫🇷',
  de: '🇩🇪', German: '🇩🇪',
  es: '🇪🇸', Spanish: '🇪🇸',
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  WAITING_HUMAN: { label: 'Waiting', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/30' },
  HUMAN_HANDLING: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30' },
  AI_HANDLING: { label: 'AI', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  RESOLVED: { label: 'Resolved', color: 'text-white/40', bg: 'bg-white/5 border-white/10' },
};

// ── API helper ─────────────────────────────────────────────────────
async function adminAPI(action: string, params: Record<string, unknown> = {}) {
  const res = await fetch('/api/support-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, password: SUPPORT_ADMIN_PASSWORD, ...params }),
  });
  return res.json();
}

// ── Password Gate ──────────────────────────────────────────────────
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await adminAPI('login', { password: pw });
      if (data.ok) {
        sessionStorage.setItem('support_admin_auth', '1');
        onAuth();
      } else {
        setError('Wrong password');
      }
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-qb-dark flex items-center justify-center p-4">
      <Card gradient className="max-w-sm w-full text-center">
        <Lock className="w-12 h-12 text-qb-purple mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Support Admin</h1>
        <p className="text-white/60 mb-6 text-sm">Enter password to access chat management</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Password"
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(''); }}
            error={error}
            autoFocus
          />
          <Button type="submit" gradient fullWidth icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}>
            {loading ? 'Checking...' : 'Access'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ── Stats Bar ──────────────────────────────────────────────────────
function StatsBar({ stats }: { stats: Stats }) {
  const items = [
    { label: 'Waiting', value: stats.waiting, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Active', value: stats.active, icon: Headset, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'AI Handling', value: stats.ai_handling, icon: Bot, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Resolved (24h)', value: stats.resolved_today, icon: CheckCircle2, color: 'text-white/40', bg: 'bg-white/5' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      {items.map((item) => (
        <div key={item.label} className={`${item.bg} rounded-xl p-3 border border-white/5`}>
          <div className="flex items-center gap-2 mb-1">
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <span className="text-xs text-white/50">{item.label}</span>
          </div>
          <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// ── Status Badge ───────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.RESOLVED;
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${config.bg} ${config.color} font-medium`}>
      {config.label}
    </span>
  );
}

// ── Conversation Card ──────────────────────────────────────────────
function ConversationCard({
  conversation,
  isSelected,
  onClick,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const flag = langFlags[conversation.language] || '🌐';
  const isWaiting = conversation.status === 'WAITING_HUMAN';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all border ${
        isSelected
          ? 'bg-qb-purple/20 border-qb-purple/40'
          : 'bg-white/5 border-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-sm">{flag}</span>
          <StatusBadge status={conversation.status} />
          {isWaiting && (
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          )}
        </div>
        <span className="text-[10px] text-white/30">{timeAgo(conversation.updated_at)}</span>
      </div>
      <p className="text-xs text-white/60 truncate mt-1">
        {conversation.last_message || 'No messages'}
      </p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-white/30">
          {conversation.user_page || '/'}
        </span>
        <span className="text-[10px] text-white/30">
          {conversation.message_count} msgs
        </span>
      </div>
    </button>
  );
}

// ── Message Bubble ─────────────────────────────────────────────────
function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'SYSTEM') {
    return (
      <div className="text-center py-2">
        <span className="text-[11px] text-white/30 bg-white/5 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const isUser = message.role === 'USER';
  const isHuman = message.role === 'HUMAN';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col gap-0.5 max-w-[80%]">
        {!isUser && (
          <div className="flex items-center gap-1 px-1">
            {isHuman ? (
              <>
                <Headset className="w-3 h-3 text-qb-cyan" />
                <span className="text-[10px] text-qb-cyan font-medium">Agent</span>
              </>
            ) : (
              <>
                <Bot className="w-3 h-3 text-white/30" />
                <span className="text-[10px] text-white/30">Bot</span>
              </>
            )}
            <span className="text-[10px] text-white/20 ml-1">{formatTime(message.created_at)}</span>
          </div>
        )}
        {isUser && (
          <div className="flex items-center gap-1 px-1 justify-end">
            <span className="text-[10px] text-white/20">{formatTime(message.created_at)}</span>
            <span className="text-[10px] text-qb-purple font-medium">User</span>
          </div>
        )}
        <div
          className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? 'bg-qb-purple/30 text-white rounded-br-md'
              : isHuman
              ? 'bg-qb-cyan/20 text-white/90 rounded-bl-md border border-qb-cyan/20'
              : 'bg-white/10 text-white/90 rounded-bl-md'
          }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}

// ── Conversation Detail ────────────────────────────────────────────
function ConversationDetail({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages
  const loadMessages = useCallback(async () => {
    const data = await adminAPI('get_messages', { conversationId });
    if (data.messages) {
      setMessages(data.messages);
      setConversation(data.conversation);
    }
    setLoading(false);
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Supabase Realtime for new messages
  useEffect(() => {
    const channel = supabase.channel(`support_admin_detail_${conversationId}`);

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const newMsg = payload.new as Message;
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    );

    // Listen for conversation status changes
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'support_conversations',
        filter: `id=eq.${conversationId}`,
      },
      (payload) => {
        setConversation((prev) => prev ? { ...prev, ...payload.new } as Conversation : null);
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const content = input.trim();
    setSending(true);
    setInput('');

    // Optimistic update
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'HUMAN',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    await adminAPI('send_message', { conversationId, content });
    setSending(false);

    // Update conversation status locally
    setConversation((prev) => prev ? { ...prev, status: 'HUMAN_HANDLING' } : null);
  };

  // Resolve
  const resolveConversation = async () => {
    await adminAPI('resolve', { conversationId });
    setConversation((prev) => prev ? { ...prev, status: 'RESOLVED', resolved_at: new Date().toISOString() } : null);
  };

  // Reopen
  const reopenConversation = async () => {
    await adminAPI('reopen', { conversationId });
    setConversation((prev) => prev ? { ...prev, status: 'HUMAN_HANDLING', resolved_at: null } : null);
  };

  const isResolved = conversation?.status === 'RESOLVED';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="sm:hidden p-1 text-white/50 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-white">
              {langFlags[conversation?.language || ''] || '🌐'} Chat
            </span>
            {conversation && <StatusBadge status={conversation.status} />}
          </div>
          <div className="flex items-center gap-2">
            {isResolved ? (
              <button
                onClick={reopenConversation}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Reopen
              </button>
            ) : (
              <button
                onClick={resolveConversation}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                Resolve
              </button>
            )}
          </div>
        </div>
        {conversation && (
          <div className="flex items-center gap-3 text-[10px] text-white/30">
            <span>Page: {conversation.user_page || '/'}</span>
            <span>Started: {new Date(conversation.created_at).toLocaleString()}</span>
            {conversation.escalated_at && (
              <span className="text-amber-400">Escalated: {timeAgo(conversation.escalated_at)}</span>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply input */}
      {!isResolved && (
        <div className="p-3 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Reply as agent..."
              className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-qb-cyan/50 transition-colors"
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="bg-qb-cyan hover:bg-qb-cyan/80 disabled:opacity-30 text-white p-2.5 rounded-xl transition-all active:scale-90 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────
function SupportAdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState<Stats>({ waiting: 0, active: 0, ai_handling: 0, resolved_today: 0, total: 0 });
  const [activeTab, setActiveTab] = useState<Tab>('escalated');
  const [loading, setLoading] = useState(true);

  // Load data
  const loadData = useCallback(async () => {
    const [convData, statsData] = await Promise.all([
      adminAPI('get_conversations'),
      adminAPI('get_stats'),
    ]);
    if (Array.isArray(convData)) setConversations(convData);
    if (statsData && typeof statsData.total === 'number') setStats(statsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Polling every 30s
  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Supabase Realtime for conversation list updates
  useEffect(() => {
    const channel = supabase.channel('support_admin_list');

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'support_conversations',
      },
      () => {
        // Reload conversation list on any change
        loadData();
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Filter conversations by tab
  const filteredConversations = conversations.filter((c) => {
    switch (activeTab) {
      case 'escalated':
        return c.status === 'WAITING_HUMAN';
      case 'active':
        return c.status === 'HUMAN_HANDLING';
      case 'ai':
        return c.status === 'AI_HANDLING';
      case 'resolved':
        return c.status === 'RESOLVED';
      default:
        return true;
    }
  });

  const tabs: { id: Tab; label: string; count: number; color: string }[] = [
    { id: 'escalated', label: 'Waiting', count: stats.waiting, color: 'text-amber-400' },
    { id: 'active', label: 'Active', count: stats.active, color: 'text-emerald-400' },
    { id: 'ai', label: 'AI', count: stats.ai_handling, color: 'text-blue-400' },
    { id: 'resolved', label: 'Resolved', count: stats.resolved_today, color: 'text-white/40' },
  ];

  const selectConversation = (id: string) => {
    setSearchParams({ id });
  };

  const clearSelection = () => {
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-qb-dark">
      {/* Top bar */}
      <div className="border-b border-white/10 bg-qb-darker/50 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageCircle className="w-6 h-6 text-qb-purple" />
            <h1 className="text-lg font-bold text-white">Support Chat Admin</h1>
          </div>
          <button
            onClick={loadData}
            className="text-white/40 hover:text-white transition-colors p-2"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats */}
        <StatsBar stats={stats} />

        {/* Two-panel layout */}
        <div className="flex gap-4 h-[calc(100vh-220px)]">
          {/* Left panel: conversation list */}
          <div
            className={`w-full sm:w-[360px] shrink-0 flex flex-col bg-qb-darker/50 rounded-xl border border-white/5 overflow-hidden ${
              selectedId ? 'hidden sm:flex' : 'flex'
            }`}
          >
            {/* Tabs */}
            <div className="flex border-b border-white/5 shrink-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
                    activeTab === tab.id ? tab.color : 'text-white/30 hover:text-white/50'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-1 text-[10px] ${activeTab === tab.id ? '' : 'text-white/20'}`}>
                      ({tab.count})
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-qb-purple" />
                  )}
                </button>
              ))}
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {loading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
                </div>
              )}
              {!loading && filteredConversations.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle className="w-8 h-8 text-white/10 mx-auto mb-2" />
                  <p className="text-xs text-white/30">No conversations</p>
                </div>
              )}
              {filteredConversations.map((conv) => (
                <ConversationCard
                  key={conv.id}
                  conversation={conv}
                  isSelected={conv.id === selectedId}
                  onClick={() => selectConversation(conv.id)}
                />
              ))}
            </div>
          </div>

          {/* Right panel: conversation detail */}
          <div
            className={`flex-1 bg-qb-darker/50 rounded-xl border border-white/5 overflow-hidden ${
              selectedId ? 'flex flex-col' : 'hidden sm:flex sm:items-center sm:justify-center'
            }`}
          >
            {selectedId ? (
              <ConversationDetail
                key={selectedId}
                conversationId={selectedId}
                onBack={clearSelection}
              />
            ) : (
              <div className="text-center">
                <Headset className="w-12 h-12 text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/30">Select a conversation to view</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Export ──────────────────────────────────────────────────────────
export function SupportAdmin() {
  const [authed, setAuthed] = useState(sessionStorage.getItem('support_admin_auth') === '1');

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  return <SupportAdminDashboard />;
}
