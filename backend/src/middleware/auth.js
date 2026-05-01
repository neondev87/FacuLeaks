const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  console.log('[AUTH] method:', req.method, '| path:', req.path);
  console.log('[AUTH] cookies:', req.cookies);
  console.log('[AUTH] origin:', req.headers.origin);

  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = { authMiddleware };