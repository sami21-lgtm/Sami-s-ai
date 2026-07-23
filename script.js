const systemPrompt = {
    role: "system",
    content: "You are Sami AI, an intelligent, modern AI assistant. You support standard conversation, programming, image analysis, and document reading. Respond fluently in Bangla, English, or Banglish based on user preference."
};

let currentChatId = null;
let conversationHistory = [];
let attachedFile = null; // { type: 'image'|'text', data: '...', name: '...' }

document.addEventListener("DOMContentLoaded", () => {
    renderHistoryList();
    loadNewOrLastChat();
});

function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    sidebar.classList.toggle("active");
    backdrop.style.display = sidebar.classList.contains("active") ? "block" : "none";
}

function handleEnter(event) {
    if (event.key === "Enter") sendMessage();
}

// 📎 File / Image Upload Handling
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    if (file.type.startsWith("image/")) {
        reader.onload = (e) => {
            attachedFile = {
                type: "image",
                data: e.target.result,
                name: file.name
            };
            showFilePreview();
        };
        reader.readAsDataURL(file);
    } else {
        reader.onload = (e) => {
            attachedFile = {
                type: "text",
                data: e.target.result,
                name: file.name
            };
            showFilePreview();
        };
        reader.readAsText(file);
    }
}

function showFilePreview() {
    const container = document.getElementById("filePreviewContainer");
    container.style.display = "flex";

    if (attachedFile.type === "image") {
        container.innerHTML = `
            <div class="file-chip">
                <img src="${attachedFile.data}" alt="Preview">
                <span>${attachedFile.name}</span>
                <i class="fa-solid fa-xmark remove-file-btn" onclick="clearAttachedFile()"></i>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="file-chip">
                <i class="fa-solid fa-file-code"></i>
                <span>${attachedFile.name}</span>
                <i class="fa-solid fa-xmark remove-file-btn" onclick="clearAttachedFile()"></i>
            </div>
        `;
    }
}

function clearAttachedFile() {
    attachedFile = null;
    document.getElementById("fileInput").value = "";
    const container = document.getElementById("filePreviewContainer");
    container.style.display = "none";
    container.innerHTML = "";
}

// 📩 Send Message
async function sendMessage(customText = null) {
    const userInput = document.getElementById("userInput");
    const text = customText || userInput.value.trim();

    if (!text && !attachedFile) return;

    if (!currentChatId) {
        currentChatId = Date.now().toString();
        conversationHistory = [systemPrompt];
    }

    removeWelcomeScreen();

    let userMessageContent = text;
    let apiMessageContent = text;
    let hasImage = false;

    // Process attached file/image
    if (attachedFile) {
        if (attachedFile.type === "image") {
            hasImage = true;
            apiMessageContent = [
                { type: "text", text: text || "What is in this image?" },
                { type: "image_url", image_url: { url: attachedFile.data } }
            ];
            userMessageContent = { text: text, img: attachedFile.data };
        } else if (attachedFile.type === "text") {
            const fileText = `\n\n[Attached File: ${attachedFile.name}]\n\`\`\`\n${attachedFile.data}\n\`\`\``;
            apiMessageContent = (text || "Analyze this file:") + fileText;
            userMessageContent = (text ? text + " " : "") + `📄 [File: ${attachedFile.name}]`;
        }
    }

    // Render User Message in Chat
    appendUserMessage(userMessageContent);

    userInput.value = "";
    clearAttachedFile();

    // Store in API conversation array
    conversationHistory.push({ role: "user", content: apiMessageContent });

    const loadingDiv = appendLoadingState();

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: conversationHistory,
                hasImage: hasImage
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            const aiReply = data.choices[0].message.content;
            updateAiMessage(loadingDiv, aiReply);
            conversationHistory.push({ role: "assistant", content: aiReply });
            saveChatHistory();
        } else {
            updateAiMessage(loadingDiv, "Response error. Please check Groq API setup.");
        }

    } catch (error) {
        updateAiMessage(loadingDiv, "Error connecting to server.");
        console.error(error);
    }
}

// UI Helpers
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
            <p>Ask questions, analyze images, or review code files.</p>

            <div class="suggestion-chips">
                <div class="chip" onclick="sendMessage('Write a JavaScript function for array sorting')">💻 Write Code</div>
                <div class="chip" onclick="sendMessage('Explain Quantum Physics in simple terms')">⚛️ Explain Science</div>
                <div class="chip" onclick="sendMessage('আমাকে একটি সুন্দর প্রফেশনাল সিভির ডেমো বানিয়ে দাও')">📄 Create CV Sample</div>
                <div class="chip" onclick="sendMessage('Kivabe Web Development shuru korbo?')">🚀 Career Guide</div>
            </div>
        </div>
    `;
}

function appendUserMessage(content) {
    const chatBox = document.getElementById("chatBox");
    const row = document.createElement("div");
    row.className = "message-row user";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.innerHTML = `<i class="fa-solid fa-user"></i>`;

    const msgContent = document.createElement("div");
    msgContent.className = "message-content";

    if (typeof content === "object" && content.img) {
        if (content.text) {
            const p = document.createElement("p");
            p.textContent = content.text;
            msgContent.appendChild(p);
        }
        const img = document.createElement("img");
        img.src = content.img;
        img.className = "msg-img-preview";
        msgContent.prepend(img);
    } else {
        msgContent.textContent = content;
    }

    row.appendChild(avatar);
    row.appendChild(msgContent);
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

// Local Storage History System
function saveChatHistory() {
    let allChats = JSON.parse(localStorage.getItem("sami_pro_chats") || "{}");
    
    let firstMsg = conversationHistory.find(m => m.role === "user")?.content;
    let title = "New Conversation";

    if (typeof firstMsg === "string") {
        title = firstMsg.substring(0, 30);
    } else if (Array.isArray(firstMsg)) {
        title = "📷 Image Analysis";
    }

    allChats[currentChatId] = {
        id: currentChatId,
        title: title,
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
            appendUserMessage(msg.content);
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
    clearAttachedFile();

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
