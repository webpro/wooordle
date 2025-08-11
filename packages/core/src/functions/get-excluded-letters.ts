import type { GuessList } from '../types';

export const getExcludedLetters = (guesses: GuessList, correctLetters: Set<string>, misplacedLetters: Set<string>) => {
  return guesses.reduce((acc, { word, result }) => {
    const letters = [...word];
    for (let i = 0; i < word.length; i++) {
      if (result[i] === 0 && !correctLetters.has(word[i]) && !misplacedLetters.has(word[i])) {
        const count = letters.filter(l => l === word[i]).length;
        if (count === 1) acc.add(word[i]);
        else if (
          letters.filter(l => l === word[i] && !correctLetters.has(word[i]) && !misplacedLetters.has(word[i]))
            .length === count
        ) {
          acc.add(word[i]);
        }
      }
    }
    return acc;
  }, new Set<string>());
};
