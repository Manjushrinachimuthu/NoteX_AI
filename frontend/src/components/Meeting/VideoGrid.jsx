import { useEffect, useRef } from 'react'

const VideoGrid = ({ localStream, remoteStreams }) => {
  const localVideoRef = useRef()
  const remoteVideoRefs = useRef({})

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    Object.entries(remoteStreams).forEach(([userId, stream]) => {
      if (remoteVideoRefs.current[userId]) {
        remoteVideoRefs.current[userId].srcObject = stream
      }
    })
  }, [remoteStreams])

  return (
    <div className="video-grid">
      {localStream && (
        <div className="video-container local">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
          />
          <span className="label">You</span>
        </div>
      )}

      {Object.entries(remoteStreams).map(([userId, stream]) => (
        <div key={userId} className="video-container">
          <video
            ref={el => remoteVideoRefs.current[userId] = el}
            autoPlay
            playsInline
          />
          <span className="label">Participant</span>
        </div>
      ))}
    </div>
  )
}

export default VideoGrid