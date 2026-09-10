# Rate Limiting Migration — Slang

**Status:** Migration guide — in-memory rate limiting to shared store.

## Current State

Rate limiting is implemented in-memory: 10 requests per minute per IP.

This is correct for a single-instance deployment, but **only partially effective across serverless instances**. Vercel serverless functions run in multiple instances; in-memory state is not shared across instances. A user could make 10 requests to instance A and 10 requests to instance B, effectively doubling their rate limit.

## Target State

Rate limiting with a shared store: Vercel KV (Redis-compatible) or Upstash Redis.

- Rate limit state is shared across all serverless instances
- Rate limiting is effective regardless of which instance handles the request
- Rate limiting can be configured per endpoint, per user, per IP

## Migration Steps

### Step 1: Set up Vercel KV (or Upstash Redis)

```bash
vercel link
vercel add-on add vercel-kv
# Or: create Upstash Redis database and add REDIS_URL to environment variables
```

### Step 2: Install Redis client

```bash
npm install ioredis   # or redis (official client)
```

### Step 3: Replace in-memory rate limiter with Redis-backed limiter

```typescript
// Before: in-memory
const rateLimitMap = new Map<string, number[]>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const window = 60000; // 1 minute
  const limit = 10;
  // ... in-memory logic
}

// After: Redis-backed
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

async function checkRateLimit(ip: string): Promise<boolean> {
  const key = `ratelimit:${ip}`;
  const limit = 10;
  const window = 60; // seconds
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, window);
  }
  return count <= limit;
}
```

### Step 4: Update CI to test rate limiting

Add a test that verifies rate limiting works across concurrent requests (simulate multiple instances).

### Step 5: Document rate limiting in SECURITY.md

Update SECURITY.md to reflect the new rate limiting implementation.

## Risks

| Risk | Mitigation |
|------|------------|
| Vercel KV costs money at scale | Start with Vercel KV (free tier), migrate to Upstash Redis if needed |
| Redis connection failures | Add fallback to in-memory rate limiting (degraded, not failsafe) |
| Redis latency | Keep rate limit checks fast; don't add latency to the request path |

## Relationship to Improvement Plan

This migration is Phase 2 of the Slang improvement plan. See [[07-Improvement-Plan-Slang]].
