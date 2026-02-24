import { parseArgs } from 'node:util';
import type { LANGUAGE, SIZE } from '../types';
import { getList } from '@wooordle/dict';
import { run } from '../strategies/entropy.ts';
import { printResults } from '../util/printer.ts';

const { values, positionals } = parseArgs({
  options: {
    nl: { type: 'boolean', default: false },
    '6': { type: 'boolean', default: false },
  },
  allowPositionals: true,
});

const lang: LANGUAGE = values.nl ? 'nl' : 'en';
const size: SIZE = values['6'] ? 6 : 5;
const firstGuess = positionals[0];

const list = await getList(lang, size, 'target');
const full = await getList(lang, size, 'full');

if (!firstGuess) {
  console.error('Usage: node entropy.ts <firstGuess> [--nl] [--6]');
  process.exit(1);
}

const results = new Map<number, number>();

for (const target of list) {
  const attempts = run({ list, full, target, firstGuess }) ?? -1;
  results.set(attempts, (results.get(attempts) || 0) + 1);
}

printResults(results);
