import { join } from 'node:path';
import { getList } from '@wooordle/dict';
import { writeFileSync } from 'node:fs';

async function generateWordLists() {
  const languages = ['nl', 'en'] as const;
  const sizes = [5, 6] as const;
  const types = ['target', 'full'] as const;

  const lists = {
    nl: { 5: {}, 6: {} },
    en: { 5: {}, 6: {} },
  };

  for (const lang of languages) {
    for (const size of sizes) {
      for (const type of types) {
        const list = await getList(lang, size, type);
        lists[lang][size][type] = Array.from(list);
      }
    }
  }

  return JSON.stringify(lists);
}

generateWordLists().then(json => {
  const dir = new URL('.', import.meta.url).pathname;
  writeFileSync(join(dir, '..', 'words.json'), json);
});
