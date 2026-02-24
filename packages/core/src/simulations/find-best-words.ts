import { getList } from '@wooordle/dict';
import { run } from '../strategies/find-best-words.ts';
import { printResults } from '../util/printer.ts';

const list = await getList('nl', 6, 'target');
const full = await getList('nl', 6, 'full');

const results = new Map<number, number>();

for (const target of list) {
  const attempts = run({ list, full, target, firstGuess: 'salet' }) ?? -1;
  results.set(attempts, (results.get(attempts) || 0) + 1);
}

printResults(results);
