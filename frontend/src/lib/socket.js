"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: lib/socket.js — crear un socket de Socket.io ya autenticado
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: devuelve un socket que se identifica solo. En cada (re)conexión
// pide un "ticket" corto a GET /api/chat/socket-ticket (la cookie de sesión
// del backend es httpOnly — el JS del navegador no la puede leer, así que no
// se puede pasar directo en el handshake). El backend verifica ese ticket en
// io.use(socketAuthMiddleware) y deja la identidad REAL en socket.userId.
//
// Antes cada hook hacía `io(SOCKET_URL)` y mandaba `socket.emit("user:connect",
// dbId)` con el id que quisiera — cualquiera podía hacerse pasar por otro y
// recibir sus mensajes privados. Ahora la identidad sale de un token firmado.
//
// Si el ticket falla (no logueado, backend caído), el socket se conecta
// igual pero ANÓNIMO: recibe los eventos públicos (feed, foro) pero no entra
// a la sala privada `user:<id>` ni puede mandar DMs.
//
// CON QUÉ SE CONECTA: lo usan hooks/useChat.js, useFeedPosts.js,
// usePublicProfile.js, useForo.js y usePostComments.js.
// ════════════════════════════════════════════════════════════════════════
import { io } from "socket.io-client";
import { API, SOCKET_URL } from "@/lib/api";

export function createAuthedSocket() {
  return io(SOCKET_URL, {
    withCredentials: true,
    auth: async (cb) => {
      try {
        const res  = await fetch(`${API}/api/chat/socket-ticket`, { credentials: "include" });
        const data = await res.json();
        cb({ token: data?.ticket || null });
      } catch {
        cb({ token: null });
      }
    },
  });
}
