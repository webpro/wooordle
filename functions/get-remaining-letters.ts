import type { RemainingLetters } from '../types';

export const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

export function initRemainingLetters(size: 5 | 6): RemainingLetters {
  return Array.from({ length: size }, () => new Set(ALPHABET));
}
