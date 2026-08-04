import "../globals.css";
import "./admin.css";
import { requireAuth } from "@/lib/auth";
import { getAdminData } from "@/lib/queries";
import {
  updateSettings,
  createZone,
  updateZone,
  deleteZone,
  createTeam,
  updateTeam,
  deleteTeam,
  createPlayer,
  updatePlayer,
  deletePlayer,
  createMatch,
  updateMatch,
  deleteMatch,
  uploadTeamLogo,
  removeTeamLogo,
  uploadTournamentLogo,
  removeTournamentLogo,
  createTie,
  updateTie,
  deleteTie,
  logoutAction,
} from "./actions";

const PLAYOFF_ROUNDS = [
  { round: 0, name: "Cuartos" },
  { round: 1, name: "Semifinales" },
  { round: 2, name: "Final" },
];

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAuth();
  const { settings, zones, teams, playersByTeam, matches, ties } = await getAdminData();
  const teamName = (id: number) => teams.find((t) => t.id === id)?.name ?? "?";

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

      {/* Configuración del torneo */}
      <div className="a-card">
        <h2>Torneo</h2>
        <p className="hint">Nombre, subtítulo y puntaje. El logo se agrega en el próximo paso.</p>
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
      </div>

      {/* Zonas y equipos */}
      <div className="a-card">
        <h2>Zonas y equipos</h2>
        <p className="hint">Renombrá, agregá o borrá zonas y equipos. Borrar una zona borra sus equipos.</p>

        {zones.length === 0 && <p className="hint">Todavía no hay zonas. Agregá la primera abajo.</p>}

        {zones.map((zone) => {
          const zoneTeams = teams.filter((t) => t.zone_id === zone.id);
          return (
            <div className="zone-block" key={zone.id}>
              {/* Editar / borrar zona */}
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

              {/* Equipos de la zona */}
              {zoneTeams.length === 0 && <p className="hint">Sin equipos en esta zona.</p>}
              {zoneTeams.map((team) => {
                const roster = playersByTeam[team.id] ?? [];
                return (
                  <div className="team-block" key={team.id}>
                    <div className="team-line">
                      <form action={updateTeam} className="team-edit">
                        <input type="hidden" name="id" value={team.id} />
                        <input name="name" defaultValue={team.name} required />
                        <select name="zone_id" defaultValue={team.zone_id}>
                          {zones.map((z) => (
                            <option key={z.id} value={z.id}>
                              {z.name}
                            </option>
                          ))}
                        </select>
                        <button className="btn btn-sec" type="submit">Guardar</button>
                      </form>
                      <form action={deleteTeam}>
                        <input type="hidden" name="id" value={team.id} />
                        <button className="btn-danger" type="submit">Borrar</button>
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
                      {roster.map((pl) => (
                        <div className="player-line" key={pl.id}>
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
                      ))}
                      <form action={createPlayer} className="player-line">
                        <input type="hidden" name="team_id" value={team.id} />
                        <input name="number" type="number" min={0} placeholder="#" style={{ flex: "0 0 58px", textAlign: "center" }} />
                        <input name="name" placeholder="Agregar jugador" required style={{ flex: 1 }} />
                        <button className="btn btn-xs" type="submit">Agregar</button>
                      </form>
                    </div>
                  </div>
                );
              })}

              {/* Agregar equipo a la zona */}
              <form action={createTeam} className="row add-inline">
                <input type="hidden" name="zone_id" value={zone.id} />
                <div className="field grow">
                  <label>Agregar equipo</label>
                  <input name="name" placeholder="Nombre del equipo" required />
                </div>
                <button className="btn" type="submit">Agregar</button>
              </form>
            </div>
          );
        })}

        {/* Agregar zona */}
        <hr className="divider" />
        <form action={createZone} className="row">
          <div className="field grow">
            <label>Nueva zona</label>
            <input name="name" placeholder="Nombre de la zona" required />
          </div>
          <div className="field narrow">
            <label>Clasifican</label>
            <input name="qualifiers_count" type="number" min={0} defaultValue={4} />
          </div>
          <button className="btn" type="submit">Agregar zona</button>
        </form>
      </div>

      {/* Partidos */}
      <div className="a-card">
        <h2>Partidos</h2>
        <p className="hint">Cargá los resultados. La tabla de posiciones y el fixture se actualizan solos.</p>

        {zones.length === 0 && <p className="hint">Primero creá zonas y equipos.</p>}

        {zones.map((zone) => {
          const zoneTeams = teams.filter((t) => t.zone_id === zone.id);
          const zoneMatches = matches.filter((m) => m.zone_id === zone.id);
          return (
            <div className="zone-sub" key={zone.id}>
              <h3>{zone.name}</h3>

              {zoneMatches.length === 0 && <p className="hint">Sin partidos en esta zona.</p>}
              {zoneMatches.map((m) => (
                <div className="match-line" key={m.id}>
                  <form action={updateMatch} className="match-edit">
                    <input type="hidden" name="id" value={m.id} />
                    <span className="mt-name" style={{ flex: 1, textAlign: "right" }}>
                      {teamName(m.home_team_id)}
                    </span>
                    <input className="mscore" name="home_score" type="number" min={0} defaultValue={m.home_score ?? ""} placeholder="-" />
                    <span className="mvs">:</span>
                    <input className="mscore" name="away_score" type="number" min={0} defaultValue={m.away_score ?? ""} placeholder="-" />
                    <span className="mt-name" style={{ flex: 1 }}>{teamName(m.away_team_id)}</span>
                    <input className="mmd" name="matchday" type="number" min={1} defaultValue={m.matchday ?? ""} placeholder="Fecha" />
                    <button className="btn btn-sec btn-xs" type="submit">Guardar</button>
                  </form>
                  <form action={deleteMatch}>
                    <input type="hidden" name="id" value={m.id} />
                    <button className="btn-danger btn-xs" type="submit">✕</button>
                  </form>
                </div>
              ))}

              {/* Agregar partido */}
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
                  <input className="mmd" name="matchday" type="number" min={1} placeholder="Fecha" />
                  <button className="btn btn-xs" type="submit">Agregar partido</button>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {/* Playoffs */}
      <div className="a-card">
        <h2>Playoffs</h2>
        <p className="hint">
          Definí los cruces (podés escribir la referencia, ej. <b>1°A</b>, y/o asignar el equipo).
          Con los dos goles, el cruce queda resuelto. El cuadro se ve en la web.
        </p>

        {PLAYOFF_ROUNDS.map(({ round, name }) => {
          const roundTies = ties.filter((t) => t.round === round);
          return (
            <div className="zone-sub" key={round}>
              <h3>{name}</h3>

              {roundTies.length === 0 && <p className="hint">Sin cruces en esta instancia.</p>}
              {roundTies.map((t) => (
                <div className="tie-line" key={t.id}>
                  <form action={updateTie} className="tie-edit">
                    <input type="hidden" name="id" value={t.id} />
                    <input className="tlabel" name="home_label" defaultValue={t.home_label ?? ""} placeholder="1°A" />
                    <select name="home_team_id" defaultValue={t.home_team_id ?? ""}>
                      <option value="">— equipo —</option>
                      {teams.map((tm) => (
                        <option key={tm.id} value={tm.id}>{tm.name}</option>
                      ))}
                    </select>
                    <input className="mscore" name="home_score" type="number" min={0} defaultValue={t.home_score ?? ""} placeholder="-" />
                    <span className="mvs">:</span>
                    <input className="mscore" name="away_score" type="number" min={0} defaultValue={t.away_score ?? ""} placeholder="-" />
                    <select name="away_team_id" defaultValue={t.away_team_id ?? ""}>
                      <option value="">— equipo —</option>
                      {teams.map((tm) => (
                        <option key={tm.id} value={tm.id}>{tm.name}</option>
                      ))}
                    </select>
                    <input className="tlabel" name="away_label" defaultValue={t.away_label ?? ""} placeholder="4°B" />
                    <button className="btn btn-sec btn-xs" type="submit">Guardar</button>
                  </form>
                  <form action={deleteTie}>
                    <input type="hidden" name="id" value={t.id} />
                    <button className="btn-danger btn-xs" type="submit">✕</button>
                  </form>
                </div>
              ))}

              <form action={createTie} className="tie-add">
                <input type="hidden" name="round" value={round} />
                <input className="tlabel" name="home_label" placeholder="Local" />
                <span className="mvs">vs</span>
                <input className="tlabel" name="away_label" placeholder="Visitante" />
                <button className="btn btn-xs" type="submit">Agregar cruce</button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
