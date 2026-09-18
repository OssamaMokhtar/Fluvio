# Security

**Status:** Prototype hardening in progress. Not yet production-certified.
**Last verified:** 2026-09-12 against commit `0279736` + remediation batch.

> Every control marked ✅ below is asserted by an executable check in
> [`scripts/verify-claims.mjs`](../scripts/verify-claims.mjs) and fails CI if it
> stops being true. A control with no check is marked ⬜ *Planned* and is not
> claimed. This replaces the previous version of this file, which claimed a
> build-time secret check that did not exist.

## Architecture security model

- The OpenAI key is held server-side only, read from `process.env.OPENAI_API_KEY`
  inside the Express process. It is never sent to the browser.
- The client talks only to `/api/*`. It holds no credentials of any kind.
- There is no database and no server-side user record. All learner state lives in
  the browser (`localStorage`, IndexedDB).

## Current controls

| Control | Status | Verified by | Notes |
|---|---|---|---|
| No secret inlined into the client bundle | ✅ | `C-10` | `vite.config.ts` previously used `define` to inline `GEMINI_API_KEY` into client code as `process.env.API_KEY`. Nothing leaked in practice — no such key was set after the OpenAI migration — but the mechanism was armed. The `define` block is gone and C-10 fails the build if it returns. |
| Rate limiting keys on the caller, not the proxy | ✅ | `C-07` | `app.set('trust proxy', 1)`. Express 5 defaults to `false`, so `req.ip` used to resolve to the platform proxy and every caller shared one bucket. |
| Per-device rate-limit identity | ✅ | `C-07` | Prefers an `X-Slang-Device` token over IP. Carrier-grade NAT is the norm across GCC mobile networks, so IP is a poor identity there. |
| Hard daily ceiling on billable AI calls | ✅ | `C-08` | `AI_CALL_BUDGET_PER_DAY` (default 2000). Fails **closed** with `429 AI_BUDGET_EXHAUSTED`. All three billable routes are gated. |
| Free-text input sanitised before prompts | ✅ | `C-09` | `safeSentence` is applied to the companion and scenario `message` fields — the only genuinely adversarial inputs. Previously every closed-vocabulary field was sanitised and this one was not. |
| Single sanitiser definition | ✅ | `C-09` | `services/sanitization.ts`. A byte-identical duplicate in `server.ts` was deleted. |
| Request body inside the platform cap | ✅ | `C-12` | 4 MB, under Vercel's 4.5 MB function limit. An 8 MB Express limit previously accepted payloads the platform then rejected opaquely. |
| Server boots in production mode | ✅ | `scripts/boot-check.mjs` | Runs in CI. The Express 5 SPA catch-all is `/{*splat}`; a bare `"*"` throws `PathError` and crashed `npm start`. |
| HTTPS (TLS 1.2+) | ✅ | Vercel platform | All Vercel deployments. |
| Dependency audit gate | ✅ | CI | `npm audit --omit=dev --audit-level=high`, no `|| true`. |

## Known gaps — stated, not hidden

| Gap | Severity | Why it matters | Plan |
|---|---|---|---|
| Rate-limit and budget state is in-process | High | Each Vercel invocation holds its own counter, so the effective global ceiling is *instances × budget*. Deliberately conservative, but not a true global limit. | Move both to Upstash Redis. First item in `docs/spend-control.md`. |
| No authentication | High | Every AI route is anonymous. Spend is bounded by the daily ceiling but not attributable to a user, so abuse cannot be isolated from legitimate load. | Device tokens ship first (already the rate-limit key); accounts follow with the B2B tier. |
| No Content Security Policy | Medium | Vercel does **not** add a CSP by default — the previous version of this file said it did. The Tailwind Play CDN and the `aistudiocdn.com` import map have been removed, so the page no longer loads third-party script origins, but no policy is enforced. | Add `Content-Security-Policy` via `vercel.json` headers. |
| No secret scanning in CI | Medium | Nothing stops a key being committed. | `gitleaks` in the CI workflow. |
| No penetration test | Medium | Never been tested adversarially. | Before any paid tier. |
| Deprecated model pinning | Medium | `gpt-4o`, `whisper-1` and `tts-1` are no longer listed on OpenAI's pricing page. Retirement would take the product down with no warning. | Pin to a current generation and add a model-availability check to CI. |

## Data classification

| Data | Classification | Where it lives |
|---|---|---|
| Voice recordings | Sensitive — personal data; treat as biometric-adjacent | Transmitted to OpenAI for transcription. Retained in the browser (IndexedDB) only. Not stored server-side. |
| Pronunciation scores | Internal | Browser only. |
| IP address | Personal data | Held in memory for the rate-limit window (60s). Not logged, not persisted. |
| Device token | Pseudonymous identifier | Browser `localStorage`; sent as a request header. |

## Reporting a vulnerability

Contact the maintainer directly. Do not open a public issue.

---

*Changes to this file must be matched by a check in `scripts/verify-claims.mjs`.
A control claimed here without a check is the exact failure mode this document
was rewritten to eliminate.*
