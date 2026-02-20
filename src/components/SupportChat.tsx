import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, X, Send, Loader2, Bot, Headset, RotateCcw } from 'lucide-react';
import { supabase } from '../services/supabase/client';

interface ChatMessage {
  role: 'user' | 'model' | 'human' | 'system';
  text: string;
}

const languageMap: Record<string, string> = {
  en: 'English',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
};

export const SupportChat: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    sessionStorage.getItem('support_conversation_id')
  );
  const [conversationStatus, setConversationStatus] = useState<string>('AI_HANDLING');
  const [isRestoringHistory, setIsRestoringHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasRestoredRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // ── Restore conversation history from DB on mount ────────────────
  useEffect(() => {
    if (!conversationId || hasRestoredRef.current) return;

    const restoreHistory = async () => {
      setIsRestoringHistory(true);
      try {
        // Fetch conversation status
        const { data: conv } = await supabase
          .from('support_conversations')
          .select('status')
          .eq('id', conversationId)
          .single();

        if (conv) {
          setConversationStatus(conv.status);
        }

        // Fetch all messages
        const { data: dbMessages } = await supabase
          .from('support_messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (dbMessages && dbMessages.length > 0) {
          const restored: ChatMessage[] = dbMessages.map((m) => ({
            role: m.role === 'USER' ? 'user' : m.role === 'HUMAN' ? 'human' : m.role === 'SYSTEM' ? 'system' : 'model',
            text: m.content,
          }));
          setMessages(restored);
          setHasShownWelcome(true);
        }
      } catch (err) {
        console.error('Failed to restore chat history:', err);
      } finally {
        setIsRestoringHistory(false);
        hasRestoredRef.current = true;
      }
    };

    restoreHistory();
  }, [conversationId]);

  // ── Show welcome message on first open (only if no history) ──────
  useEffect(() => {
    if (isOpen && !hasShownWelcome && !conversationId) {
      setHasShownWelcome(true);
      setMessages([{
        role: 'model',
        text: t('support.welcomeMessage'),
      }]);
    }
  }, [isOpen, hasShownWelcome, conversationId, t]);

  // ── Supabase Realtime: listen for new messages ───────────────────
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`support_chat_${conversationId}`);

    // Listen for new messages (HUMAN and SYSTEM from admin)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const msg = payload.new as { id: string; role: string; content: string };
        // Only add HUMAN and SYSTEM messages (USER and AI are already added locally)
        if (msg.role === 'HUMAN' || msg.role === 'SYSTEM') {
          setMessages((prev) => {
            // Deduplicate by content+role to avoid duplicates with polling
            if (prev.some((m) => m.text === msg.content && m.role === (msg.role === 'HUMAN' ? 'human' : 'system'))) return prev;
            return [
              ...prev,
              {
                role: msg.role === 'HUMAN' ? 'human' : 'system',
                text: msg.content,
              },
            ];
          });
        }
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
        const newStatus = (payload.new as { status: string }).status;
        setConversationStatus(newStatus);
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  // ── Polling fallback: fetch new messages when human is handling ──
  // Track the last known DB message count to detect new messages
  const lastDbCountRef = useRef(0);

  useEffect(() => {
    if (!conversationId) return;
    // Only poll when waiting for or receiving human responses
    if (conversationStatus !== 'WAITING_HUMAN' && conversationStatus !== 'HUMAN_HANDLING') return;

    const poll = async () => {
      try {
        // Poll conversation status
        const { data: conv } = await supabase
          .from('support_conversations')
          .select('status')
          .eq('id', conversationId)
          .single();

        if (conv && conv.status !== conversationStatus) {
          setConversationStatus(conv.status);
        }

        // Poll messages — always replace with DB truth to avoid count mismatches
        const { data: dbMessages } = await supabase
          .from('support_messages')
          .select('role, content, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (dbMessages && dbMessages.length > 0) {
          // Only update if there are new messages in DB since last poll
          if (dbMessages.length !== lastDbCountRef.current) {
            lastDbCountRef.current = dbMessages.length;
            const freshMessages: ChatMessage[] = dbMessages.map((m) => ({
              role: m.role === 'USER' ? 'user' : m.role === 'HUMAN' ? 'human' : m.role === 'SYSTEM' ? 'system' : 'model',
              text: m.content,
            }));
            // Replace local messages with DB truth (source of truth)
            setMessages(freshMessages);
          }
        }
      } catch (err) {
        console.error('Polling support chat failed:', err);
      }
    };

    // Poll immediately on first run, then every 3s
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [conversationId, conversationStatus]);

  // ── Send message ─────────────────────────────────────────────────
  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: messages.filter((m) => m.role === 'user' || m.role === 'model'),
          language: languageMap[i18n.language] || 'English',
          conversationId,
          userPage: window.location.pathname,
        }),
      });

      if (!response.ok) {
        throw new Error('API error');
      }

      const data = await response.json();

      // Store conversationId
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        sessionStorage.setItem('support_conversation_id', data.conversationId);
      }

      // Add AI reply
      setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);

      // Handle escalation
      if (data.escalated) {
        setConversationStatus('WAITING_HUMAN');
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: t('support.errorMessage'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Start new conversation ───────────────────────────────────────
  const startNewConversation = () => {
    sessionStorage.removeItem('support_conversation_id');
    setConversationId(null);
    setConversationStatus('AI_HANDLING');
    setMessages([]);
    setHasShownWelcome(false);
    hasRestoredRef.current = false;
  };

  // Don't show on TV display, player screen, or admin page
  const path = window.location.pathname;
  if (path === '/tv' || path === '/play' || path === '/support-admin') return null;

  const isResolved = conversationStatus === 'RESOLVED';
  const isHumanHandling = conversationStatus === 'HUMAN_HANDLING';
  const isWaitingHuman = conversationStatus === 'WAITING_HUMAN';

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 left-4 sm:left-auto z-50 sm:w-[380px] max-h-[500px] bg-qb-darker border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
          {/* Header */}
          <div className="bg-gradient-to-r from-qb-purple to-qb-cyan px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">{t('support.title')}</span>
              {isHumanHandling && (
                <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-full">
                  Agent
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[350px]">
            {isRestoringHistory && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i}>
                {/* System messages */}
                {msg.role === 'system' ? (
                  <div className="text-center py-1">
                    <span className="text-[11px] text-white/30 bg-white/5 px-3 py-1 rounded-full">
                      {msg.text}
                    </span>
                  </div>
                ) : (
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex flex-col gap-0.5 max-w-[85%]">
                      {/* Label for human agent */}
                      {msg.role === 'human' && (
                        <div className="flex items-center gap-1 px-1">
                          <Headset className="w-3 h-3 text-qb-cyan" />
                          <span className="text-[10px] text-qb-cyan font-medium">{t('support.agentLabel')}</span>
                        </div>
                      )}
                      {/* Label for bot */}
                      {msg.role === 'model' && i > 0 && (
                        <div className="flex items-center gap-1 px-1">
                          <Bot className="w-3 h-3 text-white/30" />
                          <span className="text-[10px] text-white/30">Bot</span>
                        </div>
                      )}
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? 'bg-qb-purple text-white rounded-br-md'
                            : msg.role === 'human'
                            ? 'bg-qb-cyan/20 text-white/90 rounded-bl-md border border-qb-cyan/20'
                            : 'bg-white/10 text-white/90 rounded-bl-md'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/10 px-4 py-2 rounded-2xl rounded-bl-md">
                  <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Status banner */}
          {isWaitingHuman && (
            <div className="px-3 py-2 border-t border-white/5 bg-amber-500/10">
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>{t('support.checkingHuman')}</span>
              </div>
            </div>
          )}
          {isHumanHandling && (
            <div className="px-3 py-2 border-t border-white/5 bg-emerald-500/10">
              <div className="flex items-center gap-2 text-xs text-emerald-300">
                <Headset className="w-3 h-3" />
                <span>{t('support.humanJoined')}</span>
              </div>
            </div>
          )}
          {isResolved && (
            <div className="px-3 py-2 border-t border-white/5 bg-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">{t('support.resolvedMessage')}</span>
                <button
                  onClick={startNewConversation}
                  className="flex items-center gap-1 text-xs text-qb-cyan hover:text-qb-cyan/80 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t('support.newConversation')}
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          {!isResolved && (
            <div className="p-3 border-t border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('support.placeholder')}
                  className="flex-1 bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 text-base text-white placeholder-white/40 focus:outline-none focus:border-qb-cyan/50 transition-colors"
                  disabled={isLoading}
                  maxLength={500}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-qb-purple hover:bg-qb-purple/80 disabled:opacity-30 text-white p-2.5 rounded-xl transition-all active:scale-90 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`fixed bottom-4 right-4 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isOpen
            ? 'bg-white/20 hover:bg-white/30 scale-90'
            : 'bg-gradient-to-br from-qb-purple to-qb-cyan hover:scale-110 animate-bounce-slow'
        }`}
        title={t('support.title')}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  );
};
