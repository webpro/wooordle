import type { Sharp } from 'sharp';

export async function getTileColor(
  tileImage: Sharp,
  tileWidth: number,
  tileHeight: number,
  debug = false,
  tileIndex?: number,
  wordLength = 6,
): Promise<'grey' | 'yellow' | 'green' | 'unknown'> {
  if (!tileWidth || !tileHeight) {
    console.error('Error: Tile image has invalid dimensions (width or height is zero).');
    return 'unknown';
  }

  const insetRegion = {
    left: Math.floor(tileWidth * 0.15),
    top: Math.floor(tileHeight * 0.15),
    width: Math.floor(tileWidth * 0.2),
    height: Math.floor(tileHeight * 0.2),
  };

  if (insetRegion.width <= 0 || insetRegion.height <= 0) {
    console.error(`Error: Calculated invalid inset region for tile of size ${tileWidth}x${tileHeight}.`);
    console.error('Inset region:', insetRegion);
    return 'unknown';
  }

  const { data, info } = await tileImage.clone().extract(insetRegion).raw().toBuffer({ resolveWithObject: true });

  let totalR = 0,
    totalG = 0,
    totalB = 0;
  const pixelCount = data.length / info.channels;

  for (let i = 0; i < data.length; i += info.channels) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
  }

  const r = Math.round(totalR / pixelCount);
  const g = Math.round(totalG / pixelCount);
  const b = Math.round(totalB / pixelCount);

  const color = determineColorFromStats(r, g, b);

  if (debug && tileIndex !== undefined) {
    const row = Math.floor(tileIndex / wordLength) + 1;
    const col = (tileIndex % wordLength) + 1;
    const rgb = [r.toString().padStart(3, ' '), g.toString().padStart(3, ' '), b.toString().padStart(3, ' ')];
    console.log(`tile ${row}-${col}: ${rgb.join(',')} → ${color}`);
  }

  return color;
}

function determineColorFromStats(r: number, g: number, b: number): 'grey' | 'yellow' | 'green' | 'unknown' {
  if (g > r + 20 && g > b + 20 && g > 100) return 'green';
  if (r > 140 && g > 110 && b < 130 && r > b + 30) return 'yellow';
  if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30 && Math.abs(r - b) < 30 && r > 50 && r < 180) return 'grey';
  return 'unknown';
}
