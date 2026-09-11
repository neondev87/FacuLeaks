'use client';
// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/AvatarMenu.js — la foto de perfil (con menú de editar)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: dibuja el avatar circular/cuadrado. Si `canEdit` es true (es tu
// propio perfil), al hacer click abre un menú para cambiar la foto (con
// preview instantáneo antes de que termine de subir), verla en grande, o
// borrarla. Si `canEdit` es false (perfil ajeno), el click solo abre el
// visor de la foto en grande.
//
// PARA QUÉ SIRVE: encapsula TODO lo del avatar en un solo componente
// reusable — perfil propio y perfil público lo usan igual, solo cambia
// `canEdit`.
//
// CON QUÉ SE CONECTA:
//   - backend: PUT /api/perfil/avatar (subir), DELETE /api/perfil/avatar
//     (borrar) — ambos en perfil.controller.js.
//   - `onAvatarChange` → función que le pasa el padre para enterarse del
//     cambio y actualizar su propio estado (no guarda estado global).
//   - Lo consume: app/perfil/page.js y app/perfil/[id]/page.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react';
import { API } from '@/lib/api';
import { HOLO_THEME } from '@/lib/theme';
import TrashGlyph from '@/components/TrashGlyph';

// Íconos de línea del menú del avatar (cambiar / ver). El de eliminar es el
// TrashGlyph compartido de toda la app.
const CameraIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8a2 2 0 0 1 2-2h1.2l1-1.6A1 1 0 0 1 10 4h4a1 1 0 0 1 .85.4L15.8 6H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
    <circle cx="12" cy="12.5" r="3.2" />
  </svg>
);
const EyeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function AvatarMenu({ currentAvatar, canEdit = true, onAvatarChange, onViewClick, size, className, escudoUrl = null }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [menuOpen]);

  // Cerrar lightbox con ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && lightbox) setLightbox(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMenuOpen(false);

    // Preview inmediato
    const previewUrl = URL.createObjectURL(file);
    if (onAvatarChange) onAvatarChange(previewUrl);

    // Upload real
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API}/api/perfil/avatar`, {
        method: 'PUT',
        body: formData,
        credentials: 'include'
      });

      const data = await res.json();
      if (data.ok && data.url) {
        if (onAvatarChange) onAvatarChange(data.url);
      }
    } catch (error) {
      console.error('Error subiendo avatar:', error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar foto de perfil?')) {
      setMenuOpen(false);
      return;
    }

    try {
      await fetch(`${API}/api/perfil/avatar`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (onAvatarChange) onAvatarChange(null);
      setMenuOpen(false);
    } catch (error) {
      console.error('Error eliminando avatar:', error);
    }
  };

  const handleView = () => {
    setMenuOpen(false);
    if (onViewClick) {
      onViewClick();
    } else {
      setLightbox(true);
    }
  };

  const avatarUrl = currentAvatar
    ? (currentAvatar.startsWith('http') ? currentAvatar : `${API}${currentAvatar}`)
    : null;

  return (
    <>
      {/* El brillo "chrome aero" vive SOLO acá — es el único recuadro de la
          app que lo lleva ("el rectángulo de perfil"), a propósito no está
          en ningún avatar chico (composer del muro, posts, comentarios). */}
      <style>{`
        .avatar-frame::after {
          content:''; position:absolute; inset:0;
          background: linear-gradient(120deg, transparent 30%, rgba(255,255,255,.3) 45%, transparent 60%);
          background-size:250% 250%;
          animation: avatarSheen 6s ease-in-out infinite;
          pointer-events:none;
        }
        @keyframes avatarSheen { 0%,100%{background-position:120% 0} 50%{background-position:-20% 100%} }
      `}</style>
      <div ref={menuRef} className={className} style={{ position: 'relative', width: size || '100%', aspectRatio: '1' }}>
        {/* Avatar */}
        <div
          className="avatar-frame"
          onClick={() => canEdit ? setMenuOpen(!menuOpen) : handleView()}
          style={{
            width: '100%',
            height: '100%',
            background: '#1c1c24',
            border: `1px solid ${HOLO_THEME.hairline}`,
            borderRadius: 14,
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
            transition: 'border-color .2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.35)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = HOLO_THEME.hairline; }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              // fill = se estira para ocupar el recuadro entero, sin barras ni
              // recorte (mismo criterio que el avatar guardado en el backend).
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Space Mono',monospace",
              fontSize: 8,
              color: 'rgba(255,255,255,.07)',
              lineHeight: 1.3,
              textAlign: 'center',
              whiteSpace: 'pre',
              userSelect: 'none'
            }}>
              {"  ░▒▒▒▒▒░\n ▒██████▒\n▒████████▒\n▒██▒▒▒██▒\n ▒██████▒\n  ░▒▒▒▒░"}
            </div>
          )}

          {/* Escudo de facultad — misma idea que components/feed/AvatarBadge.js,
              adaptado al marco cuadrado: esquina superior-izquierda, en % del
              contenedor para escalar igual con size fijo o con 100%. */}
          {escudoUrl && (
            <div style={{
              position: 'absolute', top: '-4%', left: '-4%',
              width: '22%', aspectRatio: '1',
              backgroundImage: `url(${escudoUrl})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.7))', zIndex: 2,
            }} />
          )}

          {/* Overlay de uploading */}
          {uploading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Inter',sans-serif",
              fontSize: 11,
              color: '#e8e4d9'
            }}>
              subiendo...
            </div>
          )}
        </div>

        {/* Menú contextual */}
        {menuOpen && canEdit && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            background: HOLO_THEME.panel,
            border: `1px solid ${HOLO_THEME.hairline}`,
            borderRadius: 12,
            boxShadow: '0 12px 32px -8px rgba(0,0,0,.7)',
            overflow: 'hidden',
            zIndex: 100,
            minWidth: 184,
            padding: 5,
            animation: 'fadeIn .15s ease'
          }}>
            <button
              onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderRadius: 8,
                padding: '9px 11px',
                color: 'rgba(242,240,248,.72)',
                fontFamily: "'Inter',sans-serif",
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background .15s, color .15s',
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = HOLO_THEME.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(242,240,248,.72)'; }}
            >
              <CameraIcon /> Cambiar foto
            </button>

            {avatarUrl && (
              <>
                <button
                  onClick={handleView}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 11px',
                    color: 'rgba(242,240,248,.72)',
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background .15s, color .15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.color = HOLO_THEME.text; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(242,240,248,.72)'; }}
                >
                  <EyeIcon /> Ver foto
                </button>

                <div style={{ height: 1, background: HOLO_THEME.hairlineSoft, margin: '4px 6px' }} />

                <button
                  onClick={handleDelete}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    padding: '9px 11px',
                    color: 'rgba(255,110,110,.75)',
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all .15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,90,90,.09)';
                    e.currentTarget.style.color = 'rgba(255,130,130,.95)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,110,110,.75)';
                  }}
                >
                  <TrashGlyph size={15} /> Eliminar
                </button>
              </>
            )}
          </div>
        )}

        {/* Input oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
      </div>

      {/* Lightbox */}
      {lightbox && avatarUrl && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.95)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            animation: 'fadeIn .2s ease'
          }}
        >
          <img
            src={avatarUrl}
            alt="avatar full"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '92vh',
              objectFit: 'contain',
              cursor: 'default',
              border: '1px solid rgba(255,255,255,.1)'
            }}
          />
          <div
            onClick={() => setLightbox(false)}
            style={{
              position: 'absolute',
              top: 20,
              right: 24,
              color: 'rgba(255,255,255,.4)',
              fontSize: 22,
              cursor: 'pointer',
              transition: 'color .2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.4)'; }}
          >
            ✕
          </div>
        </div>
      )}
    </>
  );
}