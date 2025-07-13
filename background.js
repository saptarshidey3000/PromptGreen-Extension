// PromptGreen Background Service Worker
// This runs in the background and handles extension lifecycle events

const EXTENSION_CONFIG = {
    version: '1.0.0',
    apiBaseUrl: 'https://9ec73d7e3f4e.ngrok-free.app//optimize',
    maxRetries: 3,
    retryDelay: 1000
};

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
    console.log('PromptGreen: Extension installed/updated', details);
    
    if (details.reason === 'install') {
        handleFirstInstall();
    } else if (details.reason === 'update') {
        handleExtensionUpdate(details.previousVersion);
    }
});

// Handle first installation
function handleFirstInstall() {
    console.log('PromptGreen: First installation detected');
    
    // Initialize storage with default values
    chrome.storage.local.set({
        promptGreenStats: {
            optimizations: 0,
            tokensSaved: 0,
            co2Reduced: 0,
            installDate: new Date().toISOString()
        },
        promptGreenSettings: {
            enabled: true,
            showNotifications: true,
            autoOptimize: false,
            theme: 'auto'
        }
    });
    
    // Show welcome notification
    showWelcomeNotification();
}

// Handle extension updates
function handleExtensionUpdate(previousVersion) {
    console.log(`PromptGreen: Updated from ${previousVersion} to ${EXTENSION_CONFIG.version}`);
    
    // Migrate settings if needed
    migrateSettings(previousVersion);
    
    // Show update notification
    showUpdateNotification(previousVersion);
}

// Show welcome notification
function showWelcomeNotification() {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/pgextensionlogo.png',
        title: '🌱 PromptGreen Installed!',
        message: 'Start optimizing your AI prompts to save tokens and reduce CO₂ emissions.'
    });
}

// Show update notification
function showUpdateNotification(previousVersion) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/pgextensionlogo.png',
        title: '🌱 PromptGreen Updated!',
        message: `Updated to v${EXTENSION_CONFIG.version}. New features and improvements included.`
    });
}

// Migrate settings from previous versions
function migrateSettings(previousVersion) {
    // Add migration logic here as needed
    console.log('PromptGreen: Settings migration completed');
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('PromptGreen: Message received', request);
    
    switch (request.action) {
        case 'optimize':
            handleOptimizeRequest(request.data, sender, sendResponse);
            return true; // Keep the message channel open for async response
            
        case 'getStats':
            handleGetStats(sendResponse);
            return true;
            
        case 'updateStats':
            handleUpdateStats(request.data, sendResponse);
            return true;
            
        case 'checkApiStatus':
            handleCheckApiStatus(sendResponse);
            return true;
            
        case 'openOptionsPage':
            chrome.runtime.openOptionsPage();
            sendResponse({ success: true });
            return true;
            
        default:
            console.warn('PromptGreen: Unknown message action:', request.action);
            sendResponse({ error: 'Unknown action' });
            return true;
    }
});

// Handle optimize request from content script
async function handleOptimizeRequest(data, sender, sendResponse) {
    try {
        const result = await optimizePromptAPI(data.prompt);
        
        // Update stats
        await updateStatsInStorage(result);
        
        sendResponse({ 
            success: true, 
            data: result 
        });
    } catch (error) {
        console.error('PromptGreen: Optimization failed in background script:', error);
        sendResponse({ 
            success: false, 
            error: error.message 
        });
    }
}

// Handle get stats request
function handleGetStats(sendResponse) {
    chrome.storage.local.get(['promptGreenStats'], (result) => {
        sendResponse({ 
            success: true, 
            data: result.promptGreenStats || getDefaultStats() 
        });
    });
}

// Handle update stats request
function handleUpdateStats(data, sendResponse) {
    updateStatsInStorage(data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
}

// Handle API status check
async function handleCheckApiStatus(sendResponse) {
    try {
        const isOnline = await checkApiStatus();
        sendResponse({ 
            success: true, 
            data: { isOnline } 
        });
    } catch (error) {
        sendResponse({ 
            success: false, 
            error: error.message 
        });
    }
}

// API optimization function
async function optimizePromptAPI(prompt) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        throw new Error('Invalid prompt provided');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(`${EXTENSION_CONFIG.apiBaseUrl}/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ prompt: prompt.trim() }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            optimizedPrompt: data.optimizedPrompt || prompt,
            tokensSaved: data.tokensSaved || 0,
            co2Reduced: data.co2Reduced || 0,
            success: true,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
        }
        
        throw new Error(error.message || 'Failed to optimize prompt');
    }
}

// Check API status
async function checkApiStatus() {
    try {
        const response = await fetch(`${EXTENSION_CONFIG.apiBaseUrl}/health`, {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true'
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('PromptGreen: API status check failed:', error);
        return false;
    }
}

// Update stats in storage
async function updateStatsInStorage(optimizationResult) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['promptGreenStats'], (result) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            
            const stats = result.promptGreenStats || getDefaultStats();
            
            stats.optimizations++;
            stats.tokensSaved += optimizationResult.tokensSaved || 0;
            stats.co2Reduced += optimizationResult.co2Reduced || 0;
            stats.lastOptimization = new Date().toISOString();
            
            chrome.storage.local.set({ promptGreenStats: stats }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(stats);
                }
            });
        });
    });
}

// Get default stats object
function getDefaultStats() {
    return {
        optimizations: 0,
        tokensSaved: 0,
        co2Reduced: 0,
        installDate: new Date().toISOString(),
        lastOptimization: null
    };
}

// Handle browser action click (if no popup is set)
chrome.action.onClicked.addListener((tab) => {
    console.log('PromptGreen: Extension icon clicked');
    // This will open the popup automatically due to manifest configuration
});

// Handle context menu creation
chrome.runtime.onInstalled.addListener(() => {
    // Create context menu for text selection
    chrome.contextMenus.create({
        id: 'promptgreen-optimize',
        title: '🌱 Optimize with PromptGreen',
        contexts: ['selection']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'promptgreen-optimize') {
        // Send message to content script to optimize selected text
        chrome.tabs.sendMessage(tab.id, {
            action: 'optimizeSelection',
            text: info.selectionText
        });
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('PromptGreen: Extension started');
    
    // Check API status on startup
    checkApiStatus().then(isOnline => {
        console.log('PromptGreen: API status on startup:', isOnline ? 'Online' : 'Offline');
        
        if (!isOnline) {
            console.warn('PromptGreen: API is not accessible on startup');
        }
    });
});

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        // Content script is automatically injected via manifest
        console.log('PromptGreen: Tab updated, content script should be available');
    }
});

// Periodic API health check
setInterval(async () => {
    const isOnline = await checkApiStatus();
    
    // Store API status
    chrome.storage.local.set({ 
        apiStatus: { 
            isOnline, 
            lastCheck: new Date().toISOString() 
        } 
    });
}, 60000); // Check every minute

// Export for debugging
if (typeof globalThis !== 'undefined') {
    globalThis.PromptGreenBackground = {
        EXTENSION_CONFIG,
        optimizePromptAPI,
        checkApiStatus,
        updateStatsInStorage
    };
}

console.log('PromptGreen: Background service worker initialized');