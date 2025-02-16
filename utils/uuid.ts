export function generateUUID(): string {
  // Check if we're on the client side and have crypto.randomUUID
  if (typeof window !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  
  // Fallback implementation for server-side or older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
} 