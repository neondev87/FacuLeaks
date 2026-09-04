// ════════════════════════════════════════════════════════════════════════
// MÓDULO: auth/auth.service.js — acceso a datos de usuarios (capa BD)
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE: las dos únicas consultas a la BD que necesita el login:
//   - findUserByGoogleId(): busca un usuario por su id de Google.
//   - registerUser(): crea el usuario, revisando antes que el username y el
//     email no estén tomados, y guardando la contraseña con bcrypt
//     (hasheada — nunca en texto plano, aunque el login real es por Google).
//
// PARA QUÉ SIRVE:
//   Separa "hablar con la base de datos" de "manejar la petición HTTP"
//   (eso lo hace auth.controller.js). Así el controller no tiene que saber
//   nada de Prisma, y si mañana cambia cómo se busca un usuario, se toca
//   solo este archivo.
//
// CON QUÉ SE CONECTA:
//   - config/db.js (Prisma) → las consultas reales contra MySQL.
//   - Lo usa ÚNICAMENTE auth.controller.js.
// ════════════════════════════════════════════════════════════════════════
const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');

const findUserByGoogleId = async (googleId) => {
  if (!googleId || typeof googleId !== 'string') return null;
  return prisma.users.findFirst({
    where: { googleId },
    select: { id: true, username: true, email: true, nombre: true, imagen: true, rol: true }
  });
};

const registerUser = async ({ googleId, email, nombre, username, password }) => {
  const existingUsername = await prisma.users.findUnique({ where: { username } });
  if (existingUsername) throw new Error('USERNAME_TAKEN');

  const existingEmail = await prisma.users.findUnique({ where: { email } });
  if (existingEmail) throw new Error('ALREADY_REGISTERED');

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.users.create({
    data: { googleId, email, nombre, username, password: hashedPassword },
    select: { id: true, username: true, email: true, nombre: true, creadoEn: true }
  });

  return user;
};

module.exports = { registerUser, findUserByGoogleId };