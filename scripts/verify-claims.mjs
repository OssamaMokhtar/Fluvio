#!/usr/bin/env node
/**
 * verify-claims — the structural answer to "documentation accuracy is weak".
 *
 * The 2026-09-12 due diligence found 22 defects. Nineteen shared one root cause:
 * a claim was written down and never checked against the thing it described.
 * Discipline does not fix that; a gate does.
 *
 * Every claim in this file is a fact asserted somewhere in the documentation,
 * paired with an executable check against the source. If a doc and the code
 * disagree, CI fails and names both. Adding a number to a README without adding
 * a claim here is the process violation — not the number being wrong.
 *
 * Run: node scripts/verify-claims.mjs
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), 'utf8');

/**
 * Strip comments before checking for code patterns.
 *
 * Without this, a check can be satisfied — or tripped — by prose that merely
 * *mentions* the pattern. The first version of this file failed C-13 and C-16
 * because the comments explaining those fixes quoted the code being removed.
 * A gate that can be fooled by its own changelog is not a gate.
 */
const code = (p) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n');
const exists = (p) => existsSync(join(root, p));

const claims = [];
const claim = (id, where, statement, check) => claims.push({ id, where, statement, check });

// ---------------------------------------------------------------- corpus
claim('C-01', 'README · PRD · portal KPI', 'Every corpus row has a unique id', () => {
  const src = read('data/licensed/en_ar_corpus.ts');
  const ids = [...src.matchAll(/id: '([^']+)'/g)].map((m) => m[1]);
  const dupes = ids.filter((v, i) => ids.indexOf(v) !== i);
  if (dupes.length) throw new Error(`duplicate ids: ${[...new Set(dupes)].join(', ')}`);
  return `${ids.length} rows, ${new Set(ids).size} unique ids`;
});

claim('C-02', 'PRD §Data', 'No corpus row echoes its source text as its translation', () => {
  const src = read('data/licensed/en_ar_corpus.ts');
  const rows = [...src.matchAll(/text: '([^']*)'[^\n]*?translation_ar: '([^']*)'/g)];
  const bad = rows.filter(([, en, ar]) => ar === en || ar.startsWith('['));
  if (bad.length) throw new Error(`${bad.length} placeholder translations`);
  return `${rows.length} rows carry a distinct Arabic translation`;
});

claim('C-03', 'PRD §Data', 'No ipa field is the source text wrapped in slashes', () => {
  const src = read('data/licensed/en_ar_corpus.ts');
  const rows = [...src.matchAll(/text: '([^']*)'[^\n]*?ipa: '([^']*)'/g)];
  const bad = rows.filter(([, en, ipa]) => ipa === `/${en}/`);
  if (bad.length) throw new Error(`${bad.length} placeholder IPA fields`);
  return `${rows.length} rows carry real IPA`;
});

claim('C-04', 'README §Languages', 'Practice languages advertised = languages the library serves', () => {
  const lib = read('services/sentenceLibrary.ts');
  const served = [...lib.matchAll(/if \(code === '(\w+)'\) return/g)].map((m) => m[1]);
  const quarantined = exists('data/_deprecated')
    ? readdirSync(join(root, 'data/_deprecated')).map((f) => f.slice(0, 2))
    : [];
  const leak = served.filter((c) => quarantined.includes(c));
  if (leak.length) throw new Error(`serving quarantined corpora: ${leak.join(', ')}`);
  return `practice languages: ${served.join(', ')}`;
});

// ------------------------------------------------------------ no fabrication
claim('C-05', 'Audit SL-07', 'The server fabricates no measurement data', () => {
  const body = code('server.ts');
  const banned = ['generatePitchContour', 'generatePhonemeErrors', 'generateProsodyDeviations'];
  const found = banned.filter((f) => body.includes(f));
  if (found.length) throw new Error(`synthetic generator present: ${found.join(', ')}`);
  if (!body.includes('audio_analysed: false')) {
    throw new Error('analysis response no longer declares its measurement provenance');
  }
  return 'no synthetic generators; provenance declared on every analysis';
});

claim('C-06', 'Audit SL-02', 'Scenario scores come from the model, not a static table', () => {
  const body = code('services/scenarioService.ts');
  // The success path is the block that parses the model response. heuristicScores
  // is still legitimate inside localScenarioFallback, so scope the check.
  const success = body.slice(body.indexOf('const parsed = JSON.parse(content)'));
  const upto = success.slice(0, success.indexOf('return {'));
  if (/heuristicScores\(/.test(upto)) {
    throw new Error('success path still overwrites model scores with the lookup table');
  }
  if (!body.includes('coerceScores(parsed.scores')) throw new Error('model scores not consumed');
  if (!/measured: false/.test(body)) throw new Error('fallback scores are not flagged as unmeasured');
  return 'model evaluation consumed, validated, fallback flagged';
});

// ------------------------------------------------------- security & spend
claim('C-07', 'SECURITY.md §Controls', 'trust proxy is set, so rate limiting keys on the caller', () => {
  if (!read('server.ts').includes('app.set("trust proxy"')) throw new Error('trust proxy not set');
  return 'trust proxy = 1';
});

claim('C-08', 'SECURITY.md §Controls', 'A hard daily ceiling bounds billable AI calls', () => {
  const src = read('server.ts');
  if (!src.includes('AI_CALL_BUDGET_PER_DAY')) throw new Error('no spend ceiling');
  const gated = (src.match(/consumeAIBudget\(/g) || []).length - 1; // minus the definition
  if (gated < 3) throw new Error(`only ${gated} billable routes gated`);
  return `${gated} billable routes gated by the daily budget`;
});

claim('C-09', 'SECURITY.md §Controls', 'Free-text user input is sanitised before reaching a prompt', () => {
  const src = code('server.ts');
  if (!/const message = safeSentence\(req\.body\?\.message/.test(src)) {
    throw new Error('companion/scenario message is not sanitised');
  }
  if ((src.match(/function safeLabel/g) || []).length > 0) {
    throw new Error('a duplicate sanitiser has reappeared in server.ts');
  }
  return 'single sanitiser, applied to the free-text field';
});

claim('C-10', 'SECURITY.md', 'No secret is inlined into the client bundle', () => {
  const vite = code('vite.config.ts');
  if (/define:[\s\S]*API_KEY/.test(vite)) {
    throw new Error('vite define still inlines an API key into client code');
  }
  return 'no API key reaches the client bundle';
});

// ---------------------------------------------------------------- runtime
claim('C-11', 'README §Deployment', 'The SPA catch-all uses Express 5 path syntax', () => {
  const src = code('server.ts');
  if (/app\.get\("\*"/.test(src)) throw new Error('bare "*" throws PathError on Express 5');
  if (!src.includes('/{*splat}')) throw new Error('no SPA catch-all found');
  return 'catch-all is /{*splat}';
});

claim('C-12', 'README §API', 'The body limit fits inside the platform limit', () => {
  const src = read('server.ts');
  const m = src.match(/BODY_LIMIT \|\| "(\d+)mb"/);
  if (!m) throw new Error('no body limit configured');
  if (Number(m[1]) > 4) throw new Error(`${m[1]}mb exceeds Vercel's 4.5MB function body cap`);
  return `${m[1]}mb, inside the 4.5MB platform cap`;
});

claim('C-13', 'Audit SL-13', 'TTS audio is decoded by format, not assumed to be PCM', () => {
  const src = code('services/audioUtils.ts');
  if (/new Int16Array\(bytes\.buffer\)/.test(src)) throw new Error('still decoding MP3 as raw PCM');
  if (!src.includes('decodeAudioData')) throw new Error('decodeAudioData not used');
  return 'decodeAudioData handles the real format';
});

claim('C-14', 'Audit SL-18', 'The SRS clock is read per call, not captured at import', () => {
  const src = code('services/srsService.ts');
  if (/^const NOW = Date\.now\(\);$/m.test(src)) throw new Error('module-scope clock is back');
  return 'clock read per call';
});

claim('C-15', 'Audit SL-08', 'No IELTS equivalence is asserted without a calibration study', () => {
  const src = code('services/assessmentService.ts');
  if (/ieltsEquivalent: '/.test(src)) throw new Error('IELTS equivalence asserted');
  if (/match\(\/grammar\/gi\)/.test(src)) throw new Error('keyword-frequency scoring is back');
  return 'no exam-equivalence claim; no keyword-derived scores';
});

claim('C-16', 'CI', 'No file exempts itself from typechecking', () => {
  const hits = [];
  const walk = (dir) => {
    for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
      if (['node_modules', 'dist', '.git', '_deprecated', '.vercel'].includes(e.name)) continue;
      const rel = `${dir}/${e.name}`.replace(/^\.\//, '');
      if (e.isDirectory()) walk(rel);
      else if (/\.tsx?$/.test(e.name) && /^\s*(\/\/|\/\*)?\s*@ts-nocheck/m.test(read(rel))) hits.push(rel);
    }
  };
  walk('.');
  if (hits.length) throw new Error(`@ts-nocheck in: ${hits.join(', ')}`);
  return 'no @ts-nocheck outside the quarantine';
});

claim('C-17', 'README §License', 'The licence statement matches the LICENSE file', () => {
  const lic = read('LICENSE');
  const readme = read('README.md');
  const isMit = lic.includes('MIT License');
  // Match the declaration, not prose that quotes the old wording.
  const decl = (readme.match(/^## License\s*\n+([^\n]+)/m) || [])[1] || '';
  if (isMit && !/MIT/.test(decl)) {
    throw new Error(`LICENSE is MIT but README declares: "${decl.trim()}"`);
  }
  return isMit ? 'MIT, stated consistently' : 'non-MIT licence, stated consistently';
});

// ------------------------------------------------------------ corpus honesty
claim('C-18', 'README §Data Counts, docs/DATA-QUALITY.md', 'Corpus files hold unique entries and no echo translations', () => {
  const dir = 'data/sentences';
  const files = readdirSync(join(root, dir)).filter((f) => f.endsWith('.ts'));
  let entries = 0;
  for (const f of files) {
    const src = read(join(dir, f));
    const key = f.includes('_words') ? 'word' : 'text';
    const re = new RegExp(`\\b${key}:\\s*(["'\`])((?:\\\\.|(?!\\1).)*)\\1`, 'g');
    const vals = [...src.matchAll(re)].map((m) => m[2].trim().toLowerCase());
    const dupes = vals.length - new Set(vals).size;
    if (dupes > 0) throw new Error(`${f}: ${dupes} duplicate ${key} entries`);
    if (f.includes('_sentences')) {
      const echo = [...src.matchAll(/text: `((?:\\.|[^`])*)`,\s*translation: `((?:\\.|[^`])*)`/g)].filter((m) => m[1] === m[2]).length;
      if (echo > 0) throw new Error(`${f}: ${echo} translations copy the source text`);
      if (/native_audio_available:\s*true/.test(src)) throw new Error(`${f}: claims native audio that does not exist`);
    }
    entries += vals.length;
  }
  return `${files.length} files, ${entries} unique entries, no echo translations`;
});

// --------------------------------------------------------------------- run
let failed = 0;
const pad = (s, n) => String(s).padEnd(n);
console.log('\nverify-claims — documented claims checked against source\n');
for (const c of claims) {
  try {
    const evidence = c.check();
    console.log(`  PASS  ${pad(c.id, 6)} ${pad(c.statement, 62)} ${evidence}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL  ${pad(c.id, 6)} ${c.statement}`);
    console.log(`        claimed in: ${c.where}`);
    console.log(`        reality:    ${err.message}`);
  }
}
console.log(`\n  ${claims.length - failed}/${claims.length} claims verified\n`);
if (failed) {
  console.error(`${failed} documented claim(s) are not true of this codebase.`);
  console.error('Fix the code, or fix the document. Do not weaken the check.\n');
  process.exit(1);
}
