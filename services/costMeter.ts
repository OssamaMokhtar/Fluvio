// services/costMeter.ts — per-utterance AI cost telemetry.
//
// Why (23 Sep 2026 audit): Fluvio is the only deployed project with real,
// per-request inference cost (Whisper + GPT-4o + TTS), and that cost was never
// measured. "Cost per scored utterance" is the unit-economics number the
// business case needs, so every billable call now records an estimate.
//
// Prices are list prices in USD and change. They are env-overridable and dated
// so a stale number is visible, not silent.
export const PRICES_AS_OF = "2026-09";
export const PRICES = {
  gpt4oInputPer1M: Number(process.env.PRICE_GPT4O_INPUT_PER_1M) || 2.5,
  gpt4oOutputPer1M: Number(process.env.PRICE_GPT4O_OUTPUT_PER_1M) || 10,
  whisperPerMinute: Number(process.env.PRICE_WHISPER_PER_MIN) || 0.006,
  tts1Per1MChars: Number(process.env.PRICE_TTS1_PER_1M_CHARS) || 15,
};

export interface CostEvent {
  route: string;
  model: string;
  usd: number;
  inputTokens?: number;
  outputTokens?: number;
  audioSeconds?: number;
  characters?: number;
}

const totals = { events: 0, usd: 0, byRoute: {} as Record<string, { events: number; usd: number }> };

export function chatCost(inputTokens: number, outputTokens: number): number {
  return (inputTokens / 1e6) * PRICES.gpt4oInputPer1M + (outputTokens / 1e6) * PRICES.gpt4oOutputPer1M;
}

export function whisperCost(audioSeconds: number): number {
  return (Math.max(audioSeconds, 0) / 60) * PRICES.whisperPerMinute;
}

export function ttsCost(characters: number): number {
  return (characters / 1e6) * PRICES.tts1Per1MChars;
}

/**
 * Duration of a WAV buffer from its header (byte rate at offset 28, data size
 * from the "data" chunk). Returns undefined for anything that is not a WAV.
 */
export function wavSeconds(buf: Buffer): number | undefined {
  if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") return undefined;
  const byteRate = buf.readUInt32LE(28);
  if (!byteRate) return undefined;
  let offset = 12;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    if (id === "data") return Math.min(size, buf.length - offset - 8) / byteRate;
    offset += 8 + size + (size % 2);
  }
  return undefined;
}

/** Record one billable call: one structured log line plus running totals. */
export function recordCost(e: CostEvent): CostEvent {
  const usd = Math.round(e.usd * 1e6) / 1e6;
  totals.events += 1;
  totals.usd += usd;
  const r = (totals.byRoute[e.route] ??= { events: 0, usd: 0 });
  r.events += 1;
  r.usd += usd;
  console.log(JSON.stringify({ event: "ai_cost", pricesAsOf: PRICES_AS_OF, ...e, usd }));
  return { ...e, usd };
}

export function costSummary() {
  return { pricesAsOf: PRICES_AS_OF, ...totals };
}
