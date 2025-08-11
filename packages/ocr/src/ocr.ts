import { join } from 'node:path';
import type sharp from 'sharp';
import type Tesseract from 'tesseract.js';
import type { Worker as TesseractWorker } from 'tesseract.js';

type OCRResult = {
  word: string;
  confidence: number;
  method: string;
};

async function tryBlueNegate(
  rowImage: sharp.Sharp,
  worker: TesseractWorker,
  debug: boolean,
  tmpDir: string,
  rowIndex: number,
): Promise<Tesseract.RecognizeResult | null> {
  try {
    const blueChannelImage = rowImage.clone().extractChannel('blue').normalise().negate();

    if (debug) {
      await blueChannelImage
        .clone()
        .png()
        .toFile(join(tmpDir, `row-${rowIndex}-1-blue.png`));
    }

    return await worker.recognize(await blueChannelImage.png().toBuffer());
  } catch {}
  return null;
}

async function tryContrast(
  rowImage: sharp.Sharp,
  worker: TesseractWorker,
  debug: boolean,
  tmpDir: string,
  rowIndex: number,
): Promise<Tesseract.RecognizeResult | null> {
  try {
    const contrastImage = rowImage.clone().normalise().linear(1.3, -30);

    if (debug) {
      await contrastImage
        .clone()
        .png()
        .toFile(join(tmpDir, `row-${rowIndex}-2-contrast.png`));
    }

    return await worker.recognize(await contrastImage.png().toBuffer());
  } catch {}
  return null;
}

async function tryFallback(
  rowImage: sharp.Sharp,
  worker: TesseractWorker,
  debug: boolean,
  tmpDir: string,
  rowIndex: number,
): Promise<Tesseract.RecognizeResult | null> {
  try {
    const fallbackImage = rowImage.clone().extractChannel('blue').normalize().negate();

    if (debug) {
      await fallbackImage
        .clone()
        .png()
        .toFile(join(tmpDir, `row-${rowIndex}-3-fallback.png`));
    }

    return await worker.recognize(await fallbackImage.png().toBuffer());
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
  const results: OCRResult[] = [];

  {
    const result = await tryBlueNegate(rowImage, worker, debug, tmpDir, rowIndex);
    if (result) {
      const word = result.data.text.trim().replace(/\s/g, '').toLowerCase();
      results.push({ word, confidence: result.data.confidence, method: 'blue-negate' });
    }
  }

  {
    const result = await tryContrast(rowImage, worker, debug, tmpDir, rowIndex);
    if (result) {
      const word = result.data.text.trim().replace(/\s/g, '').toLowerCase();
      results.push({ word, confidence: result.data.confidence, method: 'contrast' });
    }
  }

  {
    const result = await tryFallback(rowImage, worker, debug, tmpDir, rowIndex);
    if (result) {
      const word = result.data.text.trim().replace(/\s/g, '').toLowerCase();
      results.push({ word, confidence: result.data.confidence, method: 'fallback' });
    }
  }

  const byConfidence = results.sort((a, b) => b.confidence - a.confidence);

  if (debug) console.log(' '.repeat(27), byConfidence.map(r => `${r.method}:${r.confidence}`).join(', '));

  return byConfidence.filter(r => fullList.has(r.word)).at(0) ?? { word: '', confidence: 0, method: 'FAILED' };
}
