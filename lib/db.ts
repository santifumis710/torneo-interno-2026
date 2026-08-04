import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let client: NeonQueryFunction<false, false> | null = null;

/**
 * Cliente SQL de Neon (lazy). Usa la variable de entorno que inyecta la
 * integración de Neon en Vercel. Se inicializa recién al primer uso para no
 * romper el build cuando la variable no está presente.
 */
export function db(): NeonQueryFunction<false, false> {
  if (!client) {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
    if (!url) throw new Error("Falta la variable de entorno DATABASE_URL / POSTGRES_URL");
    client = neon(url);
  }
  return client;
}
