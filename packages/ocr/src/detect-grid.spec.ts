import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import sharp from 'sharp';
import { detectGrid } from './detect-grid.ts';
import { createBoard } from '../test/board.ts';

test('detects the empty board below the Shortcut progress overlay', async () => {
  const image = await readFile(new URL('../test/fixtures/empty-board.png', import.meta.url));
  const tiles = await detectGrid('empty-board.png', sharp(image).removeAlpha());
  assert.equal(tiles.length, 30);
  assert.equal(new Set(tiles.map(tile => tile.left)).size, 5);
  assert.equal(new Set(tiles.map(tile => tile.top)).size, 6);
  assert.ok(tiles.every(tile => tile.top >= 375 && tile.top + tile.height <= 1470));
});

for (const columns of [5, 6]) {
  for (const background of [20, 245]) {
    test(`detects an outlined ${columns}-column board on background ${background}`, async () => {
      const tiles = await detectGrid('board.png', sharp(await createBoard({ columns, background })));
      assert.equal(tiles.length, columns === 5 ? 30 : 36);
      assert.equal(new Set(tiles.map(tile => tile.left)).size, columns === 5 ? 5 : 6);
      assert.equal(new Set(tiles.map(tile => tile.top)).size, 6);
    });
  }
}

test('rejects an image without tiles', async () => {
  const tiles = await detectGrid('blank.png', sharp({ create: { width: 600, height: 1000, channels: 3, background: '#111' } }));
  assert.deepEqual(tiles, []);
});
