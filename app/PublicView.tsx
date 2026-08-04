"use client";

import { useState } from "react";
import "./tournament.css";
import type { PublicData, StandingRow, Team } from "@/lib/queries";

const COLORS = ["#123a86", "#1f9d55", "#d94a3d", "#7a3fb0", "#0d8f9e", "#c85a12", "#334155", "#b02a5b"];

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

export default function PublicView({ data }: { data: PublicData }) {
  const [tab, setTab] = useState<"posiciones" | "fixture" | "playoffs">("posiciones");
  const { settings, zones, ties, teamsById } = data;

  function toggleTheme() {
    const root = document.documentElement;
    const cur =
      root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
  }

  const nameOf = (id: number | null, label: string | null) =>
    (id !== null ? teamsById[id]?.name : null) ?? label ?? "Por definir";

  const rounds = [...new Set(ties.map((t) => t.round))].sort((a, b) => a - b);
  const anyMatches = zones.some((z) => z.matches.length > 0);

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
          {(["posiciones", "fixture", "playoffs"] as const).map((t) => (
            <button key={t} className="tab" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>
              {t === "posiciones" ? "Posiciones" : t === "fixture" ? "Fixture" : "Playoffs"}
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
                    {z.matches.map((m) => {
                      const pending = !m.played || m.home_score === null;
                      return (
                        <div className="match" key={m.id}>
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
                      );
                    })}
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
      </main>
    </>
  );
}
