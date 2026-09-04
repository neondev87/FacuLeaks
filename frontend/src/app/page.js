// MÓDULO: app/page.js — la ruta "/"
// No hay landing propia: cualquiera que entre a la raíz del sitio se manda
// directo a /auth (el login). Si algún día se quiere una landing real, es
// acá donde se reemplazaría el redirect.
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/auth");
}