// Dynamic sentence/word loader - avoids bundling 76MB of data into server bundle
// Usage: const sentences = await loadSentences('en');

const sentenceModules: Record<string, Promise<any[]>> = {};
const wordModules: Record<string, Promise<any[]>> = {};
const countModules: Record<string, Promise<number>> = {};

export async function loadSentences(lang: string): Promise<any[]> {
  if (!sentenceModules[lang]) {
    sentenceModules[lang] = import(`../data/sentences/${lang}_sentences.ts`)
      .then(m => m[`${lang.toUpperCase()}_SENTENCES`])
      .catch(() => []);
  }
  return sentenceModules[lang];
}

export async function loadWords(lang: string): Promise<any[]> {
  if (!wordModules[lang]) {
    wordModules[lang] = import(`../data/sentences/${lang}_words.ts`)
      .then(m => m[`${lang.toUpperCase()}_WORDS`])
      .catch(() => []);
  }
  return wordModules[lang];
}

export async function loadSentenceCount(lang: string): Promise<number> {
  if (!countModules[lang]) {
    countModules[lang] = import(`../data/sentences/${lang}_sentences.ts`)
      .then(m => m[`${lang.toUpperCase()}_SENTENCE_COUNT`])
      .catch(() => 0);
  }
  return countModules[lang];
}

// Pre-load common languages for faster access
export async function preloadCommonLanguages(): Promise<void> {
  const common = ['en', 'es', 'fr', 'de', 'it'];
  await Promise.all([
    ...common.map(l => loadSentences(l)),
    ...common.map(l => loadWords(l)),
  ]);
}
