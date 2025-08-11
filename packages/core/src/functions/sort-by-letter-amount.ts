export const sortByLetterAmount = (list: string[], letters: Set<string>) =>
  list.sort((a, b) => {
    const aExcludedLetters = [...a].filter(l => letters.has(l));
    const bExcludedLetters = [...b].filter(l => letters.has(l));
    return aExcludedLetters.length - bExcludedLetters.length;
  });
