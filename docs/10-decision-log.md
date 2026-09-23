# Fluvio — Decision log

> Status: AUTHORED · Updated 2026-09-23 · Owner: Ossama Mokhtar

| ADR | Decision | Status |
|---|---|---|
| [0001](adr/0001-acoustic-scoring.md) | Replace transcript-judgement scoring with L1-aware acoustic scoring | Accepted, not built |
| 0002 | Never fabricate a measurement; declare the method on every response | Accepted, enforced (C-05) |
| 0003 | Spend ceiling fails closed | Accepted, enforced (C-08) |
| 0004 | Corpus counts are unique entries only | Accepted, enforced (C-18) |
| 0005 | Record cost per billable call | Accepted, enforced (COST-01/02) |

## ADR-0002 — Never fabricate a measurement

**Decision:** fields the pipeline cannot measure (pitch, phoneme timing) are omitted, and a `measurement` object states the method.
**Rejected:** plausible-looking generated values (the pre-SL-07 behaviour: `Math.random()` pitch curves drawn as measurement).
**Reversal trigger:** none; real acoustic values arrive with ADR-0001.

## ADR-0003 — The spend ceiling fails closed

**Decision:** when the daily AI call budget is used up, billable routes return 429 rather than continuing.
**Why:** a public demo with a pay-per-call API is a cost liability; degraded service is cheaper than an unbounded bill.
**Reversal trigger:** paid users with per-user quotas.

## ADR-0004 — Corpus counts are unique entries

**Decision:** advertise only unique, deduplicated entries; blank translations that copy the source.
**Rejected:** generated volume ("10,000 proverbs per language", which were as few as 10 entries repeated).
**Reversal trigger:** none.

## ADR-0005 — Record cost per billable call

**Decision:** estimate and log the cost of every Whisper, GPT-4o and TTS call, and return the cost of each scored utterance.
**Why:** Fluvio is the only deployed project with per-request inference cost, and pricing is impossible without it.
**Reversal trigger:** provider invoices reconciled per request, making estimates unnecessary.
