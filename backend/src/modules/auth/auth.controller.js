// ════════════════════════════════════════════════════════════════════════
// MÓDULO: auth/auth.controller.js — el corazón del login
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   - register(): crea una cuenta nueva en MySQL y le entrega la cookie
//     de sesión de una. NO la llama el navegador directamente (ver nota de
//     seguridad abajo) — la llama frontend/src/app/api/auth/register/route.js,
//     que ya leyó la sesión de NextAuth en el servidor y saca de ahí
//     googleId/email/nombre, igual que login() con /login.
//   - checkUser(): responde "¿este googleId ya tiene cuenta acá?" — lo usa
//     NextAuth (en el frontend) para decidir si mandar al registro o al feed.
//     Ojo: responde SOLO {exists, user:{id, imagen}} — nunca email/nombre,
//     porque esta ruta no pide sesión (cualquiera podría llamarla).
//   - login(): la ÚNICA otra forma de conseguir la cookie de sesión del
//     backend. La llama el propio servidor de Next
//     (frontend/src/app/api/auth/sync-backend/route.js) después de
//     confirmar el login de Google. Por eso exige un header secreto
//     (x-internal-secret) en vez de pedir contraseña: el browser nunca ve
//     ese secreto, así que no puede forjar un login de otro usuario.
//   - setAuthCookie(): firma un JWT con los datos mínimos (id, username) y
//     lo manda como cookie httpOnly (el JS del navegador no puede leerla,
//     protección contra robo de sesión por XSS).
//
// SEGURIDAD (pentest 2026-09-17): register() usaba a confiar en el
// googleId/email/nombre que mandara el BODY de la petición, sin verificar
// nunca que quien llamaba hubiera pasado de verdad por el login de Google
// — cualquiera con curl podía crear una cuenta con identidad inventada y
// sacarse una cookie de sesión válida. Ahora exige el mismo
// x-internal-secret que /login: solo la ruta de Next que ya validó la
// sesión de NextAuth puede llamarlo.
//
// PARA QUÉ SIRVE:
//   Es el único lugar del backend donde se genera la cookie que después
//   valida middleware/auth.js en cada ruta protegida.
//
// CON QUÉ SE CONECTA:
//   - auth.service.js → hace el trabajo pesado contra la base de datos
//     (crear usuario, buscar por googleId).
//   - process.env.JWT_SECRET → firma el token (nunca un valor fijo en código).
//   - process.env.INTERNAL_API_SECRET → el secreto que protege /register y /login.
//   - frontend/src/app/api/auth/register/route.js → llama a POST /register.
//   - frontend/src/app/api/auth/sync-backend/route.js → llama a POST /login.
//   Ninguno de los dos lo llama el browser directo, nunca.
// ════════════════════════════════════════════════════════════════════════
const { registerUser, findUserByGoogleId } = require('./auth.service');
const prisma = require('../../config/db');
const { users_facultad } = require('@prisma/client');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

const FACULTADES_VALIDAS = new Set(Object.values(users_facultad));

// Comparación en tiempo constante para el secreto interno
const timingSafeEq = (a = '', b = '') => {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
};

// Helper para setear la cookie JWT
const setAuthCookie = (res, user) => {
  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d', algorithm: 'HS256' }
  );
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
};

// POST /api/auth/register — llamado SOLO server-to-server desde
// frontend/src/app/api/auth/register/route.js, que ya validó la sesión de
// NextAuth y saca googleId/email/nombre DE AHÍ (no del body que mandaría el
// cliente). Mismo secreto interno y misma comparación timing-safe que
// /login — antes este endpoint confiaba en el googleId/email/nombre que
// mandara quien sea, sin haber pasado nunca por Google (bypass total de
// autenticación, encontrado en pentest del 2026-09-17).
const register = async (req, res) => {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) {
    console.error('[auth] INTERNAL_API_SECRET no configurado — /api/auth/register deshabilitado');
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }
  if (!timingSafeEq(req.get('x-internal-secret'), expected)) {
    return res.status(403).json({ error: 'Prohibido' });
  }

  try {
    const { googleId, email, nombre, username, password, facultad } = req.body;
    if (!googleId || !email || !nombre || !username || !password)
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    if (!facultad || !FACULTADES_VALIDAS.has(facultad))
      return res.status(400).json({ error: 'Elegí tu facultad' });

    const user = await registerUser({ googleId, email, nombre, username, password, facultad });
    setAuthCookie(res, user);
    return res.status(201).json({ user });
  } catch (error) {
    if (error.message === 'USERNAME_TAKEN')
      return res.status(409).json({ error: 'Ese username ya está en uso' });
    if (error.message === 'ALREADY_REGISTERED')
      return res.status(409).json({ error: 'Este correo ya tiene cuenta' });
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/auth/check/:googleId
// Solo expone lo mínimo que necesita el frontend (existencia + dbId + avatar).
// NO devolver email / nombre / rol: esta ruta no requiere sesión.
const checkUser = async (req, res) => {
  try {
    const { googleId } = req.params;
    const user = await findUserByGoogleId(googleId);
    if (!user) return res.status(404).json({ exists: false });
    return res.json({ exists: true, user: { id: user.id, imagen: user.imagen } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/auth/login  — llamado SOLO server-to-server desde el route de Next
// (frontend/src/app/api/auth/sync-backend/route.js), que ya validó la sesión
// de NextAuth. Se protege con un secreto interno compartido: el browser nunca
// lo conoce, así que no puede forjar un login para un googleId ajeno.
// Body: { googleId }
const login = async (req, res) => {
  const expected = process.env.INTERNAL_API_SECRET;
  if (!expected) {
    console.error('[auth] INTERNAL_API_SECRET no configurado — /api/auth/login deshabilitado');
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }
  if (!timingSafeEq(req.get('x-internal-secret'), expected)) {
    return res.status(403).json({ error: 'Prohibido' });
  }

  try {
    const { googleId } = req.body;
    if (!googleId) return res.status(400).json({ error: 'Falta googleId' });

    const user = await findUserByGoogleId(googleId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // Volvió antes de que venciera el día de gracia de "Eliminar cuenta"
    // (lib/cuentas.js) → la cuenta se salva.
    let eliminacionCancelada = false;
    if (user.eliminarEn) {
      await prisma.users.update({ where: { id: user.id }, data: { eliminarEn: null } });
      eliminacionCancelada = true;
    }

    setAuthCookie(res, user);
    return res.json({ ok: true, eliminacionCancelada, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { register, checkUser, login };
