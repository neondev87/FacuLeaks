"use client";

// ════════════════════════════════════════════════════════════════════════
// MÓDULO: hooks/useRegister.js — cerebro del flujo de registro por pasos
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   - Si ya tenés cuenta (dbId en sesión, o el backend confirma que existe),
//     te manda directo a /feed en vez de mostrar el formulario.
//   - Maneja los 6 pasos (0=intro, 1=username, 2=password, 3=confirmar,
//     4=creando cuenta con progreso falso, 5=éxito) con sus validaciones.
//   - El texto de bienvenida con efecto de máquina de escribir
//     (hooks/useTypewriter.js).
//   - El foco automático del input al cambiar de paso.
//   - El envío final a POST /api/auth/register.
//
// PARA QUÉ SIRVE: extraído de app/register/page.js — antes tenía TODO esto
// (más las validaciones y los componentes visuales) en un solo archivo de
// 400+ líneas. Parejado con el patrón de Fase 2 el 2026-09-04.
//
// CON QUÉ SE CONECTA: backend GET /api/auth/check/:googleId (por si el
// token de sesión no se actualizó todavía), POST /api/auth/register.
// Lo consume app/register/page.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { API } from "@/lib/api";
import useTypewriter from "@/hooks/useTypewriter";

const validateUsername = (v) => {
  if (v.length < 3)  return "mínimo 3 caracteres";
  if (v.length > 20) return "máximo 20 caracteres";
  if (!/^[a-zA-Z0-9_]+$/.test(v)) return "solo letras, números y _";
  return null;
};

const validatePassword = (v) => {
  if (v.length < 8)     return "mínimo 8 caracteres";
  if (v.length > 14)    return "máximo 14 caracteres";
  if (!/[A-Z]/.test(v)) return "necesita al menos una mayúscula";
  if (!/[0-9]/.test(v)) return "necesita al menos un número";
  return null;
};

export default function useRegister({ status, session }) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [step,     setStep]     = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState("");
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  // Si ya tiene dbId en sesión → directo al feed
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") { router.push("/auth"); return; }

    if (session?.user?.dbId) {
      router.push("/feed");
      return;
    }

    // No tiene dbId — verificar con el backend por si el token no se actualizó
    const googleId = session?.user?.googleId || session?.user?.id;
    if (!googleId) { setChecking(false); return; }

    fetch(`${API}/api/auth/check/${googleId}`)
      .then(r => r.json())
      .then(data => {
        if (data.exists) {
          router.push("/feed");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [status, session, router]);

  const introText = useTypewriter(
    session?.user?.name
      ? `> SISTEMA: bienvenido, ${session.user.name}\n> nuevo usuario detectado\n> iniciando protocolo de registro...`
      : `> SISTEMA: nuevo usuario detectado\n> iniciando protocolo de registro...`,
    14
  );

  useEffect(() => {
    if (checking) return;
    if (step === 0) {
      const t = setTimeout(() => setStep(1), session?.user?.name ? 2800 : 2200);
      return () => clearTimeout(t);
    }
  }, [step, session, checking]);

  useEffect(() => {
    if (step >= 1 && step <= 3) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [step]);

  const handleUsername = (e) => {
    e.preventDefault();
    const err = validateUsername(username);
    if (err) { setError(err); return; }
    setError(""); setStep(2);
  };

  const handlePassword = (e) => {
    e.preventDefault();
    const err = validatePassword(password);
    if (err) { setError(err); return; }
    setError(""); setStep(3);
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (confirm !== password) { setError("las contraseñas no coinciden"); return; }
    setError("");
    setStep(4);

    [{ p:20,d:300 },{ p:45,d:700 },{ p:70,d:1200 },{ p:90,d:1800 },{ p:100,d:2400 }]
      .forEach(({ p, d }) => setTimeout(() => setProgress(p), d));

    setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            googleId: session?.user?.googleId || session?.user?.id,
            email:    session?.user?.email,
            nombre:   session?.user?.name,
            username,
            password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStep(3);
          setProgress(0);
          setError(data.error || 'Error al registrar');
          return;
        }

        setStep(5);
        setTimeout(() => { window.location.href = '/feed'; }, 2000);

      } catch {
        setStep(3);
        setProgress(0);
        setError('No se pudo conectar con el servidor');
      }
    }, 3000);
  };

  const pwReqs = [
    { label: "mínimo 8 caracteres",  ok: password.length >= 8 },
    { label: "máximo 14 caracteres", ok: password.length <= 14 && password.length > 0 },
    { label: "una mayúscula",        ok: /[A-Z]/.test(password) },
    { label: "un número",            ok: /[0-9]/.test(password) },
  ];

  return {
    checking, step, inputRef, introText,
    username, setUsername, password, setPassword, confirm, setConfirm,
    error, setError, progress, pwReqs,
    handleUsername, handlePassword, handleConfirm,
  };
}
