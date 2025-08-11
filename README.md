# Wooordle

* [Game](#game)
* [Advice](#advice)
* [Run simulations](#run-simulations)
* [Algorithms](#algorithms)

## Game

Play at [wooordle.webpro.nl][1]

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

* Go to [localhost:5173](http://localhost:5173) for web UI
* Or send image to `http://localhost:8080/api/advice`

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

https://github.com/user-attachments/assets/d2015e0f-ae3b-47cb-a4a0-fa299cd8e7da

## Run simulations

Use Node.js v24:

```sh
node packages/core/src/simulations/solve-random-word.ts
```

Other available simulations:

```sh
node packages/core/src/simulations/find-best-words.ts
node packages/core/src/simulations/find-possible-words.ts
```

* Runs 2315 games with English 5-letter words
* Dutch and 6-letter word lists are also available

## Algorithms

* Dimitris Bertsimas and Alex Paskov
  * Article: [An Exact and Interpretable Solution to Wordle][3]
  * [Optimal Wordle][2]
  * Average: 3.42
* Martin Konicek
  * Article: [Solving Wordle with Python][4]
  * GitHub: [https://github.com/mkonicek/wordle][5]
  * Average: 3.556-3.769
* Lars Kappert
  * GitHub: [./strategies/find-best-words.ts][6]
  * Average: 3.60

[1]: https://wooordle.webpro.nl

[2]: https://wordleopt.com

[3]: https://auction-upload-files.s3.amazonaws.com/Wordle_Paper_Final.pdf

[4]: https://coding-time.co/wordle/

[5]: https://github.com/mkonicek/wordle

[6]: https://github.com/webpro/wooordle/blob/main/strategies/find-best-words.ts
