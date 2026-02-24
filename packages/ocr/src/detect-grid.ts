import type sharp from 'sharp';

import { detectGridFromProjections } from './utils/find-content.ts';
import { resetDebug, addBox, createDebugVisualization } from './utils/debug.ts';

export async function detectGrid(imageFilePath: string, image: sharp.Sharp, debug = false) {
  resetDebug();

  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const tiles = detectGridFromProjections(data, width, height, debug);

  for (const tile of tiles) addBox(tile);

  if (debug) await createDebugVisualization(imageFilePath, image, width, height);

  return tiles;
}
