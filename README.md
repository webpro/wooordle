# Wooordle

- [Game][1]
- [Advice][2]
- [Run simulations][3]
- [Algorithms][4]

## Game

Play at [wooordle.webpro.nl][5]

Local development:

```sh
pnpm wooordle
```

## Advice

Local development:

```sh
pnpm advice:server
pnpm advice:client
```

- Go to [localhost:5173][6] for web UI
- Or send image to `http://localhost:8080/api/advice`

Example requests:

```sh
curl -X POST http://localhost:8080/api/advice -H "Content-Type: multipart/form-data" -F "image=@./samples/wordle.jpeg"
curl -X POST http://localhost:8080/api/advice -H "Content-Type: multipart/form-data" -F "image=@./samples/woordle.jpeg"
curl -X POST http://localhost:8080/api/advice -H "Content-Type: multipart/form-data" -F "image=@./samples/wooordle.jpeg"
```

Example response:

```json
{
  "analysisResult": {
    "guesses": [
      {
        "word": "salet",
        "result": [1, 0, 0, 0, 2]
      }
    ],
    "wordLength": 5,
    "detectedLanguages": ["nl", "en"],
    "bestWords": {
      "nl": ["worst", "borst", "dorst", "korst", "vorst"],
      "en": ["foist", "joist", "moist", "hoist", "worst"]
    }
  }
}
```

Example using an iPhone Shortcut (actived by "Double Back Tap"):

[https://github.com/user-attachments/assets/d2015e0f-ae3b-47cb-a4a0-fa299cd8e7da][7]

## Run simulations

Use Node.js v24:

```sh
node packages/core/src/simulations/solve-random-word.ts
```

Other available simulations:

```sh
node packages/core/src/simulations/find-best-words.ts
node packages/core/src/simulations/find-possible-words.ts
node packages/core/src/simulations/entropy.ts salet
```

- Runs 2315 games with English 5-letter words
- Dutch and 6-letter word lists are also available

## Algorithms

Advice and development hints use the entropy strategy, which ranks allowed guesses by expected information gain.

- Dimitris Bertsimas and Alex Paskov
  - Article: [An Exact and Interpretable Solution to Wordle][8]
  - [Optimal Wordle][9]
  - Average: 3.42
- Martin Konicek
  - Article: [Solving Wordle with Python][10]
  - GitHub: [https://github.com/mkonicek/wordle][11]
  - Average: 3.556-3.769
- Lars Kappert
  - [Letter frequency][12]: average 3.60
  - [Entropy][13]: average 3.43

[1]: #game
[2]: #advice
[3]: #run-simulations
[4]: #algorithms
[5]: https://wooordle.webpro.nl
[6]: http://localhost:5173
[7]: https://github.com/user-attachments/assets/d2015e0f-ae3b-47cb-a4a0-fa299cd8e7da
[8]: https://auction-upload-files.s3.amazonaws.com/Wordle_Paper_Final.pdf
[9]: https://wordleopt.com
[10]: https://coding-time.co/wordle/
[11]: https://github.com/mkonicek/wordle
[12]: ./packages/core/src/strategies/find-best-words.ts
[13]: ./packages/core/src/strategies/entropy.ts
