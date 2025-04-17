import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findTopWord, findTopWords } from './find-top-word.ts';
import { getList } from '../util/get-list.ts';

const list5 = await getList('nl', 5, 'target');
const list6 = await getList('nl', 6, 'target');

test('Find best word (5)', async () => {
  assert.equal(findTopWord(list5), 'toren');
});

test('Find best word (6)', () => {
  assert.equal(findTopWord(list6), 'karten');
});

test('Find best words with scores and variations (5)', () => {
  const results = findTopWords(list5, 3);
  assert.equal(results.length, 3);
  assert.equal(results[0].word, 'toren');
  assert(results[0].score > 0);
  assert(Array.isArray(results[0].variations));
});
