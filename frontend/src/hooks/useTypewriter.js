"use client";

// MÓDULO: hooks/useTypewriter.js
// Efecto de "máquina de escribir": va revelando `text` letra por letra cada
// `speed` milisegundos. Genérico y reusable — hoy lo usa solo
// hooks/useRegister.js (para el texto de bienvenida), pero no depende de
// nada de registro específicamente.
import { useState, useEffect } from "react";

export default function useTypewriter(text, speed = 18) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return displayed;
}
