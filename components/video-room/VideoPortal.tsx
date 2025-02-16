'use client'

import { useEffect, useRef } from 'react'

interface VideoPortalProps {
  participant: {
    id: string
    username: string
    stream: MediaStream
    isSpeaking: boolean
  }
  isLocal: boolean
  highlighted: boolean
  isLarge?: boolean
  isSmall?: boolean
}

export default function VideoPortal({ 
  participant, 
  isLocal, 
  highlighted,
  isLarge,
  isSmall 
}: VideoPortalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream
    }
  }, [participant.stream])

  return (
    <div className={`relative rounded-lg overflow-hidden ${
      highlighted ? 'ring-2 ring-blue-500' : ''
    } ${
      isLarge ? 'aspect-video' : 
      isSmall ? 'aspect-square' : 
      'aspect-video'
    }`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${
          isLocal ? 'transform scale-x-[-1]' : ''
        }`}
      />
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <p className="text-white text-sm">
          {participant.username} {isLocal && '(You)'}
          {participant.isSpeaking && ' 🔊'}
        </p>
      </div>
    </div>
  )
} 