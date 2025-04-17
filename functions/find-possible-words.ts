import type { RemainingLetters } from '../types';

function isPossible(word: string, remaining: RemainingLetters, mustAppear: Set<string>) {
  for (let i = 0; i < word.length; i++) {
    if (!remaining[i].has(word[i])) return false;
  }
  for (const letter of mustAppear) {
    if (!word.includes(letter)) return false;
  }
  return true;
}

export function findPossibleWords(words: Set<string>, remaining: RemainingLetters, mustAppear: Set<string>) {
  return Array.from(words).filter(word => isPossible(word, remaining, mustAppear));
}
