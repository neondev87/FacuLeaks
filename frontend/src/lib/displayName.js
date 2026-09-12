// MÓDULO: lib/displayName.js
// Qué nombre mostrar para un autor (post, comentario, "compartido por...")
// respetando SU preferencia (Editar perfil › "Nombre a mostrar"): si eligió
// @usuario (mostrarNombreCompleto === false) se muestra el username, si no
// (default true, o si el campo ni vino) se muestra el nombre completo.
// Requiere que el objeto traiga `mostrarNombreCompleto` — lo aplana
// backend/src/lib/author.js en cada autor de post/comentario.
export const displayName = (autor) => {
  if (!autor) return "";
  if (autor.mostrarNombreCompleto === false) return autor.username || "";
  return autor.nombre || autor.username || "";
};
