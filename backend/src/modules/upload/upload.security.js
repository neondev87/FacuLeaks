// ════════════════════════════════════════════════════════════════════════
// MÓDULO: upload/upload.security.js — las validaciones de seguridad de archivos
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE (son 4 funciones puras, sin tocar la BD ni el request):
//   - verificarMagicBytes(): abre el archivo y mira sus primeros bytes
//     REALES. Cada formato de archivo empieza con una "firma" fija (ej. un
//     PNG siempre arranca con 0x89 0x50 0x4E 0x47) — esto es indetectable
//     por la extensión o el mimetype que declara el navegador, así que es
//     la única forma confiable de saber "esto es realmente una imagen".
//   - esHostInterno(): dice si un hostname/IP apunta a la red interna
//     (localhost, 127.0.0.1, 192.168.x.x, la IP de metadata de la nube, etc).
//   - sanitizarUrl(): solo deja pasar URLs http/https que NO apunten a la
//     red interna — esto es lo que evita un ataque de tipo SSRF (Server-Side
//     Request Forgery: engañar al servidor para que le pegue a SU PROPIA
//     red interna en vez de a internet, usando el feature de "importar URL").
//   - sanitizarTexto(): saca caracteres peligrosos de un texto (para
//     nombres de archivo o títulos) y lo corta a 255 caracteres.
//
// PARA QUÉ SIRVE: es la caja de herramientas de seguridad para archivos y
// URLs — ningún archivo ni URL externa se acepta en la app sin pasar por acá.
//
// CON QUÉ SE CONECTA: lo importan upload.controller.js, perfil.controller.js
// y chat.controller.js — cualquier módulo que reciba un archivo del usuario.
// ════════════════════════════════════════════════════════════════════════
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

// ── Anti-SSRF: ¿el host apunta a una red interna / loopback / link-local? ──
const esHostInterno = (hostname) => {
  const host = String(hostname).toLowerCase().replace(/^\[|\]$/g, '');

  // Nombres reservados / metadata de cloud
  if (
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host === '::' ||
    host === '::1' ||
    host.endsWith('.localhost') ||
    host.endsWith('.internal') ||
    host.endsWith('.local') ||
    host === 'metadata.google.internal'
  ) return true;

  // IPv6 loopback / ULA (fc00::/7) / link-local (fe80::/10)
  if (host.includes(':')) {
    if (host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe8') ||
        host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb')) return true;
    // IPv4 mapeada dentro de IPv6: ::ffff:127.0.0.1
    const v4 = host.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (v4) return esHostInterno(v4[1]);
    return false;
  }

  // IPv4 en notación decimal punteada
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10) return true;                          // 10.0.0.0/8
    if (a === 127) return true;                         // 127.0.0.0/8
    if (a === 0) return true;                           // 0.0.0.0/8
    if (a === 169 && b === 254) return true;            // 169.254.0.0/16 (link-local / metadata)
    if (a === 192 && b === 168) return true;            // 192.168.0.0/16
    if (a === 172 && b >= 16 && b <= 31) return true;   // 172.16.0.0/12
    if (a === 100 && b >= 64 && b <= 127) return true;  // 100.64.0.0/10 (CGNAT)
    return false;
  }

  // IPv4 en formato no punteado (decimal/octal/hex) → sospechoso, bloquear
  if (/^(0x[0-9a-f]+|\d+)$/i.test(host)) return true;

  return false;
};

// Sanitizar URL — solo http/https, sin apuntar a redes internas
const sanitizarUrl = (url) => {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (esHostInterno(parsed.hostname)) return null;
    return parsed.href;
  } catch {
    return null;
  }
};

// Sanitizar texto para prevenir XSS en títulos/nombres de archivo
const sanitizarTexto = (str = '') =>
  str.replace(/[<>"'`]/g, '').slice(0, 255);

module.exports = { verificarMagicBytes, sanitizarUrl, sanitizarTexto, esHostInterno };
