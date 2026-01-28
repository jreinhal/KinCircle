import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User as UserIcon, Bot, Loader2, ExternalLink, Globe, DollarSign, Clock, Search, HelpCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import { queryLedger } from '../services/geminiService';
import { useEntriesStore } from '../hooks/useEntriesStore';
import { useSettingsStore } from '../hooks/useSettingsStore';
import { useAppContext } from '../context/AppContext';

interface ExtendedChatMessage extends ChatMessage {
  sources?: Array<{title: string, uri: string}>;
}

// Safe markdown-like text formatting without dangerouslySetInnerHTML
const formatMessage = (text: string): React.ReactNode[] => {
  return text.split('\n').map((line, lineIdx) => {
    const elements: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    // Process the line segment by segment
    while (remaining.length > 0) {
      // Check for bold **text**
      const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
      if (boldMatch) {
        elements.push(<strong key={`${lineIdx}-${keyIdx++}`}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Check for italic *text* (but not **)
      const italicMatch = remaining.match(/^\*(?!\*)(.+?)\*(?!\*)/);
      if (italicMatch) {
        elements.push(<em key={`${lineIdx}-${keyIdx++}`}>{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Check for code `text`
      const codeMatch = remaining.match(/^`(.+?)`/);
      if (codeMatch) {
        elements.push(
          <code key={`${lineIdx}-${keyIdx++}`} className="bg-slate-100 px-1 rounded text-sm dark:bg-slate-800 dark:text-slate-100">
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Find the next special character or take one character
      const nextSpecial = remaining.search(/[\*`]/);
      if (nextSpecial === -1) {
        elements.push(<span key={`${lineIdx}-${keyIdx++}`}>{remaining}</span>);
        break;
      } else if (nextSpecial === 0) {
        // Special char didn't match a pattern, treat as literal
        elements.push(<span key={`${lineIdx}-${keyIdx++}`}>{remaining[0]}</span>);
        remaining = remaining.slice(1);
      } else {
        elements.push(<span key={`${lineIdx}-${keyIdx++}`}>{remaining.slice(0, nextSpecial)}</span>);
        remaining = remaining.slice(nextSpecial);
      }
    }

    return <span key={lineIdx} className="block">{elements}</span>;
  });
};

const ChatAssistant: React.FC = () => {
  const { entries } = useEntriesStore();
  const { settings } = useSettingsStore();
  const { users } = useAppContext();
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ExtendedChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { text, sources } = await queryLedger(userMessage.content, entries, users, settings);

      const botMessage: ExtendedChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: text,
        sources: sources,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: ExtendedChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [entries, input, isLoading, settings, users]);

  // Suggested prompts for empty state
  const suggestedPrompts = [
    { icon: DollarSign, text: "What's our total spending this month?", bgClass: "bg-blue-50 dark:bg-blue-900/30", textClass: "text-blue-600 dark:text-blue-300", hoverClass: "group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50" },
    { icon: Clock, text: "How many care hours have I logged?", bgClass: "bg-green-50 dark:bg-emerald-900/30", textClass: "text-green-600 dark:text-emerald-300", hoverClass: "group-hover:bg-green-100 dark:group-hover:bg-emerald-900/50" },
    { icon: Search, text: "Find 24-hour pharmacies near me", bgClass: "bg-purple-50 dark:bg-purple-900/30", textClass: "text-purple-600 dark:text-purple-300", hoverClass: "group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50" },
    { icon: HelpCircle, text: "What are signs of caregiver burnout?", bgClass: "bg-orange-50 dark:bg-orange-900/30", textClass: "text-orange-600 dark:text-orange-300", hoverClass: "group-hover:bg-orange-100 dark:group-hover:bg-orange-900/50" },
  ];

  const handleSuggestedPrompt = useCallback((prompt: string) => {
    setInput(prompt);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-teal-50 dark:from-slate-900 dark:to-slate-800 flex items-center space-x-3">
        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-teal-500 text-white rounded-xl shadow-sm">
          <Bot size={22} />
        </div>
        <div>
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Ask Kin</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Your care assistant • Ledger + Web search</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
        {/* Empty state with suggestions */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-teal-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center mb-4">
              <Bot size={32} className="text-teal-600 dark:text-teal-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">Hi, I'm Kin!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
              I can answer questions about your care ledger, look up medical info, or help find local resources.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
              {suggestedPrompts.map((prompt, idx) => {
                const Icon = prompt.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedPrompt(prompt.text)}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-left hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm transition-all group"
                  >
                    <div className={`p-2 rounded-lg ${prompt.bgClass} ${prompt.textClass} ${prompt.hoverClass} transition-colors`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-200 flex-1">{prompt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
              msg.role === 'user' ? 'bg-slate-900 dark:bg-slate-800 text-white ml-3' : 'bg-gradient-to-br from-blue-500 to-teal-500 text-white mr-3'
            }`}>
              {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
            </div>

            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white rounded-tr-none'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none rounded-tl-none'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="space-y-1">
                    {formatMessage(msg.content)}
                  </div>
                ) : (
                  <span className="whitespace-pre-wrap">{msg.content}</span>
                )}
              </div>

              {/* Grounding Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 text-xs w-full">
                  <p className="flex items-center text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
                    <Globe size={10} className="mr-1" />
                    Sources
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.slice(0, 3).map((source, idx) => (
                      <a
                        key={idx}
                        href={source.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-lg text-teal-600 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200 hover:border-teal-300 dark:hover:border-slate-600 hover:bg-teal-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
                      >
                        <span className="truncate max-w-[120px]">{source.title}</span>
                        <ExternalLink size={10} className="ml-1 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start mr-auto max-w-[85%]">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 text-white mr-3 flex items-center justify-center mt-1">
              <Bot size={14} />
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-tl-none border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-none">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-slate-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about expenses or find care resources..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 focus:border-teal-500 dark:focus:border-teal-400 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            className="btn-primary absolute right-2 top-2 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;
