"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { login, logout, requireAuth } from "@/lib/auth";

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
  await sql`DELETE FROM zones WHERE id = ${id}`; // borra en cascada equipos y partidos
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
  await sql`DELETE FROM teams WHERE id = ${id}`;
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
  await sql`DELETE FROM players WHERE id = ${id}`;
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
  if (!zoneId || !homeId || !awayId || homeId === awayId) return;

  const sql = db();
  await sql`
    INSERT INTO matches (zone_id, home_team_id, away_team_id, matchday, played)
    VALUES (${zoneId}, ${homeId}, ${awayId}, ${matchday}, FALSE)`;
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

  // Si están los dos goles, el partido cuenta como jugado; si no, queda pendiente.
  const bothScores = homeRaw !== "" && awayRaw !== "";
  const homeScore = bothScores ? Number(homeRaw) : null;
  const awayScore = bothScores ? Number(awayRaw) : null;

  const sql = db();
  await sql`
    UPDATE matches
    SET home_score = ${homeScore}, away_score = ${awayScore}, played = ${bothScores}, matchday = ${matchday}
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
