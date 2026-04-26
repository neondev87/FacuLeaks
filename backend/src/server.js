const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes   = require('./modules/auth/auth.routes');
const postsRoutes  = require('./modules/posts/posts.routes');
const chatRoutes   = require('./modules/chat/chat.routes');
const amigosRoutes = require('./modules/amigos/amigos.routes');
const uploadRoutes = require('./modules/upload/upload.routes'); 
const spotifyRoutes = require('./modules/spotify/spotify.routes');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: 'http://localhost:3000', credentials: true }
});

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// ── Inyectar io en req para usarlo en controllers ──
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/uploads', express.static('uploads')); // servir archivos
app.use('/api/upload', uploadRoutes);
app.get('/api/ping', (req, res) => res.json({ message: 'Backend funcionando' }));
app.use('/api/auth',   authRoutes);
app.use('/api/posts',  postsRoutes);
app.use('/api/chat',   chatRoutes);
app.use('/api/amigos', amigosRoutes);
app.use('/api/spotify', spotifyRoutes);

// ── SOCKET.IO ──
const onlineUsers = new Map();
const prisma = require('./config/db');

io.on('connection', (socket) => {

  socket.on('user:connect', (userId) => {
    onlineUsers.set(String(userId), socket.id);
    socket.userId = String(userId);
    io.emit('users:online', Array.from(onlineUsers.keys()));
  });

  socket.on('message:send', async (data) => {
    const { receptorId, contenido, emisorId } = data;
    try {
      const msg = await prisma.messages.create({
        data: {
          emisorId:   parseInt(emisorId),
          receptorId: parseInt(receptorId),
          contenido,
        },
        include: {
          users_messages_emisorIdTousers: { select: { id: true, username: true } }
        }
      });

      const msgNorm = {
        ...msg,
        emisor: msg.users_messages_emisorIdTousers,
      };

      const receptorSocket = onlineUsers.get(String(receptorId));
      if (receptorSocket) {
        io.to(receptorSocket).emit('message:receive', msgNorm);
      }
      socket.emit('message:sent', msgNorm);

    } catch (err) {
      console.error('Error enviando mensaje:', err.message);
    }
  });

  socket.on('messages:read', async ({ emisorId, receptorId }) => {
    try {
      await prisma.messages.updateMany({
        where: {
          emisorId:   parseInt(emisorId),
          receptorId: parseInt(receptorId),
          leido: false
        },
        data: { leido: true, leidoEn: new Date() }
      });
      const emisorSocket = onlineUsers.get(String(emisorId));
      if (emisorSocket) io.to(emisorSocket).emit('messages:read:confirm', { receptorId });
    } catch (err) {
      console.error('Error marcando leídos:', err.message);
    }
  });

  socket.on('typing:start', ({ receptorId }) => {
    const receptorSocket = onlineUsers.get(String(receptorId));
    if (receptorSocket) {
      io.to(receptorSocket).emit('typing:start', { userId: socket.userId });
    }
  });

  socket.on('typing:stop', ({ receptorId }) => {
    const receptorSocket = onlineUsers.get(String(receptorId));
    if (receptorSocket) {
      io.to(receptorSocket).emit('typing:stop', { userId: socket.userId });
    }
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.forEach((socketId, userId) => {
        if (userId !== socket.userId) {
          io.to(socketId).emit('typing:stop', { userId: socket.userId });
        }
      });
      onlineUsers.delete(socket.userId);
      io.emit('users:online', Array.from(onlineUsers.keys()));
    }
  });

});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server corriendo en puerto ${PORT}`));