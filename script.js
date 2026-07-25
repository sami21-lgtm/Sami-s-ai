const systemPrompt = {
    role: "system",
    content: "You are Sami AI, an advanced, highly intelligent AI assistant (similar to ChatGPT and Gemini). You excel in standard conversation, coding, highly detailed image analysis, document comprehension (PDF, Word, PowerPoint, Text), and creating detailed prompts. Respond fluently in Bangla, English, or Banglish based on user preference. Keep your explanations clear, structured, and easy to understand."
};

let currentChatId = null;
let conversationHistory = [];
let attachedFile = null;

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

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
    });
}

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const container = document.getElementById("filePreviewContainer");
    container.style.display = "flex";
    container.innerHTML = `<div class="file-chip"><i class="fa-solid fa-spinner fa-spin"></i> Reading ${file.name}...</div>`;

    try {
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    const canvas = document.createElement("canvas");
                    let width = img.width;
                    let height = img.height;
                    
                    // রেজুলেশন ৮০০ করা হয়েছে যেন লেখা স্পষ্ট থাকে
                    const maxDim = 800; 

                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext("2d");
                    ctx.drawImage(img, 0, 0, width, height);

                    // কোয়ালিটি 0.7 করা হয়েছে যেন ব্যালেন্স থাকে (স্পষ্টতা এবং সাইজ)
                    const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

                    attachedFile = {
                        type: "image",
                        data: compressedBase64,
                        name: file.name,
                        ext: "img"
                    };
                    showFilePreview();
                };
            };
            reader.readAsDataURL(file);
        } 
        else if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
            await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js");
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(" ");
                fullText += `\n--- Page ${i} ---\n${pageText}\n`;
            }

            attachedFile = {
                type: "document",
                data: fullText || "No readable text found in PDF.",
                name: file.name,
                ext: "pdf"
            };
            showFilePreview();
        } 
        else if (fileName.endsWith(".docx")) {
            await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });

            attachedFile = {
                type: "document",
                data: result.value || "No text found in Word document.",
                name: file.name,
                ext: "docx"
            };
            showFilePreview();
        } 
        else if (fileName.endsWith(".pptx")) {
            await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);
            let fullText = "";
            let slideNum = 1;

            for (let filename in zip.files) {
                if (filename.startsWith("ppt/slides/slide") && filename.endsWith(".xml")) {
                    const xmlText = await zip.files[filename].async("string");
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
                    const textNodes = xmlDoc.getElementsByTagName("a:t");
                    let slideText = Array.from(textNodes).map(node => node.textContent).join(" ");
                    fullText += `\n--- Slide ${slideNum} ---\n${slideText}\n`;
                    slideNum++;
                }
            }

            attachedFile = {
                type: "document",
                data: fullText || "No readable text found in presentation slides.",
                name: file.name,
                ext: "pptx"
            };
            showFilePreview();
        } 
        else {
            const reader = new FileReader();
            reader.onload = (e) => {
                attachedFile = {
                    type: "text",
                    data: e.target.result,
                    name: file.name,
                    ext: "txt"
                };
                showFilePreview();
            };
            reader.readAsText(file);
        }
    } catch (err) {
        console.error("File reading error:", err);
        alert("Failed to read the file. Please try another file.");
        clearAttachedFile();
    }
}

function showFilePreview() {
    const container = document.getElementById("filePreviewContainer");
    container.style.display = "flex";

    let iconClass = "fa-file-lines";
    if (attachedFile.ext === "pdf") iconClass = "fa-file-pdf";
    else if (attachedFile.ext === "docx") iconClass = "fa-file-word";
    else if (attachedFile.ext === "pptx") iconClass = "fa-file-powerpoint";

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
                <i class="fa-solid ${iconClass}"></i>
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

    if (attachedFile) {
        if (attachedFile.type === "image") {
            hasImage = true;
            
            // ভাষা অনুযায়ী উত্তর দেওয়ার কড়া নির্দেশ যুক্ত করা হয়েছে
            const imageInstruction = "ছবিতে থাকা প্রশ্নগুলো আগে খুব মনোযোগ দিয়ে পড়ো। এরপর সবগুলো MCQ বা প্রশ্নের সঠিক উত্তর দাও। যে ভাষার প্রশ্ন, ঠিক সেই ভাষাতেই উত্তর ও ব্যাখ্যা দেবে (ইংরেজি প্রশ্ন হলে ইংরেজিতে, বাংলা প্রশ্ন হলে বাংলায়)। উত্তরের ফরম্যাট হবে: প্রথমে সঠিক অপশন (যেমন: ১. ক / 1. a) এবং তারপর কেন এটি সঠিক তার একটি ছোট ও সহজ ব্যাখ্যা। যদি কোনো প্রশ্ন বুঝতে না পারো, তাহলে বানিয়ে বলবে না, সোজা বলে দেবে যে প্রশ্নটি অস্পষ্ট।";
            
            apiMessageContent = [
                { type: "text", text: text || imageInstruction },
                { type: "image_url", image_url: { url: attachedFile.data } }
            ];
            userMessageContent = { text: text, img: attachedFile.data };
        } else if (attachedFile.type === "document" || attachedFile.type === "text") {
            const documentPrompt = `\n\n[📄 Attached Document (${attachedFile.name}) Content]:\n\`\`\`\n${attachedFile.data}\n\`\`\``;
            apiMessageContent = (text || "Analyze and summarize the contents of this document in detail:") + documentPrompt;
            userMessageContent = (text ? text + " " : "") + `📄 [File: ${attachedFile.name}]`;
        }
    }

    appendUserMessage(userMessageContent);

    userInput.value = "";
    clearAttachedFile();

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

        if (response.ok && data.choices && data.choices[0]) {
            const aiReply = data.choices[0].message.content;
            updateAiMessage(loadingDiv, aiReply);
            conversationHistory.push({ role: "assistant", content: aiReply });
            saveChatHistory();
        } else {
            const errorDetails = data.error?.message || data.error || "Response error. Please check your API setup.";
            updateAiMessage(loadingDiv, `⚠️ **API Error:** ${errorDetails}`);
        }

    } catch (error) {
        updateAiMessage(loadingDiv, "⚠️ Error connecting to server.");
        console.error(error);
    }
}

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
            <p>Ask questions, analyze images, or review PDF/Word/PPTX files.</p>

            <div class="suggestion-chips">
                <div class="chip" onclick="sendMessage('Write a JavaScript function for array sorting')">💻 Write Code</div>
                <div class="chip" onclick="sendMessage('Explain Quantum Physics in simple terms')">⚛️ Explain Science</div>
                <div class="chip" onclick="sendMessage('আমাকে একটি সুন্দর প্রফেশনাল সিভির ডেমো বানিয়ে দাও')">📄 Create CV Sample</div>
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
    
    if (window.marked) {
        element.innerHTML = marked.parse(text);
    } else {
        const textSpan = document.createElement("span");
        textSpan.textContent = text;
        element.appendChild(textSpan);
    }

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
        const cleanText = text.replace(/[*_#`~]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        const isBangla = /[\u0980-\u09FF]/.test(cleanText);
        utterance.lang = isBangla ? 'bn-BD' : 'en-US';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

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
    if (!historyList) return;
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
    if (document.getElementById("sidebar")?.classList.contains("active")) {
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

    if (document.getElementById("sidebar")?.classList.contains("active")) {
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
