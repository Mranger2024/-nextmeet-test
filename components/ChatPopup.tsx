'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Send, X, Minimize2, Maximize2 } from 'lucide-react'

interface ChatPopupProps {
  chatId: string
  friendId: string
  onClose: () => void
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender?: {
    username: string
    display_name: string
    avatar_url: string | null
  }
}

export default function ChatPopup({ chatId, friendId, onClose }: ChatPopupProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [friendProfile, setFriendProfile] = useState<any>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        fetchMessages()
        fetchFriendProfile()
        subscribeToMessages()
      }
    }
    getCurrentUser()
  }, [chatId])

  const fetchFriendProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', friendId)
      .single()

    if (!error && data) {
      setFriendProfile(data)
    }
  }

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data)
      scrollToBottom()
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, payload => {
        const newMessage = payload.new as Message
        setMessages(prev => [...prev, newMessage])
        scrollToBottom()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUserId) return

    try {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: currentUserId,
          content: newMessage.trim()
        })

      if (messageError) throw messageError

      // Send notification to friend
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: friendId,
          type: 'message',
          from_user_id: currentUserId,
          content: 'sent you a message'
        })

      if (notifError) throw notifError

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <div className={`fixed bottom-0 right-4 w-80 ${isMinimized ? 'h-12' : 'h-96'} bg-gray-900 rounded-t-lg shadow-xl border border-white/10 flex flex-col transition-all duration-200`}>
      {/* Chat Header */}
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {friendProfile && (
            <>
              <img
                src={friendProfile.avatar_url || '/default-avatar.png'}
                alt={friendProfile.display_name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="font-medium text-sm">{friendProfile.display_name}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-gray-800 rounded"
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-800 rounded"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${
                  message.sender_id === currentUserId ? 'flex-row-reverse' : ''
                }`}
              >
                <img
                  src={message.sender?.avatar_url || '/default-avatar.png'}
                  alt={message.sender?.display_name}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <div
                  className={`max-w-[70%] rounded-lg p-2 text-sm ${
                    message.sender_id === currentUserId
                      ? 'bg-blue-500/20 text-blue-500'
                      : 'bg-gray-800/50 text-white'
                  }`}
                >
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-800/50 border border-white/10 rounded px-3 py-1 text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="p-1 rounded bg-blue-500/20 text-blue-500 hover:bg-blue-500/30"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  )
} 