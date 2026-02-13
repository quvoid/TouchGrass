// popup.js — TouchGrass v2.0

document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('site-list');
    const resetBtn = document.getElementById('reset-btn');
    const doomBar = document.getElementById('doom-bar');
    const totalWastedDisplay = document.getElementById('total-wasted-display');
    const streakCountEl = document.getElementById('streak-count');

    // --- HELPERS ---
    function formatTime(seconds) {
        if (seconds < 60) return `${Math.floor(seconds)}s`;
        const mins = Math.floor(seconds / 60);
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return `${hrs}h ${remMins}m`;
    }

    // --- DOOM METER ---
    function updateDoomMeter(totalWastedTime) {
        const limit = (typeof CONFIG !== 'undefined' && CONFIG.DAILY_LIMIT) ? CONFIG.DAILY_LIMIT : 3600; // 1hr default
        const pct = Math.min(100, (totalWastedTime / limit) * 100);

        doomBar.style.width = `${pct}%`;

        // Remove previous severity classes
        doomBar.classList.remove('warn', 'danger');

        if (pct >= 75) {
            doomBar.classList.add('danger');
        } else if (pct >= 40) {
            doomBar.classList.add('warn');
        }
        // else stays default green
    }

    // --- SHAME BADGE SEVERITY ---
    function updateShameSeverity(totalWastedTime) {
        const container = document.getElementById('shame-title-container');
        container.classList.remove('level-safe', 'level-warn', 'level-danger');

        if (totalWastedTime >= 3600) {
            container.classList.add('level-danger');
        } else if (totalWastedTime >= 900) {
            container.classList.add('level-warn');
        } else {
            container.classList.add('level-safe');
        }
    }

    // --- STREAK ---
    async function loadStreak() {
        const data = await chrome.storage.local.get(['_streak_days']);
        const streak = data._streak_days || 0;
        streakCountEl.innerText = streak;
    }

    // --- MAIN STATS ---
    async function loadStats() {
        const data = await chrome.storage.local.get(null);
        const sites = [];
        let totalWastedTime = 0;

        const badSites = (typeof CONFIG !== 'undefined') ? CONFIG.UNPRODUCTIVE_SITES : [];

        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'number' && !key.startsWith('_') && !key.endsWith('_last_roast')) {
                sites.push({ domain: key, time: value });

                const isBad = badSites.some(bad => key.includes(bad));
                if (isBad) {
                    totalWastedTime += value;
                }
            }
        }

        // Update shame badge title
        const titleContainer = document.getElementById('shame-badge');
        let currentTitle = "Productivity Saint";

        if (typeof CONFIG !== 'undefined') {
            for (const item of CONFIG.SHAME_TITLES) {
                if (totalWastedTime >= item.threshold) {
                    currentTitle = item.title;
                }
            }
        }

        titleContainer.innerText = currentTitle;

        // Update severity styling
        updateShameSeverity(totalWastedTime);

        // Update doom meter
        updateDoomMeter(totalWastedTime);

        // Update total wasted display
        totalWastedDisplay.innerText = formatTime(totalWastedTime);

        // Sort by time desc
        sites.sort((a, b) => b.time - a.time);

        // Render list
        list.innerHTML = '';
        if (sites.length === 0) {
            list.innerHTML = '<li class="loading">No data yet — go browse</li>';
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

    // --- RESET ---
    resetBtn.onclick = async () => {
        if (confirm("Clear all daily stats?")) {
            // Only clear daily keys, preserve internal _keys
            const data = await chrome.storage.local.get(null);
            const keysToRemove = [];
            for (const key of Object.keys(data)) {
                if (!key.startsWith('_')) {
                    keysToRemove.push(key);
                }
            }
            if (keysToRemove.length > 0) {
                await chrome.storage.local.remove(keysToRemove);
            }
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
            const target = tab.dataset.tab;
            document.getElementById(`${target}-tab`).classList.add('active');

            if (target === 'global') {
                loadLeaderboard();
            }
        };
    });

    // --- LEADERBOARD ---
    async function loadLeaderboard() {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '<li class="loading">Connecting...</li>';

        try {
            const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard?select=*&order=wasted_time_seconds.desc&limit=50`, {
                method: 'GET',
                headers: SUPABASE_HEADERS
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errText.substring(0, 50)}`);
            }

            const competitors = await response.json();

            const syncData = await chrome.storage.sync.get(['user_id']);
            const myId = syncData.user_id;

            list.innerHTML = '';

            if (competitors.length === 0) {
                list.innerHTML = '<li class="loading">Nobody here yet</li>';
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

            addUsernameInput();

        } catch (e) {
            console.error("Leaderboard load failed:", e);
            list.innerHTML = `<li class="loading" style="color:#ff3333">Connection Failed</li><li class="loading">${e.message}</li>`;
        }
    }

    // --- SYNC BTN ---
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
        syncBtn.onclick = async () => {
            syncBtn.innerText = "...";
            await chrome.runtime.sendMessage({ action: "FORCE_SYNC" });
            setTimeout(() => {
                loadLeaderboard();
                syncBtn.innerText = "↻ Sync";
            }, 2000);
        };
    }

    // --- USERNAME INPUT ---
    function addUsernameInput() {
        const existing = document.getElementById('username-input-container');
        if (existing) return;

        const container = document.getElementById('leaderboard-container');
        const inputDiv = document.createElement('div');
        inputDiv.id = 'username-input-container';

        const input = document.createElement('input');
        input.placeholder = "your handle";

        const saveBtn = document.createElement('button');
        saveBtn.innerText = "Save";

        saveBtn.onclick = async () => {
            const newName = input.value.trim();
            if (newName) {
                await chrome.storage.sync.set({ username: newName });
                saveBtn.innerText = "✓";
                setTimeout(() => saveBtn.innerText = "Save", 1500);
            }
        };

        inputDiv.appendChild(input);
        inputDiv.appendChild(saveBtn);
        container.appendChild(inputDiv);

        chrome.storage.sync.get(['username'], (data) => {
            if (data.username) input.value = data.username;
        });
    }

    // --- TEST ROAST ---
    const testRoastBtn = document.getElementById('test-roast-btn');
    if (testRoastBtn) {
        testRoastBtn.onclick = async () => {
            testRoastBtn.innerText = "...";
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab) {
                    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://")) {
                        alert("Can't roast browser pages. Try a real website.");
                        testRoastBtn.innerText = "⚡ Roast Me";
                        return;
                    }

                    try {
                        await chrome.tabs.sendMessage(tab.id, {
                            action: "ROAST",
                            text: "You requested this roast. Now get back to work!"
                        });
                        testRoastBtn.innerText = "Sent!";
                        setTimeout(() => testRoastBtn.innerText = "⚡ Roast Me", 2000);
                    } catch (err) {
                        try {
                            await chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                files: ['content.js']
                            });
                            await chrome.scripting.insertCSS({
                                target: { tabId: tab.id },
                                files: ['content.css']
                            });

                            setTimeout(async () => {
                                try {
                                    await chrome.tabs.sendMessage(tab.id, {
                                        action: "ROAST",
                                        text: "You requested this roast. Now get back to work!"
                                    });
                                    testRoastBtn.innerText = "Sent!";
                                } catch (retryErr) {
                                    testRoastBtn.innerText = "Failed";
                                }
                                setTimeout(() => testRoastBtn.innerText = "⚡ Roast Me", 2000);
                            }, 500);
                        } catch (injectErr) {
                            testRoastBtn.innerText = "Failed";
                            setTimeout(() => testRoastBtn.innerText = "⚡ Roast Me", 2000);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
                testRoastBtn.innerText = "Error";
                setTimeout(() => testRoastBtn.innerText = "⚡ Roast Me", 2000);
            }
        };
    }

    // --- TEST DAD ---
    const testDadBtn = document.getElementById('test-dad-btn');
    if (testDadBtn) {
        testDadBtn.onclick = async () => {
            testDadBtn.innerText = "...";
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tab) {
                    if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://")) {
                        alert("Can't spawn Dad on browser pages.");
                        testDadBtn.innerText = "🧔";
                        return;
                    }

                    try {
                        await chrome.tabs.sendMessage(tab.id, { action: "SPAWN_DAD" });
                        testDadBtn.innerText = "Sent!";
                        setTimeout(() => testDadBtn.innerText = "🧔", 2000);
                    } catch (err) {
                        try {
                            await chrome.scripting.executeScript({
                                target: { tabId: tab.id },
                                files: ['content.js']
                            });
                            await chrome.scripting.insertCSS({
                                target: { tabId: tab.id },
                                files: ['content.css']
                            });

                            setTimeout(async () => {
                                try {
                                    await chrome.tabs.sendMessage(tab.id, { action: "SPAWN_DAD" });
                                    testDadBtn.innerText = "Sent!";
                                } catch (retryErr) {
                                    testDadBtn.innerText = "Failed";
                                }
                                setTimeout(() => testDadBtn.innerText = "🧔", 2000);
                            }, 500);
                        } catch (injectErr) {
                            testDadBtn.innerText = "Failed";
                            setTimeout(() => testDadBtn.innerText = "🧔", 2000);
                        }
                    }
                }
            } catch (e) {
                console.error(e);
                testDadBtn.innerText = "Error";
                setTimeout(() => testDadBtn.innerText = "🧔", 2000);
            }
        };
    }

    // --- INIT ---
    await loadStreak();
    await loadStats();
});
