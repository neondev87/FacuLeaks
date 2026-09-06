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
// POR QUÉ useInsertionEffect: React corre los insertion effects en la fase
// de commit, ANTES de que el navegador pinte y antes de los layout effects.
// Es el hook pensado justamente para inyectar <style> de CSS-in-JS sin
// FOUC. Con useEffect (que corre DESPUÉS del primer pintado) había un frame
// sin el CSS de la página: en /chat eso se veía como un "flashazo" del
// fondo del chat vacío — la capa de texto caía a una sola columna, color
// casi blanco y tamaño normal, tapando todo el panel — que después se
// reacomodaba de golpe a las 5 columnas tenues. Fallback a useEffect por si
// el runtime no trae useInsertionEffect.
//
// CON QUÉ SE CONECTA: lo usan app/feed/page.js, app/chat/page.js,
// app/perfil/page.js, app/perfil/[id]/page.js, app/amigos/page.js (cada
// uno le pasa su propio bloque de CSS desde su archivo *Styles.js).
// ════════════════════════════════════════════════════════════════════════
import { useEffect, useInsertionEffect } from "react";

const useStyleEffect =
  typeof useInsertionEffect === "function" ? useInsertionEffect : useEffect;

export default function useInjectedStyles(id, css) {
  useStyleEffect(() => {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
    return () => document.getElementById(id)?.remove();
  }, [id, css]);
}
