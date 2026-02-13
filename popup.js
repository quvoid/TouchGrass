// popup.js

document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('site-list');
    const resetBtn = document.getElementById('reset-btn');

    // Helper to format time
    function formatTime(seconds) {
        if (seconds < 60) return `${Math.floor(seconds)}s`;
        const mins = Math.floor(seconds / 60);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return `${hrs}h ${remMins}m`;
    }

    async function loadStats() {
        const data = await chrome.storage.local.get(null);
        const sites = [];
        let totalWastedTime = 0;

        // Use Config if available, else empty
        const badSites = (typeof CONFIG !== 'undefined') ? CONFIG.UNPRODUCTIVE_SITES : [];

        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'number' && !key.startsWith('_') && !key.endsWith('_last_roast')) {
                sites.push({ domain: key, time: value });

                // Check if this site matches our "bad" list
                const isBad = badSites.some(bad => key.includes(bad));
                if (isBad) {
                    totalWastedTime += value;
                }
            }
        }

        // --- UPDATE TITLE ---
        const titleContainer = document.getElementById('shame-badge');
        let currentTitle = "Productivity Saint";

        if (typeof CONFIG !== 'undefined') {
            // Find the highest threshold met
            for (const item of CONFIG.SHAME_TITLES) {
                if (totalWastedTime >= item.threshold) {
                    currentTitle = item.title;
                }
            }
        }

        titleContainer.innerText = currentTitle;
        // Color coding based on severity could go here

        // --- RENDER LIST ---
        // Sort by time desc

        // Sort by time desc
        sites.sort((a, b) => b.time - a.time);

        // Render
        list.innerHTML = '';
        if (sites.length === 0) {
            list.innerHTML = '<li class="loading">No data yet. Get back to work!</li>';
            return;
        }

        sites.forEach(site => {
            const li = document.createElement('li');

            const domainSpan = document.createElement('span');
            domainSpan.className = 'site';
            domainSpan.innerText = site.domain;

            const timeSpan = document.createElement('span');
            timeSpan.className = 'time';
            timeSpan.innerText = formatTime(site.time);

            li.appendChild(domainSpan);
            li.appendChild(timeSpan);
            list.appendChild(li);
        });
    }

    resetBtn.onclick = async () => {
        if (confirm("Clear all stats?")) {
            await chrome.storage.local.clear();
            loadStats();
        }
    };

    // --- TABS ---
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.onclick = () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            const target = tab.dataset.tab; // personal or global
            document.getElementById(`${target}-tab`).classList.add('active');

            if (target === 'global') {
                loadLeaderboard();
            }
        };
    });

    // Real Leaderboard Data via Supabase
    async function loadLeaderboard() {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '<li class="loading">Connect to Supabase...</li>';

        try {
            // Fetch Top 50
            const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard?select=*&order=wasted_time_seconds.desc&limit=50`, {
                method: 'GET',
                headers: SUPABASE_HEADERS
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errText.substring(0, 50)}`);
            }

            const competitors = await response.json();

            // Get current user ID to highlight
            const syncData = await chrome.storage.sync.get(['user_id']);
            const myId = syncData.user_id;

            list.innerHTML = '';

            if (competitors.length === 0) {
                list.innerHTML = '<li class="loading">No one is wasting time yet? Impossible.</li>';
                return;
            }

            competitors.forEach((c, index) => {
                const li = document.createElement('li');
                li.className = 'rank-item';
                if (c.id === myId) li.classList.add('user-rank');

                const rankSpan = document.createElement('span');
                rankSpan.className = 'rank';
                rankSpan.innerText = `#${index + 1}`;

                const nameSpan = document.createElement('span');
                nameSpan.className = 'site';
                nameSpan.innerText = c.username || "Anonymous";

                const timeSpan = document.createElement('span');
                timeSpan.className = 'time';
                timeSpan.innerText = formatTime(c.wasted_time_seconds);

                li.appendChild(rankSpan);
                li.appendChild(nameSpan);
                li.appendChild(timeSpan);
                list.appendChild(li);
            });

            // Add Username Input if not set or at bottom of list
            addUsernameInput();

        } catch (e) {
            console.error("Leaderboard load failed:", e);
            list.innerHTML = `<li class="loading" style="color:red">Connection Failed.</li><li class="loading" style="font-size:10px">${e.message}</li>`;
        }
    }

    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
        syncBtn.onclick = async () => {
            syncBtn.innerText = "...";
            // Trigger background sync via message
            await chrome.runtime.sendMessage({ action: "FORCE_SYNC" });

            // Wait a sec then reload list
            setTimeout(() => {
                loadLeaderboard();
                syncBtn.innerText = "↻ Sync";
            }, 2000);
        };
    }

    function addUsernameInput() {
        const existing = document.getElementById('username-input-container');
        if (existing) return;

        const container = document.getElementById('leaderboard-container');
        const inputDiv = document.createElement('div');
        inputDiv.id = 'username-input-container';
        inputDiv.style.marginTop = '10px';
        inputDiv.style.textAlign = 'center';
        inputDiv.style.display = 'flex';
        inputDiv.style.gap = '5px';

        const input = document.createElement('input');
        input.placeholder = "Enter your handle";
        input.style.background = '#333';
        input.style.border = '1px solid #555';
        input.style.color = 'white';
        input.style.padding = '5px';
        input.style.flex = '1';

        const saveBtn = document.createElement('button');
        saveBtn.innerText = "Save";
        saveBtn.style.background = '#003300';
        saveBtn.style.color = '#00ff41';

        saveBtn.onclick = async () => {
            const newName = input.value.trim();
            if (newName) {
                await chrome.storage.sync.set({ username: newName });
                // Trigger an immediate sync in background would be nice, 
                // but for now wait for interval or manual sync logic if we added it.
                alert("Username saved! It will update on next sync (approx 2 mins).");
            }
        };

        inputDiv.appendChild(input);
        inputDiv.appendChild(saveBtn);
        container.appendChild(inputDiv);

        // Pre-fill
        chrome.storage.sync.get(['username'], (data) => {
            if (data.username) input.value = data.username;
        });
    }

    const testRoastBtn = document.getElementById('test-roast-btn');
    if (testRoastBtn) {
        testRoastBtn.onclick = async () => {
            testRoastBtn.innerText = "Sending...";

            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab) {
                    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://")) {
                        alert("Cannot roast internal browser pages! Please try on a real website (e.g., example.com).");
                        testRoastBtn.innerText = "Test Roast";
                        return;
                    }

                    console.log("Sending roast to tab:", tab.id);

                    try {
                        await chrome.tabs.sendMessage(tab.id, {
                            action: "ROAST",
                            text: "You requested this roast. Now get back to work!"
                        });
                        testRoastBtn.innerText = "Sent!";
                        setTimeout(() => testRoastBtn.innerText = "Test Roast", 2000);
                    } catch (err) {
                        console.warn("Message failed, trying to inject script:", err);
                        testRoastBtn.innerText = "Injecting...";

                        try {
                            // Script execution for robustness
                            await chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                files: ['content.js']
                            });
                            await chrome.scripting.insertCSS({
                                target: { tabId: tab.id },
                                files: ['content.css']
                            });

                            // Retry message
                            setTimeout(async () => {
                                try {
                                    await chrome.tabs.sendMessage(tab.id, {
                                        action: "ROAST",
                                        text: "You requested this roast. Now get back to work!"
                                    });
                                    testRoastBtn.innerText = "Sent (Injected)!";
                                } catch (retryErr) {
                                    console.error("Retry failed:", retryErr);
                                    testRoastBtn.innerText = "Failed";
                                    alert("Failed to roast. Try refreshing the page.");
                                }
                            }, 500);
                        } catch (injectErr) {
                            console.error("Injection failed:", injectErr);
                            testRoastBtn.innerText = "Failed";
                            alert("Cannot inject into this page. Try a standard website.");
                        }
                    }
                } else {
                    testRoastBtn.innerText = "No Tab?";
                }
            } catch (e) {
                console.error(e);
                testRoastBtn.innerText = "Error";
            }
        };
    }

    loadStats();
});
