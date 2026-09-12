export interface Sentence {
  id: string;
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'pt' | 'zh';
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  topic: string;
  text: string;
  translation: string;
  ipa_hint?: string;
  tags: string[];
  native_audio_available: boolean;
}

export interface Proverb {
  id: string;
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'pt' | 'zh';
  text: string;
  literal_translation: string;
  meaning: string;
  usage_note: string;
  tags: string[];
  common_variant?: string;
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
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'ja' | 'pt' | 'zh';
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

export interface ProverbLibrary {
  language: string;
  proverbs: Proverb[];
  total_count: number;
}
