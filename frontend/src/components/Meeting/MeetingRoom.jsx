import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWebRTC } from '../../hooks/useWebRTC'
import { useSocket } from '../../hooks/useSocket'
import { api } from '../../services/api'
import VideoGrid from './VideoGrid'
import Controls from './Controls'
import Transcript from './Transcript'
import './MeetingRoom.css'

const MeetingRoom = () => {
  const { meetingId } = useParams()
  const navigate = useNavigate()

  const [isMeetingStarted, setIsMeetingStarted] = useState(false)
  const [isRecording, setIsRecording]   = useState(false)
  const [transcript, setTranscript]     = useState([])
  const [showTranscript, setShowTranscript] = useState(true)
  const [meeting, setMeeting]           = useState(null)
  const [loading, setLoading]           = useState(true)
  const [micError, setMicError]         = useState('')
  const [speechSupported, setSpeechSupported] = useState(true)

  const recognitionRef  = useRef(null)
  const isActiveRef     = useRef(false)   // stays true while meeting is running
  const [pendingText, setPendingText] = useState('')  // live interim text
  const saveTimerRef    = useRef(null)

  const userId = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user'))._id
    : 'anonymous'

  const { localStream, remoteStreams, startMedia, toggleVideo, toggleAudio, leaveCall } =
    useWebRTC(meetingId, userId)
  const { socket } = useSocket()

  useEffect(() => {
    loadMeeting()
    // Check browser support
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSpeechSupported(false)
    }
  }, [])

  useEffect(() => {
    socket.on('transcript-update', (entry) => {
      setTranscript(prev => [...prev, entry])
    })
    return () => socket.off('transcript-update')
  }, [socket])

  const loadMeeting = async () => {
    try {
      const data = await api.getMeeting(meetingId)
      setMeeting(data)
    } catch (error) {
      console.error('Failed to load meeting:', error)
    } finally {
      setLoading(false)
    }
  }

  // ── Save a transcript entry to backend + socket ──────────
  const saveEntry = useCallback(async (text) => {
    if (!text.trim()) return
    const entry = {
      text: text.trim(),
      timestamp: new Date().toISOString(),
      speaker: 'You'
    }
    setTranscript(prev => [...prev, entry])
    socket.emit('transcript-update', { roomId: meetingId, transcriptEntry: entry })
    try { await api.saveTranscript(meetingId, entry) } catch (_) {}
  }, [meetingId, socket])

  // ── Web Speech API setup ──────────────────────────────────
  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous      = true   // keep listening
    recognition.interimResults  = true   // show partial results
    recognition.lang            = 'en-US'
    recognition.maxAlternatives = 1

    let finalBuffer = ''

    recognition.onresult = (event) => {
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalBuffer += result[0].transcript + ' '
        } else {
          interimText += result[0].transcript
        }
      }

      // Show interim text live
      setPendingText(interimText)

      // When we have a final sentence, save it after a short debounce
      if (finalBuffer.trim()) {
        clearTimeout(saveTimerRef.current)
        const textToSave = finalBuffer.trim()
        finalBuffer = ''
        saveTimerRef.current = setTimeout(() => {
          setPendingText('')
          saveEntry(textToSave)
        }, 300)
      }
    }

    recognition.onerror = (event) => {
      // 'no-speech' and 'aborted' are normal — don't show as errors
      if (event.error === 'no-speech' || event.error === 'aborted') return
      if (event.error === 'not-allowed') {
        setMicError('Microphone permission denied. Please allow mic access.')
        isActiveRef.current = false
        return
      }
      console.warn('Speech recognition error:', event.error)
    }

    recognition.onend = () => {
      // Auto-restart as long as meeting is active
      // This handles the browser's ~60s auto-stop limit
      if (isActiveRef.current) {
        try { recognition.start() } catch (_) {}
      }
    }

    recognitionRef.current = recognition
    isActiveRef.current = true

    try {
      recognition.start()
      setIsRecording(true)
    } catch (e) {
      console.error('Failed to start speech recognition:', e)
    }
  }, [saveEntry])

  // ── Start meeting ─────────────────────────────────────────
  const startMeeting = async () => {
    setMicError('')
    try {
      await startMedia()
      socket.emit('join-room', meetingId, userId)
      setIsMeetingStarted(true)
      startSpeechRecognition()
    } catch (error) {
      console.error('Failed to start meeting:', error)
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicError('Microphone/camera permission denied. Please allow access and try again.')
      } else if (error.name === 'NotFoundError') {
        setMicError('No microphone or camera found.')
      } else {
        setMicError(`Could not access camera/mic: ${error.message}`)
      }
    }
  }

  // ── End meeting ───────────────────────────────────────────
  const endMeeting = () => {
    isActiveRef.current = false
    clearTimeout(saveTimerRef.current)

    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (_) {}
      recognitionRef.current = null
    }

    setIsRecording(false)
    leaveCall()
    socket.emit('leave-room', meetingId, userId)
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <p>Loading meeting…</p>
      </div>
    )
  }

  return (
    <div className="meeting-room">
      <div className="meeting-header">
        <h2>{meeting?.title || 'Meeting Room'}</h2>
        <button className="secondary" onClick={() => setShowTranscript(v => !v)}>
          {showTranscript ? 'Hide Transcript' : 'Show Transcript'}
        </button>
      </div>

      {!speechSupported && (
        <div style={{
          background: 'rgba(245,158,11,0.12)',
          border: '1px solid rgba(245,158,11,0.3)',
          color: '#fbbf24',
          padding: '0.75rem 1.5rem',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          ⚠️ Live transcription requires Chrome or Edge. Other browsers are not supported.
        </div>
      )}

      {micError && (
        <div style={{
          background: 'rgba(244,63,94,0.12)',
          border: '1px solid rgba(244,63,94,0.3)',
          color: '#fb7185',
          padding: '0.75rem 1.5rem',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          ⚠️ {micError}
        </div>
      )}

      <div className={`meeting-content ${showTranscript ? 'with-transcript' : ''}`}>
        <VideoGrid localStream={localStream} remoteStreams={remoteStreams} />
        {showTranscript && (
          <Transcript
            transcript={transcript}
            isRecording={isRecording}
            pendingText={pendingText}
          />
        )}
      </div>

      <Controls
        onStartMeeting={startMeeting}
        onEndMeeting={endMeeting}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        isMeetingStarted={isMeetingStarted}
        localStream={localStream}
        isRecording={isRecording}
      />
    </div>
  )
}

export default MeetingRoom
