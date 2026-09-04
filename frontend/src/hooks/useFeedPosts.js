"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { API } from "@/lib/api";

let feedSocket = null;

// Carga de posts según la pestaña activa + realtime por socket
// (post:new / post:deleted / post:react / post:comment) + refresco periódico de
// TRENDING + contador de posts nuevos.
export default function useFeedPosts({ activeTab, status, session }) {
  const [posts,    setPosts]    = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [newCount, setNewCount] = useState(0);

  const activeTabRef  = useRef(activeTab);
  const trendingTimer = useRef(null);

  useEffect(() => {
    activeTabRef.current = activeTab;
    setNewCount(0);
  }, [activeTab]);

  const loadPosts = useCallback(async (tab) => {
    setLoading(true);
    setPosts([]);
    try {
      const endpoints = {
        RECIENTES: `${API}/api/posts/feed/recientes`,
        TRENDING:  `${API}/api/posts/feed/trending`,
        SIGUIENDO: `${API}/api/posts/feed/siguiendo`,
      };
      const res  = await fetch(endpoints[tab], { credentials:"include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadPosts(activeTab);
  }, [activeTab, status, loadPosts]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.dbId) return;
    feedSocket = io(API);
    feedSocket.emit("user:connect", session.user.dbId);
    feedSocket.on("post:new", (post) => {
      const tab = activeTabRef.current;
      if (tab === "RECIENTES" && post.privacidad === "PUBLICA") {
        setPosts(prev => [post, ...prev]);
        setNewCount(prev => prev + 1);
      }
      if (tab === "SIGUIENDO") loadPosts("SIGUIENDO");
    });
    feedSocket.on("post:deleted", ({ id }) => {
      setPosts(prev => prev.filter(p => p.id !== id));
    });
    // B2 · reacciones de cualquier usuario → refrescar totales (sin tocar myReaction)
    feedSocket.on("post:react", ({ postId, totalLikes, totalDislikes }) => {
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, totalLikes, totalDislikes } : p
      ));
    });
    // B3 · contador de comentarios en vivo
    const applyCommentCount = ({ postId, totalComentarios }) => {
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, totalComentarios, _count: { ...p._count, comments: totalComentarios } }
          : p
      ));
    };
    feedSocket.on("post:comment", applyCommentCount);
    feedSocket.on("post:comment:deleted", applyCommentCount);

    trendingTimer.current = setInterval(() => {
      if (activeTabRef.current === "TRENDING") loadPosts("TRENDING");
    }, 60000);
    return () => {
      feedSocket?.disconnect();
      feedSocket = null;
      clearInterval(trendingTimer.current);
    };
  }, [status, session, loadPosts]);

  const removePost = useCallback((id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  const resetNewCount = useCallback(() => setNewCount(0), []);

  // B2 · alterna LIKE / DISLIKE con update optimista + reconciliación con el backend
  const toggleReaction = useCallback(async (postId, tipo) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      let likes    = p.totalLikes ?? 0;
      let dislikes = p.totalDislikes ?? 0;
      if (p.myReaction === "LIKE")    likes--;
      if (p.myReaction === "DISLIKE") dislikes--;
      const myReaction = p.myReaction === tipo ? null : tipo;
      if (myReaction === "LIKE")    likes++;
      if (myReaction === "DISLIKE") dislikes++;
      return { ...p, myReaction, totalLikes: Math.max(0, likes), totalDislikes: Math.max(0, dislikes) };
    }));
    try {
      const res = await fetch(`${API}/api/posts/${postId}/react`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, myReaction: data.myReaction, totalLikes: data.totalLikes, totalDislikes: data.totalDislikes }
          : p
      ));
    } catch {
      loadPosts(activeTabRef.current); // revertir al estado real
    }
  }, [loadPosts]);

  return { posts, loading, newCount, resetNewCount, removePost, toggleReaction };
}
