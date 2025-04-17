import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findWordsWithMostLetters } from './find-word-with-most-letters.ts';

test('Assess guess "hello" against "salet"', () => {
  const list = new Set(['hello', 'world']);
  const letters = new Set(['l', 'd']);
  const result = findWordsWithMostLetters(list, letters);
  assert.deepEqual(result, ['world']);
});
