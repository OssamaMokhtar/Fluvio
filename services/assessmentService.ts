/**
 * CEFR proficiency assessment service.
 *
 * Maps analysis scores to CEFR bands (A1–C2) with IELTS equivalents.
 * Computes per-dimension scores from an AnalysisResponse.
 */

import { AnalysisResponse } from '../types';

export type CEFRBand = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface CEFRLevel {
  band: CEFRBand;
  label: string;
  description: string;
  ieltsEquivalent?: string;
  minScore: number;
  maxScore: number;
}

export const CEFR_BANDS: CEFRLevel[] = [
  { band: 'A1', label: 'Beginner', description: 'Can understand and use familiar everyday expressions.', ieltsEquivalent: 'Below 3.0', minScore: 0, maxScore: 20 },
  { band: 'A2', label: 'Elementary', description: 'Can communicate in simple routine tasks.', ieltsEquivalent: '3.0–3.5', minScore: 21, maxScore: 40 },
  { band: 'B1', label: 'Intermediate', description: 'Can deal with most situations while travelling and produce simple connected text.', ieltsEquivalent: '4.0–5.0', minScore: 41, maxScore: 60 },
  { band: 'B2', label: 'Upper Intermediate', description: 'Can interact with fluency and spontaneity. Can produce clear detailed text.', ieltsEquivalent: '5.5–6.5', minScore: 61, maxScore: 80 },
  { band: 'C1', label: 'Advanced', description: 'Can express ideas fluently and spontaneously without obvious searching.', ieltsEquivalent: '7.0–8.0', minScore: 81, maxScore: 95 },
  { band: 'C2', label: 'Mastery', description: 'Can express themselves spontaneously, very fluently and precisely.', ieltsEquivalent: '8.5–9.0', minScore: 96, maxScore: 100 },
];

/**
 * Determine CEFR band from an overall score (0–100).
 */
export function computeCEFRLevel(overallScore: number): CEFRLevel {
  for (const level of CEFR_BANDS) {
    if (overallScore >= level.minScore && overallScore <= level.maxScore) {
      return level;
    }
  }
  // Clamp: below A1 → A1, above C2 → C2
  if (overallScore < CEFR_BANDS[0].minScore) return CEFR_BANDS[0];
  return CEFR_BANDS[CEFR_BANDS.length - 1];
}

/**
 * Compute per-dimension scores from an AnalysisResponse.
 *
 * Dimensions:
 * - pronunciation: based on pronunciation_score and phoneme_errors count
 * - fluency: based on intelligibility_score and prosody_deviations
 * - grammar: inferred from explanation_notes mentioning grammar
 * - vocabulary: inferred from explanation_notes mentioning vocabulary/word choice
 * - intonation: based on prosody_deviations and pitch_contour presence
 */
export function computeDimensionScores(analysis: AnalysisResponse): Record<string, number> {
  const pronunciationScore = analysis.pronunciation_score ?? analysis.overall_score;

  // Fluency: intelligibility is a proxy; penalize if many prosody deviations
  let fluencyScore = analysis.intelligibility_score ?? analysis.overall_score;
  if (analysis.prosody_deviations && analysis.prosody_deviations.length > 3) {
    fluencyScore = Math.max(0, fluencyScore - (analysis.prosody_deviations.length - 3) * 5);
  }

  // Grammar: scan explanation_notes for grammar mentions
  let grammarScore = pronunciationScore; // default to pronunciation as baseline
  const notesText = (analysis.explanation_notes || []).join(' ').toLowerCase();
  const grammarMentions = (notesText.match(/grammar/gi) || []).length;
  const errorCount = (analysis.phoneme_errors || []).length;
  if (grammarMentions > 0) {
    grammarScore = Math.max(0, 90 - grammarMentions * 10);
  } else if (errorCount > 5) {
    grammarScore = Math.max(0, 70 - (errorCount - 5) * 2);
  }

  // Vocabulary: scan for vocabulary/word choice mentions
  let vocabularyScore = pronunciationScore;
  const vocabMentions = (notesText.match(/vocabulary|word choice|lexical|wording/gi) || []).length;
  if (vocabMentions > 0) {
    vocabularyScore = Math.max(0, 85 - vocabMentions * 8);
  }

  // Intonation: based on prosody deviations and pitch contour
  let intonationScore = 85; // default good
  if (analysis.prosody_deviations && analysis.prosody_deviations.length > 0) {
    intonationScore = Math.max(0, 90 - analysis.prosody_deviations.length * 8);
  }
  if (!analysis.pitch_contour || analysis.pitch_contour.length === 0) {
    intonationScore = Math.min(intonationScore, 60); // no pitch data = uncertain
  }

  return {
    pronunciation: Math.round(Math.min(100, pronunciationScore)),
    fluency: Math.round(Math.min(100, fluencyScore)),
    grammar: Math.round(Math.min(100, grammarScore)),
    vocabulary: Math.round(Math.min(100, vocabularyScore)),
    intonation: Math.round(Math.min(100, intonationScore)),
  };
}

/**
 * Estimate how many more sessions at the current average score
 * to reach the next CEFR band.
 */
export function sessionsToNextLevel(
  historyScores: number[],
  currentCEFR: CEFRLevel,
): { sessions: number | null; nextBand: CEFRBand | null; targetScore: number } {
  const nextIndex = CEFR_BANDS.findIndex(b => b.band === currentCEFR.band) + 1;
  if (nextIndex >= CEFR_BANDS.length) {
    return { sessions: null, nextBand: null, targetScore: 100 };
  }

  const nextBand = CEFR_BANDS[nextIndex];
  const targetScore = nextBand.minScore;

  if (historyScores.length === 0) return { sessions: null, nextBand: nextBand.band, targetScore };

  const avg = historyScores.reduce((a, b) => a + b, 0) / historyScores.length;
  const gap = targetScore - avg;

  if (gap <= 0) return { sessions: 0, nextBand: nextBand.band, targetScore };

  // Assume ~2 points improvement per session (conservative)
  const perSessionGain = 2;
  const sessions = Math.ceil(gap / perSessionGain);

  return { sessions, nextBand: nextBand.band, targetScore };
}
