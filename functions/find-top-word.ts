import { calculateLetterFrequency } from './calculate-letter-frequency.ts';
import { calculatePositionFrequency } from './calculate-position-frequency.ts';

export interface WordScore {
  word: string;
  score: number;
  variations?: WordScore[];
}

export const findTopWord = (list: Set<string>) => {
  if (!list || list.size === 0) return;
  const results = findTopWords(list, 1);
  return results[0].word;
};

export const findTopWords = (list: Set<string>, n: number = 5) => {
  if (!list || list.size === 0) return [];

  const letterFreq = calculateLetterFrequency(list);
  const positionFreq = calculatePositionFrequency(list);

  const wordScores: WordScore[] = Array.from(list).map(word => ({
    word,
    score: calculateWordScore(word, letterFreq, positionFreq),
    variations: [],
  }));

  wordScores.sort((a, b) => b.score - a.score);

  const topWords = wordScores.slice(0, n);

  topWords.forEach(wordScore => {
    wordScore.variations = findVariations(wordScore.word, wordScores);
  });

  return topWords;
};

function calculateWordScore(
  word: string,
  letterFreq: Map<string, number>,
  positionFreq: Map<string, number>[],
): number {
  let score = 0;
  const usedLetters = new Set();

  for (let i = 0; i < word.length; i++) {
    const letter = word[i];
    if (!usedLetters.has(letter)) {
      score += (positionFreq[i].get(letter) || 0) + (letterFreq.get(letter) || 0);
      usedLetters.add(letter);
    }
  }
  return score;
}

function findVariations(word: string, wordScores: WordScore[]): WordScore[] {
  const wordLetters = new Set(word.split(''));
  return wordScores
    .filter(w => w.word !== word && [...w.word].every(letter => wordLetters.has(letter)))
    .map(w => ({ word: w.word, score: w.score }));
}
