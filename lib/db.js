import { neon } from "@neondatabase/serverless";

// Reutiliza una sola conexión "serverless" de Neon en toda la app.
// DATABASE_URL viene de las variables de entorno (ver .env.example).
if (!process.env.DATABASE_URL) {
  console.warn(
    "[db] Falta la variable de entorno DATABASE_URL. Configúrala en .env.local o en Vercel."
  );
}

export const sql = neon(process.env.DATABASE_URL);
