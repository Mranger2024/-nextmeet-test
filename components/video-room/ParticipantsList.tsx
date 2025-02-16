'use client'

import { useState } from 'react'
import { Mic, MicOff, Video, VideoOff } from 'lucide-react'

interface Participant {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  isSpeaking: boolean
  isVideoOn: boolean
  isAudioOn: boolean
  stream: MediaStream
  audioLevel: number
}

interface ParticipantsListProps {
  participants: Participant[]
  currentUserId: string | null
  onKick?: (userId: string) => void
  onMute?: (userId: string) => void
  isHost: boolean
}

export default function ParticipantsList({ 
  participants, 
  currentUserId,
  onKick,
  onMute,
  isHost 
}: ParticipantsListProps) {
  const [showControls, setShowControls] = useState<string | null>(null)

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold">Participants ({participants.length})</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="p-4 hover:bg-gray-800/50 transition-colors relative"
            onMouseEnter={() => isHost && setShowControls(participant.id)}
            onMouseLeave={() => setShowControls(null)}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={participant.avatar_url || '/default-avatar.png'}
                  alt={participant.display_name || participant.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                {participant.isSpeaking && (
                  <div className="absolute inset-0 border-2 border-blue-500 rounded-full animate-pulse" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {participant.display_name || participant.username}
                  {participant.id === currentUserId && ' (You)'}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  {participant.isAudioOn ? (
                    <Mic size={14} className="text-green-500" />
                  ) : (
                    <MicOff size={14} className="text-red-500" />
                  )}
                  {participant.isVideoOn ? (
                    <Video size={14} className="text-green-500" />
                  ) : (
                    <VideoOff size={14} className="text-red-500" />
                  )}
                </div>
              </div>

              {/* Host Controls */}
              {isHost && participant.id !== currentUserId && showControls === participant.id && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onMute?.(participant.id)}
                    className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                    title={participant.isAudioOn ? "Mute participant" : "Unmute participant"}
                  >
                    {participant.isAudioOn ? (
                      <Mic size={16} />
                    ) : (
                      <MicOff size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => onKick?.(participant.id)}
                    className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                    title="Remove from room"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 