import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLetterCountLimits, getExceedsLimit } from './get-letter-count-limits.ts';
import type { GuessList } from '../types';

test('Get letter count limits', () => {
  const guesses: GuessList = [{ word: 'hello', result: [0, 2, 2, 0, 1] }];
  const limits = getLetterCountLimits(guesses);
  assert.deepEqual(limits, [['l'], [], []]);

  const isExceedsLimit = getExceedsLimit(limits);
  assert.equal(isExceedsLimit('hallo'), true);
  assert.equal(isExceedsLimit('limit'), false);
});
