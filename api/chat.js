export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { messages, hasImage } = req.body;
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: "Groq API Key missing!" });
        }

        const model = hasImage 
            ? "qwen/qwen3.6-27b" 
            : "llama-3.3-70b-versatile";

        let finalMessages = messages;

        if (hasImage) {
            const systemMsg = messages.find(m => m.role === 'system');
            const lastMsg = messages[messages.length - 1];
            finalMessages = systemMsg ? [systemMsg, lastMsg] : [lastMsg];
        } else {
            finalMessages = messages.map(msg => {
                if (Array.isArray(msg.content)) {
                    const textPart = msg.content
                        .filter(item => item.type === "text")
                        .map(item => item.text)
                        .join(" ");
                    return { role: msg.role, content: textPart || "[Image Context]" };
                }
                return msg;
            });
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: model,
                messages: finalMessages,
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({
                error: data.error?.message || "Groq API request failed",
                details: data
            });
        }

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
}
