import util from 'node:util';

export const log = (...args: any[]) => {
  console.log(util.inspect(args, false, null, true));
};
