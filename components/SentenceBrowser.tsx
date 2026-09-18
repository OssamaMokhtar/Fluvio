import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Filter, X, ChevronRight, Speaker, Globe, Grid, List } from 'lucide-react';
import { getSentenceLibrary, pickDailySentence, LANG_NAMES, type SentenceLibrary } from '../services/clientLibrary';

interface SentenceBrowserProps {
  language: string;
  level: string;
  onSelectSentence?: (sentence: any) => void;
  compact?: boolean;
}

export default function SentenceBrowser({ language, level, onSelectSentence, compact = false }: SentenceBrowserProps) {
  const [library, setLibrary] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    const loadLibrary = async () => {
      const lib = await getSentenceLibrary(language);
      setLibrary(lib);
      // Load default results — first 50 sentences
      setResults((lib.sentences || []).slice(0, 50));
    };
    loadLibrary();
  }, [language]);

  useEffect(() => {
    if (!library) return;
    if (searchQuery.trim()) {
      // Client-side filter of loaded sentences
      const q = searchQuery.toLowerCase();
      const found = (library.sentences || []).filter((s: any) =>
        s.text?.toLowerCase().includes(q) ||
        s.translation?.toLowerCase().includes(q) ||
        s.topic?.toLowerCase().includes(q)
      );
      setResults(found.slice(0, 50));
    } else {
      // Filtered by level/topic or show all
      let subset = library.sentences || [];
      if (selectedLevel) {
        subset = subset.filter((s: any) => s.cefr_level === selectedLevel);
      }
      if (selectedTopic) {
        subset = subset.filter((s: any) => s.topic === selectedTopic);
      }
      setResults(subset.slice(0, 50));
    }
  }, [searchQuery, library, selectedLevel, selectedTopic]);

  const levels = library?.by_level ? Object.keys(library.by_level) : [];
  const topics = library?.by_topic ? Object.keys(library.by_topic).slice(0, 15) : [];

  const handleSelect = (sentence: any) => {
    if (onSelectSentence) onSelectSentence(sentence);
  };

  if (!library) return null;

  if (compact) {
    // Compact mode — just show a sentence with play button
    const sentence = results[0] || library.sentences[0];
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-4">
          <div className="text-3xl text-indigo-600 dark:text-indigo-400 font-bold font-serif leading-relaxed whitespace-pre-wrap">
            {sentence?.text || 'Loading...'}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">
              {sentence?.cefr_level}
            </span>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <Speaker className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>
        <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {sentence?.translation && (
            <span className="italic">\"{sentence.translation}\"</span>
          )}
          <p className="mt-1 text-xs">{library.total_count.toLocaleString()} sentences available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${library.total_count.toLocaleString()} sentences...`}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <select
            value={selectedLevel || ''}
            onChange={(e) => setSelectedLevel(e.target.value || null)}
            className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Levels</option>
            {levels.map(l => (
              <option key={l} value={l}>{l} ({(library.by_level?.[l] as any) || 0})</option>
            ))}
          </select>
          <select
            value={selectedTopic || ''}
            onChange={(e) => setSelectedTopic(e.target.value || null)}
            className="px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Topics</option>
            {topics.map(t => (
              <option key={t} value={t}>{t} ({library.by_topic[t]})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
        <span>{results.length} sentences</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sentence cards */}
      {results.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No sentences found for "{searchQuery}"</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => handleSelect(s)}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all hover:shadow-md group"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                  {s.cefr_level}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{s.topic}</span>
              </div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {s.text}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 italic line-clamp-2">
                "{s.translation}"
              </p>
              <div className="flex items-center gap-1 mt-2">
                {s.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((s) => (
            <div
              key={s.id}
              onClick={() => handleSelect(s)}
              className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full">
                    {s.cefr_level}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500 capitalize">{s.topic}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{s.text}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-0.5 line-clamp-1">"{s.translation}"</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
