// background.js

try {
    importScripts('roasts.js', 'config.js', 'backend_config.js');
} catch (e) {
    console.error(e);
}

let activeTabId = null;
let activeTabUrl = null;
let startTime = null;

// Thresholds for roasts (in seconds for testing, minutes for prod)
const ROAST_THRESHOLD = 3600; // Roast after 1 hour (3600s)
const ROAST_INTERVAL = 3600; // Roast every 1 hour (3600s)

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

// Function to update time spent
async function updateTime() {
    if (activeTabUrl && startTime) {
        const now = Date.now();
        const duration = (now - startTime) / 1000; // in seconds

        // We only track "unproductive" sites for the roast, 
        // but we could track everything for stats.
        // For MVP, let's track everything by domain.

        try {
            const hostname = new URL(activeTabUrl).hostname;
            const data = await chrome.storage.local.get([hostname]);
            const currentTotal = (data[hostname] || 0) + duration;

            await chrome.storage.local.set({ [hostname]: currentTotal });

            // Log for debugging
            console.log(`Updated time for ${hostname}: ${currentTotal.toFixed(1)}s`);

            // Check for roast trigger
            if (isUnproductive(activeTabUrl)) {
                checkRoast(hostname, currentTotal);
            }

        } catch (e) {
            console.error("Error updating time:", e);
        }
    }
    // Reset start time for next interval if we are continuing
    startTime = Date.now();
}

// Check if we should roast the user
async function checkRoast(hostname, totalTime) {
    // Simple logic: every X seconds on an unproductive site
    // In a real app, we might want "session time" vs "total time".
    // Let's use session time for now (time since tab active).

    // Actually, to make it annoying, let's just use the total time increment.
    // If totalTime % ROAST_INTERVAL < 5 (allow some buffer), trigger?
    // Better: use alarms to trigger specific events.

    // Alternate approach: Send a message to content script to check time itself? 
    // No, background is source of truth.

    // Let's just randomly roast if they are on it for too long.
    // For MVP: Send a roast every 30 seconds.

    // We need to know if we already roasted recently.
    const lastRoastKey = `${hostname}_last_roast`;
    const data = await chrome.storage.local.get([lastRoastKey]);
    const lastRoast = data[lastRoastKey] || 0;
    const now = Date.now();

    if (now - lastRoast > ROAST_THRESHOLD * 1000) {
        // Trigger Roast
        console.log("ROASTING!");

        // Pick a random roast
        // We need the roasts list here. We can fetch it or hardcode a small set if import fails.
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


// Listeners
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await updateTime(); // Save time for previous tab

    activeTabId = activeInfo.tabId;
    startTime = Date.now();

    try {
        const tab = await chrome.tabs.get(activeTabId);
        activeTabUrl = tab.url;
    } catch (e) {
        activeTabUrl = null;
    }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tabId === activeTabId && changeInfo.url) {
        await updateTime();
        activeTabUrl = changeInfo.url;
        startTime = Date.now();
    }
});

// Periodic save (e.g., every 5 seconds) to ensure data isn't lost on crash
// and to trigger roasts in real-time
chrome.alarms.create("tracking_heartbeat", { periodInMinutes: 0.1 }); // Every 6s
chrome.alarms.create("sync_score", { periodInMinutes: 2 }); // Sync to cloud every 2 mins

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "tracking_heartbeat") {
        if (activeTabId) {
            // Check if window is focused
            // Use chrome.windows.get for more reliability or catch errors
            try {
                const window = await chrome.windows.getLastFocused();
                if (window.focused) {
                    await updateTime();
                }
            } catch (e) {
                // Window might be closed or error
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
        // 1. Calculate Total Wasted Time
        const data = await chrome.storage.local.get(null);
        let totalWasted = 0;

        const sites = (typeof CONFIG !== 'undefined') ? CONFIG.UNPRODUCTIVE_SITES : [];
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'number' && !key.endsWith('_last_roast')) {
                if (sites.some(bad => key.includes(bad))) {
                    totalWasted += value;
                }
            }
        }

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
            console.log("Sync success!");
        }

    } catch (e) {
        console.error("Error syncing:", e);
    }
}

// Initialize on load to ensure we have an active tab ID if the service worker wakes up
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0) {
        activeTabId = tabs[0].id;
        activeTabUrl = tabs[0].url;
        startTime = Date.now();
    }
});
