// PromptGreen Content Script - Enhancing textareas with an Optimize button
(function () {
  'use strict';

  const CONFIG = {
    checkInterval: 2000,
    buttonClass: 'promptgreen-optimize-btn',
    minTextareaHeight: 50,
    notificationDuration: 4000,
  };

  let isProcessing = false;
  let observer;

  // Run initialization
  function init() {
    console.log('✅ PromptGreen Content Script Initialized');
    injectButtonsIntoTextareas();
    observeDOMChanges();
  }

  // Observe dynamic content changes for SPAs
  function observeDOMChanges() {
    observer = new MutationObserver(() => {
      injectButtonsIntoTextareas();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Scan all eligible textareas
  function injectButtonsIntoTextareas() {
    document.querySelectorAll('textarea:not([data-promptgreen-attached])').forEach(textarea => {
      const rect = textarea.getBoundingClientRect();

      if (rect.height >= CONFIG.minTextareaHeight && !textarea.disabled && !textarea.readOnly && textarea.offsetParent) {
        addButtonBelowTextarea(textarea);
      }
    });
  }

  // Add Optimize button below a textarea
  function addButtonBelowTextarea(textarea) {
    textarea.dataset.promptgreenAttached = 'true';

    const wrapper = document.createElement('div');
    wrapper.className = 'promptgreen-button-wrapper';
    wrapper.style.marginTop = '8px';

    const button = document.createElement('button');
    button.className = CONFIG.buttonClass;
    button.textContent = '🌱 Optimize';
    Object.assign(button.style, {
      background: 'linear-gradient(135deg, #10b981, #059669)',
      color: '#fff',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '13px',
      fontWeight: '500',
      fontFamily: 'inherit',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    });

    button.onclick = async (e) => {
      e.preventDefault();
      await handleOptimize(textarea, button);
    };

    wrapper.appendChild(button);
    textarea.insertAdjacentElement('afterend', wrapper);
  }

  // Optimization handler
  async function handleOptimize(textarea, button) {
    const prompt = textarea.value.trim();

    if (!prompt) return showToast('⚠️ Please enter some text', 'warning');
    if (isProcessing) return;

    isProcessing = true;
    setButtonLoading(button, true);

    try {
      const { optimizedPrompt, tokensSaved, co2Reduced } = await fetchOptimizedPrompt(prompt);

      textarea.value = optimizedPrompt;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      showToast(`✅ Saved ${tokensSaved} tokens, ${co2Reduced}g CO₂`, 'success');
    } catch (err) {
      console.error('Optimize error:', err);
      showToast(`❌ ${err.message}`, 'error');
    } finally {
      isProcessing = false;
      setButtonLoading(button, false);
    }
  }

  // API call
  async function fetchOptimizedPrompt(prompt) {
    const response = await fetch('https://9ec73d7e3f4e.ngrok-free.app/optimize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) throw new Error(`API Error ${response.status}`);

    const data = await response.json();
    return {
      optimizedPrompt: data.optimizedPrompt || prompt,
      tokensSaved: data.tokensSaved || 0,
      co2Reduced: data.co2Reduced || 0,
    };
  }

  // Button loading UI
  function setButtonLoading(button, loading) {
    button.disabled = loading;
    button.textContent = loading ? '⏳ Optimizing...' : '🌱 Optimize';
    button.style.opacity = loading ? '0.7' : '1';
  }

  // Toast notification
  function showToast(msg, type = 'info') {
    const existing = document.querySelector('.promptgreen-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'promptgreen-toast';
    toast.textContent = msg;

    const styles = {
      success: { bg: '#d1fae5', color: '#047857' },
      error: { bg: '#fee2e2', color: '#b91c1c' },
      warning: { bg: '#fef9c3', color: '#92400e' },
      info: { bg: '#e0f2fe', color: '#0369a1' },
    };

    const style = styles[type] || styles.info;

    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      padding: '12px 20px',
      background: style.bg,
      color: style.color,
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '8px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    });

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, CONFIG.notificationDuration);
  }

  // Init after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.PromptGreenContent = { init };

})();
