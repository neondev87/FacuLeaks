// ════════════════════════════════════════════════════════════════════════
// MÓDULO: server.js — el punto de arranque de TODO el backend
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   1. Levanta un servidor HTTP con Express y, sobre el MISMO puerto (4000),
//      un servidor de WebSockets con Socket.io (el chat/feed en vivo).
//   2. Configura la seguridad de red: CORS (solo el frontend puede llamar),
//      rate limiting (frena fuerza bruta en login/uploads), y bind a
//      127.0.0.1 por defecto (no expuesto a la red salvo que se pida).
//   3. "Monta" cada módulo de rutas bajo su prefijo /api/* — es literalmente
//      el mapa de qué carpeta de módulo atiende qué URL.
//   4. Maneja la conexión de cada socket: guarda quién está online
//      (`onlineUsers`) y delega TODO lo demás del chat (mandar mensaje,
//      marcar leído, indicadores de "escribiendo") al módulo chat/.
//
// PARA QUÉ SIRVE:
//   Es el "main" del backend — el único archivo que arranca todo lo demás.
//   Ningún otro archivo del backend se ejecuta solo; todos cuelgan de acá.
//
// CON QUÉ SE CONECTA:
//   - Cada modules/<nombre>/<nombre>.routes.js → le entrega su router y
//     server.js lo cuelga de una URL (`app.use('/api/posts', postsRoutes)`).
//   - modules/chat/chat.socket.js → toda la lógica de tiempo real del chat
//     vive ahí, no acá (server.js solo hace `registerChatSocketHandlers`).
//   - backend/.env → PORT, HOST, CORS_ORIGIN, y (indirecto) todo lo que
//     usan los módulos que este archivo importa.
//   - carpeta uploads/ → se sirve como archivos estáticos, y se crean sus
//     subcarpetas acá si no existen al arrancar.
// ════════════════════════════════════════════════════════════════════════
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const fs = require('fs');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// sharp >= 0.35 en Windows deja el archivo de entrada bloqueado un rato
// tras .toFile(); sin esto, el fs.unlinkSync(tmpPath) de los uploads tira
// EBUSY y la subida falla. Desactivar la cache de sharp lo resuelve.
require('sharp').cache(false);

const authRoutes    = require('./modules/auth/auth.routes');
const postsRoutes   = require('./modules/posts/posts.routes');
const chatRoutes    = require('./modules/chat/chat.routes');
const amigosRoutes  = require('./modules/amigos/amigos.routes');
const uploadRoutes  = require('./modules/upload/upload.routes');
const spotifyRoutes = require('./modules/spotify/spotify.routes');
const perfilRoutes  = require('./modules/perfil/perfil.routes');
const foroRoutes    = require('./modules/foro/foro.routes');
const { authMiddleware } = require('./middleware/auth');
const { serveAudio }     = require('./modules/chat/chat.controller');
const { registerChatSocketHandlers, socketAuthMiddleware } = require('./modules/chat/chat.socket');

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

app.use((req, res, next) => { req.io = io; next(); });

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
app.use('/api/foro',    foroRoutes);

// Presencia: userId (string) → Set de socketIds (una persona puede tener
// varias pestañas/dispositivos abiertos). La lista de "quién está online"
// son las claves. La ENTREGA de mensajes NO usa este Map: se hace por rooms
// `user:<id>` (ver chat.socket.js) para que llegue a todas sus pestañas.
const onlineUsers = new Map();
const roomFor = (userId) => `user:${userId}`;

// Portero del WebSocket. Es LENIENTE a propósito: si viene un JWT válido deja
// la identidad en socket.userId; si no, la conexión sigue pero ANÓNIMA. Los
// eventos públicos (feed, foro, comentarios) los recibe cualquiera — lo que
// se protege es el chat: sin socket.userId no entrás a tu sala `user:<id>`
// (no recibís DMs de nadie) y los handlers de chat te ignoran.
io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  const userId = socket.userId || null;

  // Solo los sockets autenticados entran a su sala privada y cuentan como
  // "online". Los anónimos solo escuchan los broadcasts públicos.
  if (userId) {
    socket.join(roomFor(userId));
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);
    io.emit('users:online', Array.from(onlineUsers.keys()));
  }

  // Los handlers del dominio chat (message:send, messages:read, typing/audio)
  // viven en el módulo chat. Cada uno chequea socket.userId por su cuenta.
  registerChatSocketHandlers(io, socket);

  socket.on('disconnect', () => {
    if (!userId) return;
    const set = onlineUsers.get(userId);
    if (!set) return;
    set.delete(socket.id);
    if (set.size > 0) return;              // le quedan otras pestañas abiertas
    onlineUsers.delete(userId);
    io.emit('users:online', Array.from(onlineUsers.keys()));
    // Cortar cualquier indicador de "escribiendo" que haya quedado colgado.
    io.emit('typing:stop', { userId });
  });
});

const PORT = process.env.PORT || 4000;
// Por defecto solo loopback. Para probar desde otro dispositivo en la LAN,
// exportá HOST=0.0.0.0 explícitamente.
const HOST = process.env.HOST || '127.0.0.1';
server.listen(PORT, HOST, () => console.log(`Server corriendo en ${HOST}:${PORT}`));
