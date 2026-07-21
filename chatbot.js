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
        
        // Exact Working Gemini Model ID on OpenRouter
        MODEL: 'google/gemini-2.5-flash-lite',

        // Google Apps Script Live Calendar Web App Endpoint
        GOOGLE_APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwV1RdADrkMmuWA5DesWU14aC4osMz_S0-hO0XERJkr4N1t-EAcJB4BwszG0fawl2N3Gw/exec'
    };

    /* ── SYSTEM PROMPT (DEMO DENTIST RECEPTIONIST) ── */
    const getSystemPrompt = () => {
        const todayStr = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });

        return `You are a warm, polite, and caring front desk receptionist at DEMO DENTIST. You are a real person, not an AI.

CLINIC INFO & PRICING:
- Clinic Name: DEMO DENTIST
- Location: 5th Avenue, Suite 800, New York, NY 10001, USA
- Phone Number: +1 (212) 555-0199
- Open 24/7 every single day (holidays included).
- Services & Individual Prices:
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

TODAY'S DATE:
- Today is ${todayStr}. Use this to convert relative dates (like "tomorrow" or "Friday") to exact YYYY-MM-DD format in your hidden booking block.

YOUR TONE & PERSONALITY:
- Speak with high etiquette, politeness, and respect (adab and tameez). 
- Use words like "please", "thank you", "perfect", "lovely", "is it alright", "could you kindly".
- NEVER use emojis. No exceptions.
- Keep replies extremely short: 1-2 sentences maximum. Never use bullet points, lists, or markdown formatting.
- If asked why you need info, answer politely:
  - Phone: "Just so we can call or text you if we need to confirm or reschedule."
  - Email: "Just to send you the details and invite for the calendar."

STATE 1: CASUAL CONVERSATION & Q&A
- If user says hi/hello/hey, greet them warmly and ask how you can help. Do NOT ask for booking details yet.
  - Example: "Hey! Welcome to DEMO DENTIST. How can I help you today?"
- If the user says goodbye, bye, or Allah Hafiz, respond politely and warmly: "Goodbye! It was my absolute pleasure chatting with you today. Take care, stay safe, and have a wonderful day! Allah Hafiz!"
- If the user says thanks or thank you:
  - Respond with extreme sweetness and ask: "You are so welcome! It was my absolute pleasure. By the way, were you referred to us by someone?"
- If the user replies YES to the referral question:
  - Apply a 10% discount on the service they booked (Teeth Cleaning becomes $135 instead of $150, Teeth Whitening becomes $315 instead of $350, Root Canal becomes $855 instead of $950, Dental Implants becomes $2,250 instead of $2,500, Extraction becomes $180 instead of $200, Checkup becomes $72 instead of $80).
  - Say: "Awesome! Since you were referred, we'll give you 10% off, making your [Service] $[Discounted Price] instead of $[Original Price]. We look forward to seeing you at DEMO DENTIST!"
- If asked about location, address, or where we are located:
  - Say: "We are located at 5th Avenue, Suite 800, New York, NY 10001, USA. We look forward to welcoming you!"
- If asked about phone number, contact number, or how to call us:
  - Say: "You can reach our front desk directly at +1 (212) 555-0199 anytime!"
- Answer questions (hours, pain, pricing, services, location, phone) briefly without starting the booking flow.

STATE 2: BOOKING FLOW (Triggers ONLY when user explicitly asks to book/schedule)
Collect the following information ONE BY ONE with high respect and tameez:
1. Full Name (e.g. "I can definitely help you book that. What is your full name, please?")
2. Ask if it is their first time:
   - Once they give their name: "Nice to meet you, [Name]. Is this your first time visiting us at DEMO DENTIST?"
3. Phone number:
   - If first time: "Lovely. Could you kindly share your phone number so we can reach you to confirm?"
   - If returning: "Welcome back! Great to have you. Could you kindly confirm your phone number for our records?"
4. Email address (Only ask if they are a first-time patient):
   - "Thank you. Can I also grab your email address to send the booking details?"
5. Service needed:
   - "Got it. And what service do you need to get done, please?"
6. Date & Time:
   - "Alright. What day and time works best for you? We are open 24/7."
   - If they say "tomorrow at 2pm", accept it naturally and say you're checking the slot.

Rules for Booking:
- Ask exactly ONE question at a time. Do NOT combine multiple details or questions.
- If they give info out of order, accept it and move to the next missing piece.
- Once all 6 pieces of information are collected, you MUST output a CHECK block to verify calendar availability:
  - Say: "Let me check the calendar availability for you, one moment please..."
  - The check block format: ###CHECK###{"name":"[Name]","phone":"[Phone]","email":"[Email]","service":"[Service]","date":"YYYY-MM-DD","time":"HH:MM AM/PM"}###END###
- If the user confirms the slot (replies "yes", "please", "confirm", "sure", "ok", "done") AFTER availability is verified:
  - You MUST immediately output the BOOKING block:
  ###BOOKING###{"name":"[Name]","phone":"[Phone]","email":"[Email]","service":"[Service]","date":"YYYY-MM-DD","time":"HH:MM AM/PM"}###END###`;
    };

    /* ── MEMORY STORAGE & TOGGLE (DEFAULT: OFF = FRESH CHAT ON RELOAD) ── */
    const MEMORY_DATA_KEY = 'fida_chat_memory_v2';
    const MEMORY_TOGGLE_KEY = 'fida_memory_on_v2';

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
        btn.className = 'fida-chat-toggle';
        btn.id = 'fida-chat-btn';
        btn.ariaLabel = 'Chat with DEMO DENTIST Receptionist';
        btn.innerHTML = `
            <div class="fida-online-dot"></div>
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
        box.className = 'fida-chat-box light-mode';
        box.id = 'fida-chat-window';
        box.innerHTML = `
            <div class="fida-chat-header">
                <div class="fida-chat-avatar">
                    <span class="avatar-icon">🦷</span>
                    <span class="avatar-status"></span>
                </div>
                <div class="fida-chat-title">
                    <h4>DEMO DENTIST <span class="sparkle">✨</span></h4>
                    <p>Receptionist • Dental Clinic</p>
                </div>
                <div class="fida-header-controls">
                    <button class="fida-memory-toggle-btn ${state.isMemoryOn ? 'memory-active' : ''}" id="fida-memory-btn" aria-label="Toggle Memory Mode" title="${state.isMemoryOn ? 'Memory Mode: ON' : 'Memory Mode: OFF'}">
                        <svg viewBox="0 0 24 24" class="memory-icon">
                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"></path>
                            <circle cx="12" cy="12" r="3.5"></circle>
                        </svg>
                        <span class="memory-dot"></span>
                    </button>
                    <button class="fida-close-trigger" id="fida-close-btn" aria-label="Close Chat">
                        <svg viewBox="0 0 24 24">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="fida-chat-body" id="fida-chat-body">
                <!-- Render conversation history -->
            </div>

            <div class="fida-chat-footer">
                <input type="text" class="fida-chat-input" id="fida-chat-input" placeholder="Ask DEMO DENTIST anything..." autocomplete="off" />
                <button class="fida-chat-send" id="fida-chat-send-btn" aria-label="Send">
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
        document.getElementById('fida-close-btn').addEventListener('click', toggleChat);
        document.getElementById('fida-memory-btn').addEventListener('click', handleMemoryToggle);

        const inputEl = document.getElementById('fida-chat-input');
        const sendBtn = document.getElementById('fida-chat-send-btn');

        sendBtn.addEventListener('click', handleSend);
        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    function handleMemoryToggle() {
        state.isMemoryOn = !state.isMemoryOn;
        const memoryBtn = document.getElementById('fida-memory-btn');

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
        const box = document.getElementById('fida-chat-window');
        const btn = document.getElementById('fida-chat-btn');
        if (state.isOpen) {
            box.classList.add('active');
            btn.classList.add('active');
            setTimeout(() => document.getElementById('fida-chat-input').focus(), 200);
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
        const inputEl = document.getElementById('fida-chat-input');
        const sendBtn = document.getElementById('fida-chat-send-btn');
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
        const body = document.getElementById('fida-chat-body');
        if (!body) return;

        body.innerHTML = '';
        state.messages.forEach(msg => {
            if (!msg.content) return;
            const div = document.createElement('div');
            div.className = `fida-msg ${msg.role === 'user' ? 'user' : 'bot'}`;
            
            // Clean any hidden JSON or trigger blocks before rendering
            let cleanText = msg.content
                .replace(/###CHECK###[\s\S]*?(?:###END###|$)/g, '')
                .replace(/###BOOKING###[\s\S]*?(?:###END###|$)/g, '')
                .replace(/```json[\s\S]*?```/g, '')
                .trim();

            if (cleanText) {
                div.innerHTML = `<div class="fida-bubble">${escapeHTML(cleanText)}</div>`;
                body.appendChild(div);
            }
        });

        body.scrollTop = body.scrollHeight;
    }

    function showTyping() {
        const body = document.getElementById('fida-chat-body');
        if (!body) return;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'fida-msg bot';
        typingDiv.id = 'fida-typing';
        typingDiv.innerHTML = `
            <div class="fida-typing-dots">
                <span></span><span></span><span></span>
            </div>
        `;
        body.appendChild(typingDiv);
        body.scrollTop = body.scrollHeight;
    }

    function hideTyping() {
        const el = document.getElementById('fida-typing');
        if (el) el.remove();
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
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

    /* ── API CHAT COMPLETIONS CALLER WITH KEY FALLBACK ── */
    async function fetchAIResponse(userMessages, apiKeyToUse) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKeyToUse}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: CONFIG.MODEL,
                messages: [
                    { role: 'system', content: getSystemPrompt() },
                    ...userMessages.slice(-6).map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content
                }))
            ],
            temperature: 0.3,
            max_tokens: 100
        })
        });

        if (!response.ok) {
            throw new Error(`OpenRouter HTTP ${response.status}`);
        }

        return await response.json();
    }

    /* ── MAIN CHAT & IN-PLACE APPOINTMENT PROCESSOR ── */
    async function handleSend() {
        if (state.isThinking) return;

        const inputEl = document.getElementById('fida-chat-input');
        const text = inputEl.value.trim();
        if (!text) return;

        inputEl.value = '';
        state.messages.push({ role: 'user', content: text });
        saveMemory(state.messages);
        renderMessages();

        state.isThinking = true;
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

            hideTyping();
            state.isThinking = false;

            if (data && data.choices && data.choices[0] && data.choices[0].message) {
                let botReply = data.choices[0].message.content || '';
                
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

                        // Set in-place message text in same bubble
                        state.messages[state.messages.length - 1].content = "Let me check the calendar availability for you, one moment please...";
                        renderMessages();

                        showTyping();
                        state.isThinking = true;

                        const gasResult = await postToGoogleAppsScript({ action: 'check', clinic: 'DEMO DENTIST', location: '5th Avenue, Suite 800, New York, NY 10001, USA', date: checkData.date, time: checkData.time });
                        
                        hideTyping();
                        state.isThinking = false;

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
                        state.isThinking = true;

                        const gasResult = await postToGoogleAppsScript({ 
                            action: 'book', 
                            clinic: 'DEMO DENTIST', 
                            location: 'DEMO DENTIST', 
                            bookedVia: 'DEMO DENTIST CHATBOT', 
                            ...bookingData 
                        });

                        hideTyping();
                        state.isThinking = false;

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
            hideTyping();
            state.isThinking = false;
            console.error('Chatbot Processing Error:', err);
            state.messages.push({ role: 'assistant', content: "I am so sorry, I ran into a brief connection glitch. Could you kindly try again in a moment, please?" });
            saveMemory(state.messages);
            renderMessages();
        }
    }

    /* ── BOOTSTRAP ── */
    window.addEventListener('DOMContentLoaded', injectChatbotDOM);
})();
