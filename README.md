# Costeo — Arepas y Burguer

App web para costear tus recetas: ingredientes, recetas, precio sugerido en local y en Rappi.
Funciona desde el celular o la computadora, con los datos sincronizados en una base de datos real (Neon).

## 1. Crear la base de datos en Neon

1. Entra a tu proyecto en [neon.tech](https://neon.tech) (o crea uno nuevo).
2. Ve a **SQL Editor**.
3. Pega y ejecuta todo el contenido de `sql/schema.sql`. Esto crea las tablas.
4. Pega y ejecuta todo el contenido de `sql/seed.sql`. Esto carga tus 45 ingredientes y 18 recetas originales.
5. Ve a **Connection Details** (o "Connect") y copia la cadena de conexión que dice **Pooled connection** — empieza con `postgresql://...`.

## 2. Configurar las variables de entorno

Necesitas 3 variables. Puedes inventarte tú mismo `APP_PASSWORD` y `SESSION_SECRET` (cualquier texto largo sirve para el segundo).

| Variable | De dónde sale |
|---|---|
| `DATABASE_URL` | La cadena que copiaste de Neon en el paso anterior |
| `APP_PASSWORD` | La contraseña con la que vas a entrar a tu app |
| `SESSION_SECRET` | Cualquier texto largo y aleatorio (ej. `correlon-32-mango-9x`) |

### En Vercel
Project → Settings → Environment Variables → agrega las 3, y dale **Deploy** (o **Redeploy**) después.

### En tu computadora (opcional, para probar antes de subir)
Copia `.env.example` como `.env.local` y pon ahí los valores reales.

## 3. Desplegar en Vercel

Como ya tienes cuenta en Vercel, la forma más simple:

1. Sube esta carpeta a un repositorio de GitHub (puedes arrastrar los archivos directamente en github.com si no usas git desde la terminal).
2. En Vercel: **Add New → Project → Import** ese repositorio.
3. Antes de darle Deploy, agrega las 3 variables de entorno del paso 2.
4. Deploy.

También puedes usar la CLI si la tienes instalada:

```bash
npm install -g vercel
vercel
```

Y sigue las instrucciones (te va a pedir las variables de entorno si no las agregaste ya en el dashboard).

## 4. Entrar a la app

Abre la URL que te da Vercel (algo como `tu-proyecto.vercel.app`), escribe la contraseña que pusiste en `APP_PASSWORD`, y listo. Puedes abrir esa misma URL desde el celular y la computadora — los datos están sincronizados porque viven en Neon, no en el dispositivo.

**Instalar como app en el celular:** abre la URL desde Chrome o Safari, y busca la opción "Agregar a pantalla de inicio" / "Añadir a inicio". Va a quedar con ícono, como una app normal.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Estructura del proyecto

```
app/
  page.js              → pantalla principal (monta el componente de la app)
  login/page.js         → pantalla de login
  api/                   → endpoints (ingredientes, recetas, parámetros, login)
components/
  CosteoApp.jsx          → toda la interfaz (recetas, ingredientes, resumen, ajustes)
lib/
  db.js                  → conexión a Neon
  auth.js                → lógica de la contraseña
sql/
  schema.sql              → crea las tablas (correr una vez en Neon)
  seed.sql                → carga los datos originales (correr una vez en Neon)
middleware.js             → protege toda la app con la contraseña
```

## Si algo no carga

- Pantalla de "No se pudo conectar con la base de datos": revisa que `DATABASE_URL` esté bien copiada (debe ser la conexión **pooled**) y que hayas corrido `sql/schema.sql`.
- No te deja entrar con la contraseña correcta: revisa que `APP_PASSWORD` en Vercel sea exactamente igual a la que estás escribiendo (sin espacios de más).
- Cambios en variables de entorno en Vercel requieren un **Redeploy** para tomar efecto.
