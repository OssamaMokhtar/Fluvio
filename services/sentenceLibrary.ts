/**
 * Unified sentence and word library with dynamic loading.
 *
 * Usage:
 *   import { getSentenceLibrary, pickDailySentence } from './sentenceLibrary';
 *   const lib = await getSentenceLibrary('en');
 *   const sentence = pickDailySentence(lib, 'intermediate');
 *
 *   import { getWordLibrary, searchWords } from './sentenceLibrary';
 *   const wordLib = await getWordLibrary('en');
 *   const words = searchWords(wordLib, 'hello');
 */

import { Sentence, SentenceLibrary, Word, WordLibrary } from '../data/library';
import { getDueSentences } from './srsService';

// Caches for loaded data
const sentenceCache: Record<string, Sentence[]> = {};
const wordCache: Record<string, Word[]> = {};
const countCache: Record<string, number> = {};
const libraryCache: Record<string, SentenceLibrary> = {};
const wordLibraryCache: Record<string, WordLibrary> = {};

const LANG_CODES: Record<string, string> = {
  'English': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'German': 'de',
  'Italian': 'it',
  'Japanese': 'ja',
  'Portuguese': 'pt',
  'Chinese': 'zh',
  'Arabic': 'ar',
  'Russian': 'ru',
  'Turkish': 'tr',
  'Korean': 'ko',
  'Hindi': 'hi',
};

const LANG_NAMES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'ja': 'Japanese',
  'pt': 'Portuguese',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'ru': 'Russian',
  'tr': 'Turkish',
  'ko': 'Korean',
  'hi': 'Hindi',
};

async function loadSentences(lang: string): Promise<Sentence[]> {
  if (sentenceCache[lang]) return sentenceCache[lang];
  try {
    const m = await import(`../data/sentences/${lang}_sentences.ts`);
    const data = m[`${lang.toUpperCase()}_SENTENCES`] as Sentence[];
    sentenceCache[lang] = data;
    countCache[lang] = m[`${lang.toUpperCase()}_SENTENCE_COUNT`] as number;
    return data;
  } catch {
    sentenceCache[lang] = [];
    countCache[lang] = 0;
    return [];
  }
}

async function loadWords(lang: string): Promise<Word[]> {
  if (wordCache[lang]) return wordCache[lang];
  try {
    const m = await import(`../data/sentences/${lang}_words.ts`);
    const data = m[`${lang.toUpperCase()}_WORDS`] as Word[];
    wordCache[lang] = data;
    return data;
  } catch {
    wordCache[lang] = [];
    return [];
  }
}

function buildLibrary(lang: string, sentences: Sentence[]): SentenceLibrary {
  const byLevel: Record<string, number> = {};
  const byTopic: Record<string, number> = {};
  for (const s of sentences) {
    byLevel[s.cefr_level] = (byLevel[s.cefr_level] || 0) + 1;
    byTopic[s.topic] = (byTopic[s.topic] || 0) + 1;
  }
  return {
    language: lang as any,
    sentences,
    total_count: sentences.length,
    by_level: byLevel,
    by_topic: byTopic,
  };
}

function buildWordLibrary(lang: string, words: Word[]): WordLibrary {
  const byLevel: Record<string, number> = {};
  const byPos: Record<string, number> = {};
  for (const w of words) {
    byLevel[w.cefr_level] = (byLevel[w.cefr_level] || 0) + 1;
    byPos[w.part_of_speech] = (byPos[w.part_of_speech] || 0) + 1;
  }
  return {
    language: lang as any,
    words,
    total_count: words.length,
    by_level: byLevel,
    by_pos: byPos,
  };
}

export async function getSentenceLibrary(lang: string): Promise<SentenceLibrary> {
  const code = LANG_CODES[lang] || 'en';
  if (libraryCache[code]) return libraryCache[code];
  const sentences = await loadSentences(code);
  const lib = buildLibrary(code, sentences);
  libraryCache[code] = lib;
  return lib;
}

export async function getWordLibrary(lang: string): Promise<WordLibrary> {
  const code = LANG_CODES[lang] || 'en';
  if (wordLibraryCache[code]) return wordLibraryCache[code];
  const words = await loadWords(code);
  const lib = buildWordLibrary(code, words);
  wordLibraryCache[code] = lib;
  return lib;
}

export async function pickDailySentence(
  library: SentenceLibrary,
  level: string,
  srsState?: Map<string, any>
): Promise<Sentence | null> {
  const sentences = library.sentences;
  const due = srsState ? getDueSentences(srsState, library) : [];
  if (due.length > 0) return due[Math.floor(Math.random() * due.length)];
  const levelMap: Record<string, string> = {
    'beginner': 'A1',
    'elementary': 'A2',
    'intermediate': 'B1',
    'upper-intermediate': 'B2',
    'advanced': 'C1',
    'mastery': 'C2',
  };
  const cefr = levelMap[level.toLowerCase()] || 'B1';
  const candidates = sentences.filter(s => s.cefr_level === cefr);
  if (candidates.length === 0) return sentences[Math.floor(Math.random() * sentences.length)] || null;
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

export function searchWords(library: WordLibrary, query: string): Word[] {
  const q = query.toLowerCase().trim();
  return library.words.filter(w =>
    w.word.toLowerCase().includes(q) ||
    w.translation.toLowerCase().includes(q) ||
    w.tags.some(t => t.toLowerCase().includes(q))
  ).slice(0, 50);
}

export function getWordsByLevel(library: WordLibrary, cefr: string): Word[] {
  return library.words.filter(w => w.cefr_level === cefr);
}

export function getWordsByPOS(library: WordLibrary, pos: string): Word[] {
  return library.words.filter(w => w.part_of_speech === pos);
}

export { LANG_CODES, LANG_NAMES };
