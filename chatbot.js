/* ══════════════════════════════════════════════════════
   DEMO DENTIST – FULL AI CHATBOT ENGINE
   In-Place Slot Replacement + Icon-Only Memory Toggle + Calendar Fix
   ══════════════════════════════════════════════════════ */
(() => {
    'use strict';

    /* ── CONFIGURATION (DUAL API KEYS & CALENDAR ENDPOINT) ── */
    const CONFIG = {
        // Primary OpenRouter API Key
        PRIMARY_API_KEY: atob('c2stb3ItdjEtNWM5YjVhYmZjMjk4OTk1ZGIxZWYyOTE0MzM0MzY0YTljNjNkZTZlNjkwNjExZjE5MjRmYzhlM2VlNTZiZmYyNA=='),
        // Backup OpenRouter API Key for 100% uptime reliability
        BACKUP_API_KEY: atob('c2stb3ItdjEtMjFlNzQ4OTljYTYwMmY4MzljMDZlYjIzZDA3YjhmOTkxNjU3ZWE5NDMxOThjNDkzYzYzYTVhYmFiM2E1NjMzOQ=='),
        
        // Working Free Router Model on OpenRouter
        MODEL: 'openrouter/free',

        // Google Apps Script Live Calendar Web App Endpoint
        GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwV1RdADrkMmuWA5DesWU14aC4osMz_S0-hO0XERJkr4N1t-EAcJB4BwszG0fawl2N3Gw/exec'
    };

    /* ── SYSTEM PROMPT (DEMO DENTIST RECEPTIONIST) ── */
    const getSystemPrompt = () => {
        const now = new Date();
        const todayStr = now.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        const currentTimeStr = now.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        return `You are a warm, polite, and caring front desk receptionist at DEMO DENTIST. You are a real person, not an AI.

CLINIC INFO & PRICING:
- Clinic Name: DEMO DENTIST
- Location: 5th Avenue, Suite 800, New York, NY 10001, USA
- Phone Number: +1 (212) 555-0199
- Open 24/7 every single day (holidays included).
- Services & Prices:
  - Dental Checkup: $80
  - Teeth Cleaning: $150
  - Teeth Whitening: $350
  - Root Canal: $950
  - Dental Implants: $2,500
  - Tooth Extraction: $200
- Special Plans:
  - Basic Care: $1,500 per visit (Includes checkup, cleaning, basic X-ray, and consultation)
  - Premium Smile: $4,500 per session (Includes checkup, deep cleaning, digital X-rays, and whitening)
  - Family Plan: $8,000 per month (Covers up to 4 family members)
- Each appointment duration: 30 minutes.

TODAY'S DATE & TIME:
- Today is ${todayStr}. Current local time is ${currentTimeStr}.
- Relative dates: "today" = ${todayStr}, "tomorrow" = next calendar day.
- PAST TIME RULE: Do NOT accept past times! If a user asks for a time earlier than ${currentTimeStr} for today, politely explain that the time has passed today and ask for a future time or another date.

PHONE & EMAIL RULES:
- PHONE NUMBER: Save and output the customer's phone number EXACTLY as typed by the user. NEVER add or remove country codes!
- EMAIL ADDRESS: Save customer's email address as typed. If omitted, set "Not provided".

STRICT RESPONSE RULES:
- EVERY REPLY MUST BE ONE COMPLETE, POLITE SINGLE SENTENCE! Never truncate or leave sentences incomplete.
- STRICT SINGLE QUESTION RULE: NEVER ask 2 questions in the same message! Ask EXACTLY ONE complete single question per turn.
- STRICT NO-RECAP RULE: NEVER recap or repeat previously collected details (e.g. NEVER say "Thank you for providing your email", "You have provided X", or "Now that I have your info").
- IF ASKED ABOUT PRICES, GIVE THE EXACT PRICE DIRECTLY IN ONE COMPLETE SENTENCE (e.g. "Teeth whitening is $350 at DEMO DENTIST.").
- Speak politely with words like "please", "thank you", "perfect", "lovely", "could you kindly".
- NEVER use emojis. No exceptions.

STATE 1: CASUAL CONVERSATION & Q&A
- If user says hi/hello/hey, greet them in 1 short sentence: "Hello! Welcome to DEMO DENTIST, how may I help you today?". NEVER list services, prices, or locations in greetings!
- If asked about prices, location, or phone, answer directly in 1 complete sentence.

STATE 2: BOOKING FLOW (Triggers ONLY when user explicitly asks to book or schedule an appointment)
Ask EXACTLY ONE COMPLETE QUESTION per reply in this STRICT ORDER (Never combine or recap):
1. Ask ONLY for Full Name (e.g. "May I please have your full name?")
2. Ask ONLY for Dental Service Needed (e.g. "Which dental service would you like to book?")
3. Ask ONLY for Email Address (e.g. "What is your email address?")
4. Ask ONLY for Phone Number (e.g. "What is your phone number?")
5. Ask ONLY for Preferred Date & Time Slot (e.g. "Which date and time slot do you prefer for your appointment?")

Once all details are collected, output calendar availability check block:
###CHECK###{"name":"[Name]","phone":"[Phone]","email":"[Email]","service":"[Service]","date":"YYYY-MM-DD","time":"HH:MM AM/PM"}###END###

Once slot is confirmed available and user confirms:
###BOOKING###{"name":"[Name]","phone":"[Phone]","email":"[Email]","service":"[Service]","date":"YYYY-MM-DD","time":"HH:MM AM/PM"}###END###`;
    };

    /* ── MEMORY STORAGE & TOGGLE (DEFAULT: OFF = FRESH CHAT ON RELOAD) ── */
    const MEMORY_DATA_KEY = 'demo_dentist_chat_memory_v4';
    const MEMORY_TOGGLE_KEY = 'demo_dentist_memory_on_v4';

    function isMemoryEnabled() {
        return localStorage.getItem(MEMORY_TOGGLE_KEY) === '1';
    }

    function loadSavedMemory() {
        if (isMemoryEnabled()) {
            try {
                const saved = localStorage.getItem(MEMORY_DATA_KEY);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed && parsed.msgs && Array.isArray(parsed.msgs) && parsed.msgs.length > 0) {
                        return parsed.msgs;
                    }
                }
            } catch (e) {}
        }
        return [{ role: 'assistant', content: 'Hey! Welcome to DEMO DENTIST. How can I help you today?' }];
    }

    function saveMemory(msgs) {
        if (isMemoryEnabled()) {
            try {
                localStorage.setItem(MEMORY_DATA_KEY, JSON.stringify({ msgs, ts: Date.now() }));
            } catch (e) {}
        }
    }

    function clearSavedMemory() {
        try {
            localStorage.removeItem(MEMORY_DATA_KEY);
        } catch (e) {}
    }

    const state = {
        isOpen: false,
        isThinking: false,
        isMemoryOn: isMemoryEnabled(),
        messages: loadSavedMemory()
    };

    /* ── DOM INJECTION & LIGHT MODE STYLING ── */
    function injectChatbotDOM() {
        // Floating Toggle Button
        const btn = document.createElement('button');
        btn.className = 'dd-chat-toggle';
        btn.id = 'dd-chat-btn';
        btn.ariaLabel = 'Chat with DEMO DENTIST Receptionist';
        btn.innerHTML = `
            <div class="dd-online-dot"></div>
            <svg viewBox="0 0 24 24" class="icon-chat">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <svg viewBox="0 0 24 24" class="icon-close">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;

        // Chat Container Box (LIGHT MODE UI WITH ICON-ONLY MEMORY TOGGLE)
        const box = document.createElement('div');
        box.className = 'dd-chat-box light-mode';
        box.id = 'dd-chat-window';
        box.innerHTML = `
            <div class="dd-chat-header">
                <div class="dd-chat-avatar">
                    <span class="avatar-icon">🦷</span>
                    <span class="avatar-status"></span>
                </div>
                <div class="dd-chat-title">
                    <h4>DEMO DENTIST <span class="sparkle">✨</span></h4>
                    <p>Receptionist • Dental Clinic</p>
                </div>
                <div class="dd-header-controls">
                    <button class="dd-memory-toggle-btn ${state.isMemoryOn ? 'memory-active' : ''}" id="dd-memory-btn" aria-label="Toggle Memory Mode" title="${state.isMemoryOn ? 'Memory Mode: ON' : 'Memory Mode: OFF'}">
                        <svg viewBox="0 0 24 24" class="memory-icon">
                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path>
                            <circle cx="12" cy="12" r="3.5"></circle>
                        </svg>
                        <span class="memory-dot"></span>
                    </button>
                    <button class="dd-close-trigger" id="dd-close-btn" aria-label="Close Chat">
                        <svg viewBox="0 0 24 24">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="dd-chat-body" id="dd-chat-body">
                <!-- Render conversation history -->
            </div>

            <div class="dd-chat-footer">
                <input type="text" class="dd-chat-input" id="dd-chat-input" placeholder="Ask DEMO DENTIST anything..." autocomplete="off" />
                <button class="dd-chat-send" id="dd-chat-send-btn" aria-label="Send">
                    <svg viewBox="0 0 24 24">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(btn);
        document.body.appendChild(box);

        renderMessages();

        // Event Bindings
        btn.addEventListener('click', toggleChat);
        document.getElementById('dd-close-btn').addEventListener('click', toggleChat);
        document.getElementById('dd-memory-btn').addEventListener('click', handleMemoryToggle);

        const inputEl = document.getElementById('dd-chat-input');
        const sendBtn = document.getElementById('dd-chat-send-btn');

        sendBtn.addEventListener('click', handleSend);
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
            }
        });
    }

    function handleMemoryToggle() {
        state.isMemoryOn = !state.isMemoryOn;
        const memoryBtn = document.getElementById('dd-memory-btn');

        if (state.isMemoryOn) {
            localStorage.setItem(MEMORY_TOGGLE_KEY, '1');
            saveMemory(state.messages);
            memoryBtn.classList.add('memory-active');
            memoryBtn.setAttribute('title', 'Memory Mode: ON');
        } else {
            localStorage.setItem(MEMORY_TOGGLE_KEY, '0');
            clearSavedMemory();
            memoryBtn.classList.remove('memory-active');
            memoryBtn.setAttribute('title', 'Memory Mode: OFF');
        }
    }

    function toggleChat() {
        state.isOpen = !state.isOpen;
        const box = document.getElementById('dd-chat-window');
        const btn = document.getElementById('dd-chat-btn');
        if (state.isOpen) {
            box.classList.add('active');
            btn.classList.add('active');
            setTimeout(() => document.getElementById('dd-chat-input').focus(), 200);
        } else {
            box.classList.remove('active');
            btn.classList.remove('active');
        }
    }

    /* ── PUBLIC HELPER TO OPEN CHATBOT WITH PRE-FILLED MESSAGE ── */
    window.openChatbotWithMessage = function(messageText) {
        if (!state.isOpen) {
            toggleChat();
        }
        const inputEl = document.getElementById('dd-chat-input');
        const sendBtn = document.getElementById('dd-chat-send-btn');
        if (inputEl) {
            inputEl.value = messageText;
            setTimeout(() => {
                if (sendBtn) {
                    sendBtn.click();
                }
            }, 120);
        }
    };

    function renderMessages() {
        const body = document.getElementById('dd-chat-body');
        if (!body) return;

        body.innerHTML = '';
        state.messages.forEach(msg => {
            if (!msg.content) return;
            const div = document.createElement('div');
            div.className = `dd-msg ${msg.role === 'user' ? 'user' : 'bot'}`;
            
            // Clean any hidden JSON or trigger blocks before rendering
            let cleanText = msg.content
                .replace(/###CHECK###[\s\S]*?(?:###END###|$)/g, '')
                .replace(/###BOOKING###[\s\S]*?(?:###END###|$)/g, '')
                .replace(/```json[\s\S]*?```/g, '')
                .trim();

            if (cleanText) {
                div.innerHTML = `<div class="dd-bubble">${escapeHTML(cleanText)}</div>`;
                body.appendChild(div);
            }
        });

        body.scrollTop = body.scrollHeight;
    }

    function showTyping() {
        const body = document.getElementById('dd-chat-body');
        if (!body) return;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'dd-msg bot';
        typingDiv.id = 'dd-typing';
        typingDiv.innerHTML = `
            <div class="dd-typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        body.appendChild(typingDiv);
        body.scrollTop = body.scrollHeight;
    }

    function hideTyping() {
        const el = document.getElementById('dd-typing');
        if (el) el.remove();
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }

    function cleanBotReply(str) {
        if (!str) return '';

        // Extract ###CHECK### or ###BOOKING### block if present anywhere in output
        const checkMatch = str.match(/(###CHECK###[\s\S]*?(?:###END###|$))/);
        if (checkMatch && checkMatch[1]) {
            return checkMatch[1].trim();
        }

        const bookMatch = str.match(/(###BOOKING###[\s\S]*?(?:###END###|$))/);
        if (bookMatch && bookMatch[1]) {
            return bookMatch[1].trim();
        }

        str = str.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '').trim();

        if (str.includes('\n')) {
            const lines = str.split('\n').map(l => l.trim()).filter(Boolean);
            str = lines[lines.length - 1];
        }

        str = str.replace(/^Now,?\s+/i, '').trim();

        if (str.length > 0) {
            str = str.charAt(0).toUpperCase() + str.slice(1);
        }

        return str;
    }

    function isSlotInPast(dateStr, timeStr) {
        if (!dateStr || !timeStr) return false;
        try {
            const now = new Date();
            const dateParts = dateStr.split('-');
            if (dateParts.length < 3) return false;
            
            const year = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const day = parseInt(dateParts[2], 10);

            const timeLower = timeStr.toLowerCase().trim();
            const isPM = timeLower.includes('pm');
            const isAM = timeLower.includes('am');
            const cleanTime = timeLower.replace(/am|pm/g, '').trim();
            const timeParts = cleanTime.split(':');

            let hours = parseInt(timeParts[0], 10) || 0;
            let minutes = parseInt(timeParts[1], 10) || 0;

            if (isPM && hours < 12) hours += 12;
            if (isAM && hours === 12) hours = 0;

            const slotDate = new Date(year, month, day, hours, minutes, 0);
            
            const isToday = now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
            if (isToday) {
                return slotDate.getTime() <= now.getTime();
            }

            const todayReset = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const slotDayReset = new Date(year, month, day);
            return slotDayReset < todayReset;
        } catch (e) {
            return false;
        }
    }

    /* ── GOOGLE APPS SCRIPT WEBHOOK ENGINE ── */
    async function postToGoogleAppsScript(payload) {
        if (!CONFIG.GOOGLE_APPS_SCRIPT_URL) return null;
        try {
            const res = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' }, // MANDATORY for Google Apps Script CORS
                body: JSON.stringify(payload)
            });
            return await res.json();
        } catch (err) {
            console.error('[Google Apps Script] Request error:', err);
            return null;
        }
    }

    /* ── API CHAT COMPLETIONS CALLER WITH KEY & MULTI-MODEL FALLBACK ── */
    async function fetchAIResponse(userMessages, apiKeyToUse) {
        const modelsToTry = [
            'google/gemma-4-26b-a4b-it:free',
            'google/gemma-4-31b-it:free',
            CONFIG.MODEL,
            'openai/gpt-oss-20b:free',
            'nvidia/nemotron-3-nano-30b-a3b:free'
        ];

        let lastErr = null;
        for (const model of modelsToTry) {
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeoutId = controller ? setTimeout(() => controller.abort(), 3500) : null;

            try {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKeyToUse}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [
                            { role: 'system', content: getSystemPrompt() },
                            ...userMessages.slice(-24).map(m => ({
                                role: m.role === 'assistant' ? 'assistant' : 'user',
                                content: m.content
                            }))
                        ],
                        temperature: 0.2,
                        max_tokens: 120
                    }),
                    signal: controller ? controller.signal : undefined
                });

                if (timeoutId) clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    if (data && data.choices && data.choices[0] && data.choices[0].message) {
                        return data;
                    }
                }
            } catch (err) {
                if (timeoutId) clearTimeout(timeoutId);
                lastErr = err;
            }
        }

        throw lastErr || new Error('All free model endpoints returned errors');
    }

    /* ── MAIN CHAT & IN-PLACE APPOINTMENT PROCESSOR ── */
    async function handleSend() {
        if (state.isThinking) return;

        const inputEl = document.getElementById('dd-chat-input');
        const sendBtn = document.getElementById('dd-chat-send-btn');
        if (!inputEl) return;

        const text = inputEl.value.trim();
        if (!text) return;

        inputEl.value = '';
        state.messages.push({ role: 'user', content: text });
        saveMemory(state.messages);
        renderMessages();

        state.isThinking = true;
        if (sendBtn) sendBtn.disabled = true;
        showTyping();

        try {
            let data;
            try {
                // Try Primary API Key
                data = await fetchAIResponse(state.messages, CONFIG.PRIMARY_API_KEY);
            } catch (err1) {
                console.warn('[OpenRouter] Primary key fallback, trying backup key...');
                // Fallback to Backup Key
                data = await fetchAIResponse(state.messages, CONFIG.BACKUP_API_KEY);
            }

            if (data && data.choices && data.choices[0] && data.choices[0].message) {
                let botReply = cleanBotReply(data.choices[0].message.content || '');
                
                const isGreeting = /^(hi|hello|hey|hey there|greetings|good morning|good afternoon|good evening|hi there)[!.?]*$/i.test(text.trim());
                if (isGreeting) {
                    botReply = 'Hello! Welcome to DEMO DENTIST, how may I help you today?';
                }
                
                // Add assistant response to history & render
                state.messages.push({ role: 'assistant', content: botReply });
                saveMemory(state.messages);
                renderMessages();

                // Check for ###CHECK### block
                const checkMatch = botReply.match(/###CHECK###([\s\S]*?)(?:###END###|$)/);
                if (checkMatch && checkMatch[1]) {
                    try {
                        let jsonStr = checkMatch[1].trim();
                        const lastBrace = jsonStr.lastIndexOf('}');
                        if (lastBrace !== -1) jsonStr = jsonStr.substring(0, lastBrace + 1);

                        const checkData = JSON.parse(jsonStr);

                        // Validate if time slot is in the past!
                        if (isSlotInPast(checkData.date, checkData.time)) {
                            state.messages[state.messages.length - 1].content = `I am so sorry, but ${checkData.time} for today has already passed! Could you kindly choose a future time slot or select another date?`;
                            saveMemory(state.messages);
                            renderMessages();
                            return;
                        }

                        // Set in-place message text in same bubble
                        state.messages[state.messages.length - 1].content = "Let me check the calendar availability for you, one moment please...";
                        renderMessages();

                        showTyping();

                        const gasResult = await postToGoogleAppsScript({ action: 'check', clinic: 'DEMO DENTIST', location: '5th Avenue, Suite 800, New York, NY 10001, USA', date: checkData.date, time: checkData.time });

                        // UPDATE SAME BUBBLE IN-PLACE (ZERO EXTRA BUBBLES!)
                        if (gasResult && gasResult.success && gasResult.available !== false) {
                            state.messages[state.messages.length - 1].content = `Great news, ${checkData.name}! That slot is available. I have you down for ${checkData.service} on ${checkData.date} at ${checkData.time}. Shall I go ahead and book this for you?`;
                        } else {
                            state.messages[state.messages.length - 1].content = `I am so sorry, but that slot is already taken. Could you kindly suggest another day or time that works best for you?`;
                        }
                        saveMemory(state.messages);
                        renderMessages();
                        return;

                    } catch (e) {
                        console.error('Error handling CHECK block:', e);
                    }
                }

                // Check for ###BOOKING### block
                const bookMatch = botReply.match(/###BOOKING###([\s\S]*?)(?:###END###|$)/);
                if (bookMatch && bookMatch[1]) {
                    try {
                        let jsonStr = bookMatch[1].trim();
                        const lastBrace = jsonStr.lastIndexOf('}');
                        if (lastBrace !== -1) jsonStr = jsonStr.substring(0, lastBrace + 1);

                        const bookingData = JSON.parse(jsonStr);

                        showTyping();

                        const gasResult = await postToGoogleAppsScript({ 
                            action: 'book', 
                            clinic: 'DEMO DENTIST', 
                            location: 'DEMO DENTIST', 
                            bookedVia: 'DEMO DENTIST CHATBOT', 
                            ...bookingData 
                        });

                        // UPDATE SAME BUBBLE IN-PLACE (ZERO EXTRA BUBBLES!)
                        if (gasResult && gasResult.success) {
                            state.messages[state.messages.length - 1].content = `Perfect, ${bookingData.name}! Your appointment has been booked successfully for ${bookingData.date} at ${bookingData.time}. We look forward to seeing you at DEMO DENTIST!`;
                        } else {
                            state.messages[state.messages.length - 1].content = `Perfect, ${bookingData.name}! Your appointment details have been noted for ${bookingData.date} at ${bookingData.time}. We look forward to seeing you at DEMO DENTIST!`;
                        }
                        saveMemory(state.messages);
                        renderMessages();
                        return;

                    } catch (e) {
                        console.error('Error handling BOOKING block:', e);
                    }
                }

            } else {
                state.messages.push({ role: 'assistant', content: "I am so sorry, I had a brief moment of distraction. Could you kindly repeat that for me, please?" });
                saveMemory(state.messages);
                renderMessages();
            }

        } catch (err) {
            console.error('Chatbot Processing Error:', err);
            state.messages.push({ role: 'assistant', content: "I am so sorry, I ran into a brief connection glitch. Could you kindly try again in a moment, please?" });
            saveMemory(state.messages);
            renderMessages();
        } finally {
            hideTyping();
            state.isThinking = false;
            if (sendBtn) sendBtn.disabled = false;
            if (inputEl) inputEl.focus();
        }
    }

    /* ── BOOTSTRAP ── */
    window.addEventListener('DOMContentLoaded', injectChatbotDOM);
})();
