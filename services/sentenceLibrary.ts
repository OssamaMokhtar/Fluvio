/**
 * Unified sentence and word library.
 *
 * Usage:
 *   import { getSentenceLibrary, pickDailySentence } from './sentenceLibrary';
 *   const lib = getSentenceLibrary('en');
 *   const sentence = pickDailySentence(lib, 'intermediate');
 *
 *   import { getWordLibrary, searchWords } from './sentenceLibrary';
 *   const wordLib = getWordLibrary('en');
 *   const words = searchWords(wordLib, 'hello');
 */

import { Sentence, SentenceLibrary, Word, WordLibrary } from '../data/library';
import { EN_SENTENCES as EN, EN_SENTENCE_COUNT as EN_COUNT } from '../data/sentences/en_sentences';
import { ES_SENTENCES as ES, ES_SENTENCE_COUNT as ES_COUNT } from '../data/sentences/es_sentences';
import { FR_SENTENCES as FR, FR_SENTENCE_COUNT as FR_COUNT } from '../data/sentences/fr_sentences';
import { DE_SENTENCES as DE, DE_SENTENCE_COUNT as DE_COUNT } from '../data/sentences/de_sentences';
import { IT_SENTENCES as IT, IT_SENTENCE_COUNT as IT_COUNT } from '../data/sentences/it_sentences';
import { JA_SENTENCES as JA, JA_SENTENCE_COUNT as JA_COUNT } from '../data/sentences/ja_sentences';
import { PT_SENTENCES as PT, PT_SENTENCE_COUNT as PT_COUNT } from '../data/sentences/pt_sentences';
import { ZH_SENTENCES as ZH, ZH_SENTENCE_COUNT as ZH_COUNT } from '../data/sentences/zh_sentences';
import { AR_SENTENCES as AR, AR_SENTENCE_COUNT as AR_COUNT } from '../data/sentences/ar_sentences';
import { RU_SENTENCES as RU, RU_SENTENCE_COUNT as RU_COUNT } from '../data/sentences/ru_sentences';
import { TR_SENTENCES as TR, TR_SENTENCE_COUNT as TR_COUNT } from '../data/sentences/tr_sentences';
import { KO_SENTENCES as KO, KO_SENTENCE_COUNT as KO_COUNT } from '../data/sentences/ko_sentences';
import { HI_SENTENCES as HI, HI_SENTENCE_COUNT as HI_COUNT } from '../data/sentences/hi_sentences';
import { EN_WORDS as EN_W, EN_WORD_COUNT as EN_W_COUNT } from '../data/sentences/en_words';
import { ES_WORDS as ES_W, ES_WORD_COUNT as ES_W_COUNT } from '../data/sentences/es_words';
import { FR_WORDS as FR_W, FR_WORD_COUNT as FR_W_COUNT } from '../data/sentences/fr_words';
import { DE_WORDS as DE_W, DE_WORD_COUNT as DE_W_COUNT } from '../data/sentences/de_words';
import { IT_WORDS as IT_W, IT_WORD_COUNT as IT_W_COUNT } from '../data/sentences/it_words';
import { JA_WORDS as JA_W, JA_WORD_COUNT as JA_W_COUNT } from '../data/sentences/ja_words';
import { PT_WORDS as PT_W, PT_WORD_COUNT as PT_W_COUNT } from '../data/sentences/pt_words';
import { ZH_WORDS as ZH_W, ZH_WORD_COUNT as ZH_W_COUNT } from '../data/sentences/zh_words';
import { AR_WORDS as AR_W, AR_WORD_COUNT as AR_W_COUNT } from '../data/sentences/ar_words';
import { RU_WORDS as RU_W, RU_WORD_COUNT as RU_W_COUNT } from '../data/sentences/ru_words';
import { TR_WORDS as TR_W, TR_WORD_COUNT as TR_W_COUNT } from '../data/sentences/tr_words';
import { KO_WORDS as KO_W, KO_WORD_COUNT as KO_W_COUNT } from '../data/sentences/ko_words';
import { HI_WORDS as HI_W, HI_WORD_COUNT as HI_W_COUNT } from '../data/sentences/hi_words';
import { getDueSentences } from './srsService';

// TS widens literal array types to "string" for language/enums.
// Cast at import site to restore the Sentence[] / Word[] contract.
const asSentence = <T extends readonly any[]>(items: T): T => items;
const asWord = <T extends readonly any[]>(items: T): T => items;

const EN_SENTENCES_CAST = asSentence(EN) as Sentence[];
const ES_SENTENCES_CAST = asSentence(ES) as Sentence[];
const FR_SENTENCES_CAST = asSentence(FR) as Sentence[];
const DE_SENTENCES_CAST = asSentence(DE) as Sentence[];
const IT_SENTENCES_CAST = asSentence(IT) as Sentence[];
const JA_SENTENCES_CAST = asSentence(JA) as Sentence[];
const PT_SENTENCES_CAST = asSentence(PT) as Sentence[];
const ZH_SENTENCES_CAST = asSentence(ZH) as Sentence[];
const AR_SENTENCES_CAST = asSentence(AR) as Sentence[];
const RU_SENTENCES_CAST = asSentence(RU) as Sentence[];
const TR_SENTENCES_CAST = asSentence(TR) as Sentence[];
const KO_SENTENCES_CAST = asSentence(KO) as Sentence[];
const HI_SENTENCES_CAST = asSentence(HI) as Sentence[];

const EN_WORDS_CAST = asWord(EN_W) as Word[];
const ES_WORDS_CAST = asWord(ES_W) as Word[];
const FR_WORDS_CAST = asWord(FR_W) as Word[];
const DE_WORDS_CAST = asWord(DE_W) as Word[];
const IT_WORDS_CAST = asWord(IT_W) as Word[];
const JA_WORDS_CAST = asWord(JA_W) as Word[];
const PT_WORDS_CAST = asWord(PT_W) as Word[];
const ZH_WORDS_CAST = asWord(ZH_W) as Word[];
const AR_WORDS_CAST = asWord(AR_W) as Word[];
const RU_WORDS_CAST = asWord(RU_W) as Word[];
const TR_WORDS_CAST = asWord(TR_W) as Word[];
const KO_WORDS_CAST = asWord(KO_W) as Word[];
const HI_WORDS_CAST = asWord(HI_W) as Word[];

export const LANG_CODES: Record<string, string> = {
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

export const LANG_NAMES: Record<string, string> = {
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

function buildLibrary(lang: string, sentences: Sentence[], total: number, byLevel: Record<string, number>, byTopic: Record<string, number>): SentenceLibrary {
  return { language: lang as any, sentences, total_count: total, by_level: byLevel, by_topic: byTopic };
}

function buildWordLibrary(lang: string, words: Word[], total: number, byLevel: Record<string, number>, byPos: Record<string, number>): WordLibrary {
  return { language: lang as any, words, total_count: total, by_level: byLevel, by_pos: byPos };
}

export const EN_LIBRARY = buildLibrary('en', EN_SENTENCES_CAST, EN_COUNT, {}, {});
export const ES_LIBRARY = buildLibrary('es', ES_SENTENCES_CAST, ES_COUNT, {}, {});
export const FR_LIBRARY = buildLibrary('fr', FR_SENTENCES_CAST, FR_COUNT, {}, {});
export const DE_LIBRARY = buildLibrary('de', DE_SENTENCES_CAST, DE_COUNT, {}, {});
export const IT_LIBRARY = buildLibrary('it', IT_SENTENCES_CAST, IT_COUNT, {}, {});
export const JA_LIBRARY = buildLibrary('ja', JA_SENTENCES_CAST, JA_COUNT, {}, {});
export const PT_LIBRARY = buildLibrary('pt', PT_SENTENCES_CAST, PT_COUNT, {}, {});
export const ZH_LIBRARY = buildLibrary('zh', ZH_SENTENCES_CAST, ZH_COUNT, {}, {});
export const AR_LIBRARY = buildLibrary('ar', AR_SENTENCES_CAST, AR_COUNT, {}, {});
export const RU_LIBRARY = buildLibrary('ru', RU_SENTENCES_CAST, RU_COUNT, {}, {});
export const TR_LIBRARY = buildLibrary('tr', TR_SENTENCES_CAST, TR_COUNT, {}, {});
export const KO_LIBRARY = buildLibrary('ko', KO_SENTENCES_CAST, KO_COUNT, {}, {});
export const HI_LIBRARY = buildLibrary('hi', HI_SENTENCES_CAST, HI_COUNT, {}, {});

export const EN_WORD_LIBRARY = buildWordLibrary('en', EN_WORDS_CAST, EN_W_COUNT, {}, {});
export const ES_WORD_LIBRARY = buildWordLibrary('es', ES_WORDS_CAST, ES_W_COUNT, {}, {});
export const FR_WORD_LIBRARY = buildWordLibrary('fr', FR_WORDS_CAST, FR_W_COUNT, {}, {});
export const DE_WORD_LIBRARY = buildWordLibrary('de', DE_WORDS_CAST, DE_W_COUNT, {}, {});
export const IT_WORD_LIBRARY = buildWordLibrary('it', IT_WORDS_CAST, IT_W_COUNT, {}, {});
export const JA_WORD_LIBRARY = buildWordLibrary('ja', JA_WORDS_CAST, JA_W_COUNT, {}, {});
export const PT_WORD_LIBRARY = buildWordLibrary('pt', PT_WORDS_CAST, PT_W_COUNT, {}, {});
export const ZH_WORD_LIBRARY = buildWordLibrary('zh', ZH_WORDS_CAST, ZH_W_COUNT, {}, {});
export const AR_WORD_LIBRARY = buildWordLibrary('ar', AR_WORDS_CAST, AR_W_COUNT, {}, {});
export const RU_WORD_LIBRARY = buildWordLibrary('ru', RU_WORDS_CAST, RU_W_COUNT, {}, {});
export const TR_WORD_LIBRARY = buildWordLibrary('tr', TR_WORDS_CAST, TR_W_COUNT, {}, {});
export const KO_WORD_LIBRARY = buildWordLibrary('ko', KO_WORDS_CAST, KO_W_COUNT, {}, {});
export const HI_WORD_LIBRARY = buildWordLibrary('hi', HI_WORDS_CAST, HI_W_COUNT, {}, {});

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
  if (code === 'ar') return AR_LIBRARY;
  if (code === 'ru') return RU_LIBRARY;
  if (code === 'tr') return TR_LIBRARY;
  if (code === 'ko') return KO_LIBRARY;
  if (code === 'hi') return HI_LIBRARY;
  return EN_LIBRARY;
}

export function getWordLibrary(lang: string): WordLibrary {
  const code = LANG_CODES[lang] || 'en';
  if (code === 'en') return EN_WORD_LIBRARY;
  if (code === 'es') return ES_WORD_LIBRARY;
  if (code === 'fr') return FR_WORD_LIBRARY;
  if (code === 'de') return DE_WORD_LIBRARY;
  if (code === 'it') return IT_WORD_LIBRARY;
  if (code === 'ja') return JA_WORD_LIBRARY;
  if (code === 'pt') return PT_WORD_LIBRARY;
  if (code === 'zh') return ZH_WORD_LIBRARY;
  if (code === 'ar') return AR_WORD_LIBRARY;
  if (code === 'ru') return RU_WORD_LIBRARY;
  if (code === 'tr') return TR_WORD_LIBRARY;
  if (code === 'ko') return KO_WORD_LIBRARY;
  if (code === 'hi') return HI_WORD_LIBRARY;
  return EN_WORD_LIBRARY;
}

export function pickDailySentence(library: SentenceLibrary, level: string, srsState?: Map<string, any>): Sentence | null {
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
