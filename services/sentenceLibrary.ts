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
import { DE_SENTENCES as DE, DE_SENTENCE_COUNT as DE_COUNT } from '../data/sentences/de_sentences';
import { IT_SENTENCES as IT, IT_SENTENCE_COUNT as IT_COUNT } from '../data/sentences/it_sentences';
import { JA_SENTENCES as JA, JA_SENTENCE_COUNT as JA_COUNT } from '../data/sentences/ja_sentences';
import { PT_SENTENCES as PT, PT_SENTENCE_COUNT as PT_COUNT } from '../data/sentences/pt_sentences';
import { ZH_SENTENCES as ZH, ZH_SENTENCE_COUNT as ZH_COUNT } from '../data/sentences/zh_sentences';
import { getDueSentences } from './srsService';

// TS widens literal array types to "string" for language/enums.
// Cast at import site to restore the Sentence[] contract.
const asSentence = <T extends readonly any[]>(items: T): T => items;

const EN_SENTENCES_CAST = asSentence(EN) as Sentence[];
const ES_SENTENCES_CAST = asSentence(ES) as Sentence[];
const FR_SENTENCES_CAST = asSentence(FR) as Sentence[];
const DE_SENTENCES_CAST = asSentence(DE) as Sentence[];
const IT_SENTENCES_CAST = asSentence(IT) as Sentence[];
const JA_SENTENCES_CAST = asSentence(JA) as Sentence[];
const PT_SENTENCES_CAST = asSentence(PT) as Sentence[];
const ZH_SENTENCES_CAST = asSentence(ZH) as Sentence[];

export const LANG_CODES: Record<string, string> = {
  'English': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'German': 'de',
  'Italian': 'it',
  'Japanese': 'ja',
  'Portuguese': 'pt',
  'Chinese': 'zh',
};

export const LANG_NAMES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'ja': 'Japanese',
  'pt': 'Portuguese',
  'zh': 'Chinese',
};

function buildLibrary(lang: string, sentences: Sentence[], total: number, byLevel: Record<string, number>, byTopic: Record<string, number>): SentenceLibrary {
  return { language: lang as any, sentences, total_count: total, by_level: byLevel, by_topic: byTopic };
}

export const EN_LIBRARY = buildLibrary('en', EN_SENTENCES_CAST, EN_COUNT, {}, {});
export const ES_LIBRARY = buildLibrary('es', ES_SENTENCES_CAST, ES_COUNT, {}, {});
export const FR_LIBRARY = buildLibrary('fr', FR_SENTENCES_CAST, FR_COUNT, {}, {});
export const DE_LIBRARY = buildLibrary('de', DE_SENTENCES_CAST, DE_COUNT, {}, {});
export const IT_LIBRARY = buildLibrary('it', IT_SENTENCES_CAST, IT_COUNT, {}, {});
export const JA_LIBRARY = buildLibrary('ja', JA_SENTENCES_CAST, JA_COUNT, {}, {});
export const PT_LIBRARY = buildLibrary('pt', PT_SENTENCES_CAST, PT_COUNT, {}, {});
export const ZH_LIBRARY = buildLibrary('zh', ZH_SENTENCES_CAST, ZH_COUNT, {}, {});

export function getSentenceLibrary(lang: string): SentenceLibrary {
  const code = LANG_CODES[lang] || 'en';
  if (code === 'en') return EN_LIBRARY;
  if (code === 'es') return ES_LIBRARY;
  if (code === 'fr') return FR_LIBRARY;
  if (code === 'de') return DE_LIBRARY;
  if (code === 'it') return IT_LIBRARY;
  if (code === 'ja') return JA_LIBRARY;
  if (code === 'pt') return PT_LIBRARY;
  if (code === 'zh') return ZH_LIBRARY;
  return EN_LIBRARY;
}

export function pickDailySentence(library: SentenceLibrary, level: string, srsState?: Map<string, any>): Sentence | null {
  const due = srsState ? getDueSentences(srsState, library) : [];
  if (due.length > 0) return due[Math.floor(Math.random() * due.length)];
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
