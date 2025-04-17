import type { GuessResult, RemainingLetters } from '../types';

export function updateRemainingLetters(remainingLetters: RemainingLetters, word: string, result: GuessResult[]) {
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    if (result[i] === 2) {
      remainingLetters[i] = new Set([char]);
    } else if (result[i] === 1) {
      remainingLetters[i].delete(char);
    } else {
      for (const chars of remainingLetters) {
        chars.delete(char);
      }
    }
  }
  return remainingLetters;
}
