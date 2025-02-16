import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import FriendsList from '@/components/Profile/FriendsList'
import RoomManager from '@/components/Profile/RoomManager'
import FriendSearch from '@/components/Profile/FriendSearch'

interface ProfileMenuProps {
  isOpen: boolean
  onClose: () => void
  user: {
    username: string
    display_name: string
    gender: string
    country: string
  }
}

export default function ProfileMenu({ isOpen, onClose, user }: ProfileMenuProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'friends' | 'rooms' | 'find'>('profile')

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold">Profile & Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 ${activeTab === 'profile' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-4 py-2 ${activeTab === 'friends' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Friends
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2 ${activeTab === 'rooms' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Rooms
          </button>
          <button
            onClick={() => setActiveTab('find')}
            className={`px-4 py-2 ${activeTab === 'find' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Find Friends
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(80vh-120px)]">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-gray-800 overflow-hidden">
                  <img src="/default-avatar.png" alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{user.display_name}</h3>
                  <p className="text-gray-400">@{user.username}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400">Gender</label>
                  <p className="capitalize">{user.gender}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400">Country</label>
                  <p>{user.country}</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}

          {activeTab === 'friends' && <FriendsList />}
          {activeTab === 'rooms' && <RoomManager />}
          {activeTab === 'find' && <FriendSearch />}
        </div>
      </div>
    </div>
  )
} 