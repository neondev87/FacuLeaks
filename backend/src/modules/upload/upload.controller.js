// ════════════════════════════════════════════════════════════════════════
// MÓDULO: upload/upload.controller.js — procesar archivos subidos
// ════════════════════════════════════════════════════════════════════════
// QUÉ HACE:
//   - uploadImagen(): recibe la imagen que ya guardó multer como archivo
//     temporal, CONFIRMA que de verdad es una imagen (magic bytes, no solo
//     la extensión), y la re-comprime con Sharp a formato WebP (más liviano,
//     y de paso "limpia" cualquier metadata rara del archivo original).
//   - uploadDocumento(): mismo control de magic bytes para PDF/Word.
//   - importarUrl() + fetchSeguro(): cuando alguien pega un link en el
//     composer del muro, esto va a buscar el título y la imagen de vista
//     previa (og:image) — SIN ejecutar el JavaScript del sitio, solo lee el
//     HTML. fetchSeguro() sigue redirecciones A MANO, revalidando cada salto
//     — así una URL "buena" no puede redirigir a `http://localhost` o a una
//     IP interna (ver el porqué en upload.security.js).
//
// PARA QUÉ SIRVE: es el punto único donde cualquier archivo o URL que un
// usuario mete a la app pasa un control real antes de guardarse o usarse.
//
// CON QUÉ SE CONECTA:
//   - upload.security.js → toda la validación real (magic bytes, anti-SSRF).
//   - Se reutiliza desde OTROS módulos, no solo upload/: perfil.controller.js
//     y chat.controller.js usan el mismo patrón (magic bytes + Sharp) para
//     avatar/fotos y para imágenes de chat.
//   - Frontend: components/Uploader.js (el botón "+ imagen" del composer).
// ════════════════════════════════════════════════════════════════════════
const fs    = require('fs');
const path  = require('path');
const sharp = require('sharp');
const crypto = require('crypto');
const { verificarMagicBytes, sanitizarUrl, sanitizarTexto } = require('./upload.security');

const uploadImagen = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

  const tmpPath = req.file.path;

  try {
    // Verificar magic bytes
    if (!verificarMagicBytes(tmpPath, 'imagen')) {
      fs.unlinkSync(tmpPath);
      return res.status(400).json({ error: 'Archivo inválido' });
    }

    const hash    = crypto.randomBytes(16).toString('hex');
    const outName = `${hash}.webp`;
    const outPath = path.join('uploads/imagenes', outName);

    // Comprimir con Sharp → WebP sin pérdida visible
    await sharp(tmpPath)
      .rotate()                    // respetar EXIF orientation
      .resize(1920, 1920, {        // máximo 1920px en cualquier lado
        fit:        'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 82, effort: 6 }) // effort 6 = mejor compresión
      .toFile(outPath);

    fs.unlinkSync(tmpPath); // borrar .tmp

    const url = `/uploads/imagenes/${outName}`;
    res.json({ url, tipo: 'imagen' });

  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    console.error('Error procesando imagen:', err.message);
    res.status(500).json({ error: 'Error procesando imagen' });
  }
};

const uploadDocumento = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

  const filePath = req.file.path;
  const ext      = path.extname(req.file.originalname).toLowerCase();

  try {
    const tipo = ext === '.pdf' ? 'pdf' : 'doc';
    if (!verificarMagicBytes(filePath, tipo)) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Archivo inválido' });
    }

    const nombreOriginal = sanitizarTexto(
      path.basename(req.file.originalname, ext)
    );

    const url = `/uploads/documentos/${path.basename(filePath)}`;
    res.json({ url, tipo: 'documento', nombre: nombreOriginal, ext });

  } catch (err) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error('Error procesando documento:', err.message);
    res.status(500).json({ error: 'Error procesando documento' });
  }
};

// ── fetch siguiendo redirecciones a mano, revalidando cada salto (anti-SSRF) ──
const fetchSeguro = async (urlInicial, { signal } = {}) => {
  let actual = urlInicial;
  for (let i = 0; i < 4; i++) {
    const resp = await fetch(actual, {
      signal,
      headers:  { 'User-Agent': 'FacuLeaks-Bot/1.0' },
      redirect: 'manual',
    });

    if (resp.status >= 300 && resp.status < 400) {
      const location = resp.headers.get('location');
      if (!location) return resp;
      const siguiente = sanitizarUrl(new URL(location, actual).href);
      if (!siguiente) throw new Error('Redirección no permitida');
      actual = siguiente;
      continue;
    }
    return resp;
  }
  throw new Error('Demasiadas redirecciones');
};

const importarUrl = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requerida' });

  const urlLimpia = sanitizarUrl(url);
  if (!urlLimpia) return res.status(400).json({ error: 'URL no permitida' });

  // Obtener metadata básica (título, og:image) sin ejecutar JS
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      response = await fetchSeguro(urlLimpia, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      // Es un archivo directo (imagen, pdf, etc.)
      return res.json({ url: urlLimpia, tipo: 'url_directa', titulo: urlLimpia });
    }

    const html    = await response.text();
    const titulo  = (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || urlLimpia)
      .replace(/\s+/g, ' ').trim().slice(0, 200);
    const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)?.[1] || null;
    const ogDesc  = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1] || null;

    res.json({
      url:      urlLimpia,
      tipo:     'url',
      titulo:   sanitizarTexto(titulo),
      imagen:   ogImage ? sanitizarUrl(ogImage) : null,
      descripcion: ogDesc ? sanitizarTexto(ogDesc) : null,
    });

  } catch (err) {
    res.status(400).json({ error: 'No se pudo acceder a la URL' });
  }
};

module.exports = { uploadImagen, uploadDocumento, importarUrl };
