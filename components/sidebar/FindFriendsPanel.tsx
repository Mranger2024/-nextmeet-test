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

export default function FindFriendsPanel() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        // Fetch pending requests
        fetchPendingRequests(user.id)
      }
    }
    getCurrentUser()
  }, [])

  const fetchPendingRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', userId)
        .eq('status', 'pending')

      if (error) throw error

      setPendingRequests(new Set(data.map(req => req.friend_id)))
    } catch (error) {
      console.error('Error fetching pending requests:', error)
    }
  }

  const searchUsers = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${query}%`)
        .neq('id', currentUserId)
        .limit(10)

      if (error) throw error

      // Filter out users who are already friends
      const { data: friends } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', currentUserId)
        .eq('status', 'accepted')

      const friendIds = new Set(friends?.map(f => f.friend_id) || [])
      const filteredResults = data.filter(user => !friendIds.has(user.id))

      setSearchResults(filteredResults)
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setIsLoading(false)
    }
  }

  const sendFriendRequest = async (friendId: string) => {
    if (!currentUserId) return

    try {
      // Check if request already exists
      const { data: existingRequest, error: checkError } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`)
        .single()

      if (checkError && checkError.code !== 'PGRST116') throw checkError
      
      if (existingRequest) {
        toast.error('Friend request already exists')
        return
      }

      // Create friend request
      const { error: friendError } = await supabase
        .from('friends')
        .insert([
          {
            user_id: currentUserId,
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
            from_user_id: currentUserId,
            content: 'sent you a friend request'
          }
        ])

      if (notifError) throw notifError

      setPendingRequests(prev => new Set([...Array.from(prev), friendId]))
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
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(debounceTimeout)
  }, [searchQuery])

  return (
    <div className="h-full flex flex-col bg-gray-900/95 backdrop-blur-md">
      <div className="p-6 border-b border-white/10 bg-gray-900/95 backdrop-blur-md">
        <h2 className="text-xl font-semibold mb-6">Find Friends</h2>
        
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username (min. 3 characters)..."
            className="w-full p-3 pl-10 rounded-lg bg-gray-800/50 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-0">
        {isLoading ? (
          <div className="text-center text-gray-400">Searching...</div>
        ) : searchResults.length > 0 ? (
          searchResults.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-white/10 backdrop-blur-md"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img
                  src={user.avatar_url || '/default-avatar.png'}
                  alt={user.display_name}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{user.display_name || user.username}</p>
                  <p className="text-sm text-gray-400 truncate">@{user.username}</p>
                </div>
              </div>
              
              <div className="flex-shrink-0 ml-4">
                {pendingRequests.has(user.id) ? (
                  <button
                    disabled
                    className="p-2 px-4 rounded-lg bg-gray-700 text-gray-400 flex items-center gap-2 whitespace-nowrap"
                  >
                    <Check size={20} />
                    <span className="text-sm">Pending</span>
                  </button>
                ) : (
                  <button
                    onClick={() => sendFriendRequest(user.id)}
                    className="p-2 px-4 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    <UserPlus size={20} />
                    <span className="text-sm">Add</span>
                  </button>
                )}
              </div>
            </div>
          ))
        ) : searchQuery.length >= 3 ? (
          <div className="text-center text-gray-400">No users found</div>
        ) : searchQuery.length > 0 ? (
          <div className="text-center text-gray-400">Type at least 3 characters to search</div>
        ) : (
          <div className="text-center text-gray-400 mt-10">
            <Search size={48} className="mx-auto mb-4 opacity-40" />
            <p>Search for users to add them as friends</p>
          </div>
        )}
      </div>
    </div>
  )
} 