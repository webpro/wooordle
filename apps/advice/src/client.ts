import type { AnalysisResult } from '@wooordle/ocr';
import type { ApiResponse } from './types.ts';
import './styles.css';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('fileInput') as HTMLInputElement;
  const uploadArea = document.getElementById('uploadArea') as HTMLElement;
  const loadingOverlay = document.getElementById('loadingOverlay') as HTMLElement;
  const analysisResults = document.getElementById('analysisResults') as HTMLElement;
  const imagePreview = document.getElementById('imagePreview') as HTMLElement;

  fileInput.addEventListener('change', () => handleFile(fileInput.files?.[0]));
  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });
  uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFile(e.dataTransfer?.files[0]);
  });

  document.addEventListener('paste', e => {
    const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'));
    if (item) handleFile(item.getAsFile());
  });

  function handleFile(file?: File | null) {
    if (file?.type.startsWith('image/')) {
      showImagePreview(file);
      analyzeImage(file);
    }
  }

  function showImagePreview(file: File) {
    const reader = new FileReader();
    reader.onload = e => {
      const imageSrc = e.target?.result as string;
      imagePreview.innerHTML = `<img src="${imageSrc}" alt="Upload preview" />`;
      imagePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  async function analyzeImage(file: File) {
    loadingOverlay.classList.remove('hidden');
    analysisResults.innerHTML = '';

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/advice', { method: 'POST', body: formData });

      if (!response.ok) throw new Error(response.statusText);

      const result: ApiResponse = await response.json();

      if (result.analysisResult) displayResults(result.analysisResult);
      else showError(`Analysis failed: ${result.error || 'Unknown error'}`);
    } catch (error) {
      showError(`Request failed: ${(error as Error).message}`);
    } finally {
      loadingOverlay.classList.add('hidden');
    }
  }

  function displayResults(analysis: AnalysisResult) {
    const wordLength = analysis.wordLength || 5;
    let recommendations = '';

    if (analysis.bestWords) {
      recommendations = `
        <div class="recommendations-list${analysis.detectedLanguages.length > 1 ? ' dual-language' : ''}">
          ${analysis.detectedLanguages
            .map(lang => {
              const words = analysis.bestWords[lang] || [];
              return `
                <div class="language-column">
                  <div class="language-column-header">
                    <span class="language-flag">${lang === 'nl' ? '🇳🇱' : '🇬🇧'}</span>
                    <span>${lang === 'nl' ? 'Dutch' : 'English'}</span>
                  </div>
                  <div class="language-words">
                    ${words
                      .slice(0, 6)
                      .map(word => `<div class="recommendation-word ${lang}">${word.toUpperCase()}</div>`)
                      .join('')}
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>
      `;
    }

    const createTile = (guess, letter, i) =>
      `<div class="wordle-tile ${
        guess.result[i] === 2 ? 'correct' : guess.result[i] === 1 ? 'present' : 'absent'
      }">${letter.toUpperCase()}</div>`;

    const guesses = analysis.guesses.map(
      guess => `<div class="guess-row">
                  ${guess.word
                    .split('')
                    .map((letter, i) => createTile(guess, letter, i))
                    .join('')}
                </div>`,
    );

    const resultsHTML = `
      <div class="analysis-complete">
        <div class="detected-guesses">
          <div class="wordle-grid" style="--word-length: ${wordLength};">
            ${guesses.join('')}
          </div>
        </div>

        <div class="word-recommendations">
          <h3>Best next words</h3>
          ${recommendations}
        </div>
      </div>
    `;

    analysisResults.innerHTML = resultsHTML;
  }

  function showError(message: string) {
    analysisResults.innerHTML = `
      <div class="empty-state">
          <h3>Analysis Failed</h3>
          <p>${message}</p>
      </div>
    `;
  }
});
