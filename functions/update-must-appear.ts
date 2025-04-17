import type { GuessResult } from '../types';

export function updateMustAppear(mustAppear: Set<string>, word: string, result: GuessResult[]) {
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    if (result[i] === 1) {
      mustAppear.add(char);
    }
  }
  return mustAppear;
}
