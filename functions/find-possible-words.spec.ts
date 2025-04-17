import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findPossibleWords } from './find-possible-words.ts';
import { initRemainingLetters } from './get-remaining-letters.ts';

test('Find possible words', () => {
  const list = new Set(['words', 'chore']);
  const remaining = initRemainingLetters(5);
  const mustAppear = new Set<string>();
  const possibleWords = findPossibleWords(list, remaining, mustAppear);
  assert.deepEqual(possibleWords, ['words', 'chore']);
});

test('Find possible words (2)', () => {
  const list = new Set(['words', 'chore', 'windy', 'screw']);
  const remaining = initRemainingLetters(5);
  remaining[0] = new Set(['w']);
  const mustAppear = new Set<string>();
  const possibleWords = findPossibleWords(list, remaining, mustAppear);
  assert.deepEqual(possibleWords, ['words', 'windy']);
});
