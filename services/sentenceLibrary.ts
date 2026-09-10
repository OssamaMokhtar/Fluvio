/**
 * Unified sentence library — queries across all supported languages.
 * 
 * Usage:
 *   import { getSentenceLibrary, pickDailySentence } from './sentenceLibrary';
 *   const lib = getSentenceLibrary('en');
 *   const sentence = pickDailySentence(lib, 'intermediate');
 */

import { Sentence, SentenceLibrary } from '../data/library';
import { EN_SENTENCES as EN, EN_SENTENCE_COUNT as EN_COUNT } from '../data/sentences/en_sentences';
import { ES_SENTENCES as ES, ES_SENTENCE_COUNT as ES_COUNT } from '../data/sentences/es_sentences';
import { FR_SENTENCES as FR, FR_SENTENCE_COUNT as FR_COUNT } from '../data/sentences/fr_sentences';

export const LANG_CODES: Record<string, 'en' | 'es' | 'fr'> = {
  'English': 'en',
  'Spanish': 'es',
  'French': 'fr',
};

export const LANG_NAMES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
};

function buildLibrary(lang: 'en' | 'es' | 'fr', sentences: Sentence[], total: number): SentenceLibrary {
  const by_level: Record<string, number> = {};
  const by_topic: Record<string, number> = {};
  for (const s of sentences) {
    by_level[s.cefr_level] = (by_level[s.cefr_level] || 0) + 1;
    by_topic[s.topic] = (by_topic[s.topic] || 0) + 1;
  }
  return { language: lang, sentences, total_count: total, by_level, by_topic };
}

export const EN_LIBRARY = buildLibrary('en', EN, EN_COUNT);
export const ES_LIBRARY = buildLibrary('es', ES, ES_COUNT);
export const FR_LIBRARY = buildLibrary('fr', FR, FR_COUNT);

export function getSentenceLibrary(lang: string): SentenceLibrary {
  const code = LANG_CODES[lang] || 'en';
  if (code === 'en') return EN_LIBRARY;
  if (code === 'es') return ES_LIBRARY;
  return FR_LIBRARY;
}

export function pickDailySentence(library: SentenceLibrary, level: string): Sentence | null {
  const targetLevel = level.charAt(0).toUpperCase() + level.slice(1); // 'intermediate' → 'Intermediate'
  const levelMap: Record<string, string> = {
    'beginner': 'A1',
    'elementary': 'A2',
    'intermediate': 'B1',
    'upper-intermediate': 'B2',
    'advanced': 'C1',
    'mastery': 'C2',
  };
  const cefr = levelMap[level.toLowerCase()] || 'B1';
  const candidates = library.sentences.filter(s => s.cefr_level === cefr);
  if (candidates.length === 0) return library.sentences[Math.floor(Math.random() * library.sentences.length)];
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function searchSentences(library: SentenceLibrary, query: string): Sentence[] {
  const q = query.toLowerCase().trim();
  return library.sentences.filter(s =>
    s.text.toLowerCase().includes(q) ||
    s.topic.toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q))
  ).slice(0, 50);
}

export function getSentencesByLevel(library: SentenceLibrary, cefr: string): Sentence[] {
  return library.sentences.filter(s => s.cefr_level === cefr);
}

export function getSentencesByTopic(library: SentenceLibrary, topic: string): Sentence[] {
  return library.sentences.filter(s => s.topic === topic);
}
