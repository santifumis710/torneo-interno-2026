import "../globals.css";
import "./admin.css";
import { requireAuth } from "@/lib/auth";
import { getAdminData, type MatchRow } from "@/lib/queries";
import {
  updateSettings,
  createZone,
  updateZone,
  deleteZone,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamToZone,
  removeTeamFromZone,
  moveTeamInZone,
  createPlayer,
  updatePlayer,
  deletePlayer,
  uploadPlayerPhoto,
  removePlayerPhoto,
  createMatch,
  createInterzonalMatch,
  updateMatch,
  deleteMatch,
  uploadTeamLogo,
  removeTeamLogo,
  uploadTournamentLogo,
  removeTournamentLogo,
  createChampion,
  updateChampion,
  deleteChampion,
  logoutAction,
} from "./actions";

export const dynamic = "force-dynamic";

/** Nombre visible de una fase. Sale del número de fase de la zona, no está hardcodeado. */
const phaseLabel = (phase: number) => `Fase ${phase}`;

/** ISO (TIMESTAMPTZ) → valor para <input type="datetime-local"> en hora local de Argentina. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const s = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(iso));
  return s.replace(" ", "T");
}

/** Fila de carga/edición de un partido. Se usa en cada zona y en el interzonal. */
function MatchLine({ m, teamName }: { m: MatchRow; teamName: (id: number) => string }) {
  return (
    <div className="match-line">
      <form action={updateMatch} className="match-edit">
        <input type="hidden" name="id" value={m.id} />
        <span className="mt-name" style={{ flex: 1, textAlign: "right" }}>{teamName(m.home_team_id)}</span>
        <input className="mscore" name="home_score" type="number" min={0} defaultValue={m.home_score ?? ""} placeholder="-" />
        <span className="mvs">:</span>
        <input className="mscore" name="away_score" type="number" min={0} defaultValue={m.away_score ?? ""} placeholder="-" />
        <span className="mt-name" style={{ flex: 1 }}>{teamName(m.away_team_id)}</span>
        <input className="mmd" name="matchday" type="number" min={1} defaultValue={m.matchday ?? ""} placeholder="Fecha nº" />
        <input className="mdt" name="scheduled_at" type="datetime-local" defaultValue={toLocalInput(m.scheduled_at)} />
        <button className="btn btn-sec btn-xs" type="submit">Guardar</button>
      </form>
      <form action={deleteMatch}>
        <input type="hidden" name="id" value={m.id} />
        <button className="btn-danger btn-xs" type="submit">✕</button>
      </form>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ fase?: string }>;
}) {
  await requireAuth();
  const { settings, zones, teams, teamsByZone, playersByTeam, matches, champions } = await getAdminData();
  const teamName = (id: number) => teams.find((t) => t.id === id)?.name ?? "?";

  // Fases existentes, de la más nueva a la más vieja. El fixture se carga por fase.
  const phases = [...new Set(zones.map((z) => z.phase))].sort((a, b) => b - a);
  const latestPhase = phases[0] ?? 1;
  const nextPhase = latestPhase + 1;

  // La fase que se está cargando: por defecto la más nueva (la de los partidos nuevos).
  const askedPhase = Number((await searchParams).fase);
  const phase = phases.includes(askedPhase) ? askedPhase : latestPhase;
  const phaseZones = zones.filter((z) => z.phase === phase);

  // Un partido es interzonal cuando sus dos equipos son de zonas distintas de la
  // misma fase. No hay marca en la base: se deduce de los equipos.
  const zoneOfTeam = new Map<number, number>();
  for (const z of phaseZones) for (const t of teamsByZone[z.id] ?? []) zoneOfTeam.set(t.id, z.id);
  const phaseZoneIds = new Set(phaseZones.map((z) => z.id));
  const isInterzonal = (m: MatchRow) => {
    const home = zoneOfTeam.get(m.home_team_id);
    const away = zoneOfTeam.get(m.away_team_id);
    return home !== undefined && away !== undefined && home !== away;
  };
  const interzonalMatches = matches.filter((m) => phaseZoneIds.has(m.zone_id) && isInterzonal(m));

  /** Zonas (de cualquier fase) en las que juega un equipo — solo informativo. */
  const zonesOf = (teamId: number) =>
    zones.filter((z) => (teamsByZone[z.id] ?? []).some((t) => t.id === teamId));

  return (
    <div className="admin-wrap">
      <div className="admin-top">
        <h1>Administración</h1>
        <div className="spacer" />
        <a href="/">Ver torneo →</a>
        <form action={logoutAction}>
          <button className="btn btn-sec" type="submit">Salir</button>
        </form>
      </div>

      {/* ---------- 1. Partidos (lo que el profe usa todas las semanas) ---------- */}
      <details className="a-card" id="partidos" open>
        <summary>
          <h2>Partidos y resultados</h2>
          <span className="sum-hint">{phaseLabel(phase)}</span>
        </summary>

        <p className="hint">
          Cargá los partidos y los resultados. La tabla de posiciones y el fixture se actualizan solos.
        </p>

        {phases.length > 1 && (
          <div className="phase-tabs" role="group" aria-label="Elegir fase">
            {phases.map((p) => (
              <a
                key={p}
                className={`chip ${p === phase ? "active" : ""}`}
                href={`/admin?fase=${p}#partidos`}
              >
                {phaseLabel(p)}
              </a>
            ))}
          </div>
        )}

        {phaseZones.length === 0 && (
          <p className="hint">No hay zonas en esta fase. Creá las zonas en «Zonas y fases».</p>
        )}

        {phaseZones.map((zone) => {
          const zoneTeams = teamsByZone[zone.id] ?? [];
          // Los cruces se cargan y se editan abajo, en «Interzonal».
          const zoneMatches = matches.filter((m) => m.zone_id === zone.id && !isInterzonal(m));
          return (
            <div className="zone-sub" key={zone.id}>
              <h3>{zone.name}</h3>

              {/* Agregar partido primero: es lo que más se usa. */}
              {zoneTeams.length < 2 ? (
                <p className="hint">Necesitás al menos 2 equipos en la zona para cargar un partido.</p>
              ) : (
                <form action={createMatch} className="match-add">
                  <input type="hidden" name="zone_id" value={zone.id} />
                  <select name="home_team_id" defaultValue="" required>
                    <option value="" disabled>Local</option>
                    {zoneTeams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <span className="mvs">vs</span>
                  <select name="away_team_id" defaultValue="" required>
                    <option value="" disabled>Visitante</option>
                    {zoneTeams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <input className="mmd" name="matchday" type="number" min={1} placeholder="Fecha nº" />
                  <input className="mdt" name="scheduled_at" type="datetime-local" />
                  <button className="btn btn-xs" type="submit">Agregar partido</button>
                </form>
              )}

              {zoneMatches.length === 0 && <p className="hint">Sin partidos en esta zona.</p>}
              {zoneMatches.map((m) => (
                <MatchLine key={m.id} m={m} teamName={teamName} />
              ))}
            </div>
          );
        })}

        {/* Cruces entre zonas de esta fase. Viven acá y no adentro de una zona,
            así cada partido se carga y se edita en un solo lugar. */}
        {phaseZones.length > 1 && (
          <div className="zone-sub">
            <h3>Interzonal</h3>
            <p className="hint">
              Partidos entre equipos de zonas distintas de {phaseLabel(phase).toLowerCase()}. Cada uno le suma
              a su equipo en la tabla de su zona, y en el fixture salen juntos, aparte de las zonas.
            </p>

            <form action={createInterzonalMatch} className="match-add">
              <input type="hidden" name="phase" value={phase} />
              <select name="home_team_id" defaultValue="" required>
                <option value="" disabled>Local</option>
                {phaseZones.map((z) => (
                  <optgroup key={z.id} label={z.name}>
                    {(teamsByZone[z.id] ?? []).map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span className="mvs">vs</span>
              <select name="away_team_id" defaultValue="" required>
                <option value="" disabled>Visitante</option>
                {phaseZones.map((z) => (
                  <optgroup key={z.id} label={z.name}>
                    {(teamsByZone[z.id] ?? []).map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input className="mmd" name="matchday" type="number" min={1} placeholder="Fecha nº" />
              <input className="mdt" name="scheduled_at" type="datetime-local" />
              <button className="btn btn-xs" type="submit">Agregar partido</button>
            </form>

            {interzonalMatches.length === 0 && <p className="hint">Sin partidos interzonales en esta fase.</p>}
            {interzonalMatches.map((m) => (
              <MatchLine key={m.id} m={m} teamName={teamName} />
            ))}
          </div>
        )}
      </details>

      {/* ---------- 2. Zonas y fases ---------- */}
      <details className="a-card">
        <summary>
          <h2>Zonas y fases</h2>
          <span className="sum-hint">{zones.length} zonas</span>
        </summary>

        <p className="hint">
          Cada zona pertenece a una fase. Un mismo equipo puede estar en una zona de cada fase:
          acá elegís qué equipos juegan en cada zona. Sacar un equipo de la zona <b>no</b> lo borra.
        </p>

        {zones.length === 0 && <p className="hint">Todavía no hay zonas. Agregá la primera abajo.</p>}

        {phases.map((p) => (
          <div key={p}>
            <h3 className="phase-h">{phaseLabel(p)}</h3>
            {zones
              .filter((z) => z.phase === p)
              .map((zone) => {
                const zoneTeams = teamsByZone[zone.id] ?? [];
                const available = teams.filter((t) => !zoneTeams.some((zt) => zt.id === t.id));
                return (
                  <div className="zone-block" key={zone.id}>
                    <div className="row" style={{ marginBottom: 6 }}>
                      <form action={updateZone} className="row" style={{ flex: 1 }}>
                        <input type="hidden" name="id" value={zone.id} />
                        <div className="field grow">
                          <label>Nombre de la zona</label>
                          <input name="name" defaultValue={zone.name} required />
                        </div>
                        <div className="field narrow">
                          <label>Clasifican</label>
                          <input name="qualifiers_count" type="number" min={0} defaultValue={zone.qualifiers_count} />
                        </div>
                        <button className="btn btn-sec" type="submit">Guardar</button>
                      </form>
                      <form action={deleteZone}>
                        <input type="hidden" name="id" value={zone.id} />
                        <button className="btn-danger" type="submit">Borrar zona</button>
                      </form>
                    </div>

                    <hr className="divider" />

                    {zoneTeams.length === 0 && <p className="hint">Sin equipos en esta zona.</p>}
                    {zoneTeams.length > 1 && (
                      <p className="hint">
                        El orden de acá abajo decide quién va primero en la tabla cuando dos
                        equipos están empatados en todo (puntos, diferencia y goles a favor).
                      </p>
                    )}
                    {zoneTeams.map((team, i) => (
                      <div className="zteam-line" key={team.id}>
                        <span className="zteam-pos">{i + 1}</span>
                        {team.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className="logo-mini" src={team.logo_url} alt={team.name} />
                        ) : (
                          <span className="logo-mini logo-mini-ph" />
                        )}
                        <span className="zteam-name">{team.name}</span>
                        <form action={moveTeamInZone}>
                          <input type="hidden" name="zone_id" value={zone.id} />
                          <input type="hidden" name="team_id" value={team.id} />
                          <input type="hidden" name="dir" value="up" />
                          <button
                            className="btn btn-sec btn-xs"
                            type="submit"
                            disabled={i === 0}
                            aria-label={`Subir ${team.name}`}
                          >
                            ↑
                          </button>
                        </form>
                        <form action={moveTeamInZone}>
                          <input type="hidden" name="zone_id" value={zone.id} />
                          <input type="hidden" name="team_id" value={team.id} />
                          <input type="hidden" name="dir" value="down" />
                          <button
                            className="btn btn-sec btn-xs"
                            type="submit"
                            disabled={i === zoneTeams.length - 1}
                            aria-label={`Bajar ${team.name}`}
                          >
                            ↓
                          </button>
                        </form>
                        <form action={removeTeamFromZone}>
                          <input type="hidden" name="zone_id" value={zone.id} />
                          <input type="hidden" name="team_id" value={team.id} />
                          <button className="btn-danger btn-xs" type="submit">Quitar</button>
                        </form>
                      </div>
                    ))}

                    {available.length > 0 && (
                      <form action={addTeamToZone} className="row add-inline">
                        <input type="hidden" name="zone_id" value={zone.id} />
                        <div className="field grow">
                          <label>Sumar un equipo que ya existe</label>
                          <select name="team_id" defaultValue="" required>
                            <option value="" disabled>Elegir equipo…</option>
                            {available.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                        <button className="btn" type="submit">Sumar</button>
                      </form>
                    )}

                    <form action={createTeam} className="row add-inline">
                      <input type="hidden" name="zone_id" value={zone.id} />
                      <div className="field grow">
                        <label>…o crear un equipo nuevo en esta zona</label>
                        <input name="name" placeholder="Nombre del equipo" required />
                      </div>
                      <button className="btn btn-sec" type="submit">Crear</button>
                    </form>
                  </div>
                );
              })}
          </div>
        ))}

        <hr className="divider" />
        <form action={createZone} className="row">
          <div className="field grow">
            <label>Nueva zona</label>
            <input name="name" placeholder="Nombre de la zona" required />
          </div>
          <div className="field narrow">
            <label>Fase</label>
            <select name="phase" defaultValue={String(latestPhase)}>
              {phases.map((p) => (
                <option key={p} value={p}>{phaseLabel(p)}</option>
              ))}
              <option value={nextPhase}>{phaseLabel(nextPhase)} (nueva)</option>
            </select>
          </div>
          <div className="field narrow">
            <label>Clasifican</label>
            <input name="qualifiers_count" type="number" min={0} defaultValue={0} />
          </div>
          <button className="btn" type="submit">Agregar zona</button>
        </form>
      </details>

      {/* ---------- 3. Equipos y jugadores ---------- */}
      <details className="a-card">
        <summary>
          <h2>Equipos y jugadores</h2>
          <span className="sum-hint">{teams.length} equipos</span>
        </summary>

        <p className="hint">
          Nombre, escudo y plantel de cada equipo. En qué zona juega se decide en «Zonas y fases».
        </p>

        {teams.length === 0 && <p className="hint">Todavía no hay equipos. Creá el primero desde «Zonas y fases».</p>}

        {teams.map((team) => {
          const roster = playersByTeam[team.id] ?? [];
          const inZones = zonesOf(team.id);
          return (
            <details className="team-block" key={team.id}>
              <summary>
                <span className="zteam-name">{team.name}</span>
                <span className="sum-hint">
                  {roster.length} jugadores
                  {inZones.length > 0 && ` · ${inZones.map((z) => z.name).join(" · ")}`}
                </span>
              </summary>

              <div className="team-line">
                <form action={updateTeam} className="team-edit">
                  <input type="hidden" name="id" value={team.id} />
                  <input name="name" defaultValue={team.name} required />
                  <button className="btn btn-sec" type="submit">Guardar nombre</button>
                </form>
                <form action={deleteTeam}>
                  <input type="hidden" name="id" value={team.id} />
                  <button className="btn-danger" type="submit">Borrar equipo</button>
                </form>
              </div>

              {/* Logo del equipo */}
              <div className="logo-row">
                {team.logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="logo-mini" src={team.logo_url} alt={team.name} />
                )}
                <form action={uploadTeamLogo} className="logo-row" style={{ flex: 1, marginTop: 0 }}>
                  <input type="hidden" name="id" value={team.id} />
                  <input type="file" name="logo" accept="image/*" required />
                  <button className="btn btn-xs" type="submit">Subir logo</button>
                </form>
                {team.logo_url && (
                  <form action={removeTeamLogo}>
                    <input type="hidden" name="id" value={team.id} />
                    <button className="btn-danger btn-xs" type="submit">Quitar</button>
                  </form>
                )}
              </div>

              {/* Jugadores del equipo */}
              <div className="players">
                <div className="lbl">Jugadores ({roster.length})</div>
                <form action={createPlayer} className="player-line">
                  <input type="hidden" name="team_id" value={team.id} />
                  <input name="number" type="number" min={0} placeholder="#" style={{ flex: "0 0 58px", textAlign: "center" }} />
                  <input name="name" placeholder="Agregar jugador" required style={{ flex: 1 }} />
                  <button className="btn btn-xs" type="submit">Agregar</button>
                </form>
                {roster.map((pl) => (
                  <div className="player-block" key={pl.id}>
                    <div className="player-line">
                      {pl.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="player-mini" src={pl.photo_url} alt={pl.name} />
                      ) : (
                        <span className="player-mini player-mini-ph">{pl.number ?? "?"}</span>
                      )}
                      <form action={updatePlayer} className="player-edit">
                        <input type="hidden" name="id" value={pl.id} />
                        <input name="number" type="number" min={0} defaultValue={pl.number ?? ""} placeholder="#" />
                        <input name="name" defaultValue={pl.name} required />
                        <button className="btn btn-sec btn-xs" type="submit">Guardar</button>
                      </form>
                      <form action={deletePlayer}>
                        <input type="hidden" name="id" value={pl.id} />
                        <button className="btn-danger btn-xs" type="submit">✕</button>
                      </form>
                    </div>
                    <div className="logo-row" style={{ marginTop: 4 }}>
                      <form action={uploadPlayerPhoto} className="logo-row" style={{ flex: 1, marginTop: 0 }}>
                        <input type="hidden" name="id" value={pl.id} />
                        <input type="file" name="photo" accept="image/*" required />
                        <button className="btn btn-xs" type="submit">Subir foto</button>
                      </form>
                      {pl.photo_url && (
                        <form action={removePlayerPhoto}>
                          <input type="hidden" name="id" value={pl.id} />
                          <button className="btn-danger btn-xs" type="submit">Quitar</button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
      </details>

      {/* ---------- 4. Historial de campeones ---------- */}
      <details className="a-card">
        <summary>
          <h2>Historial de campeones</h2>
          <span className="sum-hint">{champions.length} ediciones</span>
        </summary>

        <p className="hint">
          Los campeones de ediciones anteriores. Se ven en la pestaña <b>Historial</b> de la web,
          en el orden en que aparecen acá.
        </p>

        {champions.length === 0 && <p className="hint">Todavía no hay campeones cargados.</p>}
        {champions.map((c) => (
          <div className="champ-line" key={c.id}>
            <form action={updateChampion} className="champ-edit">
              <input type="hidden" name="id" value={c.id} />
              <input className="cseason" name="season" defaultValue={c.season} required />
              <input name="champion" defaultValue={c.champion} required style={{ flex: 1 }} />
              <button className="btn btn-sec btn-xs" type="submit">Guardar</button>
            </form>
            <form action={deleteChampion}>
              <input type="hidden" name="id" value={c.id} />
              <button className="btn-danger btn-xs" type="submit">✕</button>
            </form>
          </div>
        ))}

        <form action={createChampion} className="champ-line" style={{ marginTop: 10 }}>
          <input className="cseason" name="season" placeholder="Año" required />
          <input name="champion" placeholder="Campeón" required style={{ flex: 1 }} />
          <button className="btn btn-xs" type="submit">Agregar</button>
        </form>
      </details>

      {/* ---------- 5. Configuración del torneo ---------- */}
      <details className="a-card">
        <summary>
          <h2>Torneo</h2>
          <span className="sum-hint">Nombre, logo y puntaje</span>
        </summary>

        <form action={updateSettings}>
          <div className="field">
            <label htmlFor="tn">Nombre del torneo</label>
            <input id="tn" name="tournament_name" defaultValue={settings.tournament_name} required />
          </div>
          <div className="field">
            <label htmlFor="st">Subtítulo</label>
            <input id="st" name="subtitle" defaultValue={settings.subtitle} />
          </div>
          <div className="row">
            <div className="field narrow">
              <label htmlFor="pw">Pts victoria</label>
              <input id="pw" name="points_win" type="number" defaultValue={settings.points_win} min={0} />
            </div>
            <div className="field narrow">
              <label htmlFor="pd">Pts empate</label>
              <input id="pd" name="points_draw" type="number" defaultValue={settings.points_draw} min={0} />
            </div>
            <button className="btn" type="submit">Guardar</button>
          </div>
        </form>

        <div className="logo-row">
          {settings.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="logo-mini" src={settings.logo_url} alt="Logo del torneo" />
          )}
          <form action={uploadTournamentLogo} className="logo-row" style={{ flex: 1, marginTop: 0 }}>
            <input type="file" name="logo" accept="image/*" required />
            <button className="btn btn-xs" type="submit">Subir logo del torneo</button>
          </form>
          {settings.logo_url && (
            <form action={removeTournamentLogo}>
              <button className="btn-danger btn-xs" type="submit">Quitar</button>
            </form>
          )}
        </div>
      </details>
    </div>
  );
}
