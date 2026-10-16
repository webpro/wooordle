import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getGuessResult } from '../functions/get-guess-result.ts';
import type { GuessList } from '../types.ts';
import { entropy, run } from './entropy.ts';

test('entropy advice does not overwrite a cached simulation dictionary', () => {
  const list = new Set(['aaaaa', 'bbbbb', 'ccccc']);
  const options = { list, full: list, firstGuess: 'aaaaa', target: 'ccccc' };

  assert.equal(run(options), 3);
  entropy(new Set(['ddddd']), new Set(['ddddd']), []);
  assert.equal(run(options), 3);
});

test('entropy applies feedback from a word absent from both dictionaries', () => {
  const list = new Set(['apple', 'brick', 'shout']);

  assert.deepEqual(entropy(list, list, [{ word: 'ample', result: [2, 0, 2, 2, 2] }]), ['apple']);
});

test('entropy returns no suggestions for empty dictionaries', () => {
  assert.deepEqual(entropy(new Set(), new Set(), []), []);
});

test('entropy simulation uses target words when full is omitted', () => {
  const list = new Set(['aaaaa', 'bbbbb', 'ccccc']);

  assert.equal(run({ list, firstGuess: 'aaaaa', target: 'ccccc' }), 3);
});

test('entropy simulation reports the actual attempts beyond ten guesses', () => {
  const list = new Set(Array.from('abcdefghijklmnopqrstuvwxyz', letter => letter + 'aaaa'));

  assert.equal(run({ list, full: list, firstGuess: 'aaaaa', target: 'zaaaa' }), 26);
});

test('entropy recommends a full-dictionary probe that distinguishes remaining targets', () => {
  const list = new Set(['fight', 'light', 'might', 'night', 'right', 'sight', 'tight', 'wight']);
  const full = new Set([...list, 'bough', 'flint']);

  const suggestions = entropy(list, full, [{ word: 'bough', result: [0, 0, 0, 1, 1] }]);

  assert.equal(suggestions[0], 'flint');
});

test('entropy favors greater information over tied squared bucket counts', () => {
  const list = new Set(['bassen', 'dansen', 'dassen', 'jassen', 'kansen', 'kassen', 'lassen', 'passen', 'pausen', 'walsen', 'wassen']);
  const full = new Set([...list, 'dolkop', 'lasdop']);

  assert.equal(entropy(list, full, [])[0], 'lasdop');
});

test('entropy simulation matches sequential advice for every target', () => {
  const list = new Set(['fight', 'light', 'might', 'night', 'right', 'sight', 'tight', 'wight']);
  const full = new Set([...list, 'bough', 'flint']);
  const expectedAttempts = [3, 3, 3, 3, 4, 5, 6, 7];

  const adviceAttempts = Array.from(list, target => {
    const guesses: GuessList = [];
    let word = 'bough';
    while (guesses.length < 10) {
      const result = getGuessResult(target, word);
      guesses.push({ word, result });
      if (result.every(value => value === 2)) return guesses.length;
      word = entropy(list, full, guesses)[0];
      assert.ok(word);
    }
    assert.fail('Advice did not solve ' + target);
  });

  assert.deepEqual(adviceAttempts, expectedAttempts);
  assert.deepEqual(Array.from(list, target => run({ list, full, target, firstGuess: 'bough' })), expectedAttempts);
});

test('entropy simulation applies a first guess absent from both dictionaries', () => {
  const list = new Set(['apple', 'brick', 'shout']);

  assert.equal(run({ list, full: list, firstGuess: 'shone', target: 'shout' }), 2);
});

test('entropy simulation rejects allowed guesses outside the target list as targets', () => {
  const list = new Set(['apple', 'brick', 'shout']);
  const full = new Set([...list, 'shone']);

  assert.throws(() => run({ list, full, firstGuess: 'apple', target: 'shone' }), {
    name: 'RangeError',
    message: 'Unknown target: shone',
  });
});
