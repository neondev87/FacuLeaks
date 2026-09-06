"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import useInjectedStyles from "@/hooks/useInjectedStyles";
import useForo from "@/hooks/useForo";
import Comentario from "@/components/foro/Comentario";
import TrashGlyph from "@/components/TrashGlyph";
import { foroStyles } from "./foroStyles";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: app/foro/page.js — el FORO (funcional desde Fase 3, 2026-09-06)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: dirección "Tablón" / paleta "Grafito". Canales a la izquierda —
// el admin los crea y borra (＋ NUEVO CANAL / papelera por fila). En cada
// canal, un TEMA CENTRAL arriba (lo crea SOLO el admin) y la lista de
// comentarios abajo (SIN título — solo texto). Para comentar se abre un
// composer a pantalla completa. Los temas anteriores del canal quedan como
// chips para volver a ellos.
//
// CON QUÉ SE CONECTA: hooks/useForo.js (datos + socket), components/foro/
// Comentario.js. Backend: /api/foro/* (foro.controller.js).
// ════════════════════════════════════════════════════════════════════════

export default function ForoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const cmtsEndRef = useRef(null);
  const c02Ref = useRef(null);

  const {
    canales, canal, setCanal,
    temas, temaActivo, temaActivoId, setTemaActivoId,
    comentarios, loadingCanales, loadingTemas, loadingComs,
    puedeCrearTema, sending,
    enviarComentario, crearTema, borrarTema, borrarComentario,
    crearCanal, borrarCanal,
  } = useForo();

  const [writing, setWriting]   = useState(false);
  const [draft, setDraft]       = useState("");
  const [newTema, setNewTema]   = useState("");
  const [showNewTema, setShowNewTema] = useState(false);
  const [newCanal, setNewCanal] = useState("");
  const [showNewCanal, setShowNewCanal] = useState(false);

  useInjectedStyles("foro-styles", foroStyles);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth");
  }, [status, router]);

  useEffect(() => {
    cmtsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comentarios]);

  // cerrar el composer con Escape
  useEffect(() => {
    if (!writing) return undefined;
    const onEsc = e => { if (e.key === "Escape") setWriting(false); };
    document.addEventListener("keydown", onEsc);
    c02Ref.current?.focus();
    return () => document.removeEventListener("keydown", onEsc);
  }, [writing]);

  if (status === "loading") return null;

  const uid = session?.user?.dbId != null ? Number(session.user.dbId) : null;
  const prevTemas = temas.filter(t => t.id !== temaActivoId);
  const canalActual = canales.find(c => c.id === canal) || null;
  const canalName = canalActual?.name || "#";

  const submitComentario = async () => {
    const ok = await enviarComentario(draft);
    if (ok) { setDraft(""); setWriting(false); }
  };
  const submitTema = async () => {
    const ok = await crearTema(newTema);
    if (ok) { setNewTema(""); setShowNewTema(false); }
  };
  const submitCanal = async () => {
    const ok = await crearCanal(newCanal);
    if (ok) { setNewCanal(""); setShowNewCanal(false); }
  };

  return (
    <>
      <Navbar />
      <div className="foro">

        {/* ── canales ── */}
        <div className="foro-side">
          <div className="foro-side__h">CANALES</div>
          <div className="foro-side__list">
            {loadingCanales ? (
              <div className="foro-side__empty"><span className="spinner" /></div>
            ) : canales.length === 0 ? (
              <div className="foro-side__empty">
                {puedeCrearTema ? "sin canales — creá el primero abajo" : "sin canales todavía"}
              </div>
            ) : (
              canales.map(c => (
                <div key={c.id} className={`canal${canal === c.id ? " on" : ""}`} onClick={() => setCanal(c.id)}>
                  <span className="canal__t">{c.name}</span>
                  {puedeCrearTema && (
                    <button className="canal__del" title={`Eliminar ${c.name} y todo su contenido`}
                      onClick={e => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar el canal ${c.name}? Se borran también sus temas y comentarios.`)) borrarCanal(c.id);
                      }}>
                      <TrashGlyph size={12} />
                    </button>
                  )}
                </div>
              ))
            )}

            {/* admin: crear canal */}
            {puedeCrearTema && (
              showNewCanal ? (
                <div className="foro-newcanal">
                  <input
                    autoFocus value={newCanal} onChange={e => setNewCanal(e.target.value)}
                    maxLength={40} placeholder="nombre del canal…"
                    onKeyDown={e => { if (e.key === "Enter") submitCanal(); if (e.key === "Escape") { setShowNewCanal(false); setNewCanal(""); } }}
                  />
                  <div className="foro-newcanal__row">
                    <button onClick={submitCanal}>CREAR</button>
                    <button className="ghost" onClick={() => { setShowNewCanal(false); setNewCanal(""); }}>✕</button>
                  </div>
                </div>
              ) : (
                <button className="canal-add" onClick={() => setShowNewCanal(true)}>＋ NUEVO CANAL</button>
              )
            )}
          </div>

          <div className="foro-side__me">
            {session?.user?.name?.split(" ")[0] || "vos"}{puedeCrearTema ? " · admin" : ""}
          </div>
        </div>

        {/* ── tablero ── */}
        <div className="foro-board">

          {/* admin: crear tema */}
          {puedeCrearTema && canalActual && (
            showNewTema ? (
              <div className="foro-newtema">
                <input
                  autoFocus value={newTema} onChange={e => setNewTema(e.target.value)}
                  maxLength={200}
                  placeholder={`título del tema para ${canalName}…`}
                  onKeyDown={e => { if (e.key === "Enter") submitTema(); if (e.key === "Escape") setShowNewTema(false); }}
                />
                <button onClick={submitTema}>PUBLICAR</button>
                <button className="ghost" onClick={() => { setShowNewTema(false); setNewTema(""); }}>✕</button>
              </div>
            ) : (
              <div className="foro-admin">
                <button onClick={() => setShowNewTema(true)}>＋ NUEVO TEMA EN {canalName.toUpperCase()}</button>
              </div>
            )
          )}

          {loadingCanales || loadingTemas ? (
            <div className="foro-empty"><span className="spinner" /></div>
          ) : !canalActual ? (
            <div className="foro-empty">
              {puedeCrearTema
                ? "todavía no hay canales — creá uno en la barra de la izquierda"
                : "el foro todavía no tiene canales"}
            </div>
          ) : !temaActivo ? (
            <div className="foro-empty">
              {puedeCrearTema
                ? `todavía no hay ningún tema en ${canalName} — creá el primero arriba`
                : `todavía no hay ningún tema en ${canalName}`}
            </div>
          ) : (
            <>
              {/* tema central — solo título */}
              <div className="foro-theme">
                {(puedeCrearTema || (uid != null && temaActivo.autor?.id === uid)) && (
                  <button className="foro-theme__del" title="Eliminar tema"
                    onClick={() => { if (confirm("¿Eliminar este tema y todos sus comentarios?")) borrarTema(temaActivo.id); }}>
                    <TrashGlyph size={14} />
                  </button>
                )}
                <div className="foro-theme__k">TEMA · {canalName}</div>
                <div className="foro-theme__t">{temaActivo.titulo}</div>
                <div className="foro-theme__meta">
                  {temaActivo.totalComentarios ?? comentarios.length} comentario{(temaActivo.totalComentarios ?? comentarios.length) === 1 ? "" : "s"}
                  {temaActivo.autor?.username ? ` · por ${temaActivo.autor.username}` : ""}
                </div>
                <button className="foro-theme__go" onClick={() => { setWriting(true); }}>＋ COMENTAR</button>
              </div>

              {/* temas anteriores del canal — cada uno se puede abrir o (admin/autor) borrar */}
              {prevTemas.length > 0 && (
                <div className="foro-prev">
                  <div className="foro-prev__h">{puedeCrearTema ? "TUS OTROS TEMAS EN ESTE CANAL" : "TEMAS ANTERIORES"}</div>
                  <div className="foro-prev__list">
                    {prevTemas.map(t => (
                      <span key={t.id} className="chip">
                        <span className="chip__t" title={t.titulo} onClick={() => setTemaActivoId(t.id)}>{t.titulo}</span>
                        {(puedeCrearTema || (uid != null && t.autor?.id === uid)) && (
                          <button className="chip__del" title="Eliminar tema"
                            onClick={() => { if (confirm(`¿Eliminar "${t.titulo}" y todos sus comentarios?`)) borrarTema(t.id); }}>
                            <TrashGlyph size={11} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* comentarios (sin título) */}
              <div className="foro-cmts">
                {loadingComs ? (
                  <div className="foro-empty"><span className="spinner" /></div>
                ) : comentarios.length === 0 ? (
                  <div className="foro-empty">sé el primero en comentar este tema</div>
                ) : (
                  comentarios.map(c => (
                    <Comentario
                      key={c.id}
                      c={c}
                      canDelete={puedeCrearTema || (uid != null && c.autor?.id === uid)}
                      onDelete={borrarComentario}
                    />
                  ))
                )}
                <div ref={cmtsEndRef} />
              </div>
            </>
          )}

          {/* composer "un hilo por pantalla" */}
          {temaActivo && (
            <div className={`foro-c02${writing ? " open" : ""}`}>
              <div className="foro-c02__ctx">RESPONDIENDO AL TEMA · <b>{temaActivo.titulo}</b></div>
              <textarea
                ref={c02Ref}
                className="foro-c02__ta"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                maxLength={5000}
                placeholder="escribí tu comentario… (sin título, directo al grano)"
              />
              <div className="foro-c02__row">
                <button className="foro-c02__cancel" onClick={() => setWriting(false)}>CANCELAR</button>
                <button className="foro-c02__send" onClick={submitComentario} disabled={sending || !draft.trim()}>
                  {sending ? <span className="spinner" /> : "PUBLICAR †"}
                </button>
              </div>
              <div className="foro-c02__hint">ESC PARA CERRAR · EL COMENTARIO NO LLEVA TÍTULO</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
