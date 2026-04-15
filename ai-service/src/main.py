from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import httpx

app = FastAPI(title="NoteX AI Service", version="1.0.0")

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


@app.get("/")
async def root():
    return {"status": "ok", "message": "NoteX AI Service is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    try:
        audio_content = await audio.read()

        temp_path = "/tmp/temp_audio.wav"
        with open(temp_path, "wb") as f:
            f.write(audio_content)

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                with open(temp_path, "rb") as f:
                    files = {"file": ("audio.wav", f, "audio/wav")}
                    response = await client.post(
                        f"{OLLAMA_URL}/api/transcribe", files=files
                    )
            except Exception as e:
                os.remove(temp_path)
                return {
                    "text": f"Transcription service unavailable: {str(e)}. Please ensure Ollama is running with whisper model."
                }

        os.remove(temp_path)

        if response.status_code == 200:
            result = response.json()
            return {"text": result.get("text", "")}
        else:
            return {
                "text": "Could not transcribe audio. Please ensure Ollama is running with whisper model."
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/summarize")
async def summarize(request: SummarizeRequest):
    try:
        prompt = f"""You are a professional meeting summarizer. Based on the meeting transcript below, provide a clear and concise summary.

Requirements:
1. Write a brief overview (2-3 sentences)
2. List key points as bullet items
3. Identify any action items with assignees if mentioned

Respond in {request.language}.

Transcript:
{request.transcript}

Summary:"""

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": "mistral", "prompt": prompt, "stream": False},
            )

        if response.status_code == 200:
            result = response.json()
            return {"summary": result.get("response", "")}
        else:
            raise HTTPException(
                status_code=500, detail="Summarization service unavailable"
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/translate")
async def translate(request: TranslateRequest):
    try:
        prompt = f"Translate the following text from {request.source_language} to {request.target_language}. Only return the translated text, nothing else:\n\n{request.text}"

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": "mistral", "prompt": prompt, "stream": False},
            )

        if response.status_code == 200:
            result = response.json()
            return {
                "translated": result.get("response", ""),
                "language": request.target_language,
            }
        else:
            raise HTTPException(
                status_code=500, detail="Translation service unavailable"
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chatbot")
async def chatbot(request: ChatbotRequest):
    try:
        prompt = f"""You are a helpful meeting assistant. Answer the user's question based only on the meeting notes provided.

Meeting Notes:
{request.context}

Question: {request.question}

Provide a clear, concise answer based on the meeting notes. If the answer is not in the notes, say so clearly."""

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": "mistral", "prompt": prompt, "stream": False},
            )

        if response.status_code == 200:
            result = response.json()
            return {"answer": result.get("response", "")}
        else:
            raise HTTPException(status_code=500, detail="Chatbot service unavailable")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
