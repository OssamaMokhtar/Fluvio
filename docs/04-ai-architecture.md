# Fluvio — AI architecture

> Status: AUTHORED · Updated 2026-09-23 · Owner: Ossama Mokhtar

**Every AI output says how it was produced.** Pronunciation feedback declares that no acoustic analysis happened, scenario scores declare whether a model or a heuristic produced them, and degraded lesson plans carry a header.

## Pronunciation pipeline (today)

1. The browser records audio and sends it base64-encoded.
2. **Whisper-1** transcribes it in the target language.
3. **GPT-4o** compares the transcript with the reference sentence and returns JSON (schema in `server.ts`): score, intelligibility, prioritized actions, drills, a model phrase.
4. The server adds `measurement: { method: "asr_transcript_llm_judgement", audio_analysed: false, pitch_measured: false, … }` and `cost_estimate_usd`, then removes any `pitch_contour`.

**The known limitation:** Whisper normalises accented speech, so the substitutions the product exists to catch can disappear before scoring. [ADR-0001](adr/0001-acoustic-scoring.md) accepts the replacement: phoneme-level acoustic scoring (goodness of pronunciation) that is aware of the learner's first language.

## Fallback chains

| Feature | Chain | Label when degraded |
|---|---|---|
| Companion chat | GPT-4o → GPT-4o-mini → local reply | Fallback flag in response |
| Scenario turn | GPT-4o → GPT-4o-mini → local reply + heuristic scores | `measured: false` |
| Lesson plan | GPT-4o → GPT-4o-mini → local prompt | `X-Degraded: lesson-plan-fallback` |
| Pronunciation | No text fallback: 503 when OpenAI is unavailable | — |

## Cost

Whisper is priced per minute from the WAV header (worst case 1 minute if unreadable), GPT-4o per token and TTS per character. Each call logs `{"event":"ai_cost",…}`. Real cost per active learner needs real sessions; that number is not claimed yet.
