import { useState, useEffect, useRef } from 'react'

const Controls = ({
  onStartMeeting, onEndMeeting,
  onToggleVideo, onToggleAudio,
  isMeetingStarted, localStream, isRecording
}) => {
  const [audioLevel, setAudioLevel] = useState(0)
  const rafRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)

  const isVideoEnabled = localStream?.getVideoTracks()[0]?.enabled ?? true
  const isAudioEnabled = localStream?.getAudioTracks()[0]?.enabled ?? true

  // Start visualizer as soon as we have a stream (even before recording)
  useEffect(() => {
    if (!localStream) return

    let ctx
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      const source = ctx.createMediaStreamSource(localStream)
      source.connect(analyser)
      audioCtxRef.current = ctx
      analyserRef.current = analyser
    } catch (e) {
      console.warn('AudioContext failed:', e)
      return
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)

    const tick = () => {
      if (!analyserRef.current) return
      analyserRef.current.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      setAudioLevel(avg)
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {})
        audioCtxRef.current = null
        analyserRef.current = null
      }
    }
  }, [localStream])

  return (
    <div className="controls">
      {!isMeetingStarted ? (
        <button className="control-btn start" onClick={onStartMeeting} title="Start Meeting">
          ▶
        </button>
      ) : (
        <>
          {/* Mic toggle */}
          <button
            className={`control-btn ${!isAudioEnabled ? 'active' : ''}`}
            onClick={onToggleAudio}
            title={isAudioEnabled ? 'Mute mic' : 'Unmute mic'}
          >
            {isAudioEnabled ? '🎤' : '🔇'}
          </button>

          {/* Camera toggle */}
          <button
            className={`control-btn ${!isVideoEnabled ? 'active' : ''}`}
            onClick={onToggleVideo}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? '📹' : '📷'}
          </button>

          {/* Live mic visualizer — always visible once meeting started */}
          <div className="recording-status">
            <div className="audio-indicator">
              <span className={`rec-dot ${audioLevel > 8 ? 'active' : ''}`} />
              <span className="rec-label">
                {isRecording ? 'REC' : 'LIVE'}
              </span>
            </div>
            <div className="audio-level-bar">
              <div
                className="audio-level-fill"
                style={{ width: `${Math.min(audioLevel * 2.5, 100)}%` }}
              />
            </div>
            <span className="audio-status">
              {audioLevel > 8 ? '🔊 Voice detected' : '🔇 Silence'}
            </span>
          </div>

          {/* End meeting */}
          <button className="control-btn end" onClick={onEndMeeting} title="End meeting">
            ⏹
          </button>
        </>
      )}
    </div>
  )
}

export default Controls
