# ADR-0001 — Replace transcript-judgement scoring with L1-aware acoustic scoring

**Status:** Accepted · **Date:** 2026-09-12 · **Decision owner:** Ossama Mokhtar
**Supersedes:** the implicit architecture shipped in `server.ts` up to `0279736`
**Closes audit findings:** SL-02, SL-06, SL-07, SL-08

---

## Context

Fluvio sells pronunciation assessment. The shipped pipeline could not perform it.

```
microphone ──► Whisper ──► transcript ──► GPT-4o ──► "pronunciation_score"
                    │                        ▲
                    └── audio stops here ────┘  the model never hears anything
```

Three consequences, each confirmed against source:

1. **The model receives text, not audio** (`server.ts:347–372`). A pronunciation
   score derived from comparing two strings is a judgement about transcription
   fidelity, not about articulation.
2. **Whisper actively destroys the signal.** It is trained to normalise accented
   and disfluent speech into clean orthography. A learner who says *"I hef fife
   fegetables"* is very likely transcribed as *"I have five vegetables"* — the
   exact `/v/ → /f/` substitution the product exists to detect is repaired one
   step before scoring. The harder the accent, the more Whisper hides it.
3. **The gaps were filled with fabrication.** `generatePitchContour` produced
   `sin(t·2.5)·30 + 180 + random()` and overwrote whatever the model returned;
   the client rendered it as a "your pitch vs native pitch" chart. Scenario
   scores came from a static lookup table on the success path.

There is no proprietary speech capability in this architecture. It is a prompt
over commodity APIs, reproducible by a competent engineer in a weekend.

## Decision

Adopt **substitution-aware, alignment-free Goodness of Pronunciation (GOP) over a
self-supervised phoneme model, constrained by an Arabic-L1 phoneme confusion
map.**

### The pipeline

```
                                          ┌──────────────────────────────┐
microphone ──► 16 kHz mono PCM ──────────►│ wav2vec2-xlsr-53-espeak-cv-ft│
     │                                    │  phoneme posteriors / frame  │
     │                                    └──────────────┬───────────────┘
     │                                                   │
     │         ┌──────────────────────┐                  ▼
     │         │ AR-L1 confusion map  │──────►  CTC alignment-free GOP
     │         │ (the moat asset)     │         per-phoneme score + the
     │         └──────────────────────┘         substitution actually made
     │                                                   │
     ├──► WORLD / pYIN ──► real F0 contour ──────────────┤
     │                                                   ▼
     └──► duration, energy ──────────────────►  coaching text (small LLM,
                                                 given the measurements)
```

Nothing downstream invents a number. The LLM is demoted from *assessor* to
*explainer*: it receives measurements and writes the coaching sentence.

### Why alignment-free GOP

Parikh et al., *"Enhancing GOP in CTC-Based Mispronunciation Detection with
Phonological Knowledge"* (Interspeech 2025), report that substitution-aware
alignment-free GOP reaches **0.595 MCC** on their L2 children's corpus against
**0.242 MCC** for a Kaldi forced-alignment GOP baseline, and **94.2% accuracy /
0.502 PCC** on speechocean762. It also removes the forced-alignment step, which
is both the slowest component and the one that degrades most on accented speech.

The gain comes from **constraining the substitution space with an L1-specific
phoneme confusion map** — telling the scorer which errors this learner population
actually makes, rather than scoring against all 44 phonemes uniformly.

### Why that is a moat and not a feature

Every published confusion map is Mandarin-L1, because the field's benchmark
corpus — speechocean762 — is 5,000 utterances from 250 Mandarin speakers. **No
public Arabic-L1 pronunciation-assessment corpus or confusion map exists.**

So the asset is not the model. The model is an open checkpoint anyone can
download. The asset is:

1. **The Arabic-L1 phoneme confusion map** — seeded from the literature (see
   `data/licensed/en_ar_corpus.ts` → `AR_L1_CONFUSION_MAP`), then replaced
   phoneme by phoneme with conditional probabilities measured from real GCC
   learner recordings.
2. **The labelled Arabic-L1 corpus** that produces it. Every practice session in
   the product is an elicitation event for a targeted phoneme, because the corpus
   was built that way.
3. **Compounding**: more learners → more labels → a sharper map → better
   detection → better retention → more learners. Duolingo cannot copy this
   without running the same data collection in the same market.

This is the difference between "an app that uses AI" and "an AI product".

### Seed error inventory

From two published studies of Arabic-L1 English production:

| Target | Substitution | Rate | Source |
|---|---|---|---|
| /v/ | → /f/ | 100% (unidirectional) | Rehman et al. 2022 |
| /ʒ/ | → /ʃ/ or ∅ | 84.2% | Aldaghri 2019 |
| final 4-C clusters | vowel epenthesis | 83.8% | Aldaghri 2019 |
| /ŋ/ | → [ŋɡ] or /n/ | 80.8% | Aldaghri 2019 |
| *-ed* morpheme | deleted or /ɪd/ | 68.8% | Aldaghri 2019 |
| /p/ | → /b/ | 63.3% / 27.8% | Aldaghri / Rehman |
| /ɹ/ | → Arabic trill [r] | 56.7% / 35.1% | Aldaghri / Rehman |
| /dʒ/ | → /ʒ/ or /tʃ/ | 40.1% | Rehman et al. 2022 |
| /tʃ/ | → /ʃ/ | 30.0% | Aldaghri 2019 |
| /oʊ/ | → /ɔ/ | 27.5% | Rehman et al. 2022 |
| /z/ | → /s/ | 23.0% | Rehman et al. 2022 |
| /ð/ | → /z/ or /d/ | 21.7% | Rehman et al. 2022 |
| /eɪ/ | → /ɛ/ | 15.2% | Rehman et al. 2022 |
| /ɛ/ ~ /ɪ/ | merged | 10.6% | Rehman et al. 2022 |

Overall segmental error rate for advanced Arabic-L1 speakers: **11.14%** across
19,764 annotated phones (Rehman et al., L2-ARCTIC).

## Consequences

### Cost — the reason this also fixes the business model

Self-hosted inference replaces per-call API spend. Order-of-magnitude estimate
per practice session, to be replaced by measured figures once the GPU node runs:

| | Current | Target |
|---|---|---|
| ASR / acoustic | `gpt-4o-transcribe` @ $0.006/min | wav2vec2 on a shared L4, batched |
| Assessment | flagship LLM completion | none — it is a matrix operation |
| Coaching text | flagship LLM completion | smallest current model, short output |
| **Rough per session** | **~$0.010** | **~$0.001** |

The audit found that inference cost **$21–24 per MAU per year** against blended
ARPU of **$7–9** — gross profit negative in every forecast year. A ~10× reduction
in cost-to-serve moves free-tier cost below the ~$2/MAU/yr threshold where a
freemium funnel stops being the thing that kills the company.

**The same investment creates the defensibility and fixes the unit economics.**
That is the strongest argument for sequencing it first.

### What the learner sees change

- Per-phoneme scores with real timings, and the substitution actually produced
  ("you said /f/ where /v/ was expected, at 0.84s") instead of a summary score.
- A pitch contour that is measured, or no pitch contour at all.
- Scenario dimensions that move between turns.
- No IELTS equivalence until ADR-0002 calibration supports it.

### Risks accepted

| Risk | Mitigation |
|---|---|
| GPU node adds fixed cost before revenue | Start on serverless GPU, billed per second. Fixed node only past ~5k DAU. |
| The seed map is literature-derived, not measured | Every prior is versioned and replaced with a measured conditional as labels arrive. Priors are visible in the code, not buried. |
| Latency budget (target < 2s) | wav2vec2-base inference on a 5s clip is tens of milliseconds on GPU. The LLM coaching sentence is the long pole and can stream after the score renders. |
| Model licence | `wav2vec2-xlsr-53-espeak-cv-ft` — verify the checkpoint licence permits commercial use before launch. **Open item.** |
| Arabic-L1 corpus needs real speakers | Recruitment is the critical path, not engineering. See ADR-0002. |

## Alternatives rejected

- **Keep the LLM assessor, send it audio.** Cheaper to build, but still a black
  box with no per-phoneme output, no cost reduction, and nothing proprietary.
- **Buy an assessment API** (SpeechAce, Azure Pronunciation Assessment). Fastest
  path to a working score; permanently rents the only defensible layer and keeps
  cost-to-serve variable.
- **Forced-alignment GOP (Kaldi/MFA).** The classical approach, and the baseline
  the 2025 result beats by more than 2× MCC on L2 speech.

## References

1. Parikh et al. (2025), *Enhancing GOP in CTC-Based Mispronunciation Detection
   with Phonological Knowledge*, Interspeech 2025.
2. Zhang et al. (2021), *speechocean762: An Open-Source Non-native English Speech
   Corpus for Pronunciation Assessment*, Interspeech 2021. openslr.org/101.
3. Rehman, Silpachai, Levis, Zhao & Gutierrez-Osuna (2022), *The English
   pronunciation of Arabic speakers: A data-driven approach to segmental error
   identification*, Language Teaching Research.
4. Aldaghri (2019), *Consonant Pronunciation Errors Made by Saudi EFL Students*,
   Arab World English Journal 10(4).
