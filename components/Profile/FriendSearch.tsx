import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface SearchResult {
  id: string
  username: string
  display_name: string
  is_online: boolean
  friendship_status?: 'pending' | 'accepted' | null
}

// Add interface for user data
interface UserData {
  id: string
  username: string
  display_name: string
  is_online: boolean
  friends: Array<{ status: 'pending' | 'accepted' | null }>
}

export default function FriendSearch() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: users, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          display_name,
          is_online,
          friends!friends_user_id_fkey(status)
        `)
        .ilike('username', `%${searchQuery}%`)
        .neq('id', user.id)
        .limit(10)

      if (error) throw error

      setSearchResults(users.map((u: UserData) => ({
        id: u.id,
        username: u.username,
        display_name: u.display_name,
        is_online: u.is_online,
        friendship_status: u.friends?.[0]?.status
      })))
    } catch (error: any) {
      toast.error('Failed to search users')
    } finally {
      setLoading(false)
    }
  }

  const sendFriendRequest = async (userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: userId,
          status: 'pending'
        })

      if (error) throw error

      // Add notification for the friend request
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
      handleSearch() // Refresh search results
    } catch (error: any) {
      toast.error('Failed to send friend request')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search by username..."
          className="flex-1 px-4 py-2 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      <div className="space-y-3">
        {searchResults.map(user => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 bg-gray-800/50 rounded-xl"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                  <img src="/default-avatar.png" alt="" className="w-full h-full object-cover" />
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 
                  ${user.is_online ? 'bg-green-500' : 'bg-gray-500'}`} />
              </div>
              <div>
                <h4 className="font-medium">{user.display_name}</h4>
                <p className="text-sm text-gray-400">@{user.username}</p>
              </div>
            </div>
            {user.friendship_status === 'accepted' ? (
              <span className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm">
                Friends
              </span>
            ) : user.friendship_status === 'pending' ? (
              <span className="px-3 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-sm">
                Pending
              </span>
            ) : (
              <button
                onClick={() => sendFriendRequest(user.id)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                Add Friend
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
} 