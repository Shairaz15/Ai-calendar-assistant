# 🗓️ AI Calendar Assistant

An intelligent, voice-enabled calendar application powered by AI (Ollama) with seamless Google Calendar integration.

![AI Calendar](https://img.shields.io/badge/AI-Powered-6366f1) ![Google Calendar](https://img.shields.io/badge/Google-Calendar-4285F4) ![Node.js](https://img.shields.io/badge/Node.js-18+-339933)

---

## ✨ Features

### 🤖 AI-Powered Scheduling
- **Natural Language Processing**: Say "Meeting with John tomorrow at 3pm" and it's scheduled!
- **Smart Time Parsing**: Understands formats like `half past 3`, `quarter to 4`, `3.45pm`, `midnight`
- **Typo Tolerance**: Automatically fixes common typos (`pmn` → `pm`, `tommorow` → `tomorrow`)
- **Intent Detection**: Recognizes add, delete, edit, and query commands

### 📅 Google Calendar Sync
- **Real-time Sync**: Events sync instantly with your Google Calendar
- **Two-way Integration**: Create, update, and delete events directly from the app
- **Profile Display**: Shows your Google profile picture when logged in

### 🎤 Voice Commands
- **Speech Recognition**: Click the microphone and speak your command
- **Voice Visualizer**: Animated bars show when you're speaking

### 🔄 Smart Sync Features
- **Sync Status Indicators**: Visual dots show sync status (🟢 Synced, 🟡 Pending, 🔴 Failed)
- **Auto-Retry**: Failed syncs automatically retry every 30 seconds
- **Retry Button**: Manual "Retry Failed Syncs" option in chat

### 🎨 Premium UI/UX
- **Glassmorphism Design**: Beautiful frosted glass aesthetic
- **4 Theme Options**: Default Dark, Crimson, Cyberpunk, Minimal Light
- **Animated Background**: Floating gradient orbs
- **Day View**: Detailed hourly timeline for any day

### ⚡ Performance
- **Debounced Rendering**: Optimized calendar updates
- **Network-First Caching**: Always shows latest changes
- **Instant Service Worker Updates**: No more hard reloads needed

### 📝 Additional Features
- **Focus Mode**: Built-in Pomodoro timer (25min work / 5min break)
- **Habit Tracker**: Daily habit/task checklist
- **Context Menu**: Right-click events to Edit, Delete, or Duplicate
- **Smart Event Colors**: Auto-colors events based on keywords

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Ollama](https://ollama.ai/) with `qwen2.5:0.5b` model
- Google Cloud Project with Calendar API enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/ai-calendar-assistant.git
cd ai-calendar-assistant

# Install dependencies
npm install

# Create environment file
cp .env.template .env
# Edit .env with your Google OAuth credentials

# Start Ollama (in separate terminal)
ollama run qwen2.5:0.5b

# Start the server
node server.js
```

Open `http://localhost:3000` in your browser.

---

## ⚙️ Configuration

### Environment Variables (`.env`)

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
SESSION_SECRET=your_random_secret
AI_MODEL=qwen2.5:0.5b
```

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google Calendar API**
4. Create **OAuth 2.0 Client ID** (Web Application)
5. Add Authorized Redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Secret to `.env`

---

## 🎯 Usage Examples

| Command | Result |
|---------|--------|
| "Meeting with Sarah at 3pm" | Creates event today at 3:00 PM |
| "Lunch tomorrow at noon" | Creates event tomorrow at 12:00 PM |
| "Delete the meeting" | Opens delete confirmation |
| "What do I have today?" | Lists today's events |
| "Reschedule lunch" | Opens edit modal for lunch event |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **AI**: Ollama (local LLM)
- **Auth**: Google OAuth 2.0
- **Calendar**: Google Calendar API
- **Design**: Glassmorphism CSS

---

## 📁 Project Structure

```
ai-calendar-assistant/
├── server.js          # Express server + API routes
├── public/
│   ├── index.html     # Main HTML
│   ├── style.css      # Styles (themes, animations)
│   ├── script.js      # Frontend logic
│   ├── sw.js          # Service Worker
│   └── manifest.json  # PWA manifest
├── .env               # Environment variables (git-ignored)
├── .env.template      # Environment template
└── package.json       # Dependencies
```

---

## 📄 License

MIT License - feel free to use and modify!

---

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) for local AI inference
- [Google Calendar API](https://developers.google.com/calendar)
- [Inter Font](https://rsms.me/inter/)
