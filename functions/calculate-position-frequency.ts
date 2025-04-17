import { getSize } from './get-size.ts';

export function calculatePositionFrequency(list: Set<string>) {
  const size = getSize(list);
  const positionFreq = Array.from({ length: size }, () => new Map<string, number>());
  for (const word of list) {
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      positionFreq[i].set(letter, (positionFreq[i].get(letter) || 0) + 1);
    }
  }
  return positionFreq;
}
