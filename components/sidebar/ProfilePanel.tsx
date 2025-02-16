'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Camera, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { countries } from '@/lib/countries'

interface Profile {
  id: string
  username: string
  display_name: string
  avatar_url: string | null
  gender: 'male' | 'female' | 'other'
  country: string
  bio: string
}

export default function ProfilePanel() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create one
          const newProfile = {
            id: user.id,
            username: '',
            display_name: '',
            avatar_url: null,
            gender: 'other' as const,
            country: '',
            bio: ''
          }

          const { error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])

          if (insertError) throw insertError
          
          setProfile(newProfile)
          setEditedProfile(newProfile)
        } else {
          throw error
        }
      } else {
        setProfile(data)
        setEditedProfile(data)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    }
  }

  const handleUpdateProfile = async () => {
    if (!editedProfile) return
    setIsLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Check if username is changed and verify uniqueness
      if (editedProfile.username !== profile?.username) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', editedProfile.username)
          .single()

        if (existingUser) {
          throw new Error('Username already taken')
        }
      }

      const updates = {
        username: editedProfile.username,
        display_name: editedProfile.display_name,
        gender: editedProfile.gender,
        country: editedProfile.country,
        bio: editedProfile.bio,
        avatar_url: profile?.avatar_url || null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        console.error('Update error:', error)
        throw new Error(error.message)
      }

      setProfile(prev => ({
        ...prev!,
        ...updates
      }))
      setIsEditing(false)
      toast.success('Profile updated successfully')
    } catch (error: any) {
      console.error('Error updating profile:', error)
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user found')

      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB')
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image')
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase()
      if (!fileExt) throw new Error('Invalid file extension')

      // Simple file name to avoid path issues
      const fileName = `${Date.now()}.${fileExt}`

      // Upload file to storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(uploadError.message)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('Profile update error:', updateError)
        throw new Error(updateError.message)
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)
      setEditedProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null)

      toast.success('Avatar updated successfully')
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error(error.message || 'Failed to upload avatar')
    }
  }

  if (!profile) return null

  return (
    <div className="h-full p-6 overflow-y-auto">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Profile</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-all"
          >
            <Edit2 size={20} />
          </button>
        </div>

        <div className="relative w-32 h-32 mx-auto">
          <img
            src={profile.avatar_url || '/default-avatar.png'}
            alt="Profile"
            className="w-full h-full rounded-full object-cover border-2 border-white/10"
          />
          {isEditing && (
            <label className="absolute bottom-0 right-0 p-2 rounded-full bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition-all">
              <Camera size={20} />
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </label>
          )}
        </div>

        <div className="space-y-4">
          {isEditing ? (
            <>
              <input
                type="text"
                value={editedProfile?.display_name || ''}
                onChange={(e) => setEditedProfile(prev => prev ? { ...prev, display_name: e.target.value } : null)}
                className="w-full p-3 rounded-lg bg-gray-800/50 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Display Name"
              />
              <input
                type="text"
                value={editedProfile?.username || ''}
                onChange={(e) => setEditedProfile(prev => prev ? { ...prev, username: e.target.value } : null)}
                className="w-full p-3 rounded-lg bg-gray-800/50 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Username"
              />
              <select
                value={editedProfile?.gender || ''}
                onChange={(e) => setEditedProfile(prev => prev ? { ...prev, gender: e.target.value as Profile['gender'] } : null)}
                className="w-full p-3 rounded-lg bg-gray-800/50 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              <select
                value={editedProfile?.country || ''}
                onChange={(e) => setEditedProfile(prev => prev ? { ...prev, country: e.target.value } : null)}
                className="w-full p-3 rounded-lg bg-gray-800/50 border border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              >
                <option value="">Select Country</option>
                {countries.map(country => (
                  <option key={country.code} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
              <textarea
                value={editedProfile?.bio || ''}
                onChange={(e) => setEditedProfile(prev => prev ? { ...prev, bio: e.target.value } : null)}
                className="w-full p-3 rounded-lg bg-gray-800/50 border border-white/10 h-32 resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                placeholder="Bio"
              />
              <button
                onClick={handleUpdateProfile}
                disabled={isLoading}
                className="w-full p-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm text-gray-400">Display Name</h3>
                <p className="text-lg">{profile.display_name || 'Not set'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400">Username</h3>
                <p className="text-lg">@{profile.username || 'Not set'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400">Gender</h3>
                <p className="text-lg capitalize">{profile.gender || 'Not set'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400">Country</h3>
                <p className="text-lg">{profile.country || 'Not set'}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-400">Bio</h3>
                <p className="text-lg">{profile.bio || 'No bio yet'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 