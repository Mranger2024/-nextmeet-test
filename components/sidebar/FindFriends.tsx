'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, UserPlus, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
}

export default function FindFriends() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const searchUsers = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', user.id)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setIsLoading(false)
    }
  }

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if request already exists
      const { data: existingRequest } = await supabase
        .from('friends')
        .select('*')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .or(`user_id.eq.${friendId},friend_id.eq.${friendId}`)
        .single()

      if (existingRequest) {
        toast.error('Friend request already exists')
        return
      }

      // Create friend request
      const { error: friendError } = await supabase
        .from('friends')
        .insert([
          {
            user_id: user.id,
            friend_id: friendId,
            status: 'pending'
          }
        ])

      if (friendError) throw friendError

      // Create notification
      const { error: notifError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: friendId,
            type: 'friend_request',
            from_user_id: user.id,
            content: 'sent you a friend request'
          }
        ])

      if (notifError) throw notifError

      setPendingRequests(prev => new Set(prev).add(friendId))
      toast.success('Friend request sent')
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast.error('Failed to send friend request')
    }
  }

  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (searchQuery) {
        searchUsers(searchQuery)
      }
    }, 300)

    return () => clearTimeout(debounceTimeout)
  }, [searchQuery])

  return (
    <div className="h-full p-6">
      <h2 className="text-xl font-semibold mb-6">Find Friends</h2>
      
      <div className="relative mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by username..."
          className="w-full p-3 pl-10 rounded-lg bg-gray-800/50 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-gray-400">Searching...</div>
        ) : searchResults.length > 0 ? (
          searchResults.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-white/10"
            >
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar_url || '/default-avatar.png'}
                  alt={user.display_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">{user.display_name}</p>
                  <p className="text-sm text-gray-400">@{user.username}</p>
                </div>
              </div>
              
              {pendingRequests.has(user.id) ? (
                <button
                  disabled
                  className="p-2 rounded-lg bg-gray-700 text-gray-400"
                >
                  <Check size={20} />
                </button>
              ) : (
                <button
                  onClick={() => sendFriendRequest(user.id)}
                  className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-all"
                >
                  <UserPlus size={20} />
                </button>
              )}
            </div>
          ))
        ) : searchQuery.length > 0 && (
          <div className="text-center text-gray-400">No users found</div>
        )}
      </div>
    </div>
  )
} 