'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Plus, MessageCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface Group {
  id: string
  name: string
  description: string | null
  created_at: string
  member_count: number
}

interface Friend {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
}

export default function GroupPanel() {
  const [groups, setGroups] = useState<Group[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        await Promise.all([
          fetchGroups(user.id),
          fetchFriends(user.id)
        ])
        setIsLoading(false)
      }
    }
    getCurrentUser()
  }, [])

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
        .select(`
          *,
          members:group_members(count)
        `)
        .in('id', groupIds)

      if (groupError) throw groupError

      const formattedGroups = groupsData.map(group => ({
        ...group,
        member_count: group.members[0].count
      }))

      setGroups(formattedGroups)
    } catch (error: any) {
      console.error('Error fetching groups:', error)
      toast.error('Failed to load groups')
    }
  }

  const fetchFriends = async (userId: string) => {
    try {
      const { data: friendConnections, error: friendError } = await supabase
        .from('friends')
        .select('friend_id, user_id')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted')

      if (friendError) throw friendError

      if (!friendConnections?.length) {
        setFriends([])
        return
      }

      const friendIds = friendConnections.map(conn => 
        conn.user_id === userId ? conn.friend_id : conn.user_id
      )

      const { data: friendProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', friendIds)

      if (profileError) throw profileError

      setFriends(friendProfiles || [])
    } catch (error: any) {
      console.error('Error fetching friends:', error)
      toast.error('Failed to load friends')
    }
  }

  const createGroup = async () => {
    if (!currentUserId || !groupName.trim() || selectedFriends.length === 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName.trim(),
          created_by: currentUserId
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Add members including creator
      const members = [
        { group_id: group.id, user_id: currentUserId, role: 'admin' },
        ...selectedFriends.map(friendId => ({
          group_id: group.id,
          user_id: friendId,
          role: 'member'
        }))
      ]

      const { error: memberError } = await supabase
        .from('group_members')
        .insert(members)

      if (memberError) throw memberError

      toast.success('Group created successfully!')
      setShowCreateModal(false)
      setGroupName('')
      setSelectedFriends([])
      fetchGroups(currentUserId)
    } catch (error: any) {
      console.error('Error creating group:', error)
      toast.error('Failed to create group')
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-900/95">
      <div className="p-6 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Groups</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-all"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : groups.length > 0 ? (
          <div className="space-y-4">
            {groups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Users size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-medium">{group.name}</h3>
                    <p className="text-sm text-gray-400">{group.member_count} members</p>
                  </div>
                </div>
                <button className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30">
                  <MessageCircle size={20} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <p>No groups yet</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-gray-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700"
                  placeholder="Enter group name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Select Members</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {friends.map((friend) => (
                    <label
                      key={friend.id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFriends.includes(friend.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFriends(prev => [...prev, friend.id])
                          } else {
                            setSelectedFriends(prev => 
                              prev.filter(id => id !== friend.id)
                            )
                          }
                        }}
                        className="rounded border-gray-700"
                      />
                      <span>{friend.display_name || friend.username}</span>
                    </label>
                  ))}
                </div>
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
                onClick={createGroup}
                disabled={!groupName.trim() || selectedFriends.length === 0}
                className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 