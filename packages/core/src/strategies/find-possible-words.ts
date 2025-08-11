import { findPossibleWords } from '../functions/find-possible-words.ts';
import { initRemainingLetters } from '../functions/get-remaining-letters.ts';
import { updateRemainingLetters } from '../functions/update-remaining-letters.ts';
import { getGuessResultSimple } from '../functions/get-guess-result.ts';
import { updateMustAppear } from '../functions/update-must-appear.ts';
import type { GuessList, Run } from '../types';
import { isFinished } from '../functions/is-finished.ts';

/**
 * Effective approach with little code, taken from:
 *
 * https://coding-time.co/wordle/
 * https://github.com/mkonicek/wordle
 *
 * Contains flaw in try_guess (compare getGuessResult and getGuessResultSimple)
 */

export const run: Run = ({ list, target, firstGuess }) => {
  let attempts = 1;
  const guesses: GuessList = [];
  const remainingLetters = initRemainingLetters(5);
  const mustAppear = new Set<string>();

  let currentGuessWord = firstGuess;

  let possibleWords = Array.from(list);

  while (attempts <= 10) {
    const result = getGuessResultSimple(target, currentGuessWord);
    guesses.push({ word: currentGuessWord, result });

    if (isFinished(guesses)) {
      return attempts;
    }

    updateRemainingLetters(remainingLetters, currentGuessWord, result);
    updateMustAppear(mustAppear, currentGuessWord, result);

    possibleWords = findPossibleWords(new Set(possibleWords), remainingLetters, mustAppear);

    currentGuessWord = possibleWords[0];

    attempts++;
  }
};
