const prisma = require('../../config/db');
const bcrypt = require('bcryptjs');

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

const findUserByGoogleId = async (googleId) => {
  return await prisma.users.findUnique({
    where: { googleId },
    select: { id: true, username: true, email: true, nombre: true, rol: true }
  });
};

module.exports = { registerUser, findUserByGoogleId };