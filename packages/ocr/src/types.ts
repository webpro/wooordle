import type { Guess } from '@wooordle/core';
import type { LANGUAGE } from '@wooordle/core';

export interface Point {
  left: number;
  top: number;
  r?: number;
  g?: number;
  b?: number;
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Tile extends Box {
  color: 'grey' | 'yellow' | 'green' | 'unknown';
  letter: string;
}

export interface Candidate extends Box {
  candidateX: number;
  candidateY: number;
  centerColor: string;
  areaRatio: string;
  aspectRatio: string;
  status: 'accepted' | 'rejected';
  reason: string;
  attemptNumber: number;
}

export interface AnalysisResult {
  guesses: Guess[];
  wordLength: number;
  detectedLanguages: Array<LANGUAGE>;
  bestWords: { [lang in LANGUAGE]?: string[] };
}
