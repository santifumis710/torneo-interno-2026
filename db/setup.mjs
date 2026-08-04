// Crea las tablas en Neon ejecutando db/schema.sql.
// Uso: tener DATABASE_URL en .env.local (o en el entorno) y correr `npm run db:setup`.
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error("✗ Falta DATABASE_URL. Corré `vercel env pull .env.local` primero.");
  process.exit(1);
}

const sql = neon(url);
const raw = readFileSync(new URL("./schema.sql", import.meta.url), "utf8");

// Quitamos líneas de comentario y separamos en sentencias individuales.
const statements = raw
  .split("\n")
  .filter((line) => !line.trim().startsWith("--"))
  .join("\n")
  .split(";")
  .map((s) => s.trim())
  .filter(Boolean);

try {
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log(`✔ Tablas creadas / actualizadas (${statements.length} sentencias).`);
} catch (err) {
  console.error("✗ Error creando las tablas:", err.message);
  process.exitCode = 1;
}
