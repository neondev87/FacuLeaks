// ════════════════════════════════════════════════════════════════════════
// MÓDULO: lib/cuentas.js — borrado definitivo de cuentas que pidieron irse
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: cuando alguien aprieta "Eliminar cuenta" (perfil.controller.js →
// solicitarEliminacion) no se le borra nada al instante: se le pone
// `users.eliminarEn` = ahora + 24 h. Este módulo es quien, pasado ese plazo,
// borra la cuenta DE VERDAD:
//   1. Junta las rutas de todos los archivos que la persona dejó en
//      uploads/ (avatar, galería, imágenes de sus posts, audios/imágenes de
//      los chats donde participaba).
//   2. Borra la fila de `users` — todas las relaciones son ON DELETE CASCADE,
//      así que se van con ella posts, comentarios, mensajes, notificaciones…
//   3. Borra los archivos. La cascada de la base NO toca el disco, por eso
//      este paso es aparte (y va DESPUÉS: si borrar la fila falla, no se
//      pierden archivos de una cuenta que sigue viva).
//
// Si la persona vuelve a iniciar sesión antes de que venza el plazo,
// auth.controller.js (login) le limpia `eliminarEn` y la cuenta se salva.
//
// CON QUÉ SE CONECTA: server.js llama a iniciarPurgaDeCuentas() al arrancar
// (corre una vez y luego cada hora). Lee/escribe `users` vía config/db.js.
// ════════════════════════════════════════════════════════════════════════
const fs   = require('fs');
const path = require('path');
const prisma = require('../config/db');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
// Solo se borra lo que tenga forma de archivo propio de uploads/imagenes o
// uploads/audios — nunca una ruta armada a partir de un valor raro de la BD.
const RUTA_OK = /^\/uploads\/(imagenes|audios)\/[A-Za-z0-9._-]+$/;

const HORA = 60 * 60 * 1000;

// Rutas de archivos que dependen de esta cuenta y desaparecen con ella.
const juntarArchivos = async (userId) => {
  const [user, fotos, posts, mensajes] = await Promise.all([
    prisma.users.findUnique({ where: { id: userId }, select: { imagen: true } }),
    prisma.user_photos.findMany({ where: { userId }, select: { photoUrl: true } }),
    prisma.posts.findMany({ where: { autorId: userId }, select: { imagen: true } }),
    prisma.messages.findMany({
      where:  { OR: [{ emisorId: userId }, { receptorId: userId }] },
      select: { audioUrl: true, imageUrl: true },
    }),
  ]);
  const rutas = [
    user?.imagen,
    ...fotos.map(f => f.photoUrl),
    ...posts.map(p => p.imagen),
    ...mensajes.flatMap(m => [m.audioUrl, m.imageUrl]),
  ];
  return [...new Set(rutas.filter(r => typeof r === 'string' && RUTA_OK.test(r)))];
};

const borrarArchivos = (rutas) => {
  for (const ruta of rutas) {
    const abs = path.resolve(UPLOADS_DIR, '..', ruta.replace(/^\//, ''));
    if (!abs.startsWith(UPLOADS_DIR + path.sep)) continue;
    try { fs.unlinkSync(abs); } catch (err) { if (err.code !== 'ENOENT') console.error('[cuentas] no se pudo borrar', ruta, err.message); }
  }
};

// Borra TODAS las cuentas cuyo plazo ya venció. Devuelve cuántas.
const purgarCuentasVencidas = async () => {
  const vencidas = await prisma.users.findMany({
    where:  { eliminarEn: { lte: new Date() } },
    select: { id: true, username: true },
  });
  let borradas = 0;
  for (const { id, username } of vencidas) {
    try {
      const archivos = await juntarArchivos(id);
      await prisma.users.delete({ where: { id } });
      borrarArchivos(archivos);
      borradas++;
      console.log(`[cuentas] cuenta eliminada: ${id} (@${username}), ${archivos.length} archivo(s)`);
    } catch (err) {
      console.error('[cuentas] error al eliminar la cuenta', id, err.message);
    }
  }
  return borradas;
};

const iniciarPurgaDeCuentas = () => {
  const correr = () => purgarCuentasVencidas().catch(err => console.error('[cuentas] purga falló:', err.message));
  correr();
  setInterval(correr, HORA).unref();
};

module.exports = { purgarCuentasVencidas, iniciarPurgaDeCuentas };
