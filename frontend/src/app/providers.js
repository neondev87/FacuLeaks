"use client";
// MÓDULO: app/providers.js
// Envuelve toda la app en el SessionProvider de NextAuth — es lo que hace
// posible que CUALQUIER componente use el hook `useSession()` para saber
// si hay alguien logueado y quién es. Se usa desde app/layout.js.
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}