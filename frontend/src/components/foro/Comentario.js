"use client";

import { useRouter } from "next/navigation";
import { avatarSrc } from "@/lib/api";
import { escudoUrl } from "@/lib/facultades";
import TrashGlyph from "@/components/TrashGlyph";

// MÓDULO: components/foro/Comentario.js — un comentario del foro
// Sin título — solo avatar, autor, hora y el texto. El botón de borrar
// aparece si `canDelete` (autor del comentario, o admin). El ícono es el
// TrashGlyph compartido de toda la app. Lo usa app/foro/page.js.
export default function Comentario({ c, canDelete, onDelete }) {
  const router = useRouter();
  const autor = c.autor || {};
  const src = avatarSrc(autor.imagen);
  const escudo = escudoUrl(autor.facultad);
  const hora = c.creadoEn
    ? new Date(c.creadoEn).toLocaleString("es-MX", { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })
    : "";

  return (
    <div className="fcm">
      <div style={{ position:"relative", flexShrink:0 }}>
        <div
          className="fcm__av"
          onClick={() => autor.id && router.push(`/perfil/${autor.id}`)}
          style={{ ...(src ? { backgroundImage: `url(${src})` } : {}), cursor: autor.id ? "pointer" : "default" }}
        >
          {!src && "◈"}
        </div>
        {escudo && (
          <div style={{ position:"absolute", top:-1, left:-1, width:12, height:12, backgroundImage:`url(${escudo})`, backgroundSize:"contain", backgroundPosition:"center", backgroundRepeat:"no-repeat", filter:"drop-shadow(0 1px 2px rgba(0,0,0,.7))" }} />
        )}
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
