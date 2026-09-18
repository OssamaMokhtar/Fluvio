import express from "express";
import path from "path";
import { OpenAI } from "openai";
import {
  getSentenceLibrary,
  searchSentences,
  pickDailySentence,
  getWordLibrary,
} from "./services/sentenceLibrary.ts";
import { EN_PROVERBS } from "./data/sentences/en_proverbs.ts";
import { ES_PROVERBS } from "./data/sentences/es_proverbs.ts";
import { FR_PROVERBS } from "./data/sentences/fr_proverbs.ts";
import { DE_PROVERBS } from "./data/sentences/de_proverbs.ts";
import { IT_PROVERBS } from "./data/sentences/it_proverbs.ts";
import { JA_PROVERBS } from "./data/sentences/ja_proverbs.ts";
import { PT_PROVERBS } from "./data/sentences/pt_proverbs.ts";
import { ZH_PROVERBS } from "./data/sentences/zh_proverbs.ts";
import { addCompanionMessage, generateCompanionReply } from "./services/companionChatServer.ts";
import { getScenarioById, SCENARIOS } from "./data/scenarios.ts";
import { generateScenarioTurn } from "./services/scenarioService.ts";
import { safeLabel, safeSentence } from "./services/sanitization.ts";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// SL-03: Express defaults trust proxy = false, which made req.ip resolve to the
// platform proxy rather than the caller — every client shared one rate-limit
// bucket. Vercel puts exactly one proxy hop in front of the function.
app.set("trust proxy", 1);

// SL-21: Vercel caps serverless request bodies at 4.5 MB. An 8 MB Express limit
// meant a recording the app accepted was rejected by the platform with an opaque
// error. 4 MB leaves headroom for base64 inflation and JSON envelope.
const BODY_LIMIT = process.env.BODY_LIMIT || "4mb";
app.use(express.json({ limit: BODY_LIMIT }));

// ---------------------------------------------------------------------------
// Rate limiting — fixed window keyed by IP, in-memory
// ---------------------------------------------------------------------------
const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_PER_MIN) || 20;
const hits = new Map<string, { count: number; resetAt: number }>();

/**
 * SL-03: identity for rate limiting.
 *
 * Prefers an explicit per-device token the client mints once and stores, because
 * IP is a poor identity behind carrier NAT (most of the GCC mobile base) and is
 * shared across every invocation of a serverless function. Falls back to IP.
 */
function rateLimitKey(req: express.Request): string {
  const device = req.get("x-slang-device");
  if (device && /^[A-Za-z0-9_-]{8,64}$/.test(device)) return "d:" + device;
  return "i:" + (req.ip ?? "unknown");
}

function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = rateLimitKey(req);
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  if (entry.count >= MAX_REQUESTS) {
    res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
    return res.status(429).json({ error: "Too many requests. Please slow down." });
  }
  entry.count += 1;
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) if (now > entry.resetAt) hits.delete(key);
}, WINDOW_MS).unref();

app.use("/api", rateLimit);

// ---------------------------------------------------------------------------
// SL-03: hard spend ceiling on billable AI calls — fails CLOSED.
//
// The rate limiter throttles a caller; it does not bound total spend. This does.
// In-process state means each serverless instance enforces its own share, so the
// effective global ceiling is (instances x budget) — deliberately conservative,
// and the number to move to a shared store first. See docs/spend-control.md.
// ---------------------------------------------------------------------------
const AI_CALL_BUDGET_PER_DAY = Number(process.env.AI_CALL_BUDGET_PER_DAY) || 2000;
let aiCallsToday = 0;
let aiBudgetResetAt = Date.now() + 86_400_000;

export function aiBudgetStatus() {
  return { used: aiCallsToday, budget: AI_CALL_BUDGET_PER_DAY, resetAt: aiBudgetResetAt };
}

/** Returns false when the budget is exhausted. Call once per billable request. */
function consumeAIBudget(routeName: string): boolean {
  const now = Date.now();
  if (now > aiBudgetResetAt) {
    aiCallsToday = 0;
    aiBudgetResetAt = now + 86_400_000;
  }
  if (aiCallsToday >= AI_CALL_BUDGET_PER_DAY) {
    console.error(`[${routeName}] AI call budget exhausted (${AI_CALL_BUDGET_PER_DAY}/day)`);
    return false;
  }
  aiCallsToday += 1;
  return true;
}

function budgetExhausted(res: express.Response) {
  res.setHeader("Retry-After", String(Math.ceil((aiBudgetResetAt - Date.now()) / 1000)));
  return res.status(429).json({
    error: "Daily practice capacity reached. Please try again tomorrow.",
    code: "AI_BUDGET_EXHAUSTED",
  });
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    ai_configured: Boolean(process.env.OPENAI_API_KEY),
    budget: aiBudgetStatus(),
  });
});

// Prompt-input sanitisation lives in services/sanitization.ts and is imported
// above. SL-17: a byte-identical duplicate previously lived here, so the two
// copies could drift. There is now exactly one definition.

// ---------------------------------------------------------------------------
// SL-14: a single language map. Previously a two-branch ternary sent German,
// Italian, Japanese, Portuguese and Chinese audio to Whisper tagged as French,
// and three separate codeMap literals disagreed with each other.
// ---------------------------------------------------------------------------
export const LANGUAGE_CODES: Record<string, string> = {
  en: "en", english: "en", English: "en",
  ar: "ar", arabic: "ar", Arabic: "ar",
  es: "es", spanish: "es", Spanish: "es",
  fr: "fr", french: "fr", French: "fr",
  de: "de", german: "de", German: "de",
  it: "it", italian: "it", Italian: "it",
  ja: "ja", japanese: "ja", Japanese: "ja",
  pt: "pt", portuguese: "pt", Portuguese: "pt",
  zh: "zh", chinese: "zh", Chinese: "zh",
  ru: "ru", russian: "ru", Russian: "ru",
  tr: "tr", turkish: "tr", Turkish: "tr",
  ko: "ko", korean: "ko", Korean: "ko",
  hi: "hi", hindi: "hi", Hindi: "hi",
};

/**
 * SL-04/SL-05: de, it, ja, pt and zh were advertised here and on the KPI tile but
 * their corpora were unusable. Proverbs for those languages still exist and are
 * still served — they were hand-checked and are not affected. Sentence practice
 * is en/es/fr only until a corpus meets the bar in docs/corpus-protocol.md.
 */
export const PROVERB_LANGUAGE_CODES: Record<string, string> = {
  ...LANGUAGE_CODES,
  de: "de", german: "de", German: "de",
  it: "it", italian: "it", Italian: "it",
  ja: "ja", japanese: "ja", Japanese: "ja",
  pt: "pt", portuguese: "pt", Portuguese: "pt",
  zh: "zh", chinese: "zh", Chinese: "zh",
};

export function toProverbCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const k = value.trim();
  return PROVERB_LANGUAGE_CODES[k] ?? PROVERB_LANGUAGE_CODES[k.toLowerCase()] ?? null;
}

/** Resolve any spelling of a language to an ISO code, or null when unsupported. */
export function toLanguageCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim();
  return LANGUAGE_CODES[key] ?? LANGUAGE_CODES[key.toLowerCase()] ?? null;
}

// Retrieve the API key
const apiKey = process.env.OPENAI_API_KEY;

// Lazy initialize OpenAI. Throws if key is missing — callers must catch.
let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) {
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    openai = new OpenAI({
      apiKey,
      maxRetries: 3,
    });
  }
  return openai;
}

// Helper: returns a 500 with a generic message when OpenAI is unavailable.
function openAiUnavailable(res: express.Response, routeName: string) {
  console.error(`[${routeName}] OpenAI unavailable — OPENAI_API_KEY not set or API error`);
  res.status(500).json({ error: "Speech service unavailable. Please try again." });
}

// -----------------------------------------------------------------------
// SL-07: the synthetic audio-analysis helpers that lived here
// (generatePitchContour, generatePhonemeErrors, generateProsodyDeviations)
// have been deleted. They produced Math.random() data that the client
// rendered as phonetic measurement. generatePronunciationGuide survives —
// it returns static, honestly-labelled coaching text, not a measurement.
// -----------------------------------------------------------------------

function generatePronunciationGuide(refText: string, targetLanguage: string, userLanguage: string): { segment: string; tip: string }[] {
  const guide: { segment: string; tip: string }[] = [];
  if (targetLanguage === "English") {
    guide.push({ segment: "word endings", tip: "Make sure to pronounce the final consonant of each word clearly (e.g. 's' in 'dogs', 't' in 'cat')." });
    guide.push({ segment: "th sound", tip: "Push your tongue slightly between your teeth and blow air for the 'th' sound." });
    guide.push({ segment: "linking", tip: "Connect words smoothly — don't pause between every word in a sentence." });
  }
  if (targetLanguage === "Spanish") {
    guide.push({ segment: "vowels", tip: "Spanish vowels are short and pure — avoid diphthongizing them like in English." });
    guide.push({ segment: "r vs rr", tip: "Single 'r' is a light tap; double 'rr' is a trill. Practice rolling your tongue." });
    guide.push({ segment: "b and v", tip: "In Spanish, 'b' and 'v' sound almost identical — both are soft between vowels." });
  }
  if (targetLanguage === "French") {
    guide.push({ segment: "nasal vowels", tip: "Nasal vowels (an, on, in) are pronounced through the nose — don't pronounce the 'n' at the end." });
    guide.push({ segment: "silent letters", tip: "Most final consonants in French are silent — don't pronounce them unless followed by a vowel." });
    guide.push({ segment: "u vs ou", tip: "The French 'u' is made by rounding your lips as if saying 'ee' while shaping your tongue for 'oo'." });
  }
  return guide;
}

const SYSTEM_PROMPT = `
You are a compassionate, expert pronunciation coach for learners.
Input: A user profile, a transcribed utterance, and a reference text to compare against.
Output: A JSON object adhering to the schema below.

Your task is to analyze the transcription against the reference text and return:
1. Scores (0-100) for Overall, Pronunciation, and Intelligibility.
2. Phoneme errors with timestamps (relative to duration).
3. Prosody deviations.
4. A pitch contour comparison (normalized data points).
5. Actionable feedback.
6. A pronunciation guide for the reference text.

Tone must be encouraging and specific. Use IPA only when necessary.

LOGIC RULES:
1. If a target phoneme is provided, the summary, scores, and feedback MUST prioritize that sound.
2. If level is 'advanced' AND accuracy looks high, focus on naturalness, rhythm, connected speech, idiomatic expressions.
3. Otherwise: Focus on clear articulation, phoneme errors, basic intelligibility.
`;

const analysisSchema = {
  type: "object",
  properties: {
    summary: { type: "string", description: "Concise summary sentence <= 25 words" },
    overall_score: { type: "integer" },
    pronunciation_score: { type: "integer" },
    intelligibility_score: { type: "integer" },
    prioritized_actions: {
      type: "array",
      items: { type: "string" },
      description: "Three prioritized corrective actions"
    },
    model_phrase: {
      type: "object",
      properties: {
        text: { type: "string" },
        tempo_percent: { type: "string" },
        ipa_hint: { type: "string" }
      }
    },
    drills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          items: { type: "array", items: { type: "string" } },
          reps: { type: "integer" }
        }
      }
    },
    explanation_notes: { type: "array", items: { type: "string" } },
    phoneme_errors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          phoneme: { type: "string" },
          expected_word: { type: "string" },
          start_ts: { type: "number" },
          end_ts: { type: "number" },
          detected: { type: "string" },
          confidence: { type: "number" }
        }
      }
    },
    prosody_deviations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          word: { type: "string" },
          measure: { type: "number" }
        }
      }
    },
    pitch_contour: {
      type: "array",
      description: "Array of 15-20 pitch contour points",
      items: {
        type: "object",
        properties: {
          time: { type: "number" },
          user_pitch: { type: "number" },
          native_pitch: { type: "number" }
        }
      }
    },
    pronunciation_guide: {
      type: "array",
      items: {
        type: "object",
        properties: {
          segment: { type: "string" },
          tip: { type: "string" }
        }
      }
    },
    confidence: { type: "number" }
  },
  required: ["summary", "overall_score", "pronunciation_score", "intelligibility_score", "prioritized_actions", "model_phrase", "drills", "pitch_contour"]
};

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

app.post("/api/analyze-audio", async (req, res) => {
  try {
    if (!consumeAIBudget("analyze-audio")) return budgetExhausted(res);
    const { audioBase64, userProfile: rawProfile, referenceText: rawRef, targetPhoneme: rawPhoneme } = req.body;

    const userProfile = {
      target_language: safeLabel(rawProfile?.target_language),
      native_language: safeLabel(rawProfile?.native_language),
      level: safeLabel(rawProfile?.level, 20),
      motivation: safeLabel(rawProfile?.motivation, 80),
      accent_reduction_goal: safeLabel(rawProfile?.accent_reduction_goal),
    };
    const referenceText = safeSentence(rawRef);
    const targetPhoneme = safeLabel(rawPhoneme, 12);
    if (!audioBase64) {
      return res.status(400).json({ error: "Missing audioBase64" });
    }

    let client: OpenAI;
    try {
      client = getOpenAI();
    } catch {
      return openAiUnavailable(res, "analyze-audio");
    }

    // Decode base64 audio to a File for Whisper
    const buf = Buffer.from(audioBase64, 'base64');
    const audioFile = new File([buf], 'recording.wav', { type: 'audio/wav' });
    const whisperResult = await client.audio.transcriptions.create({
      model: 'whisper-1',
      file: audioFile,
      language: toLanguageCode(userProfile.target_language) ?? 'en',
      response_format: 'text',
    });
    const transcription = typeof whisperResult === 'string' ? whisperResult : (whisperResult as any)?.text || '';

    // Send transcription + reference to GPT-4 for analysis
    const analysisPrompt = `
    User Profile: ${JSON.stringify(userProfile)}
    Reference Text (Expected): "${referenceText}"
    Transcribed Utterance: "${transcription}"
    ${targetPhoneme ? `TARGET PHONEME TO EVALUATE: "${targetPhoneme}". Focus feedback on this sound.` : ''}
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: analysisPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 2048,
    });

    const textResponse = response.choices[0]?.message?.content;
    if (!textResponse) {
      return res.status(500).json({ error: "No response from AI" });
    }

    let analysis: any;
    try {
      analysis = JSON.parse(textResponse);
    } catch {
      return res.status(500).json({ error: "Invalid AI response" });
    }

    // -----------------------------------------------------------------
    // SL-07: this block used to overwrite the model's pitch_contour with a sine
    // wave plus Math.random(), and silently fill phoneme_errors and
    // prosody_deviations from random generators. The client then drew that as a
    // "your pitch vs native pitch" chart — measurement styling over noise.
    //
    // Nothing synthetic is fabricated here any more. Fields the pipeline cannot
    // measure are returned absent, and `measurement` tells the client exactly
    // what is and is not a measurement so the UI can label it honestly.
    // Real F0 extraction and phoneme-level scoring land with the acoustic
    // pipeline — see docs/adr/0001-acoustic-scoring.md.
    // -----------------------------------------------------------------
    analysis.transcription = transcription;
    analysis.pronunciation_guide =
      analysis.pronunciation_guide ||
      generatePronunciationGuide(referenceText, userProfile.target_language, userProfile.native_language);

    analysis.measurement = {
      method: "asr_transcript_llm_judgement",
      audio_analysed: false,
      pitch_measured: false,
      phoneme_timings_measured: false,
      note: "Scores are inferred by a language model comparing the ASR transcript to the reference text. No acoustic analysis is performed. Do not present as phonetic measurement.",
    };
    delete analysis.pitch_contour;
    if (!Array.isArray(analysis.phoneme_errors)) analysis.phoneme_errors = [];
    if (!Array.isArray(analysis.prosody_deviations)) analysis.prosody_deviations = [];

    res.json(analysis);
  } catch (err: any) {
    console.error("OpenAI Analysis Express Error:", err);
    res.status(500).json({ error: "Audio analysis failed. Please try again." });
  }
});

app.post("/api/generate-tts", async (req, res) => {
  try {
    if (!consumeAIBudget("generate-tts")) return budgetExhausted(res);
    const { text, voice } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing text for TTS" });
    }

    let client: OpenAI;
    try {
      client = getOpenAI();
    } catch {
      return openAiUnavailable(res, "generate-tts");
    }

    const speech = await client.audio.speech.create({
      model: 'tts-1',
      input: text,
      voice: (voice || 'alloy').toLowerCase(),
      response_format: 'mp3',
    });

    // Collect the streaming response into a buffer
    const stream = speech;
    const chunks: Uint8Array[] = [];
    const decoder = new TextDecoder();

    // OpenAI SDK v4: speech is a ReadableStream (AudioSpeechStream).
    // Read it via the body's getReader if available.
    const body = (stream as any).body;
    if (body && typeof (body as any).getReader === 'function') {
      const reader = await (body as any).getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(new Uint8Array(value));
      }
    } else {
      // Fallback: try treating the stream itself as the body.
      if (typeof (stream as any).getReader === 'function') {
        const reader = await (stream as any).getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(new Uint8Array(value));
        }
      } else {
        // Last resort: convert whatever we got.
        const buf = await stream;
        if (buf instanceof Uint8Array) chunks.push(buf);
        else if (Buffer.isBuffer(buf)) chunks.push(new Uint8Array(buf));
        else chunks.push(new TextEncoder().encode(String(buf)));
      }
    }
    const audioBuffer = Buffer.concat(chunks);

    res.json({ audioData: audioBuffer.toString('base64') });
  } catch (err: any) {
    console.error("TTS Express Error:", err);
    res.status(500).json({ error: "Speech generation failed. Please try again." });
  }
});

app.post("/api/generate-lesson-plan", async (req, res) => {
  try {
    if (!consumeAIBudget("lesson-plan")) return budgetExhausted(res);
    const { userProfile } = req.body;
    if (!userProfile) {
      return res.status(400).json({ error: "Missing userProfile" });
    }

    const client = getOpenAI();

    const lessonSchema = {
      type: "object",
      properties: {
        context: { type: "string", description: "A very short scenario title (e.g. 'Ordering Coffee')" },
        prompt: { type: "string", description: "A sentence for the user to practice speaking." }
      },
      required: ["context", "prompt"]
    };

    const systemPrompt = `
      You are an adaptive language coach. Create a SINGLE practice sentence for the user.
      Context: User is a ${safeLabel(userProfile?.level, 20)} learner. Motivation: ${safeLabel(userProfile?.motivation, 80)}. Native Language: ${safeLabel(userProfile?.native_language)}. Target Language: ${safeLabel(userProfile?.target_language)}. Target Accent: ${safeLabel(userProfile?.accent_reduction_goal) || 'Standard'}.

      Rules:
      - Beginner: Simple subject-verb-object, everyday vocabulary.
      - Intermediate: Compound sentences, more descriptive.
      - Advanced: Idiomatic expressions, nuance, complex structures.
      - Align content with their motivation.
      - Ensure vocabulary aligns with the Target Language & Accent.
      - The prompt must be a single sentence or question suitable for speech practice.
    `;

    // --- FALLBACK CHAIN: gpt-4o → gpt-4o-mini → local heuristic ---
    const models: string[] = ['gpt-4o', 'gpt-4o-mini'];
    let lesson: any = null;

    for (const model of models) {
      try {
        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Generate a practice prompt." }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 256,
        });

        const textResponse = response.choices[0]?.message?.content;
        if (textResponse) {
          lesson = JSON.parse(textResponse);
          break;
        }
      } catch {
        // 429/401/500 — try next model
      }
    }

    if (lesson) {
      res.json(lesson);
    } else {
      // --- LOCAL HEURISTIC FALLBACK (no API credits needed) ---
      const level = safeLabel(userProfile?.level, 20).toLowerCase();
      const lang = safeLabel(userProfile?.target_language, 20);

      const prompts: Record<string, Record<string, { context: string; prompt: string }>> = {
        'English': {
          'beginner': { context: "Introducing Yourself", prompt: "My name is Carlos and I come from Madrid." },
          'intermediate': { context: "Travel Experience", prompt: "Last summer I travelled to Barcelona and spent three days exploring the Gothic Quarter." },
          'advanced': { context: "Professional Discussion", prompt: "Given the current market trends, I believe we should reconsider our approach to customer acquisition before Q4." }
        },
        'Spanish': {
          'beginner': { context: "Presentaciones", prompt: "Me llamo María y vivo en Buenos Aires." },
          'intermediate': { context: "Viajes", prompt: "El año pasado fui a México y probé la comida en el mercado central de Oaxaca." },
          'advanced': { context: "Debate profesional", prompt: "A mi parecer, la implementación de la nueva estrategia requiere una evaluación más cuidadosa de los costos a largo plazo." }
        },
        'French': {
          'beginner': { context: "Se présenter", prompt: "Je m'appelle Julien et je viens de Lyon." },
          'intermediate': { context: "Voyage", prompt: "L'année dernière, je suis allé à Montréal et j'ai visité le Vieux Port pendant deux jours." },
          'advanced': { context: "Discussion professionnelle", prompt: "Compte tenu des tendances actuelles du marché, je pense que nous devrions revoir notre approche de l'acquisition client d'ici le quatrième trimestre." }
        }
      };

      const levelMap: Record<string, string> = { 'beginner': 'beginner', 'elementary': 'beginner', 'intermediate': 'intermediate', 'upper-intermediate': 'intermediate', 'advanced': 'advanced', 'mastery': 'advanced' };
      const selectedLevel = levelMap[level] || 'intermediate';
      const langPrompts = prompts[lang] || prompts['English'];
      const selectedPrompt = langPrompts[selectedLevel] || langPrompts['intermediate'];

      res.json({ context: selectedPrompt.context, prompt: selectedPrompt.prompt, fallback: true });
    }
  } catch (err: any) {
    console.error("Lesson Gen Express Error:", err);
    res.setHeader("X-Degraded", "lesson-plan-fallback");
    res.json({
      context: "Daily Practice",
      prompt: "The quick brown fox jumps over the lazy dog.",
      degraded: true
    });
  }
});

// ---------------------------------------------------------------------------
// Sentence library API
// ---------------------------------------------------------------------------
app.get("/api/sentences/:lang", (req, res) => {
  try {
    const lang = safeLabel(req.params.lang, 10);
    const code = toLanguageCode(lang);
    if (!code) return res.status(404).json({ error: `Unsupported language: ${lang}` });
    const lib = getSentenceLibrary(lang);
    res.json({
      // SL-14: this previously returned "en" for every language outside en/es/fr,
      // so a German request came back labelled English.
      language: code,
      total_count: lib.total_count,
      by_level: lib.by_level,
      by_topic: lib.by_topic,
    });
  } catch (err) {
    console.error("Sentence library error:", err);
    res.status(500).json({ error: "Failed to load sentence library" });
  }
});

app.get("/api/sentences/:lang/search", (req, res) => {
  try {
    const lang = safeLabel(req.query.lang as string || 'English', 10);
    const query = safeLabel(req.query.q as string || '', 100);
    const lib = getSentenceLibrary(lang);
    const results = searchSentences(lib, query);
    res.json({ sentences: results, count: results.length });
  } catch (err) {
    console.error("Sentence search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

app.get("/api/sentences/:lang/random", (req, res) => {
  try {
    const lang = safeLabel(req.query.lang as string || 'English', 10);
    const level = safeLabel(req.query.level as string || 'intermediate', 20);
    const lib = getSentenceLibrary(lang);
    const sentence = pickDailySentence(lib, level);
    if (!sentence) return res.status(404).json({ error: "No sentence found" });
    res.json(sentence);
  } catch (err) {
    console.error("Sentence random error:", err);
    res.status(500).json({ error: "Failed to get sentence" });
  }
});

// ---------------------------------------------------------------------------
// Full library endpoints (for client-side pagination)
// ---------------------------------------------------------------------------

app.get("/api/sentence-library", (req, res) => {
  try {
    const lang = safeLabel(req.query.lang as string || 'English', 10);
    const code = toLanguageCode(lang);
    if (!code) return res.status(404).json({ error: `Unsupported language: ${lang}` });
    const lib = getSentenceLibrary(lang);
    res.json({
      sentences: lib.sentences.slice(0, 1000),
      total_count: lib.total_count,
      languages: [lang],
    });
  } catch (err) {
    console.error("GET /api/sentence-library error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/words/:lang", (req, res) => {
  try {
    const lang = safeLabel(req.params.lang, 10);
    const code = toLanguageCode(lang);
    if (!code) return res.status(404).json({ error: `Unsupported language: ${lang}` });
    const lib = getWordLibrary(lang);
    res.json({
      language: code,
      total_count: lib.total_count,
      by_pos: lib.by_pos,
    });
  } catch (err) {
    console.error("GET /api/words/:lang error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/word-library", (req, res) => {
  try {
    const lang = safeLabel(req.query.lang as string || 'English', 10);
    const code = toLanguageCode(lang);
    if (!code) return res.status(404).json({ error: `Unsupported language: ${lang}` });
    const lib = getWordLibrary(lang);
    res.json({
      words: lib.words.slice(0, 1000),
      total_count: lib.total_count,
      languages: [lang],
    });
  } catch (err) {
    console.error("GET /api/word-library error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/api/proverbs/:lang", (req, res) => {
  try {
    const lang = safeLabel(req.params.lang, 10);
    const code = toProverbCode(lang) ?? 'en';
    let proverbs: any[] = [];
    if (code === 'en') proverbs = EN_PROVERBS;
    else if (code === 'es') proverbs = ES_PROVERBS;
    else if (code === 'fr') proverbs = FR_PROVERBS;
    else if (code === 'de') proverbs = DE_PROVERBS;
    else if (code === 'it') proverbs = IT_PROVERBS;
    else if (code === 'ja') proverbs = JA_PROVERBS;
    else if (code === 'pt') proverbs = PT_PROVERBS;
    else if (code === 'zh') proverbs = ZH_PROVERBS;
    res.json({ language: code, proverbs, total_count: proverbs.length });
  } catch (err) {
    console.error("Proverbs error:", err);
    res.status(500).json({ error: "Failed to load proverbs" });
  }
});

// ---------------------------------------------------------------------------
// AI Language Companion API
// ---------------------------------------------------------------------------
app.post("/api/companion/chat", async (req, res) => {
  try {
    const { sessionId, targetLanguage, level, transcribedAudio } = req.body;
    // SL-17: `message` is the one free-text, user-controlled field that reaches a
    // prompt. It was the only input NOT sanitised, while closed vocabularies like
    // language and level were. Sanitise by trust level, not by field name.
    const message = safeSentence(req.body?.message, 1000);
    if (!message || !targetLanguage) {
      return res.status(400).json({ error: "Missing message or targetLanguage" });
    }

    // Try to get OpenAI client; fall back to local heuristic if unavailable
    let client: OpenAI | null = null;
    try {
      client = getOpenAI();
    } catch {
      // OpenAI key not set — generateCompanionReply has its own fallback chain
      client = null;
    }

    let session: any = {
      id: sessionId || crypto.randomUUID(),
      messages: [],
      language: targetLanguage,
      level: level || 'intermediate',
      started_at: Date.now(),
      last_active: Date.now()
    };
    if (sessionId && req.body.messages) {
      session.messages = req.body.messages;
    }

    const result = await generateCompanionReply(session, targetLanguage, level || 'intermediate', client!, transcribedAudio);

    const updatedSession = addCompanionMessage(session, 'user', message);
    const finalSession = addCompanionMessage(updatedSession, 'companion', result.response, result.corrected_text || undefined, result.correction_note || undefined);

    res.json({
      ...result,
      session: finalSession,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("Companion chat error:", err);
    res.status(500).json({ error: "Companion unavailable. Please try again." });
  }
});

// ---------------------------------------------------------------------------
// Scenario Role-Play API
// ---------------------------------------------------------------------------

const SCENARIO_SYSTEM_PROMPT = `
You are an AI role-play partner for language learners. You will play a specific role in a realistic scenario, and the learner will respond in the target language.

YOUR JOB:
1. Respond IN CHARACTER — speak as the role you've been assigned (barista, hotel receptionist, etc.), not as an AI assistant.
2. Respond primarily in the TARGET LANGUAGE. For beginner level, append a brief English translation in parentheses at the end.
3. Keep responses SHORT — 1-3 sentences for beginner, up to 4 for intermediate, up to 5 for advanced. Never write a paragraph.
4. After each learner response, evaluate it across 5 dimensions and provide SCORES (0-100) for each:
   - pronunciation: clarity of sounds, accent accuracy
   - grammar: correctness of sentence structure, verb forms, word order
   - vocabulary: appropriate word choice, range of vocabulary used
   - fluency: smoothness, hesitation, natural flow
   - appropriateness: cultural fit, register, context-appropriate language
5. Provide brief FEEDBACK (1-2 sentences) — encouraging, specific, actionable.
6. Include a CORRECTED_VERSION if the learner made errors — the same message rewritten correctly.
7. Include a NEXT_PROMPT — a follow-up question or statement in character to keep the conversation going.

OUTPUT FORMAT (JSON ONLY):
{
  "response": "Your reply in character, in the target language",
  "translation": "English translation (required for beginner, optional otherwise)",
  "scores": {
    "pronunciation": 75,
    "grammar": 70,
    "vocabulary": 72,
    "fluency": 68,
    "appropriateness": 80
  },
  "feedback": "Brief encouraging feedback on the learner's turn",
  "corrected_version": "Corrected version of learner's message (omit if no errors)",
  "next_prompt": "Follow-up question/statement in character to continue the conversation"
}

Always respond in JSON. Do NOT include any text outside the JSON object.
Do NOT mention that you are an AI. Stay in character.
`;

app.post("/api/companion/scenario", async (req, res) => {
  try {
    const { sessionId, scenarioId, targetLanguage, level, transcribedAudio, messages } = req.body;
    const message = safeSentence(req.body?.message, 1000);   // SL-17
    if (!scenarioId || !message || !targetLanguage) {
      return res.status(400).json({ error: "Missing scenarioId, message, or targetLanguage" });
    }

    // Resolve scenario
    const scenario = getScenarioById(SCENARIOS, scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: `Scenario not found: ${scenarioId}` });
    }

    // Build or resume session
    let session: any = {
      id: sessionId || crypto.randomUUID(),
      scenario_id: scenarioId,
      target_language: targetLanguage,
      level: level || 'intermediate',
      messages: [],
      started_at: Date.now(),
      last_active: Date.now(),
    };
    if (messages && Array.isArray(messages) && messages.length > 0) {
      session.messages = messages;
    }

    // Get OpenAI client (null if no credits → uses local fallback)
    let client: OpenAI | null = null;
    try {
      client = getOpenAI();
    } catch {
      client = null;
    }

    // Generate the AI's turn
    const result = await generateScenarioTurn(scenario, session, message, client);

    // Build updated session with the user's message and the AI's response
    const updatedSession = {
      ...session,
      messages: [
        ...session.messages,
        {
          id: crypto.randomUUID(),
          role: 'user',
          text: message,
          timestamp: Date.now(),
        },
        {
          id: crypto.randomUUID(),
          role: 'ai',
          text: result.response,
          translation: result.translation,
          scores: result.scores,
          feedback: result.feedback,
          corrected_version: result.corrected_version,
          timestamp: Date.now(),
        },
      ],
      last_active: Date.now(),
    };

    res.json({
      ...result,
      session: updatedSession,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("Scenario route error:", err);
    res.status(500).json({ error: "Scenario unavailable. Please try again." });
  }
});

// Proverbs random endpoint
app.get("/api/proverbs/:lang/random", (req, res) => {
  try {
    const lang = safeLabel(req.params.lang, 10);
    const code = toProverbCode(lang) ?? 'en';
    let proverbsList: any[] = [];
    if (code === 'en') proverbsList = EN_PROVERBS;
    else if (code === 'es') proverbsList = ES_PROVERBS;
    else if (code === 'fr') proverbsList = FR_PROVERBS;
    else if (code === 'de') proverbsList = DE_PROVERBS;
    else if (code === 'it') proverbsList = IT_PROVERBS;
    else if (code === 'ja') proverbsList = JA_PROVERBS;
    else if (code === 'pt') proverbsList = PT_PROVERBS;
    else if (code === 'zh') proverbsList = ZH_PROVERBS;
    if (proverbsList.length === 0) return res.status(404).json({ error: "No proverbs for this language" });
    const proverb = proverbsList[Math.floor(Math.random() * proverbsList.length)];
    res.json(proverb);
  } catch (err) {
    console.error("Proverbs random error:", err);
    res.status(500).json({ error: "Failed to get proverb" });
  }
});

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
export { app };
export const getOpenAIClient = () => getOpenAI();

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SL-12: Express 5 uses path-to-regexp v8, where a bare "*" throws
    // PathError: Missing parameter name. The named-splat form is the Express 5
    // spelling of the SPA catch-all.
    app.get("/{*splat}", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}
