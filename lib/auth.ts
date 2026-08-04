import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "node:crypto";

const COOKIE = "torneo_admin";

function expectedToken(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(`torneo-2026:${pw}`).digest("hex");
}

/** ¿La sesión actual está autenticada como admin? */
export async function isAuthed(): Promise<boolean> {
  if (!process.env.ADMIN_PASSWORD) return false;
  const store = await cookies();
  return store.get(COOKIE)?.value === expectedToken();
}

/** Redirige al login si no hay sesión de admin. Usar al inicio de páginas protegidas. */
export async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) redirect("/admin/login");
}

/** Valida la contraseña y, si es correcta, crea la cookie de sesión. */
export async function login(password: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || password !== pw) return false;
  const store = await cookies();
  store.set(COOKIE, expectedToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 días
  });
  return true;
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
