import { useState, useEffect, useRef } from 'react'
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
  const [transcript, setTranscript] = useState([])
  const [showTranscript, setShowTranscript] = useState(false)
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const mediaRecorder = useRef(null)
  const audioChunks = useRef([])

  const userId = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user'))._id : 'anonymous'

  const { localStream, remoteStreams, startMedia, toggleVideo, toggleAudio, leaveCall } = useWebRTC(meetingId, userId)
  const { socket } = useSocket()

  useEffect(() => {
    loadMeeting()
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  useEffect(() => {
    socket.on('transcript-update', (entry) => {
      setTranscript(prev => [...prev, entry])
    })

    return () => {
      socket.off('transcript-update')
    }
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

  const startMeeting = async () => {
    try {
      await startMedia()
      socket.emit('join-room', meetingId, userId)
      setIsMeetingStarted(true)
      startRecording()
    } catch (error) {
      console.error('Failed to start meeting:', error)
    }
  }

  const startRecording = () => {
    if (!localStream) return

    audioChunks.current = []
    mediaRecorder.current = new MediaRecorder(localStream, {
      mimeType: 'audio/webm;codecs=opus'
    })

    mediaRecorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.current.push(event.data)
      }
    }

    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm;codecs=opus' })
      await transcribeAudio(audioBlob)
    }

    mediaRecorder.current.start(5000)
  }

  const transcribeAudio = async (audioBlob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.webm')

      const response = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        const entry = {
          text: data.text,
          timestamp: new Date().toISOString(),
          speaker: 'You'
        }
        setTranscript(prev => [...prev, entry])
        socket.emit('transcript-update', { roomId: meetingId, transcriptEntry: entry })

        try {
          await api.saveTranscript(meetingId, entry)
        } catch (e) {
          console.error('Failed to save transcript:', e)
        }
      }
    } catch (error) {
      console.error('Transcription error:', error)
    }
  }

  const endMeeting = () => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      mediaRecorder.current.stop()
    }
    leaveCall()
    socket.emit('leave-room', meetingId, userId)
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading meeting...</p>
      </div>
    )
  }

  return (
    <div className="meeting-room">
      <div className="meeting-header">
        <h2>{meeting?.title || 'Meeting Room'}</h2>
        <button className="secondary" onClick={() => setShowTranscript(!showTranscript)}>
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
  )
}

export default MeetingRoom