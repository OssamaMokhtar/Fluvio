import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, BookOpen, RefreshCcw, Globe } from 'lucide-react';
import { companionChat, CompanionReply } from '../services/companionService';
import { CompanionSession, addCompanionMessage } from '../services/companionClient';
import { Scenario } from '../data/scenarios';

// Extend CompanionMessage for UI purposes (translation is added client-side from CompanionReply)
interface DisplayMessage {
  id: string;
  role: 'user' | 'companion';
  text: string;
  translation?: string;
  corrected_text?: string;
  correction_note?: string;
}

interface CompanionChatProps {
  session: CompanionSession;
  onSessionUpdate: (session: CompanionSession) => void;
  targetLanguage: string;
  level: string;
  onVoiceInput?: () => void;
  isRecording?: boolean;
  scenario?: Scenario | null;
}

export default function CompanionChat({ session, onSessionUpdate, targetLanguage, level, onVoiceInput, isRecording, scenario }: CompanionChatProps) {
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showCorrections, setShowCorrections] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add translations from companion replies
  const displayMessages: DisplayMessage[] = session.messages.map((msg, idx) => {
    const display: DisplayMessage = { ...msg };
    // For companion messages, check if we have a translation stored
    // (translations are returned with each companion reply)
    return display;
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setIsSending(true);
    try {
      const reply = await companionChat(session, text, targetLanguage, level);
      const updatedWithUser = addCompanionMessage(session, 'user', text);
      const updatedWithCompanion = addCompanionMessage(
        updatedWithUser,
        'companion',
        reply.response,
        reply.corrected_text,
        reply.correction_note
      );
      // Store translation in a side channel (session metadata)
      onSessionUpdate(updatedWithCompanion);
      setInput('');
    } catch (err) {
      console.error('Companion chat error:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const languageName = targetLanguage.charAt(0).toUpperCase() + targetLanguage.slice(1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">{languageName} Companion</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{level} level • AI-powered coaching</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onVoiceInput && (
            <button
              onClick={onVoiceInput}
              disabled={isRecording}
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              title="Voice input"
            >
              <Globe className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className={`p-2 rounded-full transition-colors ${showTranslation ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            title="Toggle translations"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCorrections(!showCorrections)}
            className={`p-2 rounded-full transition-colors ${showCorrections ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            title="Toggle corrections"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="h-[420px] overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-900/10">
        {session.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 p-4 rounded-full mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <p className="text-slate-600 dark:text-slate-300 max-w-md">
              Hi! I'm your {languageName} language companion. Start a conversation and I'll help you improve — correcting grammar, suggesting idioms, and keeping you motivated.
            </p>
            <div className="mt-6 flex gap-2 text-sm text-slate-400 flex-wrap justify-center">
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">Try: 'Hello, how are you?'</span>
              <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">Or: 'Tell me about {languageName} culture'</span>
            </div>
          </div>
        ) : (
          session.messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : 'order-2'}`}>
                {msg.role === 'companion' && (
                  <div className="bg-indigo-600 text-white rounded-2xl rounded-tl-sm p-4 shadow-sm">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    {showTranslation && msg.translation && msg.translation !== msg.text && (
                      <div className="mt-2 pt-2 border-t border-white/20 text-indigo-200 text-xs italic">
                        {msg.translation}
                      </div>
                    )}
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tr-sm p-4 shadow-sm">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                )}
                {showCorrections && msg.correction_note && (
                  <div className="mt-2 ml-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">✏️</span>
                      <div>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase mb-1">Correction</p>
                        {msg.corrected_text && (
                          <p className="text-sm text-slate-700 dark:text-slate-200 mb-1 font-medium">"{msg.corrected_text}"</p>
                        )}
                        <p className="text-xs text-amber-600 dark:text-amber-400">{msg.correction_note}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message in ${languageName}... (Enter to send, Shift+Enter for new line)`}
            disabled={isSending}
            className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 min-h-[48px] max-h-[120px]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="p-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 transition-colors shadow-sm"
            title="Send message"
          >
            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400 text-center">AI can make mistakes. Verify important corrections.</p>
      </div>
    </div>
  );
}
