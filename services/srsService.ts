/**
 * Spaced Repetition Scheduler (SRS) for sentence review.
 *
 * Uses a simplified FSRS-style algorithm to schedule sentence reviews.
 * State is kept in-memory and persisted to localStorage.
 */

import { Sentence } from '../data/library';

export interface SRSRecord {
  sentenceId: string;
  nextReview: number;       // timestamp (ms) when this sentence is due
  interval: number;         // days until next review
  easeFactor: number;       // > 1.3; increases with successful reviews
  repetitions: number;      // how many times reviewed successfully
  lastReviewed: number;     // timestamp of last review
  lastScore: number;        // 0–100 score from last review
}

const STORAGE_KEY = 'slang_srs_state';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * SL-18: this was `const NOW = Date.now()` at module scope, captured once at
 * import and used as the default "now" for every due-date check. In a long
 * single-page session — or a warm serverless container — nothing newly due ever
 * became due. Each call now reads the clock.
 */
const now = () => Date.now();

const DEFAULT_EASE = 2.5;
const MIN_EASE = 1.3;

/**
 * Load SRS state from localStorage.
 */
export function loadSRSState(): Map<string, SRSRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const arr = JSON.parse(raw) as SRSRecord[];
    const map = new Map<string, SRSRecord>();
    for (const r of arr) map.set(r.sentenceId, r);
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Persist SRS state to localStorage.
 */
export function saveSRSState(state: Map<string, SRSRecord>): void {
  try {
    const arr = Array.from(state.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn('Failed to persist SRS state:', e);
  }
}

/**
 * Get the SRS record for a sentence, or undefined if never reviewed.
 */
export function getSRSRecord(state: Map<string, SRSRecord>, sentenceId: string): SRSRecord | undefined {
  return state.get(sentenceId);
}

/**
 * Check if a sentence is due for review (now >= nextReview).
 */
export function isDue(record: SRSRecord, at: number = now()): boolean {
  return at >= record.nextReview;
}

/**
 * Get all sentences that are due for review.
 */
export function getDueSentences(
  state: Map<string, SRSRecord>,
  library: { sentences: Sentence[] },
  at: number = now(),
): Sentence[] {
  const dueIds = new Set<string>();
  for (const record of state.values()) {
    if (isDue(record, at)) dueIds.add(record.sentenceId);
  }
  return library.sentences.filter(s => dueIds.has(s.id)).slice(0, 20);
}

/**
 * Calculate the next review interval using a simplified FSRS-style formula.
 *
 * quality: 0–5 (mapped from score 0–100)
 *   5 = perfect (90–100), 4 = good (70–89), 3 = adequate (50–69),
 *   2 = difficult (30–49), 1 = very difficult (10–29), 0 = forgot (<10)
 */
export function calculateNextInterval(
  previousInterval: number,  // days
  easeFactor: number,
  quality: number,           // 0–5
): { interval: number; easeFactor: number } {
  // If quality < 3, reset to initial interval (forgot)
  if (quality < 3) {
    return { interval: 1, easeFactor: Math.max(MIN_EASE, easeFactor - 0.2) };
  }

  // FSRS-inspired: interval = previousInterval * easeFactor
  const newInterval = Math.max(1, Math.round(previousInterval * easeFactor));

  // Cap at 60 days (2 months) — beyond that, review less frequently
  const cappedInterval = Math.min(newInterval, 60);

  // Ease factor increases slightly with good reviews
  const newEase = Math.min(3.0, easeFactor + 0.05);

  return { interval: cappedInterval, easeFactor: newEase };
}

/**
 * Record a review for a sentence and update its SRS state.
 */
export function recordReview(
  state: Map<string, SRSRecord>,
  sentence: Sentence,
  score: number,  // 0–100
): SRSRecord {
  const existing = state.get(sentence.id);
  const quality = scoreToQuality(score);

  let nextInterval: number;
  let nextEase: number;
  let repetitions: number;

  if (existing) {
    const result = calculateNextInterval(existing.interval, existing.easeFactor, quality);
    nextInterval = result.interval;
    nextEase = result.easeFactor;
    repetitions = quality >= 3 ? existing.repetitions + 1 : existing.repetitions;
  } else {
    // First review: if good, start at 1 day; if poor, review again tomorrow
    nextInterval = quality >= 3 ? 1 : 1;
    nextEase = DEFAULT_EASE;
    repetitions = quality >= 3 ? 1 : 0;
  }

  const nextReview = now() + nextInterval * MS_PER_DAY;

  const record: SRSRecord = {
    sentenceId: sentence.id,
    nextReview,
    interval: nextInterval,
    easeFactor: nextEase,
    repetitions,
    lastReviewed: now(),
    lastScore: score,
  };

  state.set(sentence.id, record);
  saveSRSState(state);

  return record;
}

/**
 * Map a 0–100 score to a 0–5 quality rating for SRS.
 */
function scoreToQuality(score: number): number {
  if (score >= 90) return 5;
  if (score >= 70) return 4;
  if (score >= 50) return 3;
  if (score >= 30) return 2;
  if (score >= 10) return 1;
  return 0;
}

/**
 * Get the count of sentences due for review (for badge display).
 */
export function getDueCount(state: Map<string, SRSRecord>, at: number = now()): number {
  let count = 0;
  for (const record of state.values()) {
    if (isDue(record, at)) count++;
  }
  return count;
}

/**
 * Soft reset: clear SRS state for a specific sentence (e.g., user wants to restart).
 */
export function resetSentence(state: Map<string, SRSRecord>, sentenceId: string): void {
  state.delete(sentenceId);
  saveSRSState(state);
}

/**
 * Full reset: clear all SRS state.
 */
export function resetAll(state: Map<string, SRSRecord>): void {
  state.clear();
  saveSRSState(state);
}
