// ════════════════════════════════════════════════════════════════════════
// MÓDULO: auth/auth.controller.js — el corazón del login
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   - register(): crea una cuenta nueva en MySQL y le entrega la cookie
//     de sesión de una.
//   - checkUser(): responde "¿este googleId ya tiene cuenta acá?" — lo usa
//     NextAuth (en el frontend) para decidir si mandar al registro o al feed.
//     Ojo: responde SOLO {exists, user:{id, imagen}} — nunca email/nombre,
//     porque esta ruta no pide sesión (cualquiera podría llamarla).
//   - login(): la ÚNICA forma de conseguir la cookie de sesión del backend.
//     No la llama el navegador directamente — la llama el propio servidor
//     de Next (frontend/src/app/api/auth/sync-backend/route.js) después de
//     confirmar el login de Google. Por eso exige un header secreto
//     (x-internal-secret) en vez de pedir contraseña: el browser nunca ve
//     ese secreto, así que no puede forjar un login de otro usuario.
//   - setAuthCookie(): firma un JWT con los datos mínimos (id, username) y
//     lo manda como cookie httpOnly (el JS del navegador no puede leerla,
//     protección contra robo de sesión por XSS).
//
// PARA QUÉ SIRVE:
//   Es el único lugar del backend donde se genera la cookie que después
//   valida middleware/auth.js en cada ruta protegida.
//
// CON QUÉ SE CONECTA:
//   - auth.service.js → hace el trabajo pesado contra la base de datos
//     (crear usuario, buscar por googleId).
//   - process.env.JWT_SECRET → firma el token (nunca un valor fijo en código).
//   - process.env.INTERNAL_API_SECRET → el secreto que protege /login.
//   - frontend/src/app/api/auth/sync-backend/route.js → es quien llama a
//     POST /login desde el servidor de Next, nunca el browser.
// ════════════════════════════════════════════════════════════════════════
const { registerUser, findUserByGoogleId } = require('./auth.service');
const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

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

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { googleId, email, nombre, username, password } = req.body;
    if (!googleId || !email || !nombre || !username || !password)
      return res.status(400).json({ error: 'Faltan campos requeridos' });

    const user = await registerUser({ googleId, email, nombre, username, password });
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

    setAuthCookie(res, user);
    return res.json({ ok: true, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { register, checkUser, login };
