// config.js
const CONFIG = {
    UNPRODUCTIVE_SITES: [
        "youtube.com",
        "twitter.com",
        "facebook.com",
        "instagram.com",
        "reddit.com",
        "netflix.com",
        "twitch.tv",
        "tiktok.com",
        "hulu.com",
        "disneyplus.com"
    ],
    DAILY_LIMIT: 3600, // 1 hour — doom meter fills up to this, streak resets if exceeded
    SHAME_TITLES: [
        { threshold: 0, title: "Productivity Saint" },
        { threshold: 300, title: "Casual Browser" }, // 5 mins
        { threshold: 900, title: "Distraction Enthusiast" }, // 15 mins
        { threshold: 1800, title: "Procrastination Apprentice" }, // 30 mins
        { threshold: 3600, title: "Chief Slack Officer" }, // 1 hour
        { threshold: 7200, title: "Time Waste Champion" }, // 2 hours
        { threshold: 14400, title: "Professional Slacker" }, // 4 hours
        { threshold: 28800, title: "Unemployable" } // 8 hours
    ]
};

if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
} else if (typeof self !== 'undefined') {
    self.CONFIG = CONFIG;
}
