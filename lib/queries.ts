import { db } from "./db";

export type Settings = {
  tournament_name: string;
  subtitle: string;
  logo_url: string | null;
  points_win: number;
  points_draw: number;
};

/** Una zona pertenece a una fase (1, 2, ...). Los partidos heredan la fase de su zona. */
export type Zone = { id: number; name: string; qualifiers_count: number; sort_order: number; phase: number };
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

/**
 * Calcula la tabla de posiciones de una zona a partir de sus equipos y partidos jugados.
 *
 * Desempate: Pts → DIF → GF y, si sigue igual, el **orden del equipo dentro de la zona**
 * (el que llega en `teams`, que el profe acomoda desde el admin). Antes desempataba por
 * nombre alfabético, que no lo decidía nadie: así una zona recién creada, con todos en 0,
 * se ve en el orden que el profe quiso.
 */
export function computeStandings(
  teams: Team[],
  matches: MatchRow[],
  pointsWin: number,
  pointsDraw: number,
): StandingRow[] {
  const table = new Map<number, StandingRow>();
  const position = new Map<number, number>();
  for (const [i, team] of teams.entries()) {
    table.set(team.id, { team, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dif: 0, pts: 0 });
    position.set(team.id, i);
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
  rows.sort(
    (a, b) =>
      b.pts - a.pts ||
      b.dif - a.dif ||
      b.gf - a.gf ||
      (position.get(a.team.id) ?? 0) - (position.get(b.team.id) ?? 0),
  );
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

type SqlClient = ReturnType<typeof db>;

/**
 * Zonas con su fase. Si la base todavía no tiene la columna `phase`
 * (esquema sin actualizar en Neon), toma todo como Fase 1.
 */
async function loadZones(sql: SqlClient): Promise<Zone[]> {
  try {
    return (await sql`
      SELECT id, name, qualifiers_count, sort_order, phase
      FROM zones ORDER BY phase, sort_order, id`) as Zone[];
  } catch (err) {
    console.error("No se pudo leer zones.phase (¿falta correr db/schema.sql en Neon?):", err);
    const rows = (await sql`
      SELECT id, name, qualifiers_count, sort_order FROM zones ORDER BY sort_order, id`) as Omit<Zone, "phase">[];
    return rows.map((z) => ({ ...z, phase: 1 }));
  }
}

export type ZoneTeamRow = { zone_id: number; team_id: number; sort_order: number };

/**
 * Pertenencia equipo↔zona. Vive en `zone_teams` porque en Fase 2 los mismos
 * equipos se reagrupan en zonas nuevas. Si la tabla todavía no existe, cae de
 * vuelta a `teams.zone_id`.
 */
function membershipOf(zoneTeams: ZoneTeamRow[], teams: Team[]): Map<number, Team[]> {
  const byId = new Map(teams.map((t) => [t.id, t]));
  const byZone = new Map<number, Team[]>();
  if (zoneTeams.length > 0) {
    for (const zt of zoneTeams) {
      const team = byId.get(zt.team_id);
      if (team) (byZone.get(zt.zone_id) ?? byZone.set(zt.zone_id, []).get(zt.zone_id)!).push(team);
    }
  } else {
    for (const t of teams) (byZone.get(t.zone_id) ?? byZone.set(t.zone_id, []).get(t.zone_id)!).push(t);
  }
  return byZone;
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
  teams: Team[];
  teamsById: Record<number, Team>;
  playersByTeam: Record<number, Player[]>;
  champions: Champion[];
};

/** Trae todo lo necesario para la vista pública. */
export async function getPublicData(): Promise<PublicData> {
  const sql = db();
  const [settingsRows, zones, teams, matches, players, champions, zoneTeams] = (await Promise.all([
    sql`SELECT tournament_name, subtitle, logo_url, points_win, points_draw FROM settings WHERE id = 1`,
    loadZones(sql),
    sql`SELECT id, zone_id, name, logo_url FROM teams ORDER BY sort_order, id`,
    sql`SELECT id, zone_id, home_team_id, away_team_id, home_score, away_score, played, matchday, scheduled_at FROM matches ORDER BY scheduled_at NULLS LAST, matchday NULLS LAST, id`,
    sql`SELECT id, team_id, name, number, photo_url FROM players ORDER BY sort_order, id`,
    optional<Champion>(sql`SELECT id, season, champion, sort_order FROM champions ORDER BY sort_order, id`, "champions"),
    optional<ZoneTeamRow>(sql`SELECT zone_id, team_id, sort_order FROM zone_teams ORDER BY sort_order, team_id`, "zone_teams"),
  ])) as [Settings[], Zone[], Team[], MatchRow[], Player[], Champion[], ZoneTeamRow[]];

  const settings = settingsRows[0] ?? DEFAULT_SETTINGS;
  const teamsById: Record<number, Team> = {};
  for (const t of teams) teamsById[t.id] = t;

  const playersByTeam: Record<number, Player[]> = {};
  for (const p of players) (playersByTeam[p.team_id] ??= []).push(p);

  const teamsByZone = membershipOf(zoneTeams, teams);

  const publicZones: PublicZone[] = zones.map((zone) => {
    const zoneTeamList = teamsByZone.get(zone.id) ?? [];
    const zoneMatches = matches.filter((m) => m.zone_id === zone.id);
    return {
      zone,
      standings: computeStandings(zoneTeamList, zoneMatches, settings.points_win, settings.points_draw),
      matches: zoneMatches,
      teams: zoneTeamList,
    };
  });

  return { settings, zones: publicZones, teams, teamsById, playersByTeam, champions };
}

export type AdminData = {
  settings: Settings;
  zones: Zone[];
  teams: Team[];
  teamsByZone: Record<number, Team[]>;
  playersByTeam: Record<number, Player[]>;
  matches: MatchRow[];
  champions: Champion[];
};

/** Trae todo lo necesario para el panel de administración. */
export async function getAdminData(): Promise<AdminData> {
  const sql = db();
  const [settingsRows, zones, teams, players, matches, champions, zoneTeams] = (await Promise.all([
    sql`SELECT tournament_name, subtitle, logo_url, points_win, points_draw FROM settings WHERE id = 1`,
    loadZones(sql),
    sql`SELECT id, zone_id, name, logo_url FROM teams ORDER BY sort_order, id`,
    sql`SELECT id, team_id, name, number, photo_url FROM players ORDER BY sort_order, id`,
    sql`SELECT id, zone_id, home_team_id, away_team_id, home_score, away_score, played, matchday, scheduled_at FROM matches ORDER BY scheduled_at NULLS LAST, matchday NULLS LAST, id`,
    optional<Champion>(sql`SELECT id, season, champion, sort_order FROM champions ORDER BY sort_order, id`, "champions"),
    optional<ZoneTeamRow>(sql`SELECT zone_id, team_id, sort_order FROM zone_teams ORDER BY sort_order, team_id`, "zone_teams"),
  ])) as [Settings[], Zone[], Team[], Player[], MatchRow[], Champion[], ZoneTeamRow[]];

  const playersByTeam: Record<number, Player[]> = {};
  for (const p of players) (playersByTeam[p.team_id] ??= []).push(p);

  const teamsByZone: Record<number, Team[]> = {};
  for (const [zoneId, list] of membershipOf(zoneTeams, teams)) teamsByZone[zoneId] = list;

  return { settings: settingsRows[0] ?? DEFAULT_SETTINGS, zones, teams, teamsByZone, playersByTeam, matches, champions };
}
