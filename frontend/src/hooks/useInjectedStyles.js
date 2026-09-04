"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/useInjectedStyles.js — inyecta CSS por página
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: mete una etiqueta <style> con el CSS que le pases dentro del
// <head> del documento cuando el componente se monta, y la saca cuando se
// desmonta (para que el CSS de una página no se quede pegado si navegás a
// otra). Es el patrón que usa CADA página para sus animaciones y estilos
// específicos (el fondo con ruido, los hairlines, las fuentes de Google
// Fonts que importa cada página, etc.).
//
// PARA QUÉ SIRVE: en vez de que cada página repita a mano el código de
// "crear un <style>, ponerle un id, agregarlo al head, sacarlo al
// desmontar", lo hacen todas llamando a este único hook.
//
// CON QUÉ SE CONECTA: lo usan app/feed/page.js, app/chat/page.js,
// app/perfil/page.js, app/perfil/[id]/page.js, app/amigos/page.js (cada
// uno le pasa su propio bloque de CSS desde su archivo *Styles.js).
// ════════════════════════════════════════════════════════════════════════
import { useEffect } from "react";
export default function useInjectedStyles(id, css) {
  useEffect(() => {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
    return () => document.getElementById(id)?.remove();
  }, [id, css]);
}
