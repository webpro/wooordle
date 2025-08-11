import type { Box, Point } from '../types';
import type { isBgColor, isNotBgColor } from './background.ts';
import { addPoint } from './debug.ts';

const SAMPLE_RATE = 1;

function scanPixel(
  width: number,
  height: number,
  startX: number,
  startY: number,
  condition: (x: number, y: number) => boolean,
): Point | null {
  for (let y = startY; y < height; y += SAMPLE_RATE) {
    for (let x = startX; x < width; x += SAMPLE_RATE) {
      if (condition(x, y)) return { left: x, top: y };
    }
  }
}

function scanPixelEast(
  width: number,
  startX: number,
  startY: number,
  condition: (x: number, y: number) => boolean,
  maxX?: number,
): Point | null {
  const endX = maxX || Math.min(width, startX + width * 0.5);
  for (let x = startX; x < endX; x += SAMPLE_RATE) {
    if (condition(x, startY)) return { left: x, top: startY };
  }
}

function scanPixelSouth(
  height: number,
  startX: number,
  startY: number,
  condition: (x: number, y: number) => boolean,
): Point | null {
  for (let y = startY; y < height; y += SAMPLE_RATE) {
    if (condition(startX, y)) return { left: startX, top: y };
  }
}

export function getTile(
  topLeft: Point,
  width: number,
  height: number,
  min: number,
  max: number,
  isBg: ReturnType<typeof isBgColor>,
): Box | undefined {
  const topRight = scanPixelEast(width, topLeft.left + 1, topLeft.top, isBg);
  if (topRight) {
    addPoint(topRight);
    const bottomLeft = scanPixelSouth(height, topLeft.left, topLeft.top + 1, isBg);
    if (bottomLeft) {
      addPoint(bottomLeft);
      const tileWidth = topRight.left - topLeft.left;
      const tileHeight = bottomLeft.top - topLeft.top;
      const ratio = tileHeight / tileWidth;

      if (ratio < 0.5 || ratio > 2 || tileHeight < min || tileHeight > max || tileWidth < min || tileWidth > max) {
        return;
      }

      return {
        left: topLeft.left,
        top: topLeft.top,
        width: tileWidth,
        height: tileHeight,
      };
    }
  }
}

export function getNextTileEast(
  width: number,
  height: number,
  fromBox: Box,
  min: number,
  max: number,
  isBg: ReturnType<typeof isBgColor>,
  isNotBg: ReturnType<typeof isNotBgColor>,
): Box | undefined {
  const topLeft = scanPixelEast(width, fromBox.left + fromBox.width + 1, fromBox.top, isNotBg);
  if (topLeft) return getTile(topLeft, width, height, min, max, isBg);
  return null;
}

export function getNextTileSouth(
  width: number,
  height: number,
  fromBox: Box,
  min: number,
  max: number,
  isBg: ReturnType<typeof isBgColor>,
  isNotBg: ReturnType<typeof isNotBgColor>,
): Box | undefined {
  const topLeft = scanPixelSouth(height, fromBox.left, fromBox.top + fromBox.height + 1, isNotBg);
  if (topLeft) return getTile(topLeft, width, height, min, max, isBg);
  return null;
}

export function* exploreGrid(
  startTile: Box,
  width: number,
  height: number,
  min: number,
  max: number,
  isBg: ReturnType<typeof isBgColor>,
  isNotBg: ReturnType<typeof isNotBgColor>,
): Generator<Box, void, unknown> {
  const ROWS = 6;

  const tileEast = getNextTileEast(width, height, startTile, min, max, isBg, isNotBg);
  const tileSouth = getNextTileSouth(width, height, startTile, min, max, isBg, isNotBg);

  if (!tileEast || !tileSouth) {
    yield startTile;
    return;
  }

  const tolerance = 0.2;
  const avgWidth = (startTile.width + tileEast.width + tileSouth.width) / 3;
  const avgHeight = (startTile.height + tileEast.height + tileSouth.height) / 3;

  const tiles = [startTile, tileEast, tileSouth];
  for (const tile of tiles) {
    const widthDiff = Math.abs(tile.width - avgWidth) / avgWidth;
    const heightDiff = Math.abs(tile.height - avgHeight) / avgHeight;

    if (widthDiff > tolerance || heightDiff > tolerance) {
      yield startTile;
      return;
    }
  }

  const spacingX = tileEast.left - startTile.left;
  const spacingY = tileSouth.top - startTile.top;

  const fifthTile: Box = {
    left: startTile.left + 4 * spacingX,
    top: startTile.top,
    width: Math.round(avgWidth),
    height: Math.round(avgHeight),
  };

  const sixthTile = getNextTileEast(width, height, fifthTile, min, max, isBg, isNotBg);
  const wordLength = sixthTile ? 6 : 5;

  const tileWidth = Math.round(avgWidth);
  const tileHeight = Math.round(avgHeight);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < wordLength; col++) {
      const tile: Box = {
        left: startTile.left + col * spacingX,
        top: startTile.top + row * spacingY,
        width: tileWidth,
        height: tileHeight,
      };

      if (tile.left + tile.width <= width && tile.top + tile.height <= height) {
        yield tile;
      }
    }
  }
}

export function findFirstTile(
  data: Buffer,
  width: number,
  height: number,
  startX: number,
  startY: number,
  min: number,
  max: number,
  isBg: ReturnType<typeof isBgColor>,
  isNotBg: ReturnType<typeof isNotBgColor>,
): Box | undefined {
  let currentY = startY;

  while (currentY < height) {
    const startingPoint = scanPixelSouth(height, 0, currentY, isBg);
    if (!startingPoint) break;

    addPoint(startingPoint);

    const topLeft = scanPixel(width / 2, height, startingPoint.left, startingPoint.top + 1, isNotBg);
    if (!topLeft) {
      currentY = startingPoint.top + 1;
      continue;
    }

    addPoint(topLeft);

    const topRight = scanPixelEast(width, topLeft.left + 1, topLeft.top, isBg, topLeft.left + width * 0.5);
    if (!topRight) {
      return findFirstTile(data, width, height, topLeft.left, topLeft.top, min, max, isBg, isNotBg);
    }

    addPoint(topRight);

    const tileWidth = topRight.left - topLeft.left;
    if (tileWidth < min || tileWidth > max) {
      return findFirstTile(data, width, height, topLeft.left + 1, topLeft.top, min, max, isBg, isNotBg);
    }

    const bottomLeft = scanPixelSouth(height, topLeft.left, topLeft.top + 1, isBg);
    if (!bottomLeft) {
      return findFirstTile(data, width, height, 0, topLeft.top + 2, min, max, isBg, isNotBg);
    }

    const tileHeight = bottomLeft.top - topLeft.top;
    const ratio = tileHeight / tileWidth;
    if (ratio < 0.5 || ratio > 2 || tileHeight < min || tileHeight > max) {
      return findFirstTile(data, width, height, 0, bottomLeft.top, min, max, isBg, isNotBg);
    }

    return {
      left: topLeft.left,
      top: topLeft.top,
      width: tileWidth,
      height: tileHeight,
    };
  }

  return undefined;
}
