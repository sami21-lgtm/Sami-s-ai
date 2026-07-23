// 🌟 Ultra-Powerful Multi-talented AI System Instruction
const systemPrompt = {
    role: "system",
    content: "You are an intelligent AI assistant developed for Md. Emtiaz Hossain Sami. You can answer any query including programming, math, science, history, creative writing, advice, and everyday context. You seamlessly understand and reply in Bengali (বাংলা), English, and Banglish based on user input. Keep responses natural, concise, and helpful."
};

let conversationHistory = [systemPrompt];

// ⌨️ HTML Inline Event Handler - Enter Key Listener
function handleEnter(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

// 📩 HTML Inline Event Handler - Send Message Function
async function sendMessage() {
    const userInput = document.getElementById("userInput");
    const text = userInput.value.trim();

    if (!text) return;

    // Show User Message
    appendUserMessage(text);
    userInput.value = "";

    conversationHistory.push({ role: "user", content: text });

    // Show AI Loading State
    const loadingDiv = appendAiLoadingMessage();

    try {
        // 🔒 ekhane amra amader nijer backend API (/api/chat) call korchi
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: conversationHistory
            })
        });

        const data = await response.json();

        if (data.choices && data.choices[0]) {
            const aiReply = data.choices[0].message.content;
            
            // Render AI output with Listen Button
            updateAiMessage(loadingDiv, aiReply);
            
            conversationHistory.push({ role: "assistant", content: aiReply });
        } else {
            updateAiMessage(loadingDiv, "Response pete somoshya hocche. API Key check koruk.");
        }

    } catch (error) {
        updateAiMessage(loadingDiv, "Error: Network issue ba Server-e somoshya hocche.");
        console.error(error);
    }
}

// User Message Creation
function appendUserMessage(text) {
    const chatBox = document.getElementById("chatBox");
    const msgDiv = document.createElement("div");
    msgDiv.className = "message user-msg";
    msgDiv.textContent = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// AI Message Initial Loading Box Creation
function appendAiLoadingMessage() {
    const chatBox = document.getElementById("chatBox");
    const msgDiv = document.createElement("div");
    msgDiv.className = "message ai-msg";
    msgDiv.textContent = "Thinking...";
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return msgDiv;
}

// AI Message Update with Response & Listen Button
function updateAiMessage(element, text) {
    element.innerHTML = "";
    
    const textSpan = document.createElement("span");
    textSpan.textContent = text;
    element.appendChild(textSpan);

    const voiceBtn = document.createElement("button");
    voiceBtn.className = "voice-btn";
    voiceBtn.innerHTML = "🔊 Listen";
    voiceBtn.onclick = () => speak(text);
    element.appendChild(voiceBtn);

    const chatBox = document.getElementById("chatBox");
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 🔊 HTML Inline Event Handler - Text to Speech Function
function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        const isBangla = /[\u0980-\u09FF]/.test(text);
        
        utterance.lang = isBangla ? 'bn-BD' : 'en-US';
        utterance.rate = 1.0;
        
        window.speechSynthesis.speak(utterance);
    } else {
        alert("Text-to-Speech is not supported in your browser.");
    }
}
