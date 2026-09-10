# Slang Language — AI-Powered Language Companion

> Learn to speak like a native. 5,000 essential sentences + proverbs per language, voice recording with native comparison, and an AI companion that coaches you in real time.

**Stack:** TypeScript · React 19 · Vite · Express · Gemini · Web Audio · IndexedDB

---

## What it does

| Feature | What it means |
|---|---|
| **Multi-language** | English, Spanish, French — expandable to any language with Gemini support |
| **5,000 sentence library** | Most common sentences per language, organized by level and topic |
| **Proverbs & idioms** | Cultural wisdom that makes you sound like a local, not a textbook |
| **Voice recording + analysis** | Record yourself, get AI-powered comparison against native TTS reference |
| **AI language companion** | Conversational practice — the AI listens, corrects, and adapts to your level |
| **Native speaker TTS** | Gemini TTS generates native-pronunciation audio for every sentence |
| **Progress tracking** | Streaks, scores, weak-spot identification, per-phoneme heatmaps |
| **Level-based paths** | Beginner → Intermediate → Advanced, with content that matches your level |

## Architecture

```
Browser (React + Vite)
  ├── Record voice (MediaRecorder → WAV → base64)
  ├── Play native reference (Gemini TTS PCM → Web Audio)
  ├── View sentence library, proverbs, drills
  └── IndexedDB local storage (sessions, progress, bookmarks)

Server (Express / Vercel serverless)
  ├── /api/analyze-audio   — Gemini audio + text → scored analysis JSON
  ├── /api/generate-tts    — Gemini TTS → native speaker audio
  ├── /api/generate-lesson-plan — adaptive sentence selection
  └── /api/companion-chat  — AI conversation partner (new)
```

Gemini is called **server-side only**. The API key never reaches the browser.

## Run locally

```bash
cd Slang
npm install
cp .env.local.example .env.local   # add GEMINI_API_KEY
npm run dev
```

## Deploying

```bash
vercel
vercel env add GEMINI_API_KEY production
vercel --prod
```

## Status

Working pronunciation coach → evolving into full AI language companion.
