const Controls = ({ onStartMeeting, onEndMeeting, onToggleVideo, onToggleAudio, isMeetingStarted, localStream }) => {
  const isVideoEnabled = localStream?.getVideoTracks()[0]?.enabled ?? true
  const isAudioEnabled = localStream?.getAudioTracks()[0]?.enabled ?? true

  return (
    <div className="controls">
      {!isMeetingStarted ? (
        <button className="control-btn start" onClick={onStartMeeting} title="Start Meeting">
          ▶
        </button>
      ) : (
        <>
          <button
            className={`control-btn ${isAudioEnabled ? '' : 'active'}`}
            onClick={onToggleAudio}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? '🎤' : '🔇'}
          </button>

          <button
            className={`control-btn ${isVideoEnabled ? '' : 'active'}`}
            onClick={onToggleVideo}
            title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          >
            {isVideoEnabled ? '📹' : '📷'}
          </button>

          <button className="control-btn end" onClick={onEndMeeting} title="End Meeting">
            ⏹
          </button>
        </>
      )}
    </div>
  )
}

export default Controls