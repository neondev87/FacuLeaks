import HeartIcon from "./HeartIcon";
import SkullIcon from "./SkullIcon";

// ── Config modular de reacciones del feed ──
// El `key` viaja al backend (POST /api/posts/:id/react { tipo }) y coincide con
// el enum `post_likes_tipo` de Prisma. Para cambiar el ícono de una reacción
// (p. ej. calavera → otra cosa) se toca SOLO este archivo: cambiar `Icon`.
// Para agregar / reordenar reacciones, editar el array.
export const REACTIONS = [
  { key: "LIKE",    Icon: HeartIcon },
  { key: "DISLIKE", Icon: SkullIcon },
];
