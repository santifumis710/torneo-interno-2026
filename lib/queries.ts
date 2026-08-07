import { db } from "./db";

export type Settings = {
  tournament_name: string;
  subtitle: string;
  logo_url: string | null;
  points_win: number;
  points_draw: number;
};

export type Zone = { id: number; name: string; qualifiers_count: number; sort_order: number };
export type Team = { id: number; zone_id: number; name: string; logo_url: string | null };
export type Player = { id: number; team_id: number; name: string; number: number | null; photo_url: string | null };

export type MatchRow = {
  id: number;
  zone_id: number;
  home_team_id: number;
  away_team_id: number;
  home_score: number | null;
  away_score: number | null;
  played: boolean;
  matchday: number | null;
  scheduled_at: string | null;
};

export type TieRow = {
  id: number;
  round: number;
  sort_order: number;
  home_label: string | null;
  away_label: string | null;
  home_team_id: number | null;
  away_team_id: number | null;
  home_score: number | null;
  away_score: number | null;
  played: boolean;
};

/** Una fila del historial de campeones de ediciones anteriores. */
export type Champion = { id: number; season: string; champion: string; sort_order: number };

export type StandingRow = {
  team: Team;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
};

const DEFAULT_SETTINGS: Settings = {
  tournament_name: "Torneo Interno 2026",
  subtitle: "UTN · Facultad Regional Santa Fe",
  logo_url: null,
  points_win: 3,
  points_draw: 1,
};

/** Calcula la tabla de posiciones de una zona a partir de sus equipos y partidos jugados. */
export function computeStandings(
  teams: Team[],
  matches: MatchRow[],
  pointsWin: number,
  pointsDraw: number,
): StandingRow[] {
  const table = new Map<number, StandingRow>();
  for (const team of teams) {
    table.set(team.id, { team, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dif: 0, pts: 0 });
  }

  for (const m of matches) {
    if (!m.played || m.home_score === null || m.away_score === null) continue;
    const home = table.get(m.home_team_id);
    const away = table.get(m.away_team_id);
    if (!home || !away) continue;

    home.pj++;
    away.pj++;
    home.gf += m.home_score;
    home.gc += m.away_score;
    away.gf += m.away_score;
    away.gc += m.home_score;

    if (m.home_score > m.away_score) {
      home.g++;
      home.pts += pointsWin;
      away.p++;
    } else if (m.home_score < m.away_score) {
      away.g++;
      away.pts += pointsWin;
      home.p++;
    } else {
      home.e++;
      away.e++;
      home.pts += pointsDraw;
      away.pts += pointsDraw;
    }
  }

  const rows = [...table.values()];
  for (const r of rows) r.dif = r.gf - r.gc;
  rows.sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf || a.team.name.localeCompare(b.team.name));
  return rows;
}

/**
 * Envuelve una consulta opcional: si la tabla todavía no existe (esquema sin actualizar
 * en Neon), devuelve [] en vez de tirar y voltear toda la página.
 */
function optional<T>(query: Promise<unknown>, label: string): Promise<T[]> {
  return (query as Promise<T[]>).catch((err) => {
    console.error(`No se pudo leer ${label} (¿falta correr db/schema.sql en Neon?):`, err);
    return [];
  });
}

export type PublicZone = {
  zone: Zone;
  standings: StandingRow[];
  matches: MatchRow[];
  teams: Team[];
};

export type PublicData = {
  settings: Settings;
  zones: PublicZone[];
  ties: TieRow[];
  teamsById: Record<number, Team>;
  playersByTeam: Record<number, Player[]>;
  champions: Champion[];
};

/** Trae todo lo necesario para la vista pública. */
export async function getPublicData(): Promise<PublicData> {
  const sql = db();
  const [settingsRows, zones, teams, matches, ties, players, champions] = (await Promise.all([
    sql`SELECT tournament_name, subtitle, logo_url, points_win, points_draw FROM settings WHERE id = 1`,
    sql`SELECT id, name, qualifiers_count, sort_order FROM zones ORDER BY sort_order, id`,
    sql`SELECT id, zone_id, name, logo_url FROM teams ORDER BY sort_order, id`,
    sql`SELECT id, zone_id, home_team_id, away_team_id, home_score, away_score, played, matchday, scheduled_at FROM matches ORDER BY scheduled_at NULLS LAST, matchday NULLS LAST, id`,
    sql`SELECT id, round, sort_order, home_label, away_label, home_team_id, away_team_id, home_score, away_score, played FROM playoff_ties ORDER BY round, sort_order, id`,
    sql`SELECT id, team_id, name, number, photo_url FROM players ORDER BY sort_order, id`,
    optional<Champion>(sql`SELECT id, season, champion, sort_order FROM champions ORDER BY sort_order, id`, "champions"),
  ])) as [Settings[], Zone[], Team[], MatchRow[], TieRow[], Player[], Champion[]];

  const settings = settingsRows[0] ?? DEFAULT_SETTINGS;
  const teamsById: Record<number, Team> = {};
  for (const t of teams) teamsById[t.id] = t;

  const playersByTeam: Record<number, Player[]> = {};
  for (const p of players) (playersByTeam[p.team_id] ??= []).push(p);

  const publicZones: PublicZone[] = zones.map((zone) => {
    const zoneTeams = teams.filter((t) => t.zone_id === zone.id);
    const zoneMatches = matches.filter((m) => m.zone_id === zone.id);
    return {
      zone,
      standings: computeStandings(zoneTeams, zoneMatches, settings.points_win, settings.points_draw),
      matches: zoneMatches,
      teams: zoneTeams,
    };
  });

  return { settings, zones: publicZones, ties, teamsById, playersByTeam, champions };
}

export type AdminData = {
  settings: Settings;
  zones: Zone[];
  teams: Team[];
  playersByTeam: Record<number, Player[]>;
  matches: MatchRow[];
  ties: TieRow[];
  champions: Champion[];
};

/** Trae todo lo necesario para el panel de administración. */
export async function getAdminData(): Promise<AdminData> {
  const sql = db();
  const [settingsRows, zones, teams, players, matches, ties, champions] = (await Promise.all([
    sql`SELECT tournament_name, subtitle, logo_url, points_win, points_draw FROM settings WHERE id = 1`,
    sql`SELECT id, name, qualifiers_count, sort_order FROM zones ORDER BY sort_order, id`,
    sql`SELECT id, zone_id, name, logo_url FROM teams ORDER BY sort_order, id`,
    sql`SELECT id, team_id, name, number, photo_url FROM players ORDER BY sort_order, id`,
    sql`SELECT id, zone_id, home_team_id, away_team_id, home_score, away_score, played, matchday, scheduled_at FROM matches ORDER BY scheduled_at NULLS LAST, matchday NULLS LAST, id`,
    sql`SELECT id, round, sort_order, home_label, away_label, home_team_id, away_team_id, home_score, away_score, played FROM playoff_ties ORDER BY round, sort_order, id`,
    optional<Champion>(sql`SELECT id, season, champion, sort_order FROM champions ORDER BY sort_order, id`, "champions"),
  ])) as [Settings[], Zone[], Team[], Player[], MatchRow[], TieRow[], Champion[]];

  const playersByTeam: Record<number, Player[]> = {};
  for (const p of players) (playersByTeam[p.team_id] ??= []).push(p);

  return { settings: settingsRows[0] ?? DEFAULT_SETTINGS, zones, teams, playersByTeam, matches, ties, champions };
}
