import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const server = readFileSync('server.ts', 'utf8');
const stripped = server.replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');

test('SL-14: every supported language resolves to its own code', () => {
  const map = stripped.match(/export const LANGUAGE_CODES[\s\S]*?\};/)[0];
  for (const [name, code] of [['English', 'en'], ['Arabic', 'ar'], ['Spanish', 'es'], ['French', 'fr']]) {
    assert.ok(map.includes(`${name}: "${code}"`), `${name} does not map to ${code}`);
  }
  // The regression: everything unknown used to fall through to French.
  assert.ok(!/: 'fr',?\s*$/m.test(stripped.match(/language: toLanguageCode[^\n]*/)?.[0] ?? ''),
    'whisper language still has a French fallback');
});

test('SL-03: every billable route is behind the spend ceiling', () => {
  for (const route of ['/api/analyze-audio', '/api/generate-tts', '/api/generate-lesson-plan']) {
    const i = stripped.indexOf(`app.post("${route}"`);
    assert.ok(i > 0, `${route} not found`);
    const head = stripped.slice(i, i + 400);
    assert.ok(head.includes('consumeAIBudget'), `${route} is not budget-gated`);
  }
});

test('SL-07: the analysis response declares what it did and did not measure', () => {
  assert.ok(stripped.includes('audio_analysed: false'));
  assert.ok(stripped.includes('pitch_measured: false'));
  assert.ok(stripped.includes('delete analysis.pitch_contour'));
});

test('SL-12: the SPA catch-all is Express 5 syntax', () => {
  assert.ok(!/app\.get\("\*"/.test(stripped), 'bare "*" throws on Express 5');
  assert.ok(stripped.includes('/{*splat}'));
});

test('SL-17: the free-text field is sanitised', () => {
  const n = (stripped.match(/safeSentence\(req\.body\?\.message/g) || []).length;
  assert.equal(n, 2, `expected both companion routes to sanitise message, found ${n}`);
});

test('SL-21: body limit is inside the platform cap', () => {
  const m = stripped.match(/BODY_LIMIT \|\| "(\d+)mb"/);
  assert.ok(m && Number(m[1]) <= 4, 'body limit exceeds the 4.5MB platform cap');
});
