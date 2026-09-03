"use client";

import { useEffect } from "react";

// Inyecta un <style id={id}> con `css` en <head> al montar y lo quita al
// desmontar. Es el patrón que feed/perfil/chat repetían inline con
// document.createElement("style").
export default function useInjectedStyles(id, css) {
  useEffect(() => {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = css;
    document.head.appendChild(s);
    return () => document.getElementById(id)?.remove();
  }, [id, css]);
}
