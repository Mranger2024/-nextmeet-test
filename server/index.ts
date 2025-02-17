import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
app.use(cors())

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins temporarily
    methods: ["GET", "POST"],
    credentials: true
  }
})

interface User {
  id: string
  socketId: string
  interests?: string[]
  filters?: any
}

const waitingUsers = new Map<string, User>()

// Debug endpoints
app.get('/', (_, res) => {
  res.send('Socket.IO server is running')
})

app.get('/health', (_, res) => {
  res.json({ 
    status: 'ok', 
    connections: io.engine.clientsCount,
    uptime: process.uptime()
  })
})

app.get('/healthcheck', (_, res) => {
  res.send('Socket.IO server is healthy')
})

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  
  // Emit current user count to all clients
  io.emit('activeUsers', io.engine.clientsCount)

  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })

  socket.on('waiting', (data) => {
    console.log('User waiting:', socket.id, data)
    const user: User = {
      id: data.userProfile.id,
      socketId: socket.id,
      interests: data.interests,
      filters: data.filters
    }
    waitingUsers.set(socket.id, user)
    console.log('Current waiting users:', waitingUsers.size)
    findMatch(socket)
  })

  socket.on('offer', ({ offer, to }) => {
    console.log('Relaying offer from', socket.id, 'to', to)
    socket.to(to).emit('offer', { offer, from: socket.id })
  })

  socket.on('answer', ({ answer, to }) => {
    console.log('Relaying answer from', socket.id, 'to', to)
    socket.to(to).emit('answer', { answer, from: socket.id })
  })

  socket.on('ice-candidate', ({ candidate, to }) => {
    console.log('Relaying ICE candidate from', socket.id, 'to', to)
    socket.to(to).emit('ice-candidate', { candidate, from: socket.id })
  })

  socket.on('disconnect', () => {
    waitingUsers.delete(socket.id)
    console.log('User disconnected:', socket.id)
    console.log('Remaining waiting users:', waitingUsers.size)
  })
})

function findMatch(socket: any) {
  const currentUser = waitingUsers.get(socket.id)
  if (!currentUser) return

  for (const [id, user] of waitingUsers) {
    if (id !== socket.id) {
      console.log('Match found between', socket.id, 'and', id)
      
      // Match found - connect the users
      socket.emit('match-found', { partnerId: id })
      io.to(id).emit('match-found', { partnerId: socket.id })
      
      // Remove both users from waiting list
      waitingUsers.delete(socket.id)
      waitingUsers.delete(id)
      break
    }
  }
}

io.on("connect_error", (err) => {
  console.log(`Connection error: ${err.message}`)
})

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err)
})

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
})