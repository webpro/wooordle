# Wooordle

## Game

Play at [wooordle.webpro.nl][1]

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

## Algorithms

- Dimitris Bertsimas and Alex Paskov
  - Article: [An Exact and Interpretable Solution to Wordle][3]
  - [Optimal Wordle][2]
  - Average: 3.42
- Martin Konicek
  - Article: [Solving Wordle with Python][4]
  - GitHub: [https://github.com/mkonicek/wordle][5]
  - Average: 3.556-3.769
- Lars Kappert
  - GitHub: [./strategies/find-best-words.ts][6]
  - Average: 3.60

[1]: https://wooordle.webpro.nl
[2]: https://wordleopt.com
[3]: https://auction-upload-files.s3.amazonaws.com/Wordle_Paper_Final.pdf
[4]: https://coding-time.co/wordle/
[5]: https://github.com/mkonicek/wordle
[6]: https://github.com/webpro/wooordle/blob/main/strategies/find-best-words.ts
