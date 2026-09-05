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
//   - components/feed/StarIcon.js y MarkerIcon.js → los íconos configurados
//     (rediseño Fase 3 — reemplazan a HeartIcon/SkullIcon, el corazón y la
//     calavera pixel de antes).
//   - components/feed/PostCard.js → recorre este array para dibujar los
//     botones de reacción de cada post.
// ════════════════════════════════════════════════════════════════════════
import StarIcon from "./StarIcon";
import MarkerIcon from "./MarkerIcon";
export const REACTIONS = [
  { key: "LIKE",    Icon: StarIcon },
  { key: "DISLIKE", Icon: MarkerIcon },
];
