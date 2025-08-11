import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findMatches } from './find-matches.ts';
import type { GuessList } from '../types';
import { getExcludedLetters } from './get-excluded-letters.ts';
import { getCorrectLetters } from './get-correct-letters.ts';
import { getLetterSet } from '../util/get-letter-set.ts';
import { getMisplacedLetters } from './get-misplaced-letters.ts';

test('Find possible words', () => {
  const list = new Set(['store', 'chore']);
  const guesses: GuessList = [{ word: 'hello', result: [0, 1, 0, 0, 1] }];
  const correctLetters = getCorrectLetters(guesses);
  const misplacedLetters = getMisplacedLetters(guesses, correctLetters);
  const excludedLetters = getExcludedLetters(guesses, getLetterSet(correctLetters), getLetterSet(misplacedLetters));
  const possibleWords = findMatches(list, guesses, excludedLetters);
  assert.deepEqual(possibleWords, new Set(['store']));
});

test('Find possible words (2)', () => {
  const list = new Set(['store', 'chore']);
  const guesses: GuessList = [{ word: 'hello', result: [1, 1, 0, 0, 1] }];
  const correctLetters = getCorrectLetters(guesses);
  const misplacedLetters = getMisplacedLetters(guesses, correctLetters);
  const excludedLetters = getExcludedLetters(guesses, getLetterSet(correctLetters), getLetterSet(misplacedLetters));
  const possibleWords = findMatches(list, guesses, excludedLetters);
  assert.deepEqual(possibleWords, new Set(['chore']));
});
