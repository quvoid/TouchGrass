# TouchGrass 🌱

**Stop Doomscrolling. Go Outside.**

A passive-aggressive Chrome extension that tracks your time on unproductive websites and roasts you for it. Compete with others on the global leaderboard of shame.

## Features

- ⏱️ **Time Tracking** - Monitors time spent on sites like YouTube, Twitter, Reddit, etc.
- 🔥 **Roast Overlay** - Passive-aggressive popups telling you to touch grass
- 🏆 **Global Leaderboard** - Compete for the title of "Most Unproductive Human"
- 🏷️ **Shame Titles** - Earn ranks from "Productivity Saint" to "Unemployable"

## Installation

### From Source (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer Mode** (toggle in top right)
4. Click **Load Unpacked**
5. Select the `TouchGrass` folder

## Usage

1. Browse the web normally
2. After spending too much time on unproductive sites, you'll get roasted
3. Click the extension icon to see your stats
4. Switch to **Leaderboard** tab to see how you rank globally
5. Set your username to claim your spot on the leaderboard

## File Structure

```
TouchGrass/
├── manifest.json       # Extension configuration
├── background.js       # Time tracking & sync logic
├── content.js          # Roast overlay injection
├── content.css         # Overlay styles
├── popup.html          # Popup UI structure
├── popup.js            # Popup logic
├── popup.css           # Popup styles
├── config.js           # Unproductive sites & shame titles
├── backend_config.js   # Supabase credentials
└── roasts.js           # Roast messages
```

## Tech Stack

- **Frontend**: Vanilla JS, HTML, CSS
- **Backend**: Supabase (PostgreSQL)
- **Platform**: Chrome Extension (Manifest V3)

## License

MIT License - Do whatever you want with it.

---

*Made with procrastination and self-awareness.*
