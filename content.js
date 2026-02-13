// content.js
// This script runs on the page

console.log("Reality Check: Content script loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content script received message:", request);
    if (request.action === "ROAST") {
        createOverlay(request.text);
    } else if (request.action === "SPAWN_DAD") {
        spawnDad();
    }
});

function createOverlay(text) {
    // Check if overlay already exists
    if (document.getElementById('reality-check-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'reality-check-overlay';

    const container = document.createElement('div');
    container.className = 'reality-check-container';

    const title = document.createElement('h1');
    title.innerText = text || "Touch Grass.";

    const closeBtn = document.createElement('button');
    closeBtn.innerText = "I'm Sorry";
    closeBtn.onclick = () => {
        overlay.classList.add('reality-check-exit');
        setTimeout(() => overlay.remove(), 500);
    };

    container.appendChild(title);
    container.appendChild(closeBtn);
    overlay.appendChild(container);

    document.body.appendChild(overlay);

    // Auto remove after 10s
    setTimeout(() => {
        if (document.body.contains(overlay)) {
            overlay.classList.add('reality-check-exit');
            setTimeout(() => overlay.remove(), 500);
        }
    }, 10000);
}

// --- DISAPPOINTED DADLOGIC ---
function spawnDad() {
    if (document.getElementById('touchgrass-dad-container')) return;

    // Create container
    const container = document.createElement('div');
    container.id = 'touchgrass-dad-container';

    // Create Dad Body Parts
    const dad = document.createElement('div');
    dad.className = 'pixel-dad';

    const head = document.createElement('div');
    head.className = 'pixel-dad-head';

    const body = document.createElement('div');
    body.className = 'pixel-dad-body';

    const legs = document.createElement('div');
    legs.className = 'pixel-dad-legs';

    // Speech Bubble
    const bubble = document.createElement('div');
    bubble.id = 'dad-bubble';
    bubble.innerText = "I'm not mad, just disappointed.";

    dad.appendChild(head);
    dad.appendChild(body);
    dad.appendChild(legs);
    dad.appendChild(bubble); // Attach bubble to dad so it moves with him? No, dad moves via container translate.

    container.appendChild(dad);
    document.body.appendChild(container);

    // --- ANIMATION SEQUENCE ---
    // 1. Walk In (Left to Center)
    // CSS transition handles the movement (default left: -100px)

    // Force reflow
    void container.offsetWidth;

    // Start Walking
    container.classList.add('dad-walking');
    container.style.transition = 'transform 4s linear';
    container.style.transform = 'translateX(50vw)'; // Move to center

    // 2. Stop & Shake Head (at 4s)
    setTimeout(() => {
        container.classList.remove('dad-walking');
        dad.classList.add('dad-shaking-head');

        // Show Bubble
        setTimeout(() => {
            dad.classList.add('dad-visible'); // Shows bubble
        }, 500);

    }, 4000);

    // 3. Walk Out (at 7s)
    setTimeout(() => {
        dad.classList.remove('dad-visible'); // Hide bubble
        dad.classList.remove('dad-shaking-head');
        container.classList.add('dad-walking');

        container.style.transition = 'transform 4s linear';
        container.style.transform = 'translateX(120vw)'; // Move off screen right

    }, 7000);

    // 4. Cleanup (at 11s)
    setTimeout(() => {
        if (document.body.contains(container)) {
            container.remove();
        }
    }, 11000);
}
