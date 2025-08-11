const tolerance = 15;

export function getColor(data: Buffer, x: number, y: number, width: number): [number, number, number] {
  const index = (y * width + x) * 3;
  return [data[index], data[index + 1], data[index + 2]];
}

export const isBgColor =
  (data: Buffer, width: number, bgR: number, bgG: number, bgB: number) => (x: number, y: number) => {
    const [r, g, b] = getColor(data, x, y, width);
    return isBackgroundColor(r, g, b, bgR, bgG, bgB, tolerance);
  };

export const isNotBgColor =
  (data: Buffer, width: number, bgR: number, bgG: number, bgB: number) => (x: number, y: number) => {
    const [r, g, b] = getColor(data, x, y, width);
    return !isBackgroundColor(r, g, b, bgR, bgG, bgB, tolerance);
  };

export function isBackgroundColor(
  r: number,
  g: number,
  b: number,
  bgR: number,
  bgG: number,
  bgB: number,
  tolerance = 15,
): boolean {
  return Math.abs(r - bgR) <= tolerance && Math.abs(g - bgG) <= tolerance && Math.abs(b - bgB) <= tolerance;
}

export function getDominantBorderColor(
  data: Buffer,
  width: number,
  height: number,
  debug = false,
): [number, number, number] {
  const THICKNESS_W = Math.min(10, width);
  const SAMPLE_RATE = 4;

  const h_start = Math.round(height * 0.12);
  const h_end = Math.round(height * 0.66);
  const colorCounts = new Map<string, number>();

  for (let x = 0; x < Math.min(THICKNESS_W, width); x++) {
    for (let y = h_start; y < h_end; y += SAMPLE_RATE) {
      const colorKey = getColor(data, x, y, width).join(',');
      colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
    }
  }

  for (let x = Math.max(0, width - THICKNESS_W); x < width; x++) {
    for (let y = h_start; y < h_end; y += SAMPLE_RATE) {
      const colorKey = getColor(data, x, y, width).join(',');
      colorCounts.set(colorKey, (colorCounts.get(colorKey) || 0) + 1);
    }
  }

  let maxCount = 0;
  let dominantColor = '0,0,0';

  for (const [color, count] of colorCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      dominantColor = color;
    }
  }

  const [r, g, b] = dominantColor.split(',').map(Number);

  if (debug) {
    console.log(`dominant border color: rgb(${r}, ${g}, ${b})`);
    const ranked = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    console.log(
      'top 5 colors:',
      ranked.map(([color, count]) => `${color}: ${count}`),
    );
  }

  return [r, g, b];
}
