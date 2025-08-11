import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { GuessList } from '../types';
import { getList } from '../../../dict/index.ts';
import { findBestWords } from './find-best-words.ts';

test('Find best words', async () => {
  const list = await getList('nl', 5, 'target');
  const full = await getList('nl', 5, 'full');
  const guesses: GuessList = [
    { word: 'salet', result: [2, 0, 0, 2, 0] },
    { word: 'beurs', result: [0, 1, 0, 0, 1] },
    { word: 'visie', result: [0, 0, 1, 0, 1] },
  ];
  const bestWords = findBestWords(list, full, guesses);
  assert.deepEqual(bestWords, ['snoep', 'spoed']);
});
