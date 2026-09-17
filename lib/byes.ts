import type { MatchRow, Team } from "./queries";

/**
 * Deduce en qué fechas queda libre un equipo de la zona (fecha → equipo libre).
 *
 * Una fecha solo se considera **completa** si juegan exactamente `equipos - 1`
 * equipos de la zona: con 7 equipos, 6. Si el profe todavía no cargó todos los
 * partidos de la fecha, no se afirma nada — "no aparece en ningún partido" no
 * alcanza, porque puede ser que el partido falte cargar.
 *
 * Con esa regla, una zona de equipos pares nunca tiene libres (juegan todos) y
 * agregar un equipo a mitad de torneo no inventa libres en las fechas viejas.
 *
 * Cuenta equipos y no partidos porque un **interzonal** mete en la fecha un
 * partido que solo ocupa a uno de los equipos de la zona. Y si la fecha tiene
 * algún interzonal, directamente no se afirma nada: en un cruce los equipos
 * pueden repartirse de cualquier forma y un "libre" deducido sería puro invento.
 *
 * Es una función pura: se calcula en el cliente con los datos que ya bajan, sin
 * tocar la base.
 */
export function computeByes(teams: Team[], matches: MatchRow[]): Map<number, Team> {
  const ids = new Set(teams.map((t) => t.id));
  const byMatchday = new Map<number, MatchRow[]>();
  for (const m of matches) {
    if (m.matchday == null) continue;
    (byMatchday.get(m.matchday) ?? byMatchday.set(m.matchday, []).get(m.matchday)!).push(m);
  }

  const byes = new Map<number, Team>();
  for (const [matchday, ms] of byMatchday) {
    const playing = new Set<number>();
    let interzonal = false;
    for (const m of ms) {
      const home = ids.has(m.home_team_id);
      const away = ids.has(m.away_team_id);
      if (home !== away) interzonal = true; // solo uno de los dos es de la zona
      if (home) playing.add(m.home_team_id);
      if (away) playing.add(m.away_team_id);
    }
    if (interzonal) continue; // fecha con cruces: no sabemos
    if (playing.size !== teams.length - 1) continue; // fecha incompleta: no sabemos
    const free = teams.filter((t) => !playing.has(t.id));
    if (free.length === 1) byes.set(matchday, free[0]);
  }
  return byes;
}
