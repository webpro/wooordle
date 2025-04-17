import { getList } from '../util/get-list.ts';
import { findBestWord } from '../strategies/find-best-words.ts';
import { getRandomWord } from '../functions/get-random-word.ts';
import { isFinished } from '../functions/is-finished.ts';
import { getGuessResult } from '../functions/get-guess-result.ts';
import { printResult } from '../util/printer.ts';
import { findTopWord } from '../functions/find-top-word.ts';

const list = await getList('en', 5, 'target');
const full = await getList('en', 5, 'full');

const guesses = [];

const target = getRandomWord(list);

while (!isFinished(guesses)) {
  const word = guesses.length === 0 ? findTopWord(list) : findBestWord(list, full, guesses);
  const result = getGuessResult(target, word);
  guesses.push({ word, result });
}

printResult(guesses);
