'use client';
import { useState, useRef, useEffect } from 'react';

const API = "http://localhost:4000";

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {slots.map((photo, idx) => (
          <div
            key={photo?.id || `empty-${idx}`}
            onMouseEnter={() => photo && setHoveredPhotoId(photo.id)}
            onMouseLeave={() => setHoveredPhotoId(null)}
            style={{
              aspectRatio: '1',
              background: '#080808',
              border: '1px solid rgba(255,255,255,.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative',
              cursor: photo ? 'pointer' : 'default',
              transition: 'border-color .2s'
            }}
            onMouseEnter={(e) => {
              if (photo) e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.05)';
            }}
          >
            {photo ? (
              <>
                <img
                  src={photo.url.startsWith('http') ? photo.url : `${API}${photo.url}`}
                  alt=""
                  onClick={() => !canEdit ? setSelectedPhoto(photo) : null}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
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
                      background: 'rgba(0,0,0,.7)',
                      backdropFilter: 'blur(2px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      animation: 'fadeIn .15s ease'
                    }}
                  >
                    <button
                      onClick={() => setSelectedPhoto(photo)}
                      title="Ver"
                      style={{
                        background: 'rgba(255,255,255,.1)',
                        border: '1px solid rgba(255,255,255,.2)',
                        borderRadius: 4,
                        color: '#e8e4d9',
                        cursor: 'pointer',
                        fontSize: 16,
                        padding: '6px 10px',
                        transition: 'all .15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,.2)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,255,255,.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,.2)';
                      }}
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => handleDelete(photo.id)}
                      title="Eliminar"
                      style={{
                        background: 'rgba(255,50,50,.1)',
                        border: '1px solid rgba(255,80,80,.3)',
                        borderRadius: 4,
                        color: 'rgba(255,100,100,.8)',
                        cursor: 'pointer',
                        fontSize: 16,
                        padding: '6px 10px',
                        transition: 'all .15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255,50,50,.2)';
                        e.currentTarget.style.borderColor = 'rgba(255,100,100,.5)';
                        e.currentTarget.style.color = 'rgba(255,120,120,1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255,50,50,.1)';
                        e.currentTarget.style.borderColor = 'rgba(255,80,80,.3)';
                        e.currentTarget.style.color = 'rgba(255,100,100,.8)';
                      }}
                    >
                      🗑️
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