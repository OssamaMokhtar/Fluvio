# Fluvio — Architecture & Status

> Status: AUTHORED · Updated 2026-09-23 · Owner: Ossama Mokhtar

**Purpose.** One place that says what Fluvio is, what is built vs designed, and what the honest deployment state is. Fluvio's README has drifted between versions; this doc is the canonical statement.

---

## What Fluvio is

A React + Express AI language learning app. It lives in the **Fluvio** repo but the README and some docs still reference "Slang" as the project name in places. The canonical name is **Fluvio**.

## What Fluvio does (real, built, shipped)

1. **Pronunciation analysis** — Record yourself speaking a sentence; the app transcribes your audio with Whisper, compares it against the reference text using GPT-4, and returns a detailed breakdown: overall score, phoneme errors with timestamps, prosody deviations, pitch contour comparison, prioritized corrective actions, and a pronunciation guide.
2. **AI Language Companion** — Chat with an AI partner in your target language. The companion corrects grammar gently, suggests idioms and proverbs, and adapts to your level (beginner / intermediate / advanced).
3. **Scenario role-play** — 15 real-world scenarios (ordering at a cafe, job interview, debating remote work, etc.) across English, Spanish, and French. The AI plays a specific role, responds in character with TTS audio, and scores your turn on 5 dimensions: pronunciation, grammar, vocabulary, fluency, and appropriateness.
4. **Sentence library** — ~1,100 curated sentences per language (8,800 total) tagged by CEFR level (A1–C2) and topic, with translations and IPA hints.
5. **Proverbs & idioms** — 35 proverbs per language (280 total) with literal translations, meanings, usage notes, and tags.
6. **Spaced repetition (SRS)** — Simplified FSRS algorithm schedules sentence reviews; due counts are surfaced in the UI.
7. **Progress tracking** — Session history stored in IndexedDB; CEFR level estimation, score trend charts, dimension radar, and frequent-error breakdown via Recharts.
8. **Phoneme drills** — Interactive IPA chart with articulation guides for English, Spanish, Italian, and more.

## What Fluvio does not do (honest gaps)

- **Pitch contour and prosody deviations are synthetic, not measured.** The analysis pipeline enriches results with synthetic pitch/phoneme/prosody data. These fields are described in the README as if they were measured from the user's real audio. They are not — they are generated as part of the enrichment step. This is a known accuracy gap; documenting it here rather than leaving reviewers to find it.
- **TTS playback assumes 24kHz mono Int16 PCM.** The client decodes OpenAI TTS MP3 bytes as if they were PCM. This works in the current SDK version but is fragile. If TTS breaks, check `server.ts` lines 422–453 and the client `playPCM`.
- **JSON.parse without validation.** OpenAI responses are parsed with raw `JSON.parse`. If the model returns malformed JSON, the route returns 500. The system prompt includes a schema, but it's not enforced at runtime.
- **Rate limiting is per-invocation in Vercel.** The in-memory Map means each serverless invocation gets its own rate limiter state. For global rate limiting you'd need an external store.

## What is designed but not built

- **More scenarios for German/Italian/Portuguese/Japanese/Chinese.** Sentence + proverb data exists; scenario authoring (context + role-play instructions + rubric) is a separate content task. v1 ships the 15 scenarios that exist.
- **User accounts / authentication / cloud sync.** v1 is local-only.
- **Offline-first (full).** TTS and AI analysis require network. The heuristic analysis path works without OpenAI credits, but TTS and the OpenAI analysis path do not work fully offline. "Offline mode" means "degraded to heuristics," not "fully offline."
- **Mobile app shell.** Roadmap item, not built.

## Languages (honest count)

**8 languages:** English, Spanish, French, German, Italian, Japanese, Portuguese, Chinese.

The README lead says "13 languages" in one place and "8 languages" in another. The project supports **8 languages**. Scenarios cover only English (8), Spanish (4), and French (4) — 15 total.

## Deployment

**Live on Vercel:** `https://slang-e6mm37v73-ossamamokhtars-projects.vercel.app` — HTTP 200 confirmed.

**Note:** The deployment URL uses the "slang" subdomain (from the repo's earlier name). The canonical project name is Fluvio.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 6, TypeScript, Tailwind CSS |
| Backend | Express 5, TypeScript |
| AI | OpenAI SDK v4 (GPT-4o, GPT-4o-mini, Whisper-1, TTS-1) |
| TTS playback | Web Audio API (AudioContext) — PCM decoding for base64 audio |
| Speech recognition | Web Speech API (`webkitSpeechRecognition`) |
| Storage | localStorage (profile, theme, SRS state), IndexedDB (session history) |
| Build (frontend) | `vite build` |
| Build (server bundle) | `esbuild` — bundles `src/api/index.ts` → `api/index.cjs` |
| Deployment | Vercel (serverless Express via `src/api/index.ts`) |

## CI

GitHub Actions workflow (`ci.yml`): Node 22, typecheck + no-@ts-nocheck check + unit/contract tests + documented-claims verification + build + server boot check + dependency audit. All steps fail the build. Runs on every push and PR.

## Key Design Decisions

- **Fallback chain everywhere:** OpenAI-dependent routes try gpt-4o → gpt-4o-mini → local heuristics. The app stays functional without API credits, though quality degrades.
- **Input sanitization:** `safeLabel` (allows letters, numbers, spaces, hyphens, apostrophes) and `safeSentence` (strips `<>{}\\``) are used on all user inputs before they enter prompts or are stored.
- **SRS in localStorage:** No backend persistence for spaced repetition state; it survives page reloads via `slang_srs_state`.
- **Session history in IndexedDB:** Full analysis results and audio blobs are stored client-side in `slang_db` / `sessions` store.
- **Scenario TTS is separate:** The scenario route returns `tts_audio: null`; the client calls `/api/generate-tts` to play the AI's response. This keeps the scenario payload light and reuses the TTS endpoint.

---

Ossama Mokhtar · Dubai, UAE
