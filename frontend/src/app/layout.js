// ════════════════════════════════════════════════════════════════════════
// MÓDULO: app/layout.js — el layout raíz (envuelve TODA la app)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: es el único <html>/<body> de toda la aplicación — Next.js lo
// usa como envoltorio de cualquier página. Acá se cargan las fuentes base
// (Geist, vía next/font) y se envuelve todo en <Providers>, que es quien le
// da a la app el contexto de sesión de NextAuth.
//
// OJO: cada página además inyecta SUS PROPIAS fuentes (Cinzel, Space Mono,
// IBM Plex, etc.) con su propio <style> vía hooks/useInjectedStyles.js —
// Geist de acá no es la tipografía visible de la app, es la que usa Next
// por defecto si algo no especifica fuente.
//
// CON QUÉ SE CONECTA: app/providers.js (SessionProvider) y app/globals.css.
// ════════════════════════════════════════════════════════════════════════
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata = {
  title: "FacuLeaks",
  description: "tu espacio. tu voz.",
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning en html/body: el navegador in-app de
    // WhatsApp (y otros — Instagram, Facebook) mete sus propios atributos
    // en <html>/<body> (ej. `__gcrremoteframetoken`) ANTES de que React
    // hidrate, apenas se abre el link. React compara contra eso y tira
    // "A tree hydrated but some attributes... didn't match" — pantalla roja
    // entera en dev (reportado 2026-09-11 al mandar el link del túnel por
    // WhatsApp). No es un bug nuestro: es la recomendación oficial de React
    // para atributos que mete un tercero (extensiones, traductores,
    // in-app browsers) fuera de nuestro control — solo ignora attrs/texto
    // de ESTE elemento, no tapa mismatches reales más abajo en el árbol.
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}