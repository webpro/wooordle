import { styleText, inspect } from 'node:util';

const create = a =>
  new Proxy(t => a.reduce((x, y) => styleText(y, x), t), {
    get: (_, p) => (p in inspect.colors ? create([...a, p]) : _[p]),
  });

export const chalk = create([]);
