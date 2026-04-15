import { useEffect, useState } from 'react'
import { socket, connectSocket, disconnectSocket } from '../services/socket'

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(socket.connected)

  useEffect(() => {
    connectSocket()

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [])

  return { socket, isConnected }
}