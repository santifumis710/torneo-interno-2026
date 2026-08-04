"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { db } from "@/lib/db";
import { login, logout, requireAuth } from "@/lib/auth";
import { normalizeLogo, normalizePhoto } from "@/lib/logo";

/** Borra uno o varios blobs por URL. Best-effort: si falla, loguea y sigue. */
async function deleteBlobs(urls: (string | null | undefined)[]) {
  const valid = urls.filter((u): u is string => typeof u === "string" && u.length > 0);
  if (valid.length === 0) return;
  try {
    await del(valid);
  } catch (err) {
    console.error("Error borrando blob(s):", err);
  }
}

/**
 * Convierte el valor de un input datetime-local ("YYYY-MM-DDTHH:mm") en un
 * timestamp con zona, interpretándolo como hora local de Argentina (UTC-3, sin
 * horario de verano). Devuelve null si viene vacío.
 */
function parseScheduledAt(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  return `${v.slice(0, 16)}:00-03:00`;
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin");
}

/* ---------- Auth ---------- */

export async function loginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const ok = await login(password);
  if (!ok) redirect("/admin/login?error=1");
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}

/* ---------- Configuración del torneo ---------- */

export async function updateSettings(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("tournament_name") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim();
  const pointsWin = Number(formData.get("points_win") ?? 3);
  const pointsDraw = Number(formData.get("points_draw") ?? 1);
  if (!name) return;

  const sql = db();
  await sql`
    UPDATE settings
    SET tournament_name = ${name},
        subtitle = ${subtitle},
        points_win = ${Number.isFinite(pointsWin) ? pointsWin : 3},
        points_draw = ${Number.isFinite(pointsDraw) ? pointsDraw : 1}
    WHERE id = 1`;
  refresh();
}

/* ---------- Zonas ---------- */

export async function createZone(formData: FormData) {
  await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  const qualifiers = Number(formData.get("qualifiers_count") ?? 4);
  if (!name) return;

  const sql = db();
  await sql`
    INSERT INTO zones (name, qualifiers_count, sort_order)
    VALUES (${name}, ${Number.isFinite(qualifiers) ? qualifiers : 4},
            COALESCE((SELECT MAX(sort_order) + 1 FROM zones), 0))`;
  refresh();
}

export async function updateZone(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const qualifiers = Number(formData.get("qualifiers_count") ?? 4);
  if (!id || !name) return;

  const sql = db();
  await sql`
    UPDATE zones
    SET name = ${name}, qualifiers_count = ${Number.isFinite(qualifiers) ? qualifiers : 4}
    WHERE id = ${id}`;
  refresh();
}

export async function deleteZone(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  if (!id) return;
  const sql = db();
  // Junto los blobs (escudos + fotos de jugadores) antes de borrar en cascada.
  const rows = (await sql`
    SELECT logo_url AS url FROM teams WHERE zone_id = ${id}
    UNION ALL
    SELECT p.photo_url FROM players p JOIN teams t ON t.id = p.team_id WHERE t.zone_id = ${id}
  `) as { url: string | null }[];
  await sql`DELETE FROM zones WHERE id = ${id}`; // borra en cascada equipos y partidos
  await deleteBlobs(rows.map((r) => r.url));
  refresh();
}

/* ---------- Equipos ---------- */

export async function createTeam(formData: FormData) {
  await requireAuth();
  const zoneId = Number(formData.get("zone_id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!zoneId || !name) return;

  const sql = db();
  await sql`
    INSERT INTO teams (zone_id, name, sort_order)
    VALUES (${zoneId}, ${name},
            COALESCE((SELECT MAX(sort_order) + 1 FROM teams WHERE zone_id = ${zoneId}), 0))`;
  refresh();
}

export async function updateTeam(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const zoneId = Number(formData.get("zone_id"));
  if (!id || !name || !zoneId) return;

  const sql = db();
  await sql`UPDATE teams SET name = ${name}, zone_id = ${zoneId} WHERE id = ${id}`;
  refresh();
}

export async function deleteTeam(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  if (!id) return;
  const sql = db();
  const rows = (await sql`
    SELECT logo_url AS url FROM teams WHERE id = ${id}
    UNION ALL
    SELECT photo_url FROM players WHERE team_id = ${id}
  `) as { url: string | null }[];
  await sql`DELETE FROM teams WHERE id = ${id}`;
  await deleteBlobs(rows.map((r) => r.url));
  refresh();
}

/* ---------- Jugadores ---------- */

export async function createPlayer(formData: FormData) {
  await requireAuth();
  const teamId = Number(formData.get("team_id"));
  const name = String(formData.get("name") ?? "").trim();
  const numberRaw = String(formData.get("number") ?? "").trim();
  const number = numberRaw === "" ? null : Number(numberRaw);
  if (!teamId || !name) return;

  const sql = db();
  await sql`
    INSERT INTO players (team_id, name, number, sort_order)
    VALUES (${teamId}, ${name}, ${number}, COALESCE((SELECT MAX(sort_order) + 1 FROM players WHERE team_id = ${teamId}), 0))`;
  refresh();
}

export async function updatePlayer(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const numberRaw = String(formData.get("number") ?? "").trim();
  const number = numberRaw === "" ? null : Number(numberRaw);
  if (!id || !name) return;

  const sql = db();
  await sql`UPDATE players SET name = ${name}, number = ${number} WHERE id = ${id}`;
  refresh();
}

export async function deletePlayer(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  if (!id) return;
  const sql = db();
  const prev = ((await sql`SELECT photo_url FROM players WHERE id = ${id}`) as { photo_url: string | null }[])[0]?.photo_url;
  await sql`DELETE FROM players WHERE id = ${id}`;
  await deleteBlobs([prev]);
  refresh();
}

export async function uploadPlayerPhoto(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  const file = formData.get("photo");
  if (!id || !(file instanceof File) || file.size === 0) return;

  const sql = db();
  const prev = ((await sql`SELECT photo_url FROM players WHERE id = ${id}`) as { photo_url: string | null }[])[0]?.photo_url;
  const url = await processAndUpload(file, `player-${id}`, "photo");
  await sql`UPDATE players SET photo_url = ${url} WHERE id = ${id}`;
  await deleteBlobs([prev]);
  refresh();
}

export async function removePlayerPhoto(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  if (!id) return;
  const sql = db();
  const prev = ((await sql`SELECT photo_url FROM players WHERE id = ${id}`) as { photo_url: string | null }[])[0]?.photo_url;
  await sql`UPDATE players SET photo_url = NULL WHERE id = ${id}`;
  await deleteBlobs([prev]);
  refresh();
}

/* ---------- Partidos ---------- */

export async function createMatch(formData: FormData) {
  await requireAuth();
  const zoneId = Number(formData.get("zone_id"));
  const homeId = Number(formData.get("home_team_id"));
  const awayId = Number(formData.get("away_team_id"));
  const mdRaw = String(formData.get("matchday") ?? "").trim();
  const matchday = mdRaw === "" ? null : Number(mdRaw);
  const scheduledAt = parseScheduledAt(String(formData.get("scheduled_at") ?? ""));
  if (!zoneId || !homeId || !awayId || homeId === awayId) return;

  const sql = db();
  await sql`
    INSERT INTO matches (zone_id, home_team_id, away_team_id, matchday, scheduled_at, played)
    VALUES (${zoneId}, ${homeId}, ${awayId}, ${matchday}, ${scheduledAt}, FALSE)`;
  refresh();
}

export async function updateMatch(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  if (!id) return;
  const homeRaw = String(formData.get("home_score") ?? "").trim();
  const awayRaw = String(formData.get("away_score") ?? "").trim();
  const mdRaw = String(formData.get("matchday") ?? "").trim();
  const matchday = mdRaw === "" ? null : Number(mdRaw);
  const scheduledAt = parseScheduledAt(String(formData.get("scheduled_at") ?? ""));

  // Si están los dos goles, el partido cuenta como jugado; si no, queda pendiente.
  const bothScores = homeRaw !== "" && awayRaw !== "";
  const homeScore = bothScores ? Number(homeRaw) : null;
  const awayScore = bothScores ? Number(awayRaw) : null;

  const sql = db();
  await sql`
    UPDATE matches
    SET home_score = ${homeScore}, away_score = ${awayScore}, played = ${bothScores},
        matchday = ${matchday}, scheduled_at = ${scheduledAt}
    WHERE id = ${id}`;
  refresh();
}

export async function deleteMatch(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  if (!id) return;
  const sql = db();
  await sql`DELETE FROM matches WHERE id = ${id}`;
  refresh();
}

/* ---------- Logos (Vercel Blob + normalización) ---------- */

async function processAndUpload(
  file: File,
  prefix: string,
  kind: "logo" | "logo-keepbg" | "photo" = "logo",
): Promise<string> {
  try {
    const raw = Buffer.from(await file.arrayBuffer());
    if (kind === "photo") {
      const jpg = await normalizePhoto(raw);
      const { url } = await put(`photos/${prefix}-${Date.now()}.jpg`, jpg, {
        access: "public",
        contentType: "image/jpeg",
      });
      return url;
    }
    // "logo" quita el fondo plano; "logo-keepbg" lo deja tal cual (logo del torneo).
    const png = await normalizeLogo(raw, kind === "logo");
    const { url } = await put(`logos/${prefix}-${Date.now()}.png`, png, {
      access: "public",
      contentType: "image/png",
    });
    return url;
  } catch (err) {
    console.error(`Error subiendo imagen (${kind}/${prefix}):`, err);
    throw err;
  }
}

export async function uploadTeamLogo(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  const file = formData.get("logo");
  if (!id || !(file instanceof File) || file.size === 0) return;

  const sql = db();
  const prev = ((await sql`SELECT logo_url FROM teams WHERE id = ${id}`) as { logo_url: string | null }[])[0]?.logo_url;
  const url = await processAndUpload(file, `team-${id}`);
  await sql`UPDATE teams SET logo_url = ${url} WHERE id = ${id}`;
  await deleteBlobs([prev]);
  refresh();
}

export async function removeTeamLogo(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  if (!id) return;
  const sql = db();
  const prev = ((await sql`SELECT logo_url FROM teams WHERE id = ${id}`) as { logo_url: string | null }[])[0]?.logo_url;
  await sql`UPDATE teams SET logo_url = NULL WHERE id = ${id}`;
  await deleteBlobs([prev]);
  refresh();
}

export async function uploadTournamentLogo(formData: FormData) {
  await requireAuth();
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return;

  const sql = db();
  const prev = ((await sql`SELECT logo_url FROM settings WHERE id = 1`) as { logo_url: string | null }[])[0]?.logo_url;
  const url = await processAndUpload(file, "tournament", "logo-keepbg");
  await sql`UPDATE settings SET logo_url = ${url} WHERE id = 1`;
  await deleteBlobs([prev]);
  refresh();
}

export async function removeTournamentLogo() {
  await requireAuth();
  const sql = db();
  const prev = ((await sql`SELECT logo_url FROM settings WHERE id = 1`) as { logo_url: string | null }[])[0]?.logo_url;
  await sql`UPDATE settings SET logo_url = NULL WHERE id = 1`;
  await deleteBlobs([prev]);
  refresh();
}

/* ---------- Playoffs (cruces del cuadro) ---------- */

export async function createTie(formData: FormData) {
  await requireAuth();
  const round = Number(formData.get("round"));
  const homeLabel = String(formData.get("home_label") ?? "").trim() || null;
  const awayLabel = String(formData.get("away_label") ?? "").trim() || null;
  if (!Number.isFinite(round)) return;

  const sql = db();
  await sql`
    INSERT INTO playoff_ties (round, sort_order, home_label, away_label, played)
    VALUES (${round}, COALESCE((SELECT MAX(sort_order) + 1 FROM playoff_ties WHERE round = ${round}), 0),
            ${homeLabel}, ${awayLabel}, FALSE)`;
  refresh();
}

export async function updateTie(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  if (!id) return;
  const homeLabel = String(formData.get("home_label") ?? "").trim() || null;
  const awayLabel = String(formData.get("away_label") ?? "").trim() || null;
  const homeTeam = Number(formData.get("home_team_id")) || null;
  const awayTeam = Number(formData.get("away_team_id")) || null;
  const homeRaw = String(formData.get("home_score") ?? "").trim();
  const awayRaw = String(formData.get("away_score") ?? "").trim();

  const bothScores = homeRaw !== "" && awayRaw !== "";
  const homeScore = bothScores ? Number(homeRaw) : null;
  const awayScore = bothScores ? Number(awayRaw) : null;

  const sql = db();
  await sql`
    UPDATE playoff_ties
    SET home_label = ${homeLabel}, away_label = ${awayLabel},
        home_team_id = ${homeTeam}, away_team_id = ${awayTeam},
        home_score = ${homeScore}, away_score = ${awayScore}, played = ${bothScores}
    WHERE id = ${id}`;
  refresh();
}

export async function deleteTie(formData: FormData) {
  await requireAuth();
  const id = Number(formData.get("id"));
  if (!id) return;
  const sql = db();
  await sql`DELETE FROM playoff_ties WHERE id = ${id}`;
  refresh();
}
