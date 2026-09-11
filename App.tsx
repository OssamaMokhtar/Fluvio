import React, { useState, useRef, useEffect } from 'react';
import { Mic, Loader2, ChevronRight, Globe, ArrowLeft, Moon, Sun, TrendingUp, Flame, LayoutGrid, Map, CheckCircle, RefreshCcw, BookOpen, Sparkles, Play, Pause, PauseCircle, MessageCircle, Star, Target, Zap, ChevronDown, X, Volume2 } from 'lucide-react';
import { analyzeAudio, generateTTS } from './services/geminiService';
import { blobToBase64 } from './services/audioUtils';
import { saveSession, getHistory, deleteSession } from './services/storageService';
import { AppState, AnalysisResponse, UserProfile, SessionRecord, CompanionSession } from './types';
import { getSentenceLibrary, pickDailySentence, LANG_NAMES, LANG_CODES } from './services/sentenceLibrary';
import { loadSRSState, recordReview } from './services/srsService';
import Waveform from './components/Waveform';
import ResultsView from './components/ResultsView';
import PhonemeSelector from './components/PhonemeSelector';
import IPAChart from './components/IPAChart';
import ProgressView from './components/ProgressView';
import Onboarding from './components/Onboarding';
import SentenceBrowser from './components/SentenceBrowser';
import CompanionChat from './components/CompanionChat';
import ProverbViewer from './components/ProverbViewer';
import { createCompanionSession, addCompanionMessage } from './services/companionClient';

const TARGET_LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Italian', 'Japanese', 'Portuguese', 'Chinese'];
const NATIVE_LANGUAGES = ['Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Russian', 'Italian', 'Arabic', 'Hindi', 'Turkish', 'Vietnamese', 'English'];

const TARGET_ACCENTS = ['General American', 'British (RP)', 'Australian', 'Neutral International', 'American Southern'];

type TabMode = 'practice' | 'sentences' | 'companion' | 'proverbs' | 'progress';
type PhonemeViewMode = 'list' | 'chart';

export default function App() {
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(() => {
    if (localStorage.getItem('slang_onboarded') === 'true') return true;
    if (localStorage.getItem('linguaflow_onboarded') === 'true') {
      localStorage.setItem('slang_onboarded', 'true');
      return true;
    }
    return false;
  });

  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [activeTab, setActiveTab] = useState<TabMode>('practice');
  const [phonemeViewMode, setPhonemeViewMode] = useState<PhonemeViewMode>('list');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('slang_theme') === 'dark';
  });

  // Learning state
  const [currentSentence, setCurrentSentence] = useState<any>(null);
  const [sentenceLibrary, setSentenceLibrary] = useState<any>(null);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showIPA, setShowIPA] = useState(false);

  // Companion state
  const [companionSession, setCompanionSession] = useState<CompanionSession | null>(null);
  const [companionInput, setCompanionInput] = useState('');
  const [isCompanionLoading, setIsCompanionLoading] = useState(false);

  // Recording state
  const [currentPrompt, setCurrentPrompt] = useState("Welcome! Loading your lesson...");
  const [promptContext, setPromptContext] = useState("");
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [targetPhoneme, setTargetPhoneme] = useState<string | null>(null);

  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [streak, setStreak] = useState(1);
  const [xp, setXp] = useState(0);

  // Review Mode
  const [reviewSession, setReviewSession] = useState<SessionRecord | null>(null);

  // Profile
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('slang_profile');
    const old = localStorage.getItem('linguaflow_profile');
    if (saved) return JSON.parse(saved);
    if (old) {
      const parsed = JSON.parse(old);
      localStorage.setItem('slang_profile', old);
      return parsed;
    }
    return {
      level: 'intermediate',
      native_language: 'Spanish',
      target_language: 'English',
      accent_reduction_goal: 'General American',
      motivation: 'travel',
      daily_goal_minutes: 10
    };
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Persist profile
  useEffect(() => {
    localStorage.setItem('slang_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Persist theme
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('slang_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('slang_theme', 'light');
    }
  }, [isDarkMode]);

  // Load history & companion session
  useEffect(() => {
    const loadHistory = async () => {
      const records = await getHistory();
      setHistory(records);
    };
    loadHistory();
    const savedStreak = localStorage.getItem('user_streak');
    if (savedStreak) setStreak(parseInt(savedStreak));
  }, []);

  const [srsState, setSrsState] = useState<Map<string, any>>(() => loadSRSState());
  const [dueCount, setDueCount] = useState(0);

  // Update due count whenever SRS state or library changes
  useEffect(() => {
    if (sentenceLibrary && srsState.size > 0) {
      let due = 0;
      for (const [id, record] of srsState.entries()) {
        if (record && record.nextReview && record.nextReview <= Date.now()) due++;
      }
      setDueCount(due);
    }
  }, [srsState, sentenceLibrary]);

  // Load sentence library when language changes
  useEffect(() => {
    if (hasOnboarded) {
      const code = LANG_CODES[userProfile.target_language] || 'en';
      const lib = getSentenceLibrary(userProfile.target_language);
      setSentenceLibrary(lib);
      setSrsState(loadSRSState()); // Reload SRS state when language changes
    }
  }, [hasOnboarded, userProfile.target_language]);

  // Init companion session
  useEffect(() => {
    if (hasOnboarded && activeTab === 'companion') {
      const existing = localStorage.getItem(`companion_${userProfile.target_language}`);
      if (existing) {
        try { setCompanionSession(JSON.parse(existing)); } catch {}
      } else {
        const session = createCompanionSession(
          LANG_CODES[userProfile.target_language] || 'en',
          userProfile.level
        );
        setCompanionSession(session);
        localStorage.setItem(`companion_${userProfile.target_language}`, JSON.stringify(session));
      }
    }
  }, [hasOnboarded, activeTab, userProfile.target_language, userProfile.level]);

  // Save companion session
  useEffect(() => {
    if (companionSession && activeTab === 'companion') {
      localStorage.setItem(`companion_${userProfile.target_language}`, JSON.stringify(companionSession));
    }
  }, [companionSession, activeTab, userProfile.target_language]);

  // Fetch daily lesson
  useEffect(() => {
    if (hasOnboarded && activeTab === 'practice' && !targetPhoneme) {
      fetchDailyLesson();
    }
  }, [hasOnboarded, activeTab, targetPhoneme]);

  // Load random sentence when switching to practice
  const fetchDailyLesson = async () => {
    if (isLessonLoading || !sentenceLibrary) return;
    setIsLessonLoading(true);
    try {
      const sentence = pickDailySentence(sentenceLibrary, userProfile.level, srsState);
      if (sentence) {
        setCurrentSentence(sentence);
        setCurrentPrompt(sentence.text);
        setPromptContext(sentence.topic || 'Daily Practice');
      } else {
        setCurrentPrompt("Tell me about your day so far.");
        setPromptContext("Daily Practice");
      }
    } catch {
      setCurrentPrompt("Tell me about your day so far.");
      setPromptContext("Daily Practice");
    } finally {
      setIsLessonLoading(false);
    }
  };

  const handleOnboardingComplete = (profileData: Partial<UserProfile>) => {
    const newProfile = { ...userProfile, ...profileData };
    setUserProfile(newProfile);
    setHasOnboarded(true);
    localStorage.setItem('slang_onboarded', 'true');
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.start();
      setAppState(AppState.RECORDING);
    } catch (err) {
      setError("Could not access microphone. Please allow permissions.");
      console.error(err);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
      setAudioBlob(blob);
      mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      await processRecording(blob);
    };
  };

  const processRecording = async (blob: Blob) => {
    setAppState(AppState.ANALYZING);
    try {
      const base64Audio = await blobToBase64(blob);
      const result = await analyzeAudio(base64Audio, userProfile, currentPrompt, targetPhoneme);
      setAnalysis(result);
      await saveSession(result, blob, targetPhoneme);

      // Record SRS review for this sentence
      if (currentSentence && currentSentence.id) {
        const score = result.overall_score ?? 50;
        recordReview(srsState, currentSentence, score);
        setSrsState(loadSRSState()); // Reload to get updated state
      }

      const updatedHistory = await getHistory();
      setHistory(updatedHistory);
      setStreak(s => s + 1);
      localStorage.setItem('user_streak', (streak + 1).toString());
      setXp(xp + Math.round(result.overall_score));
      setAppState(AppState.RESULTS);
    } catch (err) {
      setError("Analysis failed. Please check your API key and try again.");
      setAppState(AppState.ERROR);
    }
  };

  const handleRetry = () => {
    setAppState(AppState.IDLE);
    setAnalysis(null);
    setAudioBlob(null);
  };

  const resetToSelection = () => {
    setAppState(AppState.IDLE);
    setAnalysis(null);
    setAudioBlob(null);
    setTargetPhoneme(null);
    fetchDailyLesson();
  };

  const refreshPrompt = () => {
    fetchDailyLesson();
  };

  const handlePhonemeSelect = (phoneme: string, prompt: string) => {
    setTargetPhoneme(phoneme);
    setCurrentPrompt(prompt);
    setPromptContext(`Drill: /${phoneme}/`);
  };

  const handleReviewSession = (session: SessionRecord) => setReviewSession(session);
  const handleCloseReview = () => setReviewSession(null);

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    const updated = await getHistory();
    setHistory(updated);
  };

  const handleCompanionSend = async () => {
    if (!companionSession || !companionInput.trim() || isCompanionLoading) return;
    setIsCompanionLoading(true);
    try {
      const response = await fetch('/api/companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: companionSession.id,
          message: companionInput,
          targetLanguage: userProfile.target_language,
          level: userProfile.level,
          messages: companionSession.messages,
        }),
      });
      const data = await response.json();
      const updated = addCompanionMessage(companionSession, 'user', companionInput);
      const withResponse = addCompanionMessage(updated, 'companion', data.response, data.corrected_text, data.correction_note);
      setCompanionSession(withResponse);
      setCompanionInput('');
    } catch (err) {
      console.error('Companion error:', err);
    } finally {
      setIsCompanionLoading(false);
    }
  };

  const companionHandlers = {
    onSessionUpdate: setCompanionSession,
    targetLanguage: userProfile.target_language,
    level: userProfile.level,
    onVoiceInput: startRecording,
    isRecording: appState === AppState.RECORDING,
  };

  if (!hasOnboarded) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 cursor-pointer" onClick={() => { setActiveTab('practice'); setReviewSession(null); }}>
            <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">Slang Language</span>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* XP & Streak */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full border border-orange-100 dark:border-orange-900/50">
                <Flame className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold">{streak}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full border border-indigo-100 dark:border-indigo-900/50">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold">{xp} XP</span>
              </div>
            </div>

            <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Native Language */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Native:</span>
              <select value={userProfile.native_language} onChange={(e) => setUserProfile({...userProfile, native_language: e.target.value})} className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer border-none p-0 focus:ring-0 max-w-[100px]">
                {NATIVE_LANGUAGES.map(lang => <option key={lang} value={lang} className="dark:bg-slate-800">{lang}</option>)}
              </select>
            </div>

            {/* Target Language */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Learning:</span>
              <select value={userProfile.target_language} onChange={(e) => {
                setUserProfile({...userProfile, target_language: e.target.value});
              }} className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer border-none p-0 focus:ring-0 max-w-[100px]">
                {TARGET_LANGUAGES.map(lang => <option key={lang} value={lang} className="dark:bg-slate-800">{lang}</option>)}
              </select>
            </div>

            {/* Accent (English only) */}
            {userProfile.target_language === 'English' && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Accent:</span>
                <select value={userProfile.accent_reduction_goal} onChange={(e) => setUserProfile({...userProfile, accent_reduction_goal: e.target.value})} className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer border-none p-0 focus:ring-0 max-w-[140px]">
                  {TARGET_ACCENTS.map(accent => <option key={accent} value={accent} className="dark:bg-slate-800">{accent}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="sticky top-16 z-40 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-b border-slate-200/30 dark:border-slate-800/30">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {[
            { id: 'practice', label: 'Practice', icon: Target },
            { id: 'sentences', label: 'Sentences', icon: BookOpen },
            { id: 'companion', label: 'Companion', icon: MessageCircle },
            { id: 'proverbs', label: 'Proverbs', icon: Sparkles },
            { id: 'progress', label: 'Progress', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as TabMode); setReviewSession(null); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center justify-center animate-in fade-in">
            {error}
          </div>
        )}

        {/* Review Mode */}
        {reviewSession ? (
          <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-4">
            <div className="w-full max-w-4xl mb-6 flex justify-between items-center">
              <button onClick={handleCloseReview} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 transition-all shadow-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Progress
              </button>
              <div className="text-sm text-slate-500">Reviewing Session from {new Date(reviewSession.timestamp).toLocaleDateString()}</div>
            </div>
            <ResultsView analysis={reviewSession.full_analysis} audioBlob={reviewSession.audioBlob || null} onRetry={handleCloseReview} isDarkMode={isDarkMode} />
          </div>
        ) : (
          <>
            {/* Practice Tab — Voice recording with sentence + native audio */}
            {activeTab === 'practice' && (
              <div className="max-w-5xl mx-auto">
                {/* Lesson header */}
                {appState === AppState.IDLE && !targetPhoneme && (
                  <div className="mb-8 flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your Daily Practice</h1>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">{promptContext}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {dueCount > 0 && (
                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium border border-amber-200 dark:border-amber-800/50">
                          {dueCount} due for review
                        </span>
                      )}
                      <button onClick={refreshPrompt} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors" title="New sentence">
                        <RefreshCcw className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Sentence card */}
                <div className="bg-white dark:bg-slate-800/50 p-8 md:p-12 rounded-3xl shadow-xl shadow-indigo-900/5 dark:shadow-none border border-slate-100 dark:border-slate-700 mb-8 relative group transition-all hover:border-indigo-200 dark:hover:border-indigo-800/50">
                  {/* Sentence badge */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm whitespace-nowrap">
                    {currentSentence ? `${currentSentence.cefr_level} • ${currentSentence.topic}` : promptContext}
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    {isLessonLoading ? (
                      <div className="flex flex-col items-center justify-center h-32 space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <p className="text-sm text-slate-400">Loading your practice sentence...</p>
                      </div>
                    ) : (
                      <>
                        {/* Target sentence */}
                        <div className="text-center">
                          <p className="text-3xl md:text-5xl font-serif text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                            {currentPrompt}
                          </p>
                          {/* Translation toggle */}
                          {showTranslation && currentSentence?.translation && (
                            <p className="mt-4 text-lg text-slate-500 dark:text-slate-400 italic">
                              "{currentSentence.translation}"
                            </p>
                          )}
                          {/* IPA hint */}
                          {showIPA && currentSentence?.ipa_hint && (
                            <p className="mt-2 text-sm font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full inline-block">
                              {currentSentence.ipa_hint}
                            </p>
                          )}
                        </div>

                        {/* Native audio preview */}
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/generate-tts', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ text: currentPrompt }),
                                });
                                const data = await res.json();
                                if (data.audioData) {
                                  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                                  const ctx = new AudioContextClass({ sampleRate: 24000 });
                                  const bytes = atob(data.audioData);
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
                                }
                              } catch (e) { console.error(e); }
                            }}
                            className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            <Volume2 className="w-4 h-4" />
                            Listen to native pronunciation
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Waveform */}
                <div className="w-full mb-8 px-4">
                  <Waveform isRecording={appState === AppState.RECORDING} isDarkMode={isDarkMode} />
                </div>

                {/* Record button */}
                <div className="flex justify-center mb-8">
                  <div className="flex gap-6 items-center">
                    {appState === AppState.IDLE ? (
                      <button
                        onClick={startRecording}
                        className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white shadow-2xl hover:scale-105 transition-all duration-300 focus:outline-none"
                      >
                        <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:scale-110 transition-transform"></div>
                        <Mic className="w-10 h-10" />
                      </button>
                    ) : (
                      <button
                        onClick={stopRecording}
                        className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-2xl hover:scale-105 transition-all duration-300 focus:outline-none"
                      >
                        <div className="w-8 h-8 bg-white rounded-sm shadow-sm" />
                        <div className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-20"></div>
                      </button>
                    )}
                  </div>
                </div>
                <p className="mt-6 text-sm font-medium text-slate-400 animate-pulse text-center">
                  {appState === AppState.RECORDING ? "Listening... Speak the sentence above" : "Tap microphone to record your voice"}
                </p>

                {/* Translation & IPA toggles */}
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button onClick={() => setShowTranslation(!showTranslation)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${showTranslation ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <BookOpen className="w-4 h-4" /> Translation
                  </button>
                  <button onClick={() => setShowIPA(!showIPA)} className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${showIPA && currentSentence?.ipa_hint ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <span className="text-lg leading-none">α</span> IPA
                  </button>
                </div>
              </div>
            )}

            {/* Sentences Tab — Browse the 5000 sentence library */}
            {activeTab === 'sentences' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex items-baseline justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Sentence Library</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      {sentenceLibrary?.total_count?.toLocaleString() || 0} essential sentences in {userProfile.target_language}
                    </p>
                  </div>
                  <SentenceBrowser language={userProfile.target_language} level={userProfile.level} />
                </div>
                <SentenceBrowser language={userProfile.target_language} level={userProfile.level} onSelectSentence={(s) => {
                  setCurrentSentence(s);
                  setCurrentPrompt(s.text);
                  setPromptContext(`${s.cefr_level} • ${s.topic}`);
                  setActiveTab('practice');
                }} />
              </div>
            )}

            {/* Companion Tab — AI conversation practice */}
            {activeTab === 'companion' && (
              <div className="max-w-4xl mx-auto animate-in fade-in">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI Language Companion</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Practice conversation with AI. I'll correct your grammar and teach you idioms.
                  </p>
                </div>
                {companionSession && (
                  <CompanionChat
                    session={companionSession}
                    {...companionHandlers}
                  />
                )}
              </div>
            )}

            {/* Proverbs Tab */}
            {activeTab === 'proverbs' && (
              <div className="max-w-4xl mx-auto animate-in fade-in">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Proverbs & Idioms</h1>
                  <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Learn the sayings that make you sound like a local.
                  </p>
                </div>
                <ProverbViewer language={userProfile.target_language} />
              </div>
            )}

            {/* Progress Tab */}
            {activeTab === 'progress' && (
              <div className="animate-in fade-in">
                <div className="flex items-baseline justify-between mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="text-left">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Your Progress</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Goal: {userProfile.daily_goal_minutes}m/day • {userProfile.motivation}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-slate-400">Current Level</p>
                    <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 capitalize">{userProfile.level}</p>
                  </div>
                </div>
                <ProgressView history={history} isDarkMode={isDarkMode} onReviewSession={handleReviewSession} onDeleteSession={handleDeleteSession} />
              </div>
            )}

            {/* Phoneme Drill Tab */}
            {activeTab !== 'progress' && !targetPhoneme && activeTab !== 'practice' && activeTab !== 'sentences' && activeTab !== 'companion' && activeTab !== 'proverbs' && (
              <div className="w-full">
                <PhonemeSelector onSelect={handlePhonemeSelect} onViewChart={() => setPhonemeViewMode('chart')} phonemes={[]} />
              </div>
            )}

            {(appState === AppState.ANALYZING) && (
              <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in duration-500">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 rounded-full animate-pulse"></div>
                  <Loader2 className="w-20 h-20 text-indigo-600 dark:text-indigo-400 animate-spin relative z-10" />
                </div>
                <h2 className="mt-8 text-3xl font-bold text-slate-800 dark:text-slate-100">Analyzing Your Speech</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                  Comparing against native pronunciation...
                </p>
              </div>
            )}

            {appState === AppState.RESULTS && analysis && (
              <div className="flex flex-col items-center">
                {targetPhoneme && (
                  <div className="w-full max-w-4xl mb-6 flex justify-start">
                    <button onClick={resetToSelection} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 transition-all shadow-sm">
                      <ArrowLeft className="w-4 h-4" /> Choose Another Sound
                    </button>
                  </div>
                )}
                <ResultsView analysis={analysis} audioBlob={audioBlob} onRetry={handleRetry} isDarkMode={isDarkMode} />
              </div>
            )}

            {appState === AppState.ERROR && (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold">!</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Analysis Failed</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">{error || "Something went wrong."}</p>
                <button onClick={handleRetry} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">Try Again</button>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
