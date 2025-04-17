import { getGuessResult } from '../functions/get-guess-result.ts';
import wordLists from './words.json';
import { html, render } from 'uhtml';
import { getCorrectLetters } from '../functions/get-correct-letters.ts';
import { getMisplacedLetters } from '../functions/get-misplaced-letters.ts';
import { getExcludedLetters } from '../functions/get-excluded-letters.ts';
import { getLetterSet } from '../util/get-letter-set.ts';

const DEFAULT_CONFIG = {
  size: 5,
  language: 'nl',
};

const DEFAULT_STATE = {
  guesses: [],
  currentGuess: '',
  targetWord: undefined,
  gameState: 'playing',
};

const DEFAULT_SCORES = {
  nl: {
    5: { streak: 0, points: 0, bestStreak: 0, bestPoints: 0 },
    6: { streak: 0, points: 0, bestStreak: 0, bestPoints: 0 },
  },
  en: {
    5: { streak: 0, points: 0, bestStreak: 0, bestPoints: 0 },
    6: { streak: 0, points: 0, bestStreak: 0, bestPoints: 0 },
  },
};

const ATTEMPTS = 6;

const isDarkTheme = () => document.documentElement.getAttribute('data-theme') === 'dark';

const toggleTheme = () => {
  const isDark = isDarkTheme();
  const newTheme = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
};

class Wooordle {
  config: typeof DEFAULT_CONFIG;
  state: typeof DEFAULT_STATE;
  scores: typeof DEFAULT_SCORES;
  list: Set<string>;
  full: Set<string>;

  constructor() {
    document.addEventListener('click', event => {
      if (!event.target.closest('.menu-container')) {
        this.hideMenu();
      }
    });

    this.init();
  }

  saveConfig(config: typeof DEFAULT_CONFIG) {
    this.config = config;
    localStorage.setItem('config', JSON.stringify(config));
  }

  loadConfig() {
    const item = localStorage.getItem('config');
    return item ? JSON.parse(item) : { ...DEFAULT_CONFIG };
  }

  saveState(state: typeof DEFAULT_STATE) {
    this.state = state;
    localStorage.setItem('state', JSON.stringify(state));
  }

  loadState() {
    const item = localStorage.getItem('state');
    return item ? JSON.parse(item) : { ...DEFAULT_STATE };
  }

  reset(config?: Partial<typeof DEFAULT_CONFIG>) {
    this.saveConfig({ ...DEFAULT_CONFIG, ...config });
    this.saveState({ ...DEFAULT_STATE, guesses: [], targetWord: null });
    this.init();
  }

  async loadLists() {
    this.list = new Set(wordLists[this.config.language][this.config.size].target);
    this.full = new Set(wordLists[this.config.language][this.config.size].full);
  }

  loadScores() {
    const scores = localStorage.getItem('scores');
    return scores ? JSON.parse(scores) : DEFAULT_SCORES;
  }

  updateScore(won: boolean) {
    const scores = this.loadScores();
    const currentScore = scores[this.config.language][this.config.size];
    if (won) {
      currentScore.streak++;
      currentScore.points += 6 - this.state.guesses.length + 1;
      currentScore.bestStreak = Math.max(currentScore.bestStreak, currentScore.streak);
      currentScore.bestPoints = Math.max(currentScore.bestPoints, currentScore.points);
    } else {
      currentScore.streak = 0;
      currentScore.points = 0;
    }
    this.saveScores(scores);
  }

  saveScores(scores: typeof DEFAULT_SCORES) {
    this.scores = scores;
    localStorage.setItem('scores', JSON.stringify(scores));
  }

  async init() {
    this.config = this.loadConfig();
    this.state = this.loadState();
    this.scores = this.loadScores();
    await this.loadLists();
    if (!this.state.targetWord) {
      const list = Array.from(this.list);
      this.state.targetWord = list[Math.floor(Math.random() * list.length)];
    }
    this.render();
  }

  private renderCurrentScore() {
    const currentScore = this.scores[this.config.language][this.config.size];
    return html`
      <div class="score-display">
        <span aria-label="Current streak">⭐ ${currentScore.streak}</span>
        <span aria-label="Current points">🎲 ${currentScore.points}</span>
        <span aria-label="Current language">${this.config.language === 'nl' ? '🇳🇱' : '🇬🇧'}</span>
      </div>
    `;
  }

  private renderHighScores() {
    const currentScore = this.scores[this.config.language][this.config.size];
    return html`<div class="score-display">
      <span>🏆 Best</span>
      <span aria-label="Best streak">⭐ ${currentScore.bestStreak}</span>
      <span aria-label="Best points">🎲 ${currentScore.bestPoints}</span>
    </div> `;
  }
  private renderControls() {
    return html`
      <button onclick=${() => this.reset(this.config)}>New Game</button>
      <div class="menu-container">
        <button aria-label="Settings" onclick=${() => this.toggleMenu()}>⚙️</button>
        <div class="menu-content hidden">
          <button
            aria-label="Toggle word length"
            onclick=${() => {
              this.reset({ ...this.config, size: this.config.size === 5 ? 6 : 5 });
              this.hideMenu();
            }}
          >
            ${this.config.size === 5 ? '5️⃣' : '6️⃣'}
          </button>
          <button
            aria-label="Toggle language"
            onclick=${() => {
              this.reset({ ...this.config, language: this.config.language === 'nl' ? 'en' : 'nl' });
              this.hideMenu();
            }}
          >
            ${this.config.language === 'nl' ? '🇳🇱' : '🇬🇧'}
          </button>
          <button
            aria-label="Toggle theme"
            onclick=${() => {
              toggleTheme();
              this.hideMenu();
            }}
          >
            ${document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    `;
  }

  private renderGameBoard() {
    return html`
      ${this.state.guesses.map(guess => {
        const tiles = guess.word.split('').map((letter, i) => {
          const tileClass = `tile result-${guess.result[i]}`;
          return html`<div class=${tileClass}>${letter}</div>`;
        });
        return html`<div class="guess-row">${tiles}</div>`;
      })}
      ${this.state.gameState === 'playing' ? this.renderCurrentRow() : ''} ${this.renderEmptyRows()}
    `;
  }

  private renderCurrentRow() {
    if (this.state.gameState !== 'playing') return '';

    return html`
      <div class="guess-row current">
        ${Array(this.config.size)
          .fill(0)
          .map((_, i) => html` <div class="tile">${this.state.currentGuess[i] || ''}</div> `)}
        <input
          type="text"
          maxlength=${this.config.size}
          class="word-input"
          autocomplete="off"
          autocapitalize="off"
          autofocus
          onkeydown=${e => {
            if (e.key === 'Enter' && e.target.value.length === this.config.size) {
              this.state.currentGuess = e.target.value.toLowerCase();
              this.submitGuess();
              if (this.state.currentGuess === '') e.target.value = '';
            } else if (!/^[a-zA-Z]$/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Tab') {
              e.preventDefault();
            }
          }}
        />
      </div>
    `;
  }

  private renderEmptyRows() {
    const remainingRows = ATTEMPTS - this.state.guesses.length - (this.state.gameState === 'playing' ? 1 : 0);

    return html`
      ${Array(remainingRows)
        .fill(0)
        .map(
          () => html`
            <div class="guess-row">
              ${Array(this.config.size)
                .fill(0)
                .map(() => html` <div class="tile"></div> `)}
            </div>
          `,
        )}
    `;
  }

  private renderGameStatus() {
    return html`
      ${this.state.gameState === 'playing' ? this.renderLetters() : ''} ${this.state.gameState === 'won' ? '🎉' : ''}
      ${this.state.gameState === 'lost' ? html`🥹 ${this.state.targetWord}` : ''}
    `;
  }

  private renderLetters() {
    if (this.state.guesses.length === 0) return '';

    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const correct = getCorrectLetters(this.state.guesses);
    const present = getMisplacedLetters(this.state.guesses, correct, false);
    const wrong = getExcludedLetters(this.state.guesses, getLetterSet(correct), getLetterSet(present));

    const getType = (letter: string) =>
      correct.includes(letter)
        ? 'correct'
        : present.includes(letter)
          ? 'present'
          : wrong.has(letter)
            ? 'wrong'
            : 'unknown';

    return html`<output>${letters.map(l => html`<span aria-label="${getType(l)}">${l}</span>`)}</output>`;
  }

  render() {
    document.documentElement.style.setProperty('--word-length', String(this.config.size));

    render(document.getElementById('game-board'), this.renderGameBoard());
    render(document.getElementById('game-status'), this.renderGameStatus());
    render(document.getElementById('game-score'), this.renderCurrentScore());
    render(document.querySelector('.game-controls'), this.renderControls());
    render(document.getElementById('high-scores'), this.renderHighScores());

    document.querySelector('.word-input')?.focus();
  }

  getResultDescription(result) {
    return result === 2 ? 'correct position' : result === 1 ? 'wrong position' : 'not in word';
  }

  submitGuess() {
    if (!this.full.has(this.state.currentGuess) && !this.list.has(this.state.currentGuess)) {
      navigator.vibrate?.(200);
      const tiles = document.querySelectorAll('.guess-row.current .tile');
      tiles.forEach(tile => {
        tile.classList.add('invalid');
        setTimeout(() => tile.classList.remove('invalid'), 600);
      });
      return;
    }

    const result = getGuessResult(this.state.targetWord, this.state.currentGuess);

    this.state.guesses.push({
      word: this.state.currentGuess,
      result: result,
    });

    if (result.every(r => r === 2)) {
      this.state.gameState = 'won';
      this.updateScore(true);
    } else if (this.state.guesses.length >= ATTEMPTS) {
      this.state.gameState = 'lost';
      this.updateScore(false);
    }

    this.state.currentGuess = '';
    this.saveState(this.state);
    this.render();
  }

  hideMenu() {
    document.querySelector('.menu-content').classList.add('hidden');
    document.querySelector('#game-board').classList.remove('faded');
    document.querySelector('#game-status').classList.remove('faded');
  }

  toggleMenu() {
    document.querySelector('.menu-content').classList.toggle('hidden');
    document.querySelector('#game-board').classList.toggle('faded');
    document.querySelector('#game-status').classList.toggle('faded');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const game = new Wooordle();
});
