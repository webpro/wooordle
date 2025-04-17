import { getList } from '../util/get-list.ts';
import { run } from '../strategies/find-possible-words.ts';
import { printResults } from '../util/printer.ts';

const list = await getList('en', 5, 'target');

const results = new Map<number, number>();

for (const target of list) {
  const attempts = run({ list, target, firstGuess: 'raise' });
  results.set(attempts, (results.get(attempts) || 0) + 1);
}

printResults(results);
