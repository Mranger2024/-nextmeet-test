'use client'

import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import WebRTCService from '@/lib/webrtc'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import Sidebar from './Sidebar'

interface ServerToClientEvents {
  matched: (data: { partnerId: string, interests: string[] }) => void
  'match-found': (data: { partnerId: string }) => void
  offer: (data: { offer: RTCSessionDescriptionInit, from: string }) => void
  answer: (data: { answer: RTCSessionDescriptionInit, from: string }) => void
  'ice-candidate': (data: { candidate: RTCIceCandidateInit, from: string }) => void
  message: (message: Message) => void
  notification: (notification: Notification) => void
  activeUsers: (count: number) => void
  userStats: (stats: { likes: number, dislikes: number }) => void
  friendRequest: (data: { from: string, username: string }) => void
}

interface ClientToServerEvents {
  waiting: (data: { 
    interests: string[], 
    deviceId: string,
    filters: FilterSettings,
    userProfile: UserProfile 
  }) => void
  offer: (data: { offer: RTCSessionDescriptionInit, to: string }) => void
  answer: (data: { answer: RTCSessionDescriptionInit, to: string }) => void
  'ice-candidate': (data: { candidate: RTCIceCandidateInit, to: string }) => void
  message: (data: { text: string, to: string }) => void
  report: (data: { reportedUser: string, reason: string }) => void
  like: (data: { userId: string }) => void
  dislike: (data: { userId: string }) => void
  friendRequest: (data: { from: string, username: string }) => void
}

interface Message {
  text: string
  from: string
  timestamp: number
}

interface Notification {
  id: string
  type: 'info' | 'error' | 'success' | 'friend_request' | 'room_invite' | 'message'
  message?: string
  content?: string
  from_user_id: string
  read: boolean
  created_at: string
}

interface UserProfile {
  gender: string
  country: string
  avatar_url: string | null
}

interface FilterSettings {
  gender: string[]
  countries: string[]
}

const ICE_SERVERS = {
  iceServers: [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302'
      ]
    }
  ]
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

const VideoChat = () => {
  const [isMatching, setIsMatching] = useState<boolean>(false)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
  const webrtcRef = useRef<WebRTCService | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [activeUsers, setActiveUsers] = useState<number>(0)
  const [partnerStats, setPartnerStats] = useState<{ likes: number; dislikes: number }>({ likes: 0, dislikes: 0 })
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isWaiting, setIsWaiting] = useState(false)
  const [isChatting, setIsChatting] = useState(false)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserProfile({
            gender: profile.gender,
            country: profile.country,
            avatar_url: profile.avatar_url
          })
        }
      }
    }

    fetchUserProfile()
  }, [])

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
    }
  }, [remoteStream])

  useEffect(() => {
    try {
      if (socketRef.current) {
        console.log('Socket already exists, cleaning up...')
        socketRef.current.disconnect()
      }

      console.log('Connecting to socket server:', SOCKET_URL)
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000,
        autoConnect: true,
        forceNew: true
      })

      // Debug listeners
      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        toast.error('Connection error. Retrying...')
      })

      socketRef.current.on('connect', () => {
        console.log('Connected to socket server with ID:', socketRef.current?.id)
        setIsOnline(true)
        toast.success('Connected to chat server')
      })

      socketRef.current.on('disconnect', (reason) => {
        console.log('Disconnected from socket server:', reason)
        setIsOnline(false)
      })

    webrtcRef.current = new WebRTCService()

    socketRef.current.on('notification', (notification: Notification) => {
      if (notification.message) {
        switch (notification.type) {
          case 'error':
            toast.error(notification.message)
            break
          case 'success':
            toast.success(notification.message)
            break
          case 'info':
          default:
            toast(notification.message)
            break
        }
      } else if (notification.content) {
        setNotifications(prev => [...prev, notification])
        setUnreadCount(count => count + 1)
      }
    })

    socketRef.current.on('message', (message: Message) => {
      setMessages(prev => [...prev, message])
    })

    socketRef.current.on('activeUsers', (count: number) => {
        setActiveUsers(count)
      })

    socketRef.current.on('userStats', (stats: { likes: number, dislikes: number }) => {
        setPartnerStats(stats)
      })

    socketRef.current.on('friendRequest', (data: { from: string, username: string }) => {
      if (isOnline) {
        toast(handleFriendRequestToast)
      } else {
        addNotification({
          type: 'friend_request',
          from_user_id: data.from,
          content: `${data.username} wants to be friends`
        })
      }
    })

    webrtcRef.current.setOnRemoteStream((stream) => {
      setRemoteStream(stream)
    })

      socketRef.current.on('match-found', (data: { partnerId: string }) => {
        handleMatchFound(data.partnerId)
      })
      socketRef.current.on('offer', handleOffer)
      socketRef.current.on('answer', handleAnswer)
      socketRef.current.on('ice-candidate', handleIceCandidate)

    return () => {
        console.log('Cleaning up socket connection...')
        if (socketRef.current) {
          socketRef.current.disconnect()
        }
      }
    } catch (error) {
      console.error('Socket initialization error:', error)
      toast.error('Failed to initialize chat connection')
    }
  }, [])

  const checkMediaPermissions = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      if (result.state === 'denied') {
        throw new Error('Camera permission denied')
      }
      
      const audioResult = await navigator.permissions.query({ name: 'microphone' as PermissionName })
      if (audioResult.state === 'denied') {
        throw new Error('Microphone permission denied')
      }
      
      return true
    } catch (error) {
      console.error('Permission check error:', error)
      return false
    }
  }

  const skipPartner = () => {
    webrtcRef.current?.cleanup()
    setRemoteStream(null)
    setPartnerId(null)
    setMessages([])
    
    const deviceId = localStorage.getItem('deviceId') || Math.random().toString(36).substring(7)
    socketRef.current?.emit('waiting', { 
      interests: [],
      deviceId,
      filters: {
        gender: [],
        countries: []
      },
      userProfile: {
        gender: userProfile?.gender || '',
        country: userProfile?.country || '',
        avatar_url: userProfile?.avatar_url || null
      }
    })
  }

  const reportUser = () => {
    if (!partnerId) return
    
    socketRef.current?.emit('report', { 
      reportedUser: partnerId,
      reason: 'inappropriate behavior'
    })
    
    toast.success('User reported. Finding new partner...')
    skipPartner()
  }

  const startVideoStream = async () => {
    try {
      const hasPermissions = await checkMediaPermissions()
      if (!hasPermissions) {
        toast.error('Please allow camera and microphone access')
        return null
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })
      return stream
    } catch (error) {
      console.error('Media stream error:', error)
      toast.error('Failed to access camera and microphone')
      return null
    }
  }

  const startChat = async () => {
    if (!socketRef.current?.connected) {
      console.log('Socket not connected, attempting to reconnect...')
      socketRef.current?.connect()
      toast.error('Connecting to chat server...')
      return
    }

    setIsLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      if (!stream) {
        throw new Error('Failed to get media stream')
      }

      setLocalStream(stream)
      localStreamRef.current = stream
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      setIsMatching(true)
      console.log('Emitting waiting event...')

      socketRef.current.emit('waiting', {
        interests: [] as string[],
        deviceId: 'default',
        filters: {
          gender: [] as string[],
          countries: [] as string[]
        },
        userProfile: {
          gender: userProfile?.gender || '',
          country: userProfile?.country || '',
          avatar_url: userProfile?.avatar_url || null
        }
      })
    } catch (error) {
      console.error('Failed to start chat:', error)
      toast.error('Failed to start video chat')
    } finally {
      setIsLoading(false)
    }
  }

  const startSearching = async () => {
    try {
      if (!socketRef.current?.connected) {
        toast.error('Not connected to chat server')
        return
      }

      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      })

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current
      }

      setIsWaiting(true)
      console.log('Emitting waiting event...')
      
      socketRef.current.emit('waiting', {
        interests: [] as string[],
        deviceId: 'default',
        filters: {
          gender: [] as string[],
          countries: [] as string[]
        },
        userProfile: {
          gender: userProfile?.gender || '',
          country: userProfile?.country || '',
          avatar_url: userProfile?.avatar_url || null
        }
      })
    } catch (error) {
      console.error('Error starting search:', error)
      toast.error('Failed to access camera and microphone')
    }
  }

  const handleMatchFound = async (partnerId: string) => {
    if (!socketRef.current?.id) return
    
    setPartnerId(partnerId)
    setIsMatching(false)
    setIsChatting(true)

    try {
      peerConnectionRef.current = new RTCPeerConnection(ICE_SERVERS)
      
      // Add local stream tracks to peer connection
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          if (localStreamRef.current) {
            peerConnectionRef.current?.addTrack(track, localStreamRef.current)
          }
        })
      }

      // Handle incoming streams
      peerConnectionRef.current.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind)
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate to', partnerId)
          socketRef.current?.emit('ice-candidate', {
            candidate: event.candidate,
            to: partnerId
          })
        }
      }

      // Log connection state changes
      peerConnectionRef.current.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnectionRef.current?.connectionState)
      }

      peerConnectionRef.current.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnectionRef.current?.iceConnectionState)
      }

      // Create and send offer if we are the initiator
      if (socketRef.current?.id < partnerId) {
        console.log('Creating offer as initiator')
        const offer = await peerConnectionRef.current.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        })
        await peerConnectionRef.current.setLocalDescription(offer)
        socketRef.current?.emit('offer', { offer, to: partnerId })
      }
    } catch (error) {
      console.error('Error in handleMatchFound:', error)
      toast.error('Failed to establish peer connection')
    }
  }

  const handleOffer = async ({ offer, from }: { offer: RTCSessionDescriptionInit, from: string }) => {
    if (!peerConnectionRef.current) return

    await peerConnectionRef.current.setRemoteDescription(offer)
    const answer = await peerConnectionRef.current.createAnswer()
    
    if (!answer) {
      console.error('Failed to create answer')
      return
    }

    await peerConnectionRef.current.setLocalDescription(answer)
    socketRef.current?.emit('answer', { answer, to: from })
  }

  const handleAnswer = async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
    await peerConnectionRef.current?.setRemoteDescription(answer)
  }

  const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
    await peerConnectionRef.current?.addIceCandidate(candidate)
  }

  const sendMessage = () => {
    if (!messageInput.trim() || !partnerId) return

    const message: Message = {
      text: messageInput,
      from: socketRef.current?.id || '',
      timestamp: Date.now()
    }

    socketRef.current?.emit('message', { text: messageInput, to: partnerId })
    setMessages(prev => [...prev, message])
    setMessageInput('')
  }

  const endChat = () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop())
      }

      webrtcRef.current?.cleanup()
    setLocalStream(null)
    setRemoteStream(null)
      setPartnerId(null)
      setMessages([])
    setIsMatching(false)
    setIsChatting(false)
    
    // Clean up peer connection
    cleanup()
  }

  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop())
      }
      if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop())
      }
      webrtcRef.current?.cleanup()
    }
  }, [localStream, remoteStream])

  useEffect(() => {
    const handleEndVideoChat = () => {
      if (isMatching) {
        endChat()
      }
    }

    window.addEventListener('endVideoChat', handleEndVideoChat)
    return () => {
      window.removeEventListener('endVideoChat', handleEndVideoChat)
    }
  }, [isMatching])

  const renderVideoControls = () => (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3 backdrop-blur-xl bg-black/40 p-2 rounded-xl border border-white/10 shadow-lg">
      <button
        onClick={() => socketRef.current?.emit('like', { userId: partnerId! })}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-1.5 text-sm font-medium shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
        <span>{partnerStats.likes}</span>
      </button>
      
      <button
        onClick={skipPartner}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center gap-1.5 text-sm font-medium shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
        <span>Next</span>
      </button>
      
      <button
        onClick={() => socketRef.current?.emit('dislike', { userId: partnerId! })}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 transition-all flex items-center gap-1.5 text-sm font-medium shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
        </svg>
        <span>{partnerStats.dislikes}</span>
      </button>

      <button
        onClick={reportUser}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transition-all flex items-center gap-1.5 text-sm font-medium shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Report</span>
      </button>

      <button
        onClick={endChat}
        className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all flex items-center gap-1.5 text-sm font-medium shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>End</span>
      </button>
    </div>
  );

  const ActiveUsersCounter = () => (
    <div className="absolute top-6 right-6 px-4 py-2 rounded-xl bg-gray-800/40 backdrop-blur-xl border border-white/10 shadow-lg flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-sm font-medium text-gray-300">Active Users</span>
      </div>
      <span className="text-lg font-bold text-white">{activeUsers}</span>
    </div>
  );

  const PartnerStats = () => (
    <div className="absolute top-4 left-4 px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm flex items-center gap-4">
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
        </svg>
        <span className="text-sm font-medium">{partnerStats.likes}</span>
      </div>
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
        </svg>
        <span className="text-sm font-medium">{partnerStats.dislikes}</span>
      </div>
    </div>
  );

  const ProfileButton = () => (
    <div className="absolute top-6 right-20 flex items-center gap-4">
      <button
        onClick={() => setShowNotifications(true)}
        className="relative p-2 rounded-full bg-gray-800/40 backdrop-blur-xl border border-white/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-xs w-5 h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      <button
        onClick={() => setShowProfileMenu(true)}
        className="w-10 h-10 rounded-full bg-gray-800/40 backdrop-blur-xl border border-white/10 overflow-hidden"
      >
        <img src={userProfile?.avatar_url || '/default-avatar.png'} alt="" className="w-full h-full object-cover" />
      </button>
    </div>
  );

  const handleFriendRequest = async (userId: string, accept: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (accept) {
        // Accept friend request
        await supabase
          .from('friends')
          .update({ status: 'accepted' })
          .eq('user_id', userId)
          .eq('friend_id', user.id)

        // Create reverse friendship
        await supabase
          .from('friends')
          .insert({
            user_id: user.id,
            friend_id: userId,
            status: 'accepted'
          })

        toast.success('Friend request accepted!')
      }

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('from_user_id', userId)
        .eq('user_id', user.id)

    } catch (error: any) {
      toast.error('Failed to process friend request')
    }
  }

  const sendFriendRequest = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
        .single()

      if (existingRequest) {
        toast.error('Friend request already sent or you are already friends')
        return
      }

      // Create friend request
      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: userId,
          status: 'pending'
        })

      if (error) throw error

      // Add notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'friend_request',
          from_user_id: user.id,
          content: `${user.user_metadata.username} wants to be friends`,
          read: false
        })

      toast.success('Friend request sent!')
    } catch (error: any) {
      toast.error('Failed to send friend request')
    }
  }

  const addNotification = async (notification: {
    type: 'friend_request' | 'room_invite' | 'message'
    from_user_id: string
    content: string
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newNotification: Notification = {
        id: Math.random().toString(),
        ...notification,
        read: false,
        created_at: new Date().toISOString()
      }

      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          ...notification,
          read: false
        })

      setNotifications(prev => [...prev, newNotification])
    } catch (error: any) {
      console.error('Failed to add notification:', error)
    }
  }

  const handleFriendRequestToast = (t: { id: string; visible: boolean }) => (
    <div className="flex flex-col gap-2">
      <p>{t.id} wants to be friends</p>
      <div className="flex gap-2">
        <button onClick={() => handleFriendRequest(t.id, true)} className="px-3 py-1 bg-green-500 rounded">
          Accept
        </button>
        <button onClick={() => handleFriendRequest(t.id, false)} className="px-3 py-1 bg-red-500 rounded">
          Decline
        </button>
      </div>
    </div>
  )

  const cleanup = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-6 pr-24 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-20"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            background: 'radial-gradient(circle at center, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 100%)',
            filter: 'blur(80px)'
          }}
        />
      </div>

      <div className="max-w-[1920px] mx-auto relative">
        <ActiveUsersCounter />
        {!isMatching ? (
          <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-8 relative z-10"
            >
              <h2 className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                Meet New People
              </h2>
              <p className="text-gray-400 text-xl">
                Connect with people who share your interests
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startChat}
                disabled={isLoading || !userProfile}
                className="px-12 py-5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xl shadow-lg shadow-purple-500/20"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                    Connecting...
                  </div>
                ) : (
                  'Start Video Chat'
                )}
              </motion.button>
            </motion.div>

            {/* Floating Elements Animation */}
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                y: [0, 20, 0],
                rotate: [0, -5, 5, 0]
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"
            />
          </div>
        ) : (
          <div className="flex gap-6 relative h-[calc(100vh-120px)]">
            <div className="flex-1 relative">
              <div className="grid grid-cols-5 gap-6 h-full">
                <div className="col-span-4 relative">
                  <div className="h-full bg-gray-800/50 rounded-2xl overflow-hidden relative backdrop-blur-sm border border-white/10 shadow-2xl">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <PartnerStats />
                    <div className="absolute bottom-4 left-4 px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Partner
                    </div>
                  </div>
                  {renderVideoControls()}
                </div>
                
                <div className="col-span-1">
                  <div className="aspect-[3/4] bg-gray-800/50 rounded-2xl overflow-hidden relative backdrop-blur-sm border border-white/10 shadow-xl">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 px-4 py-2 rounded-xl bg-black/50 backdrop-blur-sm text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      You
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-96 bg-gray-800/30 backdrop-blur-xl rounded-2xl flex flex-col border border-white/10 shadow-xl">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-lg font-semibold">Chat</h3>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span>{activeUsers} online</span>
                  </div>
                  {partnerId && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span>Connected</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {messages.map((message, i) => (
                  <div
                    key={i}
                    className={`flex ${message.from === socketRef.current?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        message.from === socketRef.current?.id
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : 'bg-gray-700/50 border border-white/10'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-700/50 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  />
                  <button
                    onClick={sendMessage}
                    className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Sidebar />
    </div>
  );
}

export default VideoChat 