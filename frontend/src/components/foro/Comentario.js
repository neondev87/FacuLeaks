"use client";

import { useRouter } from "next/navigation";
import { avatarSrc } from "@/lib/api";
import TrashGlyph from "@/components/TrashGlyph";

// MÓDULO: components/foro/Comentario.js — un comentario del foro
// Sin título — solo avatar, autor, hora y el texto. El botón de borrar
// aparece si `canDelete` (autor del comentario, o admin). El ícono es el
// TrashGlyph compartido de toda la app. Lo usa app/foro/page.js.
export default function Comentario({ c, canDelete, onDelete }) {
  const router = useRouter();
  const autor = c.autor || {};
  const src = avatarSrc(autor.imagen);
  const hora = c.creadoEn
    ? new Date(c.creadoEn).toLocaleString("es-MX", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })
    : "";

  return (
    <div className="fcm">
      <div
        className="fcm__av"
        onClick={() => autor.id && router.push(`/perfil/${autor.id}`)}
        style={{ ...(src ? { backgroundImage: `url(${src})` } : {}), cursor: autor.id ? "pointer" : "default" }}
      >
        {!src && "◈"}
      </div>
      <div className="fcm__bd">
        <div className="fcm__hd">
          <span className="fcm__u">{autor.username || "unknown"}</span>
          <span className="fcm__ti">{hora}</span>
          {canDelete && (
            <button className="fcm__del" title="Eliminar comentario" onClick={() => onDelete(c.id)}>
              <TrashGlyph size={13} />
            </button>
          )}
        </div>
        <div className="fcm__tx">{c.contenido}</div>
      </div>
    </div>
  );
}
