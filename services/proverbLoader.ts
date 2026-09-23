// Dynamic proverb loader - avoids bundling 70k proverbs into server bundle
// Usage: const proverbs = await loadProverbs('en');

const proverbModules: Record<string, Promise<{ [key: string]: any }>> = {};

export async function loadProverbs(lang: string): Promise<any[]> {
  const upper = lang.toUpperCase();
  if (!proverbModules[upper]) {
    try {
      proverbModules[upper] = import(`../data/sentences/${lang}_proverbs.ts`)
        .then(m => m[`${upper}_PROVERBS`] as any[])
        .catch(() => {
          return [] as any[];
        });
    } catch {
      proverbModules[upper] = Promise.resolve([] as any[]);
    }
  }
  return proverbModules[upper] as Promise<any[]>;
}

// Also load all proverbs at once for the list endpoint
export async function loadAllProverbs(): Promise<Record<string, any[]>> {
  const langs = ['en', 'es', 'fr', 'de', 'it', 'ja', 'pt', 'zh'];
  const result: Record<string, any[]> = {};
  await Promise.all(langs.map(async lang => {
    result[lang] = await loadProverbs(lang);
  }));
  return result;
}
