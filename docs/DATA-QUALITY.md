# Fluvio — Corpus data quality

> Updated 2026-09-23 (portfolio audit). Owner: Ossama Mokhtar.

## What the audit found

Commit `8bff1e9` ("expand to 13 languages with 10k proverbs + 10k words each") generated corpus files that hit their advertised sizes by repetition:

| File type | Advertised per language | Unique entries found |
|---|---|---|
| Proverbs | 1,000–10,000 | 10–54 after removing filler (see below) |
| Words | 10,000 | 175–421 |
| Sentences | 1,100 | 436 |

- The German, Japanese, Portuguese and Chinese proverb files held **10 unique proverbs**, each repeated 500 times.
- Arabic, Hindi, Korean, Russian and Turkish proverbs were padded to about 850 "unique" rows by prefixing German filler words ("Ursprüngliches", "Stets", "Erwähnenswert"…) and varying the final punctuation. Removing those leaves 10 per language, and some of the 10 are single words ("الحياة" = "life"), not proverbs.
- 159 Italian "proverbs" were one template: "L'Italia è la terra della …".
- Every sentence's `translation` was an exact copy of `text`, and every sentence claimed `native_audio_available: true` with no audio assets.
- Spelling errors remain in generated sentences (for example "Hallo, mein Name istt Ahmed.").

## What was changed

- Duplicates, filler-prefixed variants and the Italian template rows were removed; ids re-numbered. Data went from about 73 MB to about 4 MB.
- Echo translations were blanked, and `native_audio_available` set to `false`.
- README counts now state unique entries.
- `scripts/verify-claims.mjs` claim C-18 fails CI on duplicate entries or echo translations.

## What is still true

- Apart from the English/Arabic licensed corpus (`data/licensed/`), **no language set has been reviewed by a native speaker.** Treat the 10 non-core languages as placeholders.
- Some remaining proverbs are invented. Review is the only fix.

## Review plan (before advertising any language)

1. A native speaker reviews 100 sentences and every proverb per language.
2. Pass bar: at least 95% of sentences are grammatical and natural, and every proverb is attested.
3. Only languages that pass are listed as "supported" in the UI and README.
