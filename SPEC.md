# AI Smart Meeting Assistant - Technical Specification

## Project Overview
- **Project Name**: NoteX AI - Smart Meeting Assistant
- **Project Type**: Full-stack web application (Real-time video conferencing + AI)
- **Core Functionality**: Real-time video/audio meetings with live transcription, translation, AI summarization, and automated meeting notes generation
- **Target Users**: Remote teams, businesses, educators who need automated meeting documentation

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              NoteX AI System Architecture                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────┐
                         │    React Frontend   │
                         │   (Client Browser) │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   Socket.io Client  │
                         │   WebRTC (Media)    │
                         └──────────┬──────────┘
                                    │ HTTP + WebSocket
                                    ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                           Node.js Backend (Express)                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Auth Routes  │  │ Meeting API │  │ Notes API   │  │ Socket.io   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                    │                                                  │
│                         ┌──────────▼──────────┐                                       │
│                         │    MongoDB Atlas     │                                       │
│                         │   (Database)         │                                       │
│                         └──────────────────────┘                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
                                    │
                         ┌──────────▼──────────┐
                         │  Python AI Service  │
                         │    (FastAPI)        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ Whisper STT  │  │ Translation  │  │ Summarization│  │ Chatbot API  │               │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘               │
│                                    │                                                  │
│                         ┌──────────▼──────────┐                                       │
│                         │   Ollama / LM Studio  │                                       │
│                         │  (Local LLM)         │                                       │
│                         └──────────────────────┘                                       │
└───────────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────────────────────────┐
│                              Data Flow Diagram                                         │
└───────────────────────────────────────────────────────────────────────────────────────┘

  Meeting Room                    AI Processing Pipeline                    Storage
  ────────────                   ──────────────────────              ────────
  
  ┌───────────┐                  ┌───────────────┐                   ┌───────────┐
  │ User A    │ ───Audio───────▶│               │                   │           │
  │ (Speaker) │                  │   Whisper     │ ───Text─────────▶  │  MongoDB  │
  └───────────┘                  │   (STT)       │                   │  (Notes)  │
                                │               │                   │           │
  ┌───────────┐                  └───────────────┘                   └───────────┘
  │ User B    │ ◀──Video─────────│               │                     ┌───────────┐
  │ (Viewer) │                  │  Translation  │ ◀──Original─────────│   PDF     │
  └───────────┘                  │  (Optional)  │                     │  Export   │
                                │               │                     └───────────┘
                                └───────────────┘
                                ┌───────────────┐
                                │   LLM         │
                                │  (Summarize)  │ ───Summary─────────▶
                                └───────────────┘
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + Vite | UI Components, WebRTC |
| Styling | CSS Modules + Custom | Responsive design |
| Backend | Node.js + Express | REST API, WebSocket server |
| Database | MongoDB (Atlas) | Meeting notes storage |
| Real-time | Socket.io + WebRTC | Video/audio calls |
| AI Service | Python FastAPI | AI processing endpoints |
| STT | Whisper (via Ollama) | Speech-to-text |
| Translation | HuggingFace (M2M100) | Multi-language translation |
| Summarization | Ollama (Mistral) | AI summarization |
| PDF Export | jsPDF | Client-side PDF generation |

---

## Folder Structure

```
NoteX_AI/
├── SPEC.md                          # This specification
├── README.md                        # Project documentation
├── .env.example                     # Environment variables template
│
├── frontend/                        # React Frontend
│   ├── public/
│   │   └── favicon.ico
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── MeetingCard.jsx
│   │   │   │   └── CreateMeetingModal.jsx
│   │   │   ├── Meeting/
│   │   │   │   ├── MeetingRoom.jsx
│   │   │   │   ├── VideoGrid.jsx
│   │   │   │   ├── Controls.jsx
│   │   │   │   ├── Transcript.jsx
│   │   │   │   └── Chat.jsx
│   │   │   └── Notes/
│   │   │       ├── NotesViewer.jsx
│   │   │       └── Chatbot.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useWebRTC.js
│   │   │   └── useSocket.js
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── socket.js
│   │   │   └── webrtc.js
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── utils/
│   │       ├── pdfGenerator.js
│   │       └── formatters.js
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env
│
├── backend/                        # Node.js Backend
│   ├── src/
│   │   ├── index.js               # Entry point
│   │   ├── config/
│   │   │   └── db.js              # MongoDB connection
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Meeting.js
│   │   │   └── Note.js
│   │   ├── routes/
│   │   │   ├─�� auth.js
│   │   │   ├── meetings.js
│   │   │   └── notes.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── meetingController.js
│   │   │   └── noteController.js
│   │   └── services/
│   │       ├── socketService.js   # Socket.io handlers
│   │       └── aiService.js       # AI service communication
│   ├── package.json
│   └── .env
│
└── ai-service/                    # Python AI Service
    ├── src/
    │   ├── main.py                # FastAPI entry point
    │   ├── routes/
    │   │   ├── transcription.py
    │   │   ├── translation.py
    │   │   ├── summarization.py
    │   │   └── chatbot.py
    │   ├── services/
    │   │   ├── whisper_service.py
    │   │   ├── translator.py
    │   │   └── llm_service.py
    │   ├── models/
    │   │   └── __init__.py
    │   └── utils/
    │       └── audio_utils.py
    ├── requirements.txt
    ├── .env
    └── Dockerfile
```

---

## API Design

### Authentication Endpoints
| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register new user | `{email, password, name}` |
| POST | /api/auth/login | Login user | `{email, password}` |
| GET | /api/auth/me | Get current user | - |
| PUT | /api/auth/profile | Update profile | `{name, language}` |

### Meeting Endpoints
| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | /api/meetings | Create new meeting | `{title, scheduledTime}` |
| GET | /api/meetings | List user's meetings | - |
| GET | /api/meetings/:id | Get meeting details | - |
| PUT | /api/meetings/:id | Update meeting | `{title, status}` |
| DELETE | /api/meetings/:id | Delete meeting | - |
| POST | /api/meetings/:id/join | Join meeting | - |

### Notes Endpoints
| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | /api/notes/:meetingId | Get meeting notes | - |
| POST | /api/notes/:meetingId/transcript | Save transcript | `{transcript, timestamp}` |
| GET | /api/notes/:meetingId/summary | Get AI summary | - |
| POST | /api/notes/:meetingId/translate | Translate notes | `{targetLanguage}` |
| POST | /api/notes/:meetingId/chatbot | Ask AI chatbot | `{question}` |

### AI Service Endpoints (Internal)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /ai/transcribe | Speech to text |
| POST | /ai/translate | Translate text |
| POST | /ai/summarize | Generate summary |
| POST | /ai/chatbot | Chat with notes |

---

## WebRTC Integration

### Connection Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                    WebRTC Signaling Flow                        │
└─────────────────────────────────────────────────────────────────┘

  User A                Socket.io                  User B
    │                     │                         │
    │ ──Create Room──────▶│                         │
    │                     │───Room Created────────▶│
    │                     │                         │
    │ ──Join Room────────▶│                         │
    │                     │───User Joined──────────▶│
    │                     │                         │
    │ ──Offer (SDP)──────▶│                         │
    │                     │─────Offer (SDP)───────▶│
    │                     │                         │
    │◀────Answer (SDP)────│                         │
    │                     │◀────Answer (SDP)───────│
    │                     │                         │
    │◀────ICE Candidates──│                         │
    │                     │─────ICE Candidates────▶│
    │                     │                         │
    │              P2P Media Stream                 │
    │◀───────────────────────────────────────────▶│
```

### Key WebRTC Components
- **RTCPeerConnection**: Manages peer connections
- **getUserMedia**: Access camera/microphone
- **RTCSessionDescription**: SDP exchange
- **RTCIceCandidate**: ICE candidate exchange

---

## Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  preferredLanguage: String (default: "en"),
  createdAt: Date,
  updatedAt: Date
}
```

### Meeting Collection
```javascript
{
  _id: ObjectId,
  title: String,
  hostId: ObjectId (ref: User),
  participants: [ObjectId],
  roomId: String (unique),
  scheduledTime: Date,
  status: String (enum: ["scheduled", "active", "completed"]),
  createdAt: Date,
  updatedAt: Date
}
```

### Note Collection
```javascript
{
  _id: ObjectId,
  meetingId: ObjectId (ref: Meeting),
  transcript: [{
    speaker: String,
    text: String,
    timestamp: Date,
    language: String
  }],
  summary: {
    overview: String,
    keyPoints: [String],
    actionItems: [{
      task: String,
      assignee: String,
      dueDate: Date
    }]
  },
  translations: Map,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Implementation Steps

### Step 1: Project Setup
1. Create root directory structure
2. Initialize frontend with Vite + React
3. Initialize backend with Express
4. Initialize AI service with FastAPI

### Step 2: Backend Development
1. Set up MongoDB connection
2. Create User, Meeting, Note models
3. Implement authentication routes
4. Implement meeting CRUD routes
5. Implement notes routes
6. Set up Socket.io for real-time

### Step 3: Frontend Development
1. Create React components
2. Implement authentication flow
3. Build meeting dashboard
4. Implement WebRTC video room
5. Add transcript display
6. Create notes viewer with PDF export

### Step 4: AI Service Development
1. Set up FastAPI with Whisper
2. Implement translation endpoint
3. Implement summarization with Ollama
4. Create chatbot endpoint

### Step 5: Integration
1. Connect frontend to backend
2. Connect backend to AI service
3. Test WebRTC connections
4. Test full transcription flow
5. Test PDF export

---

## Sample Code Files

### 1. Backend Entry (server/index.js)
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL, methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/notes', require('./routes/notes'));

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', userId);
  });
  
  socket.on('call-user', ({ userToCall, signalData, from }) => {
    io.to(userToCall).emit('call-user', { signal: signalData, from });
  });
  
  socket.on('answer-call', (signal, to) => {
    io.to(to).emit('call-accepted', signal);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

### 2. AI Service (ai-service/src/main.py)
```python
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import httpx
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

class SummarizeRequest(BaseModel):
    transcript: str
    language: str = "en"

class TranslateRequest(BaseModel):
    text: str
    target_language: str
    source_language: str = "auto"

class ChatbotRequest(BaseModel):
    question: str
    context: str

@app.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    try:
        audio_content = await audio.read()
        
        # Save temporary file
        with open("temp_audio.wav", "wb") as f:
            f.write(audio_content)
        
        # Call Whisper API (local Ollama)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/transcribe",
                files={"file": open("temp_audio.wav", "rb")}
            )
        
        os.remove("temp_audio.wav")
        
        if response.status_code == 200:
            return {"text": response.json().get("text", "")}
        else:
            raise HTTPException(status_code=500, detail="Transcription failed")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/summarize")
async def summarize(request: SummarizeRequest):
    try:
        prompt = f"""Based on this meeting transcript, provide:
1. A brief overview (2-3 sentences)
2. Key points (bullet list)
3. Action items (if any)

Transcript:
{request.transcript}

Respond in {request.language}:"""
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": "mistral",
                    "prompt": prompt,
                    "stream": False
                }
            )
        
        if response.status_code == 200:
            result = response.json()
            return {"summary": result.get("response", "")}
        else:
            raise HTTPException(status_code=500, detail="Summarization failed")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/translate")
async def translate(request: TranslateRequest):
    try:
        prompt = f"Translate from {request.source_language} to {request.target_language}: {request.text}"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": "mistral",
                    "prompt": prompt,
                    "stream": False
                }
            )
        
        if response.status_code == 200:
            result = response.json()
            return {"translated": result.get("response", ""), "language": request.target_language}
        else:
            raise HTTPException(status_code=500, detail="Translation failed")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chatbot")
async def chatbot(request: ChatbotRequest):
    try:
        prompt = f"""You are a meeting assistant. Answer questions based on the meeting notes below.

Meeting Notes:
{request.context}

Question: {request.question}

Provide a clear, concise answer:"""
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": "mistral",
                    "prompt": prompt,
                    "stream": False
                }
            )
        
        if response.status_code == 200:
            result = response.json()
            return {"answer": result.get("response", "")}
        else:
            raise HTTPException(status_code=500, detail="Chatbot failed")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 3. WebRTC Hook (frontend/src/hooks/useWebRTC.js)
```javascript
import { useState, useEffect, useRef, useCallback } from 'react';
import { socket } from '../services/socket';

export const useWebRTC = (roomId, userId) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const peerConnections = useRef({});
  const [isConnected, setIsConnected] = useState(false);

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const createPeerConnection = useCallback(async (peerId) => {
    const pc = new RTCPeerConnection(servers);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate, to: peerId });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({ ...prev, [peerId]: event.streams[0] }));
    };

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }

    peerConnections.current[peerId] = pc;
    return pc;
  }, [localStream]);

  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }, []);

  const callUser = useCallback(async (userToCall) => {
    const pc = await createPeerConnection(userToCall);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    socket.emit('call-user', {
      userToCall,
      signalData: offer,
      from: userId
    });
  }, [createPeerConnection, userId]);

  const answerCall = useCallback(async (signal, from) => {
    const pc = await createPeerConnection(from);
    await pc.setRemoteDescription(new RTCSessionDescription(signal));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    socket.emit('answer-call', { signal: answer, to: from });
  }, [createPeerConnection]);

  useEffect(() => {
    socket.on('call-user', async ({ signal, from }) => {
      await answerCall(signal, from);
    });

    socket.on('call-accepted', async (signal) => {
      const pc = Object.values(peerConnections.current)[0];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
        setIsConnected(true);
      }
    });

    socket.on('ice-candidate', async ({ candidate, from }) => {
      const pc = peerConnections.current[from];
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    return () => {
      socket.off('call-user');
      socket.off('call-accepted');
      socket.off('ice-candidate');
    };
  }, [answerCall]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
    }
  }, [localStream]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
    }
  }, [localStream]);

  const leaveCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    Object.values(peerConnections.current).forEach(pc => pc.close());
    setLocalStream(null);
    setRemoteStreams({});
    setIsConnected(false);
  }, [localStream]);

  return {
    localStream,
    remoteStreams,
    isConnected,
    startMedia,
    callUser,
    answerCall,
    toggleVideo,
    toggleAudio,
    leaveCall
  };
};
```

### 4. Meeting Room Component (frontend/src/components/Meeting/MeetingRoom.jsx)
```jsx
import { useState, useEffect, useRef } from 'react';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useSocket } from '../../hooks/useSocket';
import VideoGrid from './VideoGrid';
import Controls from './Controls';
import Transcript from './Transcript';
import './MeetingRoom.css';

const MeetingRoom = ({ meetingId, userId }) => {
  const [isMeetingStarted, setIsMeetingStarted] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const { localStream, remoteStreams, isConnected, startMedia, toggleVideo, toggleAudio, leaveCall } = useWebRTC(meetingId, userId);
  const { socket } = useSocket();

  useEffect(() => {
    const handleUserJoined = (userId) => {
      console.log('User joined:', userId);
    };

    const handleUserLeft = (userId) => {
      console.log('User left:', userId);
    };

    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserJoined);

    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket]);

  const startMeeting = async () => {
    try {
      await startMedia();
      socket.emit('join-room', meetingId, userId);
      setIsMeetingStarted(true);
      startRecording();
    } catch (error) {
      console.error('Failed to start meeting:', error);
    }
  };

  const startRecording = () => {
    if (!localStream) return;

    audioChunks.current = [];
    mediaRecorder.current = new MediaRecorder(localStream, {
      mimeType: 'audio/webm'
    });

    mediaRecorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.current.push(event.data);
      }
    };

    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      await transcribeAudio(audioBlob);
    };

    mediaRecorder.current.start(1000); // Collect data every second
  };

  const transcribeAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setTranscript(prev => [...prev, {
          text: data.text,
          timestamp: new Date().toISOString(),
          speaker: 'You'
        }]);
      }
    } catch (error) {
      console.error('Transcription error:', error);
    }
  };

  const endMeeting = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop();
    }
    leaveCall();
    socket.emit('leave-room', meetingId, userId);
  };

  return (
    <div className="meeting-room">
      <div className="meeting-header">
        <h2>Meeting Room</h2>
        <button className="toggle-transcript" onClick={() => setShowTranscript(!showTranscript)}>
          {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
        </button>
      </div>

      <div className="meeting-content">
        <VideoGrid
          localStream={localStream}
          remoteStreams={remoteStreams}
        />

        {showTranscript && (
          <Transcript transcript={transcript} />
        )}
      </div>

      <Controls
        onStartMeeting={startMeeting}
        onEndMeeting={endMeeting}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        isMeetingStarted={isMeetingStarted}
        localStream={localStream}
      />
    </div>
  );
};

export default MeetingRoom;
```

### 5. PDF Generator (frontend/src/utils/pdfGenerator.js)
```javascript
import jsPDF from 'jspdf';

export const generateMeetingPDF = (meeting, notes) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(meeting.title, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Date
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const date = new Date(meeting.createdAt).toLocaleDateString();
  doc.text(`Date: ${date}`, 20, y);
  y += 15;

  // Summary Section
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Meeting Summary', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  if (notes.summary?.overview) {
    const overviewLines = doc.splitTextToSize(notes.summary.overview, pageWidth - 40);
    doc.text(overviewLines, 20, y);
    y += overviewLines.length * 7 + 10;
  }

  // Key Points
  if (notes.summary?.keyPoints?.length > 0) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Points', 20, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    notes.summary.keyPoints.forEach((point, index) => {
      const pointLines = doc.splitTextToSize(`${index + 1}. ${point}`, pageWidth - 40);
      doc.text(pointLines, 25, y);
      y += pointLines.length * 6 + 3;
    });
    y += 10;
  }

  // Action Items
  if (notes.summary?.actionItems?.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Action Items', 20, y);
    y += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    notes.summary.actionItems.forEach((item, index) => {
      const itemText = `${index + 1}. ${item.task}`;
      const assigneeText = `   Assignee: ${item.assignee || 'Unassigned'}`;
      const dueDateText = item.dueDate ? `   Due: ${new Date(item.dueDate).toLocaleDateString()}` : '';

      doc.text(itemText, 25, y);
      y += 6;
      doc.text(assigneeText + dueDateText, 25, y);
      y += 8;
    });
    y += 10;
  }

  // Transcript
  if (notes.transcript?.length > 0) {
    if (y > 200) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Transcript', 20, y);
    y += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    notes.transcript.forEach((entry) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      const time = new Date(entry.timestamp).toLocaleTimeString();
      const transcriptText = `[${time}] ${entry.speaker}: ${entry.text}`;
      const transcriptLines = doc.splitTextToSize(transcriptText, pageWidth - 40);

      transcriptLines.forEach(line => {
        doc.text(line, 20, y);
        y += 5;
      });
      y += 3;
    });
  }

  // Save
  doc.save(`${meeting.title.replace(/\s+/g, '_')}_notes.pdf`);
};
```

---

## Environment Variables

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/notex_ai
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
```

### AI Service (.env)
```env
OLLAMA_URL=http://localhost:11434
DEFAULT_MODEL=mistral
PORT=8000
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_AI_SERVICE_URL=http://localhost:8000
```

---

## Running the Project

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB Atlas account
- Ollama (for local LLM)

### Step 1: Start AI Service
```bash
cd ai-service
pip install -r requirements.txt
python src/main.py
```

### Step 2: Start Backend
```bash
cd backend
npm install
npm start
```

### Step 3: Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### Step 4: Open Browser
Navigate to http://localhost:5173

---

## Scalability Considerations

1. **Horizontal Scaling**: Use load balancer for multiple backend instances
2. **WebRTC Scaling**: Implement TURN server for NAT traversal
3. **Database**: Use MongoDB Atlas sharding for large datasets
4. **AI Processing**: Queue system for heavy AI tasks (Redis/Bull)
5. **Caching**: Redis for session and frequently accessed data
6. **CDN**: Static assets served via CDN

---

## Security Measures

1. **Authentication**: JWT with refresh tokens
2. **Authorization**: Role-based access control (RBAC)
3. **Encryption**: TLS/SSL for all connections
4. **Input Validation**: All inputs sanitized
5. **Rate Limiting**: Prevent API abuse
6. **CORS**: Strict origin allowlist

---

## License
MIT License