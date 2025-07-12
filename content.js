// PromptGreen Content Script - Injects optimization button into webpages
(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    checkInterval: 2000, // Check for textareas every 2 seconds
    buttonId: 'promptgreen-btn',
    minTextareaHeight: 50, // Minimum height to show button
    debounceDelay: 300
  };

  let isProcessing = false;
  let checkInterval;

  // Initialize the content script
  function init() {
    console.log('PromptGreen: Content script initialized');
    
    // Start checking for textareas
    checkInterval = setInterval(checkForTextareas, CONFIG.checkInterval);
    
    // Also check immediately
    checkForTextareas();
    
    // Clean up when page unloads
    window.addEventListener('beforeunload', cleanup);
  }

  /**
   * Check for textareas on the page and add optimize buttons
   */
  function checkForTextareas() {
    const textareas = document.querySelectorAll('textarea');
    
    textareas.forEach(textarea => {
      if (shouldAddButton(textarea)) {
        addOptimizeButton(textarea);
      }
    });
  }

  /**
   * Determine if we should add a button to this textarea
   */
  function shouldAddButton(textarea) {
    // Skip if button already exists
    if (textarea.dataset.promptgreenProcessed) {
      return false;
    }

    // Skip if textarea is too small
    const rect = textarea.getBoundingClientRect();
    if (rect.height < CONFIG.minTextareaHeight) {
      return false;
    }

    // Skip if textarea is hidden
    if (textarea.offsetParent === null) {
      return false;
    }

    // Skip if textarea is read-only or disabled
    if (textarea.readOnly || textarea.disabled) {
      return false;
    }

    return true;
  }

  /**
   * Add optimize button to a textarea
   */
  function addOptimizeButton(textarea) {
    // Mark as processed
    textarea.dataset.promptgreenProcessed = 'true';

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'promptgreen-button-container';
    buttonContainer.style.cssText = `
      position: relative;
      display: inline-block;
      margin-top: 8px;
    `;

    // Create the optimize button
    const button = document.createElement('button');
    button.id = CONFIG.buttonId + '-' + Date.now();
    button.innerHTML = '🌱 Optimize';
    button.className = 'promptgreen-optimize-btn';
    button.style.cssText = `
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      transition: all 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      position: relative;
    `;

    // Add hover effects
    button.addEventListener('mouseenter', () => {
      if (!button.disabled) {
        button.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
        button.style.transform = 'translateY(-1px)';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
      }
    });

    button.addEventListener('mouseleave', () => {
      if (!button.disabled) {
        button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        button.style.transform = 'translateY(0)';
        button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      }
    });

    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleOptimizeClick(textarea, button);
    });

    // Add button to container
    buttonContainer.appendChild(button);

    // Insert button after textarea
    textarea.parentElement.insertBefore(buttonContainer, textarea.nextSibling);

    console.log('PromptGreen: Button added to textarea');
  }

  /**
   * Handle optimize button click
   */
  async function handleOptimizeClick(textarea, button) {
    const prompt = textarea.value.trim();

    if (!prompt) {
      showNotification('Please enter some text to optimize', 'warning');
      return;
    }

    if (isProcessing) {
      return;
    }

    isProcessing = true;
    setButtonLoading(button, true);

    try {
      // Call the API directly with your endpoint
      const result = await optimizePromptAPI(prompt);
      
      // Update textarea with optimized prompt
      textarea.value = result.optimizedPrompt;
      
      // Trigger input event to notify the website
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Show success notification
      showNotification(
        `Prompt optimized! Saved ${result.tokensSaved} tokens and ${result.co2Reduced}g CO₂`,
        'success'
      );

    } catch (error) {
      console.error('PromptGreen: Optimization failed:', error);
      showNotification(`Optimization failed: ${error.message}`, 'error');
    } finally {
      isProcessing = false;
      setButtonLoading(button, false);
    }
  }

  /**
   * API call function for content script
   */
  async function optimizePromptAPI(prompt) {
    try {
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

  /**
   * Set button loading state
   */
  function setButtonLoading(button, isLoading) {
    if (isLoading) {
      button.disabled = true;
      button.innerHTML = '⏳ Optimizing...';
      button.style.background = '#d1d5db';
      button.style.cursor = 'not-allowed';
    } else {
      button.disabled = false;
      button.innerHTML = '🌱 Optimize';
      button.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      button.style.cursor = 'pointer';
    }
  }

  /**
   * Show notification to user
   */
  function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.promptgreen-notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'promptgreen-notification';
    notification.textContent = message;
    
    // Set styles based on type
    const colors = {
      success: { bg: '#d1fae5', border: '#a7f3d0', text: '#047857' },
      error: { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
      warning: { bg: '#fef3c7', border: '#fcd34d', text: '#d97706' },
      info: { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' }
    };

    const color = colors[type] || colors.info;
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${color.bg};
      color: ${color.text};
      border: 2px solid ${color.border};
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 350px;
      word-wrap: break-word;
      animation: slideIn 0.3s ease;
    `;

    // Add CSS animation keyframes
    if (!document.querySelector('#promptgreen-styles')) {
      const style = document.createElement('style');
      style.id = 'promptgreen-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // Add notification to page
    document.body.appendChild(notification);

    // Remove notification after 4 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 4000);
  }

  /**
   * Cleanup function
   */
  function cleanup() {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();