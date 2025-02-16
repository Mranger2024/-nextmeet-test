import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import GroupVideoChat from '../GroupVideoChat'

interface Room {
  id: string
  name: string
  created_by: string
  created_at: string
  members: {
    id: string
    username: string
    display_name: string
    is_online: boolean
  }[]
}

interface FriendData {
  friend: {
    id: string
    username: string
    display_name: string
  }
}

export default function RoomManager() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [friends, setFriends] = useState<Array<{ id: string, username: string, display_name: string }>>([])
  const [activeGroupChat, setActiveGroupChat] = useState<string | null>(null)

  useEffect(() => {
    loadRooms()
    loadFriends()
  }, [])

  const loadRooms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *,
          members:room_members(
            user:users(
              id,
              username,
              display_name,
              is_online
            )
          )
        `)
        .or(`created_by.eq.${user.id},members.user_id.eq.${user.id}`)

      if (error) throw error

      setRooms(data as Room[])
    } catch (error: any) {
      toast.error('Failed to load rooms')
    } finally {
      setLoading(false)
    }
  }

  const loadFriends = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      type SupabaseFriendResponse = {
        friend: {
          id: string
          username: string
          display_name: string
        }[]
      }

      const { data, error } = await supabase
        .from('friends')
        .select(`
          friend:users!friend_id(
            id,
            username,
            display_name
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted')

      if (error) throw error

      setFriends(data.map((f: SupabaseFriendResponse) => f.friend[0]))
    } catch (error: any) {
      toast.error('Failed to load friends')
    }
  }

  const createRoom = async () => {
    if (!roomName.trim()) {
      toast.error('Please enter room name')
      return
    }
    
    if (selectedFriends.length === 0) {
      toast.error('Please select friends')
      return
    }

    if (selectedFriends.length > 19) { // 19 friends + you = 20 total
      toast.error('Maximum 20 members allowed in a room')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create room
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .insert({
          name: roomName.trim(),
          created_by: user.id
        })
        .select()
        .single()

      if (roomError) throw roomError

      // Add members
      const members = [...selectedFriends, user.id].map(userId => ({
        room_id: room.id,
        user_id: userId
      }))

      const { error: membersError } = await supabase
        .from('room_members')
        .insert(members)

      if (membersError) throw membersError

      toast.success('Room created successfully')
      setShowCreateRoom(false)
      setRoomName('')
      setSelectedFriends([])
      loadRooms()
    } catch (error: any) {
      toast.error('Failed to create room')
    }
  }

  const startGroupChat = async (roomId: string) => {
    setActiveGroupChat(roomId)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-40">Loading...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Your Rooms</h3>
        <button
          onClick={() => setShowCreateRoom(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        >
          Create Room
        </button>
      </div>

      {showCreateRoom && (
        <div className="space-y-4 p-4 bg-gray-800/50 rounded-xl">
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Room Name"
            className="w-full px-4 py-2 bg-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="space-y-2">
            <label className="block text-sm text-gray-400">Select Friends</label>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {friends.map(friend => (
                <label key={friend.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFriends(prev => [...prev, friend.id])
                      } else {
                        setSelectedFriends(prev => prev.filter(id => id !== friend.id))
                      }
                    }}
                    className="rounded border-gray-600 text-blue-500 focus:ring-blue-500"
                  />
                  <span>{friend.display_name} (@{friend.username})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={createRoom}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowCreateRoom(false)
                setRoomName('')
                setSelectedFriends([])
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {rooms.length === 0 ? (
          <p className="text-center text-gray-400">No rooms yet. Create one to start group video chat!</p>
        ) : (
          rooms.map(room => (
            <div key={room.id} className="p-4 bg-gray-800/50 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">{room.name}</h4>
                <button
                  onClick={() => startGroupChat(room.id)}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  Start Chat
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {room.members.map(member => (
                  <span
                    key={member.id}
                    className="px-2 py-1 bg-gray-700/50 rounded-full text-sm flex items-center gap-1"
                  >
                    <span className={`w-2 h-2 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-gray-500'}`} />
                    {member.display_name}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {activeGroupChat && (
        <GroupVideoChat
          roomId={activeGroupChat}
          members={rooms.find(r => r.id === activeGroupChat)?.members || []}
          onClose={() => setActiveGroupChat(null)}
        />
      )}
    </div>
  )
} 