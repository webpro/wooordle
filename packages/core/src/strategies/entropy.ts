import type { GuessList, Run } from '../types';

const tc = new Uint8Array(26);

let letters: Uint8Array;
let wordStrings: string[];
let targetCount: number;
let fullCount: number;
let wordSize: number;
let patternCount: number;
let allGreen: number;
let multipliers: Uint16Array;

function encodeWords(targets: string[], fulls: string[]) {
  const targetSet = new Set(targets);
  const extra = fulls.filter(w => !targetSet.has(w));
  wordStrings = [...targets, ...extra];
  targetCount = targets.length;
  fullCount = wordStrings.length;
  wordSize = wordStrings[0].length;
  patternCount = 3 ** wordSize;
  allGreen = patternCount - 1;
  multipliers = new Uint16Array(wordSize);
  for (let i = wordSize - 1, m = 1; i >= 0; i--, m *= 3) multipliers[i] = m;
  letters = new Uint8Array(fullCount * wordSize);
  for (let i = 0; i < fullCount; i++) {
    const w = wordStrings[i];
    const off = i * wordSize;
    for (let j = 0; j < wordSize; j++) letters[off + j] = w.charCodeAt(j) - 97;
  }
}

function pattern(ti: number, gi: number): number {
  const ws = wordSize;
  const to = ti * ws, go = gi * ws;
  let result = 0;
  for (let i = 0; i < ws; i++) {
    if (letters[go + i] === letters[to + i]) result += multipliers[i] * 2;
    else tc[letters[to + i]]++;
  }
  for (let i = 0; i < ws; i++) {
    const g = letters[go + i];
    if (letters[go + i] !== letters[to + i] && tc[g] > 0) { result += multipliers[i]; tc[g]--; }
  }
  for (let i = 0; i < ws; i++) tc[letters[to + i]] = 0;
  return result;
}

function bestGuess(
  candidates: Uint16Array,
  nCandidates: number,
  pool: Uint16Array,
  nPool: number,
  isCandidate: Uint8Array,
): number {
  const counts = new Uint32Array(patternCount);
  let bestScore = Infinity;
  let bestIdx = pool[0];

  for (let p = 0; p < nPool; p++) {
    const gi = pool[p];
    counts.fill(0);
    for (let c = 0; c < nCandidates; c++) {
      counts[pattern(candidates[c], gi)]++;
    }

    let score = 0;
    for (let i = 0; i < patternCount; i++) {
      const v = counts[i];
      score += v * v;
    }

    if (score < bestScore || (score === bestScore && isCandidate[gi])) {
      bestScore = score;
      bestIdx = gi;
    }
  }

  return bestIdx;
}

function init(list: Set<string>, full: Set<string>, firstGuess: string, deep = false) {
  const targetArr = [...list];
  const fullArr = [...full];
  encodeWords(targetArr, fullArr);

  const wordIndex = new Map<string, number>();
  for (let i = 0; i < fullCount; i++) wordIndex.set(wordStrings[i], i);

  const firstGuessIdx = wordIndex.get(firstGuess)!;

  const fullPool = new Uint16Array(fullCount);
  for (let i = 0; i < fullCount; i++) fullPool[i] = i;

  const targetPool = new Uint16Array(targetCount);
  for (let i = 0; i < targetCount; i++) targetPool[i] = i;

  const tmpGroups = new Map<number, number[]>();
  for (let i = 0; i < targetCount; i++) {
    const p = pattern(i, firstGuessIdx);
    let g = tmpGroups.get(p);
    if (!g) { g = []; tmpGroups.set(p, g); }
    g.push(i);
  }

  const groups = new Map<number, Uint16Array>();
  const groupSizes = new Map<number, number>();
  for (const [p, arr] of tmpGroups) {
    groups.set(p, Uint16Array.from(arr));
    groupSizes.set(p, arr.length);
  }

  const guess2Lookup = new Map<number, number>();
  const isCandidate = new Uint8Array(fullCount);

  for (const [p, candidates] of groups) {
    const n = groupSizes.get(p)!;
    if (n <= 2) {
      guess2Lookup.set(p, candidates[0]);
      continue;
    }
    isCandidate.fill(0);
    for (let i = 0; i < n; i++) isCandidate[candidates[i]] = 1;
    guess2Lookup.set(p, bestGuess(candidates, n, fullPool, fullCount, isCandidate));
  }

  const runGame: Run = ({ target, firstGuess: fg }) => {
    const targetIdx = wordIndex.get(target)!;
    let candidates = targetPool.slice();
    let nCandidates = targetCount;
    let attempts = 1;
    let guessIdx = wordIndex.get(fg)!;
    let isFirst = true;

    while (attempts <= 10) {
      const p = pattern(targetIdx, guessIdx);
      if (p === allGreen) return attempts;

      let j = 0;
      for (let i = 0; i < nCandidates; i++) {
        const ci = candidates[i];
        if (ci !== guessIdx && pattern(ci, guessIdx) === p) {
          candidates[j++] = ci;
        }
      }
      nCandidates = j;

      if (nCandidates === 0) return attempts + 1;
      if (nCandidates <= 2) {
        guessIdx = candidates[0];
        attempts++;
        isFirst = false;
        continue;
      }

      if (isFirst) {
        guessIdx = guess2Lookup.get(p) ?? candidates[0];
        isFirst = false;
      } else {
        isCandidate.fill(0);
        for (let i = 0; i < nCandidates; i++) isCandidate[candidates[i]] = 1;

        if (deep && nCandidates <= 20) {
          guessIdx = bestGuess(candidates, nCandidates, fullPool, fullCount, isCandidate);
        } else if (nCandidates <= 10) {
          guessIdx = bestGuess(candidates, nCandidates, targetPool, targetCount, isCandidate);
        } else {
          guessIdx = bestGuess(candidates, nCandidates, candidates, nCandidates, isCandidate);
        }
      }

      attempts++;
    }

    return undefined as unknown as number;
  };

  return runGame;
}

export function entropy(list: Set<string>, full: Set<string>, guesses: GuessList): string[] {
  const targetArr = [...list];
  const fullArr = [...full];
  encodeWords(targetArr, fullArr);

  const wordIndex = new Map<string, number>();
  for (let i = 0; i < fullCount; i++) wordIndex.set(wordStrings[i], i);

  const targetPool = new Uint16Array(targetCount);
  for (let i = 0; i < targetCount; i++) targetPool[i] = i;

  let candidates = targetPool.slice();
  let nCandidates = targetCount;

  for (const guess of guesses) {
    const gi = wordIndex.get(guess.word);
    if (gi === undefined) continue;
    const r = guess.result;
    let p = 0;
    for (let i = 0; i < wordSize; i++) p += r[i] * multipliers[i];

    let j = 0;
    for (let i = 0; i < nCandidates; i++) {
      const ci = candidates[i];
      if (ci !== gi && pattern(ci, gi) === p) candidates[j++] = ci;
    }
    nCandidates = j;
  }

  if (nCandidates === 0) return [];
  if (nCandidates <= 2) {
    const result: string[] = [];
    for (let i = 0; i < nCandidates; i++) result.push(wordStrings[candidates[i]]);
    return result;
  }

  const isCandidate = new Uint8Array(fullCount);
  for (let i = 0; i < nCandidates; i++) isCandidate[candidates[i]] = 1;

  let pool: Uint16Array;
  let nPool: number;
  if (nCandidates <= 10) {
    pool = targetPool;
    nPool = targetCount;
  } else {
    pool = candidates.slice(0, nCandidates);
    nPool = nCandidates;
  }

  const best = bestGuess(candidates, nCandidates, pool, nPool, isCandidate);
  return [wordStrings[best]];
}

let _cached: { list: Set<string>; full: Set<string>; firstGuess: string; game: Run } | null = null;

export const run: Run = (opts) => {
  const c = _cached;
  if (!c || c.list !== opts.list || c.full !== opts.full || c.firstGuess !== opts.firstGuess) {
    _cached = { list: opts.list, full: opts.full!, firstGuess: opts.firstGuess, game: init(opts.list, opts.full!, opts.firstGuess) };
  }
  return _cached!.game(opts);
};
