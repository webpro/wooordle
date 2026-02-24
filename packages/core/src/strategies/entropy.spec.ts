import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { GuessList } from '../types';
import { getList } from '../../../dict/index.ts';
import { entropy } from './entropy.ts';

test('Find best words (entropy) — narrows to remaining candidates', async () => {
  const list = await getList('nl', 5, 'target');
  const full = await getList('nl', 5, 'full');
  const guesses: GuessList = [
    { word: 'salet', result: [2, 0, 0, 2, 0] },
    { word: 'beurs', result: [0, 1, 0, 0, 1] },
    { word: 'visie', result: [0, 0, 1, 0, 1] },
  ];
  const bestWords = entropy(list, full, guesses);
  assert.deepEqual(bestWords, ['snoep', 'spoed']);
});

test('Find best words (entropy) — suggests optimal first word', async () => {
  const list = await getList('en', 5, 'target');
  const full = await getList('en', 5, 'full');
  const bestWords = entropy(list, full, []);
  assert.equal(bestWords.length, 1);
  assert.equal(bestWords[0], 'raise');
});

test('Find best words (entropy) — entropy scoring with many remaining', async () => {
  const list = await getList('en', 5, 'target');
  const full = await getList('en', 5, 'full');
  const guesses: GuessList = [
    { word: 'salet', result: [0, 0, 1, 0, 0] },
  ];
  const bestWords = entropy(list, full, guesses);
  assert.equal(bestWords.length, 1);
  assert.equal(bestWords[0], 'cloud');
});

test('Find best words (entropy) — 6-letter suggests optimal first word', async () => {
  const list = await getList('en', 6, 'target');
  const full = await getList('en', 6, 'full');
  const bestWords = entropy(list, full, []);
  assert.equal(bestWords.length, 1);
  assert.equal(bestWords[0], 'saline');
});

test('Find best words (entropy) — 6-letter narrows candidates', async () => {
  const list = await getList('en', 6, 'target');
  const full = await getList('en', 6, 'full');
  const guesses: GuessList = [
    { word: 'saline', result: [0, 0, 0, 0, 0, 2] },
  ];
  const bestWords = entropy(list, full, guesses);
  assert.equal(bestWords.length, 1);
  assert.equal(bestWords[0].length, 6);
});
