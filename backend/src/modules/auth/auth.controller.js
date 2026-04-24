const { registerUser, findUserByGoogleId } = require('./auth.service');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { googleId, email, nombre, username, password } = req.body;
    if (!googleId || !email || !nombre || !username || !password)
      return res.status(400).json({ error: 'Faltan campos requeridos' });

    const user = await registerUser({ googleId, email, nombre, username, password });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

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

const checkUser = async (req, res) => {
  try {
    const { googleId } = req.params;
    const user = await findUserByGoogleId(googleId);
    if (!user) return res.status(404).json({ exists: false });
    return res.json({ exists: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { register, checkUser };