import { test } from 'node:test';
import assert from 'node:assert/strict';
import { updateRemainingLetters } from './update-remaining-letters.ts';
import { ALPHABET, initRemainingLetters } from './get-remaining-letters.ts';
import { getGuessResult } from './get-guess-result.ts';

test('Update remaining letters', () => {
  const initialRemainingLetters = initRemainingLetters(5);
  const target = 'hello';
  const guess = 'salet';
  const result = getGuessResult(target, guess);

  const remainingLetters = updateRemainingLetters(initialRemainingLetters, guess, result);

  const expectedRemainingLetters = initRemainingLetters(5);
  expectedRemainingLetters[0] = new Set(ALPHABET).difference(new Set('ast'));
  expectedRemainingLetters[1] = new Set(ALPHABET).difference(new Set('ast'));
  expectedRemainingLetters[2] = new Set('l');
  expectedRemainingLetters[3] = new Set(ALPHABET).difference(new Set('aste'));
  expectedRemainingLetters[4] = new Set(ALPHABET).difference(new Set('ast'));

  assert.deepEqual(remainingLetters, expectedRemainingLetters);
});
