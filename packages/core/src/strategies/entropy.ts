import type { GuessList, Run } from '../types.ts';

function createSolver(list: Set<string>, full: Set<string>) {
  const words = [...list, ...full.difference(list)];
  const wordSize = words[0].length;
  const patternCount = 3 ** wordSize;
  const allGreen = patternCount - 1;
  const wordIndex = new Map(words.map((word, i) => [word, i]));
  const letters = new Uint8Array(words.length * wordSize);
  const letterCounts = new Uint8Array(26);
  const letterMasks = new Uint32Array(words.length);
  const hasUniqueLetters = new Uint8Array(words.length);
  const multipliers = new Uint16Array(wordSize);
  const targets = Uint32Array.from({ length: list.size }, (_, i) => i);
  const nextGuesses = new Map<string, number>();

  for (let i = wordSize - 1, multiplier = 1; i >= 0; i--, multiplier *= 3) multipliers[i] = multiplier;
  for (let i = 0; i < words.length; i++) {
    let mask = 0;
    hasUniqueLetters[i] = 1;
    for (let j = 0; j < wordSize; j++) {
      const letter = words[i].charCodeAt(j) - 97;
      const bit = 1 << letter;
      if (mask & bit) hasUniqueLetters[i] = 0;
      mask |= bit;
      letters[i * wordSize + j] = letter;
    }
    letterMasks[i] = mask;
  }

  function encodeGuess(word: string) {
    const index = wordIndex.get(word);
    if (index !== undefined) return { letters, offset: index * wordSize };
    if (word.length !== wordSize) throw new RangeError('Expected a ' + wordSize + '-letter guess: ' + word);
    const encoded = new Uint8Array(wordSize);
    for (let i = 0; i < wordSize; i++) {
      const letter = word.charCodeAt(i) - 97;
      if (letter < 0 || letter >= 26) throw new RangeError('Expected lowercase letters: ' + word);
      encoded[i] = letter;
    }
    return { letters: encoded, offset: 0 };
  }

  function pattern(target: number, guessLetters: Uint8Array, guessOffset: number): number {
    const targetOffset = target * wordSize;
    let result = 0;
    for (let i = 0; i < wordSize; i++) {
      if (guessLetters[guessOffset + i] === letters[targetOffset + i]) result += multipliers[i] * 2;
      else letterCounts[letters[targetOffset + i]]++;
    }
    for (let i = wordSize - 1; i >= 0; i--) {
      const letter = guessLetters[guessOffset + i];
      if (letter !== letters[targetOffset + i] && letterCounts[letter] > 0) {
        result += multipliers[i];
        letterCounts[letter]--;
      }
    }
    for (let i = 0; i < wordSize; i++) letterCounts[letters[targetOffset + i]] = 0;
    return result;
  }

  function filter(candidates: Uint32Array, guess: ReturnType<typeof encodeGuess>, result: number) {
    let count = 0;
    for (const candidate of candidates) {
      if (pattern(candidate, guess.letters, guess.offset) === result) candidates[count++] = candidate;
    }
    return candidates.subarray(0, count);
  }

  function uniqueGuessPattern(target: number, guessOffset: number): number {
    const targetOffset = target * wordSize;
    const mask = letterMasks[target];
    let result = 0;
    for (let i = 0; i < wordSize; i++) {
      const letter = letters[guessOffset + i];
      if (letter === letters[targetOffset + i]) result += multipliers[i] * 2;
      else if (mask & (1 << letter)) result += multipliers[i];
    }
    return result;
  }

  function bestGuesses(candidates: Uint32Array, limit = 3): number[] {
    const count = candidates.length;
    if (count <= 2) return Array.from(candidates.subarray(0, limit));

    const isCandidate = new Uint8Array(words.length);
    for (const candidate of candidates) isCandidate[candidate] = 1;
    const counts = new Uint32Array(patternCount);
    const bucketSizes = new Uint32Array(count + 1);
    const weights = new Float64Array(count + 1);
    for (let i = 2; i <= count; i++) weights[i] = i * Math.log2(i);
    const topScores: number[] = [];
    const topIndices: number[] = [];

    for (let guess = 0; guess < words.length; guess++) {
      counts.fill(0);
      bucketSizes.fill(0);
      let maxBucket = 0;
      for (const candidate of candidates) {
        const feedback = hasUniqueLetters[guess]
          ? uniqueGuessPattern(candidate, guess * wordSize)
          : pattern(candidate, letters, guess * wordSize);
        const previous = counts[feedback]++;
        if (previous > 0) bucketSizes[previous]--;
        bucketSizes[previous + 1]++;
        if (previous + 1 > maxBucket) maxBucket = previous + 1;
      }

      // Minimizing sum(n * log2(n)) maximizes entropy for a fixed candidate count.
      // Sum equal-sized buckets together so equivalent partitions tie exactly.
      let score = 0;
      for (let size = 2; size <= maxBucket; size++) score += bucketSizes[size] * weights[size];

      let position = topScores.length;
      while (position > 0) {
        const previous = position - 1;
        if (score < topScores[previous] ||
          (score === topScores[previous] && isCandidate[guess] && !isCandidate[topIndices[previous]])) position--;
        else break;
      }
      if (position < limit) {
        topScores.splice(position, 0, score);
        topIndices.splice(position, 0, guess);
        if (topScores.length > limit) {
          topScores.pop();
          topIndices.pop();
        }
      }
    }

    return topIndices;
  }

  function suggest(guesses: GuessList): string[] {
    let candidates: Uint32Array = targets.slice();
    for (const guess of guesses) {
      let result = 0;
      for (let i = 0; i < wordSize; i++) result += guess.result[i] * multipliers[i];
      if (result === allGreen) return [];
      candidates = filter(candidates, encodeGuess(guess.word), result);
      if (candidates.length === 0) return [];
    }
    return bestGuesses(candidates).map(index => words[index]);
  }

  function runGame(target: string, firstGuess: string): number {
    const targetIndex = wordIndex.get(target);
    if (targetIndex === undefined || targetIndex >= targets.length) throw new RangeError('Unknown target: ' + target);
    let candidates: Uint32Array = targets.slice();
    let guess = encodeGuess(firstGuess);
    let attempts = 1;

    while (true) {
      const result = pattern(targetIndex, guess.letters, guess.offset);
      if (result === allGreen) return attempts;
      candidates = filter(candidates, guess, result);

      let next: number;
      if (candidates.length <= 2) next = candidates[0];
      else {
        const key = candidates.join(',');
        const cached = nextGuesses.get(key);
        if (cached !== undefined) next = cached;
        else {
          next = bestGuesses(candidates, 1)[0];
          nextGuesses.set(key, next);
        }
      }
      guess = { letters, offset: next * wordSize };
      attempts++;
    }
  }

  return { suggest, runGame };
}

export function entropy(list: Set<string>, full: Set<string>, guesses: GuessList): string[] {
  if (list.size === 0) return [];
  return createSolver(list, full).suggest(guesses);
}

let cached: {
  list: Set<string>;
  full: Set<string>;
  firstGuess: string;
  solver: ReturnType<typeof createSolver>;
} | undefined;

export const run: Run = ({ list, full = list, target, firstGuess }) => {
  if (list.size === 0) throw new RangeError('Cannot simulate an empty target list.');
  if (!cached || cached.list !== list || cached.full !== full || cached.firstGuess !== firstGuess) {
    cached = { list, full, firstGuess, solver: createSolver(list, full) };
  }
  return cached.solver.runGame(target, firstGuess);
};
