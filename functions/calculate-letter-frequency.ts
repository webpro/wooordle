export function calculateLetterFrequency(list: Set<string>) {
  const letterFreq = new Map<string, number>();
  for (const word of list) {
    for (const letter of word) {
      letterFreq.set(letter, (letterFreq.get(letter) || 0) + 1);
    }
  }
  return letterFreq;
}
