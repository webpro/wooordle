import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMisplacedLetters } from './get-misplaced-letters.ts';
import type { GuessList } from '../types';
import { getCorrectLetters } from './get-correct-letters.ts';
import { getExcludedLetters } from './get-excluded-letters.ts';
import { getLetterSet } from '../util/get-letter-set.ts';

test('Get excluded letters', () => {
  const guesses: GuessList = [
    { word: 'salet', result: [0, 0, 2, 1, 0] },
    { word: 'hello', result: [0, 2, 2, 0, 1] },
  ];
  const correctLetters = getCorrectLetters(guesses);
  const misplacedLetters = getMisplacedLetters(guesses, correctLetters);
  const excludedLetters = getExcludedLetters(guesses, getLetterSet(correctLetters), getLetterSet(misplacedLetters));
  assert.deepEqual(excludedLetters, new Set(['s', 'a', 't', 'h']));
});
