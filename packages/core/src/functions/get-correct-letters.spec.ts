import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getCorrectLetters } from './get-correct-letters.ts';
import type { GuessList } from '../types';
import { getLetterSet } from '../util/get-letter-set.ts';

test('Get correct letter positions', () => {
  const guesses: GuessList = [
    { word: 'salet', result: [0, 0, 2, 1, 0] },
    { word: 'hello', result: [0, 2, 2, 0, 1] },
  ];

  const result = getCorrectLetters(guesses);

  const expected = new Array(5);
  expected[1] = 'e';
  expected[2] = 'l';

  assert.deepEqual(result, expected);
  assert.deepEqual(getLetterSet(result), new Set(['e', 'l']));
});
