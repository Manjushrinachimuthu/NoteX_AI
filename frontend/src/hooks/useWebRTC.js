import { useState, useEffect, useRef, useCallback } from 'react'
import { socket } from '../services/socket'

export const useWebRTC = (roomId, userId) => {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState({})
  const [isConnected, setIsConnected] = useState(false)
  const peerConnections = useRef({})

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  }

  const createPeerConnection = useCallback(async (peerId) => {
    const pc = new RTCPeerConnection(servers)

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { candidate: event.candidate, to: peerId })
      }
    }

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({ ...prev, [peerId]: event.streams[0] }))
    }

    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream))
    }

    peerConnections.current[peerId] = pc
    return pc
  }, [localStream])

  const startMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      setLocalStream(stream)
      return stream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      throw error
    }
  }, [])

  const callUser = useCallback(async (userToCall) => {
    const pc = await createPeerConnection(userToCall)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    socket.emit('call-user', {
      userToCall,
      signalData: offer,
      from: userId
    })
  }, [createPeerConnection, userId])

  const answerCall = useCallback(async (signal, from) => {
    const pc = await createPeerConnection(from)
    await pc.setRemoteDescription(new RTCSessionDescription(signal))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    socket.emit('answer-call', { signal: answer, to: from })
  }, [createPeerConnection])

  useEffect(() => {
    socket.on('call-user', async ({ signal, from }) => {
      await answerCall(signal, from)
    })

    socket.on('call-accepted', async (signal) => {
      const pc = Object.values(peerConnections.current)[0]
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(signal))
        setIsConnected(true)
      }
    })

    socket.on('ice-candidate', async ({ candidate, from }) => {
      const pc = peerConnections.current[from]
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      }
    })

    socket.on('user-joined', async (userId) => {
      console.log('User joined:', userId)
    })

    return () => {
      socket.off('call-user')
      socket.off('call-accepted')
      socket.off('ice-candidate')
      socket.off('user-joined')
    }
  }, [answerCall])

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
      }
    }
  }, [localStream])

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
      }
    }
  }, [localStream])

  const leaveCall = useCallback(() => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop())
    }
    Object.values(peerConnections.current).forEach(pc => pc.close())
    setLocalStream(null)
    setRemoteStreams({})
    setIsConnected(false)
  }, [localStream])

  return {
    localStream,
    remoteStreams,
    isConnected,
    startMedia,
    callUser,
    answerCall,
    toggleVideo,
    toggleAudio,
    leaveCall
  }
}