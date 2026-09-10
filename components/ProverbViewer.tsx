import React, { useState, useEffect } from 'react';
import { Sparkles, BookOpen, RefreshCcw, ChevronRight, Globe, Copy, Check } from 'lucide-react';

interface ProverbViewerProps {
  language: string;
  onSelectProverb?: (proverb: any) => void;
}

export default function ProverbViewer({ language, onSelectProverb }: ProverbViewerProps) {
  const [proverbs, setProverbs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProverb, setSelectedProverb] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/proverbs/${language}`)
      .then(r => r.json())
      .then(data => {
        setProverbs(data.proverbs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [language]);

  const fetchRandom = () => {
    fetch(`/api/proverbs/${language}/random`)
      .then(r => r.json())
      .then(p => setSelectedProverb(p))
      .catch(() => {});
  };

  useEffect(() => {
    if (!selectedProverb && proverbs.length > 0) {
      setSelectedProverb(proverbs[Math.floor(Math.random() * proverbs.length)]);
    }
  }, [selectedProverb, proverbs]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const languageName = language.charAt(0).toUpperCase() + language.slice(1);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-white p-2 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">{languageName} Proverbs & Idioms</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cultural wisdom to sound like a local</p>
          </div>
        </div>
        <button
          onClick={fetchRandom}
          className="p-2 rounded-full hover:bg-white/50 transition-colors"
          title="Random proverb"
        >
          <RefreshCcw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </button>
      </div>

      {/* Selected proverb detail view */}
      {selectedProverb && (
        <div className="p-6 animate-in fade-in">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl p-6 border border-amber-200 dark:border-amber-800/30">
            {/* Proverb text */}
            <div className="flex items-start gap-3 mb-4">
              <span className="text-3xl text-amber-600 dark:text-amber-400 font-serif leading-relaxed">
                "{selectedProverb.text}"
              </span>
            </div>

            {/* Literal translation */}
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              <span className="font-medium text-slate-600 dark:text-slate-300 mr-2">Literal:</span>
              <span className="italic">"{selectedProverb.literal_translation}"</span>
            </div>

            {/* Meaning */}
            <div className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 mb-3 border border-amber-100 dark:border-amber-800/20">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">What it means:</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedProverb.meaning}
              </p>
            </div>

            {/* Usage note */}
            <div className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
              <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <p className="leading-relaxed">
                <span className="font-medium text-slate-600 dark:text-slate-300">When to use: </span>
                {selectedProverb.usage_note}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-4">
              {selectedProverb.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => onSelectProverb?.(selectedProverb)}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4" /> Practice This Proverb
            </button>
            <button
              onClick={() => handleCopy(selectedProverb.text, selectedProverb.id)}
              className={`p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                copiedId === selectedProverb.id ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-slate-500 dark:text-slate-400'
              }`}
              title="Copy proverb"
            >
              {copiedId === selectedProverb.id ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* All proverbs list */}
      <div className="border-t border-slate-100 dark:border-slate-700">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {loading ? 'Loading...' : `${proverbs.length} proverbs available`}
          </p>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Loading proverbs...</p>
            </div>
          ) : proverbs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No proverbs found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {proverbs.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProverb(p)}
                  className={`w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                    selectedProverb?.id === p.id ? 'bg-amber-50 dark:bg-amber-900/10' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg font-serif text-amber-600 dark:text-amber-400 leading-relaxed flex-1">
                      "{p.text}"
                    </span>
                    <ChevronRight className={`w-4 h-4 flex-shrink-0 mt-1 ${
                      selectedProverb?.id === p.id ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'
                    }`} />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full capitalize">
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
