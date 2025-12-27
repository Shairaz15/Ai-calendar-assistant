console.log("🟢 Starting AI Calendar Server v2...");
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// ✅ Ollama Configuration - Use fastest model
// Recommended: qwen2.5:0.5b (fastest) or llama3.2:1b (balanced)
const AI_MODEL = process.env.AI_MODEL || 'qwen2.5:0.5b';
const OLLAMA_URL = 'http://localhost:11434/api/generate';

console.log(`🚀 Using Ollama Model: ${AI_MODEL}`);

// 🔐 Google Auth Setup
import session from "express-session";
import { google } from "googleapis";

app.use(session({
  secret: process.env.SESSION_SECRET || 'ai-calendar-secret-key',
  resave: false,
  saveUninitialized: true
}));

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/auth/google/callback"
);

const isAuthenticated = (req, res, next) => {
  if (req.session.tokens) {
    oauth2Client.setCredentials(req.session.tokens);
    next();
  } else {
    res.status(401).json({ error: "Not logged in" });
  }
};

// 🟢 Auth Routes
app.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/userinfo.profile"]
  });
  res.redirect(url);
});

app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;
    res.redirect("/");
  } catch (error) {
    console.error("Auth Error:", error);
    res.redirect("/?error=auth_failed");
  }
});

app.get("/auth/user", (req, res) => {
  if (req.session.tokens) res.json({ loggedIn: true });
  else res.json({ loggedIn: false });
});

app.get("/auth/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// 📅 Calendar Routes
app.get("/events", isAuthenticated, async (req, res) => {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: (new Date()).toISOString(),
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });
    res.json(response.data.items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/addEvent", isAuthenticated, async (req, res) => {
  const { event } = req.body;
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    const eventBody = {
      summary: event.title,
      description: event.description || "Created by AI Calendar",
      start: { dateTime: event.start || event.date, timeZone: event.timeZone || "Asia/Kolkata" },
      end: { dateTime: event.end || event.date, timeZone: event.timeZone || "Asia/Kolkata" }
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventBody,
    });
    res.json(response.data);
  } catch (error) {
    console.error("GCal Insert Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🗑️ Delete Event Endpoint
app.post("/deleteEvent", async (req, res) => {
  const { eventId } = req.body;

  // Return success for local deletion (Google sync handled separately)
  res.json({ success: true, message: `Event ${eventId} deleted` });
});

// ✏️ Edit Event Endpoint  
app.post("/editEvent", async (req, res) => {
  const { eventId, updates } = req.body;

  // Return success for local edit (Google sync handled separately)
  res.json({ success: true, message: `Event ${eventId} updated`, updates });
});

// 🧠 Fast Ollama Call with Timeout
async function callOllama(prompt, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AI_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 300,  // Reduced for speed
          top_p: 0.9
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = await response.json();
    const rawResponse = data.response || '';
    console.log("📝 Raw AI Response:", rawResponse.substring(0, 200));

    // Extract JSON
    let jsonStr = rawResponse;
    const jsonBlockMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) jsonStr = jsonBlockMatch[1].trim();

    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    // Clean up
    jsonStr = jsonStr
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/'/g, '"');

    return JSON.parse(jsonStr);

  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error('AI request timed out');
    }
    throw error;
  }
}

// 🧠 Smart AI Endpoint with Intent Detection
app.post("/processAI", async (req, res) => {
  const { text } = req.body;

  // Use local timezone-aware dates
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;

  // Tomorrow in local time
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tYear = tomorrowDate.getFullYear();
  const tMonth = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
  const tDay = String(tomorrowDate.getDate()).padStart(2, '0');
  const tomorrowStr = `${tYear}-${tMonth}-${tDay}`;

  console.log(`📅 Today: ${today}, Tomorrow: ${tomorrowStr}`);

  // Optimized prompt for fast models
  const prompt = `You are a calendar AI. Today is ${today}. Tomorrow is ${tomorrowStr}.

Parse this command and return ONLY valid JSON:
"${text}"

Intent types:
- "event" = has specific time (e.g. "at 3pm", "at 14:00", "morning", "evening")
- "task" = no specific time, just a reminder/todo
- "delete" = remove/delete/cancel something
- "edit" = change/move/reschedule something
- "query" = asking a question

IMPORTANT DATE RULES:
- If user says "today" use date: ${today}
- If user says "tomorrow" use date: ${tomorrowStr}
- If no day specified, use today: ${today}

Response formats:
{"type":"event","title":"Meeting","start":"${today}T15:00:00","end":"${today}T16:00:00"}
{"type":"task","task":"Buy groceries"}
{"type":"delete","target":"meeting"}
{"type":"edit","target":"gym","changes":{"newTime":"17:00"}}
{"type":"query","question":"what events"}

Time shortcuts: morning=09:00, afternoon=14:00, evening=18:00, night=21:00

Return ONLY the JSON:`;

  try {
    let output;
    const startTime = Date.now();

    try {
      output = await callOllama(prompt);
      console.log(`⚡ AI responded in ${Date.now() - startTime}ms`);
    } catch (ollamaError) {
      console.log("⚠️ Ollama failed, using fallback:", ollamaError.message);
      output = smartFallbackParser(text, today, tomorrowStr);
    }

    console.log("🔍 Parsed Intent:", output);

    // Handle different intent types
    switch (output.type) {
      case "event": {
        const event = output;
        if (!event.title || event.title === "null") {
          event.title = text.replace(/^(schedule|add|create|set up|book)\s*/i, '').slice(0, 40) || "New Event";
        }
        if (!event.start || isNaN(new Date(event.start).getTime())) {
          const defaultStart = new Date();
          defaultStart.setHours(defaultStart.getHours() + 1);
          event.start = defaultStart.toISOString();
        }
        if (!event.end) {
          event.end = new Date(new Date(event.start).getTime() + 3600000).toISOString();
        }
        res.json({ result: { type: 'event', data: event } });
        break;
      }

      case "task": {
        res.json({
          result: {
            type: 'task',
            message: `📝 Added task: "${output.task}"`,
            task: output.task
          }
        });
        break;
      }

      case "delete": {
        res.json({
          result: {
            type: 'delete',
            target: output.target,
            message: `🗑️ Looking for "${output.target}" to delete...`
          }
        });
        break;
      }

      case "edit": {
        res.json({
          result: {
            type: 'edit',
            target: output.target,
            changes: output.changes,
            message: `✏️ Editing "${output.target}"...`
          }
        });
        break;
      }

      case "query": {
        if (req.session?.tokens) {
          oauth2Client.setCredentials(req.session.tokens);
          const calendar = google.calendar({ version: "v3", auth: oauth2Client });
          const gcalRes = await calendar.events.list({
            calendarId: "primary",
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true
          });
          const events = gcalRes.data.items || [];
          if (events.length === 0) {
            res.json({ result: { type: 'answer', message: "No upcoming events found." } });
          } else {
            const summary = events.slice(0, 5).map(e =>
              `• ${e.summary} - ${new Date(e.start.dateTime || e.start.date).toLocaleDateString()}`
            ).join('\n');
            res.json({ result: { type: 'answer', message: `📅 Upcoming events:\n${summary}` } });
          }
        } else {
          res.json({ result: { type: 'answer', message: "Please login with Google to query your calendar!" } });
        }
        break;
      }

      default:
        res.json({ result: { type: 'answer', message: "I understood that, but I'm not sure what to do. Try: 'Meeting at 3pm' or 'Add task: Buy groceries'" } });
    }

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🔧 Smart Fallback Parser
function smartFallbackParser(text, today, tomorrow) {
  const lowerText = text.toLowerCase();

  // Delete Detection
  if (/\b(delete|remove|cancel|clear)\b/i.test(text)) {
    const target = text.replace(/\b(delete|remove|cancel|clear|the|my|please)\b/gi, '').trim();
    return { type: "delete", target: target || "event" };
  }

  // Edit Detection
  if (/\b(edit|change|move|reschedule|update)\b/i.test(text)) {
    const target = text.replace(/\b(edit|change|move|reschedule|update|the|my|to)\b/gi, '').trim();
    return { type: "edit", target: target, changes: {} };
  }

  // Query Detection
  if (/^(what|when|how many|do i have|show|list|display)\b/i.test(text)) {
    return { type: "query", question: text };
  }

  // Time extraction for events
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  const hasTimeKeyword = /\b(at|from|by|until)\b/i.test(text);
  const hasMorningEvening = /\b(morning|afternoon|evening|night|noon)\b/i.test(text);

  if (timeMatch || hasMorningEvening) {
    let hours, minutes = 0;

    if (hasMorningEvening) {
      const match = lowerText.match(/\b(morning|afternoon|evening|night|noon)\b/);
      const timeWord = match ? match[1] : 'afternoon';
      const timeMap = { morning: 9, noon: 12, afternoon: 14, evening: 18, night: 21 };
      hours = timeMap[timeWord] || 14;
    } else if (timeMatch) {
      hours = parseInt(timeMatch[1]);
      minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = timeMatch[3]?.toLowerCase();
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
    }

    const hasTomorrow = lowerText.includes('tomorrow');
    const baseDate = hasTomorrow ? tomorrow : today;
    const start = `${baseDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    const endHours = (hours + 1) % 24;
    const end = `${baseDate}T${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

    let title = text
      .replace(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi, '')
      .replace(/\b(at|on|tomorrow|today|morning|afternoon|evening|night|noon|schedule|add|create|set up|book)\b/gi, '')
      .trim() || "New Event";

    return { type: "event", title, start, end };
  }

  // No time = Task
  const taskText = text.replace(/\b(add|create|remind me to|reminder)\b/gi, '').trim();
  return { type: "task", task: taskText || text };
}

// 📊 Get all local events (for search/filter)
app.get("/localEvents", (req, res) => {
  // Events are stored client-side, this is just a placeholder
  res.json({ events: [] });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
