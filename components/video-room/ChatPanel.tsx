'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Send } from 'lucide-react'

interface Message {
  id: string
  content: string
  user_id: string
  created_at: string
  user: {
    username: string
    display_name: string
  }
}

interface ChatPanelProps {
  roomId: string
}

export default function ChatPanel({ roomId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    subscribeToMessages()
  }, [roomId])

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('room_messages')
      .select(`
        *,
        user:profiles(username, display_name)
      `)
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setMessages(data)
      scrollToBottom()
    }
  }

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'room_messages',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        fetchMessages()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    try {
      await supabase
        .from('room_messages')
        .insert([
          {
            room_id: roomId,
            user_id: user.id,
            content: newMessage.trim()
          }
        ])

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <span className="font-medium">
                {message.user.display_name || message.user.username}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(message.created_at).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-gray-200">{message.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  )
} 