'use client';
// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/PicturesGrid.js — galería de fotos del perfil
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: grilla de 2 columnas con las fotos del usuario (hasta 5 + un
// botón [+] para subir más). Tocar/clickear una foto revela una leyenda
// "Ver imagen" al pie (antes esto dependía de :hover, que en celular no
// existe — ahí un tap simplemente no hacía nada si `canEdit`, bug
// reportado 2026-09-11) — un segundo tap/click sobre esa leyenda abre el
// visor a pantalla completa, que es una GALERÍA: se navega con las
// flechas, el teclado o deslizando el dedo, y se puede eliminar la foto
// que se está viendo sin volver a la grilla.
//
// DIRECCIÓN VISUAL (2026-09-11, pedido explícito de "que sea más
// estético"): la foto es la protagonista, el resto es apenas un susurro —
// controles "fantasma" (sin fondo/borde en reposo, se iluminan recién al
// tocarlos) en vez de botones con caja siempre visibles, y un fundido
// corto al cambiar de foto en vez de un corte seco. En celular los
// controles quedan un poco más visibles de entrada (ahí no hay :hover que
// los revele) y además se puede deslizar.
//
// PARA QUÉ SIRVE: es la sección "Pictures" del perfil, tanto propio como
// ajeno (con `canEdit=false` en el ajeno — ahí no hay botón de eliminar,
// ni en la grilla ni en el visor, pero sí se puede "Ver imagen" y navegar).
//
// CON QUÉ SE CONECTA:
//   - backend: POST /api/perfil/fotos (subir varias), DELETE
//     /api/perfil/fotos/:id (borrar) — perfil.controller.js.
//   - Lo consume: app/perfil/page.js y app/perfil/[id]/page.js, que ya
//     inyectan el keyframe `fadeIn` (KF.fadeIn) que este componente
//     reusa para sus transiciones — no redefine ninguno propio.
// ════════════════════════════════════════════════════════════════════════
import { useState, useRef, useEffect } from 'react';
import { API } from '@/lib/api';
import { HOLO_THEME } from '@/lib/theme';
import TrashGlyph from '@/components/TrashGlyph';

const EyeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ChevronIcon = ({ dir = 'left', size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points={dir === 'left' ? '15 6 9 12 15 18' : '9 6 15 12 9 18'} />
  </svg>
);

const CloseIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" />
  </svg>
);

// Botón "fantasma": invisible/casi invisible en reposo, se ilumina al
// tocarlo. Es el mismo idioma que .chat-back/.bubble-act del chat (ver
// chatStyles.js) — acá va inline porque este componente no tiene su
// propia hoja de estilos inyectada, se apoya en la del perfil.
const ghostBtn = (size, { danger = false, baseOpacity = 0 } = {}) => ({
  width: size, height: size, borderRadius: '50%', border: 'none', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  background: `rgba(${danger ? '255,90,90' : '255,255,255'},${baseOpacity})`,
  color: danger ? 'rgba(255,140,140,.85)' : 'rgba(255,255,255,.72)',
  transition: 'background .15s, color .15s, opacity .15s',
});

const photoSrc = (photo) => photo.url.startsWith('http') ? photo.url : `${API}${photo.url}`;

export default function PicturesGrid({ initialPhotos = [], canEdit = true }) {
  const [photos, setPhotos] = useState(initialPhotos);
  // Foto con la leyenda "Ver imagen" (y el botón de eliminar, si canEdit)
  // revelada -- reemplaza al viejo `hoveredPhotoId`: se activa con hover
  // (PC) O con un click/tap (celular), unificando ambos casos.
  const [activeId, setActiveId] = useState(null);
  // Índice dentro de `visiblePhotos` (no un objeto suelto) -- así el visor
  // puede pasar de una foto a otra sin perder de cuál se trata.
  const [galleryIndex, setGalleryIndex] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const touchStart = useRef(null);

  // Mismo recorte que se ve en la grilla (5 slots) -- navegar sobre TODAS
  // las que trajo el backend mostraría en el visor una foto que no tiene
  // miniatura visible en ningún lado.
  const visiblePhotos = photos.slice(0, 5);
  const galleryPhoto = galleryIndex != null ? visiblePhotos[galleryIndex] : null;

  const goPrev = () => setGalleryIndex(i => (i - 1 + visiblePhotos.length) % visiblePhotos.length);
  const goNext = () => setGalleryIndex(i => (i + 1) % visiblePhotos.length);

  // Cerrar visor con ESC, navegar con las flechas del teclado.
  useEffect(() => {
    if (galleryIndex == null) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') setGalleryIndex(null);
      if (e.key === 'ArrowLeft')  goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [galleryIndex, visiblePhotos.length]);

  // Deslizar para pasar de foto en celular -- umbral bajo para que se
  // sienta liviano, pero exige que el gesto sea más horizontal que
  // vertical (si no, un scroll casual dispararía un cambio de foto).
  const onTouchStart = (e) => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const onTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) (dx < 0 ? goNext : goPrev)();
  };

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
    if (!confirm('¿Eliminar esta foto?')) return false;

    try {
      await fetch(`${API}/api/perfil/fotos/${photoId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      setPhotos(prev => prev.filter(p => p.id !== photoId));
      return true;
    } catch (error) {
      console.error('Error eliminando foto:', error);
      return false;
    }
  };

  // Eliminar la foto que se está examinando en el visor -- después de
  // borrarla, se queda mirando a la que ocupó su lugar (misma posición) o,
  // si era la última, retrocede una; si no queda ninguna, se cierra solo.
  const handleDeleteFromGallery = async () => {
    if (!galleryPhoto) return;
    const ok = await handleDelete(galleryPhoto.id);
    if (!ok) return;
    const remaining = visiblePhotos.length - 1;
    if (remaining <= 0) setGalleryIndex(null);
    else setGalleryIndex(i => Math.min(i, remaining - 1));
  };

  // Mostrar 6 slots: fotos existentes + slots vacíos + botón [+]
  const slots = [...visiblePhotos];
  while (slots.length < 5) slots.push(null);

  // "Paradas" (verticales, ~3:4), 3 por fila (3 arriba + 3 abajo — van
  // hacia la derecha, no hacia abajo). Tamaño FIJO calculado para llenar
  // casi todo el ancho de la tarjeta angosta donde vive esto (perfil,
  // debajo de "Información") sin dejar franja vacía al costado.
  const CELL_W = 72;
  const CELL_H = 94;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${CELL_W}px)`, gap: 6, justifyContent: 'center' }}>
        {slots.map((photo, idx) => (
          <div
            key={photo?.id || `empty-${idx}`}
            style={{
              width: CELL_W,
              height: CELL_H,
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
            onClick={() => { if (photo) setActiveId(id => id === photo.id ? null : photo.id); }}
            onMouseEnter={(e) => {
              if (photo) {
                setActiveId(photo.id);
                e.currentTarget.style.borderColor = HOLO_THEME.hairline;
              }
            }}
            onMouseLeave={(e) => {
              setActiveId(null);
              e.currentTarget.style.borderColor = HOLO_THEME.hairlineSoft;
            }}
          >
            {photo ? (
              <>
                <img
                  src={photoSrc(photo)}
                  alt=""
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                    transition: 'transform .4s cubic-bezier(.2,.7,.3,1)',
                    transform: activeId === photo.id ? 'scale(1.06)' : 'scale(1)',
                  }}
                />

                {/* Leyenda "Ver imagen" -- un degradé al pie (la foto se
                    sigue viendo casi entera) en vez de tapar el cuadrado
                    entero con una caja oscura. Se revela con hover (PC) o
                    con un tap (celular, ver onClick de arriba); un segundo
                    click/tap sobre el degradé abre el visor. */}
                <div
                  onClick={(e) => { if (activeId === photo.id) { e.stopPropagation(); setGalleryIndex(idx); } }}
                  style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    paddingBottom: 7,
                    background: 'linear-gradient(180deg, transparent 55%, rgba(6,6,8,.82) 100%)',
                    opacity: activeId === photo.id ? 1 : 0,
                    transition: 'opacity .18s ease',
                    pointerEvents: activeId === photo.id ? 'auto' : 'none',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Inter',sans-serif", fontSize: 10, color: '#fff', letterSpacing: '.01em' }}>
                    <EyeIcon size={12} /> Ver imagen
                  </span>
                </div>

                {canEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                    title="Eliminar"
                    style={{
                      ...ghostBtn(24, { danger: true, baseOpacity: activeId === photo.id ? 0.16 : 0 }),
                      position: 'absolute', top: 4, right: 4,
                      opacity: activeId === photo.id ? 1 : 0,
                      pointerEvents: activeId === photo.id ? 'auto' : 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,90,90,.4)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,90,90,.16)'; e.currentTarget.style.color = 'rgba(255,140,140,.85)'; }}
                  >
                    <TrashGlyph size={11} />
                  </button>
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
              width: CELL_W,
              height: CELL_H,
              background: uploading ? 'rgba(255,255,255,.03)' : 'transparent',
              border: '2px dashed rgba(255,255,255,.12)',
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 3,
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all .2s',
              color: 'rgba(255,255,255,.2)',
              fontFamily: "'Inter',sans-serif",
              fontSize: 9
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
            <span style={{ fontSize: 18 }}>{uploading ? '...' : '+'}</span>
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

      {/* Visor / galería -- la foto es lo único que llama la atención;
          los controles son "fantasma" (recién se iluminan al tocarlos) y
          quedan agrupados, no repartidos por toda la pantalla. */}
      {galleryPhoto && (
        <div
          onClick={() => setGalleryIndex(null)}
          style={{
            position: 'fixed', inset: 0, background: '#000', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', animation: 'fadeIn .18s ease',
          }}
        >
          <img
            key={galleryPhoto.id}
            src={photoSrc(galleryPhoto)}
            alt=""
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            style={{
              maxWidth: '90vw',
              maxHeight: '86vh',
              objectFit: 'contain',
              cursor: 'default',
              borderRadius: 3,
              boxShadow: '0 24px 70px rgba(0,0,0,.6)',
              animation: 'fadeIn .22s ease',
            }}
          />

          {/* Flechas prev/next -- solo si hay más de una foto. Semi-visibles
              de por sí (no dependen de hover, que en celular no existe). */}
          {visiblePhotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                title="Anterior"
                style={{ ...ghostBtn(44, { baseOpacity: 0 }), position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.5)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0)'; e.currentTarget.style.color = 'rgba(255,255,255,.5)'; }}
              >
                <ChevronIcon dir="left" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                title="Siguiente"
                style={{ ...ghostBtn(44, { baseOpacity: 0 }), position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,.5)' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0)'; e.currentTarget.style.color = 'rgba(255,255,255,.5)'; }}
              >
                <ChevronIcon dir="right" />
              </button>

              {/* Contador, como el "date-pill" del chat: monoespaciado, pill chica */}
              <div style={{ position: 'absolute', bottom: 26, left: '50%', transform: 'translateX(-50%)', fontFamily: "'Space Mono',monospace", fontSize: 11, color: 'rgba(255,255,255,.55)', letterSpacing: '.08em', background: 'rgba(255,255,255,.06)', padding: '5px 14px', borderRadius: 999 }}>
                {galleryIndex + 1} / {visiblePhotos.length}
              </div>
            </>
          )}

          {/* Eliminar (si canEdit) + cerrar, agrupados arriba a la derecha */}
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 6 }}>
            {canEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteFromGallery(); }}
                title="Eliminar esta foto"
                style={{ ...ghostBtn(38, { danger: true, baseOpacity: 0 }) }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,90,90,.22)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,90,90,0)'; e.currentTarget.style.color = 'rgba(255,140,140,.85)'; }}
              >
                <TrashGlyph size={15} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setGalleryIndex(null); }}
              title="Cerrar"
              style={{ ...ghostBtn(38, { baseOpacity: 0 }), color: 'rgba(255,255,255,.55)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0)'; e.currentTarget.style.color = 'rgba(255,255,255,.55)'; }}
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
