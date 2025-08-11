import { basename, join } from 'node:path';
import type sharp from 'sharp';
import type { Box, Point } from '../types.ts';

const _points: Point[] = [];
const _boxes: Box[] = [];

export function addPoint(point: Point) {
  _points.push(point);
}

export function addBox(box: Box) {
  _boxes.push(box);
}

export async function createDebugVisualization(
  originalImagePath: string,
  image: sharp.Sharp,
  width: number,
  height: number,
): Promise<void> {
  try {
    const repoRoot = join(import.meta.dirname, '../../../..');
    const tmpDir = join(repoRoot, 'tmp');

    let svgElements = '';

    svgElements += `<rect x="10" y="10" width="${width - 20}" height="${height - 20}" stroke="red" stroke-width="1" fill="none"/>`;

    for (const point of _points) {
      svgElements += `<circle cx="${point.left}" cy="${point.top}" r="4" stroke="red" stroke-width="1" fill="red" />`;
    }

    for (const box of _boxes) {
      svgElements += `<rect x="${box.left}" y="${box.top}" width="${box.width}" height="${box.height}" stroke="red" stroke-width="2" fill="none" />`;
      svgElements += `<text x="${box.left + 15}" y="${box.top + 30}" font-size="30" font-weight="bold" fill="red">${_boxes.indexOf(box) + 1}</text>`;
    }

    const overlay = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgElements}</svg>`;

    const input = Buffer.from(overlay);

    const filePath = join(tmpDir, `${basename(originalImagePath)}-debug-grid-detection.png`);
    await image
      .clone()
      .composite([{ input, top: 0, left: 0 }])
      .png()
      .toFile(filePath);
  } catch (error) {
    console.error('Failed to create debug visualization:', error);
  }
}
