# Fluvio Language
Fluidity + fluency + forward motion.
AI-powered language learning app — speak into your microphone, get instant pronunciation feedback, practice real-world scenarios with an AI role-play partner, and track your progress over time.

**Live demo:** [vercel.com/…](#deployment)

---

## Project Overview

Slang Language is a full-stack web application that helps learners improve pronunciation and fluency in 8 languages through AI-powered speech analysis, conversational practice, and spaced repetition.

**What it does:**

- **Pronunciation analysis** — Record yourself speaking a sentence; the app transcribes your audio with Whisper, compares it against the reference text using GPT-4, and returns a detailed breakdown: overall score, phoneme errors with timestamps, prosody deviations, pitch contour comparison, prioritized corrective actions, and a pronunciation guide.
- **AI Language Companion** — Chat with an AI partner in your target language. The companion corrects grammar gently, suggests idioms and proverbs, and adapts to your level (beginner / intermediate / advanced).
- **Scenario role-play** — 15 real-world scenarios (ordering at a cafe, job interview, debating remote work, etc.) across English, Spanish, and French. The AI plays a specific role, responds in character with TTS audio, and scores your turn on 5 dimensions: pronunciation, grammar, vocabulary, fluency, and appropriateness.
- **Sentence library** — 1,100 curated sentences per language (8,800 total) tagged by CEFR level (A1–C2) and topic, with translations and IPA hints.
- **Proverbs & idioms** — 35 proverbs per language (280 total) with literal translations, meanings, usage notes, and tags.
- **Spaced repetition (SRS)** — Simplified FSRS algorithm schedules sentence reviews; due counts are surfaced in the UI.
- **Progress tracking** — Session history stored in IndexedDB; CEFR level estimation, score trend charts, dimension radar, and frequent-error breakdown via Recharts.
- **Phoneme drills** — Interactive IPA chart with articulation guides for English, Spanish, Italian, and more.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, TypeScript, Tailwind CSS (via utility classes in components) |
| Icons | lucide-react |
| Charts | recharts |
| Backend | Express 5, TypeScript |
| AI | OpenAI SDK v4 (GPT-4o, GPT-4o-mini, Whisper-1, TTS-1) |
| TTS playback | Web Audio API (AudioContext) — PCM decoding for base64 audio |
| Speech recognition | Web Speech API (`webkitSpeechRecognition`) |
| Storage | localStorage (profile, theme, SRS state), IndexedDB (session history) |
| Build (frontend) | `vite build` |
| Build (server bundle) | `esbuild` — bundles `src/api/index.ts` → `api/index.cjs` |
| Deployment | Vercel (serverless Express via `src/api/index.ts`) |

**TypeScript config notes:**
- `module: "ESNext"`, `moduleResolution: "bundler"`, `noEmit: true` — types checked, emitted by Vite/esbuild.
- Path alias `@/*` → `./` (configured in both `tsconfig.json` and `vite.config.ts`).
- `jsx: "react-jsx"` — automatic JSX runtime.

---

## API Endpoints Reference

All endpoints live under `/api/*`. The Express app is defined in `server.ts` and re-exported for Vercel serverless in `src/api/index.ts`.

### Authentication / Setup

| Requirement | Detail |
|---|---|
| API key | `OPENAI_API_KEY` environment variable (required for analyze-audio, generate-tts, generate-lesson-plan, companion chat, scenario) |
| Fallback chain | When the key is missing or OpenAI returns 429/401/500, routes degrade to local heuristics so the app stays usable |

### POST /api/analyze-audio

Analyzes a recorded utterance against a reference text.

**Request body:**
```
{
  audioBase64: string,        // WAV audio as base64
  userProfile: {
    target_language: string,
    native_language: string,
    level: string,            // beginner | intermediate | advanced
    motivation: string,
    accent_reduction_goal: string
  },
  referenceText: string,      // the sentence the user was supposed to say
  targetPhoneme?: string      // optional phoneme to focus feedback on (max 12 chars)
}
```

**Response (AnalysisResponse):**
```
{
  summary: string,
  overall_score: number,          // 0–100
  pronunciation_score: number,
  intelligibility_score: number,
  prioritized_actions: string[],   // 3 corrective actions
  model_phrase: { text, tempo_percent, ipa_hint },
  drills: { type, items, reps }[],
  explanation_notes: string[],
  phoneme_errors: { phoneme, expected_word, start_ts, end_ts, detected, confidence }[],
  prosody_deviations: { type, word, measure }[],
  pitch_contour: { time, user_pitch, native_pitch }[],
  pronunciation_guide: { segment, tip }[],
  confidence: number
}
```

**Flow:** Decode base64 → Whisper transcription → GPT-4 analysis (JSON schema enforced) → enrich with synthetic pitch contour, phoneme errors, prosody deviations, and pronunciation guide.

---

### POST /api/generate-tts

Generates speech audio for a given text.

**Request body:**
```
{ text: string, voice?: string }   // voice defaults to 'alloy'
```

**Response:**
```
{ audioData: string }              // base64-encoded MP3
```

---

### POST /api/generate-lesson-plan

Generates a personalized practice sentence.

**Request body:**
```
{ userProfile: { target_language, native_language, level, motivation, accent_reduction_goal } }
```

**Response:**
```
{ context: string, prompt: string, fallback?: boolean }
```

**Fallback chain:** gpt-4o → gpt-4o-mini → hardcoded prompts by language/level → ultimate fallback ("The quick brown fox…").

---

### GET /api/sentences/:lang

Returns metadata for a language's sentence library.

**Response:**
```
{ language: string, total_count: number, by_level: Record<string, number>, by_topic: Record<string, number> }
```

---

### GET /api/sentences/:lang/search

Searches sentences by text, topic, or tags.

**Query params:** `lang` (default `English`), `q` (search query)

**Response:**
```
{ sentences: Sentence[], count: number }
```

---

### GET /api/sentences/:lang/random

Picks a random sentence, optionally weighted by level and SRS-due status.

**Query params:** `lang` (default `English`), `level` (default `intermediate`)

**Response:** A single `Sentence` object.

---

### GET /api/proverbs/:lang

Returns all proverbs for a language.

**Response:**
```
{ language: string, proverbs: Proverb[], total_count: number }
```

---

### GET /api/proverbs/:lang/random

Returns a random proverb.

**Response:** A single `Proverb` object.

---

### POST /api/companion/chat

Free-form conversation with the AI companion.

**Request body:**
```
{
  sessionId?: string,
  message: string,
  targetLanguage: string,
  level: string,
  transcribedAudio?: string,
  messages?: CompanionMessage[]
}
```

**Response:**
```
{
  response: string,
  translation: string,
  corrected_text?: string,
  correction_note?: string,
  suggest_proverb?: string,
  proverb_id?: string,
  next_prompt: string,
  session: CompanionSession,
  timestamp: number
}
```

---

### POST /api/companion/scenario

Scenario role-play turn. The AI responds in character, scores the learner's turn on 5 dimensions, and provides a follow-up prompt.

**Request body:**
```
{
  sessionId?: string,
  scenarioId: string,
  message: string,
  targetLanguage: string,
  level: string,
  transcribedAudio?: string,
  messages?: ScenarioMessage[]
}
```

**Response:**
```
{
  response: string,
  translation: string,
  scores: { pronunciation, grammar, vocabulary, fluency, appropriateness, overall },
  feedback: string,
  corrected_version?: string,
  next_prompt: string,
  session: ScenarioSession,
  timestamp: number
}
```

**Note:** TTS audio is `null` in the scenario response; the client fetches `/api/generate-tts` separately to play the AI's response aloud.

---

## Data Structure

### Sentence (`data/library.ts`)
```
{
  id: string,
  language: 'en'|'es'|'fr'|'de'|'it'|'ja'|'pt'|'zh',
  cefr_level: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2',
  topic: string,
  text: string,
  translation: string,
  ipa_hint?: string,
  tags: string[],
  native_audio_available: boolean
}
```

### Proverb (`data/library.ts`)
```
{
  id: string,
  language: 'en'|'es'|'fr'|'de'|'it'|'ja'|'pt'|'zh',
  text: string,
  literal_translation: string,
  meaning: string,
  usage_note: string,
  tags: string[],
  common_variant?: string
}
```

### CompanionMessage / CompanionSession (`data/library.ts`)
```
CompanionMessage {
  id, role: 'user'|'companion'|'ai', text, translation?,
  corrected_text?, correction_note?, scores?,
  feedback?, tts_audio?, timestamp
}

CompanionSession {
  id, language, level, messages: CompanionMessage[],
  started_at, last_active
}
```

### Scenario (`data/scenarios.ts`)
```
{
  id, title, context,
  role_play_instructions,
  target_language: 'English'|'Spanish'|'French',
  level: 'beginner'|'intermediate'|'advanced',
  expected_vocabulary: string[],
  evaluation_rubric: {
    pronunciation, grammar, vocabulary, fluency, appropriateness
  }
}
```

15 scenarios defined in `SCENARIOS` array. `filterScenarios(scenarios, language, level)` and `getScenarioById(scenarios, id)` are the main query helpers.

### AnalysisResponse (`types.ts`)
See `/api/analyze-audio` response shape above. Also includes `AppState` enum (`IDLE | RECORDING | ANALYZING | RESULTS | ERROR`), `UserProfile`, `SessionRecord`, `TranscriptWord`.

### SRSRecord (`services/srsService.ts`)
```
{
  sentenceId, nextReview (timestamp ms), interval (days),
  easeFactor, repetitions, lastReviewed, lastScore
}
```
Persisted to localStorage under key `slang_srs_state`.

---

## Data Counts

| Resource | Per language | Total |
|---|---|---|
| Sentences | 1,100 | 8,800 (8 languages × 1,100) |
| Proverbs | 35 | 280 (8 languages × 35) |
| Scenarios | — | 15 (English, Spanish, French only) |

**Languages:** English, Spanish, French, German, Italian, Japanese, Portuguese, Chinese.

Sentence data files live in `data/sentences/` (e.g. `en_sentences.ts`, `de_sentences.ts`). Proverb files follow the same pattern (e.g. `en_proverbs.ts`, `zh_proverbs.ts`).

---

## Project Structure

```
Slang/
├── App.tsx                          # Root React component — 5 tabs, onboarding, dark mode, SRS, scenario state
├── server.ts                        # Express app: all API routes, rate limiting, OpenAI client, sanitization
├── src/api/index.ts                 # Vercel serverless entry — re-exports app from server.ts
├── services/
│   ├── geminiService.ts             # Client-side fetch proxies for /api/analyze-audio, /api/generate-tts, /api/generate-lesson-plan
│   ├── companionService.ts          # Client-side fetch for /api/companion/chat
│   ├── companionChatServer.ts       # Server: generateCompanionReply, addCompanionMessage
│   ├── scenarioService.ts           # Server: generateScenarioTurn (gpt-4o → gpt-4o-mini → local fallback), heuristic scoring
│   ├── sentenceLibrary.ts           # Unified library: getSentenceLibrary, pickDailySentence, searchSentences, by level/topic
│   ├── srsService.ts                # FSRS-style spaced repetition: load/save state, recordReview, getDueSentences
│   ├── assessmentService.ts         # CEFR band mapping, dimension score computation, sessions-to-next-level estimate
│   ├── storageService.ts            # IndexedDB: saveSession, getHistory, deleteSession
│   ├── audioUtils.ts                # blobToBase64, playAudioBlob, getAudioBuffer, playPCM (base64 → AudioContext)
│   ├── speechRecognition.ts         # Web Speech API wrapper: createSpeechRecognition, TranscriptWord type
│   ├── sanitization.ts              # safeLabel, safeSentence — shared input sanitization
│   └── waveformUtils.ts             # (imported by ComparisonPlayer)
├── components/
│   ├── App.tsx                      # (root, see above)
│   ├── Onboarding.tsx               # 5-step onboarding: language, motivation, level, daily goal
│   ├── SentenceBrowser.tsx          # Search/filter/browse sentence library (grid + list views)
│   ├── CompanionChat.tsx            # Chat UI — free chat + scenario mode, TTS playback, score display, corrections
│   ├── ResultsView.tsx              # Analysis results: score card, waveform, transcript, phoneme errors, prosody, pitch chart, drills, pronunciation guide
│   ├── Waveform.tsx                 # Canvas waveform: recording animation, static waveform with error highlights, playback cursor
│   ├── TranscriptView.tsx           # Live transcript with confidence coloring and word click to play native TTS
│   ├── ComparisonPlayer.tsx         # Dual waveform comparison (user vs native) with divergence regions, A/B loop playback
│   ├── PhonemeSelector.tsx          # IPA chart with articulation guides; drills by phoneme
│   ├── IPAChart.tsx                 # Full IPA chart view
│   ├── ScoreCard.tsx                # Radial progress card (recharts)
│   ├── ProgressView.tsx             # Session history, CEFR level, radar chart, score trends, frequent errors, recent sessions
│   └── ProverbViewer.tsx            # Proverb list + detail view with copy, practice button
├── data/
│   ├── library.ts                   # Shared types: Sentence, Proverb, CompanionMessage, CompanionSession, SentenceLibrary, ProverbLibrary
│   ├── scenarios.ts                 # 15 Scenario definitions + filterScenarios, getScenarioById
│   ├── phonemes.ts                  # PhonemeData[] with articulation guides (English, Spanish, Italian)
│   ├── ipaReference.ts             # (IPA reference data)
│   └── sentences/                   # en/es/fr/de/it/ja/pt/zh_sentences.ts + _proverbs.ts
└── types.ts                         # App-level types: AnalysisResponse, AppState, UserProfile, SessionRecord, TranscriptWord, CEFRLevel, ScenarioResult, ArticulationGuide
```

---

## Getting Started

### Prerequisites

- **Node.js** (ES2022 runtime)
- **OpenAI API key** — set as `OPENAI_API_KEY` environment variable. Without it, speech analysis, TTS, lesson generation, companion chat, and scenario role-play degrade to local fallbacks.

### Install

```bash
cd Slang
npm install
```

### Environment

Create a `.env` (or set in your hosting platform):

```env
OPENAI_API_KEY=sk-...
# Optional:
PORT=3000
RATE_LIMIT_PER_MIN=20
NODE_ENV=development
```

### Run locally (development)

```bash
# Starts Vite dev server + Express middleware in one process
npm run dev
```

The app opens at `http://localhost:3000`. In development, Vite's middleware proxies the React app and the Express API routes share the same server instance (see `server.ts` bootstrap section).

### Build

```bash
# Frontend only (produces dist/)
npm run build

# Frontend + server bundle (produces dist/ + api/index.cjs)
npm run build:node
```

`build:node` runs `vite build` then `esbuild src/api/index.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=api/index.cjs` and strips the sourcemap.

### Start the production server

```bash
npm start
```

This runs `node api/index.cjs`. In production mode (`NODE_ENV=production`), the server serves the `dist/` folder statically and falls back to `index.html` for SPA routes. In development, it injects the Vite dev middleware instead.

### Preview

```bash
npm run preview
```

---

## Deployment

### Vercel (current target)

The project is deployed to Vercel. The serverless entry point is `src/api/index.ts`, which re-exports the Express `app` from `server.ts`. Vercel wraps it as a serverless function; `server.ts` skips binding a port when `process.env.VERCEL` is set (see the `if (!process.env.VERCEL)` guard at the bottom of `server.ts`).

**Setup steps (summary):**
1. Connect the repo to Vercel.
2. Set `OPENAI_API_KEY` in Vercel project environment variables.
3. Configure the build command: `npm run build:node` (or `vite build && esbuild …` per the `build:node` script).
4. Set the output directory to `dist` (frontend) and ensure `api/index.cjs` is included for the serverless function.

The `src/api/index.ts` file exports `app` as the default export, which Vercel's Express integration expects.

### Rate limiting

A fixed-window rate limiter (60s window, default 20 requests/minute per IP, configurable via `RATE_LIMIT_PER_MIN`) is applied to all `/api/*` routes. Exceeded requests get a 429 with a `Retry-After` header.

---

## Key Design Decisions

- **Fallback chain everywhere:** OpenAI-dependent routes try gpt-4o → gpt-4o-mini → local heuristics. The app stays functional without API credits, though quality degrades.
- **Input sanitization:** `safeLabel` (allows letters, numbers, spaces, hyphens, apostrophes) and `safeSentence` (strips `<>{}\\``) are used on all user inputs before they enter prompts or are stored.
- **SRS in localStorage:** No backend persistence for spaced repetition state; it survives page reloads via `slang_srs_state`.
- **Session history in IndexedDB:** Full analysis results and audio blobs are stored client-side in `slang_db` / `sessions` store.
- **Scenario TTS is separate:** The scenario route returns `tts_audio: null`; the client calls `/api/generate-tts` to play the AI's response. This keeps the scenario payload light and reuses the TTS endpoint.

---

## License

Private project.
