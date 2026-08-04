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
  logoutAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAuth();
  const { settings, zones, teams, playersByTeam } = await getAdminData();

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

      <div className="a-card">
        <h2>Próximamente</h2>
        <p className="hint">
          En los siguientes pasos: subir logos de equipos y del torneo, cargar partidos (la tabla se
          calcula sola) y armar los cruces de playoffs.
        </p>
      </div>
    </div>
  );
}
