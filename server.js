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

app.get("/auth/user", async (req, res) => {
  if (req.session.tokens) {
    try {
      oauth2Client.setCredentials(req.session.tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      res.json({
        loggedIn: true,
        user: {
          name: userInfo.data.name,
          email: userInfo.data.email,
          picture: userInfo.data.picture
        }
      });
    } catch (error) {
      console.error("Profile fetch error:", error);
      res.json({ loggedIn: true, user: null }); // Still logged in, but profile fetch failed
    }
  } else {
    res.json({ loggedIn: false });
  }
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

  // 🛡️ Validate and Fix Time Data
  console.log("📥 Received Event Data:", JSON.stringify(event, null, 2));

  let startDateTime = event.start || event.date;
  let endDateTime = event.end;

  // If start is missing or invalid, default to NOW + 1 hour
  if (!startDateTime || isNaN(new Date(startDateTime).getTime())) {
    console.warn("⚠️ Invalid or missing start time. Defaulting to +1 hour from now.");
    const defaultStart = new Date();
    defaultStart.setHours(defaultStart.getHours() + 1);
    startDateTime = defaultStart.toISOString();
  }

  // If end is missing, default to start + 1 hour
  if (!endDateTime || isNaN(new Date(endDateTime).getTime())) {
    const endDate = new Date(startDateTime);
    endDate.setHours(endDate.getHours() + 1);
    endDateTime = endDate.toISOString();
  }

  try {
    const eventBody = {
      summary: event.title || "Untitled Event",
      description: event.description || "Created by AI Calendar",
      start: { dateTime: startDateTime, timeZone: event.timeZone || "Asia/Kolkata" },
      end: { dateTime: endDateTime, timeZone: event.timeZone || "Asia/Kolkata" }
    };

    // 🔍 DEBUG: Log the event payload being sent to Google
    console.log("📤 Sending Event to Google:", JSON.stringify(eventBody, null, 2));

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventBody,
    });
    console.log("✅ Google Response:", response.status, response.data.htmlLink);
    res.json(response.data);
  } catch (error) {
    console.error("❌ GCal Insert Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 🗑️ Delete Event Endpoint
app.post("/deleteEvent", isAuthenticated, async (req, res) => {
  const { eventId } = req.body;
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    console.log(`🗑️ Deleting Event: ${eventId}`);
    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
    });
    res.json({ success: true, message: `Event ${eventId} deleted from Google Calendar` });
  } catch (error) {
    console.error("❌ Delete Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✏️ Edit Event Endpoint  
app.post("/editEvent", isAuthenticated, async (req, res) => {
  const { eventId, updates } = req.body;
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  try {
    console.log(`✏️ Updating Event: ${eventId}`, updates);

    // Map updates to Google Event Resource keys if necessary
    // (Assuming simple updates for now, might need better mapping)
    const patchBody = {};
    if (updates.start) patchBody.start = { dateTime: updates.start };
    if (updates.end) patchBody.end = { dateTime: updates.end };
    if (updates.title) patchBody.summary = updates.title;

    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId: eventId,
      requestBody: patchBody,
    });

    res.json({ success: true, message: `Event ${eventId} updated`, data: response.data });
  } catch (error) {
    console.error("❌ Update Error:", error);
    res.status(500).json({ error: error.message });
  }
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

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[now.getDay()];
  const tomorrowName = days[tomorrowDate.getDay()];

  const tYear = tomorrowDate.getFullYear();
  const tMonth = String(tomorrowDate.getMonth() + 1).padStart(2, '0');
  const tDay = String(tomorrowDate.getDate()).padStart(2, '0');
  const tomorrowStr = `${tYear}-${tMonth}-${tDay}`;

  console.log(`📅 Today: ${today} (${todayName}), Tomorrow: ${tomorrowStr} (${tomorrowName})`);

  console.log(`📅 Today: ${today} (${todayName}), Tomorrow: ${tomorrowStr} (${tomorrowName})`);

  // 🛡️ PRE-PARSE: Bypass AI for simple commands (Fast & Reliable)
  const lowerText = text.toLowerCase().trim();

  // 1. Simple Delete
  if (lowerText === 'delete' || lowerText === 'remove' || /^delete\s+./.test(lowerText) || /^remove\s+./.test(lowerText)) {
    console.log("⚡ Pattern Match: Delete Intent");
    let target = text.replace(/^(delete|remove|cancel|clear|the|my|please)\s*/gi, '').trim();
    res.json({ result: { type: 'delete', target: target || 'event' } });
    return;
  }

  // 2. Simple Edit
  if (/^(edit|change|move|reschedule)\b/.test(lowerText)) {
    console.log("⚡ Pattern Match: Edit Intent");
    let target = text.replace(/^(edit|change|move|reschedule|update|the|my|to)\s*/gi, '').trim();
    res.json({ result: { type: 'edit', target: target || 'event', changes: {} } });
    return;
  }

  // 3. Simple Query
  if (lowerText === 'events' || lowerText === 'schedule' || /^(what|show|list)\b/.test(lowerText)) {
    console.log("⚡ Pattern Match: Query Intent");
    res.json({ result: { type: 'query', question: text } });
    return;
  }

  // Optimized prompt for fast models
  const prompt = `You are a calendar assistant. 
Current Date: ${today} (${todayName}).
Tomorrow is: ${tomorrowStr} (${tomorrowName}).

Parse this user command into JSON.

RULES:
1. Extract the Event Title CLEANLY (remove times and dates).
2. "from 6pm to 8pm" means Start: 18:00, End: 20:00.
3. If no end time specified, default to 1 hour duration.
4. "tomorrow" means use date: ${tomorrowStr}

User Command: "${text}"

Responds with ONE of these JSON formats:

TYPE: EVENT
{"type":"event","title":"Gym","start":"${today}T18:00:00","end":"${today}T20:00:00"}
(Example for "Gym from 6pm to 8pm")

TYPE: TASK (no specific time)
{"type":"task","task":"Buy groceries"}

TYPE: DELETE
{"type":"delete","target":"Gym"}

TYPE: EDIT
{"type":"edit","target":"Gym","changes":{"newTime":"18:00"}}

Return ONLY the JSON. Do not explain.`;

  try {
    let output;
    const startTime = Date.now();

    // 🛡️ HYBRID APPROACH: Regex First!
    // If we can parse the intent locally with high confidence, skip the AI.
    // This solves the 0.5b model hallucination issues.

    // 1. Try local parser
    const localResult = smartFallbackParser(text, today, tomorrowStr);

    // 2. Decide: Use Local or AI?
    if (localResult.type === 'delete' || localResult.type === 'edit' || localResult.type === 'query') {
      console.log("⚡ Using Local Parser (Command)");
      output = localResult;
    }
    else if (localResult.type === 'event' && localResult.start) {
      // If regex found a specific time, TRUST IT.
      console.log("⚡ Using Local Parser (Event with Time)");
      output = localResult;
    }
    else {
      // Only use AI if local parser couldn't find a time/intent
      try {
        output = await callOllama(prompt);
        console.log(`⚡ AI responded in ${Date.now() - startTime}ms`);
      } catch (ollamaError) {
        console.log("⚠️ Ollama failed, using fallback");
        output = localResult;
      }
    }

    console.log("🔍 Parsed Intent:", output);
    const hasTomorrowDebug = /\btomorrow\b/i.test(text) || /\btommorow\b/i.test(text);
    console.log(`🐛 DEBUG: UserInput="${text}" | HasTomorrow=${hasTomorrowDebug} | TomorrowStr=${tomorrowStr}`);

    // 🛡️ Post-processing Safeguard for Dates & Times
    if (output.type === 'event') {
      // 1. Aggressively Fix "tomorrow" date error
      // If user says "tomorrow" or "tommorow", FORCE the date to tomorrowStr
      const hasTomorrow = /\btomorrow\b/i.test(text) || /\btommorow\b/i.test(text);
      if (hasTomorrow) {
        console.log("🛠️ Enforcing 'tomorrow' date logic...");
        // Extract existing times or default to 10am
        const startTime = output.start ? output.start.split('T')[1] : '10:00:00';
        // Force date
        output.start = `${tomorrowStr}T${startTime}`;

        if (output.end) {
          const endTime = output.end.split('T')[1];
          output.end = `${tomorrowStr}T${endTime}`;
        } else {
          // Default end is +1 hour
          const h = parseInt(startTime.split(':')[0]) + 1;
          output.end = `${tomorrowStr}T${String(h).padStart(2, '0')}:00:00`;
        }
      }

      // 2. Fix Time if Title looks like it has time but AI missed it
      const timeInTitle = output.title && output.title.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
      if (timeInTitle) {
        // Re-parse
        const corrected = smartFallbackParser(output.title + " " + (hasTomorrow ? 'tomorrow' : ''), today, tomorrowStr);
        if (corrected.start) {
          console.log("🛠️ Fixing time from title overlap...");
          const correctTime = corrected.start.split('T')[1];
          // Use the date we intentionally enforced above
          const dateToUse = output.start.split('T')[0];
          output.start = `${dateToUse}T${correctTime}`;

          // Fix end time (1 hour default)
          const startH = new Date(output.start).getHours();
          const startM = new Date(output.start).getMinutes();
          const endH = (startH + 1) % 24;
          output.end = `${dateToUse}T${String(endH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`;

          // Clean title
          output.title = output.title
            .replace(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(\s*to\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?)?/gi, '') // Remove "6pm to 8pm"
            .replace(/\b(at|from|on|until|till)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
    }

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

// 🔧 Smart Fallback Parser (The "Regex Engine")
function smartFallbackParser(text, today, tomorrow) {
  // 🧹 IMPROVEMENT #1: Normalize & Clean Input
  let normalizedText = text.toLowerCase()
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .replace(/pmn|pn|p\.?m\.?n/gi, 'pm')  // Fix typos: pmn → pm
    .replace(/amn|an|a\.?m\.?n/gi, 'am')  // Fix typos: amn → am
    .replace(/(\d)\.(\d{2})\s*(am|pm)/gi, '$1:$2$3') // 3.45pm → 3:45pm
    .replace(/(\d)\s+(am|pm)/gi, '$1$2')  // "3 pm" → "3pm"
    .replace(/half\s*past\s*(\d{1,2})/gi, (_, h) => `${h}:30`) // half past 3 → 3:30
    .replace(/quarter\s*past\s*(\d{1,2})/gi, (_, h) => `${h}:15`) // quarter past 3 → 3:15
    .replace(/quarter\s*to\s*(\d{1,2})/gi, (_, h) => `${parseInt(h) - 1}:45`) // quarter to 4 → 3:45
    .replace(/(\d{1,2})\s*o'?\s*clock/gi, '$1:00'); // 3 o'clock → 3:00

  const lowerText = normalizedText;

  // 1. Command Detection
  if (/\b(delete|remove|cancel|clear)\b/i.test(normalizedText)) {
    const target = normalizedText.replace(/\b(delete|remove|cancel|clear|the|my|please|event)\b/gi, '').trim();
    return { type: "delete", target: target || "event" };
  }
  if (/\b(edit|change|move|reschedule|update)\b/i.test(normalizedText)) {
    const target = normalizedText.replace(/\b(edit|change|move|reschedule|update|the|my|to|event)\b/gi, '').trim();
    return { type: "edit", target: target, changes: {} };
  }
  if (/^(what|when|how many|do i have|show|list|display)\b/i.test(normalizedText)) {
    return { type: "query", question: text };
  }

  // 2. Date Logic
  const hasTomorrow = /\btomorrow\b/i.test(normalizedText) || /\btommorow\b/i.test(normalizedText);
  const baseDate = hasTomorrow ? tomorrow : today;

  // 3. Time Logic (Enhanced!)
  // Matches "6pm", "6:30pm", "18:00", "6am"
  const timeRegex = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi;

  const matches = [...normalizedText.matchAll(timeRegex)].filter(m => {
    const hours = parseInt(m[1]);
    // Must have am/pm OR have minutes OR hours <= 12 (likely a time)
    return m[3] || m[2] !== undefined || (hours >= 1 && hours <= 12);
  });

  let startH = 14, startM = 0;
  let endH = 15, endM = 0;
  let hasSpecificTime = false;

  // Helper with validation
  const parseTimeStr = (hStr, mStr, ampm) => {
    let h = parseInt(hStr);
    let m = mStr ? parseInt(mStr) : 0;

    // Validate hours
    if (h > 23 || h < 0) h = 12; // Default to noon if invalid
    if (m > 59 || m < 0) m = 0;

    if (ampm) {
      ampm = ampm.toLowerCase().replace(/\./g, '');
      if (ampm === 'pm' && h < 12) h += 12;
      if (ampm === 'am' && h === 12) h = 0;
    } else if (h <= 6) {
      // Ambiguous time without am/pm - assume PM for business hours
      h += 12;
    }
    return { h, m };
  };

  if (matches.length > 0) {
    hasSpecificTime = true;
    const startObj = parseTimeStr(matches[0][1], matches[0][2], matches[0][3]);
    startH = startObj.h;
    startM = startObj.m;

    if (matches.length > 1) {
      const endObj = parseTimeStr(matches[1][1], matches[1][2], matches[1][3]);
      endH = endObj.h;
      endM = endObj.m;
    } else {
      endH = (startH + 1) % 24;
      endM = startM;
    }
  }
  // Handle Keywords if no explicit time (morning/evening)
  else if (/\b(morning|afternoon|evening|night|noon|midday|midnight)\b/i.test(normalizedText)) {
    hasSpecificTime = true;
    const match = lowerText.match(/\b(morning|afternoon|evening|night|noon|midday|midnight)\b/);
    const timeWord = match ? match[1] : 'afternoon';
    const timeMap = { morning: 9, noon: 12, midday: 12, afternoon: 14, evening: 18, night: 21, midnight: 0 };
    startH = timeMap[timeWord];
    endH = (startH + 1) % 24;
  }

  // 4. Construct Result
  if (hasSpecificTime) {
    let finalDate = baseDate;

    // 🧠 Smart Future Scheduling
    // If user didn't say "tomorrow" but the time has already passed today, 
    // assume they mean tomorrow.
    if (!hasTomorrow) {
      const now = new Date();
      const nowH = now.getHours();
      const nowM = now.getMinutes();

      if (startH < nowH || (startH === nowH && startM < nowM)) {
        finalDate = tomorrow;
        console.log(`🧠 Time ${startH}:${startM} passed today, scheduling for tomorrow (${tomorrow})`);
      }
    }

    const start = `${finalDate}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}:00`;
    const end = `${finalDate}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00`;

    // Clean Title
    let title = text
      .replace(timeRegex, '') // Remove matched times
      .replace(/\b(morning|afternoon|evening|night|noon)\b/gi, '')
      .replace(/\b(at|from|to|until|till|on|tomorrow|tommorow|today)\b/gi, '')
      .replace(/\b(schedule|add|create|set up|book)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Remove simple numbers left over? e.g. "2" from "2pm" if regex missed it? 
    // Our regex consumes the number. 
    // Check for leading punctuation
    title = title.replace(/^[^a-zA-Z0-9]+/, '');

    if (!title) title = "New Event";

    return { type: "event", title, start, end };
  }

  // 5. Fallback -> Task
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
