import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getGuessResult, getGuessResultSimple } from './get-guess-result.ts';
import { getRandomWord } from './get-random-word.ts';
import { findTopWord } from './find-top-word.ts';
import { getList } from '../util/get-list.ts';

test('Get guess result of "breed" against target "hello"', () => {
  const result = getGuessResult('hello', 'breed');
  assert.deepEqual(result, [0, 0, 1, 0, 0]);
});

test('Get naive/incorrect guess result of "breed" against target "hello"', () => {
  const result = getGuessResultSimple('hello', 'breed');
  assert.deepEqual(result, [0, 0, 1, 1, 0]);
});

test('Get guess result of random word against best word', async () => {
  const list = await getList('en', 5, 'target');
  const target = getRandomWord(list);
  const guess = findTopWord(list);
  const result = getGuessResult(target, guess);
  assert.equal(result.length, target.length);
  assert(result.every(r => [2, 1, 0].includes(r)));
});
