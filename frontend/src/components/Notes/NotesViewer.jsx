import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { generateMeetingPDF } from '../../utils/pdfGenerator'
import Chatbot from './Chatbot'

const LANGUAGES = [
  { code: 'en', name: 'English',  flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi',    flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil',    flag: '🇮🇳' },
  { code: 'te', name: 'Telugu',   flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi',  flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali',  flag: '🇮🇳' },
  { code: 'es', name: 'Spanish',  flag: '🇪🇸' },
  { code: 'fr', name: 'French',   flag: '🇫🇷' },
  { code: 'de', name: 'German',   flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese',  flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic',   flag: '🇸🇦' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
]

const JUNK_RE = /^\[Set GROQ|^\[Transcription unavailable|^\[Whisper/i
const cleanTranscript = (t = []) => t.filter(e => e?.text && !JUNK_RE.test(e.text))

// ── PDF Download Modal ────────────────────────────────────────
function PdfModal({ meetingId, meeting, notes, summary,
                    preselectedLang, preTranslatedEntries, onClose }) {

  // Pre-select the language already shown on screen
  const [pdfLang, setPdfLang]     = useState(preselectedLang || 'en')
  const [preparing, setPreparing] = useState(false)
  const [status, setStatus]       = useState(
    preselectedLang && preselectedLang !== 'en' && preTranslatedEntries?.length > 0
      ? `✓ Already translated to ${LANGUAGES.find(l => l.code === preselectedLang)?.name} — ready to download`
      : ''
  )

  const selectedLang = LANGUAGES.find(l => l.code === pdfLang) || LANGUAGES[0]

  // When user picks a different language in the modal, clear the pre-translated cache
  const [cachedEntries, setCachedEntries] = useState(
    preselectedLang === pdfLang ? (preTranslatedEntries || []) : []
  )

  const handleLangChange = (code) => {
    setPdfLang(code)
    // If switching back to the pre-translated language, reuse cache
    if (code === preselectedLang && preTranslatedEntries?.length > 0) {
      setCachedEntries(preTranslatedEntries)
      setStatus(`✓ Already translated to ${LANGUAGES.find(l => l.code === code)?.name} — ready to download`)
    } else if (code === 'en') {
      setCachedEntries([])
      setStatus('')
    } else {
      setCachedEntries([])
      setStatus('')
    }
  }

  const handleDownload = async () => {
    setPreparing(true)
    setStatus('')

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    const AI_URL  = 'http://localhost:8000'
    const token   = localStorage.getItem('token')

    try {
      let transcriptForPDF = cleanTranscript(notes?.transcript || [])
      let summaryForPDF    = summary || notes?.generatedSummary || ''
      let langLabel        = null

      if (pdfLang !== 'en') {
        langLabel = selectedLang.name

        // ── Use already-translated entries if available ──────
        if (cachedEntries.length > 0) {
          transcriptForPDF = cachedEntries
          setStatus(`Generating PDF in ${selectedLang.name}…`)
        } else {
          // Need to translate fresh
          setStatus(`Translating transcript to ${selectedLang.name}…`)

          if (transcriptForPDF.length > 0) {
            try {
              const res = await fetch(`${API_URL}/api/notes/${meetingId}/translate`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ targetLanguage: pdfLang })
              })
              if (res.ok) {
                const data = await res.json()
                if (data.entries?.length > 0) transcriptForPDF = data.entries
              } else {
                console.warn('Transcript translation failed:', res.status)
              }
            } catch (e) {
              console.warn('Transcript translation error:', e.message)
            }
          }

          // Translate summary
          if (summaryForPDF) {
            setStatus(`Translating summary to ${selectedLang.name}…`)
            try {
              const res = await fetch(`${AI_URL}/translate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: summaryForPDF,
                  target_language: pdfLang,
                  source_language: 'auto'
                })
              })
              if (res.ok) {
                const data = await res.json()
                if (data.translated) summaryForPDF = data.translated
              } else {
                console.warn('Summary translation failed:', res.status)
              }
            } catch (e) {
              console.warn('Summary translation error:', e.message)
            }
          }
        }
      }

      setStatus('Generating PDF…')
      const notesForPDF = { ...notes, transcript: transcriptForPDF }
      generateMeetingPDF(meeting, notesForPDF, summaryForPDF, langLabel, pdfLang)
      onClose()
    } catch (err) {
      console.error('PDF generation failed:', err)
      setStatus('Failed: ' + err.message)
      setPreparing(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--gradient-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.25rem', boxShadow: '0 4px 12px var(--primary-glow)'
          }}>📄</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Download PDF</h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              Select language — already translated content downloads instantly
            </p>
          </div>
        </div>

        {/* Language grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem', marginBottom: '1.25rem'
        }}>
          {LANGUAGES.map(lang => {
            const isPreTranslated = lang.code === preselectedLang
              && preTranslatedEntries?.length > 0
              && lang.code !== 'en'
            return (
              <button
                key={lang.code}
                onClick={() => handleLangChange(lang.code)}
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: '0.2rem',
                  padding: '0.5rem 0.25rem',
                  background: pdfLang === lang.code
                    ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                  border: pdfLang === lang.code
                    ? '1px solid rgba(124,58,237,0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  color: pdfLang === lang.code
                    ? 'var(--primary-light)' : 'var(--text-secondary)',
                  fontSize: '0.6875rem', fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.15s',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{lang.flag}</span>
                <span>{lang.name}</span>
                {/* Green dot = already translated, instant download */}
                {isPreTranslated && (
                  <span style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#10b981',
                    boxShadow: '0 0 4px rgba(16,185,129,0.6)'
                  }} title="Already translated" />
                )}
              </button>
            )
          })}
        </div>

        {/* Status / info */}
        {status && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.625rem',
            padding: '0.625rem 0.875rem',
            background: status.startsWith('✓')
              ? 'rgba(16,185,129,0.1)' : 'rgba(124,58,237,0.1)',
            border: `1px solid ${status.startsWith('✓')
              ? 'rgba(16,185,129,0.25)' : 'rgba(124,58,237,0.2)'}`,
            borderRadius: '8px', marginBottom: '1rem',
            fontSize: '0.8125rem',
            color: status.startsWith('✓') ? '#34d399' : 'var(--primary-light)'
          }}>
            {preparing && !status.startsWith('✓') && (
              <div style={{
                width: 14, height: 14,
                border: '2px solid rgba(124,58,237,0.3)',
                borderTopColor: 'var(--primary-light)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite', flexShrink: 0
              }} />
            )}
            {status}
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button className="secondary" onClick={onClose} disabled={preparing}>
            Cancel
          </button>
          <button className="primary" onClick={handleDownload} disabled={preparing}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {preparing ? (
              <>
                <div style={{
                  width: 14, height: 14,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }} />
                Processing…
              </>
            ) : (
              <>⬇ Download in {selectedLang.name}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main NotesViewer ──────────────────────────────────────────
export default function NotesViewer() {
  const { meetingId } = useParams()
  const navigate = useNavigate()

  const [notes,      setNotes]      = useState(null)
  const [meeting,    setMeeting]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [summary,    setSummary]    = useState('')
  const [generating, setGenerating] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)

  // Screen-view translation
  const [selectedLang,      setSelectedLang]      = useState('en')
  const [translating,       setTranslating]       = useState(false)
  const [translatedEntries, setTranslatedEntries] = useState([])
  const [showLangMenu,      setShowLangMenu]      = useState(false)

  useEffect(() => { loadData() }, [meetingId])

  const loadData = async () => {
    try {
      const [notesData, meetingData] = await Promise.all([
        api.getNotes(meetingId),
        api.getMeeting(meetingId)
      ])
      setNotes(notesData)
      setMeeting(meetingData)
      if (notesData?.generatedSummary) setSummary(notesData.generatedSummary)
    } catch (err) {
      console.error('Failed to load notes:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSummary = async () => {
    setGenerating(true)
    try {
      const result = await api.getSummary(meetingId)
      setSummary(result.summary)
      setTranslatedEntries([])
      setSelectedLang('en')
    } catch (err) {
      console.error('Failed to generate summary:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleViewTranslate = async (langCode) => {
    setShowLangMenu(false)
    if (langCode === 'en') {
      setSelectedLang('en')
      setTranslatedEntries([])
      return
    }
    setSelectedLang(langCode)
    setTranslating(true)
    try {
      const result = await api.translateNotes(meetingId, langCode)
      setTranslatedEntries(result.entries || [])
    } catch (err) {
      console.error('Translation failed:', err)
      setTranslatedEntries([])
    } finally {
      setTranslating(false)
    }
  }

  const currentLang      = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0]
  const displayTranscript = selectedLang !== 'en' && translatedEntries.length > 0
    ? translatedEntries
    : cleanTranscript(notes?.transcript || [])

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <p>Loading notes…</p>
      </div>
    )
  }

  return (
    <div className="notes-viewer">
      <div className="notes-container">

        {/* ── Header ── */}
        <div className="notes-header">
          <button className="secondary" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>

          <div className="notes-header-actions">
            {/* Screen view language toggle */}
            <div style={{ position: 'relative' }}>
              <button
                className="secondary"
                onClick={() => setShowLangMenu(v => !v)}
                disabled={translating}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                title="Translate view"
              >
                <span>{currentLang.flag}</span>
                <span style={{ fontSize: '0.8125rem' }}>{currentLang.name}</span>
                {translating
                  ? <span style={{ fontSize: '0.7rem', color: 'var(--primary-light)' }}>…</span>
                  : <span style={{ fontSize: '0.5rem', opacity: 0.5 }}>▼</span>
                }
              </button>

              {showLangMenu && (
                <div style={{
                  position: 'absolute', top: '110%', right: 0,
                  background: 'rgba(15,12,30,0.97)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '12px', padding: '0.5rem',
                  zIndex: 200, minWidth: '180px',
                  boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(16px)'
                }}>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)',
                    padding: '0.25rem 0.75rem 0.5rem',
                    textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    View language
                  </p>
                  {LANGUAGES.map(lang => (
                    <button key={lang.code}
                      onClick={() => handleViewTranslate(lang.code)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.625rem',
                        width: '100%', padding: '0.5rem 0.75rem',
                        background: selectedLang === lang.code
                          ? 'rgba(124,58,237,0.2)' : 'transparent',
                        border: 'none', borderRadius: '8px',
                        color: selectedLang === lang.code
                          ? 'var(--primary-light)' : 'var(--text-secondary)',
                        fontSize: '0.875rem', cursor: 'pointer', textAlign: 'left'
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{lang.flag}</span>
                      <span>{lang.name}</span>
                      {selectedLang === lang.code && (
                        <span style={{ marginLeft: 'auto' }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Download PDF — passes current translated state */}
            <button className="primary" onClick={() => setShowPdfModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⬇ Download PDF
              {selectedLang !== 'en' && translatedEntries.length > 0 && (
                <span style={{
                  fontSize: '0.6875rem', background: 'rgba(255,255,255,0.2)',
                  padding: '1px 6px', borderRadius: '10px'
                }}>
                  {currentLang.flag}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Meeting info ── */}
        <div className="notes-content">
          <h1>{meeting?.title || 'Meeting Notes'}</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.375rem', fontSize: '0.875rem' }}>
            📅 {new Date(meeting?.createdAt).toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
          {selectedLang !== 'en' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
              marginTop: '0.5rem', padding: '0.25rem 0.75rem',
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.3)',
              borderRadius: '20px', fontSize: '0.75rem', color: 'var(--primary-light)'
            }}>
              {currentLang.flag} Viewing in {currentLang.name}
            </span>
          )}
        </div>

        {/* ── AI Summary ── */}
        <div className="notes-section">
          <h2>AI Summary</h2>
          {summary ? (
            <div className="card">
              <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)',
                lineHeight: 1.7, fontSize: '0.9375rem' }}>
                {summary}
              </p>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                Generate an AI-powered summary of this meeting
              </p>
              <button className="primary" onClick={handleGenerateSummary} disabled={generating}>
                {generating ? 'Generating…' : 'Generate Summary'}
              </button>
            </div>
          )}
        </div>

        {/* ── Transcript ── */}
        {displayTranscript.length > 0 && (
          <div className="notes-section">
            <h2>
              Transcript
              {selectedLang !== 'en' && translatedEntries.length > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-light)',
                  fontWeight: 400, marginLeft: '0.5rem',
                  textTransform: 'none', letterSpacing: 0 }}>
                  ({currentLang.name})
                </span>
              )}
            </h2>

            {translating ? (
              <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="loader" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Translating to {currentLang.name}…
                </p>
              </div>
            ) : (
              <div className="card" style={{ padding: '1.25rem' }}>
                {displayTranscript.map((entry, i, arr) => (
                  <div key={i} style={{
                    marginBottom: '1rem', paddingBottom: '1rem',
                    borderBottom: i < arr.length - 1
                      ? '1px solid rgba(255,255,255,0.06)' : 'none'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center',
                      gap: '0.625rem', marginBottom: '0.375rem' }}>
                      <strong style={{ color: 'var(--primary-light)', fontSize: '0.875rem' }}>
                        {entry.speaker || 'You'}
                      </strong>
                      {entry.timestamp && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                      {entry.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Chatbot ── */}
        <div className="notes-section">
          <h2>Ask Questions</h2>
          <Chatbot meetingId={meetingId} />
        </div>
      </div>

      {showLangMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 199 }}
          onClick={() => setShowLangMenu(false)} />
      )}

      {/* PDF modal — passes already-translated entries from screen view */}
      {showPdfModal && (
        <PdfModal
          meetingId={meetingId}
          meeting={meeting}
          notes={notes}
          summary={summary}
          preselectedLang={selectedLang}
          preTranslatedEntries={translatedEntries}
          onClose={() => setShowPdfModal(false)}
        />
      )}
    </div>
  )
}
