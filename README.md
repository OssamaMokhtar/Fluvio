# Slang — AI Pronunciation & Fluency Coach

> Real-time phonetic analysis with corrective feedback — see your pronunciation against a native reference, phoneme by phoneme.

`TypeScript` · `React` · `Vite` · `Gemini` · `Web Audio`

**[Try it live →](https://slang-ossamamokhtars-projects.vercel.app)**

![Slang daily practice](docs/screenshot.png)

---

## The idea

Most language apps grade you on *vocabulary* because it's easy to score. Pronunciation is where adult learners actually stall, and it's the thing an app can measure objectively. Slang scores the audio.

## What it does

- **Phonetic analysis** of recorded speech with per-phoneme scoring
- **Articulation visualiser** — where the sound should be formed
- **Comparison player** — your recording against a reference, aligned
- **Waveform view** for timing and stress
- **IPA chart** and phoneme selector for targeted drilling
- **Generated lesson plans** adapted to your weak phonemes

## Competitive Position

**Slang is not trying to compete head-on with ELSA Speak** ($35M+ funding, established AI pronunciation brand). The defensible niche is **MENA**: Arabic pronunciation for English learners in the Gulf, or English pronunciation for Arabic speakers.

### How Slang Differs

| Dimension | Slang | Generic AI Pronunciation Apps |
|-----------|-------|------------------------------|
| Market focus | MENA (Arabic ↔ English) | Global, English-centric |
| Language support | Bilingual AR/EN from the start | English-first, Arabic as add-on |
| Lesson plans | Generated, adapted to weak phonemes | Generic or predefined |
| Audio UX | Multi-surface: articulation visualizer, comparison player, waveform, IPA chart | Varies |

### Why MENA

- Arabic is one of the most common native languages among English learners in the Gulf
- English pronunciation for Arabic speakers has specific pain points (pharyngeals, emphatic consonants, vowel length) that generic apps don't address
- The MENA EdTech market is growing but under-served by global players
- Regional expertise is the moat — global apps can't easily replicate bilingual, culturally-aware design

## Architecture

Gemini is called **server-side only** (`server.ts`). The browser talks to `/api/analyze-audio`, `/api/generate-tts`, and `/api/generate-lesson-plan` — the API key never reaches the client.

## Run locally

**Prerequisites:** Node.js 18+

```bash
npm install
cp .env.local.example .env.local    # add your GEMINI_API_KEY
npm run dev
```

## Deploying

```bash
vercel                                    # link the project
vercel env add GEMINI_API_KEY production  # server-side only, never exposed
vercel --prod
```

The same Express app serves local development and runs as the Vercel function (`api/index.ts`), so the API surface, rate limiting, and input sanitisation cannot drift between environments.

> **Note on rate limiting:** the limiter holds state in memory. That is correct for a single instance but only partially effective across serverless instances — move it to a shared store (Vercel KV or Redis) before real traffic. See [docs/rate-limiting-migration.md](docs/rate-limiting-migration.md).

## Status

Working prototype — ~3,800 lines.

**Known issues**
- Rate limiting is in-memory (acknowledged as insufficient across serverless instances)
- No test coverage yet

## Documentation

- [Security](SECURITY.md) — architecture security model, data classification, known gaps
- [Privacy](PRIVACY.md) — data collection, storage, UAE PDPL rights
- [CI Workflow](.github/workflows/ci.yml) — repository structure validation + secret scanning
- [MENA Positioning](docs/mena-positioning.md) — the MENA niche strategy
- [Rate Limiting Migration](docs/rate-limiting-migration.md) — in-memory to Vercel KV/Redis

## License

MIT

---

*Built by [Ossama Mokhtar](https://github.com/OssamaMokhtar) — AI Product Manager, Dubai.*
