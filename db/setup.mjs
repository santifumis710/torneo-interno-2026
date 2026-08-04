// Crea las tablas en Neon ejecutando db/schema.sql.
// Uso: tener DATABASE_URL en .env.local (o en el entorno) y correr `npm run db:setup`.
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

config({ path: ".env.local" });
neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error("✗ Falta DATABASE_URL. Corré `vercel env pull .env.local` primero.");
  process.exit(1);
}

const schema = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");
const pool = new Pool({ connectionString: url });

try {
  await pool.query(schema);
  console.log("✔ Tablas creadas / actualizadas correctamente.");
} catch (err) {
  console.error("✗ Error creando las tablas:", err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
