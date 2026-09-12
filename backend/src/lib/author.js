// ════════════════════════════════════════════════════════════════════════
// MÓDULO: lib/author.js — selección + aplanado del autor de un post/comentario
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: `AUTHOR_SELECT` es el `select` de Prisma para `users` que usan
// posts.controller.js y perfil.controller.js en cada lugar donde se trae el
// autor de un post/comentario/compartido — junto con los campos de siempre
// (username, nombre, imagen, facultad) trae `user_profiles.mostrarNombreCompleto`
// (2026-09-11), la preferencia de ESA persona de mostrar su nombre completo o
// solo su @usuario. `flattenAuthor()` aplana ese campo anidado a
// `autor.mostrarNombreCompleto` (default true si nunca configuró perfil) para
// que el frontend no tenga que saber que viene de otra tabla — ver
// frontend/src/lib/displayName.js, que es quien decide qué mostrar con esto.
// Si la preferencia es `false`, `nombre` se saca del todo de la respuesta
// (no solo se deja de mostrar en el cliente) — si no, elegir "ocultar mi
// nombre" no ocultaba nada de verdad: cualquiera con Network/DevTools lo
// veía igual en la respuesta de la API.
//
// PARA QUÉ SIRVE: antes cada `users: { select: {...} }` de posts/perfil traía
// SOLO username/nombre/imagen/facultad, así que el Muro no tenía forma de
// saber si el autor de un post eligió @usuario — siempre mostraba lo mismo,
// sin importar esa preferencia.
// ════════════════════════════════════════════════════════════════════════
const AUTHOR_SELECT = {
  id: true, username: true, nombre: true, imagen: true, facultad: true,
  user_profiles: { select: { mostrarNombreCompleto: true } },
};

const flattenAuthor = (u) => {
  if (!u) return u;
  const { user_profiles, nombre, ...rest } = u;
  const mostrarNombreCompleto = user_profiles?.mostrarNombreCompleto ?? true;
  return { ...rest, nombre: mostrarNombreCompleto ? nombre : null, mostrarNombreCompleto };
};

module.exports = { AUTHOR_SELECT, flattenAuthor };
