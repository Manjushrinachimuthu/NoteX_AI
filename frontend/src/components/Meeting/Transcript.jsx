import { useEffect, useRef } from 'react'

const Transcript = ({ transcript }) => {
  const listRef = useRef()

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [transcript])

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="transcript-panel">
      <h3>Live Transcript</h3>

      <div className="transcript-list" ref={listRef}>
        {transcript.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            Transcript will appear here when speaking...
          </p>
        ) : (
          transcript.map((entry, index) => (
            <div key={index} className="transcript-entry">
              <span className="time">{formatTime(entry.timestamp)}</span>
              <p className="speaker">{entry.speaker}</p>
              <p>{entry.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Transcript