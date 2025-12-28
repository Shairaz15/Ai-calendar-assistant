const state = {
    currentDate: new Date(),
    events: [],
    tasks: [],
    timer: null,
    timeLeft: 25 * 60,
    weather: null,
    isPanelExpanded: false,
    selectedEventId: null
};

// ✅ Local Persistence
function saveEventsToLocal() {
    localStorage.setItem('calendarEvents', JSON.stringify(state.events));
}
function loadEventsFromLocal() {
    const saved = localStorage.getItem('calendarEvents');
    if (saved) state.events = JSON.parse(saved);
}
function saveTasksToLocal() {
    localStorage.setItem('calendarTasks', JSON.stringify(state.tasks));
}
function loadTasksFromLocal() {
    const saved = localStorage.getItem('calendarTasks');
    if (saved) state.tasks = JSON.parse(saved);
}

// Generate unique IDs
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// DOM Elements
const grid = document.getElementById('calendarGrid');
const monthLabel = document.getElementById('currentMonthStr');
const eventInput = document.getElementById('eventInput');
const sendBtn = document.getElementById('sendBtn');
const aiLog = document.getElementById('aiLog');
const assistantPanel = document.getElementById('assistantPanel');
const closePanelBtn = document.getElementById('closePanelBtn');
const typingIndicator = document.getElementById('typingIndicator');
const contextMenu = document.getElementById('contextMenu');

// Modal Elements
const editModal = document.getElementById('editEventModal');
const deleteModal = document.getElementById('deleteConfirmModal');

// 🤖 AI Bubble Expansion
assistantPanel?.addEventListener('mouseenter', () => {
    if (!state.isPanelExpanded) expandPanel();
});

closePanelBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    collapsePanel();
});

function expandPanel() {
    state.isPanelExpanded = true;
    assistantPanel?.classList.add('expanded');
    setTimeout(() => eventInput?.focus(), 400);
}

function collapsePanel() {
    state.isPanelExpanded = false;
    assistantPanel?.classList.remove('expanded');
}

document.addEventListener('click', (e) => {
    if (state.isPanelExpanded && assistantPanel && !assistantPanel.contains(e.target)) {
        collapsePanel();
    }
    // Hide context menu on click
    if (contextMenu) contextMenu.style.display = 'none';
});

// 🎨 Smart Event Coloring
function getEventColor(title) {
    const t = (title || '').toLowerCase();
    if (t.includes('urgent') || t.includes('deadline') || t.includes('important')) return '#ef4444';
    if (t.includes('lunch') || t.includes('dinner') || t.includes('party') || t.includes('birthday')) return '#10b981';
    if (t.includes('meeting') || t.includes('call') || t.includes('sync') || t.includes('standup')) return '#3b82f6';
    if (t.includes('gym') || t.includes('workout') || t.includes('exercise') || t.includes('run')) return '#f59e0b';
    if (t.includes('doctor') || t.includes('dentist') || t.includes('health')) return '#8b5cf6';
    return 'var(--accent-primary)';
}

// 🍞 Toast Notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span> ${message}`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 📋 Context Menu
function showContextMenu(e, eventId) {
    e.preventDefault();
    e.stopPropagation();
    state.selectedEventId = eventId;

    if (!contextMenu) return;
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;

    // Keep menu in viewport
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        contextMenu.style.left = `${window.innerWidth - rect.width - 10}px`;
    }
    if (rect.bottom > window.innerHeight) {
        contextMenu.style.top = `${window.innerHeight - rect.height - 10}px`;
    }
}

// Context Menu Actions
document.querySelectorAll('.context-menu-item').forEach(item => {
    item.addEventListener('click', () => {
        const action = item.dataset.action;
        if (contextMenu) contextMenu.style.display = 'none';

        if (action === 'edit') openEditModal(state.selectedEventId);
        else if (action === 'delete') openDeleteConfirm(state.selectedEventId);
        else if (action === 'duplicate') duplicateEvent(state.selectedEventId);
    });
});

// ✏️ Edit Modal
function openEditModal(eventId) {
    const event = state.events.find(e => e.id === eventId);
    if (!event || !editModal) return;

    document.getElementById('editEventId').value = eventId;
    document.getElementById('editTitle').value = event.title || '';

    // Format Start Date
    const startDate = new Date(event.date || event.start);
    if (!isNaN(startDate.getTime())) {
        const localStart = new Date(startDate.getTime() - startDate.getTimezoneOffset() * 60000);
        document.getElementById('editDate').value = localStart.toISOString().slice(0, 16);
    }

    // Format End Date
    if (event.end) {
        const endDate = new Date(event.end);
        if (!isNaN(endDate.getTime())) {
            const localEnd = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000);
            document.getElementById('editEndDate').value = localEnd.toISOString().slice(0, 16);
        }
    } else {
        // Default end to +1 hour if missing
        if (!isNaN(startDate.getTime())) {
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
            const localEnd = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000);
            document.getElementById('editEndDate').value = localEnd.toISOString().slice(0, 16);
        }
    }

    editModal.classList.add('active');
}

document.getElementById('closeEditBtn')?.addEventListener('click', () => {
    editModal?.classList.remove('active');
});

document.getElementById('updateEventBtn')?.addEventListener('click', () => {
    const eventId = document.getElementById('editEventId').value;
    const newTitle = document.getElementById('editTitle').value;
    const newDate = document.getElementById('editDate').value;
    const newEndDate = document.getElementById('editEndDate').value;

    const eventIndex = state.events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return;

    if (newTitle && newDate) {
        state.events[eventIndex].title = newTitle;
        state.events[eventIndex].start = new Date(newDate).toISOString();
        state.events[eventIndex].date = state.events[eventIndex].start;
        state.events[eventIndex].color = getEventColor(newTitle);

        if (newEndDate) {
            state.events[eventIndex].end = new Date(newEndDate).toISOString();
        }

        saveEventsToLocal();
        renderCalendar();
        editModal?.classList.remove('active');
        showToast(`Updated "${newTitle}"`, 'success');
    }
});

document.getElementById('deleteFromEditBtn')?.addEventListener('click', () => {
    const eventId = document.getElementById('editEventId').value;
    editModal?.classList.remove('active');
    openDeleteConfirm(eventId);
});

// 🗑️ Delete Confirmation
function openDeleteConfirm(eventId) {
    const event = state.events.find(e => e.id === eventId);
    if (!event || !deleteModal) return;

    state.selectedEventId = eventId;
    document.getElementById('deleteConfirmText').textContent =
        `Are you sure you want to delete "${event.title}"?`;
    deleteModal.classList.add('active');
}

document.getElementById('confirmDeleteBtn')?.addEventListener('click', () => {
    if (state.selectedEventId) {
        deleteEvent(state.selectedEventId);
    }
    deleteModal?.classList.remove('active');
});

document.getElementById('cancelDeleteBtn')?.addEventListener('click', () => {
    deleteModal?.classList.remove('active');
});

function deleteEvent(eventId) {
    const event = state.events.find(e => e.id === eventId);
    state.events = state.events.filter(e => e.id !== eventId);
    saveEventsToLocal();
    renderCalendar();
    showToast(`Deleted "${event?.title || 'event'}"`, 'success');
}

// 📋 Show Event Selection List in Chat
function showEventSelectionList(events, action = 'delete') {
    if (!aiLog) return;

    const listDiv = document.createElement('div');
    listDiv.className = 'event-selection-list';
    listDiv.style.cssText = 'display: flex; flex-direction: column; gap: 8px; margin: 8px 0;';

    events.forEach((evt, index) => {
        const eventDate = new Date(evt.date || evt.start);
        const dateStr = eventDate.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
        });
        const timeStr = eventDate.toLocaleTimeString('en-US', {
            hour: 'numeric', minute: '2-digit'
        });

        const btn = document.createElement('button');
        btn.className = 'event-select-btn';
        btn.style.cssText = `
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 10px 14px;
            text-align: left;
            cursor: pointer;
            color: var(--text-main);
            transition: all 0.2s ease;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        btn.innerHTML = `
            <span style="flex:1;">
                <strong>${evt.title}</strong>
                <span style="opacity:0.6; font-size:0.85rem; margin-left:8px;">${dateStr} at ${timeStr}</span>
            </span>
            <span style="font-size:0.8rem; opacity:0.5;">${action === 'delete' ? '🗑️' : '✏️'}</span>
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.background = action === 'delete'
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(99, 102, 241, 0.2)';
            btn.style.borderColor = action === 'delete' ? '#ef4444' : '#6366f1';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'rgba(255,255,255,0.05)';
            btn.style.borderColor = 'rgba(255,255,255,0.1)';
        });

        btn.addEventListener('click', () => {
            if (action === 'delete') {
                openDeleteConfirm(evt.id);
            } else {
                openEditModal(evt.id);
            }
            listDiv.remove();
        });

        listDiv.appendChild(btn);
    });

    aiLog.appendChild(listDiv);
    aiLog.scrollTop = aiLog.scrollHeight;
}

function duplicateEvent(eventId) {
    const event = state.events.find(e => e.id === eventId);
    if (!event) return;

    const newEvent = {
        ...event,
        id: generateId(),
        title: event.title + ' (copy)'
    };
    state.events.push(newEvent);
    saveEventsToLocal();
    renderCalendar();
    showToast(`Duplicated "${event.title}"`, 'success');
}

// 📅 Render Calendar
function renderCalendar() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthLabel.textContent = `${monthNames[month]} ${year}`;

    grid.innerHTML = `
        <div class="day-header">Sun</div>
        <div class="day-header">Mon</div>
        <div class="day-header">Tue</div>
        <div class="day-header">Wed</div>
        <div class="day-header">Thu</div>
        <div class="day-header">Fri</div>
        <div class="day-header">Sat</div>
    `;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('calendar-day');
        emptyCell.style.opacity = '0.3';
        grid.appendChild(emptyCell);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.classList.add('calendar-day');
        const currentDayDate = new Date(year, month, i);

        if (currentDayDate.toDateString() === today.toDateString()) {
            dayCell.classList.add('today');
        }
        if (currentDayDate < today) {
            dayCell.classList.add('past-day');
        }

        const dayHeader = document.createElement('div');
        dayHeader.style.cssText = 'display:flex; justify-content:space-between; align-items:center;';

        const dayNum = document.createElement('div');
        dayNum.classList.add('day-number');
        dayNum.textContent = i;
        dayHeader.appendChild(dayNum);
        dayCell.appendChild(dayHeader);

        dayCell.addEventListener('click', (e) => {
            if (e.target.classList.contains('event-tag')) return;
            openDayView(currentDayDate);
        });

        // Events for this day
        const dayEvents = state.events.filter(e => {
            const d = new Date(e.date || e.start);
            return d.getDate() === i && d.getMonth() === month && d.getFullYear() === year;
        });

        dayEvents.slice(0, 3).forEach(evt => {
            const evtDiv = document.createElement('div');
            evtDiv.className = 'event-tag';
            evtDiv.style.background = `linear-gradient(90deg, ${evt.color || 'var(--accent-primary)'}, transparent)`;
            evtDiv.innerHTML = `${evt.title || "Event"}<span class="edit-icon">✏️</span>`;

            evtDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(evt.id);
            });

            evtDiv.addEventListener('contextmenu', (e) => showContextMenu(e, evt.id));

            dayCell.appendChild(evtDiv);
        });

        if (dayEvents.length > 3) {
            const more = document.createElement('div');
            more.style.cssText = 'font-size:0.7rem; color:var(--text-muted); margin-top:2px;';
            more.textContent = `+${dayEvents.length - 3} more`;
            dayCell.appendChild(more);
        }

        grid.appendChild(dayCell);
    }
}

// 🤖 Handle AI Input
async function handleInput() {
    const text = eventInput.value.trim();
    if (!text) return;

    addChatMessage(text, 'user');
    eventInput.value = '';
    showTyping(true);

    const startTime = Date.now();

    try {
        const res = await fetch('/processAI', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        const data = await res.json();
        showTyping(false);

        const responseTime = Date.now() - startTime;
        console.log(`⚡ Response in ${responseTime}ms`);

        if (data.error) {
            addChatMessage(`❌ ${data.error}`, 'ai');
            return;
        }

        const result = data.result;

        switch (result.type) {
            case 'event': {
                const eventData = result.data;
                eventData.id = generateId();
                eventData.date = eventData.start;
                eventData.color = getEventColor(eventData.title);

                state.events.push(eventData);
                saveEventsToLocal();
                renderCalendar();

                addChatMessage(`✅ Scheduled "${eventData.title}"`, 'ai');
                showToast(`Event created!`, 'success');
                break;
            }

            case 'task': {
                addHabit(result.task);
                addChatMessage(result.message || `📝 Added task`, 'ai');
                showToast('Task added!', 'success');
                break;
            }

            case 'delete': {
                const target = result.target.toLowerCase();
                const matchingEvents = state.events.filter(e =>
                    e.title.toLowerCase().includes(target)
                );

                if (matchingEvents.length === 0) {
                    // Show all events if no match found or generic delete request
                    if (state.events.length === 0) {
                        addChatMessage(`❌ No events to delete.`, 'ai');
                    } else {
                        showEventSelectionList(state.events, 'delete');
                        addChatMessage(`📋 Select an event to delete:`, 'ai');
                    }
                } else if (matchingEvents.length === 1) {
                    const evt = matchingEvents[0];
                    openDeleteConfirm(evt.id);
                    addChatMessage(`🗑️ Confirm delete "${evt.title}"?`, 'ai');
                } else {
                    // Multiple matches - show selection list
                    showEventSelectionList(matchingEvents, 'delete');
                    addChatMessage(`📋 Found ${matchingEvents.length} events. Select one to delete:`, 'ai');
                }
                break;
            }

            case 'edit': {
                const target = result.target.toLowerCase();
                const matchingEvents = state.events.filter(e =>
                    e.title.toLowerCase().includes(target)
                );

                if (matchingEvents.length === 1) {
                    openEditModal(matchingEvents[0].id);
                    addChatMessage(`✏️ Opened editor for "${matchingEvents[0].title}"`, 'ai');
                } else if (matchingEvents.length === 0) {
                    addChatMessage(`❌ No events found matching "${result.target}"`, 'ai');
                } else {
                    addChatMessage(`Found ${matchingEvents.length} matching events. Click on the event in calendar to edit.`, 'ai');
                }
                break;
            }

            case 'answer':
                addChatMessage(result.message, 'ai');
                break;

            default:
                addChatMessage(result.message || "I'm not sure what you mean.", 'ai');
        }

    } catch (err) {
        showTyping(false);
        addChatMessage("❌ Failed to connect. Is Ollama running?", 'ai');
        console.error(err);
    }
}

// Chat UI
function addChatMessage(msg, type) {
    const div = document.createElement('div');
    div.className = `chat-message ${type}`;
    div.textContent = msg;
    aiLog?.appendChild(div);
    if (aiLog) aiLog.scrollTop = aiLog.scrollHeight;
}

function showTyping(show) {
    typingIndicator?.classList.toggle('active', show);
    if (show && aiLog) aiLog.scrollTop = aiLog.scrollHeight;
}

// 🧘 Focus Mode (simplified)
const focusModal = document.getElementById('focusModal');
const timerDisplay = document.getElementById('timerDisplay');

document.getElementById('sidebarFocusBtn')?.addEventListener('click', () => {
    focusModal?.classList.add('active');
});
document.getElementById('closeModalBtn')?.addEventListener('click', () => {
    focusModal?.classList.remove('active');
});

function startTimer(minutes) {
    if (state.timer) clearInterval(state.timer);
    state.timeLeft = minutes * 60;

    state.timer = setInterval(() => {
        state.timeLeft--;
        const m = Math.floor(state.timeLeft / 60);
        const s = state.timeLeft % 60;
        if (timerDisplay) timerDisplay.textContent = `${m}:${s < 10 ? '0' + s : s}`;
        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play();
            showToast('Timer complete! 🎉', 'success');
        }
    }, 1000);
}

document.getElementById('startTimerBtn')?.addEventListener('click', () => startTimer(25));
document.getElementById('startBreakBtn')?.addEventListener('click', () => startTimer(5));
document.getElementById('stopTimerBtn')?.addEventListener('click', () => {
    clearInterval(state.timer);
    state.timeLeft = 25 * 60;
    if (timerDisplay) timerDisplay.textContent = "25:00";
});

// 🌞 Day View
const dayViewModal = document.getElementById('dayViewModal');
const dayTimeline = document.getElementById('dayTimeline');

document.getElementById('closeDayViewBtn')?.addEventListener('click', () => {
    dayViewModal?.classList.remove('active');
});

function openDayView(date) {
    dayViewModal?.classList.add('active');
    document.getElementById('dayViewDate').textContent = date.toDateString();
    if (!dayTimeline) return;
    dayTimeline.innerHTML = '';

    for (let i = 0; i < 24; i++) {
        const slot = document.createElement('div');
        slot.classList.add('time-slot');
        slot.setAttribute('data-time', `${String(i).padStart(2, '0')}:00`);
        slot.textContent = `${String(i).padStart(2, '0')}:00`;
        dayTimeline.appendChild(slot);
    }

    const daysEvents = state.events.filter(e => {
        const d = new Date(e.date || e.start);
        return d.toDateString() === date.toDateString();
    });

    daysEvents.forEach(evt => {
        const d = new Date(evt.date || evt.start);
        const startMin = d.getHours() * 60 + d.getMinutes();

        // Calculate Duration
        let durationMin = 60; // Default 1 hour
        if (evt.end) {
            const endD = new Date(evt.end);
            const diffMs = endD - d;
            if (diffMs > 0) {
                durationMin = diffMs / 60000;
            }
        }

        // Cap duration if it goes beyond midnight for display simplicity? 
        // For now, let it overflow if needed, or cap at 24h.

        const el = document.createElement('div');
        el.classList.add('day-event-block');
        // timeline starts at 0. 1 min = 1px (based on 60px/hr height)
        el.style.top = `${startMin}px`;
        el.style.height = `${durationMin}px`;
        el.style.background = evt.color || 'var(--accent-primary)';
        el.style.zIndex = 10; // Ensure it sits on top of lines

        el.innerHTML = `<strong>${evt.title}</strong><br><span style="font-size:0.75em">${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(evt.end || d.getTime() + 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;

        el.addEventListener('contextmenu', (e) => showContextMenu(e, evt.id));
        el.addEventListener('click', () => openEditModal(evt.id));
        dayTimeline.appendChild(el);
    });
}

// ✅ Habit/Task Tracker
const habitList = document.getElementById('habitList');
const defaultHabits = ["💧 Drink Water", "🏃 Exercise", "📚 Read 10m"];

function addHabit(habitName) {
    const todayStr = new Date().toDateString();
    const savedHabits = JSON.parse(localStorage.getItem('habits') || '{}');
    const todaysHabits = savedHabits[todayStr] || {};

    if (!todaysHabits[habitName]) {
        todaysHabits[habitName] = false;
        savedHabits[todayStr] = todaysHabits;
        localStorage.setItem('habits', JSON.stringify(savedHabits));
        renderHabits();
    }
}

function deleteHabit(habitName) {
    const todayStr = new Date().toDateString();
    const savedHabits = JSON.parse(localStorage.getItem('habits') || '{}');
    const todaysHabits = savedHabits[todayStr] || {};
    delete todaysHabits[habitName];
    savedHabits[todayStr] = todaysHabits;
    localStorage.setItem('habits', JSON.stringify(savedHabits));
    renderHabits();
    showToast(`Deleted task`, 'success');
}

function renderHabits() {
    if (!habitList) return;
    habitList.innerHTML = '';
    const todayStr = new Date().toDateString();
    const savedHabits = JSON.parse(localStorage.getItem('habits') || '{}');
    const todaysHabits = savedHabits[todayStr] || {};
    const allHabitNames = new Set([...defaultHabits, ...Object.keys(todaysHabits)]);

    allHabitNames.forEach(habit => {
        const checked = !!todaysHabits[habit];
        const isDefault = defaultHabits.includes(habit);

        const div = document.createElement('div');
        div.className = 'task-item';
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; flex:1; cursor:pointer;">
                <div style="width:18px; height:18px; border:2px solid var(--accent-primary); border-radius:5px; display:flex; align-items:center; justify-content:center; background:${checked ? 'var(--accent-primary)' : 'transparent'};">
                    ${checked ? '<span style="color:white; font-size:11px;">✓</span>' : ''}
                </div>
                <span class="task-text" style="opacity:${checked ? 0.6 : 1}; text-decoration:${checked ? 'line-through' : 'none'};">${habit}</span>
            </div>
            <div class="task-actions">
                ${!isDefault ? '<button class="task-action-btn delete" title="Delete">🗑️</button>' : ''}
            </div>
        `;

        div.querySelector('.task-text')?.parentElement?.addEventListener('click', () => {
            todaysHabits[habit] = !checked;
            savedHabits[todayStr] = todaysHabits;
            localStorage.setItem('habits', JSON.stringify(savedHabits));
            renderHabits();
        });

        div.querySelector('.task-action-btn.delete')?.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteHabit(habit);
        });

        habitList.appendChild(div);
    });
}

// 📝 Manual Event Modal
const manualModal = document.getElementById('manualEventModal');
document.getElementById('newEventBtn')?.addEventListener('click', () => {
    manualModal?.classList.add('active');
    const now = new Date();

    // Set Date (YYYY-MM-DD)
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dateInput = document.getElementById('manualDateOnly');
    if (dateInput) dateInput.value = dateStr;

    // Set Start Time (HH:MM)
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const timeInput = document.getElementById('manualStartTime');
    if (timeInput) timeInput.value = `${hh}:${min}`;

    // Set End Time (HH:MM) + 1 hour
    const endH = String((now.getHours() + 1) % 24).padStart(2, '0');
    const endTimeInput = document.getElementById('manualEndTime');
    if (endTimeInput) endTimeInput.value = `${endH}:${min}`;
});

document.getElementById('closeManualBtn')?.addEventListener('click', () => {
    manualModal?.classList.remove('active');
});

document.getElementById('saveEventBtn')?.addEventListener('click', () => {
    const title = document.getElementById('manualTitle').value;
    const dateVal = document.getElementById('manualDateOnly').value;
    const startVal = document.getElementById('manualStartTime').value;
    const endVal = document.getElementById('manualEndTime').value;

    if (!title || !dateVal || !startVal) {
        showToast("Please fill in logic fields", 'error');
        return;
    }

    // Combine Date + Time
    const startISO = new Date(`${dateVal}T${startVal}:00`).toISOString();
    let endISO;

    if (endVal) {
        endISO = new Date(`${dateVal}T${endVal}:00`).toISOString();
        // Handle overnight events (end time < start time means next day)
        if (new Date(endISO) < new Date(startISO)) {
            const nextDay = new Date(new Date(endISO).getTime() + 24 * 60 * 60 * 1000);
            endISO = nextDay.toISOString();
        }
    } else {
        endISO = new Date(new Date(startISO).getTime() + 60 * 60 * 1000).toISOString();
    }

    const eventData = {
        id: generateId(),
        title,
        date: startISO,
        start: startISO,
        end: endISO,
        color: getEventColor(title)
    };

    state.events.push(eventData);
    saveEventsToLocal();
    renderCalendar();
    manualModal?.classList.remove('active');
    showToast(`Created "${title}"`, 'success');
    document.getElementById('manualTitle').value = '';
});

// 🎤 Voice (simplified)
const voiceBtn = document.getElementById('voiceBtn');
const voiceVisualizer = document.getElementById('voiceVisualizer');

if ('webkitSpeechRecognition' in window && voiceBtn) {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    voiceBtn.onclick = () => {
        recognition.start();
        voiceBtn.classList.add('listening');
        voiceVisualizer?.classList.add('active'); // Show animation
        expandPanel();
    };

    recognition.onresult = (event) => {
        eventInput.value = event.results[0][0].transcript;
        voiceBtn.classList.remove('listening');
        voiceVisualizer?.classList.remove('active'); // Hide animation
        handleInput();
    };

    recognition.onerror = () => {
        voiceBtn.classList.remove('listening');
        voiceVisualizer?.classList.remove('active');
    };
    recognition.onend = () => {
        voiceBtn.classList.remove('listening');
        voiceVisualizer?.classList.remove('active');
    };
}

// 🎨 Theme Switcher
function switchTheme(theme) {
    const root = document.documentElement;
    const themes = {
        'cyberpunk': {
            '--bg-dark': '#050505', '--bg-gradient-1': '#0a1a0a', '--bg-gradient-2': '#051505',
            '--accent-primary': '#00ff9f', '--accent-secondary': '#ff0055',
            '--glass-bg': 'rgba(0, 255, 159, 0.03)', '--text-main': '#e0e0e0'
        },
        'minimal': {
            '--bg-dark': '#f8fafc', '--bg-gradient-1': '#e2e8f0', '--bg-gradient-2': '#f1f5f9',
            '--accent-primary': '#2563eb', '--text-main': '#1e293b', '--text-muted': '#64748b',
            '--glass-bg': 'rgba(0,0,0,0.03)'
        },
        'red-black': {
            '--bg-dark': '#0a0000', '--bg-gradient-1': '#1a0505', '--bg-gradient-2': '#0f0202',
            '--accent-primary': '#ff0000', '--accent-secondary': '#800000',
            '--glass-bg': 'rgba(255, 0, 0, 0.03)', '--text-main': '#ffffff'
        },
        'default': {
            '--bg-dark': '#0a0a1a', '--bg-gradient-1': '#1a1a3e', '--bg-gradient-2': '#0f0f2d',
            '--accent-primary': '#6366f1', '--accent-secondary': '#ec4899',
            '--glass-bg': 'rgba(255, 255, 255, 0.03)', '--text-main': '#f0f0ff'
        }
    };

    const selected = themes[theme] || themes.default;
    Object.entries(selected).forEach(([key, value]) => root.style.setProperty(key, value));
    localStorage.setItem('theme', theme);
}

// Event Listeners
sendBtn?.addEventListener('click', handleInput);
eventInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleInput(); });
document.getElementById('prevMonthBtn')?.addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    renderCalendar();
});
document.getElementById('nextMonthBtn')?.addEventListener('click', () => {
    state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    renderCalendar();
});

// Init
async function init() {
    loadEventsFromLocal();
    loadTasksFromLocal();
    renderCalendar();
    renderHabits();

    try {
        const res = await fetch('/auth/user');
        const authData = await res.json();
        if (authData.loggedIn) {
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('userSection').style.display = 'block';
        }
    } catch (e) { }

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        switchTheme(savedTheme);
        const labels = {
            'default': '🌌 Default Dark',
            'red-black': '🔴 Crimson',
            'cyberpunk': '🦾 Cyberpunk',
            'minimal': '📄 Minimal Light'
        };
        const lbl = document.getElementById('currentThemeLabel');
        if (lbl && labels[savedTheme]) lbl.textContent = labels[savedTheme];
    }
}

// 💧 Custom Dropdown Logic
const themeTrigger = document.getElementById('themeSelectTrigger');
const themeOptions = document.getElementById('themeOptions');
const currentLabel = document.getElementById('currentThemeLabel');

if (themeTrigger && themeOptions) {
    themeTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isFlex = themeOptions.style.display === 'flex';
        themeOptions.style.display = isFlex ? 'none' : 'flex';
    });

    document.addEventListener('click', () => {
        themeOptions.style.display = 'none';
    });
}

window.selectTheme = function (value, label) {
    if (currentLabel) currentLabel.textContent = label;
    switchTheme(value);
};

init();
