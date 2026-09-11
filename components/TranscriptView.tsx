import React from 'react';
import { TranscriptWord } from '../services/speechRecognition';
import { generateTTS } from '../services/geminiService';
import { Play, AlertCircle } from 'lucide-react';

interface TranscriptViewProps {
  words: TranscriptWord[];
  isDarkMode: boolean;
  onWordClick?: (word: string, index: number) => void;
}

const TranscriptView: React.FC<TranscriptViewProps> = ({ words, isDarkMode, onWordClick }) => {
  if (words.length === 0) {
    return (
      <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
        <p className="text-sm text-slate-400 italic">Speak to see your words appear here...</p>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'} border ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wide">Live Transcript</p>
      <div className="text-base leading-relaxed space-y-1">
        {words.map((w, i) => (
          <WordToken key={i} word={w} index={i} isDarkMode={isDarkMode} onWordClick={onWordClick} />
        ))}
      </div>
    </div>
  );
};

interface WordTokenProps {
  word: TranscriptWord;
  index: number;
  isDarkMode: boolean;
  onWordClick?: (word: string, index: number) => void;
}

const WordToken: React.FC<WordTokenProps> = ({ word, index, isDarkMode, onWordClick }) => {
  const confidenceColor = word.confidence > 0.8
    ? (isDarkMode ? 'text-green-400' : 'text-green-600')
    : word.confidence > 0.5
      ? (isDarkMode ? 'text-amber-400' : 'text-amber-600')
      : (isDarkMode ? 'text-red-400' : 'text-red-600');

  return (
    <span
      className={`inline px-1 py-0.5 rounded-md transition-colors ${
        word.isFinal
          ? confidenceColor + ' font-medium'
          : (isDarkMode ? 'text-slate-500 italic' : 'text-slate-400 italic')
      }`}
      onClick={() => onWordClick?.(word.word, index)}
      style={{ cursor: onWordClick ? 'pointer' : 'default' }}
      title={word.isFinal ? `✓ ${word.word} (confidence: ${(word.confidence * 100).toFixed(0)}%)` : `Listening... ${word.word}`}
    >
      {word.word}
      {word.isFinal && (
        <span className={`ml-1 text-xs ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
          ✓
        </span>
      )}
    </span>
  );
};

export default TranscriptView;
