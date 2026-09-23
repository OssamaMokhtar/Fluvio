# Fluvio — API

> Status: AUTHORED · Updated 2026-09-23 · Owner: Ossama Mokhtar

| Route | Method | Billable | Purpose |
|---|---|---|---|
| `/api/health` | GET | — | Status and AI budget use |
| `/api/analyze-audio` | POST | Whisper + GPT-4o | Pronunciation feedback; returns `measurement` and `cost_estimate_usd` |
| `/api/generate-tts` | POST | TTS-1 | Model phrase audio |
| `/api/generate-lesson-plan` | POST | GPT-4o → mini | Lesson prompt; falls back to a local prompt with `X-Degraded` |
| `/api/companion/chat` | POST | GPT-4o → mini | Conversation turn; local fallback |
| `/api/companion/scenario` | POST | GPT-4o → mini | Role-play turn and scores |
| `/api/sentences/:lang`, `/search`, `/random` | GET | — | Sentence corpus |
| `/api/sentence-library`, `/api/word-library`, `/api/words/:lang` | GET | — | Corpus for the client |
| `/api/proverbs/:lang`, `/random` | GET | — | Proverbs |
| `/api/content`, `/api/content/:token` | POST / GET | — | Temporary shared content by token |

All `/api/*` routes are rate-limited to 20 requests per minute per IP (per instance). Billable routes also draw from a daily ceiling (`AI_CALL_BUDGET_PER_DAY`, default 2,000) that fails closed with `429 AI_BUDGET_EXHAUSTED`.
