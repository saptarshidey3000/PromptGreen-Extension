// PromptGreen Popup JavaScript
(function () {
  'use strict';

  const elements = {
    userPrompt: document.getElementById('userPrompt'),
    optimizeBtn: document.getElementById('optimizeBtn'),
    clearBtn: document.getElementById('clearBtn'),
    charCount: document.getElementById('charCount'),
    resultSection: document.getElementById('resultSection'),
    loadingState: document.getElementById('loadingState'),
    errorState: document.getElementById('errorState'),
    errorMessage: document.getElementById('errorMessage'),
    tokensSaved: document.getElementById('tokensSaved'),
    co2Reduced: document.getElementById('co2Reduced'),
    optimizedText: document.getElementById('optimizedText'),
    copyBtn: document.getElementById('copyBtn'),
    useBtn: document.getElementById('useBtn'),
    retryBtn: document.getElementById('retryBtn'),
    totalOptimizations: document.getElementById('totalOptimizations'),
    settingsLink: document.getElementById('settingsLink'),
    helpLink: document.getElementById('helpLink'),
  };

  let currentOptimization = null;
  let totalStats = { optimizations: 0, tokensSaved: 0, co2Reduced: 0 };

  function init() {
    loadStats();
    setupEventListeners();
    updateCharCount();
    elements.userPrompt.focus();
  }

  function setupEventListeners() {
    elements.optimizeBtn.addEventListener('click', handleOptimize);
    elements.clearBtn.addEventListener('click', handleClear);
    elements.retryBtn.addEventListener('click', handleOptimize);
    elements.copyBtn.addEventListener('click', handleCopy);
    elements.useBtn.addEventListener('click', handleUse);
    elements.userPrompt.addEventListener('input', handleTextareaChange);
    elements.userPrompt.addEventListener('keydown', handleKeydown);
    elements.settingsLink.addEventListener('click', () => alert('Settings coming soon!'));
    elements.helpLink.addEventListener('click', () =>
      chrome.tabs.create({ url: 'https://www.instagram.com/p/DLsfacGT8pM/' })
    );
  }

  function handleTextareaChange() {
    updateCharCount();
    updateOptimizeButton();
  }

  function handleKeydown(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handleOptimize();
    }
    if (event.key === 'Escape') {
      handleClear();
    }
  }

  function updateCharCount() {
    const count = elements.userPrompt.value.length;
    elements.charCount.textContent = count;
    elements.charCount.style.color =
      count > 1000 ? '#dc2626' : count > 500 ? '#f59e0b' : '#6b7280';
  }

  function updateOptimizeButton() {
    const hasText = elements.userPrompt.value.trim().length > 0;
    elements.optimizeBtn.disabled = !hasText;
    elements.optimizeBtn.querySelector('.btn-text').textContent = hasText
      ? 'Optimize Prompt'
      : 'Enter text to optimize';
  }

  async function handleOptimize() {
    const prompt = elements.userPrompt.value.trim();

    if (!prompt) return showError('Please enter a prompt to optimize');
    if (prompt.length < 10) return showError('Prompt too short. Minimum 10 characters.');

    showLoading();

    try {
      const result = await optimizePrompt(prompt);
      showResults(result);
      updateStats(result);
      currentOptimization = result;
    } catch (error) {
      console.error('🔴 Optimization failed:', error);
      showError(error.message || 'Failed to optimize prompt. Please try again.');
    }
  }

  async function optimizePrompt(prompt) {
    try {
      const response = await fetch('https://9ec73d7e3f4e.ngrok-free.app/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify({ text: prompt, model_name: "gpt-4" }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errMsg = data?.message || `API Error: ${response.status}`;
        throw new Error(errMsg);
      }

      console.log('✅ API Response:', data);
      const co2SavedPercentage = (((data.co2emission_original - data.co2emission_balanced) / data.co2emission_original) * 100).toFixed(2) + '%';
      const originalWordCount = prompt.trim().split(/\s+/).length;
        const balancedWordCount = data.balanced.trim().split(/\s+/).length;
const tokenSavedPercentage = (
          ((originalWordCount - balancedWordCount) / originalWordCount) * 100
        ).toFixed(2)
      return {
        optimizedPrompt: data.balanced || prompt,
        tokensSaved: tokenSavedPercentage || 0,
        co2Reduced: co2SavedPercentage || 0,
        success: true,
      };
    } catch (error) {
      console.error('❌ API Request Error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      } else if (error.message.includes('fetch')) {
        throw new Error('Network error. Check your internet connection.');
      }
      throw new Error(error.message || 'Something went wrong during optimization');
    }
  }

  function showLoading() {
    hideAllStates();
    elements.loadingState.classList.remove('hidden');
    elements.optimizeBtn.disabled = true;
  }

  function showResults(result) {
    hideAllStates();
    elements.tokensSaved.textContent = result.tokensSaved;
    elements.co2Reduced.textContent = `${result.co2Reduced}g`;
    elements.optimizedText.value = result.optimizedPrompt;
    elements.resultSection.classList.remove('hidden');
    elements.optimizeBtn.disabled = false;
  }

  function showError(message) {
    hideAllStates();
    elements.errorMessage.textContent = message;
    elements.errorState.classList.remove('hidden');
    elements.optimizeBtn.disabled = false;
  }

  function hideAllStates() {
    elements.resultSection.classList.add('hidden');
    elements.loadingState.classList.add('hidden');
    elements.errorState.classList.add('hidden');
  }

  function handleClear() {
    elements.userPrompt.value = '';
    hideAllStates();
    updateCharCount();
    updateOptimizeButton();
    elements.userPrompt.focus();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(elements.optimizedText.value);
      const originalText = elements.copyBtn.querySelector('.btn-text').textContent;
      elements.copyBtn.querySelector('.btn-text').textContent = 'Copied!';
      elements.copyBtn.querySelector('.btn-icon').textContent = '✅';
      setTimeout(() => {
        elements.copyBtn.querySelector('.btn-text').textContent = originalText;
        elements.copyBtn.querySelector('.btn-icon').textContent = '📋';
      }, 2000);
    } catch (err) {
      console.error('Clipboard error:', err);
      showError('Failed to copy to clipboard.');
    }
  }

  function handleUse() {
    elements.userPrompt.value = elements.optimizedText.value;
    updateCharCount();
    hideAllStates();
    const originalText = elements.useBtn.querySelector('.btn-text').textContent;
    elements.useBtn.querySelector('.btn-text').textContent = 'Using!';
    elements.useBtn.querySelector('.btn-icon').textContent = '✅';
    setTimeout(() => {
      elements.useBtn.querySelector('.btn-text').textContent = originalText;
      elements.useBtn.querySelector('.btn-icon').textContent = '📝';
    }, 2000);
  }

  function updateStats(result) {
    totalStats.optimizations++;
    totalStats.tokensSaved += result.tokensSaved;
    totalStats.co2Reduced += result.co2Reduced;
    elements.totalOptimizations.textContent = totalStats.optimizations;
    saveStats();
  }

  function loadStats() {
    chrome.storage.local.get(['promptGreenStats'], (result) => {
      if (result.promptGreenStats) {
        totalStats = result.promptGreenStats;
        elements.totalOptimizations.textContent = totalStats.optimizations;
      }
    });
  }

  function saveStats() {
    chrome.storage.local.set({ promptGreenStats: totalStats });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PromptGreenPopup = {
    elements,
    optimizePrompt,
    totalStats,
  };
})();
