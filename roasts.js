// roasts.js
const ROASTS = [
    "Go touch grass.",
    "Do you remember what the sun looks like?",
    "Your plants are dying. Just like your career.",
    "I bet you smell like a gamer chair.",
    "Nature is calling. Pick up.",
    "Photosynthesis. Try it sometime.",
    "You've been here too long. Go outside.",
    "This is why you're single.",
    "Productivity is legally dead.",
    "Even your mom is disappointed.",
    "Stop doomscrolling. Life is short.",
    "404: Life not found."
];

// Export for service worker if using simple importScripts
if (typeof self !== 'undefined') {
    self.ROASTS = ROASTS;
}
