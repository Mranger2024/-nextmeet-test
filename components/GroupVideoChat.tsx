import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import WebRTCService from '@/lib/webrtc'
import toast from 'react-hot-toast'

interface GroupMember {
  id: string
  username: string
  display_name: string
  stream?: MediaStream
}

interface GroupChatProps {
  roomId: string
  members: GroupMember[]
  onClose: () => void
}

export default function GroupVideoChat({ roomId, members, onClose }: GroupChatProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [peerConnections, setPeerConnections] = useState<Map<string, RTCPeerConnection>>(new Map())
  const socketRef = useRef<Socket | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const initializeGroupChat = async () => {
      try {
        // Initialize socket connection
        socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001')
        
        // Get local media stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        })
        
        setLocalStream(stream)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // Create peer connections for each member
        members.forEach(member => {
          if (member.id !== socketRef.current?.id) {
            createPeerConnection(member.id, stream)
          }
        })

        // Socket event listeners
        socketRef.current.on('user-joined', handleUserJoined)
        socketRef.current.on('user-left', handleUserLeft)
        socketRef.current.on('offer', handleOffer)
        socketRef.current.on('answer', handleAnswer)
        socketRef.current.on('ice-candidate', handleIceCandidate)

        // Join room
        socketRef.current.emit('join-room', { roomId })
      } catch (error) {
        toast.error('Failed to initialize video chat')
      }
    }

    initializeGroupChat()

    return () => {
      // Cleanup
      localStream?.getTracks().forEach(track => track.stop())
      peerConnections.forEach(pc => pc.close())
      socketRef.current?.disconnect()
    }
  }, [roomId, members])

  const createPeerConnection = (peerId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    })

    // Add local stream
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream)
    })

    // Handle ICE candidates
    pc.onicecandidate = event => {
      if (event.candidate) {
        socketRef.current?.emit('ice-candidate', {
          candidate: event.candidate,
          to: peerId
        })
      }
    }

    // Handle incoming stream
    pc.ontrack = event => {
      const member = members.find(m => m.id === peerId)
      if (member) {
        member.stream = event.streams[0]
      }
    }

    setPeerConnections(prev => new Map(prev.set(peerId, pc)))
    return pc
  }

  const handleUserJoined = async ({ userId }: { userId: string }) => {
    if (!localStream) return
    const pc = createPeerConnection(userId, localStream)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socketRef.current?.emit('offer', { offer, to: userId })
  }

  const handleUserLeft = ({ userId }: { userId: string }) => {
    const pc = peerConnections.get(userId)
    if (pc) {
      pc.close()
      peerConnections.delete(userId)
      setPeerConnections(new Map(peerConnections))
    }
  }

  const handleOffer = async ({ offer, from }: { offer: RTCSessionDescriptionInit, from: string }) => {
    if (!localStream) return
    const pc = createPeerConnection(from, localStream)
    await pc.setRemoteDescription(offer)
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    socketRef.current?.emit('answer', { answer, to: from })
  }

  const handleAnswer = async ({ answer, from }: { answer: RTCSessionDescriptionInit, from: string }) => {
    const pc = peerConnections.get(from)
    if (pc) {
      await pc.setRemoteDescription(answer)
    }
  }

  const handleIceCandidate = async ({ candidate, from }: { candidate: RTCIceCandidateInit, from: string }) => {
    const pc = peerConnections.get(from)
    if (pc) {
      await pc.addIceCandidate(candidate)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50">
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Group Video Chat</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>

        <div className="flex-1 grid grid-cols-3 gap-4 auto-rows-fr">
          {/* Local video */}
          <div className="relative bg-gray-800 rounded-xl overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-sm">
              You
            </div>
          </div>

          {/* Remote videos */}
          {members.map(member => member.stream && (
            <div key={member.id} className="relative bg-gray-800 rounded-xl overflow-hidden">
              <video
                ref={videoEl => {
                  if (videoEl && member.stream) {
                    videoEl.srcObject = member.stream;
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-sm">
                {member.display_name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 