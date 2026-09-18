import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = readFileSync('data/licensed/en_ar_corpus.ts', 'utf8');
const rows = [...src.matchAll(
  /\{ id: '([^']+)', text: '([^']+)', translation_ar: '([^']+)', ipa: '([^']+)', cefr_level: '([^']+)', topic: '([^']+)', target_phoneme: '([^']+)'/g,
)].map(([, id, text, ar, ipa, cefr, topic, phon]) => ({ id, text, ar, ipa, cefr, topic, phon }));

test('corpus parses and is non-trivial', () => {
  assert.ok(rows.length >= 40, `only ${rows.length} rows parsed`);
});

test('SL-04: every id is unique', () => {
  const ids = rows.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('SL-05: no translation echoes its source text', () => {
  for (const r of rows) {
    assert.notEqual(r.ar, r.text, `${r.id} translation echoes source`);
    assert.ok(!r.ar.startsWith('['), `${r.id} has a placeholder translation`);
    assert.ok(/[؀-ۿ]/.test(r.ar), `${r.id} translation is not Arabic script`);
  }
});

test('SL-05: no ipa field is the source text in slashes', () => {
  for (const r of rows) {
    assert.notEqual(r.ipa, `/${r.text}/`, `${r.id} has placeholder IPA`);
    assert.ok(r.ipa.startsWith('/') && r.ipa.endsWith('/'), `${r.id} IPA is not slash-delimited`);
    assert.ok(/[ɪɛæɑɔʊʌəɚɹŋʒʃðθdʒtʃ]/.test(r.ipa), `${r.id} IPA contains no IPA characters`);
  }
});

test('SL-05: CEFR labels are valid and topics are not random filler', () => {
  const valid = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  for (const r of rows) {
    assert.ok(valid.has(r.cefr), `${r.id} has CEFR "${r.cefr}"`);
    assert.ok(r.topic.length > 2, `${r.id} has no topic`);
  }
});

test('every row declares the phoneme it elicits', () => {
  for (const r of rows) assert.ok(r.phon.length > 0, `${r.id} has no target phoneme`);
});

test('the corpus covers the highest-frequency Arabic-L1 error phonemes', () => {
  const covered = new Set(rows.map((r) => r.phon));
  for (const p of ['/p/', '/v/', '/ʒ/', '/ŋ/', '/ɹ/', '/dʒ/', '/tʃ/', '/ð/', '/z/', '/oʊ/', '/eɪ/']) {
    assert.ok(covered.has(p), `no elicitation item for ${p}`);
  }
});
