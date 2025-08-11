import { styleText } from 'node:util';
import type { GuessList, Guess } from '@wooordle/core';

const bgColors = ['bgBlack', 'bgYellow', 'bgGreen'];

const printGuessResult = (guess: Guess) => {
  let r = '';
  for (let i = 0; i < guess.word.length; i++) {
    const bgColor = bgColors[guess.result[i]];
    r += styleText(bgColor, guess.word[i].toUpperCase());
  }
  console.log(r);
};

export const printResult = (guesses: GuessList) => {
  for (const guess of guesses) {
    printGuessResult(guess);
  }
};

export const printResults = (results: Map<number, number>) => {
  const total = Array.from(results.values()).reduce((acc, count) => acc + count, 0);
  console.log(`Amount of games: ${total}`);

  for (const [attempts, count] of results) {
    console.log(`${attempts} attempts: ${count} games`);
  }

  const average = Array.from(results.entries()).reduce((acc, [attempts, count]) => acc + attempts * count, 0) / total;
  console.log(`Average attempts: ${average.toFixed(2)}`);

  const unsolved = Array.from(results.entries()).reduce((acc, [attempts, count]) => {
    if (attempts > 6) acc += count;
    return acc;
  }, 0);

  console.log(`Unsolved: ${unsolved}`);
};
