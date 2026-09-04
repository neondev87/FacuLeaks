"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { API } from "@/lib/api";

// Estado y lógica de la página de chat: conversaciones, chat activo, mensajes,
// socket en tiempo real, indicadores (typing/audio), racha, envío y borrado.
// La búsqueda vive en useChatSearch y la grabación en useAudioRecorder.
// Sin cambios de comportamiento respecto al inline de chat/page.js.
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

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.dbId) return;
    const socket = io(API);
    socketRef.current = socket;
    socket.emit("user:connect", session.user.dbId);
    socket.on("users:online",    users => setOnlineUsers(users));
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
    const chatUser = { userId: user.userId || user.id, username: user.username };
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
  };
}
