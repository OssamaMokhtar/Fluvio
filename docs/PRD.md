# Slang — Product Requirements Document

**Status:** Living document · Draft  
**Last updated:** 2026-09-12  
**Owner:** Product  
**Project:** /Users/ossamamokhtar/Slang  
**Production URL:** https://slang-e6mm37v73-ossamamokhtars-projects.vercel.app  
**Tech stack:** TypeScript + Vite + Express (serverless on Vercel) + OpenAI (gpt-4o / gpt-4o-mini) + Web Audio API + esbuild

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Target Users](#2-target-users)
3. [Core Value Proposition](#3-core-value-proposition)
4. [Feature Specifications](#4-feature-specifications)
   - [4.1 Practice Tab — Voice Recording + AI Analysis](#41-practice-tab--voice-recording--ai-analysis)
   - [4.2 Sentences Library](#42-sentences-library)
   - [4.3 AI Companion — Scenario Role-Play](#43-ai-companion--scenario-role-play)
   - [4.4 Proverbs Viewer](#44-proverbs-viewer)
   - [4.5 Progress Tracking](#45-progress-tracking)
5. [User Journeys](#5-user-journeys)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Success Metrics](#7-success-metrics)
8. [Out of Scope](#8-out-of-scope)
9. [Appendix — Known Data Corpus](#appendix--known-data-corpus)

---

## 1. Problem Statement

### 1.1 The Gap
Language learners at the intermediate-to-advanced stage face a persistent triple deficit:

1. **Output practice is scarce.** Most apps test recognition (multiple choice, flashcards, fill-in-the-blank). Very few create sustained opportunities to *produce* spoken language and get meaningful feedback on that production.
2. **Feedback is shallow or absent.** When spoken practice exists, feedback is usually limited to "you said X" or a binary right/wrong. Learners don't get dimensional breakdowns (pronunciation, grammar, vocabulary, fluency, appropriateness) with actionable notes.
3. **Cultural depth is missing.** Textbooks and phrasebooks teach literal sentences but rarely the proverbs, idioms, and cultural context that make speech sound natural and grounded.

Learners who have passed the beginner plateau end up stuck in a "I understand more than I can say" limbo — they can consume content but lack a low-stakes, structured way to produce language and measure improvement over time.

### 1.2 Secondary Pain Points
- **Anxiety barrier:** Speaking a foreign language in front of another person is intimidating. Learners need a private, judgment-free environment to practice before real conversations.
- **Fragmented tools:** A learner might use Anki for vocab, Speechling for pronunciation, a textbook for grammar, and a separate app for culture — with no unified progress picture.
- **No CEFR-anchored tracking:** Learners don't know where they stand on a standardized scale (A1–C2) or how far they are from the next band.

### 1.3 Why Now
- Real-time speech recognition (Web Speech API / Whisper-class models) and LLM-based analysis make it feasible to build a client-side-or-server-side pipeline that records, transcribes, and returns dimensional feedback in a single session.
- The app's existing data corpus — 8 languages, ~1100 sentences per language, ~35 proverbs per language, 15 role-play scenarios with 5-dimension rubrics — is already sufficient to ship a v1 that feels substantive rather than toy-like.

---

## 2. Target Users

### 2.1 Primary Persona: "Stuck Intermediate Learner"
- **Profile:** Has studied a language for 1–3 years, can read and partially understand spoken content, but avoids speaking. May have a target language deadline (travel, relocation, work requirement, exam).
- **Behavior:** Uses apps sporadically; frustrated by apps that feel too easy or too academic. Wants to *speak* more but doesn't have a conversation partner or is too shy to use one.
- **Goals:** Break through the speaking barrier, get honest feedback, see measurable progress toward a CEFR band.

### 2.2 Secondary Persona: "Culturally Curious Advanced Learner"
- **Profile:** Near-fluent or fluent in reading but wants to sound more natural, understand proverbs/idioms, and practice nuanced scenarios (debates, storytelling, professional contexts).
- **Behavior:** Consumes native media; uses the app as a practice gym rather than a primary learning source.
- **Goals:** Sound natural, learn cultural references, practice under pressure (timed scenarios, rubric feedback).

### 2.3 Tertiary Persona: "Casual Explorer / Travel Prep"
- **Profile:** Planning a trip or restarting a dormant language. Wants quick, practical sentences and a few role-play scenarios (ordering food, asking directions, introducing oneself).
- **Behavior:** Shorter, more sporadic sessions. Needs low-friction onboarding.
- **Goals:** Learn the 20–50 sentences that matter most for an upcoming trip, try a scenario or two.

### 2.4 Supported Languages (v1)
| Code | Language | Sentences | Proverbs | Scenarios |
|------|----------|----------|----------|-----------|
| en   | English  | ~1100    | 35       | 8         |
| es   | Spanish  | ~1100    | 35       | 4         |
| fr   | French   | ~1100    | 35       | 4         |
| de   | German   | ~1100    | 35       | 0 (data ready) |
| it   | Italian  | ~1100    | 35       | 0 (data ready) |
| pt   | Portuguese | ~1100  | 35       | 0 (data ready) |
| ja   | Japanese | ~1100    | 35       | 0 (data ready) |
| zh   | Chinese  | ~1100    | 35       | 0 (data ready) |

> Scenarios currently cover English (8), Spanish (4), French (4). German/Italian/Portuguese/Japanese/Chinese sentence + proverb data is in place; scenario authoring is a known expansion path (see Out of Scope for v1, In Scope for roadmap).

---

## 3. Core Value Proposition

> **Slang gives intermediate language learners a private, structured gym to speak, get AI-powered dimensional feedback, and track CEFR-anchored progress — across 8 languages, 1100 sentences each, and real-world role-play scenarios.**

Three pillars:

1. **Speak, don't just tap.** Every core feature is built around voice production: recording sentences, role-playing scenarios, and conversing with an AI companion. Text input exists as a fallback, but voice is the primary mode.
2. **Feedback with dimensions, not just a score.** Analysis returns a breakdown across pronunciation, grammar, vocabulary, fluency, and appropriateness (scenario mode) — with specific notes the learner can act on.
3. **Progress you can see.** Session scores feed into a per-language history that maps to CEFR bands (A1–C2), shows trend lines, and estimates sessions-to-next-level.

---

## 4. Feature Specifications

### 4.1 Practice Tab — Voice Recording + AI Analysis

**Purpose:** The core daily practice loop. The learner picks a sentence, records themselves saying it, and receives AI-generated analysis with dimensional scores and actionable notes.

#### 4.1.1 Sentence Selection
- **Browse by language → CEFR level (A1/C2) → topic.** Topics are derived from the `tags` field on each `Sentence` (see `data/library.ts` interface).
- **Search:** Free-text search across the selected language's sentences. Should match on `text`, `translation`, `topic`, and `tags`. Search is debounced (300ms) and runs client-side against the in-memory sentence index (or a server-side endpoint if the corpus grows beyond client-comfort).
- **Daily sentence:** A "Daily Sentence" pick (one per language per day, deterministic or seeded by date) gives a low-friction entry point. Backed by `pickDailySentence` in `services/sentenceLibrary.ts`.
- **Recent / bookmarked:** The learner can bookmark sentences; recent picks are surfaced for quick re-practice.

#### 4.1.2 Recording
- **UI:** A prominent record button. While recording, show a waveform (client-side, via `services/waveformUtils.ts` / Web Audio API). Show a live timer. Show a level meter.
- **Constraints:**
  - Minimum recording length: 0.5s (reject empty captures).
  - Maximum recording length: 15s (practical for sentence-length utterances; longer inputs should be split or handled by the companion/scenario flows).
  - Audio captured via `MediaRecorder` (Web Audio API) as PCM/WAV, then encoding to the format expected by the backend. See `services/audioUtils.ts` and `services/speechRecognition.ts`.
- **Playback:** Before submitting, the learner can play back their recording. After analysis, the playback is shown alongside the native reference audio (if `native_audio_available` is true on the sentence) and the AI'sTTS rendering of the corrected version (when available).
- **Re-record:** One-click re-record discards the current capture and restarts. No penalty.

#### 4.1.3 Transcription & Analysis Pipeline
1. **Transcribe:** Client-side speech recognition (Web Speech API / fallback) produces a text transcript of what the learner said. If speech recognition fails or is unavailable, the learner can type the utterance manually (accessibility fallback).
2. **Submit:** The recording (audio blob) + transcript + sentence ID + language + CEFR level are sent to the server.
3. **Analyze (server-side):**
   - Primary: OpenAI gpt-4o audio/speech analysis (or text-based analysis when audio-only models aren't available). See `services/geminiService.ts` / OpenAI routes in `server.ts`.
   - Fallback chain: gpt-4o → gpt-4o-mini → local heuristic analysis (no API credits required). The heuristic path produces dimensional estimates from the transcript + known sentence target, so the feature degrades gracefully.
4. **Response shape (`AnalysisResponse` — see `services/assessmentService.ts` and related types):**
   - `overall_score`: 0–100.
   - `pronunciation_score`, `intelligibility_score`: sub-scores.
   - `phoneme_errors`: list of specific phoneme-level errors with positions.
   - `prosody_deviations`: list of timing/pitch/energy deviations.
   - `pitch_contour`: optional pitch track data for visualization.
   - `explanation_notes`: array of human-readable feedback notes.
   - `corrected_text`: the ideal rendering of the sentence (for comparison).
   - `corrected_version` (scenario mode): corrected version of the learner's utterance.
5. **Display:** Render scores as a 5-dimension radar/bar (pronunciation, grammar, vocabulary, fluency, intonation/appropriateness depending on mode). Show the explanation notes as expandable cards. Show phoneme errors on a timeline aligned to the waveform, if feasible.

#### 4.1.4 Practice Session State
- A practice session is a sequence of sentence attempts. The UI keeps the last 5–10 attempts in an in-progress "session" view so the learner can see a streak and a session-average score.
- Sessions are persisted locally (IndexedDB / localStorage) by default; opt-in cloud sync is a roadmap item (see Out of Scope).

#### 4.1.5 Edge Cases & Error Handling
- **No microphone permission:** Show a clear permission-request flow with a fallback to text-input-only mode.
- **Recognition returns empty/low-confidence transcript:** Show the confidence and let the learner edit the transcript before submitting. If still empty, allow text-only submission with a note that pronunciation scoring is limited.
- **API unavailable (OpenAI down, no credits):** Use the heuristic fallback. Surface a small "using offline analysis" badge so the learner knows the scores are estimates.
- **Network failure mid-submit:** Retry once with exponential backoff; if it fails again, save the attempt as "pending" and let the user retry later from a queue.

---

### 4.2 Sentences Library

**Purpose:** The reference corpus of real, level-graded sentences the learner practices against and browses for inspiration.

#### 4.2.1 Data Model
Each sentence (see `data/library.ts` `Sentence` interface) carries:
- `id`, `language`, `cefr_level` (A1–C2), `topic`, `text`, `translation`, `ipa_hint?` (IPA pronunciation guide), `tags[]`, `native_audio_available`.

#### 4.2.2 Browse & Filter
- **Language switcher:** Top-level picker; switching reloads the library index for that language.
- **Level filter:** Chip filter for A1/A2/B1/B2/C1/C2. Multi-select allowed (OR within levels).
- **Topic filter:** Derived from `tags`; show the top N topics as chips; "More" expands.
- **Sort:** Default = random mix within filters. Alternate sorts: by level (ascending/descending), by recency of practice, alphabetical.

#### 4.2.3 Sentence Detail
- Full card shows: target text, IPA hint (when present), translation, topic, level badge, tags.
- **Listen:** If `native_audio_available`, play a native reference rendering (TTS or pre-recorded). If not, generate TTS on the fly via the `/api/generate-tts` endpoint (see `server.ts`).
- **Practice now:** One-click "Practice this sentence" pushes it into the Practice tab as the active sentence.
- **Bookmark:** Toggle bookmark; bookmarked sentences appear in the Practice tab's bookmarked section.

#### 4.2.4 Search
- As described in 4.1.1. Results show matching sentences with the matched terms highlighted.
- Empty state: If no results, show "Try different keywords or fewer filters" with the active filters listed.

#### 4.2.5 Scale & Performance
- 8 languages × ~1100 sentences = ~8800 sentences total. This comfortably fits in client memory as structured objects; search can be full-index client-side. If corpus grows 5–10×, move search to a server endpoint with indexing.

---

### 4.3 AI Companion — Scenario Role-Play

**Purpose:** Immersive, goal-directed conversation practice. The learner plays one role, the AI plays the other, and after each exchange the learner gets a 5-dimension rubric evaluation + TTS audio of the AI's reply.

#### 4.3.1 Scenario Catalog
- 15 scenarios across English (8), Spanish (4), French (4) at beginner / intermediate / advanced levels. Defined in `data/scenarios.ts` (`SCENARIOS` array).
- Each scenario has: `id`, `title`, `context`, `role_play_instructions`, `target_language`, `level`, `expected_vocabulary[]`, `evaluation_rubric` (pronunciation, grammar, vocabulary, fluency, appropriateness).
- **Scenario browser:** Filter by language + level. Show scenario cards with title, context blurb, level badge, and expected vocabulary tags.

#### 4.3.2 Starting a Scenario Session
- Learner picks a scenario → confirms language + level → server creates a `ScenarioSession` (see `scenarioService.ts` `createScenarioSession`).
- The AI's first turn is generated (gpt-4o → gpt-4o-mini → local fallback) and returned with TTS audio. The learner hears the AI's opening line.

#### 4.3.3 Conversation Turn Loop
1. **Learner speaks:** Record a spoken response (or type as fallback). Live waveform shown.
2. **Transcribe + submit:** Transcript + audio + session context sent to `/api/scenario/turn` (or equivalent).
3. **AI reply:**
   - Server runs `generateScenarioTurn` (`scenarioService.ts`): builds a prompt from the scenario context + role-play instructions + conversation history, calls OpenAI, parses the JSON response (response, translation, next_prompt, corrected_version, feedback).
   - TTS audio generated for the AI's reply (client fetches `/api/generate-tts`).
   - Scores computed via `heuristicScores` (always available) and where API permits, refined.
4. **Feedback display:**
   - Show the AI's reply as text + playable TTS audio + translation (required for beginner, optional otherwise).
   - Show the 5-dimension scores (pronunciation, grammar, vocabulary, fluency, appropriateness) as a compact chart.
   - Show the feedback note (1–2 sentences) and `corrected_version` when present.
   - Show the `next_prompt` as the prompt for the next turn.
5. **Next turn:** Learner responds to the next_prompt. Loop continues until the learner ends the session or a natural endpoint is reached.

#### 4.3.4 Session End & Summary
- Learner can end at any time. On end, show a session summary: total turns, average per-dimension scores, a short qualitative summary, and the CEFR band implied by the overall average (mapped via `services/assessmentService.ts` `computeCEFRLevel`).
- Summary is persisted to the learner's progress history (see 4.5).

#### 4.3.5 Fallback Behavior
- When OpenAI is unavailable or out of credits, the scenario flow uses the local fallback responses in `LOCAL_FALLBACK` (`scenarioService.ts`). Feedback is generic but level-appropriate and in the target language. Scores come from `heuristicScores`. The flow continues without interruption; a small badge indicates "offline mode."

#### 4.3.6 Companion Mode (Free Chat)
- In addition to structured scenarios, the app offers a free-form "AI Companion" chat (see `services/companionService.ts` / `companionChatServer.ts`). The learner picks a language + level and chats with the AI, receiving translations, corrections, and per-turn scores. This mode is less structured than scenarios but good for open practice. It shares the same TTS and scoring infrastructure.

---

### 4.4 Proverbs Viewer

**Purpose:** Cultural depth. Learners explore proverbs in their target language to understand literal meaning, real meaning, usage context, and common variants.

#### 4.4.1 Data Model
Each proverb (see `data/library.ts` `Proverb` interface) carries:
- `id`, `language`, `text` (the proverb in the target language), `literal_translation`, `meaning` (the real-world sense), `usage_note` (when/how to use it), `tags[]`, `common_variant?`.

#### 4.4.2 Browse
- Language switcher → proverb list for that language (35 each at v1).
- Filter by tags (e.g., "wisdom", "patience", "friendship", "work").
- Sort: default (curated order), alphabetical, by tag.

#### 4.4.3 Proverb Detail
- Card shows: the proverb in large type, literal translation, real meaning, usage note, tags, common variant (if present).
- **Listen:** TTS playback of the proverb in the target language.
- **Save to practice:** "Add to practice queue" — puts the proverb into the Practice tab's queue so the learner can record themselves saying it. This connects the cultural viewer back to voice practice.

#### 4.4.4 Search
- Search across `text`, `literal_translation`, `meaning`, `usage_note`, `tags`. Highlight matches.

#### 4.4.5 Learning Cues
- When a proverb contains vocabulary that overlaps with sentences in the library, surface a small "Related sentences" section linking to 1–3 sentences that share tags or key words. This is a nice-to-have v1.1 feature; v1 shows the proverb in isolation.

---

### 4.5 Progress Tracking

**Purpose:** Show the learner where they stand, how they're improving, and what to work on next — anchored to CEFR bands.

#### 4.5.1 Data Stored
- Per-language progress:
  - List of practice attempts: `{ sentenceId, language, cefr_level, timestamp, overall_score, dimension_scores, transcribed_text, corrected_text, explanation_notes }`.
  - List of scenario/companion sessions: `{ sessionId, scenarioId?, language, level, turns, started_at, last_active, turn_scores[] }`.
- Derived aggregates:
  - Average overall score per language (last 7/30/90 days, all-time).
  - Average per-dimension scores per language.
  - Current estimated CEFR band (from average overall score via `computeCEFRLevel`).
  - Sessions-to-next-level estimate (via `sessionsToNextLevel`).
  - Streak: consecutive days with at least one attempt.

#### 4.5.2 Progress Dashboard (tab)
- **Overview card:** Current estimated CEFR band for the selected language, with the band description and IELTS equivalent (from `CEFR_BANDS`). Show the numeric average and the date range it's based on.
- **Trend chart:** Sparkline / line chart of daily or per-session overall scores over time. X-axis = date, Y-axis = score (0–100). Show the CEFR band thresholds as horizontal reference lines.
- **Dimension breakdown:** Bar chart of average pronunciation / grammar / vocabulary / fluency / intonation (or appropriateness in scenario mode) for the selected language.
- **Sessions-to-next-level:** "You're X points from the next band (B2). At your current pace, that's roughly N sessions." N from `sessionsToNextLevel`.
- **Recent activity:** Last 5–10 attempts/sessions with date, sentence/scenario name, score, and a one-line note.
- **Streak:** Fire icon + day count. Resets on a day with zero attempts (midnight-local).

#### 4.5.3 Language Switcher in Progress
- The progress view is per-language. A switcher at the top lets the learner flip between languages; each maintains its own history and band estimate.

#### 4.5.4 Persistence
- v1: Local-only persistence (IndexedDB / localStorage). The learner's data lives on the device.
- Roadmap (Out of Scope for v1): Optional cloud sync via account login, cross-device history, export (CSV/JSON).

#### 4.5.5 Privacy Note
- Since v1 is local-only, no personal data leaves the device except what is sent to the OpenAI API for analysis (audio + transcript). The privacy policy should state this clearly. Audio is processed by OpenAI for analysis and TTS; see the app's existing `SECURITY.md` for the current posture.

---

## 5. User Journeys

### 5.1 First-Time User — Onboarding
1. Landing tab shows language picker (8 languages) + a short value proposition.
2. User picks a language → app loads that language's sentence library index and proverb list.
3. Default landing: Practice tab, with a "Today's daily sentence" featured. User can also jump to Library, Scenarios, Proverbs, or Progress.
4. First recording: User taps record on the daily sentence, reads it aloud, listens back, submits. Analysis returns. User sees scores + notes. This is the "aha" moment — voice in, dimensional feedback out.
5. App suggests: "Try another sentence" or "Try a scenario." User picks one.

### 5.2 Daily Practice Loop (Practice Tab)
1. User opens Practice tab. Sees daily sentence + recent attempts + bookmarked sentences.
2. User picks a sentence (browse/search/library-from-practice).
3. Records → playback → submit.
4. Analysis loads. User reads notes, listens to corrected TTS, compares to native audio.
5. User bookmarks promising sentences, or re-records to improve.
6. Session-average updates; streak increments if this is the first attempt today.

### 5.3 Scenario Role-Play Journey
1. User opens Scenarios tab. Filters to their language + level.
2. Picks a scenario. Reads the context.
3. Starts session. Hears the AI's opening line (TTS).
4. Responds (voice). Gets AI reply (TTS + text + translation) + 5-dimension scores + feedback + next prompt.
5. Repeats 3–6 turns.
6. Ends session. Sees summary: average scores, CEFR band, and a qualitative note. Summary is added to progress history.

### 5.4 Proverb Discovery → Practice
1. User opens Proverbs tab. Browses by language + tag.
2. Opens a proverb. Reads literal vs real meaning. Listens to TTS.
3. Taps "Add to practice queue."
4. Later, in Practice tab, the proverb appears in the queue. User records it, gets analysis.

### 5.5 Progress Review Journey
1. User opens Progress tab. Picks a language.
2. Sees current CEFR band + average score + trend chart.
3. Reviews dimension breakdown to find weak spots (e.g., pronunciation is strong but fluency is lagging).
4. Uses the "sessions to next level" estimate to set a goal.
5. Returns to Practice or Scenarios to target the weak dimension.

---

## 6. Non-Functional Requirements

### 6.1 Performance
- **First contentful paint:** < 2s on a typical 3G connection for the landing tab.
- **Language switch:** Re-render the library index in < 500ms (data is in-memory).
- **Recording → analysis:** End-to-end latency target < 5s for the OpenAI path, < 2s for the heuristic path. Show a clear loading state with a cancel option.
- **TTS playback:** Start playback within 1s of the audio URL being available.

### 6.2 Reliability & Degradation
- **OpenAI unavailable:** All AI-dependent features (analysis, scenario turns, companion chat, TTS) degrade to the local heuristic / fallback paths. The app remains usable; features show an "offline mode" indicator.
- **Speech recognition unavailable:** Fall back to text input. Pronunciation scoring is limited in this mode; surface that honestly.
- **MediaRecorder / mic unavailable:** Show a clear, actionable error (e.g., "Microphone access is required for voice practice. Please allow microphone access in your browser settings.").

### 6.3 Accessibility
- All interactive elements keyboard-navigable.
- Record button has a clear focus state and a keyboard shortcut (e.g., Space to toggle recording when focused).
- Audio elements have play/pause and volume controls; TTS playback can be paused.
- Color is not the sole carrier of information (scores also shown as numbers + patterns).
- Screen-reader labels on score charts (e.g., "Pronunciation: 72 out of 100").

### 6.4 Privacy & Security
- No authentication in v1; data is local to the device.
- Audio + transcript sent to OpenAI for analysis/TTS only when the user submits. No background sending.
- Rate limiting on the API layer (see `server.ts` `rateLimit` middleware — 20 req/min per IP by default, configurable via `RATE_LIMIT_PER_MIN`).
- Input sanitization on all user-supplied text (see `safeLabel`, `safeSentence` in `server.ts`).

### 6.5 Browser Support
- Target: modern evergreen browsers (Chrome, Edge, Firefox, Safari latest). Web Audio API and MediaRecorder are the key dependencies; verify behavior on iOS Safari (MediaRecorder support has historically been limited — test and document any constraints).

### 6.6 Build & Deploy
- Build: `vite build` + esbuild for the server bundle. Output to Vercel serverless functions.
- Local dev: `server.ts` binds a port (default 3000) unless `process.env.VERCEL` is set (serverless mode). API surface is identical in both modes (see `src/api/index.ts`).
- No build errors in the TypeScript layer (current state: 0 errors).

---

## 7. Success Metrics

### 7.1 Adoption
- **Day-1 retention:** % of first-time visitors who complete at least one recording-and-analysis cycle. Target: > 40%.
- **First-week activation:** % of users who return within 7 days and complete ≥ 3 practice attempts or ≥ 1 scenario session.

### 7.2 Engagement
- **Sessions per active user per week:** Target ≥ 3 practice/scenario sessions.
- **Turns per scenario session:** Target ≥ 3 turns (indicates the loop is engaging enough to continue).
- **Sentences practiced per session:** Target ≥ 3.

### 7.3 Quality of Experience
- **Analysis completion rate:** % of submissions that return a full analysis (not errored). Target ≥ 98% (heuristic fallback should make this near-ceiling).
- **End-to-end latency (p50):** < 5s OpenAI path, < 2s heuristic path.
- **Override rate:** % of attempts where the learner re-records immediately after seeing results (a sign the feedback was actionable). Track as a positive signal, not a negative one.

### 7.4 Learning Outcomes (Self-Reported + Inferred)
- **CEFR movement:** % of users who, after 30 days of activity, show an increase in their estimated CEFR band for a language. Inferred from progress history.
- **Sessions-to-next-level reduction:** Downward trend in the estimated sessions needed to reach the next band over a user's history.
- **User-reported confidence:** In-app micro-survey ("How confident do you feel speaking this language today? 1–5") before/after a session. Track delta.

### 7.5 Technical
- **Build health:** 0 TypeScript errors on every commit (current state).
- **API error rate:** < 1% of API requests result in 5xx.
- **Client crash rate:** < 0.5% of sessions end in an unhandled client error.

---

## 8. Out of Scope

### 8.1 Explicitly Out of Scope (v1)
- **User accounts / authentication / cloud sync.** v1 is local-only. No login, no cross-device history, no account-based persistence.
- **Social features.** No leaderboards, no sharing of recordings or scores, no friend feeds.
- **More than 8 languages.** The current corpus covers 8. Adding languages requires sentence + proverb data authoring; that is a future expansion, not a v1 task.
- **More scenarios for German/Italian/Portuguese/Japanese/Chinese.** Sentence + proverb data exists; scenario authoring (context + role-play instructions + rubric) is a separate content task. v1 ships the 15 scenarios that exist; expanding per-language scenario coverage is roadmap.
- **Integrated spaced repetition / flashcards.** The app is a practice gym, not an SRS. Bookmarking exists for re-practice convenience, but there is no algorithmic review scheduling.
- **Manual curriculum / learning path.** No prescribed sequence of lessons. The learner browses and picks; the app does not enforce an order.
- **Grammar lessons / explicit instruction.** Feedback notes may mention grammar, but the app does not deliver grammar explanations or exercises as a primary feature.
- **Live human tutoring / real-person conversation.** The companion is AI-only.
- **Offline-first (full).** TTS and AI analysis require network. The heuristic analysis path works without OpenAI credits, but TTS and the OpenAI analysis path do not work fully offline. "Offline mode" means "degraded to heuristics," not "fully offline."
- **iOS MediaRecorder edge-case handling beyond what exists.** If MediaRecorder has limitations on iOS Safari, document the constraint; do not build a custom recorder shim as part of v1.

### 8.2 Future Roadmap (Not v1, Listed for Context)
- User accounts + cloud sync of progress history.
- Export progress as CSV/JSON.
- Scenario authoring tooling for the remaining 5 languages.
- Expanded proverb corpus (35 is a starter; target 100+ per language).
- Native audio recordings (pre-recorded by humans) for high-frequency sentences, replacing TTS for those items.
- Phoneme-level visualization on the waveform (highlighting where errors occurred).
- Mobile app shell (React Native / Capacitor) wrapping the existing web app.
- In-app micro-surveys for confidence and satisfaction.

---

## Appendix — Known Data Corpus

This appendix records the corpus that v1 is built on, so the PRD stays grounded in what actually exists.

### Sentences
- **8 languages:** English, Spanish, French, German, Italian, Portuguese, Japanese, Chinese.
- **~1100 sentences per language** (approx. — the exact count per language is the length of the corresponding `_*_sentences.ts` array).
- **Fields per sentence:** `id`, `language`, `cefr_level` (A1–C2), `topic`, `text`, `translation`, `ipa_hint?` (IPA guide), `tags[]`, `native_audio_available`.
- **Source files:** `data/sentences/en_sentences.ts`, `es_sentences.ts`, `fr_sentences.ts`, `de_sentences.ts`, `it_sentences.ts`, `pt_sentences.ts`, `ja_sentences.ts`, `zh_sentences.ts`.

### Proverbs
- **8 languages, 35 proverbs each.**
- **Fields per proverb:** `id`, `language`, `text`, `literal_translation`, `meaning`, `usage_note`, `tags[]`, `common_variant?`.
- **Source files:** `data/sentences/en_proverbs.ts`, `es_proverbs.ts`, `fr_proverbs.ts`, `de_proverbs.ts`, `it_proverbs.ts`, `pt_proverbs.ts`, `ja_proverbs.ts`, `zh_proverbs.ts`.

### Scenarios (Role-Play)
- **15 scenarios:** English 8 (intro, cafe, directions, restaurant, job interview, travel plan, debate, personal story), Spanish 4 (perfil, restaurante, viaje, debate), French 4 (presenter, cafe, restaurant, voyage).
- **Levels:** beginner, intermediate, advanced.
- **Rubric:** 5 dimensions — pronunciation, grammar, vocabulary, fluency, appropriateness.
- **Source:** `data/scenarios.ts` (`SCENARIOS` array).

### Infrastructure
- **Server:** Express (`server.ts`), 870 lines. Routes for sentence library, search, daily sentence, companion chat, scenario turns, TTS generation, CEFR assessment.
- **Rate limiting:** Fixed-window, 20 req/min per IP, configurable.
- **Input sanitization:** `safeLabel`, `safeSentence`.
- **OpenAI fallback chain:** gpt-4o → gpt-4o-mini → local heuristic.
- **Client services:** `companionService.ts`, `scenarioService.ts`, `assessmentService.ts`, `sentenceLibrary.ts`, `speechRecognition.ts`, `audioUtils.ts`, `waveformUtils.ts`, `storageService.ts`, `companionChatServer.ts`, `companionClient.ts`, `sanitization.ts`.

---

*This is a living document. Update it when the feature set, corpus, or targets change. The next edit should record what changed and why.*
