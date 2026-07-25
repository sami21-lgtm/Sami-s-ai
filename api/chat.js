// api/chat.js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { messages, hasImage } = req.body;
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: "Groq API Key set kora hoyni! Environment Variables e GROQ_API_KEY add korun." });
        }

    
        const model = hasImage 
            ? "llama-3.2-11b-vision-preview" 
            : "llama-3.3-70b-versatile";

      
        const sanitizedMessages = messages.map(msg => {
            if (!hasImage && Array.isArray(msg.content)) {
                const textPart = msg.content
                    .filter(item => item.type === "text")
                    .map(item => item.text)
                    .join(" ");
                return {
                    role: msg.role,
                    content: textPart || "[Image Context]"
                };
            }
            return msg;
        });

        // ৩. Groq API তে রিকোয়েস্ট পাঠানো
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: sanitizedMessages,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await response.json();

       
        if (!response.ok) {
            console.error("Groq API Error:", data);
            return res.status(response.status).json({
                error: data.error?.message || "Groq API request failed",
                details: data
            });
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({ 
            error: "Internal Server Error", 
            details: error.message 
        });
    }
}
