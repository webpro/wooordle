export const getLetterSet = (letters: (undefined | string)[]) => new Set(letters.filter(Boolean));
