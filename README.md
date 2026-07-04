# Sami's AI Assistant

A modern, responsive, full-stack AI Chatbot featuring a Glassmorphism UI, dual-language (Bangla & English) communication, and smart text-to-speech voice output. 

## ✨ Features
- **Premium UI:** Glassmorphism design with a customizable full-screen background image.
- **Smart Language Detection:** Automatically detects Bengali text and uses the native `bn-BD` voice for Text-to-Speech, while using `en-US` for English text.
- **Conversation Memory:** Saves all chat history locally using an SQLite database.
- **Dual Language AI:** Powered by Google's Gemini API, capable of understanding and replying in English, proper Bengali, and Banglish seamlessly.
- **Responsive Design:** Optimized for both mobile devices and desktop views.

## 🛠️ Technologies Used
- **Frontend:** HTML5, CSS3 (Glassmorphism), JavaScript (Fetch API, Web Speech API)
- **Backend:** Python, Flask, Flask-CORS
- **Database:** SQLite3
- **AI Integration:** Google Generative AI (Gemini 1.5 Flash)

## 🚀 Setup & Installation

### Prerequisites
- Python 3.x installed on your system.
- A valid Google Gemini API Key.

### 1. Clone or Download the Project
Keep all files (`index.html`, `style.css`, `script.js`, `app.py`, and your background image) in the same folder.
Make sure to rename your background image to `your-pic.jpg` or update the `style.css` background property accordingly.

### 2. Install Python Dependencies
Open your terminal in the project folder and run the following command to install the required libraries:
```bash
pip install flask flask-cors google-generativeai
