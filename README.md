# TouchGrass 🌱

**Stop Doomscrolling. Go Outside.**

> "Your plants are dying. Just like your career."

TouchGrass is a passive-aggressive Chrome extension designed to bully you into being productive. It tracks your time on distraction sites and delivers roasted reality checks when you've been scrolling too long.

![License](https://img.shields.io/badge/license-MIT-green)

## 🔥 Features

- **Judgemental Time Tracking**: Monitors how much of your life you're wasting on sites like YouTube, Twitter, and Reddit.
- **Savage Roast Overlay**: Instead of gently blocking a site, it covers the screen with a roast that hits close to home.
- **Global Leaderboard**: compete with other procrastinators for the title of "Most Unproductive Human".
- **Shame Titles**: Unlock ranks from "Productivity Saint" (0s wasted) to "Unemployable" (8h wasted).

## 🚀 Installation

This extension is currently installed via "Developer Mode".

1.  **Clone or Download** this repository to your local machine.
2.  Open Google Chrome (or Edge/Brave) and navigate to `chrome://extensions`.
3.  Toggle **Developer mode** in the top right corner.
4.  Click **Load unpacked**.
5.  Select the **TouchGrass** folder (the directory containing `manifest.json`).
6.  Pin the extension to your toolbar—you'll need it.

## ⚙️ Configuration

### Unproductive Sites
You can customize which sites trigger the roasts by editing `config.js`.
Add domain names to the `UNPRODUCTIVE_SITES` array:

```javascript
const CONFIG = {
    UNPRODUCTIVE_SITES: [
        "youtube.com",
        "twitter.com",
        // Add your vices here
        "example.com"
    ],
    // ...
};
```

### Backend Setup
The extension uses Supabase for the global leaderboard. The configuration is in `backend_config.js`.
*Note: The current configuration points to a public demo instance.*

## 📂 Project Structure

- `manifest.json`: Extension configuration and permissions.
- `background.js`: Service worker handling time tracking and alarm logic.
- `content.js` & `content.css`: The script that injects the roast overlay into web pages.
- `popup.html`, `popup.js`, `popup.css`: The extension interface showing your stats and leaderboard.
- `roasts.js`: The collection of insults used to roast you.
- `config.js`: Configuration for blocked sites and shame titles.

## 🤝 Contributing

Feel free to fork this project and submit a Pull Request if you have:
1.  Better roasts.
2.  More efficient ways to shame users.
3.  Bug fixes (like if the roasts aren't hurting enough).

## 📄 License

MIT License - Do whatever you want with it, just go touch some grass.

---

*Made with self-loathing and too much screen time.*
