import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateLetterFrequency } from './calculate-letter-frequency.ts';

test('Calculate letter frequency', () => {
  const list = new Set(['hello', 'salet']);
  const result = calculateLetterFrequency(list);
  const expected = new Map([
    ['h', 1],
    ['e', 2],
    ['l', 3],
    ['o', 1],
    ['s', 1],
    ['a', 1],
    ['t', 1],
  ]);
  assert.deepEqual(result, expected);
});
