# Slang Language — Architecture & Product Roadmap

**Live URL:** https://slang-d36venps9-ossamamokhtars-projects.vercel.app  
**Last updated:** 2026-09-11

---

## 1. Architecture Overview

### 1.1 System Layers

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                       │
│  React 19 + TypeScript + Tailwind + Vite + recharts          │
│  App.tsx (677 lines) — tab router, state, orchestration      │
│  components/ — UI primitives (Waveform, ResultsView, etc.)   │
│  services/geminiService.ts — API client proxy (fetch calls)  │
│  services/storageService.ts — IndexedDB persistence           │
│  services/companionClient.ts — session helpers                │
└──────────────────────────┬─────────────────────────────────────┘
                           │  fetch('/api/*')  HTTP/JSON
┌──────────────────────────┼─────────────────────────────────────┐
│                     API GATEWAY (Vercel Serverless)           │
│  api/index.cjs — bundled server (1.1 MB, esbuild output)     │
│  src/api/index.ts — entry: export { app as default }         │
│  server.ts (726 lines) — Express 5 + OpenAI SDK              │
│  vercel.json — buildCommand, outputDirectory, functions      │
└──────────────────────────┬─────────────────────────────────────┘
                           │  OpenAI SDK (v4.104.0)
┌──────────────────────────┼─────────────────────────────────────┐
│                  EXTERNAL SERVICES                            │
│  OpenAI API: Whisper (ASR) + GPT-4o (analysis/chat/lessons) │
│             + tts-1 (TTS audio)                              │
│  (Fallback chain: gpt-4o → gpt-4o-mini → local heuristic)   │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow (Practice Session)

```
User speaks (MediaRecorder → Blob)
    │
    ▼
blobToBase64(blob) ──► analyzeAudio(base64, profile, prompt, phoneme)
    │                         │
    │                         ▼
    │              POST /api/analyze-audio
    │                         │
    │              ┌──────────┼──────────┐
    │              ▼          ▼          ▼
    │         Whisper      GPT-4o    Synthetic
    │        (transcribe)  (analyze) (enrichment)
    │              │          │          │
    │              └──────────┼──────────┘
    │                         ▼
    │              AnalysisResponse (JSON)
    │                         │
    │              ┌──────────┼──────────┐
    │              ▼          ▼          ▼
    │         saveSession  ResultsView  ComparisonPlayer
    │        (IndexedDB)   (render)    (TTS playback)
    │
    ▼
Session saved to IndexedDB (id, timestamp, scores, audioBlob, phoneme_errors)
```

### 1.3 File Inventory (by responsibility)

| Layer | File | Lines | Purpose |
|---|---|---|---|
| **UI Shell** | `App.tsx` | 677 | Tab router, state, onboarding, recording flow, profile |
| **UI Components** | `components/Waveform.tsx` | — | Audio waveform visualization with error highlighting |
| | `components/ResultsView.tsx` | 522 | Post-analysis results: scores, waveform, errors, pitch chart, drills |
| | `components/ComparisonPlayer.tsx` | 152 | A/B audio loop (user vs native TTS) |
| | `components/ScoreCard.tsx` | 46 | Radial score gauge (recharts) |
| | `components/ProgressView.tsx` | 278 | Score history line chart, frequent errors bar chart, session list |
| | `components/PhonemeSelector.tsx` | — | Phoneme drill picker (currently empty data) |
| | `components/IPAChart.tsx` | — | IPA reference chart |
| | `components/ArticulationVisualizer.tsx` | 60 | SVG tongue position diagram |
| | `components/SentenceBrowser.tsx` | — | Sentence library search/filter UI |
| | `components/CompanionChat.tsx` | 196 | Chat UI for AI companion |
| | `components/ProverbViewer.tsx` | — | Proverb browser |
| | `components/Onboarding.tsx` | — | Profile setup flow |
| **API Client** | `services/geminiService.ts` | 82 | `analyzeAudio()`, `generateTTS()`, `generateLessonPlan()` — fetch proxies |
| | `services/audioUtils.ts` | 94 | `blobToBase64()`, `playPCM()`, `getAudioBuffer()`, visualizer data |
| | `services/storageService.ts` | 91 | IndexedDB: `saveSession()`, `getHistory()`, `deleteSession()` |
| | `services/companionClient.ts` | — | Client-side session helpers |
| | `services/companionService.ts` | — | Client-side companion API wrapper |
| | `services/sanitization.ts` | — | `safeLabel()`, `safeSentence()` — prompt injection defense |
| **Server** | `server.ts` | 726 | Express app, all API routes, OpenAI SDK, TTS stream reader, rate limiting |
| | `src/api/index.ts` | — | Entry point: imports app from `../../server.ts`, exports `{ app as default }` |
| | `services/companionChatServer.ts` | 200 | `generateCompanionReply()` with fallback chain, `addCompanionMessage()` |
| | `services/sentenceLibrary.ts` | 92 | `getSentenceLibrary()`, `pickDailySentence()`, `searchSentences()` — unifies EN/ES/FR |
| **Data** | `data/library.ts` | — | Core interfaces: `Sentence`, `Proverb`, `CompanionMessage`, `CompanionSession` |
| | `data/sentences/en_sentences.ts` | 1,100 entries | English sentence corpus |
| | `data/sentences/es_sentences.ts` | 1,140 entries | Spanish sentence corpus |
| | `data/sentences/fr_sentences.ts` | 1,117 entries | French sentence corpus |
| | `data/sentences/en_proverbs.ts` | 35 entries | English proverbs |
| | `data/sentences/es_proverbs.ts` | 35 entries | Spanish proverbs |
| | `data/sentences/fr_proverbs.ts` | 35 entries | French proverbs |
| | `data/phonemes.ts` | 296 | 16 phonemes (EN+ES+IT) with `PhonemeData` incl. ArticulationGuide |
| | `data/ipaReference.ts` | 178 | Full IPA chart data + `IPA_CONSONANT_MAP` grid |
| **Types** | `types.ts` | 95 | Re-exports + `AnalysisResponse`, `SessionRecord`, `UserProfile`, `PhonemeError`, `ProsodyDeviation`, `ArticulationGuide` |

---

## 2. Dependency Graph (Feature → Building Blocks)

### 2.1 What Exists Today (green = ready to use)

```
✅ INDEXEDDB (storageService.ts)
   └── saveSession(), getHistory(), deleteSession()
   └── SessionRecord: id, timestamp, overall_score, pronunciation_score,
       intelligibility_score, phoneme_errors[], target_phoneme, full_analysis,
       audioBlob

✅ ANALYSIS RESPONSE TYPE (types.ts)
   └── AnalysisResponse: summary, overall_score, pronunciation_score,
       intelligibility_score, prioritized_actions[], model_phrase{x,text,tempo,ipa},
       drills[], explanation_notes[], phoneme_errors[], prosody_deviations[],
       pitch_contour[], pronunciation_guide[], confidence

✅ UTILITY FUNCTIONS (audioUtils.ts)
   └── blobToBase64(blob) → base64 string
   └── playPCM(base64) → plays TTS audio via AudioContext
   └── getAudioBuffer(blob) → AudioBuffer for visualization

✅ TTS ENDPOINT (server.ts / geminiService.ts)
   └── POST /api/generate-tts { text } → { audioData: base64 }
   └── Client: generateTTS(text) → base64 string

✅ ANALYSIS ENDPOINT (server.ts / geminiService.ts)
   └── POST /api/analyze-audio { audioBase64, userProfile, referenceText, targetPhoneme }
   └── Client: analyzeAudio(base64, profile, prompt, phoneme) → AnalysisResponse

✅ LESSON PLAN ENDPOINT (server.ts / geminiService.ts)
   └── POST /api/generate-lesson-plan { userProfile }
   └── Client: generateLessonPlan(profile) → { context, prompt }

✅ COMPANION ENDPOINT (server.ts / companionChatServer.ts)
   └── POST /api/companion/chat { sessionId, message, targetLanguage, level, messages }
   └── Fallback chain: gpt-4o → gpt-4o-mini → local heuristic
   └── Client: CompanionChat.tsx handles send/receive

✅ SENTENCE LIBRARY (sentenceLibrary.ts)
   └── getSentenceLibrary(lang) → SentenceLibrary { language, sentences[], total_count, by_level, by_topic }
   └── pickDailySentence(lib, level) → Sentence
   └── searchSentences(lib, query) → Sentence[]
   └── EN/ES/FR corpora: 1,100 / 1,140 / 1,117 sentences

✅ PROVERBS (server.ts routes)
   └── GET /api/proverbs/:lang → { total_count, proverbs[] }

✅ PHONEME DATA (data/phonemes.ts)
   └── PHONEMES: 16 PhonemeData entries (EN: θ ð r l v w æ i: ɪ ʊ, ES: r rr x ɲ, IT: ʎ ɲ ts)
   └── Each has: symbol, label, prompt, guide: ArticulationGuide, category, place, manner, language

✅ ARTICULATION GUIDE TYPE (types.ts)
   └── ArticulationGuide: tongue_height, tongue_backness, lip_shape, airflow, description

✅ ARTICULATION VISUALIZER (components/ArticulationVisualizer.tsx)
   └── Renders SVG tongue position from ArticulationGuide
   └── Ready to use — just needs a guide passed in

✅ IPA REFERENCE (data/ipaReference.ts)
   └── IPA_REFERENCE: 120+ IPA symbols with name, example, description, voice
   └── IPA_CONSONANT_MAP: grid mapping place+manner → symbols
   └── Ready for IPAChart component

✅ SCORE CARD (components/ScoreCard.tsx)
   └── Radial bar chart (recharts) — takes score, label, color
   └── Ready to use

✅ COMPARISON PLAYER (components/ComparisonPlayer.tsx)
   └── A/B loop: plays user audio, then fetches TTS for modelText, plays both in sequence
   └── Uses geminiService.generateTTS() + audioUtils.playPCM()
   └── Ready to use — already rendered in ResultsView

✅ RESULTS VIEW (components/ResultsView.tsx)
   └── Full results UI: scores, waveform with error markers, phoneme errors list,
       prosody bars, pitch contour chart, comparison player, score cards,
       prioritized actions, pronunciation guide, drills
   └── Already wired to AnalysisResponse type

✅ PROGRESS VIEW (components/ProgressView.tsx)
   └── Score history line chart, frequent errors bar chart, recent sessions list
   └── Uses SessionRecord[] — ready to accept enriched records
```

### 2.2 Missing / Incomplete (what each top-5 feature needs)

---

#### Feature 1: Native-vs-User Audio Comparison Player (Waveform Overlay)

**Status: Partially built — ComparisonPlayer exists but lacks waveform overlay**

Current: `ComparisonPlayer.tsx` does A/B sequential playback (user → wait → TTS → loop). No waveform overlay, no synchronized visual comparison.

**What's needed:**

| Layer | New/Modified | Dependency |
|---|---|---|
| `audioUtils.ts` | `decodeBase64ToAudioBuffer(base64, sampleRate)` — decode TTS base64 to AudioBuffer | ✅ `decodeBase64()` already exists |
| `audioUtils.ts` | `getWaveformData(audioBuffer, numPoints?)` — extract amplitude envelope as number[] | ✅ `getAudioBuffer()` already exists |
| `components/ComparisonPlayer.tsx` | Replace two empty boxes with dual waveform canvas (user waveform + native waveform overlaid) | `getWaveformData()` |
| `components/ComparisonPlayer.tsx` | Synchronized playback: two AudioBuffers played through one AudioContext with shared currentTime | `decodeBase64ToAudioBuffer()` |
| `components/ComparisonPlayer.tsx` | Per-segment similarity highlight: diff user vs native amplitude, highlight divergence regions | both waveform data arrays |
| `server.ts` | No change — TTS endpoint already returns base64 | ✅ existing |

**New file:** `services/waveformUtils.ts` — `getWaveformData()`, `compareWaveforms()`, `detectDivergenceRegions()`

---

#### Feature 2: AI Conversation Role-Play with Real-World Scenarios

**Status: Not built — CompanionChat exists but is free-form chat only**

Current: `CompanionChat.tsx` sends user text to `/api/companion/chat`, gets back a reply. No scenario mode, no evaluation rubric, no TTS for AI responses.

**What's needed:**

| Layer | New/Modified | Dependency |
|---|---|---|
| `data/scenarios.ts` (NEW) | Scenario corpus: `{ id, title, context, role_play_instructions, target_language, level, expected_vocabulary[], evaluation_rubric }` | — |
| `services/companionChatServer.ts` | `generateScenarioReply()` — variant of `generateCompanionReply()` with scenario system prompt + evaluation rubric in output | ✅ `generateCompanionReply()` pattern |
| `server.ts` | New route `POST /api/companion/scenario` — accepts scenarioId + user audio/transcript, returns `{ response, tts_audio?, scores: { pronunciation, grammar, vocabulary, fluency, appropriateness }, feedback, corrected_version }` | ✅ existing route patterns |
| `components/CompanionChat.tsx` | Add scenario selector modal/panel; toggle between "Free Chat" and "Scenario Practice" mode | ✅ existing UI |
| `components/CompanionChat.tsx` | When scenario mode active: show scenario context card, render AI response as TTS audio player (not just text), show 5-dimension score breakdown after each exchange | `generateTTS()` client |
| `types.ts` | Extend `CompanionReplyResult` or create `ScenarioResult` type with scores | — |
| `geminiService.ts` | `generateScenarioTTS(text)` or reuse `generateTTS()` | ✅ existing |

**New files:** `data/scenarios.ts`, `types/scenario.ts` (or extend types.ts)

---

#### Feature 3: CEFR Proficiency Score + Progress Dashboard (ELSA-style EPS)

**Status: Not built — ProgressView shows raw scores, no CEFR mapping**

Current: `ProgressView.tsx` shows average score, best score, score history line chart. No CEFR band, no IELTS equivalent, no per-dimension radar, no EPS trend.

**What's needed:**

| Layer | New/Modified | Dependency |
|---|---|---|
| `types.ts` | Add `CEFRBand` type: `{ band: 'A1'..'C2', description, ieltsEquivalent?, minScore, maxScore }` | — |
| `services/assessmentService.ts` (NEW) | `computeCEFRLevel(analysis: AnalysisResponse): CEFRBand` — map scores to CEFR band using rubric | ✅ `AnalysisResponse` type |
| `services/assessmentService.ts` (NEW) | `computeDimensionScores(analysis): { pronunciation, fluency, grammar, vocabulary, intonation }` — extract per-dimension from analysis | ✅ `AnalysisResponse` fields |
| `storageService.ts` | Extend `SessionRecord` to include `cefrBand`, `dimensionScores` (or compute on-the-fly from `full_analysis`) | ✅ existing saveSession |
| `components/ProgressView.tsx` | Add CEFR badge (big "B1" with description), IELTS equivalent, radar chart of dimension scores, trend line with CEFR band thresholds | `computeCEFRLevel()`, `computeDimensionScores()` |
| `components/ProgressView.tsx` | Show "X sessions to reach next level" estimate | session history + CEFR mapping |
| `components/ScoreCard.tsx` | Reuse existing radial gauge for per-dimension scores | ✅ ready |

**New file:** `services/assessmentService.ts`

---

#### Feature 4: Spaced Repetition Sentence Review (SRS for 1,100-sentence library)

**Status: Not built — `pickDailySentence()` is random-by-level only**

Current: `sentenceLibrary.ts:pickDailySentence()` filters by CEFR level then picks random. No review schedule, no forgetting curve, no "due for review" concept.

**What's needed:**

| Layer | New/Modified | Dependency |
|---|---|---|
| `data/srsState.ts` (NEW) | In-memory + localStorage SRS state: `Map<sentenceId, SRSRecord>` where `SRSRecord = { nextReview, interval, easeFactor, repetitions, lastScore }` | — |
| `services/srsService.ts` (NEW) | `getSRSReviewState(sentenceId)` / `recordReview(sentenceId, score)` / `getDueSentences(library, now)` / `pickNextSentence(library, level, srsState)` | `sentenceLibrary.ts` |
| `services/srsService.ts` (NEW) | FSRS or SM-2 algorithm implementation (FSRS preferred — modern, used by Anki 2.15+) | — |
| `sentenceLibrary.ts` | Add `pickNextSentence(library, level, srs?)` — checks due reviews first, then falls back to `pickDailySentence()` | `srsService.ts` |
| `App.tsx` | Initialize SRS state from localStorage on mount; pass `srsState` to sentence picker | `srsService.ts` |
| `App.tsx` | After each session: `recordReview(sentenceId, overall_score)` | `srsService.ts` |
| UI | Show "N sentences due for review" badge in Practice header | `srsService.ts` |

**Algorithm choice:** FSRS (Free Spaced Repetition Scheduler) — the modern standard, open-source, used by Anki. Simpler to implement than SM-2 and more accurate. Parameters: `w` vector (memory state), `review` function takes `(previousInterval, previousEase, quality)` → `(newInterval, newEase)`.

**New files:** `services/srsService.ts`, `data/srsState.ts` (or keep state in localStorage + in-memory cache)

---

#### Feature 5: Real-Time Transcription + Inline Correction During Recording

**Status: Not built — recording shows waveform only, no transcript**

Current: `App.tsx` records audio → `processRecording()` → sends to `/api/analyze-audio` → renders `ResultsView` with transcript. No live feedback during recording.

**What's needed:**

| Layer | New/Modified | Dependency |
|---|---|---|
| `services/speechRecognition.ts` (NEW) | Wrapper around browser `webkitSpeechRecognition` / `SpeechRecognition` API — `start()`, `stop()`, `onResult` callback, `interimResults: true` | Browser APIs (free, no API key) |
| `App.tsx` | During recording: start SpeechRecognition alongside MediaRecorder; display live transcript as words appear; color-code by confidence | `speechRecognition.ts` |
| `App.tsx` | After recording stops: send audio to `/api/analyze-audio`; overlay corrections on the same transcript (mispronounced words → red, grammar errors → underline, hover → explanation) | `analyzeAudio()` |
| `components/TranscriptView.tsx` (NEW) | Renders a transcript with inline annotations: word-level error highlights, clickable words to hear native TTS, hover tooltips with correction explanation | `generateTTS()` client |
| `types.ts` | Add `TranscriptWord` type: `{ word, start, end, confidence, isError, errorType?, correction? }` | — |
| `server.ts` | Optional: enrich analyze-audio response with word-level timestamps aligned to transcript (currently Whisper gives transcript, but word-level timing may need extraction) | Whisper output format |

**Implementation note:** Browser SpeechRecognition API gives interim results for free — no API cost. It's not as accurate as Whisper but good enough for live display. The real analysis still happens server-side via Whisper + GPT-4o after recording stops.

**New files:** `services/speechRecognition.ts`, `components/TranscriptView.tsx`

---

## 3. Feature Dependency Graph (What Blocks What)

```
FEATURE 1: Audio Comparison Player (Waveform Overlay)
├── Requires: getWaveformData() [NEW - services/waveformUtils.ts]
├── Requires: decodeBase64ToAudioBuffer() [NEW - audioUtils.ts]
├── Requires: dual AudioBuffer synchronized playback [NEW - ComparisonPlayer.tsx]
└── BLOCKS NOTHING — can ship standalone
   └── Enhances: Feature 2 (scenario mode uses TTS + comparison)
   └── Enhances: Feature 5 (transcript view uses native TTS playback)


FEATURE 2: AI Conversation Role-Play with Scenarios
├── Requires: Scenario corpus data [NEW - data/scenarios.ts]
├── Requires: generateScenarioReply() [NEW - companionChatServer.ts]
├── Requires: POST /api/companion/scenario route [NEW - server.ts]
├── Requires: Scenario UI mode in CompanionChat.tsx [MODIFY]
├── Requires: TTS playback for AI responses [REUSE - generateTTS()]
├── Requires: 5-dimension score display [REUSE - ScoreCard.tsx]
└── DEPENDS ON: Feature 1 (comparison player for replaying AI audio vs user audio)
   └── Can ship v1 without comparison — just TTS playback + score display


FEATURE 3: CEFR Proficiency Score + Progress Dashboard
├── Requires: computeCEFRLevel() [NEW - services/assessmentService.ts]
├── Requires: computeDimensionScores() [NEW - services/assessmentService.ts]
├── Requires: CEFR band type [NEW - types.ts or assessmentService.ts]
├── Requires: ProgressView enhancements [MODIFY]
└── BLOCKS NOTHING — can ship standalone
   └── Enhances: Feature 4 (SRS uses CEFR level for sentence selection)
   └── Enhances: Feature 2 (scenario mode shows CEFR-aligned feedback)


FEATURE 4: Spaced Repetition Sentence Review
├── Requires: SRS algorithm (FSRS/SM-2) [NEW - services/srsService.ts]
├── Requires: SRS state persistence [NEW - localStorage + in-memory]
├── Requires: pickNextSentence() with review priority [MODIFY - sentenceLibrary.ts]
├── Requires: "N due for review" badge [MODIFY - App.tsx UI]
└── DEPENDS ON: Feature 3 (CEFR level determines which sentences are appropriate for review)
   └── Can ship v1 with level-only scheduling (no SRS) — just prioritize weak sentences


FEATURE 5: Real-Time Transcription + Inline Correction
├── Requires: Browser SpeechRecognition wrapper [NEW - services/speechRecognition.ts]
├── Requires: Live transcript display during recording [MODIFY - App.tsx]
├── Requires: TranscriptView component with inline annotations [NEW]
├── Requires: Word-level error data from analyze-audio [MODIFY - server.ts optional]
└── DEPENDS ON: Feature 1 (clicking a word plays native TTS — ComparisonPlayer logic)
   └── DEPENDS ON: Feature 2 (scenario mode uses same transcript+correction UX)
   └── Can ship v1 with post-recording correction overlay only (no live transcription)
```

---

## 4. Prioritized Implementation Order

### Why this order?

The graph above shows dependencies. The practical order also considers: (a) what gives the biggest user-facing impact first, (b) what's easiest to ship as a standalone improvement, (c) what creates the foundation others build on.

### Phase 1 — Ship standalone wins (no new API endpoints, minimal risk)

**These can be built and shipped independently. They enhance existing UI without touching the server.**

#### P1.1 — Audio Comparison Player with Waveform Overlay
**Priority: 🔴 CRITICAL** (top user-facing impact, visual differentiation)

Why first: It's the most visually impressive feature, works entirely client-side (no server changes), and reuses existing TTS + audio infrastructure. The `ComparisonPlayer` component already exists — it just needs the waveform overlay and synchronized playback.

Files to touch:
- `services/audioUtils.ts` — add `decodeBase64ToAudioBuffer()`, `getWaveformData()`
- `services/waveformUtils.ts` (NEW) — `compareWaveforms()`, `detectDivergenceRegions()`
- `components/ComparisonPlayer.tsx` — replace empty boxes with dual waveform canvas, synchronized playback
- `App.tsx` — no change needed (ComparisonPlayer already rendered in ResultsView)

Estimated complexity: Medium — audio visualization is well-trodden ground. The synchronized playback is the main engineering task.

#### P1.2 — CEFR Proficiency Score + Progress Dashboard
**Priority: 🔴 CRITICAL** (measurable progress = retention driver)

Why second: It transforms the Progress tab from "here's your scores" to "here's your actual CEFR level and how it's changing." Uses entirely client-side computation. No new API endpoints.

Files to touch:
- `services/assessmentService.ts` (NEW) — `computeCEFRLevel()`, `computeDimensionScores()`, CEFR band definitions
- `components/ProgressView.tsx` — add CEFR badge, radar chart, IELTS equivalent, "X sessions to next level"
- `types.ts` — optional: add `CEFRBand` type, or define in assessmentService

Estimated complexity: Low-Medium — CEFR mapping is a rubric (if score > X and pronunciation > Y → B1), radar chart is recharts (already a dependency).

---

### Phase 2 — Build the foundation others depend on

#### P2.1 — Spaced Repetition Sentence Review (SRS)
**Priority: 🟡 HIGH** (retention engine)

Why third: SRS makes the 1,100-sentence library a real curriculum instead of a browseable list. It's purely client-side + localStorage. Once built, `pickDailySentence()` becomes `pickNextSentence()` with review priority — and every other feature that picks sentences benefits.

Files to touch:
- `services/srsService.ts` (NEW) — FSRS algorithm, state management, due-sentence query
- `services/sentenceLibrary.ts` — add `pickNextSentence()` that checks SRS due list first
- `App.tsx` — initialize SRS state, call `recordReview()` after each session, show "due for review" badge
- `data/srsState.ts` (NEW) — type definitions for SRSRecord

Estimated complexity: Medium — FSRS algorithm is straightforward (a few math functions), state persistence is localStorage + in-memory Map.

#### P2.2 — Real-Time Transcription During Recording
**Priority: 🟡 HIGH** (best UX improvement)

Why fourth: It's the most "wow" UX feature. Browser SpeechRecognition is free (no API cost) and gives interim results. The live transcript + post-recording correction overlay is a major upgrade to the practice flow.

Files to touch:
- `services/speechRecognition.ts` (NEW) — `SpeechRecognition` wrapper with interim results
- `components/TranscriptView.tsx` (NEW) — transcript with inline error annotations, clickable words
- `App.tsx` — start SpeechRecognition during recording, display live transcript, overlay corrections after analysis
- `types.ts` — add `TranscriptWord` type
- `server.ts` — optional: enrich analyze-audio response with word-level timestamps

Estimated complexity: Medium-High — the SpeechRecognition integration is straightforward, but the inline correction overlay (word-level error alignment) requires careful transcript alignment logic.

---

### Phase 3 — New API endpoints + scenario infrastructure

#### P3.1 — AI Conversation Role-Play with Scenarios
**Priority: 🟠 MEDIUM-HIGH** (competes with Duolingo Max's core AI feature)

Why fifth: This is the most complex feature — it requires new data (scenarios), new server routes, new client UI mode, and integration with TTS + comparison + assessment. It depends on Phase 1 and Phase 2 infrastructure being in place (comparison player for replay, CEFR assessment for feedback, SRS for review scheduling).

Files to touch:
- `data/scenarios.ts` (NEW) — 30-50 scenario objects
- `services/companionChatServer.ts` — `generateScenarioReply()` with evaluation rubric
- `server.ts` — new `POST /api/companion/scenario` route
- `types.ts` — `ScenarioResult` type with 5-dimension scores
- `components/CompanionChat.tsx` — scenario mode UI (selector, context card, TTS playback, score display)
- `services/geminiService.ts` — scenario TTS helper or reuse `generateTTS()`

Estimated complexity: High — multiple new files, new route, new UI mode, integration with 3 other features.

---

## 5. Final Priority Order (with rationale)

| Priority | Feature | Phase | Rationale |
|---|---|---|---|
| 1 | Audio Comparison Player (Waveform Overlay) | P1.1 | Biggest visual impact, client-side only, reuses existing TTS, no server risk. Ships the "did I sound native?" moment. |
| 2 | CEFR Proficiency Score + Dashboard | P1.2 | Turns progress from vanity metrics to measurable CEFR levels. Pure client-side. Drives retention — learners stick around when they see themselves leveling up. |
| 3 | Spaced Repetition Sentence Review | P2.1 | Transforms sentence library from browseable to curriculum. Client-side + localStorage. Foundation for all sentence-picking features. |
| 4 | Real-Time Transcription + Inline Correction | P2.2 | Best UX upgrade. Browser SpeechRecognition is free. The inline correction overlay is the moment learners realize "I keep messing up that sound." |
| 5 | AI Conversation Role-Play with Scenarios | P3.1 | Most complex, depends on P1-P4 infrastructure. Competes with Duolingo Max Roleplay but with deeper analysis. Ship last because it needs everything else working. |

---

## 6. What Each Phase Delivers (User-Facing)

### Phase 1 (standalone wins)
- **Comparison Player:** After analysis, see two waveforms overlaid — your voice vs native TTS — synced to the same timeline. Play them together. See highlighted regions where you diverge. "Hear the difference" becomes visual.
- **CEFR Dashboard:** Progress tab shows "B1" in a big badge, IELTS 4.0–5.0 equivalent, radar chart of 5 dimensions, trend line with CEFR thresholds, "3 more sessions to reach B2."

### Phase 2 (foundation + UX)
- **SRS Review:** Practice tab shows "3 sentences due for review" — sentences you struggled with reappear sooner, ones you nailed appear less often. The 1,100-sentence library becomes a curriculum that adapts to you.
- **Live Transcription:** While recording, words appear on screen as you speak (free, browser API). After analysis, the same transcript shows mispronounced words in red, grammar errors underlined, hover for explanation, click to hear native pronunciation of that word.

### Phase 3 (new capability)
- **Scenario Role-Play:** Pick a scenario ("Check into a hotel in Madrid"), AI plays the other role via TTS voice, you respond by voice, get a 5-dimension score (pronunciation, grammar, vocabulary, fluency, appropriateness) with feedback. Competes directly with Duolingo Max Roleplay — but with ELSA-level analysis depth.

---

## 7. Build Order Within Each Phase

### Phase 1
1. `services/audioUtils.ts` — add `decodeBase64ToAudioBuffer()`, `getWaveformData()`
2. `services/waveformUtils.ts` (NEW) — `compareWaveforms()`, `detectDivergenceRegions()`
3. `components/ComparisonPlayer.tsx` — dual waveform overlay + synchronized playback
4. `services/assessmentService.ts` (NEW) — CEFR mapping, dimension scores
5. `components/ProgressView.tsx` — CEFR badge, radar, IELTS, trend

### Phase 2
1. `services/srsService.ts` (NEW) — FSRS algorithm, state, due query
2. `services/sentenceLibrary.ts` — `pickNextSentence()` with SRS priority
3. `App.tsx` — SRS init + `recordReview()` + "due" badge
4. `services/speechRecognition.ts` (NEW) — browser SR wrapper
5. `components/TranscriptView.tsx` (NEW) — annotated transcript
6. `App.tsx` — live transcript during recording + correction overlay after

### Phase 3
1. `data/scenarios.ts` (NEW) — scenario corpus
2. `types.ts` — `ScenarioResult` type
3. `services/companionChatServer.ts` — `generateScenarioReply()`
4. `server.ts` — `POST /api/companion/scenario` route
5. `components/CompanionChat.tsx` — scenario mode UI

---

## 8. Tech Debt & Infrastructure Notes

### Existing gaps to fix alongside feature work

1. **Deprecated service file:** `services/geminiService.ts` still named "gemini" but uses OpenAI. Rename to `services/aiService.ts` to avoid confusion.

2. **`src/api/index.ts` → `server.ts` import chain:** The server bundle is 1.1 MB because esbuild bundles everything. Consider whether tree-shaking is working — the `dist/` frontend and `api/index.cjs` server are separate builds but the server bundle might include React (it shouldn't — server.ts doesn't import React). Verify `esbuild` isn't pulling in frontend deps.

3. **Rate limiting is in-memory:** `server.ts` uses an in-memory Map for rate limiting. On Vercel serverless, this resets on every cold start — meaning each cold start gives a fresh 20 requests/minute per IP. Not ideal for production. Consider upgrading to a Vercel-compatible rate limiter (Upstash Redis, or Vercel KV) if traffic grows.

4. **No auth:** Everything is open — anyone can call `/api/analyze-audio`, `/api/companion/chat`, `/api/generate-tts`. Not a problem at current scale, but worth knowing.

5. **Audio blob stored in IndexedDB:** `SessionRecord.audioBlob` stores the full audio blob in IndexedDB. Over time this grows large (a 10-second WAV at 44.1kHz stereo ≈ 1.7 MB). Consider storing only the base64 transcription + analysis, and re-fetching audio from a server-side store if needed. Or compress/limit retention.

6. **Only 3 languages have data:** The UI offers 8 languages but only EN/ES/FR have sentences + proverbs. German, Italian, Japanese, Portuguese, Chinese need content before they're usable.

---

## 9. Quick Reference: Existing Component Reusability

| Component | Reused in Top-5 Features | How |
|---|---|---|
| `Waveform.tsx` | Feature 1, 5 | Renders waveform from audio blob — needs waveform data array input (currently mock data) |
| `ComparisonPlayer.tsx` | Feature 1, 2, 5 | A/B playback — needs waveform overlay + synchronized dual-buffer playback |
| `ScoreCard.tsx` | Feature 2, 3, 5 | Radial score gauge — reusable for per-dimension scores, CEFR level indicator |
| `ResultsView.tsx` | Feature 1, 5 | Already renders ComparisonPlayer, ScoreCards, pitch chart, phoneme errors — needs waveform overlay + transcript view integration |
| `ProgressView.tsx` | Feature 3 | Score history chart — needs CEFR badge, radar chart, IELTS equivalent added |
| `PhonemeSelector.tsx` | Feature 1, 5 | Currently empty (`phonemes={[]}`) — needs `PHONEMES` data passed in + drill sentence picker |
| `IPAChart.tsx` | Feature 3 | IPA reference — can be used in CEFR dashboard as pronunciation reference |
| `ArticulationVisualizer.tsx` | Feature 1, 5 | SVG tongue position — ready to use, just needs `ArticulationGuide` passed in from phoneme data |
| `Onboarding.tsx` | All | Profile setup — CEFR dashboard can show "start at A1" guidance |
| `data/phonemes.ts` | Feature 1, 5 | 16 phonemes with `ArticulationGuide` — ready to feed into PhonemeSelector + ArticulationVisualizer |
| `data/ipaReference.ts` | Feature 3 | 120+ IPA symbols + grid map — ready for IPAChart + pronunciation reference |
| `services/audioUtils.ts` | Feature 1, 2, 5 | `blobToBase64()`, `playPCM()`, `getAudioBuffer()` — foundation for all audio features |
| `services/storageService.ts` | Feature 3, 4 | IndexedDB save/get/delete — foundation for SRS state + CEFR history |
| `services/sentenceLibrary.ts` | Feature 4 | `getSentenceLibrary()`, `pickDailySentence()` — foundation for SRS sentence selection |
| `services/companionChatServer.ts` | Feature 2 | `generateCompanionReply()` with fallback chain — pattern for `generateScenarioReply()` |
| `components/CompanionChat.tsx` | Feature 2 | Chat UI — needs scenario mode mode toggle + TTS playback for AI responses |

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| OpenAI credits run out mid-feature | Features 2, 3, 5 (analysis-dependent) degrade to fallback | Already mitigated — fallback chain (gpt-4o → gpt-4o-mini → local) handles this. Feature 1 and 4 are fully client-side, no API dependency. |
| Browser SpeechRecognition not available (Firefox, Safari private mode) | Feature 5 live transcription fails | Graceful degradation: show "live transcription not available in this browser" + still do post-recording analysis. Chrome/Edge/Safari (non-private) all support it. |
| IndexedDB quota exceeded | Feature 4 SRS state + audio blobs grow too large | Store SRS state as compact JSON (not blobs), limit audio blob retention (e.g., keep last 20 sessions, archive rest). |
| FSRS algorithm complexity | Feature 4 implementation drags | Start with SM-2 (simpler, well-documented) as v1, upgrade to FSRS later. Both produce similar results for language learning use case. |
| Scenario corpus quality | Feature 2 feels generic if scenarios are bad | Start with 10 high-quality scenarios per language (not 50 mediocre ones). Scenarios should be: specific, culturally authentic, level-appropriate, with clear evaluation criteria. |
| Waveform overlay performance | Feature 1 janky on low-end devices | Downsample waveform data to 200-500 points for rendering (not full sample rate). Use `requestAnimationFrame` for playback cursor, not per-sample updates. |
| CEFR mapping feels arbitrary | Feature 3 credibility issue | Start with a simple rubric (score ranges → CEFR bands), clearly label as "estimated," add a disclaimer. Refine with real learner data over time. |

---

*End of architecture document.*
