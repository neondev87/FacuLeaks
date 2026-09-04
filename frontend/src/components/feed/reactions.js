// ════════════════════════════════════════════════════════════════════════
// MÓDULO: components/feed/reactions.js — configuración de las reacciones
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: es un archivo de CONFIGURACIÓN, no de lógica — una lista que
// dice "estas son las reacciones que existen y qué ícono le corresponde a
// cada una". El `key` de cada una viaja tal cual al backend
// (POST /api/posts/:id/react { tipo }) y tiene que coincidir con el enum
// `post_likes_tipo` de prisma/schema.prisma (LIKE / DISLIKE).
//
// PARA QUÉ SIRVE: para que cambiar el dibujo de una reacción (por ejemplo,
// reemplazar la calavera por otro ícono en el rediseño de Fase 3) sea tocar
// UNA línea acá, no buscar por todo PostCard.js. Para agregar una reacción
// nueva habría que agregarla acá Y en el enum de Prisma (con su migración).
//
// CON QUÉ SE CONECTA:
//   - components/feed/HeartIcon.js y SkullIcon.js → los íconos configurados.
//   - components/feed/PostCard.js → recorre este array para dibujar los
//     botones de reacción de cada post.
// ════════════════════════════════════════════════════════════════════════
import HeartIcon from "./HeartIcon";
import SkullIcon from "./SkullIcon";
export const REACTIONS = [
  { key: "LIKE",    Icon: HeartIcon },
  { key: "DISLIKE", Icon: SkullIcon },
];
