import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import type { LANGUAGE, LIST_TYPE, SIZE } from '../core/src/types.ts';

const trim = (s: string) => s.trim().toLowerCase();
const isFive = (s: string) => s.length === 5;
const isSix = (s: string) => s.length === 6;

const CACHE = new Map<`${LANGUAGE}-${SIZE}-${LIST_TYPE}`, Set<string>>();

export async function getList(language: LANGUAGE, size: SIZE, type: LIST_TYPE) {
  const key = `${language}-${size}-${type}` as const;
  if (CACHE.has(key)) return CACHE.get(key);
  const filePath = import.meta.resolve(`@wooordle/dict/${language}-${size}-${type}.txt`);
  const content = await readFile(fileURLToPath(filePath), 'utf-8');
  const isSize = size === 5 ? isFive : isSix;
  const list = new Set(content.split('\n').map(trim).filter(isSize));
  CACHE.set(key, list);
  return list;
}
