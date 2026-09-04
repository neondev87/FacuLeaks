// ════════════════════════════════════════════════════════════════════════
// MÓDULO: amigos/amigos.controller.js — sistema de amistad
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   La tabla `amistades` guarda UNA fila por par de usuarios, con un
//   `estado` (PENDIENTE / ACEPTADO / RECHAZADO / BLOQUEADO). No hay tabla
//   separada de "solicitudes" — es la misma fila que cambia de estado:
//   - enviarSolicitud() crea la fila en PENDIENTE.
//   - aceptarSolicitud() la pasa a ACEPTADO (solo puede hacerlo quien la recibió).
//   - rechazarSolicitud() la pasa a RECHAZADO.
//   - eliminarAmistad() borra la fila entera.
//   - getAmigos() junta todo y lo separa en 3 listas para el frontend:
//     amigos (ACEPTADO), recibidas (PENDIENTE que me mandaron) y enviadas
//     (PENDIENTE que yo mandé).
//   - buscarUsuarios() busca por username y le agrega a cada resultado el
//     estado de amistad actual con vos (para mostrar el botón correcto:
//     "agregar", "pendiente", etc.).
//
// PARA QUÉ SIRVE: es la base de "quién es amigo de quién" que usan el
// feed (pestaña SIGUIENDO), el chat (lista de conversaciones) y el perfil.
//
// CON QUÉ SE CONECTA:
//   - config/db.js (Prisma) → tabla amistades.
//   - Frontend: app/amigos/page.js llama a estos endpoints directo (sin hook
//     propio, es de los pocos que quedó sin extraer a un hook en Fase 2).
// ════════════════════════════════════════════════════════════════════════
const prisma = require('../../config/db');

const getAmigos = async (req, res) => {
  try {
    const userId = req.userId;

    const amistades = await prisma.amistades.findMany({
      where: {
        OR: [{ solicitanteId: userId }, { receptorId: userId }]
      },
      include: {
        users_amistades_solicitanteIdTousers: { select: { id: true, username: true, nombre: true } },
        users_amistades_receptorIdTousers:    { select: { id: true, username: true, nombre: true } },
      }
    });

    const amigos = amistades
      .filter(a => a.estado === 'ACEPTADO')
      .map(a => ({
        amistadId: a.id,
        user: a.solicitanteId === userId
          ? a.users_amistades_receptorIdTousers
          : a.users_amistades_solicitanteIdTousers
      }));

    const recibidas = amistades
      .filter(a => a.estado === 'PENDIENTE' && a.receptorId === userId)
      .map(a => ({
        amistadId: a.id,
        user: a.users_amistades_solicitanteIdTousers
      }));

    const enviadas = amistades
      .filter(a => a.estado === 'PENDIENTE' && a.solicitanteId === userId)
      .map(a => ({
        amistadId: a.id,
        user: a.users_amistades_receptorIdTousers
      }));

    res.json({ amigos, recibidas, enviadas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener amigos' });
  }
};

const buscarUsuarios = async (req, res) => {
  try {
    const userId = req.userId;
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ usuarios: [] });

    const usuarios = await prisma.users.findMany({
      where: {
        username: { contains: q },
        id: { not: userId },
        activo: true,
      },
      select: { id: true, username: true, nombre: true },
      take: 10,
    });

    // Agregar estado de amistad para cada resultado
    const resultados = await Promise.all(usuarios.map(async (u) => {
      const amistad = await prisma.amistades.findFirst({
        where: {
          OR: [
            { solicitanteId: userId, receptorId: u.id },
            { solicitanteId: u.id,   receptorId: userId },
          ]
        }
      });
      return {
        ...u,
        estadoAmistad: amistad?.estado || null,
        amistadId: amistad?.id || null,
        esSolicitante: amistad?.solicitanteId === userId,
      };
    }));

    res.json({ usuarios: resultados });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al buscar' });
  }
};

const enviarSolicitud = async (req, res) => {
  try {
    const solicitanteId = req.userId;
    const receptorId    = parseInt(req.params.userId);

    const existe = await prisma.amistades.findFirst({
      where: {
        OR: [
          { solicitanteId, receptorId },
          { solicitanteId: receptorId, receptorId: solicitanteId },
        ]
      }
    });
    if (existe) return res.status(409).json({ error: 'Ya existe una relación' });

    const amistad = await prisma.amistades.create({
      data: { solicitanteId, receptorId }
    });
    res.status(201).json({ amistad });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar solicitud' });
  }
};

const aceptarSolicitud = async (req, res) => {
  try {
    const userId     = req.userId;
    const amistadId  = parseInt(req.params.amistadId);

    const amistad = await prisma.amistades.findUnique({ where: { id: amistadId } });
    if (!amistad || amistad.receptorId !== userId)
      return res.status(403).json({ error: 'No autorizado' });

    const updated = await prisma.amistades.update({
      where: { id: amistadId },
      data:  { estado: 'ACEPTADO' }
    });
    res.json({ amistad: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al aceptar' });
  }
};

const rechazarSolicitud = async (req, res) => {
  try {
    const userId    = req.userId;
    const amistadId = parseInt(req.params.amistadId);

    const amistad = await prisma.amistades.findUnique({ where: { id: amistadId } });
    if (!amistad || amistad.receptorId !== userId)
      return res.status(403).json({ error: 'No autorizado' });

    await prisma.amistades.update({
      where: { id: amistadId },
      data:  { estado: 'RECHAZADO' }
    });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al rechazar' });
  }
};

const eliminarAmistad = async (req, res) => {
  try {
    const userId    = req.userId;
    const amistadId = parseInt(req.params.amistadId);

    const amistad = await prisma.amistades.findUnique({ where: { id: amistadId } });
    if (!amistad || (amistad.solicitanteId !== userId && amistad.receptorId !== userId))
      return res.status(403).json({ error: 'No autorizado' });

    await prisma.amistades.delete({ where: { id: amistadId } });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar' });
  }
};

module.exports = { getAmigos, buscarUsuarios, enviarSolicitud, aceptarSolicitud, rechazarSolicitud, eliminarAmistad };