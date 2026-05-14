import { useEffect, useRef } from 'react'

const Transcript = ({ transcript, isRecording, pendingText }) => {
  const listRef = useRef()

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [transcript, pendingText])

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="transcript-panel">
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        marginBottom: '0.875rem', paddingBottom: '0.75rem',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <h3 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600,
          color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Live Transcript
        </h3>
        {isRecording && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: '0.375rem',
            fontSize: '0.6875rem', color: '#fb7185', fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.05em', marginLeft: 'auto'
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: '#fb7185',
              display: 'inline-block', animation: 'pulse 1.2s ease-in-out infinite'
            }} />
            Recording
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="transcript-list" ref={listRef}>
        {transcript.length === 0 && !pendingText ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center',
            fontSize: '0.875rem', padding: '1rem 0' }}>
            {isRecording
              ? 'Listening… start speaking'
              : 'Start the meeting to begin live transcription'}
          </p>
        ) : (
          <>
            {transcript.map((entry, index) => (
              <div key={index} className="transcript-entry">
                <div style={{ display: 'flex', alignItems: 'center',
                  gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="speaker">{entry.speaker}</span>
                  <span className="time">{formatTime(entry.timestamp)}</span>
                </div>
                <p>{entry.text}</p>
              </div>
            ))}

            {/* Live interim text — shown while speaking, before final result */}
            {pendingText && (
              <div className="transcript-entry" style={{
                borderColor: 'rgba(124,58,237,0.2)',
                background: 'rgba(124,58,237,0.05)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center',
                  gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="speaker">You</span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--primary-light)',
                    fontStyle: 'italic' }}>speaking…</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {pendingText}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Transcript
