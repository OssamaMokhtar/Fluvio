export interface Sentence {
  id: string;
  language: 'en' | 'es' | 'fr';
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  topic: string;
  text: string;
  translation: string;
  ipa_hint?: string;         // optional IPA for tricky sounds
  tags: string[];            // e.g. ['greeting', 'question', 'polite']
  native_audio_available: boolean;
}

export interface Proverb {
  id: string;
  language: 'en' | 'es' | 'fr';
  text: string;
  literal_translation: string;
  meaning: string;
  usage_note: string;
  tags: string[];            // e.g. ['wisdom', 'daily-life', 'humor']
  common_variant?: string;
}

export interface CompanionMessage {
  id: string;
  role: 'user' | 'companion';
  text: string;
  translation?: string;       // English translation (when companion responds in target language)
  corrected_text?: string;   // if companion corrected the user
  correction_note?: string;  // explanation of correction
  timestamp: number;
}

export interface CompanionSession {
  id: string;
  language: 'en' | 'es' | 'fr';
  level: 'beginner' | 'intermediate' | 'advanced';
  messages: CompanionMessage[];
  started_at: number;
  last_active: number;
}

export interface SentenceLibrary {
  language: 'en' | 'es' | 'fr';
  sentences: Sentence[];
  total_count: number;
  by_level: Record<string, number>;
  by_topic: Record<string, number>;
}

export interface ProverbLibrary {
  language: 'en' | 'es' | 'fr';
  proverbs: Proverb[];
  total_count: number;
}

export interface ProverbLibrary {
  language: 'en' | 'es' | 'fr';
  proverbs: Proverb[];
  total_count: number;
}
