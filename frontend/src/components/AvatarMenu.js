'use client';
import { useState, useRef, useEffect } from 'react';

const API = "http://localhost:4000";

export default function AvatarMenu({ currentAvatar, canEdit = true, onAvatarChange, onViewClick }) {
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
      <div ref={menuRef} style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
        {/* Avatar */}
        <div
          onClick={() => canEdit ? setMenuOpen(!menuOpen) : handleView()}
          style={{
            width: '100%',
            height: '100%',
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,.07)',
            overflow: 'hidden',
            cursor: 'pointer',
            position: 'relative',
            transition: 'border-color .2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)'; }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
            marginTop: 6,
            background: '#0a0a0a',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,.8)',
            overflow: 'hidden',
            zIndex: 100,
            minWidth: 180,
            animation: 'fadeIn .15s ease'
          }}>
            <button
              onClick={() => { fileInputRef.current?.click(); setMenuOpen(false); }}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '10px 14px',
                color: 'rgba(255,255,255,.7)',
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 12,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background .15s',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span>📷</span> Cambiar foto
            </button>

            {avatarUrl && (
              <>
                <button
                  onClick={handleView}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '10px 14px',
                    color: 'rgba(255,255,255,.7)',
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background .15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>👁️</span> Ver foto
                </button>

                <div style={{ height: 1, background: 'rgba(255,255,255,.05)', margin: '4px 0' }} />

                <button
                  onClick={handleDelete}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    padding: '10px 14px',
                    color: 'rgba(255,100,100,.6)',
                    fontFamily: "'IBM Plex Mono',monospace",
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all .15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,50,50,.08)';
                    e.currentTarget.style.color = 'rgba(255,120,120,.9)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,100,100,.6)';
                  }}
                >
                  <span>🗑️</span> Eliminar
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