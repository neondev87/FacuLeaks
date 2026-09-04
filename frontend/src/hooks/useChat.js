"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/useChat.js — cerebro de la página de chat
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: es el hook más grande del frontend porque el chat tiene mucho
// estado en vivo. Junta: la lista de conversaciones, la conversación
// abierta y sus mensajes, el socket (UN solo socket para toda la sesión de
// chat), quién está online, quién está escribiendo o grabando un audio
// ahora mismo, la racha de mensajes con esa persona, y mandar/leer/borrar
// mensajes. Todo lo que llega por socket (mensaje nuevo, audio, imagen,
// borrado) pasa por acá y actualiza el estado que ve la pantalla.
//
// PARA QUÉ SIRVE: app/chat/page.js usa este hook (+ useChatSearch para
// buscar gente, + useAudioRecorder para grabar, + useChatImage para mandar
// fotos) para no tener 700 líneas de lógica mezcladas con el JSX.
//
// CON QUÉ SE CONECTA:
//   - backend: GET /api/chat/conversaciones, GET /api/chat/:userId,
//     DELETE /api/chat/mensaje/:id, GET /api/perfil/avatar (tu propio
//     ícono), y el streak (si existe el endpoint).
//   - Socket.io: message:send/receive/sent/error, messages:read,
//     typing:start/stop, audio:start/stop, message:receive:audio,
//     message:receive:image, message:deleted — todo esto lo maneja
//     backend/src/modules/chat/chat.socket.js del otro lado. También
//     escucha user:avatar (emitido desde perfil.controller.js) para
//     actualizar ícono propio/ajeno sin recargar la página.
//   - Lo consume: app/chat/page.js, que le pasa el socket (`socketRef`) y
//     `addMensaje` a useAudioRecorder y useChatImage para que ellos también
//     puedan agregar mensajes a la lista.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { API } from "@/lib/api";
export default function useChat({ session, status, inputRef }) {
  const [recientes,   setRecientes]   = useState([]);
  const [amigos,      setAmigos]      = useState([]);
  const [activeChat,  setActiveChat]  = useState(null);
  const [mensajes,    setMensajes]    = useState([]);
  const [input,       setInput]       = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [replyingTo,  setReplyingTo]  = useState(null);
  const [isTyping,    setIsTyping]    = useState(false);
  const [isAudio,     setIsAudio]     = useState(false);
  const [streak,      setStreak]      = useState({ count:0, dying:false, progress:1.0, loaded:false });
  const [ownImagen,   setOwnImagen]   = useState(null);

  const socketRef   = useRef(null);
  const typingTimer = useRef(null);

  const addMensaje = useCallback((msg) => {
    setMensajes(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
  }, []);

  const loadConversaciones = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/chat/conversaciones`, { credentials:"include" });
      const data = await res.json();
      setRecientes(data.recientes || []);
      setAmigos(data.amigos       || []);
    } catch {}
  }, []);

  const loadStreak = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res  = await fetch(`${API}/api/chat/streak/${userId}`, { credentials:"include" });
      if (!res.ok) return;
      const data = await res.json();
      setStreak({ count: data.count ?? 0, dying: data.dying ?? false, progress: data.progress ?? 1.0, loaded: true });
    } catch {
      setStreak({ count:0, dying:false, progress:1.0, loaded:true });
    }
  }, []);

  useEffect(() => { setIsTyping(false); setIsAudio(false); }, [activeChat]);

  useEffect(() => {
    if (activeChat?.userId) loadStreak(activeChat.userId);
  }, [activeChat, loadStreak]);

  useEffect(() => {
    if (status === "authenticated") loadConversaciones();
  }, [status, loadConversaciones]);

  // Tu propio avatar (para la burbuja "◎" de tus mensajes) — endpoint liviano.
  useEffect(() => {
    if (status !== "authenticated") return;
    (async () => {
      try {
        const res  = await fetch(`${API}/api/perfil/avatar`, { credentials:"include" });
        if (!res.ok) return;
        const data = await res.json();
        setOwnImagen(data.imagen || null);
      } catch {}
    })();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.dbId) return;
    const socket = io(API);
    socketRef.current = socket;
    socket.emit("user:connect", session.user.dbId);
    socket.on("users:online",    users => setOnlineUsers(users));
    // Alguien cambió su foto de perfil — reflejarlo en vivo en la lista de
    // conversaciones, en la cabecera del chat activo, y en tu propio ícono.
    socket.on("user:avatar", ({ userId, imagen }) => {
      if (String(userId) === String(session.user.dbId)) { setOwnImagen(imagen); return; }
      setRecientes(prev => prev.map(c => c.userId === userId ? { ...c, imagen } : c));
      setAmigos(prev => prev.map(a => a.userId === userId ? { ...a, imagen } : a));
      setActiveChat(prev => prev && prev.userId === userId ? { ...prev, imagen } : prev);
    });
    socket.on("message:receive", msg   => { addMensaje(msg); loadConversaciones(); });
    socket.on("message:sent",    msg   => { addMensaje(msg); });
    socket.on("typing:start",    ({ userId }) => { setIsTyping(String(userId)); setIsAudio(false); });
    socket.on("typing:stop",     ({ userId }) => { setIsTyping(prev => prev === String(userId) ? false : prev); });
    socket.on("audio:start",     ({ userId }) => { setIsAudio(String(userId)); setIsTyping(false); });
    socket.on("audio:stop",      ({ userId }) => { setIsAudio(prev => prev === String(userId) ? false : prev); });
    socket.on("message:receive:audio", msg => { addMensaje(msg); loadConversaciones(); });
    socket.on("message:receive:image", msg => { addMensaje(msg); loadConversaciones(); });
    socket.on("message:deleted", ({ id }) => {
      setMensajes(prev => prev.filter(m => m.id !== id));
    });
    return () => { socket?.disconnect(); socketRef.current = null; };
  }, [status, session]);

  const openChat = async user => {
    setIsTyping(false); setIsAudio(false);
    const chatUser = { userId: user.userId || user.id, username: user.username, imagen: user.imagen || null };
    setActiveChat(chatUser);
    setLoading(true); setMensajes([]); setReplyingTo(null);
    try {
      const res  = await fetch(`${API}/api/chat/${chatUser.userId}`, { credentials:"include" });
      const data = await res.json();
      const msgs = data.mensajes || [];
      setMensajes(msgs.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i));
      if (socketRef.current && session?.user?.dbId)
        socketRef.current.emit("messages:read", { emisorId: chatUser.userId, receptorId: session.user.dbId });
    } catch {}
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleInputChange = e => {
    setInput(e.target.value);
    if (!socketRef.current || !activeChat) return;
    socketRef.current.emit("typing:start", { receptorId: activeChat.userId });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socketRef.current?.emit("typing:stop", { receptorId: activeChat.userId });
    }, 1500);
  };

  const handleDeleteMsg = async msgId => {
    try {
      await fetch(`${API}/api/chat/mensaje/${msgId}`, { method:"DELETE", credentials:"include" });
      setMensajes(prev => prev.filter(m => m.id !== msgId));
      if (socketRef.current && activeChat) socketRef.current.emit("message:deleted", { id: msgId, receptorId: activeChat.userId });
    } catch {}
  };

  const sendMessage = () => {
    if (!input.trim() || !activeChat || !socketRef.current || !session?.user?.dbId) return;
    clearTimeout(typingTimer.current);
    socketRef.current.emit("typing:stop",  { receptorId: activeChat.userId });
    socketRef.current.emit("message:send", {
      emisorId:   session.user.dbId,
      receptorId: activeChat.userId,
      contenido:  input.trim(),
      replyToId:  replyingTo?.id || null,
    });
    setInput("");
    setReplyingTo(null);
  };

  const isOnline = id => onlineUsers.includes(String(id));
  const isActive = id => activeChat?.userId === id;

  const formatDate = d => {
    if (!d) return "";
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "HOY";
    if (date.toDateString() === yesterday.toDateString()) return "AYER";
    return date.toLocaleDateString("es-MX", { day:"numeric", month:"long" }).toUpperCase();
  };

  const showTypingIndicator = isTyping && String(isTyping) === String(activeChat?.userId);
  const showAudioIndicator  = isAudio  && String(isAudio)  === String(activeChat?.userId);

  return {
    recientes, amigos, onlineUsers, isOnline, isActive,
    activeChat, mensajes, loading, openChat,
    input, setInput, handleInputChange, sendMessage,
    replyingTo, setReplyingTo,
    showTypingIndicator, showAudioIndicator,
    streak,
    handleDeleteMsg,
    formatDate,
    socketRef, addMensaje,
    ownImagen,
  };
}
