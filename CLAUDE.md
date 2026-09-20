# CLAUDE.md — Fluvio Developer Handbook

> For AI coding agents and human contributors: how the codebase is organized, where things live, what conventions to follow, and what tends to break.

---

## Architecture Overview

Fluvio is a **React + Express** app in a single repo. The frontend and backend are served from the same process in development (Vite middleware + Express), and split for production (Vite builds static assets; Express serves them or is deployed as a Vercel serverless function).

```
Browser
  │
  ▼
Vite dev server (dev)  ── or ──  dist/ + Express static (prod)
  │                                       │
  ▼                                       ▼
React 19 SPA (App.tsx + components)   Express 5 API routes (server.ts)
                                              │
                                              ├── OpenAI SDK (analyze, TTS, lesson plan, companion, scenario)
                                              ├── sentenceLibrary.ts (8-language corpus)
                                              ├── scenarios.ts + scenarioService.ts (role-play)
                                              ├── companionChatServer.ts (free chat)
                                              ├── srsService.ts (spaced repetition)
                                              ├── assessmentService.ts (CEFR)
                                              └── storageService.ts (IndexedDB — client only)
```

**Data flow for a practice session:**
1. App.tsx picks a daily sentence via `pickDailySentence` (SRS-aware).
2. User records audio → `blobToBase64` → `analyzeAudio` (geminiService.ts) POSTs to `/api/analyze-audio`.
3. Server: decode base64 → Whisper transcription → GPT-4 analysis (JSON schema) → enrich with synthetic pitch/phoneme/prosody/guide data → return `AnalysisResponse`.
4. Client: `ResultsView` renders score card, waveform, transcript, phoneme errors, prosody, pitch chart, drills, pronunciation guide. Audio playback uses `playPCM` (base64 → AudioContext, 24kHz mono Int16).
5. Session saved to IndexedDB via `storageService.saveSession`. SRS review recorded via `srsService.recordReview`.

**Companion / scenario flow:**
- Free chat: `CompanionChat` → `/api/companion/chat` → `generateCompanionReply` (gpt-4o → gpt-4o-mini → local fallback).
- Scenario: `CompanionChat` with `scenario` prop → `/api/companion/scenario` → `generateScenarioTurn` (gpt-4o → gpt-4o-mini → local fallback). Returns 5-dimension scores. TTS audio is `null`; client fetches `/api/generate-tts` separately to play the AI's response.

---

## Key Files

### Server (Express)

| File | Role | Notes |
|---|---|---|
| `server.ts` | All Express routes, rate limiting, OpenAI client, sanitization, bootstrap | 870 lines — the heart of the backend. Reads `OPENAI_API_KEY`, lazy-inits OpenAI, defines all `/api/*` routes. |
| `src/api/index.ts` | Vercel serverless entry | Re-exports `app` from `../../server.ts`. 10 lines. Vercel uses this as the function entry. |
| `services/sentenceLibrary.ts` | Unified sentence corpus | Imports all 8 language files, casts literal arrays to `Sentence[]`, exports `getSentenceLibrary`, `pickDailySentence`, `searchSentences`, `getSentencesByLevel`, `getSentencesByTopic`. |
| `services/scenarioService.ts` | Scenario turn logic | `generateScenarioTurn` with fallback chain. `localScenarioFallback` provides heuristic 5-dimension scores when no OpenAI. |
| `services/companionChatServer.ts` | Companion chat logic | `generateCompanionReply`, `addCompanionMessage`. Fallback chain + local fallback responses per language/level. |
| `services/srsService.ts` | Spaced repetition | FSRS-style: `loadSRSState`, `saveSRSState`, `recordReview`, `getDueSentences`, `calculateNextInterval`. localStorage key: `slang_srs_state`. |
| `services/assessmentService.ts` | CEFR + dimension scoring | `computeCEFRLevel`, `computeDimensionScores`, `sessionsToNextLevel`. |
| `services/sanitization.ts` | Input sanitization | `safeLabel` (languages/levels), `safeSentence` (reference text). Shared between server and companion chat. |
| `services/audioUtils.ts` | Client-side audio helpers | `blobToBase64`, `playAudioBlob`, `getAudioBuffer`, `playPCM` (base64 PCM → AudioContext). |
| `services/geminiService.ts` | Client proxies | `analyzeAudio`, `generateTTS`, `generateLessonPlan` — all POST to `/api/*`. |
| `services/companionService.ts` | Client companion proxy | `companionChat` POSTs to `/api/companion/chat`. |
| `services/storageService.ts` | IndexedDB | `saveSession`, `getHistory`, `deleteSession`. DB: `slang_db`, store: `sessions`. |

### Frontend (React)

| File | Role | Notes |
|---|---|---|
| `App.tsx` | Root component, state machine | 833 lines. `AppState` enum drives UI. 5 tabs: practice, sentences, companion, proverbs, progress. Onboarding, dark mode, SRS, scenario state all here. |
| `components/ResultsView.tsx` | Analysis results UI | 571 lines. Score card, waveform, transcript, phoneme error list, prosody bars, pitch contour (recharts LineChart), drills, pronunciation guide, confetti for ≥80. |
| `components/CompanionChat.tsx` | Chat UI (free + scenario) | 350 lines. Handles both modes. Scenario mode shows 5-dimension scores, feedback, replay button. Free mode shows corrections. |
| `components/SentenceBrowser.tsx` | Sentence library browser | 207 lines. Search, level/topic filters, grid/list views. |
| `components/Onboarding.tsx` | 5-step onboarding | 247 lines. Language, motivation, level, daily goal. Persists to localStorage. |
| `components/ProgressView.tsx` | Progress dashboard | 363 lines. CEFR badge, radar chart, score trend line, frequent errors bar, recent sessions list. |
| `components/Waveform.tsx` | Canvas waveform | 240 lines. 3 modes: recording animation (RAF sine), static waveform with error highlights, idle. Tap to seek. |
| `components/ComparisonPlayer.tsx` | Dual waveform comparison | 377 lines. Fetches TTS, decodes both waveforms, compares, shows divergence regions, A/B loop playback. |
| `components/PhonemeSelector.tsx` | IPA chart + drills | 137 lines. Vowel/consonant buttons, expansion cards with articulation guides. |
| `components/IPAChart.tsx` | Full IPA chart view | — |
| `components/TranscriptView.tsx` | Live transcript | 68 lines. Confidence-colored word tokens. |
| `components/ScoreCard.tsx` | Radial score card | 46 lines. recharts RadialBarChart. |
| `components/ProverbViewer.tsx` | Proverb list + detail | 191 lines. Fetch from `/api/proverbs/:lang`, random, copy, practice. |

### Data

| File | Role | Notes |
|---|---|---|
| `data/library.ts` | Shared types | `Sentence`, `Proverb`, `CompanionMessage`, `CompanionSession`, `SentenceLibrary`, `ProverbLibrary`. |
| `data/scenarios.ts` | 15 scenarios | `SCENARIOS` array, `filterScenarios`, `getScenarioById`. English, Spanish, French only. |
| `data/phonemes.ts` | Phoneme data | `PHONEMES` array with articulation guides (English, Spanish, Italian). |
| `data/ipaReference.ts` | IPA reference data | — |
| `data/sentences/*.ts` | Sentence corpora | One file per language (e.g. `en_sentences.ts`, `de_sentences.ts`). Each exports `XX_SENTENCES` array + `XX_SENTENCE_COUNT`. |
| `data/sentences/*_proverbs.ts` | Proverb corpora | One file per language. Each exports `XX_PROVERBS` array. |
| `types.ts` | App-level types | `AnalysisResponse`, `AppState`, `UserProfile`, `SessionRecord`, `TranscriptWord`, `CEFRLevel`, `ScenarioResult`, `ArticulationGuide`, etc. |

---

## The 5 App Tabs (App.tsx state)

| Tab | `activeTab` | What it shows |
|---|---|---|
| Practice | `'practice'` | Daily sentence, record button, waveform, live transcript, results view |
| Sentences | `'sentences'` | SentenceBrowser (search/filter/browse) |
| Companion | `'companion'` | CompanionChat (free or scenario mode), scenario selector dropdown |
| Proverbs | `'proverbs'` | ProverbViewer |
| Progress | `'progress'` | ProgressView (history, CEFR, charts) |

`AppState` enum: `IDLE → RECORDING → ANALYZING → RESULTS → ERROR`. The UI renders different components based on this state.

---

## Coding Conventions

### TypeScript

- **ESNext modules, bundler resolution.** `tsconfig.json`: `module: "ESNext"`, `moduleResolution: "bundler"`, `noEmit: true`. Vite and esbuild handle emission.
- **Path alias.** `@/*` → `./`. Import from `@/...` anywhere. Configured in both `tsconfig.json` (paths) and `vite.config.ts` (resolve.alias).
- **Type widening workaround.** `sentenceLibrary.ts` has a comment: TS widens literal array types to `string`. The `asSentence` helper + cast at import site restores the `Sentence[]` contract. When adding new language files, follow the same pattern.
- **No runtime type validation.** OpenAI responses are parsed with `JSON.parse` and trusted. If the schema changes upstream, the client may crash. The `analysisSchema` in `server.ts` is used in the system prompt, not validated at runtime.
- **Enums vs string unions.** `AppState` is a `enum`. Most other types use string unions (`'en' | 'es' | ...`). Be consistent: prefer string unions for public boundaries, enums for internal state machines.

### React

- **Functional components only.** Hooks throughout. No class components.
- **State machine in App.tsx.** `AppState` drives what renders. Don't add ad-hoc booleans for major UI modes; use the state machine.
- **Dark mode.** Controlled by `isDarkMode` in App.tsx state, persisted to `localStorage` key `slang_theme`. Effects toggle `document.documentElement.classList`. Components receive `isDarkMode` as a prop and use Tailwind `dark:` variants.
- **localStorage keys.** Use the `slang_` prefix: `slang_profile`, `slang_onboarded`, `slang_theme`, `slang_srs_state`. Companion sessions: `companion_${language}` (e.g. `companion_English`).
- **IndexedDB.** Used for session history (heavier data: analysis objects + audio blobs). Key `slang_db`, store `sessions`.
- **Tailwind utility classes.** No separate CSS files. Dark mode via `dark:` prefix. Responsive via `sm:`, `md:`, `lg:` breakpoints.
- **Icons.** `lucide-react`. Import named icons.

### Server

- **Rate limiting.** Fixed window, per-IP, in-memory. Configured via `RATE_LIMIT_PER_MIN` env (default 20). Applied to `/api/*`. Cleanup interval unrefs itself.
- **Input sanitization.** All user inputs passed to prompts go through `safeLabel` or `safeSentence`. Don't bypass these.
- **OpenAI client.** Lazy-initialized singleton in `server.ts`. Throws if `OPENAI_API_KEY` is missing. Callers catch and return 500.
- **Fallback chains.** Every AI route has a fallback chain (gpt-4o → gpt-4o-mini → local heuristic). When adding a new AI-dependent feature, include a local fallback so the app degrades gracefully.
- **JSON schema in system prompts.** The analysis route embeds a JSON schema in the system prompt. The model is asked to return `json_object`. The response is parsed with `JSON.parse` — no runtime validation library.
- **TTS audio format.** OpenAI TTS returns MP3; the server collects the stream into a `Buffer` and returns base64. Client plays via `playPCM` which expects 24kHz mono Int16 PCM. **Mismatch risk:** if the TTS format or sample rate changes, playback breaks. The current code assumes the stream is readable via `getReader()` on the body.

### API Design

- All routes under `/api/*`.
- JSON request/response. `express.json({ limit: "8mb" })` middleware.
- Rate limiting applied after JSON parsing.
- Errors return `{ error: string }` with appropriate status codes (400, 404, 429, 500).
- Server exports `app` and `getOpenAIClient` for reuse in `src/api/index.ts`.

---

## Build & Deploy Commands

### Development
```bash
npm install
npm run dev          # Vite dev server + Express middleware, http://localhost:3000
```

### Production build
```bash
npm run build        # Frontend only → dist/
npm run build:node  # Frontend + server bundle → dist/ + api/index.cjs
npm start           # node api/index.cjs (serves dist/ statically in production)
npm run preview      # vite preview
```

### Build details
- `npm run build` → `vite build`. Output: `dist/`.
- `npm run build:node` → `vite build && esbuild src/api/index.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=api/index.cjs && rm -f api/index.cjs.map`.
- `esbuild` bundles the server entry into a single CJS file. `--packages=external` keeps node_modules external. Sourcemaps generated then deleted.

### Deployment (Vercel)
- Entry: `src/api/index.ts` (re-exports Express `app`).
- `server.ts` guards port binding: `if (!process.env.VERCEL) { startServer(); }`. In Vercel, the function is invoked directly.
- Set `OPENAI_API_KEY` in Vercel env vars.
- Build command: `npm run build:node` (or equivalent).
- The Vercel Express integration expects a default export of the app.

---

## TypeScript Notes

### Path alias
```ts
import { getSentenceLibrary } from '@/services/sentenceLibrary';
```
Works in both frontend (Vite) and backend (esbuild) because both configs define the `@` → `.` alias. **Caveat:** `tsconfig.json` paths are for type checking only; the bundler must also resolve them. Both Vite and esbuild configs do, but if you change the alias, update both.

### Type widening in sentenceLibrary.ts
```ts
const asSentence = <T extends readonly any[]>(items: T): T => items;
const EN_SENTENCES_CAST = asSentence(EN) as Sentence[];
```
This is a known workaround for TS widening literal arrays to `string[][]`. When adding a new language, copy this pattern exactly.

### `noEmit: true`
TypeScript does not emit files. Vite handles frontend emission (via `@vitejs/plugin-react`), esbuild handles server emission. Don't expect `.js` files from `tsc`.

### `isolatedModules: true`
Each file must be independently compilable. No cross-file type-only imports that rely on merger. Avoid `enum` merges across files.

### JSX
`jsx: "react-jsx"` — automatic runtime. No need to import `React` for JSX, but components still import `React` for hooks and types.

### `skipLibCheck: true`
Don't rely on library types being perfectly correct. If you hit a type error from a dependency, check whether it's a false positive from a broken `.d.ts`.

### `types: ["node"]`
Only `node` types are included globally. DOM types come from `lib: ["DOM", "DOM.Iterable"]`. If you need other type packages, install their `@types/` packages and reference them.

---

## Common Pitfalls

### 1. OpenAI key missing → silent degradation
Routes catch the missing-key error and return 500 or fall back to local heuristics. Don't assume the AI features work without `OPENAI_API_KEY`. Test with the key set.

### 2. TTS playback assumes 24kHz mono Int16
`playPCM` in `audioUtils.ts` and the inline playback in `App.tsx` both assume 24kHz mono 16-bit PCM. If the TTS model or format changes, audio will sound wrong or silent. The OpenAI TTS-1 model returns MP3; the server converts to base64, and the client decodes the MP3 bytes as if they were PCM. **This works because OpenAI's SDK stream handling returns raw bytes that happen to be decodable this way in the current version — it's fragile.** If TTS breaks, check the stream handling in `server.ts` lines 422–453 and the client `playPCM`.

### 3. JSON.parse without validation
OpenAI responses are parsed with raw `JSON.parse`. If the model returns malformed JSON (even with `response_format: { type: "json_object" }`), the route returns 500. The system prompt includes a schema, but it's not enforced at runtime. If you change the expected response shape, update both the schema in the prompt AND the client-side type/usage.

### 4. SRS state and library desync
`pickDailySentence` in `sentenceLibrary.ts` takes an optional `srsState` Map. In `App.tsx`, the SRS state is reloaded from localStorage when the language changes (line 154). If you modify SRS state outside of `recordReview` (which calls `saveSRSState`), the localStorage copy may be stale. Always use `recordReview` / `resetSentence` / `resetAll` from `srsService.ts` to mutate state.

### 5. Companion session persistence
Companion sessions are stored in `localStorage` under `companion_${language}`. The session is re-initialized when the companion tab is activated (App.tsx lines 159–173). If you change the `CompanionSession` type, old stored sessions may not parse cleanly — the `JSON.parse` is wrapped in try/catch.

### 6. Scenario mode vs free chat mode in CompanionChat
`CompanionChat` handles both modes based on whether `scenario` prop is set. Scenario mode sends to `/api/companion/scenario` and displays scores. Free mode sends to `/api/companion/chat`. The message types differ (`ScenarioMessage` vs `CompanionMessage`). The component uses a union type for display. When modifying message rendering, check both branches.

### 7. Waveform canvas sizing
`Waveform.tsx` and `ComparisonPlayer.tsx` both use fixed canvas dimensions (800×100 and 800×112) scaled via CSS `width: 100%`. The canvas internal resolution doesn't match the display size, which can cause blurriness on high-DPI screens. If visual quality matters, add `devicePixelRatio` scaling.

### 8. App.tsx is large (833 lines)
Most of the application logic lives in `App.tsx`. If you're adding a new feature that touches multiple tabs or state transitions, expect to modify this file. Consider extracting new features into their own components/services rather than adding more to App.tsx.

### 9. Vercel build vs local build
The `build:node` script bundles the server with esbuild. In Vercel, the serverless function uses `src/api/index.ts` directly (Vercel handles the bundling). The esbuild bundle is for standalone Node deployment. Don't assume the esbuild bundle is what runs on Vercel.

### 10. Rate limit in-memory Map
The rate limiter uses an in-memory `Map`. In Vercel serverless, each invocation gets its own memory space, so the rate limiter doesn't share state across invocations. This means rate limiting is per-invocation, not global. For production rate limiting that spans instances, you'd need an external store (Redis, etc.). The current implementation is fine for single-instance deploys.

### 11. Web Speech API availability
`speechRecognition.ts` checks for `webkitSpeechRecognition`. This is Chrome/Edge/Safari only. Firefox doesn't support it. The app handles this gracefully (recording still works; live transcript just doesn't populate), but don't assume live transcription works everywhere.

### 12. Adding a new language
To add a new language, you need:
- Sentence data file in `data/sentences/` (export `XX_SENTENCES` + `XX_SENTENCE_COUNT`)
- Proverb data file in `data/sentences/` (export `XX_PROVERBS`)
- Add to `LANG_CODES` and `LANG_NAMES` in `sentenceLibrary.ts`
- Add to `codeMap` in the relevant server routes (`/api/sentences/:lang`, `/api/proverbs/:lang`, `/api/proverbs/:lang/random`)
- Add to `TARGET_LANGUAGES` in `App.tsx` and `Onboarding.tsx`
- Add sentence/proverb imports in `server.ts`
- Update `getSentenceLibrary` and the proverb route's language switch
- Add pronunciation guide entries in `generatePronunciationGuide` (server.ts) if desired
- Add fallback entries in `LOCAL_FALLBACK_RESPONSES` (companionChatServer.ts) and `LOCAL_FALLBACK` / `HEURISTIC_BASE` (scenarioService.ts)

### 13. `crypto.randomUUID()` availability
Used throughout for IDs. Available in modern browsers and Node 19+. If targeting older Node versions for the server, this may fail — but the current `package.json` has no older Node constraint.

---

## Quick Reference: Data Flows

### Recording → Analysis → Results
```
App.tsx.startRecording()
  → MediaRecorder + SpeechRecognition
  → stopRecording() → blob
  → processRecording(blob)
    → blobToBase64(blob)
    → analyzeAudio(base64, profile, prompt, phoneme)   // POST /api/analyze-audio
      → server: Whisper transcribe → GPT-4 analyze → enrich
    → setAnalysis(result)
    → saveSession(result, blob)                        // IndexedDB
    → recordReview(srsState, sentence, score)          // localStorage
    → setAppState(AppState.RESULTS)
  → ResultsView renders
```

### Companion Chat
```
CompanionChat.handleSend()
  → if scenario: POST /api/companion/scenario
  → else: companionChat(session, text, lang, level)    // POST /api/companion/chat
    → server: generateCompanionReply(session, lang, level, openai)
      → gpt-4o → gpt-4o-mini → local fallback
  → addCompanionMessage × 2
  → onSessionUpdate(updatedSession)
  → localStorage persisted via useEffect
```

### Scenario Role-Play
```
CompanionChat.handleSend() (scenario mode)
  → POST /api/companion/scenario { sessionId, scenarioId, message, targetLanguage, level, messages }
    → server: getScenarioById → generateScenarioTurn(scenario, session, message, openai)
      → gpt-4o → gpt-4o-mini → localScenarioFallback
      → returns { response, translation, scores, feedback, corrected_version, next_prompt }
  → client builds session with user msg + AI msg (scores included)
  → onSessionUpdate
  → if tts_audio: setTimeout → playAISpeech(base64)   // client fetches TTS separately actually
```

Note: scenario route sets `tts_audio: null`. The client in `CompanionChat.handleSend` checks `aiMessage.tts_audio` but the server doesn't populate it — the client would need to call `/api/generate-tts` to get audio. Check if this is intentional or a gap.

---

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes (for AI features) | — | OpenAI API authentication |
| `PORT` | No | 3000 | Server port |
| `RATE_LIMIT_PER_MIN` | No | 20 | Requests per minute per IP |
| `NODE_ENV` | No | — | `production` enables static file serving from `dist/` |
| `VERCEL` | Set by Vercel | — | Skips port binding in `server.ts` |
| `GEMINI_API_KEY` | No | — | Used in `vite.config.ts` define (appears unused in current code) |

---

## Tips for AI Coding Agents

- **Read `server.ts` before modifying any API route.** It's the single source of truth for all endpoints, sanitization, and the OpenAI client setup.
- **Read `App.tsx` before modifying UI flow.** The state machine and tab structure are centralized there.
- **When adding a new AI feature, include a local fallback.** Follow the pattern in `scenarioService.ts` (heuristic scores + local fallback responses) or `companionChatServer.ts` (local fallback per language/level).
- **When modifying types, check both `data/library.ts` and `types.ts`.** `library.ts` has corpus types; `types.ts` has app/analysis types. They sometimes overlap (e.g. `CompanionMessage` is in both).
- **Tailwind dark mode:** every new component that renders text or backgrounds should accept `isDarkMode` and use `dark:` variants. Don't hardcode colors.
- **Test the fallback path.** If you can't set `OPENAI_API_KEY` in your dev environment, the app should still render and allow basic interaction (local fallbacks kick in).
- **IndexedDB is async and error-prone.** Wrap `storageService` calls in try/catch. The current code does this in most places but not all.
- **ESBuild bundle is external-packages.** The server bundle keeps `node_modules` external. If you add a new server dependency, it must be installed in the deployment environment (not just bundled).
