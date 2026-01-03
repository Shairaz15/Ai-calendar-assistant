# ◉ NEXUS - AI Calendar Assistant

A futuristic, AI-powered calendar with voice commands, smart scheduling, and seamless Google Calendar sync. Built with a premium sci-fi aesthetic.

![NEXUS](https://img.shields.io/badge/NEXUS-AI_Calendar-06b6d4) ![Google Calendar](https://img.shields.io/badge/Google-Calendar-4285F4) ![Node.js](https://img.shields.io/badge/Node.js-18+-339933)

---

## ✨ Features

### 🚀 Futuristic Landing Page
- **Scroll-Based 3D Experience**: Parallax orb animations, particle field background
- **5 Feature Sections**: Voice, Smart Scheduling, Google Sync showcased with animations
- **120fps Performance**: GPU-accelerated CSS transforms only

### 🤖 AI-Powered Scheduling
- **Natural Language Processing**: Say "Meeting with John tomorrow at 3pm" and it's scheduled!
- **Smart Time Parsing**: Understands `half past 3`, `quarter to 4`, `3.45pm`, `midnight`
- **Typo Tolerance**: Auto-fixes `pmn` → `pm`, `tommorow` → `tomorrow`
- **Intent Detection**: Recognizes add, delete, edit, and query commands

### 📅 Google Calendar Sync
- **Real-time Sync**: Events sync instantly with your Google Calendar
- **Two-way Integration**: Create, update, and delete events from the app
- **Sync Status Indicators**: 🟢 Synced | 🟡 Pending | 🔴 Failed

### 🎤 Voice Commands
- **Speech Recognition**: Click the microphone and speak
- **Voice Visualizer**: Animated bars show when you're speaking

### 🎨 NEXUS Design System
- **Deep Space Theme**: Background `#030712`, Cyan `#06b6d4`, Violet `#8b5cf6`
- **Glassmorphism**: Frosted glass panels with subtle borders
- **Semantic Colors**: Success, Error, Warning, Info tokens

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Ollama](https://ollama.ai/) with `qwen2.5:0.5b` model
- Google Cloud Project with Calendar API enabled

### Installation

```bash
# Clone the repository
git clone https://github.com/Shairaz15/Ai-calendar-assistant.git
cd Ai-calendar-assistant

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

## 🏗️ Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page (new users) |
| `/dashboard` | Main calendar app |
| `/auth/google` | Google OAuth login |
| `/auth/logout` | Logout |

---

## ⚙️ Configuration

### Environment Variables (`.env`)

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
SESSION_SECRET=your_random_secret
AI_MODEL=qwen2.5:0.5b
```

---

## 🎯 Usage Examples

| Command | Result |
|---------|--------|
| "Meeting with Sarah at 3pm" | Creates event today at 3:00 PM |
| "Lunch tomorrow at noon" | Creates event tomorrow at 12:00 PM |
| "Delete the meeting" | Opens delete confirmation |
| "What do I have today?" | Lists today's events |

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **AI**: Ollama (local LLM)
- **Auth**: Google OAuth 2.0
- **Calendar**: Google Calendar API
- **Design**: NEXUS Design System (Glassmorphism + Sci-Fi)

---

## 📁 Project Structure

```
ai-calendar-assistant/
├── server.js              # Express server + API routes
├── public/
│   ├── landing.html       # NEW: Scroll-based landing page
│   ├── landing.css        # NEW: Landing page styles
│   ├── landing.js         # NEW: Scroll animations
│   ├── index.html         # Dashboard (calendar)
│   ├── style.css          # Dashboard styles (NEXUS tokens)
│   ├── script.js          # Frontend logic
│   └── manifest.json      # PWA manifest
├── .env                   # Environment variables
└── package.json           # Dependencies
```

---

## 📄 License

MIT License - feel free to use and modify!

---

## 🙏 Acknowledgments

- [Ollama](https://ollama.ai/) for local AI inference
- [Google Calendar API](https://developers.google.com/calendar)
- [Inter Font](https://rsms.me/inter/) & [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk)
