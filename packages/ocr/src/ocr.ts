import { join } from 'node:path';
import sharp, { type Sharp } from 'sharp';
import type { Worker as TesseractWorker } from 'tesseract.js';

type OCRResult = {
  word: string;
  confidence: number;
  method: string;
};

function channelNegate(rowImage: Sharp, channel: 'red' | 'green' | 'blue') {
  return rowImage.clone().extractChannel(channel).normalise().negate();
}

async function recognize(
  rowImage: Sharp,
  channel: 'red' | 'green' | 'blue',
  worker: TesseractWorker,
  debug: boolean,
  tmpDir: string,
  rowIndex: number,
  idx: number,
  binarize = false,
): Promise<OCRResult | null> {
  try {
    let image = channelNegate(rowImage, channel);
    // Materialize the channel so Sharp applies thresholding after normalization and inversion.
    if (binarize) image = sharp(await image.png().toBuffer()).threshold();
    const method = binarize ? `${channel}-threshold` : channel;
    if (debug) await image.clone().png().toFile(join(tmpDir, `row-${rowIndex}-${idx}-${method}.png`));
    const result = await worker.recognize(await image.png().toBuffer());
    const word = result.data.text.trim().replace(/\s/g, '').toLowerCase();
    return { word, confidence: result.data.confidence, method };
  } catch {}
  return null;
}

export async function tryOCRMethods(
  rowImage: Sharp,
  fullList: Set<string>,
  worker: TesseractWorker,
  debug: boolean,
  tmpDir: string,
  rowIndex: number,
): Promise<OCRResult> {
  const primary = await recognize(rowImage, 'blue', worker, debug, tmpDir, rowIndex, 1);
  if (primary && fullList.has(primary.word)) {
    if (debug) console.log(' '.repeat(27), `blue:${primary.word}:${primary.confidence}`);
    return primary;
  }

  const fallbacks: ('green' | 'red')[] = ['green', 'red'];
  const results: OCRResult[] = primary ? [primary] : [];
  for (let i = 0; i < fallbacks.length; i++) {
    const r = await recognize(rowImage, fallbacks[i], worker, debug, tmpDir, rowIndex, i + 2);
    if (r) results.push(r);
  }

  const byConfidence = results.sort((a, b) => b.confidence - a.confidence);

  if (debug) console.log(' '.repeat(27), byConfidence.map(r => `${r.method}:${r.word}:${r.confidence}`).join(', '));

  const best = byConfidence.find(r => fullList.has(r.word));
  if (best) return best;

  const binary = await recognize(rowImage, 'blue', worker, debug, tmpDir, rowIndex, 4, true);
  return binary && fullList.has(binary.word) ? binary : { word: '', confidence: 0, method: 'FAILED' };
}
