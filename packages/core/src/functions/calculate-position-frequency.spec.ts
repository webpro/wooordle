import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculatePositionFrequency } from './calculate-position-frequency.ts';

test('Calculate position frequency', () => {
  const list = new Set(['hello', 'salet', 'halos']);
  const result = calculatePositionFrequency(list);
  const expected = [
    new Map([
      ['h', 2],
      ['s', 1],
    ]),
    new Map([
      ['e', 1],
      ['a', 2],
    ]),
    new Map([['l', 3]]),
    new Map([
      ['l', 1],
      ['e', 1],
      ['o', 1],
    ]),
    new Map([
      ['o', 1],
      ['t', 1],
      ['s', 1],
    ]),
  ];
  assert.deepEqual(result, expected);
});
