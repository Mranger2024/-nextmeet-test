import { useState, useEffect, useRef } from 'react'
import { Socket } from 'socket.io-client'

interface GroupMember {
  id: string
  username: string
  display_name: string
  stream?: MediaStream
}

export function useGroupVideoChat(roomId: string, members: GroupMember[]) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map())
  const socketRef = useRef<Socket | null>(null)

  // ... rest of the logic from GroupVideoChat component

  return {
    localStream,
    peerConnections,
    socketRef
  }
} 