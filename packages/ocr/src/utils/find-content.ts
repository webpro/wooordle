import type { Box } from '../types';

function toGrayscale(data: Buffer, width: number, height: number): Uint8Array {
  const gray = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const idx = i * 3;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  return gray;
}

function arrayMax(arr: Float64Array): number {
  let m = 0;
  for (let i = 0; i < arr.length; i++) if (arr[i] > m) m = arr[i];
  return m;
}

function verticalEdgeProfile(
  gray: Uint8Array,
  width: number,
  yStart: number,
  yEnd: number,
): Float64Array {
  const profile = new Float64Array(width);
  for (let x = 0; x < width - 1; x++) {
    let sum = 0;
    for (let y = yStart; y < yEnd; y++) {
      sum += Math.abs(gray[y * width + x + 1] - gray[y * width + x]);
    }
    profile[x] = sum;
  }
  return profile;
}


function findPeaks(
  profile: Float64Array,
  minDistance: number,
  threshold: number,
): number[] {
  const peaks: number[] = [];
  for (let i = 1; i < profile.length - 1; i++) {
    if (profile[i] < threshold) continue;
    if (profile[i] < profile[i - 1] || profile[i] < profile[i + 1]) continue;
    if (peaks.length === 0 || i - peaks[peaks.length - 1] >= minDistance) {
      peaks.push(i);
    } else if (profile[i] > profile[peaks[peaks.length - 1]]) {
      peaks[peaks.length - 1] = i;
    }
  }
  return peaks;
}

function findDominantSpacing(
  peaks: number[],
  profile: Float64Array,
  minSpacing: number,
  maxSpacing: number,
): number {
  const dists: number[] = [];
  const weights: number[] = [];

  for (let i = 0; i < peaks.length; i++) {
    const wi = profile[peaks[i]];
    for (let j = i + 1; j < peaks.length; j++) {
      const d = peaks[j] - peaks[i];
      if (d >= minSpacing && d <= maxSpacing) {
        dists.push(d);
        weights.push(wi * profile[peaks[j]]);
      }
    }
  }
  if (dists.length === 0) return 0;

  const tolerance = 0.12;
  let bestScore = 0;
  let bestIdx = 0;

  for (let i = 0; i < dists.length; i++) {
    let score = 0;
    for (let j = 0; j < dists.length; j++) {
      if (Math.abs(dists[j] - dists[i]) <= dists[i] * tolerance) score += weights[j];
    }
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  let weightedSum = 0;
  let totalWeight = 0;
  const bestDist = dists[bestIdx];
  for (let i = 0; i < dists.length; i++) {
    if (Math.abs(dists[i] - bestDist) <= bestDist * tolerance) {
      weightedSum += dists[i] * weights[i];
      totalWeight += weights[i];
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

function findNearestPeak(
  peaks: number[],
  target: number,
  maxDistance: number,
): number | null {
  let nearest: number | null = null;
  let nearestDist = maxDistance;
  for (const p of peaks) {
    const dist = Math.abs(p - target);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = p;
    } else if (p > target) break;
  }
  return nearest;
}

function peakEnergy(profile: Float64Array, pos: number, radius: number): number {
  let energy = 0;
  const lo = Math.max(0, pos - radius);
  const hi = Math.min(profile.length - 1, pos + radius);
  for (let x = lo; x <= hi; x++) energy += profile[x];
  return energy;
}

function findGridLines(
  profile: Float64Array,
  peaks: number[],
  period: number,
  expectedCounts: number[],
  { preferLarger = false, debug = false } = {},
): { positions: number[]; spacing: number } | null {
  const tolerance = period * 0.20;
  const windowR = Math.max(3, Math.round(period * 0.08));

  const bestByCount = new Map<
    number,
    { positions: number[]; spacing: number; score: number }
  >();

  for (const count of expectedCounts) {
    let bestScore = -Infinity;
    let bestResult: { positions: number[]; spacing: number } | null = null;

    for (const startPeak of peaks) {
      const positions = [startPeak];
      let quality = peakEnergy(profile, startPeak, windowR);

      for (let k = 1; k < count; k++) {
        const expected = startPeak + k * period;
        const nearest = findNearestPeak(peaks, expected, tolerance);
        if (nearest === null) break;
        positions.push(nearest);
        quality += peakEnergy(profile, nearest, windowR);
      }

      if (positions.length !== count) continue;

      const avgSpacing =
        (positions[positions.length - 1] - positions[0]) / (count - 1);
      const score = quality / count;

      if (score > bestScore) {
        bestScore = score;
        bestResult = { positions, spacing: Math.round(avgSpacing) };
      }
    }

    if (bestResult) {
      bestByCount.set(count, { ...bestResult, score: bestScore });
    }
  }

  if (bestByCount.size === 0) return null;

  let maxScore = -Infinity;
  for (const [, r] of bestByCount) {
    if (r.score > maxScore) maxScore = r.score;
  }

  const sorted = [...bestByCount.entries()].sort((a, b) => b[0] - a[0]);
  let winner = sorted[0];

  if (preferLarger) {
    for (const entry of sorted) {
      if (entry[1].score >= maxScore * 0.95) { winner = entry; break; }
    }
  } else {
    for (const entry of sorted) {
      if (entry[1].score > winner[1].score) winner = entry;
    }
  }

  const result = winner[1];
  if (debug) {
    console.log(
      `  grid lines: ${result.positions.length} gaps, ` +
        `spacing=${result.spacing}, pos=[${result.positions.join(', ')}]`,
    );
  }
  return { positions: result.positions, spacing: result.spacing };
}

function estimateTileSize(
  profile: Float64Array,
  gapPositions: number[],
  spacing: number,
): number {
  if (gapPositions.length < 2) return Math.round(spacing * 0.85);

  let peakMax = 0;
  for (const p of gapPositions) if (profile[p] > peakMax) peakMax = profile[p];
  const threshold = peakMax * 0.3;

  let total = 0;
  let count = 0;

  for (let i = 0; i < gapPositions.length - 1; i++) {
    const left = gapPositions[i];
    const right = gapPositions[i + 1];

    let tileStart = left;
    while (tileStart < right && profile[tileStart] > threshold) tileStart++;

    let tileEnd = right;
    while (tileEnd > tileStart && profile[tileEnd] > threshold) tileEnd--;

    if (tileEnd > tileStart) {
      total += tileEnd - tileStart;
      count++;
    }
  }

  const measured = count > 0 ? Math.round(total / count) : Math.round(spacing * 0.85);
  return Math.min(measured, spacing - 2);
}

function trimEdgePeaks(
  positions: number[],
  spacing: number,
  tileSize: number,
  imageSize: number,
): number[] {
  const gapW = spacing - tileSize;
  const originFromFirst = positions[0] - tileSize - gapW / 2;

  if (originFromFirst < -(tileSize * 0.2) && positions.length > 4)
    return positions.slice(1);

  const lastTileRight = positions[positions.length - 1] + gapW / 2 + tileSize;
  if (lastTileRight > imageSize + tileSize * 0.2 && positions.length > 4)
    return positions.slice(0, -1);

  return positions;
}

function extendGaps(
  gaps: number[],
  spacing: number,
  peaks: number[],
  targetCount: number,
  maxExtent: number,
): number[] {
  if (gaps.length === 0 || gaps.length >= targetCount) return gaps;

  const result = [...gaps];
  const tol = spacing * 0.25;

  while (result.length < targetCount) {
    const expected = result[0] - spacing;
    if (expected < 0) break;
    const nearest = findNearestPeak(peaks, expected, tol);
    if (nearest === null) break;
    result.unshift(nearest);
  }

  while (result.length < targetCount) {
    const expected = result[result.length - 1] + spacing;
    if (expected >= maxExtent) break;
    const nearest = findNearestPeak(peaks, expected, tol);
    if (nearest === null) break;
    result.push(nearest);
  }

  return result;
}

function findTileRowsFromCenter(
  gray: Uint8Array,
  width: number,
  height: number,
  colGaps: number[],
  colSpacing: number,
  tileWidth: number,
  debug: boolean,
): { top: number; height: number }[] | null {
  const gapW = colSpacing - tileWidth;
  const numCols = colGaps.length + 1;
  const originX = Math.round(colGaps[0] - tileWidth - gapW / 2);

  const sampleXs: number[] = [];
  for (let c = 0; c < numCols; c++) {
    const cx = originX + c * colSpacing + Math.floor(tileWidth / 2);
    if (cx >= 0 && cx < width) sampleXs.push(cx);
  }
  if (sampleXs.length < 2) return null;

  const bgHist = new Uint32Array(256);
  for (let y = 0; y < height; y++) {
    for (const cx of sampleXs) bgHist[gray[y * width + cx]]++;
  }
  let bgLevel = 0, bgCount = 0;
  for (let i = 0; i < 256; i++) {
    if (bgHist[i] > bgCount) { bgCount = bgHist[i]; bgLevel = i; }
  }

  const n = sampleXs.length;
  const diffs = new Float64Array(n);
  const rawProfile = new Float64Array(height);
  for (let y = 0; y < height; y++) {
    for (let i = 0; i < n; i++) diffs[i] = Math.abs(gray[y * width + sampleXs[i]] - bgLevel);
    diffs.sort();
    rawProfile[y] = diffs[1];
  }

  const profile = new Float64Array(height);
  for (let y = 0; y < height; y++) {
    let sum = 0, count = 0;
    for (let dy = -2; dy <= 2; dy++) {
      const yy = y + dy;
      if (yy >= 0 && yy < height) { sum += rawProfile[yy]; count++; }
    }
    profile[y] = sum / count;
  }

  const threshold = 10;
  const minBandHeight = Math.round(tileWidth * 0.3);
  const maxBandHeight = Math.round(colSpacing * 1.05);
  const bands: { top: number; bottom: number }[] = [];
  let inBand = false, bandTop = 0;

  for (let y = 0; y <= height; y++) {
    const v = y < height ? profile[y] : 0;
    if (v > threshold && !inBand) {
      inBand = true;
      bandTop = y;
    } else if (v <= threshold && inBand) {
      inBand = false;
      const h = y - bandTop;
      if (h >= minBandHeight && h <= maxBandHeight) bands.push({ top: bandTop, bottom: y });
    }
  }

  if (bands.length === 0) return null;

  if (debug) {
    console.log(`center-outward: bg=${bgLevel}, ${bands.length} bands`);
    for (const b of bands) console.log(`  band: y=${b.top}..${b.bottom} (h=${b.bottom - b.top})`);
  }

  const spacingTol = colSpacing * 0.35;
  let bestResult: { top: number; bottom: number }[] | null = null;
  let bestScore = Infinity;

  for (let anchorIdx = 0; anchorIdx < bands.length; anchorIdx++) {
    const gridBands = [bands[anchorIdx]];
    const anchorMid = (bands[anchorIdx].top + bands[anchorIdx].bottom) / 2;

    let lastMid = anchorMid;
    for (let i = anchorIdx - 1; i >= 0; i--) {
      const mid = (bands[i].top + bands[i].bottom) / 2;
      if (Math.abs((lastMid - mid) - colSpacing) < spacingTol) {
        gridBands.unshift(bands[i]);
        lastMid = mid;
      }
    }

    lastMid = anchorMid;
    for (let i = anchorIdx + 1; i < bands.length; i++) {
      const mid = (bands[i].top + bands[i].bottom) / 2;
      if (Math.abs((mid - lastMid) - colSpacing) < spacingTol) {
        gridBands.push(bands[i]);
        lastMid = mid;
      }
    }

    if (gridBands.length > 7) continue;

    let heightMismatch = 0;
    for (const b of gridBands) heightMismatch += Math.abs((b.bottom - b.top) - tileWidth);
    const score = heightMismatch / gridBands.length;

    if (debug) console.log(`  anchor ${anchorIdx}: ${gridBands.length} rows, heightScore=${Math.round(score)}`);

    if (score < bestScore) {
      bestScore = score;
      bestResult = [...gridBands];
    }
  }

  if (!bestResult) return null;

  if (debug) {
    console.log(`  best: ${bestResult.length} grid rows (score=${Math.round(bestScore)})`);
    for (const b of bestResult) console.log(`    row: y=${b.top}..${b.bottom} (h=${b.bottom - b.top})`);
  }

  return bestResult.map(b => ({ top: b.top, height: b.bottom - b.top }));
}

export function detectGridFromProjections(
  data: Buffer,
  width: number,
  height: number,
  debug = false,
): Box[] {
  const gray = toGrayscale(data, width, height);
  return detectGridInRange(gray, width, height, Math.round(height * 0.15), Math.round(height * 0.65), debug);
}

function detectGridInRange(
  gray: Uint8Array,
  width: number,
  height: number,
  vYStart: number,
  vYEnd: number,
  debug = false,
): Box[] {
  const vProfile = verticalEdgeProfile(gray, width, vYStart, vYEnd);

  const minSpacing = Math.max(10, Math.round(width / 50));
  const maxSpacing = Math.round(width / 3);

  const vMax = arrayMax(vProfile);
  if (vMax === 0) return [];

  const initialPeakDist = Math.max(5, Math.round(width / 100));
  const initialVPeaks = findPeaks(vProfile, initialPeakDist, vMax * 0.15);

  if (debug) console.log(`initial col peaks (${initialVPeaks.length}): [${initialVPeaks.join(', ')}]`);

  const colSpacing = findDominantSpacing(initialVPeaks, vProfile, minSpacing, maxSpacing);
  if (colSpacing === 0) {
    if (debug) console.log('no dominant column spacing found');
    return [];
  }

  const vPeakDist = Math.max(5, Math.round(colSpacing * 0.4));
  const vPeaks = findPeaks(vProfile, vPeakDist, vMax * 0.15);

  if (debug) {
    console.log(`col spacing (pairwise): ${colSpacing}`);
    console.log(`  refined peaks (${vPeaks.length}): [${vPeaks.join(', ')}]`);
  }

  const colResult = findGridLines(vProfile, vPeaks, colSpacing, [4, 5], { preferLarger: true, debug });
  if (!colResult) {
    if (debug) console.log('no regular column gaps found');
    return [];
  }

  let colGaps = colResult.positions;
  const colSpc = colResult.spacing;

  let tileWidth = estimateTileSize(vProfile, colGaps, colSpc);
  colGaps = trimEdgePeaks(colGaps, colSpc, tileWidth, width);
  colGaps = extendGaps(colGaps, colSpc, vPeaks, colResult.positions.length, width);
  tileWidth = estimateTileSize(vProfile, colGaps, colSpc);

  let numCols = colGaps.length + 1;
  const rowBands = findTileRowsFromCenter(gray, width, height, colGaps, colSpc, tileWidth, debug);
  if (!rowBands || rowBands.length === 0) {
    if (debug) console.log('no tile rows found');
    return [];
  }

  const tileHeight = Math.min(tileWidth, ...rowBands.map(b => b.height));
  const gapW = colSpc - tileWidth;
  const originX = Math.round(colGaps[0] - tileWidth - gapW / 2);

  const lastBand = rowBands[rowBands.length - 1];
  const sampleY = rowBands[0].top + Math.round(rowBands[0].height * 0.15);
  const bgRefY = Math.min(height - 1, lastBand.top + lastBand.height + Math.round(colSpc * 0.3));
  while (numCols > 4) {
    const cx = originX + (numCols - 1) * colSpc + Math.floor(tileWidth / 2);
    if (cx < 0 || cx >= width) { numCols--; continue; }
    const tileVal = gray[sampleY * width + cx];
    const bgVal = gray[bgRefY * width + cx];
    if (Math.abs(tileVal - bgVal) < 15) {
      if (debug) console.log(`  trimming empty col ${numCols} (tile=${tileVal}, bg=${bgVal})`);
      numCols--;
    } else break;
  }

  if (debug) {
    console.log(`grid: ${numCols}×${rowBands.length}`);
    console.log(`tile: ${tileWidth}×${tileHeight}`);
  }

  const tiles: Box[] = [];
  for (const band of rowBands) {
    const top = band.top + Math.round((band.height - tileHeight) / 2);
    for (let col = 0; col < numCols; col++) {
      const left = originX + col * colSpc;
      if (left >= 0 && top >= 0 && left + tileWidth <= width && top + tileHeight <= height) {
        tiles.push({ left, top, width: tileWidth, height: tileHeight });
      }
    }
  }

  return tiles;
}
