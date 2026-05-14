<img width="1919" height="988" alt="Screenshot 2026-05-14 233400" src="https://github.com/user-attachments/assets/635266a5-7cde-4434-bebb-ca9fdc142df4" />

# 🧠 NoteX AI — Smart Meeting Assistant

<div align="center">

![NoteX AI](https://img.shields.io/badge/NoteX-AI-8b2fc9?style=for-the-badge&logo=brain&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Groq](https://img.shields.io/badge/Groq-LLM-FF6B35?style=for-the-badge)

**Capture every word. Summarize instantly. Collaborate across languages.**

</div>

---

## ✨ What is NoteX AI?

NoteX AI is a full-stack AI-powered meeting assistant that transforms how teams capture and review meeting content. It provides **real-time transcription**, **AI-generated summaries**, **multi-language translation**, and **PDF export** — all in one seamless platform.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🎙️ **Live Transcription** | Real-time speech-to-text using Web Speech API during meetings |
| 🤖 **AI Summaries** | Groq LLM (llama-3.3-70b) generates concise meeting summaries |
| 🌐 **12+ Languages** | Translate transcripts & summaries into Hindi, Tamil, Spanish, French, and more |
| 📹 **Video Upload** | Upload recorded videos — Whisper AI extracts and transcribes audio |
| 💬 **AI Chatbot Q&A** | Ask questions about your meeting content, answered from transcript context |
| 📄 **PDF Export** | Download polished PDF reports with full transcript and summary |
| 📊 **Analytics Dashboard** | Visual graphs showing meeting accuracy and duration stats |
| 🔐 **Auth System** | JWT-based login and registration |
| 🌙 **Neon Dark Theme** | Beautiful purple/magenta neon UI with glassmorphism effects |

---

## 🏗️ Architecture

```
NoteX_AI/
├── frontend/          # React + Vite (UI)
├── backend/           # Node.js + Express (API)
└── ai-service/        # Python + FastAPI (AI processing)
```

### Tech Stack

**Frontend**
- React 18 + Vite
- React Router v6
- Socket.IO client (real-time)
- WebRTC (peer-to-peer video)
- jsPDF (PDF generation)
- Custom neon CSS theme

**Backend**
- Node.js + Express
- Socket.IO (WebSocket server)
- JWT authentication
- Multer (file uploads)
- JSON file-based data store

**AI Service**
- Python + FastAPI
- Groq API — `llama-3.3-70b-versatile` (summaries, chat, translation)
- Groq Whisper — `whisper-large-v3-turbo` (audio transcription)
- Ollama fallback (local LLM)

---

## ⚙️ Setup & Installation

### Prerequisites

- Node.js 18+
- Python 3.10+
- A free [Groq API key](https://console.groq.com)

### 1. Clone the repository

```bash
git clone https://github.com/Manjushrinachimuthu/NoteX_AI.git
cd NoteX_AI
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key_change_in_production
FRONTEND_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
```

### 3. AI Service setup

```bash
cd ai-service
pip install -r requirements.txt
```

Create `ai-service/.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
OLLAMA_URL=http://localhost:11434
WHISPER_MODEL=base
```

> Get your free Groq API key at [console.groq.com](https://console.groq.com)

### 4. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

---

## ▶️ Running the Project

Open **3 separate terminals**:

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 — AI Service**
```bash
cd ai-service
uvicorn src.main:app --reload --port 8000
```

**Terminal 3 — Frontend**
```bash
cd frontend
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## 📱 Pages & Navigation

| Route | Description |
|---|---|
| `/` | Landing page with features, testimonials, CTA |
| `/login` | Sign in to your account |
| `/register` | Create a new account |
| `/dashboard` | Your meetings, analytics, graphs |
| `/meeting/:id` | Live meeting room with video + transcription |
| `/notes/:id` | Meeting notes, AI summary, chatbot, PDF download |

---

## 🎯 How It Works

```
1. Create Meeting  →  Join room  →  Live transcription starts
2. Speak naturally →  Web Speech API captures every word in real-time
3. End meeting     →  Navigate to Notes page
4. Generate Summary →  Groq AI summarizes the transcript
5. Translate       →  Switch language to view in Hindi, Spanish, etc.
6. Ask Questions   →  Chatbot answers from transcript context
7. Download PDF    →  Export polished report in any language
```

---

## 🌐 Multi-Language Support

Supported languages for translation and PDF export:

🇬🇧 English · 🇮🇳 Hindi · 🇮🇳 Tamil · 🇮🇳 Telugu · 🇮🇳 Marathi · 🇮🇳 Bengali  
🇪🇸 Spanish · 🇫🇷 French · 🇩🇪 German · 🇨🇳 Chinese · 🇸🇦 Arabic · 🇯🇵 Japanese

---

## 📊 Dashboard Analytics

The dashboard shows real-time analytics once you have meetings:

- **Total Meetings** — count of all meetings
- **Completed** — meetings marked as done
- **Avg Accuracy** — transcription accuracy score
- **Avg Duration** — average meeting length
- **Accuracy Bar Chart** — visual accuracy indicator
- **Duration Bar Chart** — per-meeting duration with color coding (completed vs scheduled)

---

## 🔑 Environment Variables

### backend/.env
| Variable | Description |
|---|---|
| `PORT` | Backend server port (default: 5000) |
| `JWT_SECRET` | Secret key for JWT tokens |
| `FRONTEND_URL` | Frontend URL for CORS |
| `AI_SERVICE_URL` | AI service URL |

### ai-service/.env
| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Your Groq API key (required) |
| `OLLAMA_URL` | Ollama URL for local LLM fallback |
| `WHISPER_MODEL` | Local Whisper model size (base/small/medium) |

### frontend/.env
| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👩‍💻 Author

**Manjushri Nachimuthu**  
GitHub: [@Manjushrinachimuthu](https://github.com/Manjushrinachimuthu)

---

<div align="center">
  Built with ❤️ for smarter meetings · Powered by Groq AI
</div>
