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
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}