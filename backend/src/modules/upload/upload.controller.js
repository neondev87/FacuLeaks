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

const importarUrl = async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL requerida' });

  const urlLimpia = sanitizarUrl(url);
  if (!urlLimpia) return res.status(400).json({ error: 'URL no permitida' });

  // Obtener metadata básica (título, og:image) sin ejecutar JS
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(urlLimpia, {
      signal:  controller.signal,
      headers: { 'User-Agent': 'FacuLeaks-Bot/1.0' },
      redirect: 'follow',
    });
    clearTimeout(timeout);

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