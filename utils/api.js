// API configuration
const API_CONFIG = {
  baseURL: "https://9ec73d7e3f4e.ngrok-free.app//optimize", // Your actual API URL
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
    // Add ngrok-specific headers if needed
    "ngrok-skip-browser-warning": "true"
  }
};

/**
 * Makes an API request to optimize a prompt
 * @param {string} prompt - The user's input prompt
 * @returns {Promise<Object>} - The API response with optimized prompt and metrics
 */
async function optimizePrompt(prompt) {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error("Prompt cannot be empty");
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    const response = await fetch(`${API_CONFIG.baseURL}/optimize`, {
      method: "POST",
      headers: API_CONFIG.headers,
      body: JSON.stringify({ prompt: prompt.trim() }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Validate response data
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid API response format");
    }

    return {
      optimizedPrompt: data.optimizedPrompt || prompt,
      tokensSaved: data.tokensSaved || 0,
      co2Reduced: data.co2Reduced || 0,
      success: true
    };

  } catch (error) {
    console.error("API Request Error:", error);
    
    // Handle different error types
    if (error.name === 'AbortError') {
      throw new Error("Request timed out. Please try again.");
    } else if (error.message.includes('fetch')) {
      throw new Error("Network error. Please check your connection.");
    } else {
      throw new Error(error.message || "Failed to optimize prompt");
    }
  }
}

/**
 * Test API connection
 * @returns {Promise<boolean>} - Whether API is accessible
 */
async function testAPIConnection() {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/health`, {
      method: "GET",
      headers: API_CONFIG.headers
    });
    return response.ok;
  } catch (error) {
    console.error("API Connection Test Failed:", error);
    return false;
  }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = { optimizePrompt, testAPIConnection };
} else {
  // Browser environment - make functions globally available
  window.PromptGreenAPI = { optimizePrompt, testAPIConnection };
}