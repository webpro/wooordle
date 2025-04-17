import { getSize } from './get-size.ts';

export const findWordsWithMostLetters = (
  list: Set<string>,
  letters: Set<string>,
  excludedLetters = new Set<string>(),
  excludedWords = new Array<string>(),
): string[] => {
  const size = getSize(list);

  const results = Array(size + 1);
  for (let i = 0; i < results.length; i++) results[i] = [];

  for (const word of list) {
    if (excludedWords.includes(word)) continue;
    const uniqueLetters = new Set(word);
    const matchingLetters = [...uniqueLetters].filter(letter => letters.has(letter) && !excludedLetters.has(letter));
    results[matchingLetters.length].push(word);
  }
  for (let i = size - 1; i >= 0; i--) if (results[i].length > 0) return results[i];
  return [];
};
