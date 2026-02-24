import { join } from 'node:path';
import type sharp from 'sharp';
import type Tesseract from 'tesseract.js';
import type { Worker as TesseractWorker } from 'tesseract.js';

type OCRResult = {
  word: string;
  confidence: number;
  method: string;
};

function channelNegate(rowImage: sharp.Sharp, channel: 'red' | 'green' | 'blue') {
  return rowImage.clone().extractChannel(channel).normalise().negate();
}

async function recognize(
  rowImage: sharp.Sharp,
  channel: 'red' | 'green' | 'blue',
  worker: TesseractWorker,
  debug: boolean,
  tmpDir: string,
  rowIndex: number,
  idx: number,
): Promise<OCRResult | null> {
  try {
    const image = channelNegate(rowImage, channel);
    if (debug) await image.clone().png().toFile(join(tmpDir, `row-${rowIndex}-${idx}-${channel}.png`));
    const result = await worker.recognize(await image.png().toBuffer());
    const word = result.data.text.trim().replace(/\s/g, '').toLowerCase();
    return { word, confidence: result.data.confidence, method: channel };
  } catch {}
  return null;
}

export async function tryOCRMethods(
  rowImage: sharp.Sharp,
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

  return byConfidence.filter(r => fullList.has(r.word)).at(0) ?? { word: '', confidence: 0, method: 'FAILED' };
}
