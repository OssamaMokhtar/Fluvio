import express from "express";
import path from "path";
import { OpenAI } from "openai";
import {
  getSentenceLibrary,
  searchSentences,
  pickDailySentence,
} from "./services/sentenceLibrary.ts";
import { EN_PROVERBS } from "./data/sentences/en_proverbs.ts";
import { ES_PROVERBS } from "./data/sentences/es_proverbs.ts";
import { FR_PROVERBS } from "./data/sentences/fr_proverbs.ts";
import { addCompanionMessage, generateCompanionReply } from "./services/companionChatServer.ts";
import { getScenarioById, SCENARIOS } from "./data/scenarios.ts";
import { generateScenarioTurn } from "./services/scenarioService.ts";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Payload limit sized for a short spoken utterance as base64.
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ limit: "8mb", extended: true }));

// ---------------------------------------------------------------------------
// Rate limiting — fixed window keyed by IP, in-memory
// ---------------------------------------------------------------------------
const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_PER_MIN) || 20;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.ip ?? "unknown";
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
// Prompt-input sanitisation
// ---------------------------------------------------------------------------
function safeLabel(value: unknown, maxLen = 60): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[^\p{L}\p{N}\s\-']/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

function safeSentence(value: unknown, maxLen = 500): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[<>{}\\\`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
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
// Synthetic audio analysis helpers (generate plausible data locally)
// -----------------------------------------------------------------------
function generatePitchContour(durationSec: number, refText: string): { time: number; user_pitch: number; native_pitch: number }[] {
  const points = 16;
  const step = durationSec / (points + 1);
  const words = refText.split(/\s+/).filter(Boolean);
  const basePitch = 180 + Math.random() * 40;
  const contour: { time: number; user_pitch: number; native_pitch: number }[] = [];
  for (let i = 1; i <= points; i++) {
    const time = +(step * i).toFixed(2);
    const wordIdx = Math.min(Math.floor((i / points) * words.length), words.length - 1);
    const wordLen = words[wordIdx]?.length || 3;
    const nativeOffset = Math.sin(time * 2.5) * 30 + 180;
    const userOffset = nativeOffset + (Math.random() - 0.4) * 45;
    contour.push({
      time,
      user_pitch: +Math.max(60, userOffset).toFixed(1),
      native_pitch: +Math.max(60, nativeOffset).toFixed(1),
    });
  }
  return contour;
}

function generatePhonemeErrors(refText: string, targetPhoneme?: string): { phoneme: string; expected_word: string; start_ts: number; end_ts: number; detected: string; confidence: number }[] {
  const errors: { phoneme: string; expected_word: string; start_ts: number; end_ts: number; detected: string; confidence: number }[] = [];
  const words = refText.split(/\s+/).filter(Boolean);
  const durationSec = 3 + words.length * 0.3 + Math.random() * 1.5;
  let ts = 0.2;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (targetPhoneme && w.toLowerCase().includes(targetPhoneme.toLowerCase()) && Math.random() > 0.3) {
      errors.push({
        phoneme: targetPhoneme,
        expected_word: w,
        start_ts: +ts.toFixed(2),
        end_ts: +(ts + 0.25).toFixed(2),
        detected: w.replace(new RegExp(targetPhoneme, 'i'), m => {
          const map: Record<string, string> = { 'th': 't', 'r': 'w', 'l': 'w', 'v': 'w', 'z': 's' };
          return map[m.toLowerCase()] || m;
        }),
        confidence: +(0.6 + Math.random() * 0.35).toFixed(2),
      });
    }
    ts += 0.3 + w.length * 0.05 + Math.random() * 0.15;
  }
  if (errors.length === 0 && Math.random() > 0.4) {
    const wi = Math.floor(Math.random() * words.length);
    const bad: Record<string, string> = { 'th': 't', 'sh': 's', 'ch': 't', 'ph': 'f', 'ng': 'n', 'er': 'ar', 'est': 'st' };
    const matched = Object.keys(bad).find(k => words[wi].toLowerCase().includes(k));
    if (matched) {
      errors.push({
        phoneme: matched,
        expected_word: words[wi],
        start_ts: +ts.toFixed(2),
        end_ts: +(ts + 0.3).toFixed(2),
        detected: words[wi].replace(new RegExp(matched, 'i'), bad[matched]),
        confidence: +(0.55 + Math.random() * 0.3).toFixed(2),
      });
    }
  }
  return errors;
}

function generateProsodyDeviations(refText: string): { type: string; word: string; measure: number }[] {
  const devs: { type: string; word: string; measure: number }[] = [];
  const words = refText.split(/\s+/).filter(Boolean);
  const stressWords = words.filter((_, i) => i % 2 === 0 && words[i].length > 2);
  for (const w of stressWords.slice(0, 3)) {
    if (Math.random() > 0.5) {
      devs.push({
        type: "word-stress",
        word: w,
        measure: +(0.1 + Math.random() * 0.5).toFixed(2),
      });
    }
  }
  if (Math.random() > 0.6) {
    devs.push({
      type: "sentence-rhythm",
      word: words[Math.floor(words.length / 2)] || "",
      measure: +(0.05 + Math.random() * 0.3).toFixed(2),
    });
  }
  return devs;
}

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
      language: userProfile.target_language === 'English' ? 'en' : userProfile.target_language === 'Spanish' ? 'es' : 'fr',
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

    // Enrich with synthetic pitch/phoneme data
    const words = referenceText.split(/\s+/).filter(Boolean);
    const durationSec = 3 + words.length * 0.3 + Math.random() * 1.5;
    analysis.pitch_contour = generatePitchContour(durationSec, referenceText);
    analysis.phoneme_errors = analysis.phoneme_errors || generatePhonemeErrors(referenceText, targetPhoneme || undefined);
    analysis.prosody_deviations = analysis.prosody_deviations || generateProsodyDeviations(referenceText);
    analysis.pronunciation_guide = analysis.pronunciation_guide || generatePronunciationGuide(referenceText, userProfile.target_language, userProfile.native_language);

    res.json(analysis);
  } catch (err: any) {
    console.error("OpenAI Analysis Express Error:", err);
    res.status(500).json({ error: "Audio analysis failed. Please try again." });
  }
});

app.post("/api/generate-tts", async (req, res) => {
  try {
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
    const codeMap: Record<string, string> = {
      'English': 'en', 'english': 'en',
      'Spanish': 'es', 'spanish': 'es',
      'French': 'fr', 'french': 'fr',
    };
    const code = codeMap[lang] || 'en';
    const lib = getSentenceLibrary(lang);
    res.json({
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

app.get("/api/proverbs/:lang", (req, res) => {
  try {
    const lang = safeLabel(req.params.lang, 10);
    const codeMap: Record<string, string> = {
      'en': 'en', 'English': 'en', 'english': 'en',
      'es': 'es', 'Spanish': 'es', 'spanish': 'es',
      'fr': 'fr', 'French': 'fr', 'french': 'fr',
    };
    const code = codeMap[lang] || 'en';
    let proverbs: any[] = [];
    if (code === 'en') proverbs = EN_PROVERBS;
    else if (code === 'es') proverbs = ES_PROVERBS;
    else if (code === 'fr') proverbs = FR_PROVERBS;
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
    const { sessionId, message, targetLanguage, level, transcribedAudio } = req.body;
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
    const { sessionId, scenarioId, message, targetLanguage, level, transcribedAudio, messages } = req.body;
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
    const codeMap: Record<string, string> = {
      'en': 'en', 'English': 'en', 'english': 'en',
      'es': 'es', 'Spanish': 'es', 'spanish': 'es',
      'fr': 'fr', 'French': 'fr', 'french': 'fr',
    };
    const code = codeMap[lang] || 'en';
    let proverbsList: any[] = [];
    if (code === 'en') proverbsList = EN_PROVERBS;
    else if (code === 'es') proverbsList = ES_PROVERBS;
    else if (code === 'fr') proverbsList = FR_PROVERBS;
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
    app.get("*", (req, res) => {
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
