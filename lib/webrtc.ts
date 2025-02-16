class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private onRemoteStream: (stream: MediaStream) => void = () => {}

  constructor() {
    const configuration: RTCConfiguration = {
      iceServers: [
        { 
          urls: [
            'stun:stun.l.google.com:19302',
            'stun:stun1.l.google.com:19302',
            'stun:stun2.l.google.com:19302'
          ]
        }
      ],
      iceCandidatePoolSize: 10
    }

    this.peerConnection = new RTCPeerConnection(configuration)

    this.peerConnection.ontrack = ({ streams: [stream] }) => {
      this.remoteStream = stream
      this.onRemoteStream(stream)
    }

    // Add connection state change handler
    this.peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", this.peerConnection?.connectionState)
    }

    // Add ICE connection state change handler
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", this.peerConnection?.iceConnectionState)
    }
  }

  async setLocalStream(stream: MediaStream) {
    try {
      this.localStream = stream
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream)
        }
      })
    } catch (error) {
      console.error('Error setting local stream:', error)
      throw error
    }
  }

  async createOffer() {
    if (!this.peerConnection) return null
    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    return offer
  }

  async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await this.peerConnection.createAnswer()
    await this.peerConnection.setLocalDescription(answer)
    return answer
  }

  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
  }

  async handleIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) return
    await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
  }

  onIceCandidate(callback: (candidate: RTCIceCandidate) => void) {
    if (!this.peerConnection) return
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        callback(event.candidate)
      }
    }
  }

  setOnRemoteStream(callback: (stream: MediaStream) => void) {
    this.onRemoteStream = callback
  }

  cleanup() {
    this.localStream?.getTracks().forEach(track => track.stop())
    this.peerConnection?.close()
    this.peerConnection = null
    this.localStream = null
    this.remoteStream = null
  }
}

export default WebRTCService 