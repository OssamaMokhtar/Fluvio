# Fluvio — Gaps

| # | Gap | Doc | Damage if unfilled | Effort | Status |
|---|---|---|---|---|---|
| 1 | Pronunciation "scores" are transcript judgements; Whisper hides accents | 04, ADR-0001 | **Severe.** The core promise is unmeasured | High | Accepted plan, not built |
| 2 | No learning-outcome evidence | 07 | High | Medium | Open |
| 3 | 10 of 13 language corpora unreviewed; some proverbs invented | DATA-QUALITY | High for those languages | Medium | Open |
| 4 | Rate limit and spend ceiling are per instance | 01 | Medium | Medium | Planned (rate-limiting migration) |
| 5 | Model JSON parsed without runtime schema validation | 00 | Medium: malformed output returns 500 | Low | Open |
| 6 | Deployment on a deployment-specific URL | 00 | Low | Low | Open |
| 7 | Learner audio sent to OpenAI without an in-product disclosure | SECURITY | Medium (privacy) | Low | Open |
