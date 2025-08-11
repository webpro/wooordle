import type sharp from 'sharp';
import type { Box } from './types.ts';
import { getDominantBorderColor, isBgColor, isNotBgColor } from './utils/background.ts';
import { findFirstTile, exploreGrid } from './utils/find-content.ts';
import { createDebugVisualization } from './utils/debug.ts';
import { addBox } from './utils/debug.ts';

export async function detectGrid(imageFilePath: string, image: sharp.Sharp, debug = false) {
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  const { width, height } = info;

  const [bgR, bgG, bgB] = getDominantBorderColor(data, width, height, debug);

  const isBg = isBgColor(data, width, bgR, bgG, bgB);
  const isNotBg = isNotBgColor(data, width, bgR, bgG, bgB);

  const MIN_TILE_SIZE = Math.round(Math.max(20, width / 50));
  const MAX_TILE_SIZE = Math.round(width / 5);

  const firstTile = findFirstTile(data, width, height, 0, 0, MIN_TILE_SIZE, MAX_TILE_SIZE, isBg, isNotBg);

  const tiles: Box[] = [];

  if (firstTile) {
    for (const tile of exploreGrid(firstTile, width, height, MIN_TILE_SIZE, MAX_TILE_SIZE, isBg, isNotBg)) {
      addBox(tile);
      tiles.push(tile);
    }
  }

  if (debug) await createDebugVisualization(imageFilePath, image, width, height);

  return tiles;
}
