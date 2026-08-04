"use client";

import { useEffect, useState } from "react";
import "./tournament.css";
import type { MatchRow, Player, PublicData, StandingRow, Team } from "@/lib/queries";

const COLORS = ["#123a86", "#1f9d55", "#d94a3d", "#7a3fb0", "#0d8f9e", "#c85a12", "#334155", "#b02a5b"];

const TZ = "America/Argentina/Buenos_Aires";

/** Formatea la fecha/hora de un partido en horario de Argentina (ej. "sáb 09 ago · 18:30 hs"). */
function formatMatchDateTime(iso: string): string {
  const d = new Date(iso);
  const fecha = new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ, weekday: "short", day: "2-digit", month: "short",
  }).format(d);
  const hora = new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(d);
  return `${fecha} · ${hora} hs`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function colorFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % COLORS.length;
  return COLORS[h];
}

function TeamLogo({ team }: { team: Pick<Team, "name" | "logo_url"> }) {
  if (team.logo_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="logo logo-img" src={team.logo_url} alt={team.name} />;
  }
  return (
    <span className="logo" style={{ background: colorFor(team.name) }}>
      {initials(team.name)}
    </span>
  );
}

function PlayerAvatar({ player }: { player: Pick<Player, "name" | "photo_url"> }) {
  if (player.photo_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="pavatar pavatar-img" src={player.photo_url} alt={player.name} />;
  }
  return (
    <span className="pavatar" style={{ background: colorFor(player.name) }}>
      {initials(player.name)}
    </span>
  );
}

function ZoneTable({ name, qualifiers, standings }: { name: string; qualifiers: number; standings: StandingRow[] }) {
  return (
    <div className="card">
      <div className="card-head">
        <h2>{name}</h2>
        {standings.length > 0 && <span className="badge">Clasifican {qualifiers}</span>}
      </div>
      {standings.length === 0 ? (
        <div className="empty">Todavía no hay equipos en esta zona.</div>
      ) : (
        <>
          <div className="tscroll">
            <table className="standings">
              <thead>
                <tr>
                  <th className="pos">#</th>
                  <th className="team">Equipo</th>
                  <th>PJ</th>
                  <th>G</th>
                  <th>E</th>
                  <th>P</th>
                  <th>GF</th>
                  <th>GC</th>
                  <th>DIF</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((r, i) => (
                  <tr key={r.team.id} className={i < qualifiers ? "qual" : ""}>
                    <td className="pos">
                      <span className="num-pos">{i + 1}</span>
                    </td>
                    <td className="team">
                      <TeamLogo team={r.team} />
                      <span className="team-name">{r.team.name}</span>
                    </td>
                    <td>{r.pj}</td>
                    <td>{r.g}</td>
                    <td>{r.e}</td>
                    <td>{r.p}</td>
                    <td>{r.gf}</td>
                    <td>{r.gc}</td>
                    <td>
                      {r.dif > 0 ? "+" : ""}
                      {r.dif}
                    </td>
                    <td className="pts">{r.pts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="legend">
            <span className="swatch" /> Zona de clasificación a playoffs
          </div>
        </>
      )}
    </div>
  );
}

const ROUND_NAMES: Record<number, string> = { 0: "Cuartos", 1: "Semifinales", 2: "Final", 3: "Definición" };

type TabKey = "posiciones" | "equipos" | "fixture" | "playoffs" | "miequipo";
const TAB_LABELS: Record<TabKey, string> = {
  posiciones: "Posiciones",
  equipos: "Equipos",
  fixture: "Fixture",
  playoffs: "Playoffs",
  miequipo: "Mi equipo",
};
const TAB_ORDER: TabKey[] = ["posiciones", "equipos", "fixture", "playoffs", "miequipo"];

export default function PublicView({ data }: { data: PublicData }) {
  const [tab, setTab] = useState<TabKey>("posiciones");
  const [myTeamId, setMyTeamId] = useState<number | null>(null);
  const { settings, zones, ties, teamsById, playersByTeam } = data;

  // Recupera el equipo elegido del navegador (queda pegado entre visitas).
  useEffect(() => {
    const saved = Number(localStorage.getItem("miEquipo"));
    if (saved && teamsById[saved]) setMyTeamId(saved);
  }, [teamsById]);

  function chooseTeam(id: number | null) {
    setMyTeamId(id);
    if (id) localStorage.setItem("miEquipo", String(id));
    else localStorage.removeItem("miEquipo");
  }

  function toggleTheme() {
    const root = document.documentElement;
    const cur =
      root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
  }

  const nameOf = (id: number | null, label: string | null) =>
    (id !== null ? teamsById[id]?.name : null) ?? label ?? "Por definir";

  const renderMatch = (m: MatchRow) => {
    const pending = !m.played || m.home_score === null;
    return (
      <div className="match-wrap" key={m.id}>
        {m.scheduled_at && <div className="match-date">{formatMatchDateTime(m.scheduled_at)}</div>}
        <div className="match">
          <div className="side home">
            <span className="team-name">{nameOf(m.home_team_id, null)}</span>
            <TeamLogo team={teamsById[m.home_team_id] ?? { name: "?", logo_url: null }} />
          </div>
          {pending ? (
            <div className="score pending">VS</div>
          ) : (
            <div className="score">
              {m.home_score} - {m.away_score}
            </div>
          )}
          <div className="side away">
            <TeamLogo team={teamsById[m.away_team_id] ?? { name: "?", logo_url: null }} />
            <span className="team-name">{nameOf(m.away_team_id, null)}</span>
          </div>
        </div>
      </div>
    );
  };

  const rounds = [...new Set(ties.map((t) => t.round))].sort((a, b) => a - b);
  const anyMatches = zones.some((z) => z.matches.length > 0);
  const anyTeams = zones.some((z) => z.teams.length > 0);

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          {settings.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="crest crest-img" src={settings.logo_url} alt="Logo del torneo" />
          ) : (
            <div className="crest">UTN</div>
          )}
          <div className="title">
            <h1>{settings.tournament_name}</h1>
            <p>{settings.subtitle}</p>
          </div>
          <div className="spacer" />
          <button className="theme-btn" type="button" onClick={toggleTheme}>
            Tema
          </button>
        </div>
      </header>

      <main className="wrap">
        <div className="tabs" role="tablist">
          {TAB_ORDER.map((t) => (
            <button key={t} className="tab" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {TAB_LABELS[t]}
            </button>
          ))}
        </div>

        {tab === "posiciones" &&
          (zones.length === 0 ? (
            <div className="card empty">Todavía no hay zonas cargadas.</div>
          ) : (
            <section className="panel">
              <div className="zones">
                {zones.map((z) => (
                  <ZoneTable
                    key={z.zone.id}
                    name={z.zone.name}
                    qualifiers={z.zone.qualifiers_count}
                    standings={z.standings}
                  />
                ))}
              </div>
              <p className="note">Los primeros de cada zona clasifican al playoff.</p>
            </section>
          ))}

        {tab === "equipos" &&
          (!anyTeams ? (
            <div className="card empty">Todavía no hay equipos cargados.</div>
          ) : (
            <section className="panel">
              {zones
                .filter((z) => z.teams.length > 0)
                .map((z) => (
                  <div key={z.zone.id}>
                    <div className="zone-title">{z.zone.name}</div>
                    <div className="teams-grid">
                      {z.teams.map((team) => {
                        const roster = playersByTeam[team.id] ?? [];
                        return (
                          <div className="card" key={team.id}>
                            <div className="team-card-head">
                              <TeamLogo team={team} />
                              <span className="name">{team.name}</span>
                            </div>
                            {roster.length === 0 ? (
                              <div className="empty-r">Sin jugadores cargados.</div>
                            ) : (
                              <ul className="roster">
                                {roster.map((pl) => (
                                  <li key={pl.id}>
                                    <PlayerAvatar player={pl} />
                                    <span className="pnum">{pl.number ?? "–"}</span>
                                    <span>{pl.name}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </section>
          ))}

        {tab === "fixture" &&
          (!anyMatches ? (
            <div className="card empty">Todavía no hay partidos cargados.</div>
          ) : (
            <section className="panel">
              {zones
                .filter((z) => z.matches.length > 0)
                .map((z) => (
                  <div className="card" key={z.zone.id}>
                    <div className="card-head">
                      <h2>{z.zone.name}</h2>
                    </div>
                    {z.matches.map(renderMatch)}
                  </div>
                ))}
            </section>
          ))}

        {tab === "playoffs" &&
          (ties.length === 0 ? (
            <div className="card empty">Todavía no hay playoffs definidos.</div>
          ) : (
            <section className="panel">
              <div className="card" style={{ padding: 16 }}>
                <div className="bracket">
                  {rounds.map((round) => (
                    <div key={round}>
                      <div className="round-h">{ROUND_NAMES[round] ?? `Ronda ${round + 1}`}</div>
                      <div className="round">
                        {ties
                          .filter((t) => t.round === round)
                          .map((t) => (
                            <div className="tie" key={t.id}>
                              <div className={`tie-row ${t.played && (t.home_score ?? 0) > (t.away_score ?? 0) ? "win" : ""}`}>
                                <span className="tie-name">
                                  {t.home_label && <span className="seed">{t.home_label}</span>}
                                  {nameOf(t.home_team_id, t.home_label)}
                                </span>
                                <span className="tie-score">{t.played ? t.home_score : "—"}</span>
                              </div>
                              <div className={`tie-row ${t.played && (t.away_score ?? 0) > (t.home_score ?? 0) ? "win" : ""}`}>
                                <span className="tie-name">
                                  {t.away_label && <span className="seed">{t.away_label}</span>}
                                  {nameOf(t.away_team_id, t.away_label)}
                                </span>
                                <span className="tie-score">{t.played ? t.away_score : "—"}</span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}

        {tab === "miequipo" && (() => {
          const myZone = myTeamId != null ? zones.find((z) => z.teams.some((t) => t.id === myTeamId)) : undefined;
          const myTeam = myTeamId != null ? teamsById[myTeamId] : undefined;
          const idx = myZone ? myZone.standings.findIndex((r) => r.team.id === myTeamId) : -1;
          const row = idx >= 0 ? myZone!.standings[idx] : undefined;
          const teamMatches = myZone
            ? myZone.matches.filter((m) => m.home_team_id === myTeamId || m.away_team_id === myTeamId)
            : [];
          const upcoming = teamMatches.filter((m) => !m.played || m.home_score === null);
          const results = teamMatches.filter((m) => m.played && m.home_score !== null).reverse();

          return (
            <section className="panel">
              <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <label className="me-label" htmlFor="me-select">Elegí tu equipo</label>
                <select
                  id="me-select"
                  className="me-select"
                  value={myTeamId ?? ""}
                  onChange={(e) => chooseTeam(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">— Seleccionar equipo —</option>
                  {zones
                    .filter((z) => z.teams.length > 0)
                    .map((z) => (
                      <optgroup key={z.zone.id} label={z.zone.name}>
                        {z.teams.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </optgroup>
                    ))}
                </select>
              </div>

              {!myTeam ? (
                <div className="card empty">Elegí un equipo para ver sus próximos partidos y estadísticas.</div>
              ) : (
                <>
                  <div className="card me-head">
                    <TeamLogo team={myTeam} />
                    <div>
                      <div className="me-name">{myTeam.name}</div>
                      {myZone && (
                        <div className="me-sub">
                          {myZone.zone.name}
                          {idx >= 0 && <> · {idx + 1}° {idx < myZone.zone.qualifiers_count && <span className="me-qual">Zona de clasificación</span>}</>}
                        </div>
                      )}
                    </div>
                  </div>

                  {row && (
                    <div className="card me-stats">
                      <div className="stat"><span className="s-val">{row.pts}</span><span className="s-lbl">Pts</span></div>
                      <div className="stat"><span className="s-val">{row.pj}</span><span className="s-lbl">PJ</span></div>
                      <div className="stat"><span className="s-val">{row.g}</span><span className="s-lbl">G</span></div>
                      <div className="stat"><span className="s-val">{row.e}</span><span className="s-lbl">E</span></div>
                      <div className="stat"><span className="s-val">{row.p}</span><span className="s-lbl">P</span></div>
                      <div className="stat"><span className="s-val">{row.gf}</span><span className="s-lbl">GF</span></div>
                      <div className="stat"><span className="s-val">{row.gc}</span><span className="s-lbl">GC</span></div>
                      <div className="stat"><span className="s-val">{row.dif > 0 ? "+" : ""}{row.dif}</span><span className="s-lbl">DIF</span></div>
                    </div>
                  )}

                  <div className="card">
                    <div className="card-head"><h2>Próximos partidos</h2></div>
                    {upcoming.length === 0 ? (
                      <div className="empty">No hay partidos pendientes.</div>
                    ) : (
                      upcoming.map(renderMatch)
                    )}
                  </div>

                  <div className="card">
                    <div className="card-head"><h2>Últimos resultados</h2></div>
                    {results.length === 0 ? (
                      <div className="empty">Todavía no jugó ningún partido.</div>
                    ) : (
                      results.map(renderMatch)
                    )}
                  </div>
                </>
              )}
            </section>
          );
        })()}
      </main>
    </>
  );
}
