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
  /**
   * SL-08: removed. IELTS equivalence was asserted for an uncalibrated 0-100
   * score with no validation study, no reference cohort and no inter-rater
   * agreement. Restore only when a published calibration supports it —
   * see docs/adr/0002-assessment-calibration.md.
   */
  // ieltsEquivalent?: string;
  minScore: number;
  maxScore: number;
}

export const CEFR_BANDS: CEFRLevel[] = [
  { band: 'A1', label: 'Beginner', description: 'Can understand and use familiar everyday expressions.', minScore: 0, maxScore: 20 },
  { band: 'A2', label: 'Elementary', description: 'Can communicate in simple routine tasks.', minScore: 21, maxScore: 40 },
  { band: 'B1', label: 'Intermediate', description: 'Can deal with most situations while travelling and produce simple connected text.', minScore: 41, maxScore: 60 },
  { band: 'B2', label: 'Upper Intermediate', description: 'Can interact with fluency and spontaneity. Can produce clear detailed text.', minScore: 61, maxScore: 80 },
  { band: 'C1', label: 'Advanced', description: 'Can express ideas fluently and spontaneously without obvious searching.', minScore: 81, maxScore: 95 },
  { band: 'C2', label: 'Mastery', description: 'Can express themselves spontaneously, very fluently and precisely.', minScore: 96, maxScore: 100 },
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
export interface DimensionScores {
  /** Value, or null when the pipeline cannot measure this dimension yet. */
  [dimension: string]: number | null;
}

/**
 * Per-dimension scores from an AnalysisResponse.
 *
 * SL-08: the previous implementation derived a *grammar score* by counting how
 * often the substring "grammar" appeared in the model's free-text notes
 * (90 - mentions * 10), a vocabulary score the same way, and an intonation score
 * from the length of a randomly generated prosody array. Rephrasing the feedback
 * changed the learner's scores without them changing how they spoke.
 *
 * Only dimensions the pipeline genuinely produces are returned as numbers.
 * Everything else is null, and the UI must render null as "not yet measured" —
 * never as zero, and never as a plotted point.
 */
export function computeDimensionScores(analysis: AnalysisResponse): DimensionScores {
  const pronunciation = numOrNull(analysis.pronunciation_score ?? analysis.overall_score);
  const intelligibility = numOrNull(analysis.intelligibility_score ?? analysis.overall_score);

  return {
    // Produced by the analysis model.
    pronunciation,
    intelligibility,
    // Not measured by the current pipeline. Grammar and vocabulary need a text
    // assessor; intonation and fluency need acoustic analysis (F0, timing).
    grammar: null,
    vocabulary: null,
    fluency: null,
    intonation: null,
  };
}

function numOrNull(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(Math.min(100, Math.max(0, n))) : null;
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

  // SL-08: this used a hardcoded `perSessionGain = 2` presented to the learner as
  // a projection. The gain is now measured from their own history — the slope of
  // the last ten sessions — and the projection is withheld entirely when there is
  // not enough data, or when the learner is not currently improving.
  const MIN_SESSIONS_FOR_TREND = 6;
  if (historyScores.length < MIN_SESSIONS_FOR_TREND) {
    return { sessions: null, nextBand: nextBand.band, targetScore };
  }
  const recent = historyScores.slice(-10);
  const perSessionGain = linearSlope(recent);
  if (perSessionGain <= 0.1) {
    return { sessions: null, nextBand: nextBand.band, targetScore };
  }
  const sessions = Math.ceil(gap / perSessionGain);

  return { sessions, nextBand: nextBand.band, targetScore };
}


/** Least-squares slope of a score series, in points per session. */
function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}
