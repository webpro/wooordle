import { entropy as findBestWords } from '@wooordle/core';
import type { GuessList, LANGUAGE } from '@wooordle/core';
import { getList } from '@wooordle/dict';

type LanguageDetectionResult = {
  detectedLanguages: Array<LANGUAGE>;
  bestWords: { [lang in LANGUAGE]?: string[] };
};

async function getDictionary(lang: LANGUAGE, wordLength: 5 | 6): Promise<Set<string>> {
  const [target, full] = await Promise.all([getList(lang, wordLength, 'target'), getList(lang, wordLength, 'full')]);
  return target.union(full);
}

export async function getOcrDictionary(lang: LANGUAGE | undefined, wordLength: 5 | 6): Promise<Set<string>> {
  if (lang) return getDictionary(lang, wordLength);
  const [nlDict, enDict] = await Promise.all([getDictionary('nl', wordLength), getDictionary('en', wordLength)]);
  return nlDict.union(enDict);
}

export async function detectLanguageAndGetSuggestions(
  guesses: GuessList,
  wordLength: 5 | 6,
  lang?: LANGUAGE,
): Promise<LanguageDetectionResult> {
  if (lang) {
    const targetList = await getList(lang, wordLength, 'target');
    const fullList = await getDictionary(lang, wordLength);
    const bestWords = findBestWords(targetList, fullList, guesses);
    return { detectedLanguages: [lang], bestWords: { [lang]: bestWords } };
  }

  const [nlTargetList, nlFullList, enTargetList, enFullList] = await Promise.all([
    getList('nl', wordLength, 'target'),
    getList('nl', wordLength, 'full'),
    getList('en', wordLength, 'target'),
    getList('en', wordLength, 'full'),
  ]);

  const nlAllWords = nlTargetList.union(nlFullList);
  const enAllWords = enTargetList.union(enFullList);

  const detectedWords = guesses.map(g => g.word);
  const nlWords = detectedWords.filter(word => nlAllWords.has(word)).length;
  const enWords = detectedWords.filter(word => enAllWords.has(word)).length;

  if (nlWords > 0 && enWords === 0) {
    const bestWords = findBestWords(nlTargetList, nlAllWords, guesses);
    return { detectedLanguages: ['nl'], bestWords: { nl: bestWords } };
  }

  if (enWords > 0 && nlWords === 0) {
    const bestWords = findBestWords(enTargetList, enAllWords, guesses);
    return { detectedLanguages: ['en'], bestWords: { en: bestWords } };
  }

  const nlBestWords = findBestWords(nlTargetList, nlAllWords, guesses);
  const enBestWords = findBestWords(enTargetList, enAllWords, guesses);
  return { detectedLanguages: ['nl', 'en'], bestWords: { nl: nlBestWords, en: enBestWords } };
}
