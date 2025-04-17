import type { GuessList } from '../types';

export const getLetterCountLimits = (guesses: GuessList): [string[], string[], string[]] => {
  const occurOnceLetters = [];
  const occurTwiceLetters = [];
  const occurThriceLetters = [];
  for (const guess of guesses) {
    const letters = [...guess.word];
    const letterSet = new Set(letters);
    if (letters.length === letterSet.size) continue;
    for (const letter of letterSet) {
      const count = letters.filter(l => l === letter).length;
      if (count === 1) continue;
      if (count === 3 && letters.filter((l, i) => l === letter && guess.result[i] !== 0).length === 3) {
        // occurThriceLetters.push(letter);
      }
      if (count === 3 && letters.filter((l, i) => l === letter && guess.result[i] !== 0).length === 2) {
        occurTwiceLetters.push(letter);
      }
      if (count === 2 && letters.filter((l, i) => l === letter && guess.result[i] !== 0).length === 2) {
        // occurTwiceLetters.push(letter);
      }
      if (count === 2 && letters.filter((l, i) => l === letter && guess.result[i] !== 0).length === 1) {
        occurOnceLetters.push(letter);
      }
    }
  }
  return [occurOnceLetters, occurTwiceLetters, occurThriceLetters];
};

export const getExceedsLimit = (letterCountLimits: [string[], string[], string[]]) =>
  letterCountLimits.flat().length === 0
    ? () => false
    : (letters: string) => {
        for (let limit = letterCountLimits.length; limit > 0; limit--) {
          for (const lll of letterCountLimits[limit - 1]) {
            if ([...letters].filter(l => l === lll).length > limit) {
              return true;
            }
          }
        }
        return false;
      };
