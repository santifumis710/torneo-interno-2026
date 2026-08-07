import type { MatchRow, Team } from "./queries";

/**
 * Deduce en qué fechas queda libre un equipo de la zona (fecha → equipo libre).
 *
 * Una fecha solo se considera **completa** si tiene exactamente `floor(equipos/2)`
 * partidos cargados: con 7 equipos son 3. Si el profe todavía no cargó todos los
 * partidos de la fecha, no se afirma nada — "no aparece en ningún partido" no
 * alcanza, porque puede ser que el partido falte cargar.
 *
 * Con esa regla, una zona de equipos pares nunca tiene libres (juegan todos) y
 * agregar un equipo a mitad de torneo no inventa libres en las fechas viejas,
 * porque cambia la cantidad de partidos esperados. Si por un error de carga
 * quedaran dos equipos afuera, tampoco se afirma nada.
 *
 * Es una función pura: se calcula en el cliente con los datos que ya bajan, sin
 * tocar la base.
 */
export function computeByes(teams: Team[], matches: MatchRow[]): Map<number, Team> {
  const expected = Math.floor(teams.length / 2);
  const byMatchday = new Map<number, MatchRow[]>();
  for (const m of matches) {
    if (m.matchday == null) continue;
    (byMatchday.get(m.matchday) ?? byMatchday.set(m.matchday, []).get(m.matchday)!).push(m);
  }

  const byes = new Map<number, Team>();
  for (const [matchday, ms] of byMatchday) {
    if (ms.length !== expected) continue; // fecha incompleta: no sabemos
    const playing = new Set(ms.flatMap((m) => [m.home_team_id, m.away_team_id]));
    const free = teams.filter((t) => !playing.has(t.id));
    if (free.length === 1) byes.set(matchday, free[0]);
  }
  return byes;
}
