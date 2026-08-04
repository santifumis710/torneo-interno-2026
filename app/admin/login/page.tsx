import "../../globals.css";
import "../admin.css";
import { loginAction } from "../actions";
import { isAuthed } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await isAuthed()) redirect("/admin");
  const { error } = await searchParams;

  return (
    <div className="admin-wrap login-box">
      <div className="a-card">
        <h2>Panel de administración</h2>
        <p className="hint">Ingresá la contraseña para gestionar el torneo.</p>
        {error && <p className="err">Contraseña incorrecta.</p>}
        <form action={loginAction}>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" name="password" type="password" autoFocus required />
          </div>
          <button className="btn" type="submit" style={{ width: "100%" }}>
            Entrar
          </button>
        </form>
        <a className="back-link" href="/">
          ← Volver al torneo
        </a>
      </div>
    </div>
  );
}
