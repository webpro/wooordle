import type { GuessResult } from '../types.d.ts';

export function getGuessResult(target: string, guess: string): GuessResult[] {
  const size = target.length;
  const result: GuessResult[] = Array(size).fill(0);
  const targetLetters = target.split('');
  const guessLetters = guess.split('');

  for (let i = 0; i < size; i++) {
    if (guessLetters[i] === targetLetters[i]) {
      result[i] = 2;
      targetLetters[i] = '#';
      guessLetters[i] = '*';
    }
  }

  for (let i = 0; i < size; i++) {
    if (guessLetters[i] === '*') continue;
    const targetIndex = targetLetters.indexOf(guessLetters[i]);
    if (targetIndex !== -1) {
      result[i] = 1;
      targetLetters[targetIndex] = '#';
    }
  }

  return result;
}

export function getGuessResultSimple(target: string, guess: string): GuessResult[] {
  const size = target.length;
  const result: GuessResult[] = Array(size).fill(0);
  for (let i = 0; i < size; i++) {
    if (guess[i] === target[i]) {
      result[i] = 2;
    } else if (target.includes(guess[i])) {
      result[i] = 1;
    }
  }
  return result;
}
