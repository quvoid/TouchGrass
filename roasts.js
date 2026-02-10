// roasts.js - TouchGrass Roast Library
const ROASTS = [
    // === CLASSIC GUILT TRIPS ===
    "Go touch grass.",
    "Do you remember what the sun looks like?",
    "Your plants are dying. Just like your career.",
    "Nature is calling. Pick up.",
    "Photosynthesis. Try it sometime.",
    "You've been here too long. Go outside.",
    "Stop doomscrolling. Life is short.",
    "404: Life not found.",

    // === PASSIVE-AGGRESSIVE ===
    "This is why you're single.",
    "Productivity is legally dead.",
    "Even your mom is disappointed.",
    "I bet you smell like a gamer chair.",
    "Your screen time report is a cry for help.",
    "You came here to work. Remember?",
    "This isn't what your therapist meant by 'self-care'.",
    "Your future self just sent a distress signal.",
    "Somewhere, a life coach is crying.",

    // === EXISTENTIAL DREAD ===
    "Time is a finite resource. You're wasting it.",
    "You will never get this hour back.",
    "One day you'll die and regret this exact moment.",
    "The void is watching. It's not impressed.",
    "Every second here is a second not lived.",
    "Your ancestors survived plagues for this?",
    "Evolution did not prepare you for this.",

    // === GEN-Z / MEME-CORE ===
    "Bro really said 'just one more video' 47 videos ago.",
    "It's giving... unemployed vibes.",
    "The Roman Empire fell and you're watching cat videos.",
    "This is not the main character moment you think it is.",
    "POV: You're the problem.",
    "Bestie, this is an intervention.",
    "The algorithm won. You lost.",
    "You're not locked in with the content. The content is locked in with you.",

    // === TECH HUMOR ===
    "Your browser history is a war crime.",
    "RAM is crying. CPU is crying. Everyone is crying.",
    "Even Chrome is judging you and it uses 8GB of RAM.",
    "You've scrolled enough to circle the Earth twice.",
    "Your attention span has left the chat.",
    "The internet was a mistake. You're the proof.",

    // === MOTIVATIONAL (but toxic) ===
    "You could have learned a language by now.",
    "3 hours = 1 workout, 1 book chapter, or this. You chose this.",
    "Elon Musk worked 18 hours today. You watched memes.",
    "Somewhere, a 12-year-old is more productive than you.",
    "Your LinkedIn says 'driven'. Your browser history says 'parked'.",
    "This could have been an email to your goals.",

    // === NATURE THEMED ===
    "Trees produce oxygen so you can watch TikToks? Rude.",
    "The grass misses you. But you wouldn't know.",
    "Birds are singing. You're watching drama.",
    "The sky is blue. When did you last see it?",
    "Chlorophyll didn't die for this.",

    // === SHORT & BRUTAL ===
    "Yikes.",
    "Again?",
    "Really?",
    "Tragic.",
    "Sad.",
    "Do better.",
    "Touch grass.",
    "Seek help.",
    "Leave.",
    "Bye.",
    "Not cute.",
    "Cringe.",
    "L + ratio + no grass"
];

// Export for service worker
if (typeof self !== 'undefined') {
    self.ROASTS = ROASTS;
}
