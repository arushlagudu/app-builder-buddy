import { useState, useEffect, useRef } from 'react';
import { Bot, Crown, Send, Loader2, Trash2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAICoachUsage } from '@/hooks/useAICoachUsage';
import { toast } from 'sonner';
import { MonthlyScanReminder } from './MonthlyScanReminder';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tokens_used?: number;
  created_at: string;
}

interface AISkinCoachProps {
  skinType?: string;
  concerns?: string[];
  climate?: string;
  score?: number | null;
  previousScore?: number | null;
  problems?: { title: string; description: string }[] | null;
  avoidIngredients?: { name: string; reason: string }[] | null;
  prescriptionIngredients?: { name: string; reason: string }[] | null;
  lastScanDate?: string;
  onUpgrade?: () => void;
}

const QUICK_PROMPTS = [
  "What's the best morning routine for my skin?",
  "How can I reduce my acne?",
  "Which ingredients should I look for?",
  "Is my current routine working?",
];

export function AISkinCoach({ 
  skinType, 
  concerns, 
  climate, 
  score, 
  previousScore, 
  problems, 
  avoidIngredients, 
  prescriptionIngredients, 
  lastScanDate, 
  onUpgrade 
}: AISkinCoachProps) {
  const { user } = useAuth();
  const { tokensRemaining, canAsk, addTokens, estimateTokens, dailyLimit, isPremium, tokensUsed } = useAICoachUsage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('ai_coach_messages')
        .select('*')
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as ChatMessage[]) || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!user || !content.trim()) return;

    const estimatedTokens = estimateTokens(content);
    
    // Check if user has enough tokens
    if (!isPremium && tokensRemaining < estimatedTokens) {
      toast.error('Not enough tokens', {
        description: `This question requires ~${estimatedTokens} tokens. Upgrade to Premium for unlimited access.`,
      });
      return;
    }

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSending(true);

    try {
      // Save user message to database
      await supabase.from('ai_coach_messages').insert({
        user_id: user.id,
        role: 'user',
        content: content.trim(),
        tokens_used: 0,
      });

      // Call AI endpoint
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: content.trim(),
          skinType,
          concerns,
          score,
          problems,
          avoidIngredients,
          prescriptionIngredients,
          chatHistory: messages.slice(-10),
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again in a moment.');
          return;
        }
        if (response.status === 402) {
          toast.error('AI credits exhausted. Please try again later.');
          return;
        }
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        tokens_used: data.tokensUsed,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Save assistant message to database
      await supabase.from('ai_coach_messages').insert({
        user_id: user.id,
        role: 'assistant',
        content: data.response,
        tokens_used: data.tokensUsed,
      });

      // Update token usage
      await addTokens(data.tokensUsed);

    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to get AI response');
      // Remove the user message if we failed
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    if (!user) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      await supabase
        .from('ai_coach_messages')
        .delete()
        .gte('created_at', today.toISOString());
      
      setMessages([]);
      toast.success('Chat cleared');
    } catch (error) {
      console.error('Failed to clear chat:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  if (!user) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground">Sign in to chat with your AI Skin Coach</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[600px]">
      {/* Monthly Scan Reminder */}
      <MonthlyScanReminder lastScanDate={lastScanDate} />

      {/* Token Usage Banner */}
      {!isPremium && (
        <div className="glass-card p-3 mb-4 border border-secondary/30 bg-gradient-to-br from-secondary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-secondary" />
              </div>
              <div>
                <p className="font-medium text-xs">
                  {tokensRemaining > 0 ? (
                    <><span className="text-secondary">{tokensRemaining.toLocaleString()}</span> / {dailyLimit.toLocaleString()} tokens remaining</>
                  ) : (
                    <span className="text-amber-400">Daily tokens used up</span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  ~{Math.floor(tokensRemaining / 200)} questions left • Resets at midnight
                </p>
              </div>
            </div>
            <button
              onClick={onUpgrade}
              className="px-3 py-1.5 rounded-lg bg-secondary/20 text-secondary text-xs font-medium hover:bg-secondary/30 transition-colors flex items-center gap-1"
            >
              <Crown className="w-3 h-3" />
              Unlimited
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="glass-card p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h3 className="font-medium text-sm">AI Skin Coach</h3>
            {isPremium && (
              <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-secondary text-[10px] font-medium flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Unlimited
              </span>
            )}
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Clear chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mb-4">
              Ask me anything about your skin!
            </p>
            {/* Quick prompts */}
            <div className="grid grid-cols-2 gap-2 px-4">
              {QUICK_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  disabled={sending || (!isPremium && !canAsk)}
                  className="p-2 text-xs text-left rounded-lg bg-muted/50 hover:bg-muted transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'glass-card rounded-bl-md'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
                {msg.role === 'assistant' && msg.tokens_used && !isPremium && (
                  <p className="text-[10px] text-muted-foreground mt-1 opacity-60">
                    {msg.tokens_used} tokens
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="glass-card p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={canAsk ? "Ask about your skin..." : "Daily limit reached"}
            disabled={sending || (!isPremium && !canAsk)}
            rows={1}
            className="flex-1 bg-muted/50 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 min-h-[42px] max-h-[120px]"
            style={{ height: 'auto' }}
          />
          <button
            onClick={() => sendMessage(inputValue)}
            disabled={!inputValue.trim() || sending || (!isPremium && !canAsk)}
            className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        {inputValue && !isPremium && (
          <p className="text-[10px] text-muted-foreground mt-2">
            Estimated cost: ~{estimateTokens(inputValue)} tokens
          </p>
        )}
      </div>

    </div>
  );
}
