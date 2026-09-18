/**
 * Client-side API layer for sentence/word library data.
 *
 * Replaces direct data imports from sentenceLibrary.ts with fetch calls to
 * the server API. This keeps the ~90MB corpus out of the Vite client bundle.
 */

export interface Sentence {
  id: string;
  language: string;
  cefr_level: string;
  topic: string;
  text: string;
  translation: string;
  phonetic?: string;
  tags: string[];
  total_count?: number;
}

export interface Word {
  id: string;
  language: string;
  word: string;
  translation: string;
  part_of_speech: string;
  example_sentence: string;
  example_translation: string;
  phonetic: string;
  frequency_rank: number;
  tags: string[];
  cefr_level: string;
  total_count?: number;
}

export interface SentenceLibrary {
  sentences: Sentence[];
  total_count: number;
  languages: string[];
  by_level?: Record<string, number>;
  by_topic?: Record<string, number>;
}

export interface WordLibrary {
  words: Word[];
  total_count: number;
  languages: string[];
  by_level?: Record<string, number>;
  by_pos?: Record<string, number>;
}

const API_BASE = '/api';

/**
 * Get sentence library for a language (fetches from server).
 */
export async function getSentenceLibrary(lang: string): Promise<SentenceLibrary> {
  const res = await fetch(`${API_BASE}/sentence-library?lang=${encodeURIComponent(lang)}`);
  if (!res.ok) throw new Error(`Failed to load sentence library: ${res.status}`);
  const data = await res.json();
  // Compute by_level and by_topic from sentences if not provided by server
  if (!data.by_level && data.sentences) {
    data.by_level = {};
    for (const s of data.sentences) {
      if (s.cefr_level) {
        data.by_level[s.cefr_level] = (data.by_level[s.cefr_level] || 0) + 1;
      }
    }
  }
  if (!data.by_topic && data.sentences) {
    data.by_topic = {};
    for (const s of data.sentences) {
      if (s.topic) {
        data.by_topic[s.topic] = (data.by_topic[s.topic] || 0) + 1;
      }
    }
  }
  return data;
}

/**
 * Get word library for a language (fetches from server).
 */
export async function getWordLibrary(lang: string): Promise<WordLibrary> {
  const res = await fetch(`${API_BASE}/word-library?lang=${encodeURIComponent(lang)}`);
  if (!res.ok) throw new Error(`Failed to load word library: ${res.status}`);
  const data = await res.json();
  // Compute by_level and by_pos from words if not provided by server
  if (!data.by_level && data.words) {
    data.by_level = {};
    for (const w of data.words) {
      if (w.cefr_level) {
        data.by_level[w.cefr_level] = (data.by_level[w.cefr_level] || 0) + 1;
      }
    }
  }
  if (!data.by_pos && data.words) {
    data.by_pos = {};
    for (const w of data.words) {
      if (w.part_of_speech) {
        data.by_pos[w.part_of_speech] = (data.by_pos[w.part_of_speech] || 0) + 1;
      }
    }
  }
  return data;
}

/**
 * Pick a daily sentence from the library.
 * Optional srsState for due-sentence prioritization (if provided server-side).
 */
export function pickDailySentence(
  library: SentenceLibrary,
  level: string,
  srsState?: Map<string, any>
): Sentence | null {
  // If srsState provided, filter to due sentences
  if (srsState && srsState.size > 0) {
    const dueIds = Array.from(srsState.keys());
    const due = library.sentences.filter(s => dueIds.includes(s.id));
    if (due.length > 0) {
      return due[Math.floor(Math.random() * due.length)];
    }
  }

  const due = library.sentences.filter(s => s.cefr_level === level);
  if (due.length > 0) {
    return due[Math.floor(Math.random() * due.length)];
  }
  const candidates = library.sentences;
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Search words by text.
 */
export function searchWords(library: WordLibrary, query: string): Word[] {
  const q = query.toLowerCase();
  return library.words.filter(w =>
    w.word.toLowerCase().includes(q) ||
    w.translation.toLowerCase().includes(q)
  ).slice(0, 20);
}

/**
 * Language display names.
 */
export const LANG_NAMES: Record<string, string> = {
  English: 'English',
  Spanish: 'Español',
  French: 'Français',
  German: 'Deutsch',
  Italian: 'Italiano',
  Japanese: '日本語',
  Portuguese: 'Português',
  Chinese: '中文',
  Arabic: 'العربية',
  Russian: 'Русский',
  Turkish: 'Türkçe',
  Korean: '한국어',
  Hindi: 'हिंदी',
};

/**
 * Language code lookup (name → code).
 */
export const LANG_CODES: Record<string, string> = {
  English: 'en',
  Spanish: 'es',
  French: 'fr',
  German: 'de',
  Italian: 'it',
  Japanese: 'ja',
  Portuguese: 'pt',
  Chinese: 'zh',
  Arabic: 'ar',
  Russian: 'ru',
  Turkish: 'tr',
  Korean: 'ko',
  Hindi: 'hi',
};
