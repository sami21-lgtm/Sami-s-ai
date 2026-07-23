// 🌟 Modern All-Rounder AI System Instruction
const systemPrompt = {
    role: "system",
    content: "You are Sami AI, a state-of-the-art AI assistant. You can handle any topic seamlessly—including programming, math, science, writing, history, and general conversations. You fluidly respond in Bengali (বাংলা), English, and Banglish based on user preference. Give well-structured, intelligent, and clean answers."
};

let currentChatId = null;
let conversationHistory = [];

document.addEventListener("DOMContentLoaded", () => {
    renderHistoryList();
    loadNewOrLastChat();
});

// Sidebar Toggle Function
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    sidebar.classList.toggle("active");
    backdrop.style.display = sidebar.classList.contains("active") ? "block" : "none";
}

// Enter Key Listener
function handleEnter(event) {
    if (event.key === "Enter") sendMessage();
}

// 📩 Send Message
async function sendMessage(customText = null) {
    const userInput = document.getElementById("userInput");
    const text = customText || userInput.value.trim();

    if (!text) return;

    if (!currentChatId) {
        currentChatId = Date.now().toString();
        conversationHistory = [systemPrompt];
    }

    // Hide welcome screen if active
    removeWelcomeScreen();

    // Render User Message
    appendMessage("user", text);
    userInput.value = "";

    conversationHistory.push({ role: "user", content: text });

    // AI Thinking indicator
    const loadingDiv = appendLoadingState();

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: conversationHistory })
        });

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            const aiReply = data.choices[0].message.content;
            
            updateAiMessage(loadingDiv, aiReply);
            conversationHistory.push({ role: "assistant", content: aiReply });

            // Save to LocalStorage History
            saveChatHistory();
        } else {
            updateAiMessage(loadingDiv, "Response error. Please check your setup.");
        }

    } catch (error) {
        updateAiMessage(loadingDiv, "Error: Network problem or Vercel server issue.");
        console.error(error);
    }
}

// 🎨 UI Rendering Helpers
function removeWelcomeScreen() {
    const welcome = document.querySelector(".welcome-screen");
    if (welcome) welcome.remove();
}

function showWelcomeScreen() {
    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = `
        <div class="welcome-screen">
            <i class="fa-solid fa-brain"></i>
            <h1>What can I help with today?</h1>
            <p>Ask anything in Bangla, English, or Banglish.</p>

            <div class="suggestion-chips">
                <div class="chip" onclick="sendMessage('Write a JavaScript function for array sorting')">💻 Write Code</div>
                <div class="chip" onclick="sendMessage('Explain Quantum Physics in simple terms')">⚛️ Explain Science</div>
                <div class="chip" onclick="sendMessage('আমাকে একটি সুন্দর প্রফেশনাল সিভির ডেমো বানিয়ে দাও')">📄 Create CV Sample</div>
                <div class="chip" onclick="sendMessage('Kivabe Web Development shuru korbo?')">🚀 Career Guide</div>
            </div>
        </div>
    `;
}

function appendMessage(role, text) {
    const chatBox = document.getElementById("chatBox");

    const row = document.createElement("div");
    row.className = `message-row ${role}`;

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.innerHTML = role === "user" ? `<i class="fa-solid fa-user"></i>` : `<i class="fa-solid fa-robot"></i>`;

    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = text;

    row.appendChild(avatar);
    row.appendChild(content);

    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendLoadingState() {
    const chatBox = document.getElementById("chatBox");

    const row = document.createElement("div");
    row.className = "message-row ai";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.innerHTML = `<i class="fa-solid fa-robot"></i>`;

    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = "Sami AI is thinking...";

    row.appendChild(avatar);
    row.appendChild(content);

    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;

    return content;
}

function updateAiMessage(element, text) {
    element.innerHTML = "";
    
    const textSpan = document.createElement("span");
    textSpan.textContent = text;
    element.appendChild(textSpan);

    // Action Buttons (Copy & Speech)
    const actions = document.createElement("div");
    actions.className = "message-actions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "action-btn";
    copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(text);
        copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied`;
        setTimeout(() => copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`, 2000);
    };

    const speakBtn = document.createElement("button");
    speakBtn.className = "action-btn";
    speakBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> Listen`;
    speakBtn.onclick = () => speak(text);

    actions.appendChild(copyBtn);
    actions.appendChild(speakBtn);
    element.appendChild(actions);

    const chatBox = document.getElementById("chatBox");
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 🔊 Text-To-Speech
function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const isBangla = /[\u0980-\u09FF]/.test(text);
        utterance.lang = isBangla ? 'bn-BD' : 'en-US';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

// 📁 LOCAL STORAGE HISTORY SYSTEM
function saveChatHistory() {
    let allChats = JSON.parse(localStorage.getItem("sami_pro_chats") || "{}");
    
    let firstUserMsg = conversationHistory.find(m => m.role === "user")?.content || "New Conversation";

    allChats[currentChatId] = {
        id: currentChatId,
        title: firstUserMsg,
        history: conversationHistory
    };

    localStorage.setItem("sami_pro_chats", JSON.stringify(allChats));
    renderHistoryList();
}

function renderHistoryList() {
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";

    let allChats = JSON.parse(localStorage.getItem("sami_pro_chats") || "{}");
    const chatIds = Object.keys(allChats).reverse();

    if (chatIds.length === 0) {
        historyList.innerHTML = `<div style="font-size: 0.8rem; opacity: 0.5; text-align: center; padding: 10px;">No previous chats</div>`;
        return;
    }

    chatIds.forEach(id => {
        const item = document.createElement("div");
        item.className = `history-item ${id === currentChatId ? 'active' : ''}`;
        
        item.innerHTML = `
            <span><i class="fa-regular fa-message"></i> ${allChats[id].title}</span>
            <button class="delete-chat-btn" onclick="deleteChat(event, '${id}')"><i class="fa-solid fa-trash"></i></button>
        `;

        item.onclick = (e) => {
            if (!e.target.closest('.delete-chat-btn')) {
                loadChatHistory(id);
            }
        };

        historyList.appendChild(item);
    });
}

function loadChatHistory(id) {
    let allChats = JSON.parse(localStorage.getItem("sami_pro_chats") || "{}");
    if (!allChats[id]) return;

    currentChatId = id;
    conversationHistory = allChats[id].history;

    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = "";

    conversationHistory.forEach(msg => {
        if (msg.role === "user") {
            appendMessage("user", msg.content);
        } else if (msg.role === "assistant") {
            const row = document.createElement("div");
            row.className = "message-row ai";
            row.innerHTML = `
                <div class="avatar"><i class="fa-solid fa-robot"></i></div>
                <div class="message-content"></div>
            `;
            chatBox.appendChild(row);
            updateAiMessage(row.querySelector(".message-content"), msg.content);
        }
    });

    renderHistoryList();
    if (document.getElementById("sidebar").classList.contains("active")) {
        toggleSidebar();
    }
}

function createNewChat() {
    currentChatId = null;
    conversationHistory = [];

    const chatBox = document.getElementById("chatBox");
    chatBox.innerHTML = "";
    showWelcomeScreen();

    renderHistoryList();

    if (document.getElementById("sidebar").classList.contains("active")) {
        toggleSidebar();
    }
}

function loadNewOrLastChat() {
    let allChats = JSON.parse(localStorage.getItem("sami_pro_chats") || "{}");
    const chatIds = Object.keys(allChats).reverse();

    if (chatIds.length > 0) {
        loadChatHistory(chatIds[0]);
    } else {
        createNewChat();
    }
}

function deleteChat(event, id) {
    event.stopPropagation();
    let allChats = JSON.parse(localStorage.getItem("sami_pro_chats") || "{}");
    delete allChats[id];
    localStorage.setItem("sami_pro_chats", JSON.stringify(allChats));

    if (id === currentChatId) {
        createNewChat();
    } else {
        renderHistoryList();
    }
}

function clearAllHistory() {
    if (confirm("Are you sure you want to delete all chat history?")) {
        localStorage.removeItem("sami_pro_chats");
        createNewChat();
    }
}
