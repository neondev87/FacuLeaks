// ════════════════════════════════════════════════════════════════════════
// MÓDULO: foro/foro.controller.js — el foro (canales + temas del admin + comentarios)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   - Canales: tabla forum_canales. Los CREA y BORRA solo el admin (rol
//     ADMIN o el email de ADMIN_EMAIL). Cualquiera los lista. Borrar un canal
//     arrastra en cascada sus temas y comentarios.
//   - Temas: los crea SOLO el admin, dentro de un canal. Cualquiera los lista.
//   - Comentarios: cualquier usuario logueado comenta un tema. Sin título,
//     solo contenido. totalComentarios se recuenta en cada alta/baja.
//   - GET /permisos → le dice al frontend si el que mira puede administrar
//     (crear canales / temas).
//
// CON QUÉ SE CONECTA:
//   - config/db.js (Prisma) → forum_canales, forum_temas, forum_comentarios.
//   - req.io (Socket.io) → foro:canal(:deleted), foro:tema(:deleted),
//     foro:comentario(:deleted) (tiempo real, igual que muro/chat).
//   - Frontend: hooks/useForo.js.
// ════════════════════════════════════════════════════════════════════════
const prisma = require('../../config/db');

// ¿El usuario puede administrar el foro? rol ADMIN, o su email == ADMIN_EMAIL.
const esAdmin = async (userId) => {
  const u = await prisma.users.findUnique({
    where: { id: userId },
    select: { rol: true, email: true },
  });
  if (!u) return false;
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  return u.rol === 'ADMIN' || (adminEmail && u.email.toLowerCase() === adminEmail);
};

const autorSelect = { id: true, username: true, nombre: true, imagen: true, facultad: true };

// "Diseño Web 2" -> "diseno-web-2". Sin acentos, sin símbolos, sin espacios.
const slugify = (s) =>
  String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // saca los acentos combinados
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

// ── GET /api/foro/permisos ──
const getPermisos = async (req, res) => {
  try {
    res.json({ puedeCrearTema: await esAdmin(req.userId) });
  } catch (err) {
    console.error('getPermisos error:', err.message);
    res.status(500).json({ error: 'Error' });
  }
};

// ── GET /api/foro/canales ──
const listCanales = async (req, res) => {
  try {
    const canales = await prisma.forum_canales.findMany({
      orderBy: [{ orden: 'asc' }, { id: 'asc' }],
      select: { id: true, slug: true, nombre: true, orden: true },
    });
    res.json({ canales });
  } catch (err) {
    console.error('listCanales error:', err.message);
    res.status(500).json({ error: 'Error al obtener canales' });
  }
};

// ── POST /api/foro/canales   body: { nombre }   — SOLO admin ──
const crearCanal = async (req, res) => {
  try {
    if (!(await esAdmin(req.userId))) return res.status(403).json({ error: 'Solo el admin puede crear canales' });

    const nombre = String(req.body?.nombre || '').trim().replace(/^#\s*/, '');
    if (!nombre) return res.status(400).json({ error: 'El canal necesita un nombre' });
    if (nombre.length > 40) return res.status(400).json({ error: 'Nombre demasiado largo (máx. 40)' });

    const slug = slugify(nombre);
    if (!slug) return res.status(400).json({ error: 'Nombre inválido' });

    const existe = await prisma.forum_canales.findUnique({ where: { slug }, select: { id: true } });
    if (existe) return res.status(409).json({ error: 'Ya existe un canal con ese nombre' });

    const ultimo = await prisma.forum_canales.findFirst({ orderBy: { orden: 'desc' }, select: { orden: true } });
    const canal = await prisma.forum_canales.create({
      data: { slug, nombre, orden: (ultimo?.orden ?? -1) + 1 },
      select: { id: true, slug: true, nombre: true, orden: true },
    });
    req.io?.emit('foro:canal', canal);
    res.status(201).json({ canal });
  } catch (err) {
    console.error('crearCanal error:', err.message);
    res.status(500).json({ error: 'Error al crear el canal' });
  }
};

// ── DELETE /api/foro/canales/:id   — SOLO admin ──
const borrarCanal = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    if (!(await esAdmin(req.userId))) return res.status(403).json({ error: 'Solo el admin puede borrar canales' });

    const canal = await prisma.forum_canales.findUnique({ where: { id }, select: { id: true } });
    if (!canal) return res.status(404).json({ error: 'Canal no encontrado' });

    await prisma.forum_canales.delete({ where: { id } }); // cascade: temas + comentarios
    req.io?.emit('foro:canal:deleted', { id });
    res.json({ ok: true });
  } catch (err) {
    console.error('borrarCanal error:', err.message);
    res.status(500).json({ error: 'Error al eliminar el canal' });
  }
};

// ── GET /api/foro/temas?canal=<canalId> ──
const listTemas = async (req, res) => {
  const canalId = parseInt(req.query.canal, 10);
  if (!Number.isInteger(canalId)) return res.status(400).json({ error: 'Canal inválido' });
  try {
    const temas = await prisma.forum_temas.findMany({
      where: { canalId },
      orderBy: { creadoEn: 'desc' },
      include: { users: { select: autorSelect } },
    });
    res.json({ temas: temas.map(t => ({ ...t, autor: t.users, users: undefined })) });
  } catch (err) {
    console.error('listTemas error:', err.message);
    res.status(500).json({ error: 'Error al obtener temas' });
  }
};

// ── POST /api/foro/temas   body: { canal: <canalId>, titulo }   — SOLO admin ──
const crearTema = async (req, res) => {
  try {
    if (!(await esAdmin(req.userId))) return res.status(403).json({ error: 'Solo el admin puede crear temas' });

    const canalId = parseInt(req.body?.canal, 10);
    const titulo  = String(req.body?.titulo || '').trim();
    if (!Number.isInteger(canalId)) return res.status(400).json({ error: 'Canal inválido' });
    if (!titulo) return res.status(400).json({ error: 'El tema necesita un título' });
    if (titulo.length > 200) return res.status(400).json({ error: 'Título demasiado largo (máx. 200)' });

    const canal = await prisma.forum_canales.findUnique({ where: { id: canalId }, select: { id: true } });
    if (!canal) return res.status(404).json({ error: 'Canal no encontrado' });

    const tema = await prisma.forum_temas.create({
      data: { canalId, titulo, autorId: req.userId },
      include: { users: { select: autorSelect } },
    });
    const payload = { ...tema, autor: tema.users, users: undefined };
    req.io?.emit('foro:tema', payload);
    res.status(201).json({ tema: payload });
  } catch (err) {
    console.error('crearTema error:', err.message);
    res.status(500).json({ error: 'Error al crear el tema' });
  }
};

// ── DELETE /api/foro/temas/:id   — admin, o el autor del tema ──
const borrarTema = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const tema = await prisma.forum_temas.findUnique({ where: { id }, select: { id: true, autorId: true } });
    if (!tema) return res.status(404).json({ error: 'Tema no encontrado' });
    if (tema.autorId !== req.userId && !(await esAdmin(req.userId)))
      return res.status(403).json({ error: 'No autorizado' });

    await prisma.forum_temas.delete({ where: { id } }); // cascade borra sus comentarios
    req.io?.emit('foro:tema:deleted', { id });
    res.json({ ok: true });
  } catch (err) {
    console.error('borrarTema error:', err.message);
    res.status(500).json({ error: 'Error al eliminar el tema' });
  }
};

// ── GET /api/foro/temas/:id/comentarios ──
const listComentarios = async (req, res) => {
  const temaId = parseInt(req.params.id, 10);
  if (!Number.isInteger(temaId)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const comentarios = await prisma.forum_comentarios.findMany({
      where: { temaId },
      orderBy: { creadoEn: 'asc' },
      include: { users: { select: autorSelect } },
    });
    res.json({ comentarios: comentarios.map(c => ({ ...c, autor: c.users, users: undefined })) });
  } catch (err) {
    console.error('listComentarios error:', err.message);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
};

// ── POST /api/foro/temas/:id/comentarios   body: { contenido }   — cualquiera logueado ──
const crearComentario = async (req, res) => {
  const temaId    = parseInt(req.params.id, 10);
  const contenido = String(req.body?.contenido || '').trim();
  if (!Number.isInteger(temaId)) return res.status(400).json({ error: 'ID inválido' });
  if (!contenido) return res.status(400).json({ error: 'Comentario vacío' });
  if (contenido.length > 5000) return res.status(400).json({ error: 'Máximo 5000 caracteres' });

  try {
    const tema = await prisma.forum_temas.findUnique({ where: { id: temaId }, select: { id: true } });
    if (!tema) return res.status(404).json({ error: 'Tema no encontrado' });

    let comentario, total;
    await prisma.$transaction(async (tx) => {
      comentario = await tx.forum_comentarios.create({
        data: { temaId, autorId: req.userId, contenido },
        include: { users: { select: autorSelect } },
      });
      total = await tx.forum_comentarios.count({ where: { temaId } });
      await tx.forum_temas.update({ where: { id: temaId }, data: { totalComentarios: total } });
    });

    const payload = { ...comentario, autor: comentario.users, users: undefined };
    req.io?.emit('foro:comentario', { temaId, totalComentarios: total, comentario: payload });
    res.status(201).json({ comentario: payload, totalComentarios: total });
  } catch (err) {
    console.error('crearComentario error:', err.message);
    res.status(500).json({ error: 'Error al comentar' });
  }
};

// ── DELETE /api/foro/comentarios/:id   — el autor del comentario, o el admin ──
const borrarComentario = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'ID inválido' });
  try {
    const c = await prisma.forum_comentarios.findUnique({ where: { id }, select: { id: true, temaId: true, autorId: true } });
    if (!c) return res.status(404).json({ error: 'Comentario no encontrado' });
    if (c.autorId !== req.userId && !(await esAdmin(req.userId)))
      return res.status(403).json({ error: 'No autorizado' });

    let total;
    await prisma.$transaction(async (tx) => {
      await tx.forum_comentarios.delete({ where: { id } });
      total = await tx.forum_comentarios.count({ where: { temaId: c.temaId } });
      await tx.forum_temas.update({ where: { id: c.temaId }, data: { totalComentarios: total } });
    });

    req.io?.emit('foro:comentario:deleted', { temaId: c.temaId, comentarioId: id, totalComentarios: total });
    res.json({ ok: true, totalComentarios: total });
  } catch (err) {
    console.error('borrarComentario error:', err.message);
    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
};

module.exports = {
  getPermisos,
  listCanales, crearCanal, borrarCanal,
  listTemas, crearTema, borrarTema,
  listComentarios, crearComentario, borrarComentario,
};
