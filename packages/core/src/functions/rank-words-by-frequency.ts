export function rankWordsByLetterFrequency(
  words: string[],
  matches: string[],
  prioritizedLetters: Set<string>,
  excludedLetters: Set<string>,
) {
  const letterFreq = new Map<string, number>();
  for (const word of matches) {
    for (const letter of word) {
      if (prioritizedLetters.has(letter)) {
        letterFreq.set(letter, (letterFreq.get(letter) || 0) + 1);
      }
    }
  }

  const rankedWords: string[][] = [];

  for (const word of words) {
    const score = Array.from(word).reduce((sum, letter) => {
      const freqScore = letterFreq.get(letter);
      return sum + (typeof freqScore === 'number' ? freqScore : excludedLetters.has(letter) ? -1 : 0);
    }, 0);
    if (!rankedWords[score]) rankedWords[score] = [];
    rankedWords[score].push(word);
  }

  return rankedWords.at(-1);
}
