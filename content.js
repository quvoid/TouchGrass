// content.js
// This script runs on the page

console.log("Reality Check: Content script loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Content script received message:", request);
    if (request.action === "ROAST") {
        console.log("Triggering showRoast with:", request.text);
        showRoast(request.text);
    }
});

function showRoast(text) {
    // Remove existing roast if any
    const existing = document.getElementById("reality-check-overlay");
    if (existing) existing.remove();

    // Create Overlay
    const overlay = document.createElement("div");
    overlay.id = "reality-check-overlay";
    overlay.className = "reality-check-enter"; // Animation class

    // Create Container
    const container = document.createElement("div");
    container.className = "reality-check-container";

    // Text
    const message = document.createElement("h1");
    message.innerText = text;

    // Button
    const btn = document.createElement("button");
    btn.innerText = "I'm sorry, I'll work.";
    btn.onclick = () => {
        overlay.classList.remove("reality-check-enter");
        overlay.classList.add("reality-check-exit");
        setTimeout(() => overlay.remove(), 500);
    };

    container.appendChild(message);
    container.appendChild(btn);
    overlay.appendChild(container);

    document.body.appendChild(overlay);
}
