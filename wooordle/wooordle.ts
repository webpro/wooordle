import { getGuessResult } from '../functions/get-guess-result.ts';
import { html, render } from 'uhtml';
import { getCorrectLetters } from '../functions/get-correct-letters.ts';
import { getMisplacedLetters } from '../functions/get-misplaced-letters.ts';
import { getExcludedLetters } from '../functions/get-excluded-letters.ts';
import { getLetterSet } from '../util/get-letter-set.ts';
import wordLists from './words.json';
import labels from './labels.json';
import { findTopWord } from '../functions/find-top-word.ts';
import { findBestWords } from '../strategies/find-best-words.ts';
import { isFinished } from '../functions/is-finished.ts';

const DEFAULT_CONFIG = {
  size: 5,
  language: 'nl',
  keyboard: 'default',
  theme: document.documentElement.getAttribute('data-theme') ?? 'dark',
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
      if (!event.target.closest('#game-controls')) {
        this.hideMenu();
      }
    });

    this.init();
  }

  get lang() {
    return this.config.language;
  }

  saveConfig(config: typeof DEFAULT_CONFIG) {
    this.config = config;
    localStorage.setItem('config', JSON.stringify(config));
  }

  loadConfig() {
    const item = localStorage.getItem('config');
    try {
      return item ? JSON.parse(item) : { ...DEFAULT_CONFIG };
    } catch (e) {
      localStorage.removeItem('config');
      return { ...DEFAULT_CONFIG };
    }
  }

  saveState(state: typeof DEFAULT_STATE) {
    this.state = state;
    localStorage.setItem('state', JSON.stringify(state));
  }

  loadState() {
    const item = localStorage.getItem('state');
    try {
      return item ? JSON.parse(item) : { ...DEFAULT_STATE };
    } catch (e) {
      localStorage.removeItem('state');
      return { ...DEFAULT_STATE };
    }
  }

  set(config: Partial<typeof DEFAULT_CONFIG>) {
    this.saveConfig({ ...this.config, ...config });
  }

  reset(config?: Partial<typeof DEFAULT_CONFIG>) {
    this.saveConfig({ ...DEFAULT_CONFIG, ...config });
    this.saveState({ ...DEFAULT_STATE, guesses: [], targetWord: null });
    this.init();
  }

  async loadLists() {
    this.list = new Set(wordLists[this.lang][this.config.size].target);
    this.full = new Set(wordLists[this.lang][this.config.size].full);
  }

  loadScores() {
    const scores = localStorage.getItem('scores');
    try {
      return scores ? JSON.parse(scores) : DEFAULT_SCORES;
    } catch (e) {
      localStorage.removeItem('scores');
      return DEFAULT_SCORES;
    }
  }

  updateScore(won: boolean) {
    const scores = this.loadScores();
    const currentScore = scores[this.lang][this.config.size];
    if (won) {
      currentScore.streak++;
      currentScore.points += 7 - this.state.guesses.length;
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
    const currentScore = this.scores[this.lang][this.config.size];
    return html`
      <div class="score-display">
        <span aria-label="${labels[this.lang]['current-streak']}">⭐ ${currentScore.streak}</span>
        <span aria-label="${labels[this.lang]['current-points']}">🎲 ${currentScore.points}</span>
        <span aria-label="${labels[this.lang]['current-language']}">${this.lang === 'nl' ? '🇳🇱' : '🇬🇧'}</span>
      </div>
    `;
  }

  private renderHighScores() {
    const currentScore = this.scores[this.lang][this.config.size];
    return html`<div class="score-display">
      <span>🏆 ${labels[this.lang].best}</span>
      <span aria-label="${labels[this.lang]['best-streak']}">⭐ ${currentScore.bestStreak}</span>
      <span aria-label="${labels[this.lang]['best-points']}">🎲 ${currentScore.bestPoints}</span>
    </div> `;
  }
  private renderControls() {
    return html`
      <button onclick=${() => this.reset(this.config)}>${labels[this.lang]['new-game']}</button>

      <button aria-label="${labels[this.lang]['settings']}" onclick=${() => this.toggleMenu()}>⚙️</button>
      <div class="menu-content hidden">
        <button
          onclick=${() => {
            this.reset({ ...this.config, language: this.lang === 'nl' ? 'en' : 'nl' });
            this.hideMenu();
          }}
        >
          <span>${labels[this.lang][this.lang === 'nl' ? 'switch-en' : 'switch-nl']}</span>
          <span>${this.lang === 'nl' ? '🇬🇧' : '🇳🇱'}</span>
        </button>
        <button
          onclick=${() => {
            this.reset({ ...this.config, size: this.config.size === 5 ? 6 : 5 });
            this.hideMenu();
          }}
        >
          <span>${labels[this.lang][this.config.size === 5 ? 'switch-6' : 'switch-5']}</span>
          <span>${this.config.size === 5 ? '6️⃣' : '5️⃣'}</span>
        </button>
        <button
          onclick=${() => {
            this.set({ keyboard: this.config.keyboard === 'qwerty' ? 'default' : 'qwerty' });
            this.hideMenu();
            this.render();
          }}
        >
          <span> ${labels[this.lang][this.config.keyboard === 'qwerty' ? 'switch-az' : 'switch-qwerty']} </span>
          <span>⌨️</span>
        </button>
        <button
          onclick=${() => {
            toggleTheme();
            this.set({ theme: this.config.theme === 'dark' ? 'light' : 'dark' });
            this.hideMenu();
            this.render();
          }}
        >
          <span> ${labels[this.lang][this.config.theme === 'dark' ? 'switch-light' : 'switch-dark']} </span>
          <span>${this.config.theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>
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
          .map((_, i) => html`<div class="tile">${this.state.currentGuess[i] || ''}</div>`)}
        <input
          type="text"
          maxlength=${this.config.size}
          class="word-input"
          autocomplete="off"
          autocapitalize="off"
          autofocus
          onkeydown=${event => {
            if (event.key === 'Enter' && event.target.value.length === this.config.size) {
              this.state.currentGuess = event.target.value.toLowerCase();
              this.submitGuess();
              if (this.state.currentGuess === '') event.target.value = '';
            } else if (!/^[a-zA-Z]$/.test(event.key) && event.key !== 'Backspace' && event.key !== 'Tab') {
              event.preventDefault();
            }
          }}
        />
      </div>
    `;
  }

  private renderEmptyRows() {
    const remainingRows = ATTEMPTS - this.state.guesses.length - (this.state.gameState === 'playing' ? 1 : 0);

    const rows = Array(remainingRows).fill(0);
    const tiles = Array(this.config.size).fill(0);

    return html`
      ${rows.map(() => html`<div class="guess-row">${tiles.map(() => html`<div class="tile"></div>`)}</div>`)}
    `;
  }

  private renderGameStatus() {
    return html`
      ${this.state.gameState === 'playing' ? this.renderLetters() : ''} ${this.state.gameState === 'won' ? '🎉' : ''}
      ${this.state.gameState === 'lost' ? html`🥹 ${this.state.targetWord}` : ''}
    `;
  }

  private renderLetters() {
    if (this.state.gameState !== 'playing') return '';

    const correct = getCorrectLetters(this.state.guesses);
    const present = getMisplacedLetters(this.state.guesses, correct, false);
    const wrong = getExcludedLetters(this.state.guesses, getLetterSet(correct), getLetterSet(present));

    const getType = (letter: string) =>
      correct.includes(letter)
        ? 'correct'
        : present.includes(letter)
          ? 'present'
          : wrong.has(letter)
            ? 'absent'
            : 'unknown';

    const keyboardLayouts = {
      default: ['abcdefghijklm', 'nopqrstuvwxyz'],
      qwerty: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'],
    };

    const layout: string[] = keyboardLayouts[this.config.keyboard ?? DEFAULT_CONFIG.keyboard];

    const className = `keyboard-${this.config.keyboard ?? DEFAULT_CONFIG.keyboard}`;

    return html`
      <output class=${className}>
        ${layout.map(
          row => html`
            <div class="keyboard-row">
              ${row.split('').map(letter => html`<span aria-label="${getType(letter)}">${letter}</span>`)}
            </div>
          `,
        )}
      </output>
    `;
  }

  render() {
    document.documentElement.style.setProperty('--word-length', String(this.config.size));

    render(document.getElementById('game-board'), this.renderGameBoard());
    render(document.getElementById('game-status'), this.renderGameStatus());
    render(document.getElementById('game-score'), this.renderCurrentScore());
    render(document.getElementById('game-controls'), this.renderControls());
    render(document.getElementById('high-scores'), this.renderHighScores());

    document.querySelector('.word-input')?.focus();

    if (import.meta.env.DEV && !isFinished(this.state.guesses)) {
      const guesses = this.state.guesses;
      const hints = guesses.length === 0 ? [findTopWord(this.list)] : findBestWords(this.list, this.full, guesses);
      console.log(`hint: ${hints.slice(0, 5).join(', ')}`);
    }
  }

  getResultDescription(result) {
    return result === 2 ? 'correct position' : result === 1 ? 'wrong position' : 'not in word';
  }

  submitGuess() {
    if (!this.full.has(this.state.currentGuess) && !this.list.has(this.state.currentGuess)) {
      navigator.vibrate?.(200);
      const input = document.querySelector('.word-input');
      input.classList.add('invalid');
      input.addEventListener('animationend', () => input.classList.remove('invalid'), { once: true });
      return;
    }

    const result = getGuessResult(this.state.targetWord, this.state.currentGuess);

    this.state.guesses.push({
      word: this.state.currentGuess,
      result: result,
    });

    if (isFinished(this.state.guesses)) {
      this.state.gameState = 'won';
      this.updateScore(true);
    } else if (this.state.guesses.length >= ATTEMPTS) {
      this.state.gameState = 'lost';
      this.updateScore(false);
    }

    this.state.currentGuess = '';
    this.saveState(this.state);
    this.render();

    if (isFinished(this.state.guesses)) {
      document.querySelectorAll('.tile.result-2').forEach(tile => tile.classList.add('victory'));
    }
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
