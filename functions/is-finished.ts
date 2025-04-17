import type { GuessList } from '../types';

export const isFinished = (guesses: GuessList) =>
  (guesses.length > 0 && guesses.at(-1)?.result.every(r => r === 2)) || false;
