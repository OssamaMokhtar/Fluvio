
import React, { useState, useRef, useEffect } from 'react';
import { AnalysisResponse, ProsodyDeviation, PhonemeError } from '../types';
import { TranscriptWord } from '../types';
import ScoreCard from './ScoreCard';
import Waveform from './Waveform';
import TranscriptView from './TranscriptView';
import ComparisonPlayer from './ComparisonPlayer';
import { Play, AlertCircle, Info, Pause, Loader2, RotateCcw, Activity, Zap, Sparkles, Link, MessageCircle, Users, Music, ListMusic, Globe, BookOpen } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { generateTTS } from '../services/geminiService';
import { playPCM } from '../services/audioUtils';

interface ResultsViewProps {
  analysis: AnalysisResponse;
  audioBlob: Blob | null;
  onRetry: () => void;
  isDarkMode?: boolean;
  annotatedTranscriptWords?: TranscriptWord[];
}

const ProsodyItem: React.FC<{ deviation: ProsodyDeviation }> = ({ deviation }) => {
  const val = Math.max(-1, Math.min(1, deviation.measure));
  const isNegative = val < 0;
  const widthPct = Math.abs(val) * 50; 

  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-50 dark:border-slate-700 last:border-0 group hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded-lg transition-colors">
      <div className="w-32 md:w-40 flex-shrink-0">
        <p className="font-bold text-slate-700 dark:text-slate-200 text-sm truncate" title={deviation.word}>"{deviation.word}"</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">{deviation.type.replace(/_/g, ' ')}</p>
      </div>
      
      <div className="flex-1 flex items-center gap-3">
         <span className="hidden md:inline text-[10px] font-medium text-slate-400 dark:text-slate-500 w-6 text-right">Low</span>
         <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full relative overflow-hidden">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300 dark:bg-slate-600 z-10"></div>
            <div 
              className={`absolute h-full rounded-full transition-all duration-500 ${isNegative ? 'bg-blue-400' : 'bg-orange-400'}`}
              style={{
                left: isNegative ? `${50 - widthPct}%` : '50%',
                width: `${widthPct}%`
              }}
            ></div>
         </div>
         <span className="hidden md:inline text-[10px] font-medium text-slate-400 dark:text-slate-500 w-6">High</span>
      </div>
    </div>
  );
};

const ResultsView: React.FC<ResultsViewProps> = ({ analysis, audioBlob, onRetry, isDarkMode = false, annotatedTranscriptWords }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedError, setSelectedError] = useState<PhonemeError | null>(null);
  const [isSegmentPlaying, setIsSegmentPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // TTS State
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelPlaying, setIsModelPlaying] = useState(false);
  const [ttsAudioBase64, setTtsAudioBase64] = useState<string | null>(null);

  // Confetti State
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (audioBlob && audioRef.current) {
      const url = URL.createObjectURL(audioBlob);
      audioRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  // Simple Confetti Effect for High Score
  useEffect(() => {
    if (analysis.overall_score >= 80 && canvasRef.current) {
       const canvas = canvasRef.current;
       const ctx = canvas.getContext('2d');
       if(!ctx) return;

       canvas.width = window.innerWidth;
       canvas.height = window.innerHeight;
       
       const particles: any[] = [];
       const particleCount = 150;
       const colors = ['#a855f7', '#6366f1', '#3b82f6', '#10b981', '#f59e0b'];

       for(let i=0; i<particleCount; i++) {
         particles.push({
           x: canvas.width / 2,
           y: canvas.height / 2,
           vx: (Math.random() - 0.5) * 15,
           vy: (Math.random() - 0.5) * 15 - 5,
           life: 100 + Math.random() * 100,
           color: colors[Math.floor(Math.random() * colors.length)],
           size: Math.random() * 6 + 2
         });
       }

       const animate = () => {
         if(!ctx) return;
         ctx.clearRect(0, 0, canvas.width, canvas.height);
         let active = false;
         particles.forEach(p => {
           if(p.life > 0) {
             active = true;
             p.x += p.vx;
             p.y += p.vy;
             p.vy += 0.2; // gravity
             p.life--;
             p.size *= 0.99;
             
             ctx.fillStyle = p.color;
             ctx.beginPath();
             ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
             ctx.fill();
           }
         });
         
         if(active) requestAnimationFrame(animate);
         else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none'; // Hide when done
         }
       };
       animate();
    }
  }, [analysis.overall_score]);

  // Handle word click: jump playback to that word's time + play TTS
  const handleWordClick = (word: string, index: number) => {
    if (!audioRef.current || !annotatedTranscriptWords) return;
    const w = annotatedTranscriptWords[index];
    if (!w) return;
    audioRef.current.currentTime = w.start;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsSegmentPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
    // Play the word's native TTS
    generateTTS(word).then(base64 => {
      if (base64) {
        // Reuse playPCM to play native pronunciation
        playPCM(base64).catch(console.error);
      }
    }).catch(console.error);
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    setIsSegmentPlaying(false);

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const t = audioRef.current.currentTime;
      setCurrentTime(t);

      if (isSegmentPlaying && selectedError) {
        if (t >= selectedError.end_ts) {
          audioRef.current.pause();
          setIsSegmentPlaying(false);
          setIsPlaying(false);
          audioRef.current.currentTime = selectedError.start_ts;
          return;
        }
      }

      if (!isSegmentPlaying) {
        const activeError = analysis.phoneme_errors.find(err => t >= err.start_ts && t <= err.end_ts);
        if (activeError !== selectedError) {
          setSelectedError(activeError || null);
        }
      }
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      setIsSegmentPlaying(false);
      audioRef.current.currentTime = time;
      if (!isPlaying) {
         audioRef.current.play();
         setIsPlaying(true);
      }
      const activeError = analysis.phoneme_errors.find(err => time >= err.start_ts && time <= err.end_ts);
      setSelectedError(activeError || null);
    }
  };

  const handlePlaySegment = () => {
    if (audioRef.current && selectedError) {
      audioRef.current.currentTime = selectedError.start_ts;
      audioRef.current.play();
      setIsSegmentPlaying(true);
      setIsPlaying(true);
    }
  };

  const handlePauseSegment = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsSegmentPlaying(false);
      setIsPlaying(false);
    }
  };

  const handleSegmentScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && selectedError) {
      const val = parseFloat(e.target.value);
      audioRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  const handleSelectError = (error: PhonemeError) => {
    setSelectedError(error);
    setIsSegmentPlaying(false);
    if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
        audioRef.current.currentTime = error.start_ts;
        setCurrentTime(error.start_ts);
    }
  };

  const handlePlayModelAudio = async () => {
    if (isModelPlaying || isModelLoading) return;
    try {
      let audioData = ttsAudioBase64;
      if (!audioData) {
         setIsModelLoading(true);
         audioData = await generateTTS(analysis.model_phrase.text);
         setTtsAudioBase64(audioData);
         setIsModelLoading(false);
      }
      setIsModelPlaying(true);
      await playPCM(audioData);
    } catch (e) {
       console.error(e);
    } finally {
       setIsModelLoading(false);
       setIsModelPlaying(false);
    }
  };

  // Trigger waveform comparison when results are shown
  useEffect(() => {
    if (audioBlob && analysis && analysis.model_phrase?.text) {
      // The ComparisonPlayer's useEffect will pick up the audioBlob + modelText
      // and fetch TTS + decode waveforms automatically.
      // Force a reflow by setting a dummy state trigger.
      setCurrentTime(prev => prev);
    }
  }, [audioBlob, analysis]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* Confetti Canvas Layer */}
      {analysis.overall_score >= 80 && (
        <canvas 
          ref={canvasRef} 
          className="fixed inset-0 pointer-events-none z-50"
        />
      )}
      
      <audio 
        ref={audioRef} 
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setIsSegmentPlaying(false);
        }}
      />

      {/* Hero Summary with Glassmorphism */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-indigo-900 dark:to-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
           <div className="flex-shrink-0">
             <ScoreCard score={analysis.overall_score} label="Overall Score" color="#ffffff" />
           </div>
           <div className="text-center md:text-left space-y-2">
             <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                {analysis.overall_score >= 90 ? "Outstanding!" : analysis.overall_score >= 70 ? "Great Job!" : "Keep Practicing"}
                {analysis.overall_score >= 80 && <span className="text-2xl animate-bounce">🎉</span>}
             </h2>
             <p className="text-indigo-100 text-lg leading-relaxed max-w-lg">{analysis.summary}</p>
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Analysis Tools */}
        <div className="lg:col-span-2 space-y-6">
           
           {/* Waveform Card */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" /> Playback & Analysis
                </h3>
              </div>
              <Waveform 
                audioBlob={audioBlob} 
                analysis={analysis} 
                onSeek={handleSeek} 
                currentTime={currentTime}
                highlightedError={selectedError}
                isDarkMode={isDarkMode}
              />
              
              {/* Error Detail Popup with Playback Controls */}
              {selectedError && (
                <div className="mt-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-2">
                   <div className="flex items-start gap-3">
                      <div className="mt-1"><AlertCircle className="w-5 h-5 text-amber-500" /></div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Correction for "{selectedError.expected_word}"</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                 Detected <span className="text-red-500 font-mono">/{selectedError.detected}/</span> instead of <span className="text-green-500 font-mono">/{selectedError.phoneme}/</span>
                              </p>
                           </div>
                           <button 
                             onClick={isSegmentPlaying ? handlePauseSegment : handlePlaySegment}
                             className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-md"
                             title="Play Segment"
                           >
                             {isSegmentPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                           </button>
                        </div>
                        <input 
                            type="range"
                            min={selectedError.start_ts}
                            max={selectedError.end_ts}
                            step="0.01"
                            value={Math.min(Math.max(currentTime, selectedError.start_ts), selectedError.end_ts)}
                            onChange={handleSegmentScrub}
                            className="w-full mt-3 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                             <span>{selectedError.start_ts.toFixed(2)}s</span>
                             <span>{selectedError.end_ts.toFixed(2)}s</span>
                          </div>
                      </div>
                   </div>
                </div>
              )}
           </div>

           {/* Annotated Transcript */}
           {annotatedTranscriptWords && annotatedTranscriptWords.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                Your Speech
              </h3>
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                Click any word to hear its native pronunciation.
              </div>
              <TranscriptView words={annotatedTranscriptWords} isDarkMode={isDarkMode} onWordClick={handleWordClick} />
            </div>
           )}

           {/* Phoneme Errors Table/List */}
           {analysis.phoneme_errors.length > 0 && (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <ListMusic className="w-5 h-5 text-red-500" /> Detailed Errors
                </h3>
                <div className="space-y-2">
                  {analysis.phoneme_errors.map((err, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectError(err)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-sm border transition-all ${
                        selectedError === err 
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-500/50' 
                          : 'bg-slate-50 dark:bg-slate-900/30 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-2 rounded-full ${err.confidence < 0.8 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                         <div className="text-left">
                            <span className="font-bold text-slate-700 dark:text-slate-200">"{err.expected_word}"</span>
                            <span className="mx-2 text-slate-400">→</span>
                            <span className="font-mono text-red-500 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">/{err.detected}/</span>
                            <span className="ml-2 text-xs text-slate-400">should be</span>
                            <span className="ml-1 font-mono text-green-600 dark:text-green-400">/{err.phoneme}/</span>
                         </div>
                      </div>
                      <div className="text-xs text-slate-400 font-mono bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700">
                         {err.start_ts.toFixed(2)}s
                      </div>
                    </button>
                  ))}
                </div>
             </div>
           )}

           {/* Prosody & Pitch */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-violet-500" /> Intonation
              </h3>
              {analysis.prosody_deviations?.length > 0 ? (
                 analysis.prosody_deviations.map((dev, i) => <ProsodyItem key={i} deviation={dev} />)
              ) : (
                 <div className="p-4 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 rounded-lg text-sm text-center">
                    Excellent rhythm and stress! No major issues found.
                 </div>
              )}
              
              {analysis.pitch_contour && (
                 <div className="mt-6 h-40 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analysis.pitch_contour}>
                        <Line type="monotone" dataKey="native_pitch" stroke="#d8b4fe" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                        <Line type="monotone" dataKey="user_pitch" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-4 mt-2 text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                       <span className="flex items-center gap-1"><span className="w-2 h-2 bg-violet-500 rounded-full"></span> You</span>
                       <span className="flex items-center gap-1"><span className="w-2 h-2 bg-violet-200 rounded-full"></span> Native</span>
                    </div>
                 </div>
              )}
           </div>

        </div>

        {/* Right Column: Comparison & Actions */}
        <div className="space-y-6">
           
           {/* Comparison Player (NEW FEATURE) */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <ComparisonPlayer userAudioBlob={audioBlob} modelText={analysis.model_phrase.text} isDarkMode={isDarkMode} />
           </div>

           {/* Scores Mini Grid */}
           <div className="grid grid-cols-2 gap-4">
              <ScoreCard score={analysis.pronunciation_score} label="Pronunciation" color="#0ea5e9" />
              <ScoreCard score={analysis.intelligibility_score} label="Clarity" color="#10b981" />
           </div>

           {/* Actions */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                 <Zap className="w-5 h-5 text-amber-500" /> Fix This
              </h3>
              <ul className="space-y-3">
                {analysis.prioritized_actions.map((action, i) => (
                   <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">{i+1}</span>
                      {action}
                   </li>
                ))}
              </ul>
           </div>

           {/* Pronunciation Guide (New Feature) */}
           {analysis.pronunciation_guide && analysis.pronunciation_guide.length > 0 && (
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                   <BookOpen className="w-5 h-5 text-sky-500" /> Reference Guide
                </h3>
                <div className="space-y-3">
                   {analysis.pronunciation_guide.map((guide, i) => (
                      <div key={i} className="bg-sky-50 dark:bg-sky-900/20 rounded-lg p-3 border border-sky-100 dark:border-sky-900/30">
                         <p className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase mb-1">
                           {guide.segment}
                         </p>
                         <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                           {guide.tip}
                         </p>
                      </div>
                   ))}
                </div>
             </div>
           )}

        </div>
      </div>

      {/* Drills (Full Width) */}
      {analysis.drills && analysis.drills.length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
           <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" /> Recommended Exercises
           </h3>
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.drills.map((drill, i) => {
                 const advancedTypes = ['connected_speech_challenge', 'idiomatic_expression_practice', 'role_play', 'intonation_practice', 'accent_practice'];
                 const isAdvanced = advancedTypes.includes(drill.type);
                 const isAccent = drill.type === 'accent_practice';
                 
                 return (
                   <div 
                      key={i} 
                      className={`p-5 rounded-xl border transition-all hover:shadow-md ${
                        isAccent
                            ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800'
                        : isAdvanced 
                          ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800' 
                          : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-3">
                         {isAdvanced ? (
                            <div className={`p-1.5 rounded-md ${isAccent ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600' : 'bg-purple-100 dark:bg-purple-900/50 text-purple-600'}`}>
                               {drill.type === 'connected_speech_challenge' && <Link className="w-4 h-4" />}
                               {drill.type === 'idiomatic_expression_practice' && <MessageCircle className="w-4 h-4" />}
                               {drill.type === 'role_play' && <Users className="w-4 h-4" />}
                               {drill.type === 'intonation_practice' && <Music className="w-4 h-4" />}
                               {drill.type === 'accent_practice' && <Globe className="w-4 h-4" />}
                            </div>
                         ) : (
                            <div className="p-1.5 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-600">
                               <RotateCcw className="w-4 h-4" />
                            </div>
                         )}
                         <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                            {drill.type.replace(/_/g, ' ')}
                         </span>
                      </div>
                      <div className="space-y-1 pl-1 border-l-2 border-slate-200 dark:border-slate-700">
                         {Array.isArray(drill.items) ? drill.items.map((item, j) => (
                            <p key={j} className="text-sm font-medium text-slate-700 dark:text-slate-200 pl-2">{item}</p>
                         )) : (
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 pl-2">{drill.items}</p>
                         )}
                      </div>
                   </div>
                 );
              })}
           </div>
        </div>
      )}

      <div className="flex justify-center pt-8">
        <button 
          onClick={onRetry}
          className="group relative px-8 py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-full font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
        >
          <span className="flex items-center gap-2">
            Start New Session <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          </span>
        </button>
      </div>
    </div>
  );
};

export default ResultsView;
