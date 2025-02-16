'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Users, Search, Heart, UserCircle, Settings, LogOut, Video, UsersRound, Bell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import ProfilePanel from './sidebar/ProfilePanel'
import FriendsPanel from './sidebar/FriendsPanel'
import GroupsPanel from './sidebar/GroupsPanel'
import RoomsPanel from './sidebar/RoomsPanel'
import PreferencesPanel from './sidebar/PreferencesPanel'
import Notifications from './Notifications'
import FindFriendsPanel from './sidebar/FindFriendsPanel'

type Panel = 'home' | 'profile' | 'friends' | 'groups' | 'rooms' | 'preferences' | 'settings' | 'find_friends'

interface NavItem {
  id: Panel
  icon: React.ReactNode
  label: string
}

export default function Sidebar() {
  const [activePanel, setActivePanel] = useState<Panel>('home')
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()

  const navItems: NavItem[] = [
    { id: 'home', icon: <Home size={24} />, label: 'Home' },
    { id: 'profile', icon: <UserCircle size={24} />, label: 'Profile' },
    { id: 'find_friends', icon: <Search size={24} />, label: 'Find Friends' },
    { id: 'friends', icon: <Users size={24} />, label: 'Friends' },
    { id: 'groups', icon: <UsersRound size={24} />, label: 'Groups' },
    { id: 'rooms', icon: <Video size={24} />, label: 'Rooms' },
    { id: 'preferences', icon: <Heart size={24} />, label: 'Preferences' },
  ]

  const handlePanelClick = (panel: Panel) => {
    if (activePanel === panel) {
      setIsPanelOpen(!isPanelOpen)
    } else {
      setActivePanel(panel)
      setIsPanelOpen(true)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/auth/signin')
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  const handleSidebarInteraction = (panel: Panel) => {
    const event = new CustomEvent('endVideoChat')
    window.dispatchEvent(event)
    
    handlePanelClick(panel)
  }

  return (
    <div className="fixed right-0 top-0 h-full flex z-50">
      {/* Panel Content */}
      <AnimatePresence>
        {isPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-gray-900/95 backdrop-blur-md border-l border-white/10 h-full overflow-hidden"
          >
            {activePanel === 'profile' && <ProfilePanel />}
            {activePanel === 'friends' && <FriendsPanel />}
            {activePanel === 'groups' && <GroupsPanel />}
            {activePanel === 'rooms' && <RoomsPanel />}
            {activePanel === 'preferences' && <PreferencesPanel />}
            {activePanel === 'find_friends' && <FindFriendsPanel />}
            {activePanel === 'settings' && (
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-6">Settings</h2>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-800/50 border border-white/10">
                    <h3 className="font-medium mb-2">Theme</h3>
                    <select className="w-full p-2 rounded bg-gray-700">
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-800/50 border border-white/10">
                    <h3 className="font-medium mb-2">Language</h3>
                    <select className="w-full p-2 rounded bg-gray-700">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <nav className="w-16 bg-gray-900/95 backdrop-blur-md h-full flex flex-col items-center py-4">
        <Notifications />
        <div className="flex-1 flex flex-col items-center space-y-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSidebarInteraction(item.id)}
              className={`p-3 rounded-xl transition-all ${
                activePanel === item.id 
                  ? 'bg-blue-500/20 text-blue-500' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>

        <div className="mt-auto space-y-6">
          <button 
            onClick={() => handlePanelClick('settings')}
            className={`p-3 rounded-xl transition-all ${
              activePanel === 'settings' 
                ? 'bg-blue-500/20 text-blue-500' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings size={24} />
          </button>
          <button 
            onClick={handleLogout}
            className="p-3 rounded-xl text-gray-400 hover:text-white transition-all"
          >
            <LogOut size={24} />
          </button>
        </div>
      </nav>
    </div>
  )
} 