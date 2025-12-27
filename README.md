# 🗓️ AI Calendar Assistant

A beautiful, AI-powered calendar app with natural language processing. Just tell it what you want to schedule!

![AI Calendar Preview](https://img.shields.io/badge/AI-Ollama%20Powered-blueviolet?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🧠 **Natural Language AI** | "Meeting with John at 3pm tomorrow" → Event created |
| 📋 **Smart Intent Detection** | Automatically distinguishes events, tasks, edits, and deletes |
| ✏️ **Edit & Delete** | Right-click context menu or just say "delete the meeting" |
| 🎨 **Glassmorphism UI** | Stunning modern design with animations |
| 🤖 **Floating AI Bubble** | Hover to expand, click outside to collapse |
| 📱 **Progressive Web App** | Install on mobile like a native app |
| 🔐 **Google Calendar Sync** | Optional OAuth integration |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+
- **Ollama** with `qwen2.5:0.5b` model

### Installation

```bash
# Clone the repo
git clone https://github.com/Shairaz15/Ai-calendar-assistant.git
cd Ai-calendar-assistant

# Install dependencies
npm install

# Pull the fast AI model
ollama pull qwen2.5:0.5b

# Start the server
npm start
```

Open **http://localhost:3000** 🎉

---

## 💬 Example Commands

```
📅 Events (with time):
"Meeting at 3pm"
"Lunch with Sarah tomorrow at noon"
"Doctor appointment on Monday morning"

📝 Tasks (no time):
"Buy groceries"
"Call mom"
"Finish the report"

🗑️ Delete:
"Delete the meeting"
"Remove lunch event"

✏️ Edit:
"Move gym to 5pm"
"Change meeting to tomorrow"

❓ Query:
"What's on my calendar?"
"Show my events"
```

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JS, CSS3 (Glassmorphism)
- **Backend**: Node.js, Express
- **AI**: Ollama (local LLM - qwen2.5:0.5b)
- **Optional**: Google Calendar API

---

## ⚙️ Configuration

Create a `.env` file:

```env
AI_MODEL=qwen2.5:0.5b

# Optional: Google Calendar OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Faster Models

| Model | Speed | Size |
|-------|-------|------|
| `qwen2.5:0.5b` | ⚡ Fastest | 500MB |
| `llama3.2:1b` | Fast | 1GB |
| `phi3` | Moderate | 2.2GB |

---

## 📁 Project Structure

```
├── public/
│   ├── index.html      # Main UI
│   ├── script.js       # Frontend logic
│   ├── style.css       # Glassmorphism styles
│   ├── sw.js           # Service Worker (PWA)
│   └── manifest.json   # PWA manifest
├── server.js           # Express + AI endpoints
├── package.json
└── .env               # Configuration
```

---

## 🤝 Contributing

Pull requests welcome! For major changes, open an issue first.

---

## 📄 License

MIT © 2024

---

<p align="center">
  Made with ❤️ and AI
</p>
