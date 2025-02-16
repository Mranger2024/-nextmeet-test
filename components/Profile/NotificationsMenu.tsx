import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: 'friend_request' | 'room_invite' | 'message'
  content: string
  from_user_id: string
  read: boolean
  created_at: string
  from_user: {
    username: string
    display_name: string
  }
}

interface NotificationsMenuProps {
  isOpen: boolean
  onClose: () => void
  onCountUpdate: (count: number) => void
}

export default function NotificationsMenu({ isOpen, onClose, onCountUpdate }: NotificationsMenuProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen])

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          from_user:users!from_user_id(
            username,
            display_name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setNotifications(data)
      const unreadCount = data.filter((n: Notification) => !n.read).length
      onCountUpdate(unreadCount)
    } catch (error: any) {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const handleFriendRequest = async (notificationId: string, fromUserId: string, accept: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (accept) {
        // Accept friend request
        await supabase
          .from('friends')
          .update({ status: 'accepted' })
          .eq('user_id', fromUserId)
          .eq('friend_id', user.id)

        // Create reverse friendship
        await supabase
          .from('friends')
          .insert({
            user_id: user.id,
            friend_id: fromUserId,
            status: 'accepted'
          })

        toast.success('Friend request accepted!')
      }

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      loadNotifications()
    } catch (error: any) {
      toast.error('Failed to process friend request')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden border border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(80vh-64px)]">
          {loading ? (
            <div className="flex items-center justify-center h-40">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-400">No notifications</div>
          ) : (
            <div className="divide-y divide-white/10">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 ${notification.read ? 'bg-transparent' : 'bg-blue-500/10'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm">{notification.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {notification.type === 'friend_request' && !notification.read && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFriendRequest(notification.id, notification.from_user_id, true)}
                          className="px-3 py-1 bg-green-500 hover:bg-green-600 rounded-lg text-sm"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleFriendRequest(notification.id, notification.from_user_id, false)}
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-lg text-sm"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 