// ════════════════════════════════════════════════════════════════════════
// MÓDULO: config/db.js — conexión a la base de datos
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   Crea UNA sola instancia de PrismaClient — el "traductor" que convierte
//   código JavaScript en consultas SQL contra MySQL — y la exporta.
//
// PARA QUÉ SIRVE:
//   Evita que cada archivo abra su propia conexión a la base de datos.
//   Prisma internamente maneja un pool de conexiones; si cada controller
//   hiciera `new PrismaClient()` por su cuenta, se agotarían las conexiones
//   disponibles de MySQL muy rápido. Con este patrón ("singleton"), TODO
//   el backend comparte una sola instancia.
//
// CON QUÉ SE CONECTA:
//   - MySQL: la URL de conexión viene de la variable DATABASE_URL en
//     backend/.env (usuario, password, host, puerto y nombre de la BD).
//   - prisma/schema.prisma: ahí están definidos los 13 modelos (tablas) que
//     Prisma usa para generar los métodos que se llaman desde este cliente
//     (ej. prisma.users.findUnique, prisma.posts.create, etc.).
//   - TODOS los *.controller.js del backend importan este archivo con
//     `const prisma = require('../../config/db')` para hablar con la BD.
// ════════════════════════════════════════════════════════════════════════
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = prisma;