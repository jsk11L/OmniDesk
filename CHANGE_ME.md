# CHANGE_ME — Valores placeholder a reemplazar

Este archivo lista TODOS los valores marcados como placeholder en el repositorio.
Reemplázalos antes de levantar el proyecto en cualquier entorno (incluso desarrollo local).

---

## 1. Base de datos (PostgreSQL)

**Archivo:** `backend/.env`
**Variable:** `DATABASE_URL`

Formato esperado:
```
DATABASE_URL="postgresql://<usuario>:<password>@<host>:<puerto>/<basedatos>?schema=public"
```

Ejemplo para tu entorno local con Postgres 18:
```
DATABASE_URL="postgresql://postgres:tu_password_pg@localhost:5432/omnidesk?schema=public"
```

Antes de correr migraciones, crea la base manualmente desde pgAdmin 4:
- Nombre: `omnidesk`
- Owner: el usuario que usarás en la connection string

---

## 2. JWT Secrets

**Archivo:** `backend/.env`
**Variables:** `JWT_SECRET`, `JWT_REFRESH_SECRET`

Genera dos strings aleatorios distintos de al menos 64 caracteres cada uno.
En PowerShell puedes usar:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

O en Node:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 3. Email (Nodemailer SMTP)

**Archivo:** `backend/.env`
**Variables:** `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`

Mientras `MAIL_HOST` esté en el valor placeholder (`smtp.placeholder.local`), el
`MailService` NO intenta enviar emails reales: imprime el contenido por consola
y devuelve éxito. Útil para desarrollo.

Cuando quieras enviar emails reales (Resend recomendado):
```
MAIL_HOST="smtp.resend.com"
MAIL_PORT=465
MAIL_USER="resend"
MAIL_PASS="re_xxxxxxxxxxxx"
MAIL_FROM="noreply@tu-dominio.com"
```

---

## 4. Web Push (VAPID)

**Archivo:** `backend/.env`
**Variables:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

Genera las claves UNA sola vez con:
```bash
npx web-push generate-vapid-keys
```

Guarda el output. La pública también va al frontend (`environments/environment.ts`).

---

## 5. Frontend URL (CORS)

**Archivo:** `backend/.env`
**Variable:** `FRONTEND_URL`

Por defecto: `http://localhost:4200`. Si cambias el puerto de Angular o despliegas,
actualízalo. CORS rechazará cualquier otro origen.

---

## 6. Seed de defaults

**Archivo:** `backend/.env`
**Variable:** `SEED_SYSTEM_USER_ID`

UUID fijo del usuario "system" que será dueño de los 5 temas predefinidos
(Obsidian Dark, Notion Light, Midnight Blue, Forest, Sunset). NO lo cambies
una vez ejecutado el seed por primera vez (rompería las referencias).

Valor por defecto sugerido: `00000000-0000-0000-0000-000000000001`

---

## 7. Frontend (cuando lleguemos a la Fase 4)

**Archivo:** `frontend/src/environments/environment.ts`
- `apiUrl`: URL del backend (default `http://localhost:3000`)
- `vapidPublicKey`: misma clave pública que en backend

---

## Plantilla lista para copiar a `backend/.env`

Crea el archivo `backend/.env` (no se versiona) y pega esto, reemplazando los `CHANGE_ME_*`:

```env
# Base de datos
DATABASE_URL="postgresql://postgres:CHANGE_ME_PG_PASSWORD@localhost:5432/omnidesk?schema=public"

# JWT
JWT_SECRET="CHANGE_ME_jwt_access_secret_at_least_64_chars"
JWT_REFRESH_SECRET="CHANGE_ME_jwt_refresh_secret_at_least_64_chars_distinct"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# App
PORT=3000
NODE_ENV=development
FRONTEND_URL="http://localhost:4200"

# Email
MAIL_HOST="smtp.placeholder.local"
MAIL_PORT=465
MAIL_USER="CHANGE_ME_mail_user"
MAIL_PASS="CHANGE_ME_mail_password"
MAIL_FROM="noreply@omnidesk.local"

# Web Push
VAPID_PUBLIC_KEY="CHANGE_ME_vapid_public_key"
VAPID_PRIVATE_KEY="CHANGE_ME_vapid_private_key"
VAPID_SUBJECT="mailto:admin@omnidesk.local"

# Seed
SEED_SYSTEM_USER_ID="00000000-0000-0000-0000-000000000001"
```

> Nota: mientras `MAIL_HOST` siga siendo `smtp.placeholder.local`, el `MailService`
> imprime los emails por consola en vez de enviarlos. Útil para desarrollo sin SMTP real.

---

## Resumen del orden de setup

1. Instalar dependencias: `pnpm install` desde la raíz.
2. Crear DB `omnidesk` en pgAdmin (owner = el usuario de la connection string).
3. Crear `backend/.env` con la plantilla de arriba.
4. `pnpm db:migrate` — corre la migración inicial.
5. `pnpm db:seed` — crea el usuario system y los 5 temas predefinidos.
6. `pnpm backend:dev` — levanta NestJS en `http://localhost:3000`.
