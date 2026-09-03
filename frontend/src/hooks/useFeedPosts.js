"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io } from "socket.io-client";
import { API } from "@/lib/api";

let feedSocket = null;

// Carga de posts según la pestaña activa + realtime por socket
// (post:new / post:deleted) + refresco periódico de TRENDING + contador de
// posts nuevos. Idéntico al inline de feed/page.js.
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
    trendingTimer.current = setInterval(() => {
      if (activeTabRef.current === "TRENDING") loadPosts("TRENDING");
    }, 60000);
    return () => {
      feedSocket?.disconnect();
      feedSocket = null;
      clearInterval(trendingTimer.current);
    };
  }, [status, session]);

  const removePost = useCallback((id) => {
    setPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  const resetNewCount = useCallback(() => setNewCount(0), []);

  return { posts, loading, newCount, resetNewCount, removePost };
}
