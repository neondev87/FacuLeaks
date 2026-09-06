// MÓDULO: scripts/reprocess-avatars.js — mantenimiento de una sola vez
// ────────────────────────────────────────────────────────────────────────
// Reprocesa TODOS los avatares ya guardados para sacarles las barras grises
// que dejó el código viejo (Sharp fit:'contain' con fondo rgb(10,10,10),
// antes del cambio a fit:'fill' en perfil.controller.js).
//   1. .trim() quita el borde casi-negro uniforme -> recupera la foto real.
//   2. .resize(400,400,{fit:'fill'}) -> la estira para llenar el cuadrado.
//   3. sobrescribe el .webp en su lugar (la URL y la fila de la BD no cambian).
// Hace un backup de los originales en uploads/imagenes/_avatar_bak_<ts>/
// antes de tocar nada. Correr con el backend PARADO:  node scripts/reprocess-avatars.js
// Ya se corrió el 2026-09-06 sobre los 4 avatares que había. Queda por si
// vuelve a hacer falta.
const fs   = require("fs");
const path = require("path");
const sharp = require("sharp");

const DIR = path.join(__dirname, "..", "uploads", "imagenes");
const BAK = path.join(DIR, "_avatar_bak_" + Date.now());

(async () => {
  const files = fs.readdirSync(DIR).filter(f => /^avatar_\d+_[a-f0-9]+\.webp$/i.test(f));
  if (files.length === 0) { console.log("no hay avatares para reprocesar."); return; }

  fs.mkdirSync(BAK, { recursive: true });
  console.log("backup de originales -> " + BAK + "\n");

  let ok = 0, skip = 0;
  for (const f of files) {
    const p = path.join(DIR, f);
    try {
      const original = fs.readFileSync(p);
      fs.writeFileSync(path.join(BAK, f), original);

      const before = await sharp(original).metadata();

      // 1. quitar el borde casi-negro (las barras del fit:'contain' viejo)
      let img = sharp(original).rotate();
      let trimmed;
      try {
        trimmed = await img.trim({ background: "#0a0a0a", threshold: 14 }).toBuffer({ resolveWithObject: true });
      } catch {
        trimmed = null; // trim no encontró borde uniforme (avatar ya sano) -> seguimos con el original
      }

      let src = original, tw = before.width, th = before.height, didTrim = false;
      if (trimmed && trimmed.info.width >= 40 && trimmed.info.height >= 40 &&
          (trimmed.info.width < before.width - 4 || trimmed.info.height < before.height - 4)) {
        src = trimmed.data; tw = trimmed.info.width; th = trimmed.info.height; didTrim = true;
      }

      // 2. estirar a 400x400 exacto, sin barras ni recorte
      const out = await sharp(src).resize(400, 400, { fit: "fill" }).webp({ quality: 85 }).toBuffer();
      fs.writeFileSync(p, out);

      console.log(
        `✔ ${f}  ${before.width}x${before.height} -> ` +
        (didTrim ? `trim ${tw}x${th} -> ` : "sin barras detectadas -> ") +
        `400x400 fill  (${(original.length/1024).toFixed(0)}KB -> ${(out.length/1024).toFixed(0)}KB)`
      );
      ok++;
    } catch (e) {
      console.log(`✕ ${f}  ERROR: ${e.message}  (sin cambios)`);
      skip++;
    }
  }
  console.log(`\nlisto: ${ok} reprocesados, ${skip} sin tocar. originales en ${path.basename(BAK)}`);
})();
