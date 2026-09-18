export interface Sentence {
  id: string;
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'pt' | 'zh' | 'ar' | 'ru' | 'tr' | 'ko' | 'hi';
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  topic: string;
  text: string;
  translation: string;
  ipa_hint?: string;
  tags: string[];
  native_audio_available: boolean;
}

export interface Word {
  id: string;
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'pt' | 'zh' | 'ar' | 'ru' | 'tr' | 'ko' | 'hi';
  word: string;
  translation: string;
  part_of_speech: string;
  example_sentence: string;
  example_translation: string;
  phonetic: string;
  frequency_rank: number;
  cefr_level?: string;
  tags: string[];
}

export interface Proverb {
  id: string;
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'pt' | 'zh' | 'ar' | 'ru' | 'tr' | 'ko' | 'hi';
  text: string;
  literal_translation: string;
  meaning: string;
  usage_note: string;
  tags: string[];
  common_variant?: string;
  category: string;
}

export interface WordLibrary {
  language: string;
  words: Word[];
  total_count: number;
  by_level: Record<string, number>;
  by_pos: Record<string, number>;
}

export interface ProverbLibrary {
  language: string;
  proverbs: Proverb[];
  total_count: number;
  by_category: Record<string, number>;
}

export interface CompanionMessage {
  id: string;
  role: 'user' | 'companion' | 'ai';
  text: string;
  translation?: string;
  corrected_text?: string;
  correction_note?: string;
  scores?: { pronunciation: number; grammar: number; vocabulary: number; fluency: number; appropriateness: number; overall: number };
  feedback?: string;
  tts_audio?: string;
  timestamp: number;
}

export interface CompanionSession {
  id: string;
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'pt' | 'zh' | 'ar' | 'ru' | 'tr' | 'ko' | 'hi';
  level: string;
  messages: CompanionMessage[];
  started_at: number;
  last_active: number;
}

export interface SentenceLibrary {
  language: string;
  sentences: Sentence[];
  total_count: number;
  by_level: Record<string, number>;
  by_topic: Record<string, number>;
}

export type LibraryType = SentenceLibrary | WordLibrary | ProverbLibrary;

export interface ProverbLibrary {
  language: string;
  proverbs: Proverb[];
  total_count: number;
}
