const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes    = require('./modules/auth/auth.routes');
const postsRoutes   = require('./modules/posts/posts.routes');
const chatRoutes    = require('./modules/chat/chat.routes');
const amigosRoutes  = require('./modules/amigos/amigos.routes');
const uploadRoutes  = require('./modules/upload/upload.routes');
const spotifyRoutes = require('./modules/spotify/spotify.routes');
const perfilRoutes  = require('./modules/perfil/perfil.routes');
const { authMiddleware } = require('./middleware/auth');
const { serveAudio }     = require('./modules/chat/chat.controller');

// ── Asegurar carpetas de uploads antes de aceptar peticiones ──
['uploads/tmp', 'uploads/imagenes', 'uploads/documentos', 'uploads/audios'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

const app    = express();
const server = http.createServer(app);

// ── Socket.io con CORS desde variable de entorno ──
const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN,
    credentials: true
  }
});

// ── CORS desde variable de entorno ──
app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => { req.io = io; req.onlineUsers = onlineUsers; next(); });

// ── Rate limiting en superficies sensibles (login/registro y uploads) ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // margen para el polling de /check del frontend; frena enumeración automatizada
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos, probá de nuevo en unos minutos' },
});
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas subidas, esperá un momento' },
});

// Audios de DM: gateados por sesión + verificación emisor/receptor.
// Debe ir ANTES del static para que /uploads/audios/* no quede público.
app.get('/uploads/audios/:file', authMiddleware, serveAudio);
app.use('/uploads', express.static('uploads'));
app.use('/api/upload',  uploadLimiter, uploadRoutes);
app.get('/api/ping',    (req, res) => res.json({ message: 'Backend funcionando' }));
app.use('/api/auth',    authLimiter, authRoutes);
app.use('/api/posts',   postsRoutes);
app.use('/api/chat',    chatRoutes);
app.use('/api/amigos',  amigosRoutes);
app.use('/api/spotify', spotifyRoutes);
app.use('/api/perfil',  perfilRoutes);

const onlineUsers = new Map();
const prisma = require('./config/db');

io.on('connection', (socket) => {

  socket.on('user:connect', (userId) => {
    onlineUsers.set(String(userId), socket.id);
    socket.userId = String(userId);
    io.emit('users:online', Array.from(onlineUsers.keys()));
  });

  socket.on('audio:start', ({ receptorId }) => {
    const receptorSocket = onlineUsers.get(String(receptorId));
    if (receptorSocket) io.to(receptorSocket).emit('audio:start', { userId: socket.userId });
  });

  socket.on('audio:stop', ({ receptorId }) => {
    const receptorSocket = onlineUsers.get(String(receptorId));
    if (receptorSocket) io.to(receptorSocket).emit('audio:stop', { userId: socket.userId });
  });

  // ── message:send (único, con replyToId) ──
  socket.on('message:send', async (data) => {
    const { receptorId, contenido, emisorId, replyToId } = data;
    try {
      const msg = await prisma.messages.create({
        data: {
          emisorId:   parseInt(emisorId),
          receptorId: parseInt(receptorId),
          contenido,
          ...(replyToId ? { replyToId: parseInt(replyToId) } : {}),
        },
        include: {
          users_messages_emisorIdTousers: { select: { id: true, username: true } }
        }
      });

      const msgNorm = { ...msg, emisor: msg.users_messages_emisorIdTousers };

      const receptorSocket = onlineUsers.get(String(receptorId));
      if (receptorSocket) io.to(receptorSocket).emit('message:receive', msgNorm);
      socket.emit('message:sent', msgNorm);

    } catch (err) {
      console.error('Error enviando mensaje:', err.message);
    }
  });

  socket.on('messages:read', async ({ emisorId, receptorId }) => {
    try {
      await prisma.messages.updateMany({
        where: { emisorId: parseInt(emisorId), receptorId: parseInt(receptorId), leido: false },
        data:  { leido: true, leidoEn: new Date() }
      });
      const emisorSocket = onlineUsers.get(String(emisorId));
      if (emisorSocket) io.to(emisorSocket).emit('messages:read:confirm', { receptorId });
    } catch (err) {
      console.error('Error marcando leídos:', err.message);
    }
  });

  socket.on('typing:start', ({ receptorId }) => {
    const receptorSocket = onlineUsers.get(String(receptorId));
    if (receptorSocket) io.to(receptorSocket).emit('typing:start', { userId: socket.userId });
  });

  socket.on('typing:stop', ({ receptorId }) => {
    const receptorSocket = onlineUsers.get(String(receptorId));
    if (receptorSocket) io.to(receptorSocket).emit('typing:stop', { userId: socket.userId });
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
// Por defecto solo loopback. Para probar desde otro dispositivo en la LAN,
// exportá HOST=0.0.0.0 explícitamente.
const HOST = process.env.HOST || '127.0.0.1';
server.listen(PORT, HOST, () => console.log(`Server corriendo en ${HOST}:${PORT}`));
