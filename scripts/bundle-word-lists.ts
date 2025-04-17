import { getList } from '../util/get-list';

async function generateWordLists() {
  const languages = ['nl', 'en'] as const;
  const lengths = [5, 6] as const;
  const types = ['target', 'full'] as const;

  const lists = {
    nl: { 5: {}, 6: {} },
    en: { 5: {}, 6: {} },
  };

  for (const lang of languages) {
    for (const length of lengths) {
      for (const type of types) {
        const list = await getList(lang, length, type);
        lists[lang][length][type] = Array.from(list);
      }
    }
  }

  return JSON.stringify(lists, null, 2);
}

// Write to public/lists/words.json
generateWordLists().then(json => {
  Bun.write('wooordle/words.json', json);
});
