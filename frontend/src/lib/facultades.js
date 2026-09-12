// ════════════════════════════════════════════════════════════════════════
// MÓDULO: lib/facultades.js — las 17 facultades de UANL con escudo
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: fuente única de verdad del lado del frontend para el campo
// `users.facultad` — cada `value` es EXACTAMENTE un valor del enum
// `users_facultad` de backend/prisma/schema.prisma (no renombrar sin tocar
// los dos lados). `archivo` apunta a frontend/public/facultades/<archivo>,
// los 17 escudos oficiales ya verificados uno por uno contra el sitio de
// cada facultad (solo `ARTES_VISUALES` es el escudo genérico de la UANL,
// porque esa facultad no tiene uno propio).
//
// PARA QUÉ SIRVE: la usan el selector de facultad del registro
// (app/register/page.js), el de Editar perfil (components/perfil/EditModal.js)
// y `escudoUrl()` — cualquier componente que dibuje un avatar y necesite
// resolver `facultad` → la URL del mini escudo (components/feed/AvatarBadge.js
// y los demás lugares que replican su mismo patrón visual). `siglas` son las
// abreviaturas oficiales de la UANL — se muestran en vez de `nombre` en los
// selectores (registro, editar perfil), a pedido de Erick (2026-09-11): el
// nombre completo ocupaba demasiado espacio. `nombre` se conserva para el
// tooltip (`title=`) de esos mismos botones.
// ════════════════════════════════════════════════════════════════════════

export const FACULTADES = [
  // ── Ciudad Universitaria / San Nicolás (11) ──
  { value: "FIME",                         nombre: "Ingeniería Mecánica y Eléctrica",              siglas: "FIME",    campus: "San Nicolás", archivo: "fime.png" },
  { value: "DERECHO_Y_CRIMINOLOGIA",       nombre: "Derecho y Criminología",                       siglas: "FACDYC",  campus: "San Nicolás", archivo: "derecho-y-criminologia.png" },
  { value: "FACPYA",                       nombre: "Contaduría Pública y Administración",          siglas: "FACPYA",  campus: "San Nicolás", archivo: "facpya.png" },
  { value: "ARQUITECTURA",                 nombre: "Arquitectura",                                 siglas: "FARQ",    campus: "San Nicolás", archivo: "arquitectura.png" },
  { value: "INGENIERIA_CIVIL",             nombre: "Ingeniería Civil",                             siglas: "FIC",     campus: "San Nicolás", archivo: "ingenieria-civil.png" },
  { value: "CIENCIAS_BIOLOGICAS",          nombre: "Ciencias Biológicas",                          siglas: "FCB",     campus: "San Nicolás", archivo: "ciencias-biologicas.png" },
  { value: "CIENCIAS_FISICO_MATEMATICAS",  nombre: "Ciencias Físico Matemáticas",                  siglas: "FCFM",    campus: "San Nicolás", archivo: "ciencias-fisico-matematicas.png" },
  { value: "ORGANIZACION_DEPORTIVA",       nombre: "Organización Deportiva",                       siglas: "FOD",     campus: "San Nicolás", archivo: "organizacion-deportiva.png" },
  { value: "CIENCIAS_QUIMICAS",            nombre: "Ciencias Químicas",                            siglas: "FCQ",     campus: "San Nicolás", archivo: "ciencias-quimicas.png" },
  { value: "FILOSOFIA_Y_LETRAS",           nombre: "Filosofía y Letras",                           siglas: "FFYL",    campus: "San Nicolás", archivo: "filosofia-y-letras.png" },
  { value: "TRABAJO_SOCIAL",               nombre: "Trabajo Social y Desarrollo Humano",           siglas: "FTSYDH",  campus: "San Nicolás", archivo: "trabajo-social.png" },
  // ── Unidad Mederos (6) ──
  { value: "CIENCIAS_DE_LA_COMUNICACION",  nombre: "Ciencias de la Comunicación",                  siglas: "FCC",     campus: "Mederos",     archivo: "ciencias-de-la-comunicacion.png" },
  { value: "MUSICA",                       nombre: "Música",                                       siglas: "FAMUS",   campus: "Mederos",     archivo: "musica.png" },
  { value: "ARTES_ESCENICAS",              nombre: "Artes Escénicas",                              siglas: "FACAE",   campus: "Mederos",     archivo: "artes-escenicas.png" },
  { value: "ARTES_VISUALES",               nombre: "Artes Visuales",                               siglas: "FAV",     campus: "Mederos",     archivo: "artes-visuales.png" },
  { value: "CIENCIAS_POLITICAS_Y_RRI",     nombre: "Ciencias Políticas y Relaciones Internacionales", siglas: "FCPYRI", campus: "Mederos",  archivo: "ciencias-politicas-y-rri.png" },
  { value: "ECONOMIA",                     nombre: "Economía",                                     siglas: "FE",      campus: "Mederos",     archivo: "economia.png" },
];

const BY_VALUE = new Map(FACULTADES.map(f => [f.value, f]));

// facultad (valor del enum, o null/undefined) → URL del escudo, o null si no
// hay facultad asignada. Uso: <AvatarBadge escudoUrl={escudoUrl(user.facultad)} />
export const escudoUrl = (facultad) => {
  const f = facultad && BY_VALUE.get(facultad);
  return f ? `/facultades/${f.archivo}` : null;
};

export const nombreFacultad = (facultad) => BY_VALUE.get(facultad)?.nombre || null;
export const siglasFacultad = (facultad) => BY_VALUE.get(facultad)?.siglas || null;
