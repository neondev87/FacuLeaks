"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BgCross from "@/components/BgCross";
import useInjectedStyles from "@/hooks/useInjectedStyles";
import useForo from "@/hooks/useForo";
import ChannelItem from "@/components/foro/ChannelItem";
import MessageRow from "@/components/foro/MessageRow";
import { foroStyles } from "./foroStyles";
import { HOLO_THEME } from "@/lib/theme";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: app/foro/page.js — foro (100% MOCK, no funcional)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE HOY: nada real — los canales y mensajes son datos de prueba
// (hooks/useForo.js) y el input de escribir no manda nada a ningún lado. No
// existe tabla ni endpoint de foro en el backend.
//
// PARA QUÉ SIRVE: es una vidriera de cómo se vería el foro, pendiente de
// construir de cero (modelo de datos + backend + frontend). Decisión
// explícita de Erick: queda para el final, fuera del prompt maestro de
// Fases 0-3. Lo que SÍ se hizo el 2026-09-04 fue parejar la ESTRUCTURA con
// el patrón de Fase 2 (hook + componentes + useInjectedStyles) — la
// funcionalidad real del foro sigue sin construir, no tocar sin que se pida.
//
// CON QUÉ SE CONECTA: hooks/useForo.js (mock), components/foro/*.
// ════════════════════════════════════════════════════════════════════════
export default function ForoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const ac = HOLO_THEME.text;
  const messagesEndRef = useRef(null);

  const {
    channels, activeChannel, setActiveChannel,
    input, setInput, currentMsgs, currentChannel, sendMessage,
  } = useForo();

  useInjectedStyles("foro-styles", foroStyles);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChannel]);

  if (status === "loading") return null;

  return (
    <>
      <Navbar />
      <BgCross />

      <div style={{ display: "flex", height: "calc(100vh - 48px)", marginTop: 48 }}>

        {/* ── SIDEBAR ── */}
        <div style={{ width: 210, borderRight: `1px solid ${HOLO_THEME.hairlineSoft}`, background: HOLO_THEME.panel, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ padding: "14px 16px", borderBottom: `1px solid ${HOLO_THEME.hairlineSoft}`, fontFamily: "'Cinzel', serif", fontSize: 13, color: ac, letterSpacing: ".2em" }}>
            VOID_CHANNELS
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {channels.map(c => (
              <ChannelItem
                key={c.id}
                channel={c}
                active={activeChannel === c.id}
                onClick={() => setActiveChannel(c.id)}
                accent={ac}
              />
            ))}
          </div>

          <div style={{ padding: "10px 14px", borderTop: `1px solid ${HOLO_THEME.hairlineSoft}`, display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", backgroundColor: "#1c1c24", border: `1px solid ${HOLO_THEME.hairline}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: HOLO_THEME.textDim, flexShrink: 0 }}>◈</div>
            <div>
              <div style={{ fontSize: 12, color: HOLO_THEME.text, fontFamily: "'Inter',sans-serif" }}>{session?.user?.name?.split(" ")[0] || "user"}</div>
              <div style={{ fontSize: 10, color: "#3ddc84", display: "flex", alignItems: "center", gap: 4, fontFamily: "'Inter',sans-serif" }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#3ddc84", display: "inline-block" }} />
                online
              </div>
            </div>
          </div>
        </div>

        {/* ── MENSAJES ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          <div style={{ padding: "12px 24px", borderBottom: `1px solid ${HOLO_THEME.hairlineSoft}`, display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
            <span style={{ color: ac, fontFamily: "'Cinzel', serif", fontSize: 15 }}>{currentChannel?.name}</span>
            <span style={{ color: HOLO_THEME.hairline }}>|</span>
            <span style={{ fontSize: 12, color: HOLO_THEME.textDim, fontFamily: "'Inter',sans-serif" }}>{currentChannel?.desc}</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
            {currentMsgs.map((m, i) => (
              <MessageRow key={i} msg={m} accent={ac} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ padding: "14px 24px", borderTop: `1px solid ${HOLO_THEME.hairlineSoft}`, display: "flex", gap: 10, flexShrink: 0 }}>
            <input
              className="msg-input"
              placeholder={`mensaje en ${currentChannel?.name}...`}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
            />
            <button className="send-btn" onClick={sendMessage}>
              ENVIAR
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
