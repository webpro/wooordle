import { getList } from '../util/get-list.ts';
import { run } from '../strategies/find-best-words.ts';
import { printResults } from '../util/printer.ts';

const list = await getList('en', 5, 'target');
const full = await getList('en', 5, 'full');

const results = new Map<number, number>();

for (const target of list) {
  const attempts = run({ list, full, target, firstGuess: 'salet' }) ?? -1;
  results.set(attempts, (results.get(attempts) || 0) + 1);
}

printResults(results);
