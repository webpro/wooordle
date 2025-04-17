import type { GuessList } from '../types';

export const getCorrectLetters = (guesses: GuessList) => {
  const size = guesses[0].word.length;
  const correctLetters = Array<string | undefined>(size);
  for (const guess of guesses) {
    for (let i = 0; i < guess.word.length; i++) {
      if (guess.result[i] === 2) correctLetters[i] = guess.word[i];
    }
  }
  return correctLetters;
};
