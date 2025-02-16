'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell } from 'lucide-react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Notification {
  id: string
  type: 'friend_request' | 'friend_accepted' | 'message' | 'room_invite'
  from_user_id: string
  content: string
  read: boolean
  created_at: string
  metadata?: {
    room_id: string
    group_id: string
  }
  from_user?: {
    username: string
    display_name: string
    avatar_url: string | null
  }
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Get current user
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        fetchNotifications(user.id)
        subscribeToNotifications(user.id)
      }
    }
    getCurrentUser()
  }, [])

  const fetchNotifications = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications_with_profiles')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications:', error.message)
        return
      }

      const formattedNotifications = data.map(notification => ({
        ...notification,
        from_user: {
          username: notification.from_user_username,
          display_name: notification.from_user_display_name,
          avatar_url: notification.from_user_avatar_url
        }
      }))

      setNotifications(formattedNotifications)
      setUnreadCount(formattedNotifications.filter(n => !n.read).length)
    } catch (error: any) {
      console.error('Error fetching notifications:', error.message || 'Unknown error')
    }
  }

  const subscribeToNotifications = (uid: string) => {
    try {
      const channel = supabase
        .channel(`notifications:${uid}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${uid}`
        }, payload => {
          setNotifications(prev => [payload.new as Notification, ...prev])
          setUnreadCount(prev => prev + 1)
          toast.success('New notification received')
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to notifications')
          }
        })

      return () => {
        supabase.removeChannel(channel)
      }
    } catch (error: any) {
      console.error('Error subscribing to notifications:', error.message || 'Unknown error')
      return () => {}
    }
  }

  const handleFriendRequest = async (notificationId: string, fromUserId: string, accept: boolean) => {
    try {
      if (!userId) return

      if (accept) {
        // Update friend request status
        const { error: friendError } = await supabase
          .from('friends')
          .update({ status: 'accepted' })
          .eq('user_id', fromUserId)
          .eq('friend_id', userId)

        if (friendError) throw friendError

        // Create notification for requester
        const { error: notifError } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: fromUserId,
              type: 'friend_accepted',
              from_user_id: userId,
              content: 'accepted your friend request'
            }
          ])

        if (notifError) throw notifError
      }

      // Mark notification as read
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (updateError) throw updateError

      fetchNotifications(userId)
      toast.success(accept ? 'Friend request accepted' : 'Friend request declined')
    } catch (error) {
      console.error('Error handling friend request:', error)
      toast.error('Failed to process friend request')
    }
  }

  const handleRoomInvite = async (notification: Notification, action: 'join' | 'busy') => {
    if (!notification.metadata?.room_id || !userId) {
      toast.error('Invalid room invitation')
      return
    }

    try {
      // First check if the room still exists and user has access
      const { data: room, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', notification.metadata.room_id)
        .single()

      if (roomError || !room) {
        toast.error('Room no longer exists')
        return
      }

      // Update participant status
      const { error: updateError } = await supabase
        .from('room_participants')
        .update({ status: action === 'join' ? 'joined' : 'busy' })
        .eq('room_id', notification.metadata.room_id)
        .eq('user_id', userId)

      if (updateError) {
        throw new Error('Failed to update participant status')
      }

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notification.id)

      if (action === 'join') {
        // Redirect to video chat
        router.push(room.video_chat_url)
        toast.success('Joined room successfully')
      } else {
        toast.success('Marked as busy')
      }

      // Refresh notifications
      await fetchNotifications(userId)
    } catch (error: any) {
      console.error('Error handling room invite:', error.message || 'Unknown error')
      toast.error(error.message || 'Failed to process room invite')
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-800/50 transition-all"
      >
        <Bell size={24} className="text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg bg-gray-900 border border-white/10 shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Notifications</h3>
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg ${
                      notification.read ? 'bg-gray-800/30' : 'bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={notification.from_user?.avatar_url || '/default-avatar.png'}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">
                            {notification.from_user?.display_name}
                          </span>{' '}
                          {notification.content}
                        </p>
                        {!notification.read && (
                          <div className="flex gap-2 mt-2">
                            {notification.type === 'friend_request' && (
                              <>
                                <button
                                  onClick={() => handleFriendRequest(notification.id, notification.from_user_id, true)}
                                  className="px-3 py-1 rounded bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleFriendRequest(notification.id, notification.from_user_id, false)}
                                  className="px-3 py-1 rounded bg-gray-700 text-white text-sm hover:bg-gray-600 transition-colors"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {notification.type === 'room_invite' && (
                              <>
                                <button
                                  onClick={() => handleRoomInvite(notification, 'join')}
                                  className="px-3 py-1 rounded bg-blue-500 text-white text-sm hover:bg-blue-600 transition-colors"
                                >
                                  Join
                                </button>
                                <button
                                  onClick={() => handleRoomInvite(notification, 'busy')}
                                  className="px-3 py-1 rounded bg-gray-700 text-white text-sm hover:bg-gray-600 transition-colors"
                                >
                                  Busy
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400">
                  No notifications
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 