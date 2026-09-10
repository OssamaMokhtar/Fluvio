import express from "express";
import path from "path";
import { GoogleGenAI, Schema, Type, Modality } from "@google/genai";

import { getSentenceLibrary, searchSentences, pickDailySentence } from "./services/sentenceLibrary.ts";
import { EN_PROVERBS } from "./data/sentences/en_proverbs.ts";
import { ES_PROVERBS } from "./data/sentences/es_proverbs.ts";
import { FR_PROVERBS } from "./data/sentences/fr_proverbs.ts";
import { addCompanionMessage } from "./services/companionChatServer.ts";
import { generateCompanionReply } from "./services/companionChatServer.ts";

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
const apiKey = process.env.GEMINI_API_KEY;

// Lazy initialize Gemini. Throws if key is missing — callers must catch.
let ai: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!ai) {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// Helper: returns a 500 with a generic message when Gemini is unavailable.
// Prevents leaking "GEMINI_API_KEY environment variable is required" to clients.
function geminiUnavailable(res: express.Response, routeName: string) {
  console.error(`[${routeName}] Gemini unavailable — GEMINI_API_KEY not set or API error`);
  res.status(500).json({ error: "Speech service unavailable. Please try again." });
}

const SYSTEM_PROMPT = `
You are a compassionate, expert pronunciation coach for learners of English.
Input: A user profile, an audio recording, and optionally a target phoneme to focus on.
Output: A JSON object adhering to the schema below.

Your task is to analyze the audio (simulated analysis based on ASR and acoustic features logic) and return:
1. Scores (0-100) for Overall, Pronunciation, and Intelligibility.
2. Phoneme errors with timestamps (simulated relative to duration).
3. Prosody deviations.
4. A pitch contour comparison (simulated normalized data points).
5. Actionable feedback.
6. A pronunciation guide for the reference text.

Tone must be encouraging and specific. Use IPA only when necessary.

LOGIC RULES:
1. If a target phoneme is provided, the summary, scores, and feedback MUST prioritize that sound.
2. ACCENT GOAL LOGIC: Evaluate pronunciation based on the target dialect's standards.
3. ADVANCED LEARNER LOGIC: If level is 'advanced' AND score >= 90, focus on naturalness, rhythm, connected speech, idiomatic expressions.
4. Otherwise: Focus on clear articulation, phoneme errors, basic intelligibility.
`;

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "Concise summary sentence <= 25 words" },
    overall_score: { type: Type.INTEGER },
    pronunciation_score: { type: Type.INTEGER },
    intelligibility_score: { type: Type.INTEGER },
    prioritized_actions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Three prioritized corrective actions"
    },
    model_phrase: {
      type: Type.OBJECT,
      properties: {
        text: { type: Type.STRING },
        tempo_percent: { type: Type.STRING },
        ipa_hint: { type: Type.STRING }
      }
    },
    drills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          items: { type: Type.ARRAY, items: { type: Type.STRING } },
          reps: { type: Type.INTEGER }
        }
      }
    },
    explanation_notes: { type: Type.ARRAY, items: { type: Type.STRING } },
    phoneme_errors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          phoneme: { type: Type.STRING },
          expected_word: { type: Type.STRING },
          start_ts: { type: Type.NUMBER },
          end_ts: { type: Type.NUMBER },
          detected: { type: Type.STRING },
          confidence: { type: Type.NUMBER }
        }
      }
    },
    prosody_deviations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          word: { type: Type.STRING },
          measure: { type: Type.NUMBER }
        }
      }
    },
    pitch_contour: {
      type: Type.ARRAY,
      description: "Array of 15-20 pitch contour points",
      items: {
        type: Type.OBJECT,
        properties: {
          time: { type: Type.NUMBER },
          user_pitch: { type: Type.NUMBER },
          native_pitch: { type: Type.NUMBER }
        }
      }
    },
    pronunciation_guide: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          segment: { type: Type.STRING },
          tip: { type: Type.STRING }
        }
      }
    },
    confidence: { type: Type.NUMBER }
  },
  required: ["summary", "overall_score", "pronunciation_score", "intelligibility_score", "prioritized_actions", "model_phrase", "drills", "pitch_contour"]
};

// -----------------------------------------------------------------------
// PROOF OF LIFE — cached at module init so Vercel cold-start can report
// library health without hitting the route handlers.
// -----------------------------------------------------------------------
const LIBRARY_PROOF = {
  en: { total: EN_PROVERBS.length, hasEn: true },
  es: { total: ES_PROVERBS.length, hasEn: true },
  fr: { total: FR_PROVERBS.length, hasEn: true },
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

    let client: GoogleGenAI;
    try {
      client = getGemini();
    } catch {
      return geminiUnavailable(res, "analyze-audio");
    }

    let promptInstruction = `
    User Profile: ${JSON.stringify(userProfile)}
    Reference Text (Expected): "${referenceText}"
    ${targetPhoneme ? `TARGET PHONEME TO EVALUATE: "${targetPhoneme}". Focus feedback on this sound.` : ''}

    Analyze the attached audio recording against the reference text.
    `;

    if (userProfile.target_language && userProfile.target_language !== 'English') {
      promptInstruction += `
        \nTARGET LANGUAGE: ${userProfile.target_language}.
        Evaluate pronunciation based on standard ${userProfile.target_language} phonology.
        `;
    }

    if (userProfile.level === 'advanced') {
      promptInstruction += `
      \nIMPORTANT: User is ADVANCED. If Overall Score >= 90, generate advanced drills. Focus on naturalness, rhythm, connected speech.
      `;
    }

    if (userProfile.accent_reduction_goal) {
      promptInstruction += `
      \nIMPORTANT: User is targeting '${userProfile.accent_reduction_goal}' accent. Evaluate strict adherence.
      `;
    }

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "audio/wav", data: audioBase64 } },
          { text: promptInstruction }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.4
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
      return res.status(500).json({ error: "No response from AI" });
    }

    res.json(JSON.parse(textResponse));
  } catch (err: any) {
    console.error("Gemini Analysis Express Error:", err);
    res.status(500).json({ error: "Audio analysis failed. Please try again." });
  }
});

app.post("/api/generate-tts", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing text for TTS" });
    }

    let client: GoogleGenAI;
    try {
      client = getGemini();
    } catch {
      return geminiUnavailable(res, "generate-tts");
    }

    const response = await client.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) {
      return res.status(500).json({ error: "No TTS audio generated" });
    }
    res.json({ audioData });
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

    const client = getGemini();

    const lessonSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        context: { type: Type.STRING, description: "A very short scenario title (e.g. 'Ordering Coffee')" },
        prompt: { type: Type.STRING, description: "A sentence for the user to practice speaking." }
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

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts: [{ text: "Generate a practice prompt." }] },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: lessonSchema,
        temperature: 0.7
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
      return res.status(500).json({ error: "No response from AI" });
    }

    res.json(JSON.parse(textResponse));
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

    let client: GoogleGenAI;
    try {
      client = getGemini();
    } catch {
      return geminiUnavailable(res, "companion-chat");
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

    const result = await generateCompanionReply(session, targetLanguage, level || 'intermediate', client, transcribedAudio);

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

export const getGeminiClient = () => getGemini();
