'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Video, Plus, X, History, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import RoomCard from './RoomCard'
import { useRouter } from 'next/navigation'
import { generateUUID } from '@/utils/uuid'
import { useInterval } from '@/hooks/useInterval'

interface Room {
  id: string
  name: string
  group_id: string
  host_id: string
  password: string | null
  status: 'waiting' | 'active' | 'ended'
  created_at: string
  group: {
    name: string
  }
  host: {
    username: string
  }
  participant_count: number
  video_chat_url: string
}

interface Group {
  id: string
  name: string
}

export default function RoomsPanel() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState('')
  const [roomName, setRoomName] = useState('')
  const [roomPassword, setRoomPassword] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const initializePanel = async () => {
      setIsLoading(true)
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error) throw error
        
        if (!user) {
          console.log('No authenticated user')
          return
        }

        setCurrentUserId(user.id)
        
        // Fetch groups first
        await fetchGroups(user.id)

        // Then fetch rooms
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)

        if (memberships?.length) {
          const groupIds = memberships.map(m => m.group_id)
          
          // Get rooms for these groups
          const { data: roomsData, error: roomError } = await supabase
            .from('rooms_with_host')
            .select('*')
            .in('group_id', groupIds)
            .order('created_at', { ascending: false })

          if (roomError) throw roomError

          const formattedRooms = roomsData.map(room => ({
            id: room.id,
            name: room.name,
            group_id: room.group_id,
            host_id: room.host_id,
            password: room.password,
            status: room.status,
            video_chat_url: room.video_chat_url,
            created_at: room.created_at,
            group: {
              name: room.group_name
            },
            host: {
              username: room.host_username
            },
            participant_count: room.participant_count
          }))

          setRooms(formattedRooms)
        }

        // Subscribe to room changes
        const roomsChannel = supabase
          .channel('rooms_channel')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'rooms'
          }, async () => {
            // Re-fetch rooms when any change occurs
            await fetchRooms()
          })
          .subscribe()

        return () => {
          supabase.removeChannel(roomsChannel)
        }
      } catch (error: any) {
        console.error('Initialization error:', error)
        toast.error('Failed to load rooms')
      } finally {
        setIsLoading(false)
      }
    }

    initializePanel()
  }, []) // Empty dependency array

  const fetchGroups = async (userId: string) => {
    try {
      const { data: memberships, error: memberError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId)

      if (memberError) throw memberError

      if (!memberships?.length) {
        setGroups([])
        return
      }

      const groupIds = memberships.map(m => m.group_id)

      const { data: groupsData, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds)

      if (groupError) throw groupError

      setGroups(groupsData)
    } catch (error: any) {
      console.error('Error fetching groups:', error)
      toast.error('Failed to load groups')
    }
  }

  const fetchRooms = async () => {
    if (!currentUserId) return

    try {
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', currentUserId)

      if (!memberships?.length) {
        setRooms([])
        return
      }

      const groupIds = memberships.map(m => m.group_id)

      const { data: roomsData, error: roomError } = await supabase
        .from('rooms_with_host')
        .select('*')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })

      if (roomError) throw roomError

      const formattedRooms = roomsData.map(room => ({
        id: room.id,
        name: room.name,
        group_id: room.group_id,
        host_id: room.host_id,
        password: room.password,
        status: room.status,
        video_chat_url: room.video_chat_url,
        created_at: room.created_at,
        group: {
          name: room.group_name
        },
        host: {
          username: room.host_username
        },
        participant_count: room.participant_count
      }))

      setRooms(formattedRooms)
    } catch (error: any) {
      console.error('Error fetching rooms:', error)
      toast.error('Failed to load rooms')
    }
  }

  // Add this effect to refresh rooms when showHistory changes
  useEffect(() => {
    if (currentUserId) {
      fetchRooms()
    }
  }, [showHistory])

  // Filter rooms based on status
  const activeRooms = rooms.filter(room => room.status !== 'ended')
  const pastRooms = rooms.filter(room => room.status === 'ended')

  // Add room cleanup check
  useInterval(() => {
    if (currentUserId) {
      cleanupExpiredRooms()
    }
  }, 60000) // Check every minute

  const cleanupExpiredRooms = async () => {
    try {
      const now = new Date()
      
      // Get rooms that need to be expired
      const { data: roomsToExpire, error: fetchError } = await supabase
        .from('rooms')
        .select('*')
        .in('status', ['waiting', 'active'])
        .lt('created_at', new Date(now.getTime() - 10 * 60000).toISOString()) // 10 minutes old

      if (fetchError) throw fetchError

      if (roomsToExpire) {
        // Check participant count for each room
        for (const room of roomsToExpire) {
          const { data: participants } = await supabase
            .from('room_participants')
            .select('id')
            .eq('room_id', room.id)
            .eq('status', 'joined')

          // Expire rooms with no participants or only one participant for more than 5 minutes
          if (!participants || participants.length <= 1) {
            const { data: lastActivity } = await supabase
              .from('room_activity')
              .select('last_active')
              .eq('room_id', room.id)
              .single()

            const lastActiveTime = lastActivity?.last_active ? new Date(lastActivity.last_active) : new Date(room.created_at)
            const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000)

            if (lastActiveTime < fiveMinutesAgo) {
              await supabase
                .from('rooms')
                .update({ status: 'ended', ended_at: now.toISOString() })
                .eq('id', room.id)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up rooms:', error)
    }
  }

  // Modify createRoom to include activity tracking
  const createRoom = async () => {
    if (!currentUserId || !selectedGroup || !roomName) return

    try {
      const roomId = generateUUID()
      const now = new Date().toISOString()

      // Create room
      const { error: roomError } = await supabase
        .from('rooms')
        .insert([
          {
            id: roomId,
            name: roomName,
            group_id: selectedGroup,
            host_id: currentUserId,
            password: roomPassword || null,
            status: 'waiting',
            created_at: now,
            video_chat_url: `/video-chat/${roomId}`
          }
        ])

      if (roomError) throw roomError

      // Initialize room activity
      const { error: activityError } = await supabase
        .from('room_activity')
        .insert([
          {
            room_id: roomId,
            last_active: now,
            participant_count: 1
          }
        ])

      if (activityError) throw activityError

      // Add host as participant
      const { error: participantError } = await supabase
        .from('room_participants')
        .insert([
          {
            room_id: roomId,
            user_id: currentUserId,
            status: 'joined',
            joined_at: now
          }
        ])

      if (participantError) throw participantError

      setShowCreateModal(false)
      setRoomName('')
      setRoomPassword('')
      setSelectedGroup('')
      
      toast.success('Room created successfully')
    } catch (error: any) {
      console.error('Error creating room:', error)
      toast.error(error.message || 'Failed to create room')
    }
  }

  // Update the joinRoom function
  const joinRoom = async (roomId: string, password?: string) => {
    try {
      // Check if room requires password
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single()

      if (roomError) throw roomError

      if (room.password && room.password !== password) {
        throw new Error('Incorrect password')
      }

      // Update participant status
      const { error: updateError } = await supabase
        .from('room_participants')
        .update({ status: 'joined' })
        .eq('room_id', roomId)
        .eq('user_id', currentUserId)

      if (updateError) throw updateError

      // Redirect to video chat room
      router.push(room.video_chat_url)
      
    } catch (error: any) {
      console.error('Error joining room:', error)
      toast.error(error.message || 'Failed to join room')
    }
  }

  // Add function to mark as busy
  const markAsBusy = async (roomId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('room_participants')
        .update({ status: 'busy' })
        .eq('room_id', roomId)
        .eq('user_id', currentUserId)

      if (updateError) throw updateError

      toast.success('Marked as busy')
    } catch (error: any) {
      console.error('Error marking as busy:', error)
      toast.error(error.message || 'Failed to update status')
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-900/95">
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <div className="flex items-center gap-4">
          {showHistory && (
            <button
              onClick={() => setShowHistory(false)}
              className="p-2 rounded-lg hover:bg-gray-800/50 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h2 className="text-xl font-semibold">
            {showHistory ? 'Room History' : 'Active Rooms'}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:bg-gray-800/80 transition-all"
            title={showHistory ? 'Show active rooms' : 'Show room history'}
          >
            <History size={20} />
          </button>
          {!showHistory && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-all"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : showHistory ? (
          pastRooms.length > 0 ? (
            <div className="space-y-4">
              {pastRooms.map((room) => (
                <div
                  key={room.id}
                  className="p-4 rounded-lg bg-gray-800/30 border border-white/5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{room.name}</h3>
                      <p className="text-sm text-gray-400">
                        {room.group.name} • {room.participant_count} participants
                      </p>
                      <p className="text-xs text-gray-500">
                        Host: {room.host.username}
                      </p>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(room.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="px-3 py-1 rounded bg-gray-700/50 text-sm">
                      Ended
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400">
              <p>No room history</p>
            </div>
          )
        ) : activeRooms.length > 0 ? (
          <div className="space-y-4">
            {activeRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                currentUserId={currentUserId}
                onJoin={joinRoom}
                onBusy={markAsBusy}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <p>No active rooms</p>
            <p className="text-sm mt-2">
              Create a room to start video chatting
            </p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Room</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Group</label>
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
                >
                  <option value="">Select a group</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
                  placeholder="Enter room name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password (Optional)</label>
                <input
                  type="password"
                  value={roomPassword}
                  onChange={(e) => setRoomPassword(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
                  placeholder="Enter room password"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={createRoom}
                disabled={!selectedGroup || !roomName.trim()}
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 