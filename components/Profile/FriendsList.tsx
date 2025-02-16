import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Friend {
  id: string
  username: string
  display_name: string
  is_online: boolean
  last_seen: string
}

type SupabaseFriendResponse = {
  friend: {
    id: string
    username: string
    display_name: string
    is_online: boolean
    last_seen: string
  }[]
}

export default function FriendsList() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFriends()
  }, [])

  const loadFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('friends')
        .select(`
          friend:users!friend_id(
            id,
            username,
            display_name,
            is_online,
            last_seen
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (error) throw error

      setFriends(data.map((f: SupabaseFriendResponse) => f.friend[0]))
    } catch (error: any) {
      toast.error('Failed to load friends')
    } finally {
      setLoading(false)
    }
  }

  const startChat = async (friendId: string) => {
    // Implement direct chat functionality
    toast.success('Chat feature coming soon!')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40">Loading...</div>
  }

  return (
    <div className="space-y-4">
      {friends.length === 0 ? (
        <p className="text-center text-gray-400">No friends yet. Use the Find tab to add friends!</p>
      ) : (
        friends.map(friend => (
          <div
            key={friend.id}
            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                  <img src="/default-avatar.png" alt="" className="w-full h-full object-cover" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 
                  ${friend.is_online ? 'bg-green-500' : 'bg-gray-500'}`} />
              </div>
              <div>
                <h4 className="font-medium">{friend.display_name}</h4>
                <p className="text-sm text-gray-400">@{friend.username}</p>
              </div>
            </div>
            <button
              onClick={() => startChat(friend.id)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        ))
      )}
    </div>
  )
} 