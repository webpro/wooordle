import { existsSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { createWorker, PSM } from 'tesseract.js';
import { getTileColor } from './detect-color.ts';
import { detectGrid } from './detect-grid.ts';
import { tryOCRMethods as recognizeWord } from './ocr.ts';
import { detectLanguageAndGetSuggestions, getOcrDictionary } from './utils/language-detection.ts';
import type { GuessList, GuessResult, LANGUAGE } from '@wooordle/core';
import type { Worker as TesseractWorker } from 'tesseract.js';
import type { AnalysisResult, Box } from './types.ts';

function renderRowWithColors(word: string, colors: GuessResult[]) {
  const colorMap = { 0: '\x1b[100m', 1: '\x1b[103m', 2: '\x1b[102m' };
  const toTile = (char: string, i: number) => `${colorMap[colors[i]] || ''}\x1b[30m ${char.toUpperCase()} \x1b[0m`;
  return word.split('').map(toTile).join('');
}

const langMap = {
  en: 'eng',
  nl: 'nld',
};

const repoRoot = join(import.meta.dirname, '../../..');
const tmpDir = join(repoRoot, 'tmp');
const langPath = join(repoRoot, 'packages/web');

let sharedWorkerPromise: Promise<TesseractWorker> | null = null;

async function getWorker(langs: string[]): Promise<TesseractWorker> {
  if (!sharedWorkerPromise) {
    sharedWorkerPromise = (async () => {
      // @ts-expect-error: createWorker supports options with langPath at runtime
      const worker = await createWorker(langs, { langPath });
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        tessedit_pageseg_mode: PSM.SINGLE_WORD,
      });
      return worker as TesseractWorker;
    })();
  }
  return sharedWorkerPromise;
}

export async function analyze(
  imagePath: string,
  imageBuffer: Buffer,
  lang?: LANGUAGE,
  debug = false,
): Promise<AnalysisResult> {
  const langs = lang ? [langMap[lang]] : Object.values(langMap);
  const worker = await getWorker(langs);

  if (debug) {
    if (existsSync(tmpDir)) for (const file of readdirSync(tmpDir)) rmSync(join(tmpDir, file));
    else mkdirSync(tmpDir);
  }

  try {
    const image = sharp(imageBuffer).removeAlpha();
    const metadata = await image.metadata();

    if (debug) {
      await image.clone().png().toFile(join(tmpDir, `input.png`));

      console.log(`${metadata.format} image; ${metadata.width}x${metadata.height}; ${metadata.size} bytes`);
    }

    const tileBoxes = await detectGrid(imagePath, image, debug);

    if (tileBoxes.length === 0) throw new Error('No tiles found in image.');

    const wordLength = new Set(tileBoxes.map(t => t.left)).size as 5 | 6;
    const numRows = Math.ceil(tileBoxes.length / wordLength);
    const colorMap: Record<string, GuessResult> = { green: 2, yellow: 1, grey: 0, unknown: 0 };
    const tileRows: { box: Box; color: GuessResult }[][] = Array.from({ length: numRows }, () => []);

    for (const [i, box] of tileBoxes.entries()) {
      const rowIndex = Math.floor(i / wordLength);
      const colorName = await getTileColor(image.clone().extract(box), box.width, box.height, debug, i, wordLength);
      tileRows[rowIndex].push({ box, color: colorMap[colorName] });
    }

    const ocrDictionary = await getOcrDictionary(lang, wordLength as 5 | 6);

    const guesses: GuessList = [];

    for (const [i, tilesInRow] of tileRows.entries()) {
      if (tilesInRow.length === 0) continue;

      const rowBox = {
        left: Math.min(...tilesInRow.map(t => t.box.left)),
        top: Math.min(...tilesInRow.map(t => t.box.top)),
        width: tilesInRow.reduce((sum, t) => sum + t.box.width, 0),
        height: Math.max(...tilesInRow.map(t => t.box.height)),
      };

      const tileImages = await Promise.all(
        tilesInRow.map(async t => {
          const buffer = await image.clone().extract(t.box).toBuffer();
          return {
            input: buffer,
            raw: { width: t.box.width, height: t.box.height, channels: 3 as const },
          };
        }),
      );

      const rowCompositeImage = sharp({
        create: {
          width: rowBox.width,
          height: rowBox.height,
          channels: 3,
          background: { r: 0, g: 0, b: 0 },
        },
      }).composite(
        tileImages.map((tile, i) => ({
          ...tile,
          left: tilesInRow.slice(0, i).reduce((sum, t) => sum + t.box.width, 0),
          top: 0,
        })),
      );

      const rowImage = sharp(await rowCompositeImage.png().toBuffer()).withMetadata({ density: 300 });

      const ocr = await recognizeWord(rowImage, ocrDictionary, worker, debug, tmpDir, i);

      if (debug) {
        const result = tilesInRow.map(t => t.color);
        const coloredRow = renderRowWithColors(ocr.word, result);
        const items = [ocr.word.toUpperCase(), `confidence: ${ocr.confidence}`, `method: ${ocr.method}`];
        console.log(`${coloredRow} ✔︎ row ${i + 1}: ${items.join('; ')}`);
        await rowImage
          .clone()
          .png()
          .toFile(join(tmpDir, `row-${i}-raw.png`));
      }

      if (ocr.word.length !== wordLength) {
        if (debug) console.log(`⚠️ Skipping row ${i + 1} for incorrect word length: ${ocr.word.length}/${wordLength}`);
        break;
      }

      const result = tilesInRow.map(t => t.color);
      guesses.push({ word: ocr.word, result });
    }

    if (guesses.length === 0) return { guesses: [], wordLength, detectedLanguages: [], bestWords: {} };

    const languageResult = await detectLanguageAndGetSuggestions(guesses, wordLength as 5 | 6, lang);
    return { guesses, wordLength, ...languageResult };
  } finally {
    // await worker.terminate();
  }
}
