import type { GuessList } from '../types';

export const findMatches = (list: Set<string>, guesses: GuessList, excludedLetters: Set<string>) => {
  const matches = new Set<string>();
  words: for (const listWord of list) {
    const letters = [...listWord];
    if (letters.some(l => excludedLetters.has(l))) {
      continue words;
    }
    for (const { word, result } of guesses) {
      for (let i = 0; i < word.length; i++) {
        if (result[i] === 2 && word[i] !== letters[i]) {
          continue words;
        }
        if (result[i] === 1 && word[i] === letters[i]) {
          continue words;
        }
        if (result[i] === 1 && !letters.includes(word[i])) {
          continue words;
        }
      }
    }
    matches.add(listWord);
  }
  return matches;
};
