import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync('services/srsService.ts', 'utf8');

test('SL-18: the clock is not captured at module scope', () => {
  assert.ok(!/^const NOW = Date\.now\(\);$/m.test(src),
    'module-scope NOW freezes due-ness for the life of the process');
  assert.ok(/const now = \(\) => Date\.now\(\);/.test(src));
});

test('SL-18: due-date helpers default to the live clock', () => {
  for (const fn of ['isDue', 'getDueSentences', 'getDueCount']) {
    const i = src.indexOf(`function ${fn}(`);
    assert.ok(i > 0, `${fn} not found`);
    const sig = src.slice(i, src.indexOf(')', src.indexOf('{', i)) + 1);
    assert.ok(sig.includes('at: number = now()'), `${fn} does not default to the live clock`);
  }
});
