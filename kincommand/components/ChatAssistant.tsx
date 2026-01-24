import React, { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, Bot, Loader2, ExternalLink, Globe } from 'lucide-react';
import { LedgerEntry, User, FamilySettings, ChatMessage } from '../types';
import { queryLedger } from '../services/geminiService';

interface ChatAssistantProps {
  entries: LedgerEntry[];
  users: User[];
  settings: FamilySettings;
}

interface ExtendedChatMessage extends ChatMessage {
  sources?: Array<{title: string, uri: string}>;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ entries, users, settings }) => {
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hi! I'm Kin, your family care assistant. \n\nI can answer questions about your ledger OR look up external info for you.\n\nTry asking:\n"How much did we spend on pharmacy items last month?"\n"Find 24-hour pharmacies near me."\n"What are the symptoms of caregiver burnout?"`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
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

    const { text, sources } = await queryLedger(userMessage.content, entries, users, settings);

    const botMessage: ExtendedChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: text,
      sources: sources,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Bot size={20} />
        </div>
        <div>
          <h2 className="font-bold text-slate-800">Ask Kin</h2>
          <p className="text-xs text-slate-500">Connected to Ledger & Google Search</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
              msg.role === 'user' ? 'bg-slate-900 text-white ml-3' : 'bg-blue-600 text-white mr-3'
            }`}>
              {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
            </div>
            
            <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none' 
                    : 'bg-white text-slate-700 border border-slate-200 shadow-sm rounded-tl-none'
                }`}>
                {msg.content}
                </div>
                
                {/* Grounding Sources */}
                {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 text-xs w-full">
                        <p className="flex items-center text-slate-500 mb-1 font-semibold">
                            <Globe size={10} className="mr-1" />
                            Sources:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {msg.sources.slice(0, 3).map((source, idx) => (
                                <a 
                                    key={idx}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center bg-white border border-slate-200 px-2 py-1 rounded-md text-blue-600 hover:text-blue-800 hover:border-blue-300 transition-colors shadow-sm"
                                >
                                    <span className="truncate max-w-[150px]">{source.title}</span>
                                    <ExternalLink size={8} className="ml-1" />
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
             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white mr-3 flex items-center justify-center mt-1">
               <Bot size={14} />
             </div>
             <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center space-x-2">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <span className="text-sm text-slate-500">Searching & Thinking...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about expenses or find care resources..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 text-slate-900 placeholder:text-slate-500 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatAssistant;