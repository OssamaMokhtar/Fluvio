import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Play, Pause, RefreshCw, Volume2, User, Bot, Activity } from 'lucide-react';
import { generateTTS } from '../services/geminiService';
import { playPCM, getAudioBuffer } from '../services/audioUtils';
import { decodeBase64ToAudioBuffer, getWaveformData, compareWaveforms, indexToTime, timeToIndex } from '../services/waveformUtils';
import { AnalysisResponse } from '../types';

interface ComparisonPlayerProps {
  userAudioBlob: Blob | null;
  modelText: string;
  analysis?: AnalysisResponse | null;
  isDarkMode: boolean;
}

const ComparisonPlayer: React.FC<ComparisonPlayerProps> = ({ userAudioBlob, modelText, analysis, isDarkMode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSource, setActiveSource] = useState<'user' | 'model' | 'both' | null>(null);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);
  const [ttsAudioBase64, setTtsAudioBase64] = useState<string | null>(null);
  const [userWaveform, setUserWaveform] = useState<number[]>([]);
  const [nativeWaveform, setNativeWaveform] = useState<number[]>([]);
  const [divergenceRegions, setDivergenceRegions] = useState<{ start: number; end: number; severity: number }[]>([]);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const loopRef = useRef<boolean>(false);
  const userAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIntervalRef = useRef<number | null>(null);

  // Decode user audio waveform when blob changes
  useEffect(() => {
    if (userAudioBlob) {
      getAudioBuffer(userAudioBlob).then(buffer => {
        const wave = getWaveformData(buffer, 300);
        setUserWaveform(wave);
        setDuration(buffer.duration);
      }).catch(err => console.error('Failed to decode user audio:', err));
    } else {
      setUserWaveform([]);
      setDuration(0);
    }
  }, [userAudioBlob]);

  // Fetch and decode TTS audio when modelText changes or user wants to compare
  useEffect(() => {
    if (!modelText || !userWaveform.length) return;

    const fetchTTSAndCompare = async () => {
      setIsLoadingTTS(true);
      try {
        const ttsData = await generateTTS(modelText);
        setTtsAudioBase64(ttsData);
        const nativeBuffer = await decodeBase64ToAudioBuffer(ttsData, 24000);
        const nativeWave = getWaveformData(nativeBuffer, 300);
        setNativeWaveform(nativeWave);

        // Compare waveforms to find divergence regions
        const regions = compareWaveforms(userWaveform, nativeWave, 20, 0.4, 3);
        setDivergenceRegions(regions);
      } catch (e) {
        console.error('Failed to fetch/compare TTS:', e);
      } finally {
        setIsLoadingTTS(false);
      }
    };

    fetchTTSAndCompare();
  }, [modelText, userWaveform.length]);

  // Playback loop
  useEffect(() => {
    if (isPlaying && playbackIntervalRef.current === null) {
      playbackIntervalRef.current = window.setInterval(() => {
        setPlaybackTime(t => {
          const next = t + 0.05;
          if (next >= duration) {
            setIsPlaying(false);
            setActiveSource(null);
            if (loopRef.current) {
              setPlaybackTime(0);
              setIsPlaying(true);
            }
            return 0;
          }
          return next;
        });
      }, 50);
    }
    return () => {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    };
  }, [isPlaying, duration]);

  const playSequence = async () => {
    if (!userAudioRef.current) return;

    setActiveSource('user');
    await userAudioRef.current.play();

    await new Promise<void>(resolve => {
      if (!userAudioRef.current) return resolve();
      userAudioRef.current.onended = () => resolve();
    });

    if (!isPlaying && !loopRef.current) {
      setActiveSource(null);
      return;
    }

    setActiveSource('model');
    const ttsData = await generateTTS(modelText);
    setTtsAudioBase64(ttsData);
    await playPCM(ttsData);

    if (loopRef.current && isPlaying) {
      setTimeout(playSequence, 500);
    } else {
      setIsPlaying(false);
      setActiveSource(null);
    }
  };

  const toggleLoop = async () => {
    if (isPlaying) {
      setIsPlaying(false);
      loopRef.current = false;
      userAudioRef.current?.pause();
      setActiveSource(null);
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    } else {
      setIsPlaying(true);
      loopRef.current = true;
      setPlaybackTime(0);
      playSequence();
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!userWaveform.length || !nativeWaveform.length || duration === 0) return;
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = (x / canvas.width) * duration;
    setPlaybackTime(time);
  };

  // Compute pixel positions for divergence regions
  const regionPixels = useMemo(() => {
    if (duration === 0 || !divergenceRegions.length) return [];
    return divergenceRegions.map(r => ({
      x: (r.start / 300) * 100,
      width: ((r.end - r.start) / 300) * 100,
      severity: r.severity,
    }));
  }, [divergenceRegions, duration]);

  return (
    <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Volume2 className="w-4 h-4" /> Waveform Comparison
        </h4>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {divergenceRegions.length > 0 ? `${divergenceRegions.length} divergence regions detected` : 'Listening...'}
        </span>
      </div>

      {/* Dual Waveform Canvas */}
      <div className="relative mb-4">
        <canvas
          ref={undefined as any}
          onClick={handleCanvasClick}
          className="w-full h-28 rounded-lg cursor-pointer"
          style={{ width: '100%', height: '112px' }}
        />
        {/* We render the waveform via a child SVG component for reliability */}
        <DualWaveformCanvas
          userWave={userWaveform}
          nativeWave={nativeWaveform}
          divergenceRegions={regionPixels}
          playbackTime={playbackTime}
          duration={duration}
          isDarkMode={isDarkMode}
          isActive={isPlaying || activeSource !== null}
        />
      </div>

      {/* Color legend */}
      <div className="flex gap-4 mb-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
          <span>You</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-violet-500"></div>
          <span>Native</span>
        </div>
        {divergenceRegions.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <span>Divergence ({divergenceRegions.length})</span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoadingTTS && (
        <div className="text-center py-2 text-sm text-slate-400">
          Analyzing native waveform...
        </div>
      )}

      {/* Playback controls */}
      <button
        onClick={toggleLoop}
        className={`w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
          isPlaying
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
            : 'bg-slate-900 dark:bg-indigo-600 text-white hover:shadow-md'
        }`}
      >
        {isPlaying ? (
          <>
            <Pause className="w-4 h-4 fill-current" /> Stop Comparison
          </>
        ) : (
          <>
            <Play className="w-4 h-4" /> Start A/B Comparison
          </>
        )}
      </button>

      {/* Loop toggle */}
      <div className="flex items-center justify-between mt-2">
        <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={loopRef.current}
            onChange={() => loopRef.current = !loopRef.current}
            className="accent-indigo-600"
          />
          Loop
        </label>
        {playbackTime > 0 && duration > 0 && (
          <span className="text-xs font-mono text-slate-400">
            {playbackTime.toFixed(1)}s / {duration.toFixed(1)}s
          </span>
        )}
      </div>

      {/* User audio reference */}
      {userAudioRef.current && (
        <div className="mt-3 text-xs text-slate-400">
          User recording loaded · {duration.toFixed(1)}s
        </div>
      )}
    </div>
  );
};

/**
 * Renders dual waveforms (user + native) as an SVG overlay,
 * with divergence regions highlighted.
 */
const DualWaveformCanvas: React.FC<{
  userWave: number[];
  nativeWave: number[];
  divergenceRegions: { x: number; width: number; severity: number }[];
  playbackTime: number;
  duration: number;
  isDarkMode: boolean;
  isActive: boolean;
}> = ({ userWave, nativeWave, divergenceRegions, playbackTime, duration, isDarkMode, isActive }) => {
  if (!userWave.length && !nativeWave.length) {
    return (
      <div className={`w-full h-28 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
        <span className="text-sm text-slate-400">Load a recording to see waveform comparison</span>
      </div>
    );
  }

  const width = 800;
  const height = 112;
  const padding = 4;
  const topY = padding;
  const bottomY = height - padding;
  const midY = height / 2;

  // Draw user waveform as a filled area
  const userPath = userWave.length > 0
    ? `M 0,${midY} ${userWave.map((v, i) => {
        const x = (i / userWave.length) * width;
        const y = midY - v * (midY - topY - 4);
        return `L ${x},${y}`;
      }).join(' ')} L ${width},${midY} Z`
    : '';

  // Draw native waveform as a filled area
  const nativePath = nativeWave.length > 0
    ? `M 0,${midY} ${nativeWave.map((v, i) => {
        const x = (i / nativeWave.length) * width;
        const y = midY + v * (bottomY - midY - 4);
        return `L ${x},${y}`;
      }).join(' ')} L ${width},${midY} Z`
    : '';

  // Divergence region rectangles
  const divergenceRects = divergenceRegions.map(r => (
    <rect
      key={`${r.x}-${r.width}`}
      x={r.x}
      y={topY}
      width={Math.max(r.width, 1)}
      height={height - topY * 2}
      fill={r.severity > 0.7 ? (isDarkMode ? '#7f1d1d' : '#fee2e2') : (isDarkMode ? '#78350f' : '#fef3c7')}
      opacity={0.6}
    />
  ));

  // Playback cursor
  const cursorX = duration > 0 ? (playbackTime / duration) * width : 0;

  return (
    <svg
      width={width}
      height={height}
      className="w-full h-28 rounded-lg"
      style={{ backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }}
    >
      {/* User waveform (top half) */}
      {userPath && (
        <path
          d={userPath}
          fill={isActive ? (isDarkMode ? '#818cf8' : '#6366f1') : (isDarkMode ? '#4f46e5' : '#a5b4fc')}
          opacity={0.8}
        />
      )}

      {/* Native waveform (bottom half) */}
      {nativePath && (
        <path
          d={nativePath}
          fill={isActive ? (isDarkMode ? '#c4b5fd' : '#8b5cf6') : (isDarkMode ? '#7c3aed' : '#a78bfa')}
          opacity={0.8}
        />
      )}

      {/* Divergence regions */}
      {divergenceRects}

      {/* Center line */}
      <line x1={0} y1={midY} x2={width} y2={midY} stroke={isDarkMode ? '#475569' : '#cbd5e1'} strokeWidth={1} />

      {/* Playback cursor */}
      {playbackTime > 0 && (
        <line
          x1={cursorX} y1={topY}
          x2={cursorX} y2={bottomY}
          stroke={isDarkMode ? '#a5b4fc' : '#312e81'}
          strokeWidth={2}
        />
      )}

      {/* Labels */}
      <text x={8} y={18} fill={isDarkMode ? '#cbd5e1' : '#64748b'} fontSize={11} fontWeight={600}>YOU</text>
      <text x={8} y={height - 10} fill={isDarkMode ? '#cbd5e1' : '#64748b'} fontSize={11} fontWeight={600}>NATIVE</text>
    </svg>
  );
};

export default ComparisonPlayer;
