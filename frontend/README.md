# FacuLeaks — Red Social

> Red social oscura con estética terminal. Built with Next.js 16 + Express + MySQL + Prisma + Socket.io.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 16.2.4 (App Router + Turbopack) |
| Backend | Express 4 en puerto 4000 |
| Base de datos | MySQL + Prisma v5 |
| Auth | NextAuth v5 (Google OAuth) |
| Tiempo real | Socket.io |
| Procesamiento de imágenes | Sharp |
| Fuentes | Inter · Cinzel · IBM Plex Mono · DM Serif Display · Space Mono |

---

## Estructura de carpetas

```
vlog/
├── frontend/                          # Next.js 16
│   └── src/
│       ├── app/
│       │   ├── auth/page.js           # Login con Google
│       │   ├── feed/page.js           # Muro principal
│       │   ├── perfil/
│       │   │   ├── page.js            # Perfil propio
│       │   │   └── [id]/page.js       # Perfil público dinámico
│       │   ├── chat/page.js           # Mensajes
│       │   ├── foro/page.js           # Foro
│       │   ├── amigos/page.js         # Amigos
│       │   └── register/page.js       # Registro
│       ├── components/
│       │   ├── Navbar.js              # Navbar + Spotify widget
│       │   ├── BgCross.js             # Fondo con cruz
│       │   ├── Uploader.js            # Subida de archivos
│       │   └── DownloadBar.js         # Barra de descarga
│       └── lib/
│           └── authOptions.js         # Config NextAuth
│
└── backend/                           # Express
    └── src/
        ├── server.js                  # Entry point + Socket.io
        ├── config/
        │   └── db.js                  # Prisma Client singleton
        ├── middleware/
        │   └── auth.js                # JWT middleware (req.userId)
        ├── modules/
        │   ├── auth/                  # Login Google → JWT cookie
        │   ├── posts/                 # CRUD posts + feed
        │   ├── chat/                  # Mensajes + audio
        │   ├── amigos/                # Solicitudes de amistad
        │   ├── perfil/                # Perfil + visitas + stats
        │   ├── upload/                # Subida de archivos con Sharp
        │   └── spotify/               # Spotify Now Playing
        └── prisma/
            └── schema.prisma          # Schema generado con db pull
```

---

## Variables de entorno

### Frontend — `.env.local`
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<secret>
GOOGLE_CLIENT_ID=<google_client_id>
GOOGLE_CLIENT_SECRET=<google_client_secret>
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Backend — `.env`
```env
DATABASE_URL="mysql://root:<password>@127.0.0.1:3306/faculeaks"
JWT_SECRET=<jwt_secret>
PORT=4000
SPOTIFY_CLIENT_ID=<spotify_client_id>
SPOTIFY_CLIENT_SECRET=<spotify_client_secret>
SPOTIFY_REFRESH_TOKEN=<spotify_refresh_token>
```

---

## Base de datos — Tablas principales

```sql
users               -- usuarios (id, username, nombre, email, imagen, googleId, creadoEn)
user_profiles       -- bio, statusText, intereses (JSON), links (JSON)
posts               -- posts del muro (autorId, titulo, contenido, imagen, privacidad, totalVistas)
post_likes          -- likes de posts
comments            -- comentarios
amistades           -- solicitudes de amistad (solicitanteId, receptorId, estado: PENDIENTE/ACEPTADO/RECHAZADO)
messages            -- mensajes de chat (emisorId, receptorId, contenido, tipo, audioUrl, replyToId, leido)
profile_visits      -- visitas a perfiles (visitorId, profileUserId, visitedAt)
```

### Migraciones aplicadas manualmente
```sql
ALTER TABLE messages ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'texto';
ALTER TABLE messages ADD COLUMN audioUrl VARCHAR(300) NULL;
ALTER TABLE messages ADD COLUMN replyToId INT NULL;

CREATE TABLE profile_visits (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  visitorId     INT NOT NULL,
  profileUserId INT NOT NULL,
  visitedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visitorId)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (profileUserId) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## Reglas críticas del proyecto

### Auth
- `session.user.dbId` = ID de BD — **NUNCA usar `session.user.id`**
- `session.user.googleId` = Google ID — usar para login al backend
- Cookie JWT backend llamada `token`, seteada por `POST /api/auth/login`
- Fetches al backend **siempre** con `credentials: "include"`

### Prisma
- Relaciones de mensajes: `users_messages_emisorIdTousers` / `users_messages_receptorIdTousers`
- Para tablas que no reconoce Prisma Client usar `$queryRaw` / `$executeRaw`
- Siempre correr `npx prisma db pull` + `npx prisma generate` después de cambios en BD

### PowerShell
- No soporta `&&` — correr comandos separados uno por uno

---

## API Endpoints principales

### Auth
```
POST /api/auth/login        -- Login con googleId → setea cookie JWT
```

### Posts
```
GET  /api/posts/feed/recientes
GET  /api/posts/feed/trending
GET  /api/posts/feed/siguiendo
POST /api/posts              -- Crear post
DELETE /api/posts/:id        -- Eliminar post propio
```

### Chat
```
GET  /api/chat/conversaciones         -- Lista de chats recientes + amigos
GET  /api/chat/:userId                -- Historial de mensajes
POST /api/chat/audio/:receptorId      -- Enviar mensaje de audio (multer WebM)
DELETE /api/chat/mensaje/:id          -- Eliminar mensaje propio
GET  /api/chat/streak/:userId         -- Racha de chat (pendiente implementar)
```

### Perfil
```
GET  /api/perfil/             -- Perfil propio + stats
GET  /api/perfil/:userId      -- Perfil público + registrar visita
PUT  /api/perfil/             -- Actualizar bio, intereses, links, nombre
PUT  /api/perfil/avatar       -- Subir foto de perfil
```

### Amigos
```
GET  /api/amigos/buscar?q=   -- Buscar usuarios
POST /api/amigos/solicitar   -- Enviar solicitud
POST /api/amigos/aceptar     -- Aceptar solicitud
```

### Spotify
```
GET  /api/spotify/now-playing  -- Canción actual del usuario
```

---

## Socket.io — Eventos

### Cliente → Servidor
```
user:connect        { userId }
message:send        { emisorId, receptorId, contenido, replyToId }
message:deleted     { id, receptorId }
messages:read       { emisorId, receptorId }
typing:start        { receptorId }
typing:stop         { receptorId }
audio:start         { receptorId }
audio:stop          { receptorId }
```

### Servidor → Cliente
```
users:online             [array de userIds]
message:receive          msg
message:sent             msg
message:receive:audio    msg
message:deleted          { id }
messages:read:confirm    { receptorId }
typing:start             { userId }
typing:stop              { userId }
audio:start              { userId }
audio:stop               { userId }
post:new                 post
post:deleted             { id }
```

---

## Carpetas de uploads

```
backend/uploads/
├── audios/      -- Mensajes de voz (.webm)
├── imagenes/    -- Avatars procesados (.webp con Sharp)
└── tmp/         -- Archivos temporales antes de procesar
```

---

## Usuarios en BD

| ID | Username | Google ID |
|----|----------|-----------|
| 1  | Neondev  | 109840262904285393065 |
| 2  | Erickxd  | 103523445665083466305 |

---

## Diseño — Tokens

```
Fondo:        #000 / #050505
Texto:        #e8e4d9
Border:       rgba(255,255,255,.07-.1)
Online:       #3ddc84
Spotify:      #1db954
Fuente UI:    Inter
Fuente títulos: Cinzel
Fuente mono:  IBM Plex Mono / Space Mono
```

---

## Cómo arrancar

### Backend
```powershell
cd vlog/backend
npx prisma db pull
npx prisma generate
node src/server.js
```

### Frontend
```powershell
cd vlog/frontend
npm run dev
```

---

## Features completadas ✅

- [x] Login con Google OAuth
- [x] Feed con posts, imágenes, likes pixel, skulls
- [x] Crear/eliminar posts con animación
- [x] Perfiles propios con modal Editar Perfil (3 tabs: Perfil/Privacidad/Cuenta)
- [x] Perfiles públicos `/perfil/[id]` con stats y posts
- [x] Perfiles clicables desde el feed
- [x] Chat en tiempo real con Socket.io
- [x] Mensajes de voz reales (MediaRecorder + WebM)
- [x] Reproductor de audio custom (sin controles nativos)
- [x] Reply a mensajes (con duración de audio en preview)
- [x] Eliminación de mensajes propios con animación + Socket
- [x] Typing indicator animado estilo terminal
- [x] Audio indicator con waveform
- [x] StreakC (llama pixel + contador + barra de progreso)
- [x] Navbar con Spotify Now Playing widget (polling 10s)
- [x] Búsqueda de usuarios en chat
- [x] Sistema de amigos (solicitar/aceptar)
- [x] Registro de visitas a perfiles (profile_visits)
- [x] Sin rayas (body::after eliminado de todas las páginas)

---

## Comandos útiles

```powershell
# Resetear caché de Next.js
Remove-Item -Recurse -Force .next

# Regenerar Prisma después de cambios en BD
npx prisma db pull
npx prisma generate

# Ver tablas en BD
# En MySQL Workbench: USE faculeaks; DESCRIBE messages;
```