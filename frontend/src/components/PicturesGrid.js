'use client';
// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/PicturesGrid.js — galería de fotos del perfil
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: grilla de 2 columnas con las fotos del usuario (hasta 5 + un
// botón [+] para subir más). Al pasar el mouse sobre una foto (si
// `canEdit`) aparece el botón de borrar. Click en una foto la abre en
// lightbox.
//
// PARA QUÉ SIRVE: es la sección "Pictures" del perfil, tanto propio como
// ajeno (con `canEdit=false` en el ajeno).
//
// CON QUÉ SE CONECTA:
//   - backend: POST /api/perfil/fotos (subir varias), DELETE
//     /api/perfil/fotos/:id (borrar) — perfil.controller.js.
//   - Lo consume: app/perfil/page.js y app/perfil/[id]/page.js.
// ════════════════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react';
import { API } from '@/lib/api';
import { HOLO_THEME } from '@/lib/theme';
import TrashGlyph from '@/components/TrashGlyph';

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default function PicturesGrid({ userId, initialPhotos = [], canEdit = true }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [hoveredPhotoId, setHoveredPhotoId] = useState(null);
  const fileInputRef = useRef(null);

  // Cerrar lightbox con ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && selectedPhoto) setSelectedPhoto(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedPhoto]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    const formData = new FormData();
    files.forEach(file => formData.append('photos', file));

    try {
      const res = await fetch(`${API}/api/perfil/fotos`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await res.json();
      if (data.photos) {
        setPhotos([...photos, ...data.photos]);
      }
    } catch (error) {
      console.error('Error subiendo fotos:', error);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (photoId) => {
    if (!confirm('¿Eliminar esta foto?')) return;

    try {
      await fetch(`${API}/api/perfil/fotos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      setPhotos(photos.filter(p => p.id !== photoId));
      if (selectedPhoto?.id === photoId) setSelectedPhoto(null);
    } catch (error) {
      console.error('Error eliminando foto:', error);
    }
  };

  // Mostrar 6 slots: fotos existentes + slots vacíos + botón [+]
  const slots = [...photos.slice(0, 5)];
  while (slots.length < 5) slots.push(null);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {slots.map((photo, idx) => (
          <div
            key={photo?.id || `empty-${idx}`}
            style={{
              aspectRatio: '1',
              background: HOLO_THEME.panel,
              border: `1px solid ${HOLO_THEME.hairlineSoft}`,
              borderRadius: 8,
              overflow: 'hidden',
              position: 'relative',
              // solo centrar cuando el slot está vacío (el "·"); con foto, la
              // imagen se posiciona absoluta y llena el cuadrado sin líos de flex
              ...(photo ? {} : { display: 'flex', alignItems: 'center', justifyContent: 'center' }),
              cursor: photo ? 'pointer' : 'default',
              transition: 'border-color .2s'
            }}
            onMouseEnter={(e) => {
              if (photo) {
                setHoveredPhotoId(photo.id);
                e.currentTarget.style.borderColor = HOLO_THEME.hairline;
              }
            }}
            onMouseLeave={(e) => {
              setHoveredPhotoId(null);
              e.currentTarget.style.borderColor = HOLO_THEME.hairlineSoft;
            }}
          >
            {photo ? (
              <>
                <img
                  src={photo.url.startsWith('http') ? photo.url : `${API}${photo.url}`}
                  alt=""
                  onClick={() => !canEdit ? setSelectedPhoto(photo) : null}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                    transition: 'transform .3s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                />

                {/* Overlay con botones (solo si canEdit) */}
                {canEdit && hoveredPhotoId === photo.id && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,.62)',
                      backdropFilter: 'blur(2px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      animation: 'fadeIn .15s ease'
                    }}
                  >
                    <button
                      onClick={() => setSelectedPhoto(photo)}
                      title="Ver"
                      style={{
                        background: 'rgba(255,255,255,.08)',
                        border: '1px solid rgba(255,255,255,.16)',
                        borderRadius: 9,
                        color: 'rgba(242,240,248,.85)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 8,
                        transition: 'all .15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,.16)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,.32)';
                        e.currentTarget.style.color = '#fff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,.08)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,.16)';
                        e.currentTarget.style.color = 'rgba(242,240,248,.85)';
                      }}
                    >
                      <EyeIcon />
                    </button>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      title="Eliminar"
                      style={{
                        background: 'rgba(255,90,90,.1)',
                        border: '1px solid rgba(255,90,90,.28)',
                        borderRadius: 9,
                        color: 'rgba(255,110,110,.85)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 8,
                        transition: 'all .15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,90,90,.2)';
                        e.currentTarget.style.borderColor = 'rgba(255,110,110,.5)';
                        e.currentTarget.style.color = 'rgba(255,135,135,1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,90,90,.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,90,90,.28)';
                        e.currentTarget.style.color = 'rgba(255,110,110,.85)';
                      }}
                    >
                      <TrashGlyph size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,.07)' }}>·</span>
            )}
          </div>
        ))}

        {/* Botón [+] para subir (solo si canEdit) */}
        {canEdit && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              aspectRatio: '1',
              background: uploading ? 'rgba(255,255,255,.03)' : 'transparent',
              border: '2px dashed rgba(255,255,255,.12)',
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 4,
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all .2s',
              color: 'rgba(255,255,255,.2)',
              fontFamily: "'Inter',sans-serif",
              fontSize: 11
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,.25)';
                e.currentTarget.style.color = 'rgba(255,255,255,.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)';
              e.currentTarget.style.color = 'rgba(255,255,255,.2)';
            }}
          >
            <span style={{ fontSize: 24 }}>{uploading ? '...' : '+'}</span>
            {uploading && <span>subiendo</span>}
          </button>
        )}
      </div>

      {/* Input oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleUpload}
        style={{ display: 'none' }}
      />

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
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
            src={selectedPhoto.url.startsWith('http') ? selectedPhoto.url : `${API}${selectedPhoto.url}`}
            alt=""
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
            onClick={() => setSelectedPhoto(null)}
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