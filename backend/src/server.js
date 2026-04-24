const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes  = require('./modules/auth/auth.routes');
const postsRoutes = require('./modules/posts/posts.routes');
const chatRoutes  = require('./modules/chat/chat.routes');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: 'http://localhost:3000', credentials: true }
});
console.log('authRoutes:', typeof authRoutes);
console.log('postsRoutes:', typeof postsRoutes);
console.log('chatRoutes:', typeof chatRoutes);

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/ping', (req, res) => res.json({ message: 'Backend funcionando' }));
app.use('/api/auth',  authRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/chat',  chatRoutes);

// Socket.io
const onlineUsers = new Map();

io.on('connection', (socket) => {

  socket.on('user:connect', (userId) => {
    onlineUsers.set(String(userId), socket.id);
    socket.userId = String(userId);
    io.emit('users:online', Array.from(onlineUsers.keys()));
  });

  socket.on('message:send', async (data) => {
    const { receptorId, contenido, emisorId } = data;
    const prisma = require('./config/db');
    try {
      const msg = await prisma.messages.create({
        data: {
          emisorId:   parseInt(emisorId),
          receptorId: parseInt(receptorId),
          contenido,
        },
        include: {
          emisor: { select: { id: true, username: true } }
        }
      });
      const receptorSocket = onlineUsers.get(String(receptorId));
      if (receptorSocket) {
        io.to(receptorSocket).emit('message:receive', msg);
      }
      socket.emit('message:sent', msg);
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    }
  });

  socket.on('messages:read', async ({ emisorId, receptorId }) => {
    const prisma = require('./config/db');
    await prisma.messages.updateMany({
      where: { emisorId: parseInt(emisorId), receptorId: parseInt(receptorId), leido: false },
      data:  { leido: true, leidoEn: new Date() }
    });
    const emisorSocket = onlineUsers.get(String(emisorId));
    if (emisorSocket) io.to(emisorSocket).emit('messages:read:confirm', { receptorId });
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    }
  });

});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server corriendo en puerto ${PORT}`));

const amigosRoutes = require('./modules/amigos/amigos.routes');
app.use('/api/amigos', amigosRoutes);