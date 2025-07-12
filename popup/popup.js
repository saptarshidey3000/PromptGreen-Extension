// PromptGreen Popup JavaScript
(function() {
    'use strict';

    // DOM Elements
    const elements = {
        userPrompt: document.getElementById('userPrompt'),
        optimizeBtn: document.getElementById('optimizeBtn'),
        clearBtn: document.getElementById('clearBtn'),
        charCount: document.getElementById('charCount'),
        resultSection: document.getElementById('resultSection'),
        loadingState: document.getElementById('loadingState'),
        errorState: document.getElementById('errorState'),
        tokensSaved: document.getElementById('tokensSaved'),
        co2Reduced: document.getElementById('co2Reduced'),
        optimizedText: document.getElementById('optimizedText'),
        copyBtn: document.getElementById('copyBtn'),
        useBtn: document.getElementById('useBtn'),
        retryBtn: document.getElementById('retryBtn'),
        errorMessage: document.getElementById('errorMessage'),
        totalOptimizations: document.getElementById('totalOptimizations'),
        settingsLink: document.getElementById('settingsLink'),
        helpLink: document.getElementById('helpLink')
    };

    // State
    let currentOptimization = null;
    let totalStats = { optimizations: 0, tokensSaved: 0, co2Reduced: 0 };

    // Initialize popup
    function init() {
        console.log('PromptGreen Popup: Initializing...');
        
        // Load saved stats
        loadStats();
        
        // Set up event listeners
        setupEventListeners();
        
        // Update character count
        updateCharCount();
        
        // Focus on textarea
        elements.userPrompt.focus();
        
        console.log('PromptGreen Popup: Initialized successfully');
    }

    // Set up all event listeners
    function setupEventListeners() {
        // Main buttons
        elements.optimizeBtn.addEventListener('click', handleOptimize);
        elements.clearBtn.addEventListener('click', handleClear);
        elements.retryBtn.addEventListener('click', handleOptimize);
        
        // Result actions
        elements.copyBtn.addEventListener('click', handleCopy);
        elements.useBtn.addEventListener('click', handleUse);
        
        // Textarea events
        elements.userPrompt.addEventListener('input', handleTextareaChange);
        elements.userPrompt.addEventListener('keydown', handleKeydown);
        
        // Footer links
        elements.settingsLink.addEventListener('click', handleSettings);
        elements.helpLink.addEventListener('click', handleHelp);
    }

    // Handle textarea input changes
    function handleTextareaChange() {
        updateCharCount();
        updateOptimizeButton();
    }

    // Handle keyboard shortcuts
    function handleKeydown(event) {
        // Ctrl/Cmd + Enter to optimize
        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            handleOptimize();
        }
        
        // Escape to clear
        if (event.key === 'Escape') {
            handleClear();
        }
    }

    // Update character count display
    function updateCharCount() {
        const count = elements.userPrompt.value.length;
        elements.charCount.textContent = count;
        
        // Color coding
        if (count > 1000) {
            elements.charCount.style.color = '#dc2626';
        } else if (count > 500) {
            elements.charCount.style.color = '#f59e0b';
        } else {
            elements.charCount.style.color = '#6b7280';
        }
    }

    // Update optimize button state
    function updateOptimizeButton() {
        const hasText = elements.userPrompt.value.trim().length > 0;
        elements.optimizeBtn.disabled = !hasText;
        
        if (hasText) {
            elements.optimizeBtn.querySelector('.btn-text').textContent = 'Optimize Prompt';
        } else {
            elements.optimizeBtn.querySelector('.btn-text').textContent = 'Enter text to optimize';
        }
    }

    // Handle optimize button click
    async function handleOptimize() {
        const prompt = elements.userPrompt.value.trim();
        
        if (!prompt) {
            showError('Please enter a prompt to optimize');
            return;
        }

        if (prompt.length < 10) {
            showError('Prompt too short. Please enter at least 10 characters.');
            return;
        }

        // Show loading state
        showLoading();
        
        try {
            // Call the API
            const result = await optimizePrompt(prompt);
            
            // Show results
            showResults(result);
            
            // Update stats
            updateStats(result);
            
            // Store current optimization
            currentOptimization = result;
            
        } catch (error) {
            console.error('Optimization failed:', error);
            showError(error.message || 'Failed to optimize prompt. Please try again.');
        }
    }

    // API call function
    async function optimizePrompt(prompt) {
        try {
            // Using the same API endpoint as content script
            const response = await fetch('https://7d1538468f2e.ngrok-free.app/optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({ prompt: prompt.trim() })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            return {
                optimizedPrompt: data.optimizedPrompt || prompt,
                tokensSaved: data.tokensSaved || 0,
                co2Reduced: data.co2Reduced || 0,
                success: true
            };
        } catch (error) {
            console.error('API Request Error:', error);
            throw new Error(error.message || 'Failed to optimize prompt');
        }
    }

    // Show loading state
    function showLoading() {
        hideAllStates();
        elements.loadingState.classList.remove('hidden');
        elements.optimizeBtn.disabled = true;
    }

    // Show results
    function showResults(result) {
        hideAllStates();
        
        // Update metrics
        elements.tokensSaved.textContent = result.tokensSaved || 0;
        elements.co2Reduced.textContent = `${result.co2Reduced || 0}g`;
        
        // Update optimized text
        elements.optimizedText.value = result.optimizedPrompt;
        
        // Show results section
        elements.resultSection.classList.remove('hidden');
        elements.optimizeBtn.disabled = false;
    }

    // Show error state
    function showError(message) {
        hideAllStates();
        elements.errorMessage.textContent = message;
        elements.errorState.classList.remove('hidden');
        elements.optimizeBtn.disabled = false;
    }

    // Hide all state sections
    function hideAllStates() {
        elements.resultSection.classList.add('hidden');
        elements.loadingState.classList.add('hidden');
        elements.errorState.classList.add('hidden');
    }

    // Handle clear button
    function handleClear() {
        elements.userPrompt.value = '';
        hideAllStates();
        updateCharCount();
        updateOptimizeButton();
        elements.userPrompt.focus();
    }

    // Handle copy button
    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(elements.optimizedText.value);
            
            // Visual feedback
            const originalText = elements.copyBtn.querySelector('.btn-text').textContent;
            elements.copyBtn.querySelector('.btn-text').textContent = 'Copied!';
            elements.copyBtn.querySelector('.btn-icon').textContent = '✅';
            
            setTimeout(() => {
                elements.copyBtn.querySelector('.btn-text').textContent = originalText;
                elements.copyBtn.querySelector('.btn-icon').textContent = '📋';
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy:', error);
            showError('Failed to copy to clipboard');
        }
    }

    // Handle use button
    function handleUse() {
        // Replace original text with optimized version
        elements.userPrompt.value = elements.optimizedText.value;
        updateCharCount();
        hideAllStates();
        
        // Visual feedback
        const originalText = elements.useBtn.querySelector('.btn-text').textContent;
        elements.useBtn.querySelector('.btn-text').textContent = 'Using!';
        elements.useBtn.querySelector('.btn-icon').textContent = '✅';
        
        setTimeout(() => {
            elements.useBtn.querySelector('.btn-text').textContent = originalText;
            elements.useBtn.querySelector('.btn-icon').textContent = '📝';
        }, 2000);
    }

    // Update and save stats
    function updateStats(result) {
        totalStats.optimizations++;
        totalStats.tokensSaved += result.tokensSaved || 0;
        totalStats.co2Reduced += result.co2Reduced || 0;
        
        elements.totalOptimizations.textContent = totalStats.optimizations;
        
        // Save to Chrome storage
        saveStats();
    }

    // Load stats from Chrome storage
    function loadStats() {
        chrome.storage.local.get(['promptGreenStats'], (result) => {
            if (result.promptGreenStats) {
                totalStats = result.promptGreenStats;
                elements.totalOptimizations.textContent = totalStats.optimizations;
            }
        });
    }

    // Save stats to Chrome storage
    function saveStats() {
        chrome.storage.local.set({ promptGreenStats: totalStats });
    }

    // Handle settings link
    function handleSettings() {
        // For now, just show an alert
        alert('Settings feature coming soon!');
    }

    // Handle help link
    function handleHelp() {
        // Open help page in new tab
        chrome.tabs.create({ url: 'https://github.com/your-username/promptgreen' });
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Export for debugging
    window.PromptGreenPopup = {
        elements,
        optimizePrompt,
        totalStats
    };
})();