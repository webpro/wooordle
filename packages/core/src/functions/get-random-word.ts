export const getRandomWord = (list: Set<string>): string => {
  const arr = Array.from(list);
  return arr[Math.floor(Math.random() * arr.length)];
};
