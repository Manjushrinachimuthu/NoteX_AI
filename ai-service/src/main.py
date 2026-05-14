import os
import tempfile
import traceback
import shutil
import subprocess

import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Load .env file using python-dotenv if available, else manual parse
try:
    from dotenv import load_dotenv
    from pathlib import Path
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    from pathlib import Path
    _env_path = Path(__file__).parent.parent / ".env"
    if _env_path.exists():
        for line in _env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ[k.strip()] = v.strip()  # override, not setdefault

app = FastAPI(title="NoteX AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OLLAMA_URL   = os.getenv("OLLAMA_URL",  "http://localhost:11434")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")   # set in ai-service/.env
FFMPEG_PATH  = shutil.which("ffmpeg")

# ── Pydantic models ───────────────────────────────────────────

class SummarizeRequest(BaseModel):
    transcript: str
    language: str = "en"

class TranslateRequest(BaseModel):
    text: str
    target_language: str
    source_language: str = "auto"

class BulkTranslateRequest(BaseModel):
    lines: list[str]
    target_language: str
    source_language: str = "auto"

class ChatbotRequest(BaseModel):
    question: str
    context: str


# ── Health ────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"status": "ok", "message": "NoteX AI Service is running"}

@app.get("/health")
async def health():
    groq_ready = bool(GROQ_API_KEY)
    ffmpeg_ready = FFMPEG_PATH is not None

    # check local whisper
    whisper_ready = False
    try:
        import whisper
        whisper_ready = True
    except ImportError:
        pass

    return {
        "status": "healthy",
        "groq_api_ready": groq_ready,
        "ffmpeg_available": ffmpeg_ready,
        "local_whisper_available": whisper_ready,
        "transcription_backend": "groq" if groq_ready else ("local_whisper" if whisper_ready else "none"),
    }


# ── Audio helpers ─────────────────────────────────────────────

def convert_to_wav(input_path: str) -> str | None:
    """Convert audio to 16 kHz mono WAV via ffmpeg. Returns None if ffmpeg missing."""
    if not FFMPEG_PATH:
        return None
    wav_path = input_path + ".wav"
    result = subprocess.run(
        [FFMPEG_PATH, "-y", "-i", input_path,
         "-ar", "16000", "-ac", "1", "-f", "wav", wav_path],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        print(f"[ffmpeg] error: {result.stderr}")
        return None
    return wav_path


# ── Transcription ─────────────────────────────────────────────

async def transcribe_with_groq(audio_path: str, filename: str) -> str:
    """Send audio to Groq Whisper API and return transcript text."""
    async with httpx.AsyncClient(timeout=60.0) as client:
        with open(audio_path, "rb") as f:
            response = await client.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
                files={"file": (filename, f, "audio/webm")},
                data={"model": "whisper-large-v3-turbo", "response_format": "json"}
            )
    if response.status_code == 200:
        return response.json().get("text", "").strip()
    print(f"[Groq] error {response.status_code}: {response.text}")
    return ""


def transcribe_with_local_whisper(audio_path: str) -> str:
    """Transcribe using local openai-whisper model."""
    import whisper
    model = whisper.load_model(os.getenv("WHISPER_MODEL", "base"))
    result = model.transcribe(audio_path, fp16=False)
    return result.get("text", "").strip()


@app.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    audio_content = await audio.read()

    if len(audio_content) < 100:
        return {"text": ""}

    suffix = os.path.splitext(audio.filename or "audio.webm")[1] or ".webm"
    tmp_input = None
    tmp_wav   = None

    try:
        # Save uploaded audio to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as f:
            f.write(audio_content)
            tmp_input = f.name

        # ── Strategy 1: Groq API (fastest, no local deps) ─────
        if GROQ_API_KEY:
            try:
                text = await transcribe_with_groq(tmp_input, audio.filename or "audio.webm")
                if text:
                    return {"text": text}
            except Exception as e:
                print(f"[Groq] transcription failed: {e}")

        # ── Strategy 2: local whisper + ffmpeg conversion ─────
        try:
            import whisper as _whisper_check  # noqa — just check it's installed
            audio_path = tmp_input

            # Convert to WAV for best whisper compatibility
            if FFMPEG_PATH:
                wav = convert_to_wav(tmp_input)
                if wav:
                    tmp_wav = wav
                    audio_path = wav

            text = transcribe_with_local_whisper(audio_path)
            if text:
                return {"text": text}
        except ImportError:
            print("[Whisper] openai-whisper not installed")
        except Exception as e:
            print(f"[Whisper] local transcription failed: {e}")
            traceback.print_exc()

        # ── Nothing worked ────────────────────────────────────
        return {
            "text": "[Set GROQ_API_KEY in ai-service/.env for transcription — get free key at console.groq.com]"
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        for p in [tmp_input, tmp_wav]:
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass


# ── Summarization ─────────────────────────────────────────────

async def summarize_with_groq(transcript: str, language: str) -> str:
    """Summarize meeting transcript using Groq LLM."""
    prompt = f"""You are a professional meeting summarizer. Based on the meeting transcript below, provide a clear and concise summary.

Requirements:
1. Write a brief overview (2-3 sentences)
2. List key points as bullet items
3. Identify any action items with assignees if mentioned

Respond in {language}.

Transcript:
{transcript}

Summary:"""

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 2048
            }
        )
    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"].strip()
    print(f"[Groq summarize] error {response.status_code}: {response.text[:300]}")
    return ""


@app.post("/summarize")
async def summarize(request: SummarizeRequest):
    try:
        # ── Strategy 1: Groq (fast, reliable) ─────────────────
        if GROQ_API_KEY:
            try:
                summary = await summarize_with_groq(request.transcript, request.language)
                if summary:
                    return {"summary": summary}
            except Exception as e:
                print(f"[Groq summarize] failed: {e}")

        # ── Strategy 2: Ollama fallback ────────────────────────
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
            return {"summary": response.json().get("response", "").strip()}

        raise HTTPException(status_code=500, detail="Summarization service unavailable. Please set GROQ_API_KEY.")
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Translation (single text) ─────────────────────────────────

@app.post("/translate")
async def translate(request: TranslateRequest):
    try:
        prompt = (
            f"Translate the following text from {request.source_language} to "
            f"{request.target_language}. Only return the translated text, nothing else:\n\n"
            f"{request.text}"
        )

        # ── Strategy 1: Groq ───────────────────────────────────
        if GROQ_API_KEY:
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        "https://api.groq.com/openai/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {GROQ_API_KEY}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": "llama-3.3-70b-versatile",
                            "messages": [{"role": "user", "content": prompt}],
                            "temperature": 0.1,
                            "max_tokens": 2048
                        }
                    )
                if response.status_code == 200:
                    translated = response.json()["choices"][0]["message"]["content"].strip()
                    if translated:
                        return {"translated": translated, "language": request.target_language}
            except Exception as e:
                print(f"[Groq translate] failed: {e}")

        # ── Strategy 2: Ollama fallback ────────────────────────
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": "mistral", "prompt": prompt, "stream": False},
            )
        if response.status_code == 200:
            return {
                "translated": response.json().get("response", "").strip(),
                "language": request.target_language,
            }
        raise HTTPException(status_code=500, detail="Translation service unavailable")
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ── Bulk translation (all lines in one call) ──────────────────

@app.post("/translate-bulk")
async def translate_bulk(request: BulkTranslateRequest):
    """Translate a list of lines in a single LLM call using JSON mode."""
    if not request.lines:
        return {"translated_lines": [], "language": request.target_language}

    import json

    # Use JSON array output — most reliable way to get N lines back
    prompt = (
        f"You are a professional translator. Translate each item in the JSON array below "
        f"from {request.source_language} to {request.target_language}.\n"
        f"Return ONLY a valid JSON array of translated strings, same length and order.\n"
        f"Do not add any explanation, notes, or extra text outside the JSON array.\n\n"
        f"Input: {json.dumps(request.lines, ensure_ascii=False)}\n\n"
        f"Output (JSON array only):"
    )

    # Try Groq with JSON mode first
    if GROQ_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.1,
                        "max_tokens": 8192,
                        "response_format": {"type": "json_object"}
                    }
                )

            if response.status_code == 200:
                raw = response.json()["choices"][0]["message"]["content"].strip()
                # Parse JSON — model returns {"translations": [...]} or just [...]
                parsed = _extract_array(raw, len(request.lines))
                if parsed:
                    print(f"[translate-bulk] Groq translated {len(parsed)} lines to {request.target_language}")
                    return {"translated_lines": parsed, "language": request.target_language}
                else:
                    print(f"[translate-bulk] Groq parse failed, raw: {raw[:200]}")
            else:
                print(f"[Groq bulk] error {response.status_code}: {response.text[:300]}")

        except Exception as e:
            print(f"[translate-bulk] Groq error: {e}")
            traceback.print_exc()

    # Fallback: Ollama with same JSON prompt
    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": "mistral", "prompt": prompt, "stream": False},
            )
        if response.status_code == 200:
            raw = response.json().get("response", "").strip()
            parsed = _extract_array(raw, len(request.lines))
            if parsed:
                return {"translated_lines": parsed, "language": request.target_language}
    except Exception as e:
        print(f"[translate-bulk] Ollama error: {e}")

    # Last resort: return originals
    print(f"[translate-bulk] All strategies failed, returning originals")
    return {"translated_lines": request.lines, "language": request.target_language}


def _extract_array(raw: str, expected: int):
    """Extract a JSON array of strings from LLM output."""
    import json, re

    # Try direct parse first
    try:
        data = json.loads(raw)
        if isinstance(data, list) and len(data) > 0:
            result = [str(x) for x in data]
            return _pad_or_trim(result, expected)
        # Handle {"translations": [...]} or {"result": [...]} etc.
        if isinstance(data, dict):
            for v in data.values():
                if isinstance(v, list) and len(v) > 0:
                    result = [str(x) for x in v]
                    return _pad_or_trim(result, expected)
    except Exception:
        pass

    # Try to find a JSON array anywhere in the response
    try:
        match = re.search(r'\[.*\]', raw, re.DOTALL)
        if match:
            data = json.loads(match.group())
            if isinstance(data, list) and len(data) > 0:
                result = [str(x) for x in data]
                return _pad_or_trim(result, expected)
    except Exception:
        pass

    return None


def _pad_or_trim(lines: list, expected: int) -> list:
    """Ensure list has exactly `expected` items."""
    while len(lines) < expected:
        lines.append(lines[-1] if lines else "")
    return lines[:expected]


# ── Chatbot ───────────────────────────────────────────────────

async def chat_with_groq(question: str, context: str) -> str:
    """Answer a question about meeting notes using Groq LLM."""
    prompt = f"""You are a helpful meeting assistant. Answer the user's question based only on the meeting notes provided.

Meeting Notes:
{context}

Question: {question}

Provide a clear, concise answer based on the meeting notes. If the answer is not in the notes, say so clearly."""

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.5,
                "max_tokens": 1024
            }
        )
    if response.status_code == 200:
        return response.json()["choices"][0]["message"]["content"].strip()
    print(f"[Groq chatbot] error {response.status_code}: {response.text[:300]}")
    return ""


@app.post("/chatbot")
async def chatbot(request: ChatbotRequest):
    try:
        # ── Strategy 1: Groq (fast, reliable) ─────────────────
        if GROQ_API_KEY:
            try:
                answer = await chat_with_groq(request.question, request.context)
                if answer:
                    return {"answer": answer}
            except Exception as e:
                print(f"[Groq chatbot] failed: {e}")

        # ── Strategy 2: Ollama fallback ────────────────────────
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
            return {"answer": response.json().get("response", "").strip()}

        raise HTTPException(status_code=500, detail="Chatbot service unavailable. Please set GROQ_API_KEY.")
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
