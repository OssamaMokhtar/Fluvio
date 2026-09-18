# Privacy

**Status:** Draft for prototype phase. Not legal advice.
**Last verified against code:** 2026-09-12.

> The previous version of this file described a system that did not exist — a
> database that was never built, and Gemini as the inference provider after the
> migration to OpenAI in commit `aa2118a`. The portal's compliance matrix
> simultaneously claimed GDPR was "not applicable". Those three documents
> disagreed with each other and with the code. This one describes what actually
> happens.

## What actually happens to a recording

1. You press record. The browser captures audio via `MediaRecorder`.
2. The audio is base64-encoded and POSTed to `/api/analyze-audio` on our server.
3. Our server forwards it to **OpenAI** for transcription. OpenAI is a processor
   acting on our instructions.
4. The transcript and your reference sentence are sent to a language model to
   produce feedback.
5. The result returns to your browser. **The recording and the scores are stored
   in your browser only** — IndexedDB (`slang_db`) and `localStorage`. We keep no
   copy. There is no database and no user account.
6. Your IP address is held in server memory for up to 60 seconds to enforce rate
   limiting, then discarded. It is not logged and not persisted.

## Data we process

| Data | Purpose | Where it goes | Retention |
|---|---|---|---|
| Voice recording | Transcription and feedback | Your browser → our server (transient) → OpenAI | Not retained by us. Retained in your browser until you clear it. OpenAI's retention is governed by their API data-usage terms. |
| Transcript + scores | Feedback and progress | Your browser | Until you clear browser storage. |
| IP address | Rate limiting, abuse prevention | Server memory | ≤ 60 seconds. |
| Device token | Rate-limit identity | Your browser; sent as a request header | Until you clear browser storage. Random, not linked to identity. |

## Legal basis — GDPR applies today

A voice recording is personal data under GDPR Article 4 **whether or not it is
persisted**. Transmitting an EU learner's audio and IP address to OpenAI makes
Slang a **controller** and OpenAI a **processor**. That is true now, not "if
accounts are added later."

What this requires, and where we stand:

| Requirement | Status |
|---|---|
| Lawful basis identified and stated | ⬜ To do — consent at first recording is the intended basis |
| In-product privacy notice before the first recording | ⬜ To do |
| Data Processing Agreement with OpenAI | ⬜ To do — must be executed before any non-test user |
| Right of access / portability | ✅ Data is in your browser; export is straightforward |
| Right to erasure | ✅ Clearing site data removes everything we hold about you |
| Records of processing (Art. 30) | ⬜ To do |
| DPO | Not required at current scale |

**UAE PDPL** applies on the same reasoning: voice is personal data, and the
sensitivity of biometric-adjacent data warrants the higher standard even though
we do not use voice for identification.

**COPPA / age:** Slang is not designed for under-13s, and a language-learning app
will attract minors regardless. Age gating is required before any consumer
launch. ⬜ To do.

## Your rights

You can access, correct, export or delete your data. Because everything we hold
about you sits in your own browser, deletion is immediate and under your control:
clear site data for this origin. For anything else, contact the maintainer.

## Third parties

| Processor | What they receive | Why |
|---|---|---|
| OpenAI | Voice audio, transcript, reference text | Transcription and feedback generation |
| Vercel | Request metadata, IP | Hosting and delivery |

We share data with no one else, and we do not sell data, run advertising, or
profile users.

## When this changes

The architecture in [ADR-0001](./docs/adr/0001-acoustic-scoring.md) moves speech
processing to self-hosted models. That **reduces** exposure — audio would no
longer leave our infrastructure for a third party. It also introduces a research
corpus of labelled recordings, which requires **explicit, separate, opt-in
consent** with a clearly stated purpose. Recordings will never enter that corpus
on the basis of the consent that covers ordinary product use.

---

*Contact the maintainer for privacy enquiries.*
