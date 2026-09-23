# Fluvio — Evaluation and quality gates

> Status: AUTHORED · Updated 2026-09-23 · Owner: Ossama Mokhtar

| Gate (CI, every push) | Count | What it protects |
|---|---|---|
| Unit and contract tests (`tests/*.test.mjs`) | 17 | Language codes, spend-ceiling coverage, no fabricated measurement, SRS clock, corpus integrity, cost recording |
| Claims verifier (`scripts/verify-claims.mjs`) | 18 claims | Every factual claim in the docs is paired with an executable check; a doc that drifts from the code fails CI |
| No `@ts-nocheck` anywhere | — | No file exempts itself from typechecking |
| Production boot check | — | The server actually starts in production mode |
| Dependency audit | — | High and critical advisories fail |

## Not validated

| Question | Plan | Pass bar |
|---|---|---|
| Does feedback improve intelligibility? | 10 learners, 2 weeks, blind native-listener ratings before and after | Measurable improvement vs control sentences |
| Does transcript judgement agree with a phonetician? | 100 utterances rated by a phonetician | Agreement reported; expected to be weak (see ADR-0001) |
| Real cost per active learner per week | 50 real sessions with the cost meter | Reported, then priced |
| Corpus quality in 10 non-core languages | Native-speaker review ([DATA-QUALITY.md](DATA-QUALITY.md)) | ≥ 95% natural sentences; every proverb attested |
