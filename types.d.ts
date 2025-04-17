export type LANGUAGE = 'en' | 'nl';

export type LIST_TYPE = 'target' | 'full';

export type SIZE = 5 | 6;

export type RemainingLetters = Set<string>[];

export type GuessResult = 0 | 1 | 2;

export type Guess = {
  word: string;
  result: GuessResult[];
};

export type GuessList = Guess[];

export interface Strategy {
  list: Set<string>;
  full?: Set<string>;
  target: string;
  firstGuess: string;
}

export type Run = (options: Strategy) => number;
