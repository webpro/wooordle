import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { mock, test } from 'node:test';
import { createBoard } from '../test/board.ts';

const createWorker = mock.fn(async () => ({
  setParameters: async () => {},
  recognize: async () => ({ data: { text: '', confidence: 0 } }),
}));
mock.module('tesseract.js', { exports: { createWorker, PSM: { SINGLE_WORD: 8 } } });
const { analyze } = await import('./analyze.ts');

test('returns opening advice for the empty screenshot without running OCR', async () => {
  const image = await readFile(new URL('../test/fixtures/empty-board.png', import.meta.url));
  const result = await analyze('empty-board.png', image);
  assert.equal(result.wordLength, 5);
  assert.deepEqual(result.guesses, []);
  assert.deepEqual(result.detectedLanguages, ['nl', 'en']);
  assert.deepEqual(result.bestWords.en, ['soare', 'roate', 'raise']);
  assert.deepEqual(result.bestWords.nl, ['toner', 'raten', 'toren']);
  assert.equal(createWorker.mock.callCount(), 0);
});

test('respects the requested language and six-letter board for opening advice', async () => {
  const result = await analyze('board.png', await createBoard({ columns: 6 }), 'en');
  assert.equal(result.wordLength, 6);
  assert.deepEqual(result.guesses, []);
  assert.deepEqual(result.detectedLanguages, ['en']);
  assert.deepEqual(result.bestWords, { en: ['satire', 'ratine', 'satine'] });
});

test('does not treat failed recognition of a filled row as an empty board', async () => {
  const image = await readFile(new URL('../test/fixtures/played-board.jpeg', import.meta.url));
  const result = await analyze('unreadable.jpeg', image);
  assert.equal(result.wordLength, 5);
  assert.deepEqual(result.guesses, []);
  assert.deepEqual(result.detectedLanguages, []);
  assert.deepEqual(result.bestWords, {});
  assert.equal(createWorker.mock.callCount(), 1);
});
