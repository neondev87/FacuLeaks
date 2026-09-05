# FacuLeaks — Puesta en marcha desde cero

Guía para levantar el proyecto en una PC nueva (se te rompió la actual, le
pasás el proyecto a alguien más, etc.). Las dependencias de código en sí
(`framer-motion`, `next`, `express`, etc.) **ya están listadas en
`frontend/package.json` y `backend/package.json`** — `npm install` las lee
solo, no hace falta anotarlas a mano. Lo que este archivo cubre es todo lo
que package.json NO sabe: qué instalar en el sistema, qué cuentas externas
armar, y qué variables de entorno completar.

---

## 1. Instalar en el sistema

| Programa | Versión usada en este proyecto | Notas |
|---|---|---|
| [Node.js](https://nodejs.org) | v24.x (instalado: v24.20.0) | Trae `npm` incluido. |
| [MySQL Server](https://dev.mysql.com/downloads/mysql/) | 8.x | Corriendo en `127.0.0.1:3306`. |
| [Git](https://git-scm.com/) | cualquier reciente | Para clonar el repo. |

Opcional, solo si vas a levantar una demo pública temporal (no para desarrollo normal):
- [cloudflared](https://github.com/cloudflare/cloudflared) — túnel gratis sin cuenta.

---

## 2. Clonar y crear la base de datos

```bash
git clone <url-del-repo> FacuLeaks
cd FacuLeaks
```

En MySQL (Workbench, `mysql` CLI, o el cliente que uses), crear la base y un
usuario con permisos sobre ella:

```sql
CREATE DATABASE faculeaks CHARACTER SET utf8mb4;
CREATE USER 'faculeaks_app'@'localhost' IDENTIFIED BY 'elegí-una-contraseña';
GRANT ALL PRIVILEGES ON faculeaks.* TO 'faculeaks_app'@'localhost';
FLUSH PRIVILEGES;
```

---

## 3. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Completar `backend/.env` (la plantilla ya explica cada variable):
- `DATABASE_URL` — con el usuario/contraseña que creaste en el paso 2.
- `JWT_SECRET` e `INTERNAL_API_SECRET` — generar cada uno con:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` — ver paso 5 (opcional, solo
  si querés el widget de Spotify funcionando).
- El resto (`PORT`, `HOST`, `CORS_ORIGIN`, `NODE_ENV`) se pueden dejar como
  están en la plantilla para desarrollo local.

Aplicar las migraciones y arrancar:

```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Verificar: `http://localhost:4000/api/ping` debería responder.

---

## 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Completar `frontend/.env`:
- `NEXTAUTH_SECRET` — generar igual que arriba (otro valor, no reusar el del backend).
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — ver paso 5.
- `INTERNAL_API_SECRET` — **tiene que ser EXACTAMENTE el mismo valor** que pusiste en `backend/.env`.
- El resto se puede dejar como está en la plantilla.

```bash
npm run dev
```

Verificar: abrir `http://localhost:3000/auth`.

---

## 5. Cuentas externas necesarias

### Google OAuth (obligatorio — es el único login del sitio)
1. [Google Cloud Console](https://console.cloud.google.com/) → crear proyecto → "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth client ID" → tipo "Web application".
2. **Authorized redirect URI**: `http://localhost:3000/api/auth/callback/google`
3. Copiar el Client ID y Client Secret a `frontend/.env`.

### Spotify (opcional — solo el widget "now playing" del Navbar)
1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → crear una app.
2. **Redirect URI**: `http://127.0.0.1:4000/api/spotify/callback`
3. Copiar Client ID y Client Secret a `backend/.env`.

Si no te interesa esta feature, dejá esas dos variables vacías — el resto del
sitio funciona igual, el widget simplemente no aparece.

---

## 6. Cosas que ya nos mordieron una vez (evitártelas)

- **Windows + carpeta sincronizada por OneDrive**: el servidor de desarrollo
  de Next (`npm run dev`) puede crashear solo después de un rato con
  `"Jest worker encountered N child process exceptions"`. No es un bug del
  código — es OneDrive interfiriendo con el file-watcher. Si pasa, simplemente
  parar (Ctrl+C) y volver a correr `npm run dev`. Si molesta seguido, la
  solución de fondo es trabajar desde una carpeta fuera de OneDrive.
- **PowerShell no soporta `&&`** — si estás en PowerShell (no Git Bash),
  corré los comandos de este archivo uno por uno en vez de encadenados.
- **`sharp` en Windows**: ya está resuelto en el código (`sharp.cache(false)`
  al arrancar el backend) — si no estuviera, subir avatares/fotos falla con
  `EBUSY` al borrar el archivo temporal.

---

## 7. Cómo confirmar que quedó todo bien

1. `http://localhost:4000/api/ping` → responde.
2. `http://localhost:3000/auth` → carga la pantalla de login.
3. Iniciar sesión con Google → te lleva a `/register` (primera vez) → crear
   usuario y contraseña → termina en `/feed`.
4. El feed carga (vacío la primera vez, es esperable).
