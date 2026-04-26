const fs = require('fs');

// Magic bytes de cada formato — defensa real contra extensiones falsas
const MAGIC = {
  jpg:  [0xFF, 0xD8, 0xFF],
  png:  [0x89, 0x50, 0x4E, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF
  gif:  [0x47, 0x49, 0x46],
  pdf:  [0x25, 0x50, 0x44, 0x46], // %PDF
};

const verificarMagicBytes = (filePath, tipo) => {
  const buffer = Buffer.alloc(8);
  const fd     = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);

  const bytes = [...buffer];

  if (tipo === 'imagen') {
    return (
      MAGIC.jpg.every( (b, i) => bytes[i] === b) ||
      MAGIC.png.every( (b, i) => bytes[i] === b) ||
      MAGIC.webp.every((b, i) => bytes[i] === b) ||
      MAGIC.gif.every( (b, i) => bytes[i] === b)
    );
  }
  if (tipo === 'pdf') {
    return MAGIC.pdf.every((b, i) => bytes[i] === b);
  }
  // DOC/DOCX — firma OLE2 o ZIP
  const ole  = [0xD0, 0xCF, 0x11, 0xE0];
  const zip  = [0x50, 0x4B, 0x03, 0x04];
  return ole.every((b, i) => bytes[i] === b) || zip.every((b, i) => bytes[i] === b);
};

// Sanitizar URL — solo http/https, sin javascript: ni data:
const sanitizarUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    // Bloquear IPs locales
    const host = parsed.hostname;
    if (
      host === 'localhost' ||
      host.startsWith('127.') ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host === '0.0.0.0'
    ) return null;
    return parsed.href;
  } catch {
    return null;
  }
};

// Sanitizar texto para prevenir XSS en títulos/nombres de archivo
const sanitizarTexto = (str = '') =>
  str.replace(/[<>"'`]/g, '').slice(0, 255);

module.exports = { verificarMagicBytes, sanitizarUrl, sanitizarTexto };