"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import BgCross from "@/components/BgCross";
import useInjectedStyles from "@/hooks/useInjectedStyles";
import useAmigos from "@/hooks/useAmigos";
import UserCard from "@/components/amigos/UserCard";
import { amigosStyles } from "./amigosStyles";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: app/amigos/page.js — buscar gente y manejar solicitudes
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: junta el buscador de usuarios y las 3 listas (solicitudes
// recibidas, enviadas, amigos) — toda la lógica vive en hooks/useAmigos.js,
// este archivo es sobre todo el JSX. Parejada con el patrón de Fase 2
// (hook + componente + useInjectedStyles) el 2026-09-04 — antes tenía todo
// inline, sin hook propio.
//
// CON QUÉ SE CONECTA: hooks/useAmigos.js, components/amigos/UserCard.js.
// ════════════════════════════════════════════════════════════════════════
export default function AmigosPage() {
  const { status } = useSession();
  const router = useRouter();

  const {
    amigos, recibidas, enviadas,
    busqueda, setBusqueda, resultados, buscando, loading,
    enviarSolicitud, aceptar, rechazar, eliminar,
  } = useAmigos({ status });

  useInjectedStyles("amigos-styles", amigosStyles);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  if (status === "loading") return null;

  return (
    <>
      <Navbar />
      <BgCross />

      <div className="page-wrap">

        {/* ── BUSCADOR ── */}
        <div style={{ marginBottom: 40 }}>
          <div className="section-header">† BUSCAR USUARIOS</div>
          <div style={{ position: "relative" }}>
            <input
              className="search-input"
              placeholder="buscar por username..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {buscando && (
              <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)" }}>
                <span className="spinner" />
              </div>
            )}
          </div>

          {resultados.length > 0 && (
            <div style={{ marginTop: 8, border: "1px solid rgba(255,255,255,.08)", padding: 8 }}>
              {resultados.map(u => (
                <UserCard
                  key={u.id}
                  user={u}
                  actions={
                    u.estadoAmistad === 'ACEPTADO' ? (
                      <span style={{ fontSize: 10, color: "#3ddc84", letterSpacing: ".1em" }}>✓ amigos</span>
                    ) : u.estadoAmistad === 'PENDIENTE' && u.esSolicitante ? (
                      <span className="sent-badge">enviada</span>
                    ) : u.estadoAmistad === 'PENDIENTE' && !u.esSolicitante ? (
                      <span className="pending-badge">pendiente</span>
                    ) : (
                      <button className="btn-action btn-add" onClick={() => enviarSolicitud(u.id)}>
                        + AGREGAR
                      </button>
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>

          {/* ── SOLICITUDES RECIBIDAS ── */}
          <div>
            <div className="section-header">
              † SOLICITUDES
              {recibidas.length > 0 && <span className="badge">{recibidas.length}</span>}
            </div>
            {loading ? (
              <div className="empty-state"><span className="spinner" /></div>
            ) : recibidas.length === 0 ? (
              <div className="empty-state">sin solicitudes pendientes</div>
            ) : (
              recibidas.map(({ amistadId, user }) => (
                <UserCard
                  key={amistadId}
                  user={user}
                  actions={
                    <>
                      <button className="btn-action btn-accept" onClick={() => aceptar(amistadId)}>ACEPTAR</button>
                      <button className="btn-action btn-reject" onClick={() => rechazar(amistadId)}>✕</button>
                    </>
                  }
                />
              ))
            )}
          </div>

          {/* ── ENVIADAS ── */}
          <div>
            <div className="section-header">† ENVIADAS</div>
            {enviadas.length === 0 ? (
              <div className="empty-state">sin solicitudes enviadas</div>
            ) : (
              enviadas.map(({ amistadId, user }) => (
                <UserCard
                  key={amistadId}
                  user={user}
                  actions={<span className="sent-badge">pendiente</span>}
                />
              ))
            )}
          </div>
        </div>

        {/* ── AMIGOS ── */}
        <div style={{ marginTop: 40 }}>
          <div className="section-header">
            † MIS AMIGOS
            <span style={{ fontSize: 11, color: "#555", letterSpacing: ".1em" }}>{amigos.length}</span>
          </div>
          {loading ? (
            <div className="empty-state"><span className="spinner" /></div>
          ) : amigos.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 24, marginBottom: 8 }}>◈</div>
              <div>aún no tienes amigos — busca usuarios arriba</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {amigos.map(({ amistadId, user }) => (
                <UserCard
                  key={amistadId}
                  user={user}
                  actions={
                    <button className="btn-action btn-remove" onClick={() => eliminar(amistadId)}>
                      ELIMINAR
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
