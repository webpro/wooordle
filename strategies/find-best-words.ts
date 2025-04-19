import { findTopWords } from '../functions/find-top-word.ts';
import { getCorrectLetters } from '../functions/get-correct-letters.ts';
import { getMisplacedLetters } from '../functions/get-misplaced-letters.ts';
import { getExcludedLetters } from '../functions/get-excluded-letters.ts';
import { getLetterSet } from '../util/get-letter-set.ts';
import { findMatches } from '../functions/find-matches.ts';
import { getExceedsLimit, getLetterCountLimits } from '../functions/get-letter-count-limits.ts';
import { getSize } from '../functions/get-size.ts';
import { findWordsWithMostLetters } from '../functions/find-word-with-most-letters.ts';
import type { GuessList, Run } from '../types';
import { isFinished } from '../functions/is-finished.ts';
import { getGuessResult } from '../functions/get-guess-result.ts';
import { rankWordsByLetterFrequency } from '../functions/rank-words-by-frequency.ts';

export const run: Run = ({ list, full, target, firstGuess }) => {
  let attempts = 1;
  const guesses: GuessList = [];

  let currentGuessWord = firstGuess;

  while (attempts <= 10) {
    const result = getGuessResult(target, currentGuessWord);
    guesses.push({ word: currentGuessWord, result });

    if (isFinished(guesses)) {
      return attempts;
    }

    currentGuessWord = findBestWord(list, full, guesses);

    attempts++;
  }
};

export const findBestWords = (list: Set<string>, full: Set<string>, guesses: GuessList): string[] => {
  const size = getSize(list);
  const previousWords = guesses.map(guess => guess.word);
  const correctLetters = getCorrectLetters(guesses);
  const misplacedLetters = getMisplacedLetters(guesses, correctLetters);
  const misplacedLettersSet = getLetterSet(misplacedLetters);
  const correctLettersSet = getLetterSet(correctLetters);
  const excludedLettersSet = getExcludedLetters(guesses, correctLettersSet, misplacedLettersSet);

  const letterCountLimits = getLetterCountLimits(guesses);
  const exceedsLimit = getExceedsLimit(letterCountLimits);

  const matches = findMatches(list, guesses, excludedLettersSet);

  const filtered = Array.from(matches).filter(word => !exceedsLimit(word) && !previousWords.includes(word));

  if (filtered.length <= 2) {
    return filtered;
  } else {
    const presentLetters = correctLettersSet.union(misplacedLettersSet);
    if (presentLetters.size === size - 1 || correctLettersSet.size >= size - 2) {
      const remainingLetters = new Set<string>();
      for (const word of filtered) {
        for (let i = 0; i < word.length; i++) {
          if (correctLetters[i]) continue;
          if (excludedLettersSet.has(word[i])) continue;
          remainingLetters.add(word[i]);
        }
      }

      const prioritizedLetters = remainingLetters.difference(presentLetters);
      if (prioritizedLetters.size > 0) {
        const words = findWordsWithMostLetters(full, prioritizedLetters, excludedLettersSet);
        if (words.length > 0)
          return rankWordsByLetterFrequency(words, filtered, prioritizedLetters, excludedLettersSet);
      }

      const words = findWordsWithMostLetters(full, remainingLetters, excludedLettersSet);
      return rankWordsByLetterFrequency(words, filtered, remainingLetters, excludedLettersSet);
    }

    return findTopWords(new Set(filtered)).map(wordScore => wordScore.word);
  }
};

export const findBestWord = (list: Set<string>, full: Set<string>, guesses: GuessList): string => {
  const suggestions = findBestWords(list, full, guesses);
  return suggestions[0];
};
