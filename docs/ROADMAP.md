# Fluvio Language — Roadmap

> React 19 · Vite · Express · TypeScript · Tailwind · Vercel  
> 8 target languages · 5000+ sentences · 280 proverbs · AI pronunciation analysis · SRS review

---

## Phase 1 — Completed: Foundation

**Goal:** Ship a working voice-first language practice app with AI pronunciation feedback, a sentence library, and progress tracking.

**Status:** ✅ Done — deployed on Vercel.

### Features
- **Voice recording & AI pronunciation analysis** — MediaRecorder captures WAV audio → base64 → `/api/analyze-audio` (Gemini) returns phoneme-level scores, overall score, and corrections.
- **Live transcription** — Web Speech API (`SpeechRecognition`) streams words in real time during recording; words are annotated with error flags post-analysis.
- **Sentence library** — 5000+ curated sentences across 8 languages, browseable by CEFR level and topic; pick a sentence to practice.
- **IPA phoneme explorer** — Full IPA chart + phoneme selector; drill mode targets a single phoneme with a custom prompt sentence.
- **Progress tracking** — Session history stored in localStorage, viewable with replay (audio + analysis), delete, and review-mode.
- **Onboarding flow** — Language pair selection (14 native × 8 target), level, accent goal, daily goal, motivation.
- **Dark / light theme** — Persisted in localStorage.
- **Express API server** —`/api/analyze-audio`, `/api/generate-tts`, `/api/generate-lesson-plan`, `/api/companion/chat`, all proxied through a single Express app deployed as a Vercel serverless function.

### Key files modified
| File | Role |
|---|---|
| `App.tsx` | Main UI: 5 tabs (Practice, Sentences, Companion, Proverbs, Progress), state orchestration, recording pipeline, SRS integration |
| `server.ts` | Express app: all API routes, rate limiting, input sanitization |
| `src/api/index.ts` | Vercel serverless entry point (reuses `server.ts`) |
| `services/geminiService.ts` | Client-side proxy for `analyzeAudio` and `generateTTS` |
| `services/speechRecognition.ts` | Web Speech API wrapper: `createSpeechRecognition()`, live word polling |
| `services/audioUtils.ts` | `blobToBase64()` for audio serialization |
| `services/storageService.ts` | `saveSession`, `getHistory`, `deleteSession` — localStorage session CRUD |
| `services/srsService.ts` | Simplified FSRS scheduler: `recordReview`, `loadSRSState`, `getDueCount` |
| `services/sentenceLibrary.ts` | `getSentenceLibrary`, `pickDailySentence` — per-language library loading + SRS-aware daily pick |
| `components/Waveform.tsx` | Real-time audio waveform visualization during recording |
| `components/ResultsView.tsx` | Post-analysis results: phoneme scores, IPA chart, transcript with error highlighting, listen-to-native button |
| `components/TranscriptView.tsx` | Live + annotated transcript display |
| `components/IPAChart.tsx` | Interactive IPA chart |
| `components/PhonemeSelector.tsx` | Phoneme drill selector |
| `components/ProgressView.tsx` | Session history with streak/XP, review modal |
| `components/Onboarding.tsx` | First-run language/level/goal setup |
| `components/SentenceBrowser.tsx` | Sentence library browser with filters |
| `components/ScoreCard.tsx` | Score display component |
| `components/ArticulationVisualizer.tsx` | Phoneme articulation visualization |
| `components/ComparisonPlayer.tsx` | Side-by-side audio comparison player |
| `data/library.ts` | Sentence corpus definition + `Sentence` type |
| `data/ipaReference.ts` | IPA chart reference data |
| `data/phonemes.ts` | Phoneme metadata |
| `types.ts` | Shared types: `AppState`, `AnalysisResponse`, `UserProfile`, `SessionRecord`, `CompanionSession`, `TranscriptWord` |
| `package.json` | React 19, Vite 6, Express 5, OpenAI SDK, Recharts, Lucide |

---

## Phase 2 — Completed: Multi-language Expansion

**Goal:** Extend the sentence library and proverbs to all 8 target languages, with per-language data files and IPA references.

**Status:** ✅ Done.

### Features
- **Per-language sentence data files** — `data/sentences/` contains `{lang}_sentences.ts` and `{lang}_proverbs.ts` for: `en`, `es`, `fr`, `de`, `it`, `ja`, `pt`, `zh`.
- **280 proverbs / idioms** — ProverbViewer tab shows culturally relevant sayings per language with translations.
- **IPA reference per language** — phoneme sets differ by language; `data/ipaReference.ts` covers the full chart.
- **Language selector** — Target language dropdown (8 languages) and native language dropdown (14 languages) in the header; switching language reloads the sentence library and resets SRS state.
- **Accent selection** — English-only accent goal selector (General American, British RP, Australian, Neutral International, American Southern).

### Key files modified
| File | Role |
|---|---|
| `data/sentences/en_sentences.ts` | English sentence corpus |
| `data/sentences/es_sentences.ts` | Spanish sentence corpus |
| `data/sentences/fr_sentences.ts` | French sentence corpus |
| `data/sentences/de_sentences.ts` | German sentence corpus |
| `data/sentences/it_sentences.ts` | Italian sentence corpus |
| `data/sentences/ja_sentences.ts` | Japanese sentence corpus |
| `data/sentences/pt_sentences.ts` | Portuguese sentence corpus |
| `data/sentences/zh_sentences.ts` | Chinese sentence corpus |
| `data/sentences/en_proverbs.ts` | English proverbs (280 total across all languages) |
| `data/sentences/es_proverbs.ts` | Spanish proverbs |
| `data/sentences/fr_proverbs.ts` | French proverbs |
| `data/sentences/de_proverbs.ts` | German proverbs |
| `data/sentences/it_proverbs.ts` | Italian proverbs |
| `data/sentences/ja_proverbs.ts` | Japanese proverbs |
| `data/sentences/pt_proverbs.ts` | Portuguese proverbs |
| `data/sentences/zh_proverbs.ts` | Chinese proverbs |
| `data/library.ts` | `Sentence` type + per-language library loader |
| `services/sentenceLibrary.ts` | `getSentenceLibrary(lang)` returns the correct corpus; `pickDailySentence` picks by level + SRS state |
| `App.tsx` | Target + native language selectors, `TARGET_LANGUAGES` / `NATIVE_LANGUAGES` constants |
| `components/ProverbViewer.tsx` | Proverb browsing UI per language |

---

## Phase 3 — In Progress: Scenario Role-Play + TTS

**Goal:** Add real-world scenario role-play (AI plays one role, learner plays the other) with TTS audio feedback and 5-dimension evaluation.

**Status:** 🔄 In progress — functional core, expanding scope.

### What works today
- **Scenario corpus** — `data/scenarios.ts` defines 15 scenarios across English (6), Spanish (4), French (3), at beginner / intermediate / advanced levels. Each scenario has: title, context, `role_play_instructions` for the AI, `expected_vocabulary`, and a 5-dimension `evaluation_rubric`.
- **`generateScenarioTurn()`** — Server-side in `services/scenarioService.ts`: builds a prompt from the scenario + conversation history, calls gpt-4o → gpt-4o-mini → local heuristic fallback. Returns `response`, `translation`, `next_prompt`, `feedback`, `corrected_version`, and heuristic `ScenarioScores` (pronunciation, grammar, vocabulary, fluency, appropriateness).
- **Local fallback** — `LOCAL_FALLBACK` map per language×level gives canned responses when no OpenAI credits are available; `heuristicScores()` gives baseline scores per level.
- **TTS integration** — `generateTTS()` in `services/geminiService.ts` calls `/api/generate-tts` (Gemini TTS); used for native pronunciation previews, word-level click-to-listen, and companion message audio.
- **Companion chat with voice** — `CompanionChat` component supports text + voice input; scenario selector dropdown filters scenarios by language×level via `filterScenarios()`.
- **Scenario session state** — `ScenarioSession` type + `createScenarioSession` / `addScenarioMessage` helpers in `scenarioService.ts`.

### What's missing / next steps within this phase
- **TTS for scenario AI responses** — today the client must separately call `/api/generate-tts` for each AI message; wire it so scenario AI replies come with embedded `tts_audio` base64 so playback is seamless.
- **Scenario coverage expansion** — only English (6), Spanish (4), French (3). Add German, Italian, Japanese, Portuguese, Chinese scenarios (target: 5 per language × 3 levels = 120 scenarios total).
- **Voice-first scenario turns** — scenario chat currently supports voice input via the shared `startRecording` handler, but the transcribed text is sent as a text message. Stream the audio to the scenario turn API so the AI can evaluate pronunciation within the scenario context (not just grammar).
- **Scenario progress / scores** — `ScenarioScores` are computed but not persisted to the progress history but not surfaced in the Progress tab — add a scenario-specific history view.
- **TTS quality** — Gemini TTS is a proxy; consider adding direct Google Cloud TTS / AWS Polly / Azure Speech as fallback providers for lower latency and higher quality, especially for non-English languages.

### Key files modified / created
| File | Role |
|---|---|
| `data/scenarios.ts` | Scenario corpus definition + `Scenario` type + `filterScenarios` / `getScenarioById` |
| `services/scenarioService.ts` | `generateScenarioTurn`, `createScenarioSession`, `addScenarioMessage`, heuristic scoring, local fallback |
| `services/geminiService.ts` | `generateTTS` — used by scenario client for AI message audio |
| `components/CompanionChat.tsx` | Scenario-aware chat UI with scenario selector, voice input button |
| `App.tsx` | Scenario state (`scenarios`, `selectedScenario`), `companionHandlers` wiring voice input into companion |

---

## Phase 4 — Next: Gamification + SRS Refinement

**Goal:** Turn the current streak/XP skeleton into a full engagement layer, and make the SRS scheduler more robust and visible.

**Status:** 📋 Planned — not started.

### Gamification features
- **Leveling system** — Convert XP into levels (e.g. 100 XP = level 2, 250 = level 3, scaling curve). Display level badge in header next to streak. Level unlocks new scenario difficulty tiers and sentence library filters.
- **Achievements / badges** — Milestone-based badges: "First Recording", "7-Day Streak", "50 Sentences Practiced", "Phoneme Master" (drilled all phonemes in a language), "Polyglot" (practiced 3+ languages). Store badge state in localStorage; show badge grid in Progress tab.
- **Daily goal tracker** — `userProfile.daily_goal_minutes` exists but isn't enforced. Track actual minutes practiced per day (sum of recording durations), show a daily progress ring, and award a "Daily Goal Met" badge.
- **Leaderboard (local / optional)** — Anonymous local leaderboard: top scores for the day, week. No account required — uses a random anonymous ID stored in localStorage. Optional future: connect to a real account system.
- **Streak freeze / recovery** — Allow 1 free "streak freeze" per week (skip a day without losing streak). Track in localStorage.

### SRS refinement features
- **Review heat map** — Add a GitHub-contributions-style heat map in the Progress tab showing review activity over the last 12 weeks. Data comes from `SessionRecord` timestamps + SRS `lastReviewed` fields.
- **SRS settings UI** — Expose ease factor minimum (currently 1.3), maximum interval cap (currently 60 days), and new-card interval as user-tweakable settings in a settings modal.
- **Due sentence queue** — The "N due for review" badge exists; wire it to a dedicated review mode that pulls `getDueSentences()` and presents them one by one with the same recording → analysis → SRS record flow.
- **SRS state export / import** — Allow users to export their SRS state as a JSON file and import it on another device (useful for mobile migration in Phase 5).
- **Card-specific decay** — Currently all cards use the same `DEFAULT_EASE = 2.5`. Make initial ease factor language-dependent (e.g. harder phonology → lower initial ease).

### Key files to modify
| File | Changes |
|---|---|
| `App.tsx` | Add `level` computed from XP, badge state, daily minutes tracking, streak freeze |
| `services/srsService.ts` | Add `getDueSentences` usage in review mode, export/import helpers, language-dependent initial ease |
| `services/storageService.ts` | Add badge CRUD, daily minutes aggregation, anonymous ID |
| `components/ProgressView.tsx` | Add heat map, badge grid, level display, daily goal ring |
| `components/Onboarding.tsx` | Optionally add SRS settings (ease floor, max interval) |
| `types.ts` | Add `Badge`, `DailyStats`, `LevelThresholds` types |

---

## Phase 5 — Future: Native Audio + Mobile + Community

**Goal:** Move beyond the browser-only prototype to a real cross-platform product with offline-capable native audio, a mobile app, and community features.

**Status:** 🔭 Future — research / ideation phase.

### Native audio recording
- **Problem today:** Audio uses `MediaRecorder` → Web Speech API for transcription. No raw PCM access, no noise suppression, no pitch/contour analysis beyond what Gemini returns.
- **Phase 5 plan:**
  - Integrate a Web Audio API-based recorder that captures raw PCM + computes MFCC / pitch contour client-side for instant pre-analysis before sending to the server.
  - Add Web Audio API-based noise gate and gain normalization before upload.
  - Explore `MediaRecorder` codec options (Opus in Chrome) for smaller uploads.
  - Eventually: native audio capture via React Native / Capacitor for iOS/Android (see mobile below).

### Mobile app
- **Problem today:** Responsive web app only; no iOS/Android presence, no offline mode, no push notifications for SRS reviews.
- **Phase 5 plan:**
  - **Option A — React Native:** Reuse the TypeScript types, scenario data, and SRS logic. Build a native shell with `react-native-speech`, `react-native-audio`, and a native TTS engine (AVSpeechSynthesizer on iOS, TextToSpeech on Android).
  - **Option B — Capacitor:** Wrap the existing Vite build in Capacitor, add native audio plugins, deploy to App Store / Play Store. Faster path, shares 90% of web code.
  - **Offline mode:** Cache sentence library + proverbs + scenarios in IndexedDB; allow practice without a network connection (analysis queued and synced when online).
  - **Push notifications:** SRS review reminders ("3 sentences due today"), daily goal reminder, streak protection alert.

### Community features
- **Problem today:** Entirely single-user, localStorage-only. No shared content, no social layer.
- **Phase 5 plan:**
  - **User accounts** — minimal auth (email + password, or OAuth Google/Apple). Migrate localStorage state to a backend DB (PostgreSQL via the existing Express server, or a BaaS like Supabase).
  - **Shared sentence packs** — Users can create and publish custom sentence packs (e.g. "Business English for Engineers", "Japanese Travel Surge"). Upvote / download.
  - **Scenario sharing** — Users can author and share custom scenarios (role-play situations) with the community. Rated by usefulness.
  - **Practice partner matching** — Match learners at similar level in the same target language for voice chat sessions (peer-to-peer, moderated). Optional feature, behind a maturity gate.
  - **Public profiles** — Optional public profile showing level, badges, languages practiced, streak. Shareable link.
  - **Leaderboard (global)** — Opt-in global leaderboard by XP / streak / sentences practiced, with weekly resets to keep it fresh.

### Key files to create / modify (Phase 5)
| File | Role |
|---|---|
| `services/audioRecorder.ts` (new) | Web Audio API raw PCM recorder + MFCC/pitch client-side pre-analysis |
| `services/offlineCache.ts` (new) | IndexedDB cache for sentences, proverbs, scenarios, SRS state |
| `services/auth.ts` (new) | Auth helpers (later: integrate with Supabase / own DB) |
| `services/community.ts` (new) | Shared packs, scenarios, profiles API client |
| `mobile/` (new directory) | React Native or Capacitor shell — depends on chosen path |
| `server.ts` | New routes: user accounts, shared packs, scenarios, profiles, global leaderboard |
| `data/` | Community-shared packs stored server-side; local copies in IndexedDB |

---

## Appendix: Status summary

| Phase | Name | Status |
|---|---|---|
| 1 | Foundation | ✅ Completed |
| 2 | Multi-language expansion | ✅ Completed |
| 3 | Scenario role-play + TTS | 🔄 In progress |
| 4 | Gamification + SRS refinement | 📋 Next |
| 5 | Native audio + mobile + community | 🔭 Future |

## Conventions

- **All work happens in `/Users/ossamamokhtar/Fluvio`** (the repo root).
- **Deployment:** `vercel.json` + `src/api/index.ts` → Vercel serverless. Local dev: `npm run dev` (tsx) or `npm run build:node` + `npm start` (esbuild → Node).
- **State:** localStorage keys: `slang_profile`, `slang_onboarded`, `slang_theme`, `slang_srs_state`, `user_streak`, `companion_{lang}`, `linguaflow_*` (legacy migration).
- **API keys:** OpenAI API key is required for `analyze-audio`, `generate-tts`, and `companion/chat` (stored server-side in the Express app env). Without it, scenarios fall back to local heuristics and TTS fails gracefully.
