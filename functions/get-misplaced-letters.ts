import type { GuessList } from '../types';

export const getMisplacedLetters = (
  guesses: GuessList,
  correctLetters: (string | undefined)[],
  fixCorrectLetters = true,
) => {
  const size = guesses[0].word.length;
  const misplacedLetters: string[] = [];
  const correctLettersAmount = () => correctLetters.filter(l => l !== undefined).length;
  for (const guess of guesses) {
    for (let i = 0; i < guess.word.length; i++) {
      if (guess.result[i] === 1) {
        if (!correctLetters.includes(guess.word[i])) {
          const p = [
            correctLetters.findIndex(l => l === undefined),
            correctLetters.findLastIndex(l => l === undefined),
          ];
          if (correctLettersAmount() === size - 1) {
            const pos = correctLetters.findIndex(l => l === undefined);
            if (fixCorrectLetters && pos !== -1) correctLetters[pos] = guess.word[i];
          } else if (correctLettersAmount() === size - 2 && p.includes(i)) {
            if (fixCorrectLetters) correctLetters[p.at(p.indexOf(i) - 1)] = guess.word[i];
            misplacedLetters.push(guess.word[i]);
          } else {
            misplacedLetters.push(guess.word[i]);
          }
        }
      }
    }
  }
  return misplacedLetters;
};
