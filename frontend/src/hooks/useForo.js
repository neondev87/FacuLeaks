"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/useForo.js — estado de la página de foro (MOCK)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: junta el canal activo, el input de escribir, y los datos de
// prueba (`channels`/`msgs`) que ANTES vivían sueltos dentro de
// app/foro/page.js. Sigue siendo 100% mock — `sendMessage` no manda nada a
// ningún lado, solo limpia el input — esto es modularizar la ESTRUCTURA
// (parejar con el patrón de Fase 2), no construir el foro de verdad. Eso
// sigue pendiente, fuera de alcance, decisión de Erick.
//
// CON QUÉ SE CONECTA: nada real todavía. Lo consume app/foro/page.js.
// ════════════════════════════════════════════════════════════════════════
import { useState } from "react";

const CHANNELS = [
  { id: "general",    name: "# general",    desc: "todo y nada",               unread: 3 },
  { id: "vlogs",      name: "# vlogs",      desc: "comparte tu contenido",     unread: 0 },
  { id: "aesthetics", name: "# aesthetics", desc: "paletas, refs, moodboards", unread: 7 },
  { id: "code",       name: "# code",       desc: "habla del stack",           unread: 1 },
  { id: "dark-music", name: "# dark-music", desc: "playlists y bandas",        unread: 0 },
  { id: "void",       name: "# void",       desc: "el agujero negro",          unread: 2 },
];

const MSGS = {
  general: [
    { user: "dead_girl",      time: "04:37", text: "alguien más tiene el sitio lento o soy yo",           color: "#ccc" },
    { user: "null_entity",    time: "04:39", text: "yo también. igual de vacío que mi alma",              color: "#999" },
    { user: "_cemetery_code", time: "04:41", text: "están haciendo deploy supongo",                       color: "#aaa" },
    { user: "glitch.phantom", time: "04:45", text: "> void.exe se reinició solo\n> recomiendo esperar",  color: "#bbb" },
    { user: "dead_girl",      time: "04:48", text: "ya volvió para los que pregunten",                    color: "#ccc" },
  ],
  aesthetics: [
    { user: "_cemetery_code", time: "03:11", text: "alguien tiene refs de cybersigilism para un proyecto?", color: "#aaa" },
    { user: "glitch.phantom", time: "03:15", text: "busca \"dark techno sigil art\" en pinterest",          color: "#bbb" },
    { user: "null_entity",    time: "03:22", text: "también mira los stickers de Tumblr ca. 2014",          color: "#999" },
  ],
  code: [
    { user: "glitch.phantom", time: "02:03", text: "¿next.js hydration error en prod pero no en dev?",        color: "#bbb" },
    { user: "dead_girl",      time: "02:11", text: "probablemente mismatch de SSR. revisa Date o Math.random", color: "#ccc" },
    { user: "glitch.phantom", time: "02:14", text: "ERA ESO. gracias queen",                                   color: "#bbb" },
  ],
  vlogs:       [{ user: "null_entity",    time: "01:00", text: "subí nuevo vlog. está en mi perfil si quieren verlo", color: "#999" }],
  "dark-music":[{ user: "_cemetery_code", time: "00:12", text: "¿alguien conoce Salem? muy subestimados",             color: "#aaa" }],
  void:        [
    { user: "glitch.phantom", time: "03:33", text: "...", color: "#bbb" },
    { user: "dead_girl",      time: "03:34", text: "...", color: "#ccc" },
  ],
};

export default function useForo() {
  const [activeChannel, setActiveChannel] = useState("general");
  const [input, setInput] = useState("");

  const currentMsgs    = MSGS[activeChannel] || MSGS.general;
  const currentChannel = CHANNELS.find(c => c.id === activeChannel);

  // Mock: no manda nada a ningún lado, solo limpia el input.
  const sendMessage = () => { if (input.trim()) setInput(""); };

  return {
    channels: CHANNELS,
    activeChannel, setActiveChannel,
    input, setInput,
    currentMsgs, currentChannel,
    sendMessage,
  };
}
