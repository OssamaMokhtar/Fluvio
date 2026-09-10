// Type definitions for Slang Language app
// Re-exports core data types from the library module

import { Sentence, Proverb, CompanionMessage, CompanionSession } from './data/library';

export type { Sentence, Proverb, CompanionMessage, CompanionSession };

export interface PhonemeError {
  phoneme: string;
  expected_word: string;
  start_ts: number;
  end_ts: number;
  detected: string;
  confidence: number;
}

export interface ProsodyDeviation {
  type: string;
  word: string;
  measure: number;
}

export interface AnalysisDrill {
  type: string;
  items: string[] | string;
  reps: number;
}

export interface PitchPoint {
  time: number;
  user_pitch: number;
  native_pitch: number;
}

export interface PronunciationTip {
  segment: string;
  tip: string;
}

export interface AnalysisResponse {
  summary: string;
  overall_score: number;
  pronunciation_score: number;
  intelligibility_score: number;
  prioritized_actions: string[];
  model_phrase: {
    text: string;
    tempo_percent: string;
    ipa_hint: string;
  };
  drills: AnalysisDrill[];
  explanation_notes: string[];
  phoneme_errors: PhonemeError[];
  prosody_deviations: ProsodyDeviation[];
  pitch_contour?: PitchPoint[];
  pronunciation_guide?: PronunciationTip[];
  confidence: number;
}

export enum AppState {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export interface UserProfile {
  level: 'beginner' | 'intermediate' | 'advanced';
  native_language: string;
  target_language: string;
  accent_reduction_goal?: string;
  motivation?: 'travel' | 'career' | 'education' | 'family' | 'social';
  daily_goal_minutes?: number;
}

export interface SessionRecord {
  id: string;
  timestamp: number;
  overall_score: number;
  pronunciation_score: number;
  intelligibility_score: number;
  phoneme_errors: PhonemeError[];
  target_phoneme?: string | null;
  full_analysis: AnalysisResponse;
  audioBlob?: Blob;
}

export interface ArticulationGuide {
  tongue_height: 'high' | 'mid' | 'low';
  tongue_backness: 'front' | 'central' | 'back';
  lip_shape: 'rounded' | 'unrounded' | 'neutral';
  airflow: 'stop' | 'fricative' | 'nasal' | 'liquid' | 'glide';
  description: string;
}
