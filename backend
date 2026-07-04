from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

# --- GEMINI CONFIGURATION ---
GENAI_API_KEY = "YOUR_GEMINI_API_KEY"
genai.configure(api_key=GENAI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

# --- LOCAL DATABASE ---
def init_db():
    conn = sqlite3.connect('chatbot_memory.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender TEXT,
            message TEXT
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get("message", "")
    
    if not user_message:
        return jsonify({"reply": "Message is empty."})
    
    conn = sqlite3.connect('chatbot_memory.db')
    cursor = conn.cursor()
    cursor.execute("INSERT INTO chat_history (sender, message) VALUES (?, ?)", ("User", user_message))
    conn.commit()
    
    # NLP multi-language behavior instructions
    instruction = (
        "You are a helpful AI assistant. Always respond in the language the user speaks. "
        "If they speak Banglish (Bangla written in English alphabet), reply in Banglish. "
        "If they speak proper Bangla script, reply in proper Bangla. "
        "If they speak English, reply in English. Keep answers helpful and natural."
    )
    final_prompt = f"{instruction}\n\nUser: {user_message}"
    
    try:
        if GENAI_API_KEY == "YOUR_GEMINI_API_KEY":
            ai_reply = "Ami ekhon kaj korchi! Tobe amar bhetore ashol Gemini API key dewa nei. app.py te YOUR_GEMINI_API_KEY replace koro."
        else:
            response = model.generate_content(final_prompt)
            ai_reply = response.text
    except Exception as e:
        ai_reply = f"System Error: API connect kora jacchena. Error: {str(e)}"
    
    cursor.execute("INSERT INTO chat_history (sender, message) VALUES (?, ?)", ("AI", ai_reply))
    conn.commit()
    conn.close()
    
    return jsonify({"reply": ai_reply})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
