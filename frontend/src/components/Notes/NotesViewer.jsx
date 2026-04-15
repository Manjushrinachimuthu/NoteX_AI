import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { generateMeetingPDF } from '../../utils/pdfGenerator'
import Chatbot from './Chatbot'

const NotesViewer = () => {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const [notes, setNotes] = useState(null)
  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    loadData()
  }, [meetingId])

  const loadData = async () => {
    try {
      const [notesData, meetingData] = await Promise.all([
        api.getNotes(meetingId),
        api.getMeeting(meetingId)
      ])
      setNotes(notesData)
      setMeeting(meetingData)
    } catch (error) {
      console.error('Failed to load notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSummary = async () => {
    setGenerating(true)
    try {
      const result = await api.getSummary(meetingId)
      setSummary(result.summary)
    } catch (error) {
      console.error('Failed to generate summary:', error)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadPDF = () => {
    if (notes && meeting) {
      generateMeetingPDF(meeting, notes)
    }
  }

  const handleTranslate = async (targetLanguage) => {
    try {
      await api.translateNotes(meetingId, targetLanguage)
      loadData()
    } catch (error) {
      console.error('Failed to translate:', error)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading notes...</p>
      </div>
    )
  }

  return (
    <div className="notes-viewer">
      <div className="notes-container">
        <div className="notes-header">
          <button className="secondary" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <div>
            <button className="secondary" onClick={handleDownloadPDF}>
              Download PDF
            </button>
          </div>
        </div>

        <div className="notes-content">
          <h1>{meeting?.title || 'Meeting Notes'}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Created: {new Date(meeting?.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="notes-section">
          <h2>AI Summary</h2>
          {summary || notes?.generatedSummary ? (
            <div className="card">
              <p style={{ whiteSpace: 'pre-wrap' }}>
                {summary || notes?.generatedSummary}
              </p>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                No summary available yet.
              </p>
              <button
                className="primary"
                onClick={handleGenerateSummary}
                disabled={generating}
              >
                {generating ? 'Generating...' : 'Generate Summary with AI'}
              </button>
            </div>
          )}
        </div>

        {notes?.transcript?.length > 0 && (
          <div className="notes-section">
            <h2>Transcript</h2>
            <div className="card">
              {notes.transcript.map((entry, index) => (
                <div key={index} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                  <strong>{entry.speaker}</strong>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '0.5rem', fontSize: '0.875rem' }}>
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  <p>{entry.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="notes-section">
          <h2>Ask Questions</h2>
          <Chatbot meetingId={meetingId} />
        </div>
      </div>
    </div>
  )
}

export default NotesViewer