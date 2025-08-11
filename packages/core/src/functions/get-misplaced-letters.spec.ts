import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMisplacedLetters } from './get-misplaced-letters.ts';
import type { GuessList } from '../types';
import { getCorrectLetters } from './get-correct-letters.ts';

test('Get misplaced letters', () => {
  const guesses: GuessList = [
    { word: 'salet', result: [0, 0, 2, 1, 0] },
    { word: 'hello', result: [0, 2, 2, 0, 1] },
  ];
  const correctLetters = getCorrectLetters(guesses);
  const result = getMisplacedLetters(guesses, correctLetters);
  assert.deepEqual(result, ['o']);
});

test('Get misplaced letters (2)', () => {
  const guesses: GuessList = [
    { word: 'salet', result: [0, 0, 2, 1, 0] },
    { word: 'hello', result: [0, 1, 2, 0, 1] },
  ];
  const correctLetters = getCorrectLetters(guesses);
  const result = getMisplacedLetters(guesses, correctLetters);
  assert.deepEqual(result, ['e', 'e', 'o']);
});

test('Get misplaced letters (3)', () => {
  const guesses: GuessList = [
    { word: 'salet', result: [0, 0, 2, 1, 0] },
    { word: 'hello', result: [2, 0, 2, 0, 2] },
  ];
  const correctLetters = getCorrectLetters(guesses);
  const result = getMisplacedLetters(guesses, correctLetters);

  const expected = new Array(5);
  expected[0] = 'h';
  expected[1] = 'e';
  expected[2] = 'l';
  expected[4] = 'o';

  assert.deepEqual(result, ['e']);
  assert.deepEqual(correctLetters, expected);
});
