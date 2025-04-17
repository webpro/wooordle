# Wooordle

## Game

Play at [wooordle.webpro.nl](https://wooordle.webpro.nl)

Local development:

```sh
bun run prebuild # once
bun run dev
```

## Run simulations

Use Bun, tsx or Node.js:

```sh
bun simulations/solve-random-word.ts
npx tsx simulations/solve-random-word.ts
node --experimental-strip-types --disable-warning=ExperimentalWarning simulations/solve-random-word.ts
```

Other available simulations:

```sh
bun simulations/find-best-words.ts
bun simulations/find-possible-words.ts
```

- Runs 2315 games with English 5-letter words
- Dutch and 6-letter word listsre also available
