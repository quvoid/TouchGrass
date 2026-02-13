// background.js

try {
    importScripts('roasts.js', 'config.js', 'backend_config.js');
} catch (e) {
    console.error(e);
}

let activeTabId = null;
let activeTabUrl = null;
let startTime = null;
let isWindowFocused = true; // Track if any browser window is focused

// Thresholds for roasts (in seconds for testing, minutes for prod)
const ROAST_THRESHOLD = 3600; // Roast after 1 hour (3600s)
const ROAST_INTERVAL = 3600; // Roast every 1 hour (3600s)

// --- DAILY RESET HELPERS ---
function getTodayDateString() {
    // Returns "YYYY-MM-DD" in local time
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Check if the day has changed; if so, sync yesterday's data and reset daily stats
async function checkDailyReset() {
    const data = await chrome.storage.local.get(['_last_reset_date']);
    const lastReset = data._last_reset_date;
    const today = getTodayDateString();

    if (lastReset && lastReset !== today) {
        console.log(`New day detected (${lastReset} → ${today}). Syncing and resetting daily stats.`);

        // Sync the final totals from yesterday before wiping
        await syncScoreToCloud();

        // Clear all daily domain keys but keep internal _keys
        const allData = await chrome.storage.local.get(null);
        const keysToRemove = [];
        for (const key of Object.keys(allData)) {
            if (!key.startsWith('_')) {
                keysToRemove.push(key);
            }
        }
        if (keysToRemove.length > 0) {
            await chrome.storage.local.remove(keysToRemove);
            console.log(`Cleared ${keysToRemove.length} daily domain keys.`);
        }

        // Update the reset date
        await chrome.storage.local.set({ _last_reset_date: today });
    } else if (!lastReset) {
        // First run ever — just set today's date
        await chrome.storage.local.set({ _last_reset_date: today });
    }
}

// Helper: add delta to _lifetime_wasted for unproductive sites
async function addToLifetime(hostname, delta) {
    const badSites = (typeof CONFIG !== 'undefined') ? CONFIG.UNPRODUCTIVE_SITES : [];
    const isBad = badSites.some(bad => hostname.includes(bad));
    if (isBad && delta > 0) {
        const data = await chrome.storage.local.get(['_lifetime_wasted']);
        const lifetime = (data._lifetime_wasted || 0) + delta;
        await chrome.storage.local.set({ _lifetime_wasted: lifetime });
    }
}

// Helper to check if URL is unproductive
function isUnproductive(url) {
    if (!url) return false;
    try {
        const hostname = new URL(url).hostname;
        const sites = (typeof CONFIG !== 'undefined') ? CONFIG.UNPRODUCTIVE_SITES : [
            "youtube.com", "twitter.com", "facebook.com", "reddit.com" // Fallback
        ];
        return sites.some(site => hostname.includes(site));
    } catch (e) {
        return false;
    }
}

// Function to update time spent — only saves if actively tracking
async function updateTime() {
    // Check for daily reset before recording
    await checkDailyReset();

    if (activeTabUrl && startTime) {
        const now = Date.now();
        const duration = (now - startTime) / 1000; // in seconds

        // Ignore tiny or negative durations (safety check)
        if (duration <= 0) {
            startTime = Date.now();
            return;
        }

        try {
            const hostname = new URL(activeTabUrl).hostname;
            const data = await chrome.storage.local.get([hostname]);
            const currentTotal = (data[hostname] || 0) + duration;

            await chrome.storage.local.set({ [hostname]: currentTotal });

            // Also add to lifetime total for unproductive sites
            await addToLifetime(hostname, duration);

            // Log for debugging
            console.log(`Updated time for ${hostname}: ${currentTotal.toFixed(1)}s (+${duration.toFixed(1)}s)`);

            // Check for roast trigger
            if (isUnproductive(activeTabUrl)) {
                checkRoast(hostname, currentTotal);
            }

        } catch (e) {
            console.error("Error updating time:", e);
        }
    }
    // Reset start time for next interval
    startTime = Date.now();
}

// Pause tracking — saves accumulated time and stops the timer
async function pauseTracking() {
    if (activeTabUrl && startTime) {
        const now = Date.now();
        const duration = (now - startTime) / 1000;

        if (duration > 0) {
            try {
                const hostname = new URL(activeTabUrl).hostname;
                const data = await chrome.storage.local.get([hostname]);
                const currentTotal = (data[hostname] || 0) + duration;
                await chrome.storage.local.set({ [hostname]: currentTotal });

                // Also add to lifetime total for unproductive sites
                await addToLifetime(hostname, duration);

                console.log(`Paused tracking for ${hostname}: saved ${duration.toFixed(1)}s`);
            } catch (e) {
                console.error("Error pausing tracking:", e);
            }
        }
    }
    // Null out startTime so no more time accumulates
    startTime = null;
}

// Resume tracking — starts the timer again
function resumeTracking() {
    startTime = Date.now();
    console.log(`Resumed tracking for ${activeTabUrl}`);
}

// Check if we should roast the user
async function checkRoast(hostname, totalTime) {
    const lastRoastKey = `${hostname}_last_roast`;
    const data = await chrome.storage.local.get([lastRoastKey]);
    const lastRoast = data[lastRoastKey] || 0;
    const now = Date.now();

    if (now - lastRoast > ROAST_THRESHOLD * 1000) {
        // Trigger Roast
        console.log("ROASTING!");

        let roasts = [
            "You came here to work.",
            "This is your 7th YouTube video.",
            "Productivity is calling...",
            "Are you proud of this?",
            "Tick tock. Tick tock."
        ];

        // Use imported roasts if available
        if (typeof ROASTS !== 'undefined' && Array.isArray(ROASTS)) {
            roasts = ROASTS;
        }

        const roast = roasts[Math.floor(Math.random() * roasts.length)];

        // Send to content script
        if (activeTabId) {
            chrome.tabs.sendMessage(activeTabId, {
                action: "ROAST",
                text: roast
            }).catch(err => console.log("Tab closed or no content script:", err));
        }

        await chrome.storage.local.set({ [lastRoastKey]: now });
    }
}


// --- TAB CHANGE: user switches tab within same window ---
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await pauseTracking(); // Save time for previous tab

    activeTabId = activeInfo.tabId;

    try {
        const tab = await chrome.tabs.get(activeTabId);
        activeTabUrl = tab.url;
    } catch (e) {
        activeTabUrl = null;
    }

    // Only start tracking if the window is focused
    if (isWindowFocused) {
        resumeTracking();
    }
});

// --- URL CHANGE: user navigates within the same tab ---
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.url) {
        await pauseTracking();
        activeTabUrl = changeInfo.url;
        if (isWindowFocused) {
            resumeTracking();
        }
    }
});

// --- WINDOW FOCUS CHANGE: user switches to different window or leaves browser ---
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        // User left all Chrome windows (switched to another app)
        console.log("Browser lost focus — pausing tracking");
        isWindowFocused = false;
        await pauseTracking();
    } else {
        // User focused a Chrome window — check which tab is active in it
        isWindowFocused = true;

        try {
            const tabs = await chrome.tabs.query({ active: true, windowId: windowId });
            if (tabs && tabs.length > 0) {
                const focusedTab = tabs[0];

                if (focusedTab.id !== activeTabId) {
                    // Switched to a different window with a different active tab
                    await pauseTracking();
                    activeTabId = focusedTab.id;
                    activeTabUrl = focusedTab.url;
                }

                resumeTracking();
                console.log(`Window focused — tracking ${activeTabUrl}`);
            }
        } catch (e) {
            console.error("Error on window focus change:", e);
        }
    }
});

// --- IDLE STATE: user is away from computer ---
chrome.idle.onStateChanged.addListener(async (newState) => {
    if (newState === "active") {
        console.log("User is active again — resuming tracking");
        isWindowFocused = true;
        resumeTracking();
    } else {
        // "idle" or "locked"
        console.log(`User is ${newState} — pausing tracking`);
        isWindowFocused = false;
        await pauseTracking();
    }
});

// Periodic save (e.g., every 6 seconds) to ensure data isn't lost on crash
// and to trigger roasts in real-time
chrome.alarms.create("tracking_heartbeat", { periodInMinutes: 0.1 }); // Every 6s
chrome.alarms.create("sync_score", { periodInMinutes: 2 }); // Sync to cloud every 2 mins

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "tracking_heartbeat") {
        // Only update time if we are actively tracking (window focused + tab active)
        if (activeTabId && isWindowFocused && startTime) {
            try {
                // Double-check: verify the active tab in the focused window matches our tracked tab
                const focusedWindow = await chrome.windows.getLastFocused();
                if (focusedWindow.focused) {
                    const tabs = await chrome.tabs.query({ active: true, windowId: focusedWindow.id });
                    if (tabs && tabs.length > 0 && tabs[0].id === activeTabId) {
                        await updateTime();
                    } else {
                        // Active tab doesn't match — pause tracking
                        console.log("Heartbeat: active tab mismatch, pausing");
                        await pauseTracking();
                    }
                } else {
                    // No window focused
                    await pauseTracking();
                }
            } catch (e) {
                // Window might be closed
            }
        }
    } else if (alarm.name === "sync_score") {
        await syncScoreToCloud();
    }
});

// Listen for manual sync
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "FORCE_SYNC") {
        syncScoreToCloud().then(() => sendResponse({ status: "done" }));
        return true; // async response
    }
});

async function syncScoreToCloud() {
    try {
        console.log("Syncing score to cloud...");

        // 1. Read lifetime wasted total (already maintained incrementally)
        const data = await chrome.storage.local.get(['_lifetime_wasted']);
        const totalWasted = data._lifetime_wasted || 0;

        // 2. Get Sync ID (User ID)
        const syncData = await chrome.storage.sync.get(['user_id', 'username']);
        let userId = syncData.user_id;

        if (!userId) {
            userId = crypto.randomUUID();
            await chrome.storage.sync.set({ user_id: userId });
        }

        let username = syncData.username || "Anonymous Waster";

        // 3. Upsert to Supabase
        const payload = {
            id: userId,
            username: username,
            wasted_time_seconds: Math.floor(totalWasted),
            updated_at: new Date().toISOString()
        };

        const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
            method: 'POST',
            headers: {
                ...SUPABASE_HEADERS,
                "Prefer": "resolution=merge-duplicates" // Upsert
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error("Sync failed:", await response.text());
        } else {
            console.log(`Sync success! Lifetime wasted: ${totalWasted.toFixed(0)}s`);
        }

    } catch (e) {
        console.error("Error syncing:", e);
    }
}

// --- MIGRATION + INIT ---
// On startup: migrate old data to lifetime if needed, then check daily reset
async function initializeExtension() {
    // 1. Migration: if _lifetime_wasted doesn't exist, calculate it from existing data
    const data = await chrome.storage.local.get(null);
    if (data._lifetime_wasted === undefined) {
        let totalWasted = 0;
        const badSites = (typeof CONFIG !== 'undefined') ? CONFIG.UNPRODUCTIVE_SITES : [];
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'number' && !key.startsWith('_') && !key.endsWith('_last_roast')) {
                if (badSites.some(bad => key.includes(bad))) {
                    totalWasted += value;
                }
            }
        }
        await chrome.storage.local.set({ _lifetime_wasted: totalWasted });
        console.log(`Migration complete: _lifetime_wasted set to ${totalWasted.toFixed(0)}s`);
    }

    // 2. Check if we need a daily reset
    await checkDailyReset();

    // 3. Set up active tab tracking
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs.length > 0) {
        activeTabId = tabs[0].id;
        activeTabUrl = tabs[0].url;

        try {
            const win = await chrome.windows.getLastFocused();
            isWindowFocused = win.focused;
            if (isWindowFocused) {
                startTime = Date.now();
            }
        } catch (e) {
            startTime = Date.now(); // Fallback: assume focused
        }
    }
}

initializeExtension();
