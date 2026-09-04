// ════════════════════════════════════════════════════════════════════════
// MÓDULO: middleware/auth.js — el "portero" de las rutas privadas
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   Es una función que Express ejecuta ANTES del controller de cada ruta
//   protegida. Lee la cookie `token` (la puso auth.controller.js al hacer
//   login), verifica que la firma sea válida con la clave secreta del
//   servidor (JWT_SECRET) y, si todo está bien, guarda el id del usuario en
//   `req.userId` para que el controller sepa "quién está pidiendo esto".
//   Si la cookie no existe o la firma no coincide, corta la petición ahí
//   mismo con un 401 — el controller nunca llega a ejecutarse.
//
// PARA QUÉ SIRVE:
//   Es la pieza central de la seguridad del backend. En vez de repetir la
//   validación de sesión en cada controller, se pone UNA vez en la ruta:
//   `router.get('/algo', authMiddleware, miControlador)`.
//
// CON QUÉ SE CONECTA:
//   - Se importa en casi todas las *.routes.js (posts, chat, amigos, perfil,
//     upload, spotify) para proteger sus endpoints.
//   - La cookie que lee la crea `setAuthCookie()` en auth.controller.js.
//   - JWT_SECRET vive en backend/.env — nunca hardcodeado en el código.
// ════════════════════════════════════════════════════════════════════════
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = { authMiddleware };
