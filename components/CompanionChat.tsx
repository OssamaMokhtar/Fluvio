import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, Loader2, BookOpen, RefreshCcw, Globe, Play, Volume2 } from 'lucide-react';
import { companionChat, CompanionReply } from '../services/companionService';
import { CompanionSession, addCompanionMessage, CompanionMessage } from '../services/companionClient';
import { Scenario } from '../data/scenarios';
import { apiHeaders } from '../services/deviceId';

// Message type for scenario mode (AI messages have scores, tts_audio, feedback)
interface ScenarioMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  translation?: string;
  scores?: { pronunciation: number; grammar: number; vocabulary: number; fluency: number; appropriateness: number; overall: number };
  feedback?: string;
  corrected_version?: string;
  tts_audio?: string;
  timestamp: number;
}

// Extend CompanionMessage for UI purposes (translation is added client-side from CompanionReply)
interface DisplayMessage {
  id: string;
  role: 'user' | 'companion' | 'ai';
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Whether we're in scenario mode (sends to /api/companion/scenario)
  const isScenarioMode = !!scenario;

  // Add translations from companion replies
  const displayMessages: DisplayMessage[] = (session.messages as CompanionMessage[]).map((msg, idx) => {
    const display: DisplayMessage = { id: msg.id, role: msg.role, text: msg.text, translation: msg.translation, corrected_text: msg.corrected_text, correction_note: msg.correction_note };
    // For companion messages, check if we have a translation stored
    // (translations are returned with each companion reply)
    return display;
  });

  // Play TTS audio for an AI message (scenario mode)
  const playAISpeech = useCallback((ttsAudioBase64: string) => {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (!ttsAudioBase64) return;
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: 24000 });
      const bytes = atob(ttsAudioBase64);
      const len = bytes.length;
      const u8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) u8[i] = bytes.charCodeAt(i);
      const dataInt16 = new Int16Array(u8.buffer);
      const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.error('TTS playback error:', e);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    setIsSending(true);
    try {
      if (isScenarioMode && scenario) {
        // Scenario mode: send to /api/companion/scenario
        const res = await fetch('/api/companion/scenario', {
          method: 'POST',
          headers: apiHeaders(),
          body: JSON.stringify({
            sessionId: session.id,
            scenarioId: scenario.id,
            message: text,
            targetLanguage,
            level,
            messages: session.messages,
          }),
        });
        if (!res.ok) throw new Error(`Scenario API error ${res.status}`);
        const data = await res.json();
        // Build session with user message + AI response (with scores, tts_audio, feedback)
        const updatedWithUser: any = { ...session, messages: [...session.messages, {
          id: crypto.randomUUID(),
          role: 'user',
          text,
          timestamp: Date.now(),
        }]};
        const aiMessage: ScenarioMessage = {
          id: crypto.randomUUID(),
          role: 'ai',
          text: data.response,
          translation: data.translation,
          scores: data.scores,
          feedback: data.feedback,
          corrected_version: data.corrected_version,
          tts_audio: data.tts_audio || null,
          timestamp: Date.now(),
        };
        const updatedWithCompanion: any = {
          ...updatedWithUser,
          messages: [...updatedWithUser.messages, aiMessage],
        };
        onSessionUpdate(updatedWithCompanion);
        // Auto-play AI speech if available
        if (aiMessage.tts_audio) {
          setTimeout(() => playAISpeech(aiMessage.tts_audio), 300);
        }
        setInput('');
      } else {
        // Free chat mode: send to /api/companion/chat
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
      }
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
              {isScenarioMode
                ? `Practice "${scenario.title}" — I'll play the other role. Speak or type your response, and I'll play it back in voice + give you a score.`
                : `Hi! I'm your ${languageName} language companion. Start a conversation and I'll help you improve — correcting grammar, suggesting idioms, and keeping you motivated.`}
            </p>
            {isScenarioMode && (
              <div className="mt-6 flex gap-2 text-sm text-slate-400 flex-wrap justify-center">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">AI responds with voice + score</span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">5-dimension evaluation each turn</span>
              </div>
            )}
            {!isScenarioMode && (
              <div className="mt-6 flex gap-2 text-sm text-slate-400 flex-wrap justify-center">
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">Try: 'Hello, how are you?'</span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">Or: 'Tell me about {languageName} culture'</span>
              </div>
            )}
          </div>
        ) : (
          (session.messages as (CompanionMessage | ScenarioMessage)[]).map((msg: CompanionMessage | ScenarioMessage) => {
            const isUser = msg.role === 'user';
            const isAI = msg.role === 'ai';
            const isCompanion = msg.role === 'companion';
            const scenarioMsg = isAI && isScenarioMode ? (msg as ScenarioMessage) : null;
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
                  {/* Scenario AI message — shows scores + feedback + replay */}
                  {isAI && isScenarioMode && scenarioMsg && (
                    <div className="bg-indigo-600 text-white rounded-2xl rounded-tl-sm p-4 shadow-sm">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{scenarioMsg.text}</p>
                      {scenarioMsg.translation && scenarioMsg.translation !== scenarioMsg.text && showTranslation && (
                        <div className="mt-2 pt-2 border-t border-white/20 text-indigo-200 text-xs italic">
                          {scenarioMsg.translation}
                        </div>
                      )}
                      {scenarioMsg.scores && (
                        <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-5 gap-2">
                          {[
                            { label: 'Pron', score: scenarioMsg.scores.pronunciation },
                            { label: 'Gram', score: scenarioMsg.scores.grammar },
                            { label: 'Vocab', score: scenarioMsg.scores.vocabulary },
                            { label: 'Fluency', score: scenarioMsg.scores.fluency },
                            { label: 'Approp', score: scenarioMsg.scores.appropriateness },
                          ].map(({ label, score }) => (
                            <div key={label} className="text-center">
                              <div className="text-xs font-bold opacity-70">{label}</div>
                              <div className="text-lg font-bold">{score}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {scenarioMsg.feedback && (
                        <div className="mt-2 pt-2 border-t border-white/20 text-xs text-indigo-200 italic">
                          {scenarioMsg.feedback}
                        </div>
                      )}
                      {/* Replay button for AI speech */}
                      {scenarioMsg.tts_audio && (
                        <button
                          onClick={() => playAISpeech(scenarioMsg.tts_audio)}
                          className="mt-2 flex items-center gap-1.5 px-2 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-xs text-indigo-200"
                          title="Replay AI voice"
                        >
                          <Play className="w-3.5 h-3.5" /> Replay
                        </button>
                      )}
                    </div>
                  )}
                  {/* Free chat companion message */}
                  {isCompanion && (
                    <div className="bg-indigo-600 text-white rounded-2xl rounded-tl-sm p-4 shadow-sm">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      {showTranslation && msg.translation && msg.translation !== msg.text && (
                        <div className="mt-2 pt-2 border-t border-white/20 text-indigo-200 text-xs italic">
                          {msg.translation}
                        </div>
                      )}
                    </div>
                  )}
                  {/* User message */}
                  {isUser && (
                    <div className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl rounded-tr-sm p-4 shadow-sm">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  )}
                  {/* Corrections for free chat */}
                  {showCorrections && !isScenarioMode && 'correction_note' in msg && msg.correction_note && (
                    <div className="mt-2 ml-8 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-600 dark:text-amber-400 text-sm font-bold">✏️</span>
                        <div>
                          <p className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase mb-1">Correction</p>
                          {'corrected_text' in msg && msg.corrected_text && (
                            <p className="text-sm text-slate-700 dark:text-slate-200 mb-1 font-medium">"{msg.corrected_text}"</p>
                          )}
                          <p className="text-xs text-amber-600 dark:text-amber-400">{msg.correction_note}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
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
