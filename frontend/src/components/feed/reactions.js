// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/feed/reactions.js — configuración de las reacciones
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: es un archivo de CONFIGURACIÓN, no de lógica — una lista que
// dice "estas son las reacciones que existen y qué ícono le corresponde a
// cada una". El `key` de cada una viaja tal cual al backend
// (POST /api/posts/:id/react { tipo }) y tiene que coincidir con el enum
// `post_likes_tipo` de prisma/schema.prisma (LIKE / DISLIKE).
//
// PARA QUÉ SIRVE: para que cambiar el dibujo de una reacción sea tocar UNA
// línea acá, no buscar por todo PostCard.js. Para agregar una reacción nueva
// habría que agregarla acá Y en el enum de Prisma (con su migración).
//
// CON QUÉ SE CONECTA:
//   - components/feed/HeartIcon.js y BrokenHeartIcon.js → los íconos
//     configurados (corazón "doble-tap" estilo Instagram para LIKE,
//     corazón partido al medio para DISLIKE).
//   - components/feed/PostCard.js y components/PostCard.js → recorren este
//     array para dibujar los botones de reacción de cada post.
// ════════════════════════════════════════════════════════════════════════
import HeartIcon from "./HeartIcon";
import BrokenHeartIcon from "./BrokenHeartIcon";
export const REACTIONS = [
  { key: "LIKE",    Icon: HeartIcon },
  { key: "DISLIKE", Icon: BrokenHeartIcon },
];
