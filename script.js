function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Check if the text contains Bengali characters
    const hasBangla = /[\u0980-\u09FF]/.test(text);
    if (hasBangla) {
        utterance.lang = 'bn-BD'; // Real Bangla voice output
    } else {
        utterance.lang = 'en-US'; // Proper English voice output
    }
    
    window.speechSynthesis.speak(utterance);
}

function handleEnter(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}

async function sendMessage() {
    const inputField = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const userText = inputField.value.trim();
    
    if (!userText) return;

    appendMessage("user", userText);
    inputField.value = "";
    sendBtn.disabled = true;

    try {
        const response = await fetch("http://127.0.0.1:5000/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: userText })
        });
        
        const data = await response.json();
        appendMessage("ai", data.reply);
    } catch (error) {
        appendMessage("ai", "Sorry, Python server running na thakay live response pawa jacchena.");
    }

    sendBtn.disabled = false;
}

function appendMessage(sender, text) {
    const chatBox = document.getElementById("chatBox");
    const msgDiv = document.createElement("div");
    msgDiv.className = `message ${sender === 'user' ? 'user-msg' : 'ai-msg'}`;
    
    const formattedText = text.replace(/\n/g, "<br>");
    const cleanTextForSpeech = text.replace(/"/g, "'").replace(/\n/g, " ");

    if (sender === 'ai') {
        msgDiv.innerHTML = `${formattedText} <button class="voice-btn" onclick="speak('${cleanTextForSpeech}')">🔊 Listen</button>`;
    } else {
        msgDiv.innerText = text;
    }
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}
