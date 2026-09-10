# Security

**Status:** Prototype — not production hardened.

## Architecture Security Model

- The Gemini API key is held server-side only.
- A build-time check asserts the key cannot appear in the client bundle.
- The key is never exposed to the browser.
- Rate limiting: currently in-memory (acknowledged as insufficient — move to Vercel KV or Redis before real traffic).

## Data Classification

| Data Type | Classification | Notes |
|-----------|---------------|-------|
| Voice recordings | Sensitive (biometric/PII) | User audio for pronunciation analysis |
| Phoneme scores | Internal | Scoring results, weak phoneme identification |
| Lesson plans | Internal | Generated practice materials |

## Known Security Gaps

| Gap | Severity | Roadmap |
|-----|----------|---------|
| In-memory rate limiting (insufficient across serverless instances) | Medium | Move to Vercel KV or Redis |
| No encryption at rest for voice recordings | High | Pre-production |
| No RBAC | High | Pre-production |
| No SSO | High | Pre-production |
| No penetration test | High | Pre-production |
| No dependency vulnerability scanning | Medium | CI (this PR) |
| Voice recordings may be PII under UAE PDPL | High | Data retention + deletion mechanism |

## Reporting a Vulnerability

Contact the maintainer directly. Do not open a public issue for security vulnerabilities.

---

*See [Improvement Plan — Slang](../../Obsidian/Portfolio-Due-Diligence/07-Improvement-Plan-Slang.md) for the full security hardening roadmap.*
