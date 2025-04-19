import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankWordsByLetterFrequency } from './rank-words-by-frequency.ts';

test('Rank words by letter frequency', () => {
  const words = ['bawks', 'kapow', 'kopje', 'oxbow', 'pawks', 'pawky', 'upbow'];
  const filtered = ['boxer', 'joker', 'poker', 'power'];
  const prioritizedLetters = new Set(['b', 'x', 'j', 'k', 'p', 'w']);
  const excludedLettersSet = new Set(['a']);
  const rankedWords = rankWordsByLetterFrequency(words, filtered, prioritizedLetters, excludedLettersSet);
  assert.deepEqual(rankedWords, ['kopje']);
});
