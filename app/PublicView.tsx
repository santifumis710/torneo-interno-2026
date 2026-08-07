"use client";

import { useState } from "react";
import "./tournament.css";
import { computeByes } from "@/lib/byes";
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

/** Etiqueta de día para agrupar el fixture (ej. "sábado 09 de agosto"). */
function formatMatchDay(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: TZ, weekday: "long", day: "2-digit", month: "long",
  }).format(new Date(iso));
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

type TabKey = "posiciones" | "equipos" | "fixture" | "playoffs" | "historial";
const TAB_LABELS: Record<TabKey, string> = {
  posiciones: "Posiciones",
  equipos: "Equipos",
  fixture: "Fixture",
  playoffs: "Playoffs",
  historial: "Historial",
};
const TAB_ORDER: TabKey[] = ["posiciones", "equipos", "fixture", "playoffs", "historial"];

type FixtureSort = "zona" | "fecha" | "dia";
const FIXTURE_SORT_LABELS: Record<FixtureSort, string> = {
  zona: "Por zona",
  fecha: "Por fecha",
  dia: "Por día/hora",
};

export default function PublicView({ data }: { data: PublicData }) {
  const [tab, setTab] = useState<TabKey>("posiciones");
  const [fixtureSort, setFixtureSort] = useState<FixtureSort>("zona");
  const [fixtureTeamId, setFixtureTeamId] = useState<number | null>(null);
  const { settings, zones, ties, teamsById, playersByTeam, champions } = data;

  function toggleTheme() {
    const root = document.documentElement;
    const cur =
      root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
  }

  const nameOf = (id: number | null, label: string | null) =>
    (id !== null ? teamsById[id]?.name : null) ?? label ?? "Por definir";

  const renderMatch = (m: MatchRow, zoneName?: string) => {
    const pending = !m.played || m.home_score === null;
    const hasMeta = m.scheduled_at || zoneName || m.matchday != null;
    return (
      <div className="match-wrap" key={m.id}>
        {hasMeta && (
          <div className="match-meta">
            {m.matchday != null && <span className="match-fecha">Fecha {m.matchday}</span>}
            {m.scheduled_at && <span className="match-date">{formatMatchDateTime(m.scheduled_at)}</span>}
            {zoneName && <span className="match-zone">{zoneName}</span>}
          </div>
        )}
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

  const renderBye = (matchday: number, zoneName: string) => (
    <div className="match-wrap" key={`bye-${zoneName}-${matchday}`}>
      <div className="match-meta">
        <span className="match-fecha">Fecha {matchday}</span>
        <span className="match-zone">{zoneName}</span>
      </div>
      <div className="match bye">
        <span className="bye-label">Libre</span>
      </div>
    </div>
  );

  const rounds = [...new Set(ties.map((t) => t.round))].sort((a, b) => a - b);
  const anyMatches = zones.some((z) => z.matches.length > 0);

  // Agrupa los partidos del fixture según el modo elegido (zona, fecha/jornada o día/hora).
  // Un item puede ser un partido o, en el filtro por equipo, una fecha libre.
  type FixtureItem =
    | { kind: "match"; m: MatchRow; zoneName: string }
    | { kind: "bye"; matchday: number; zoneName: string };
  type ByeNote = { teamName: string; zoneName: string };
  type FixtureGroup = { key: string; title: string; items: FixtureItem[]; byes?: ByeNote[] };

  // Fechas libres deducidas de los partidos cargados, por zona.
  const byesByZone = new Map(zones.map((z) => [z.zone.id, computeByes(z.teams, z.matches)]));

  const allFixtureItems: FixtureItem[] = zones.flatMap((z) =>
    z.matches.map((m) => ({ kind: "match" as const, m, zoneName: z.zone.name })),
  );
  const timeOf = (it: FixtureItem) =>
    it.kind === "match" && it.m.scheduled_at ? new Date(it.m.scheduled_at).getTime() : Infinity;
  const mdOf = (it: FixtureItem) => (it.kind === "bye" ? it.matchday : it.m.matchday ?? Infinity);

  let fixtureGroups: FixtureGroup[] = [];
  if (fixtureTeamId !== null) {
    // Filtro por equipo: una sola lista con sus partidos y sus fechas libres,
    // todo ordenado por número de fecha (1, 2, 3…).
    const teamZone = zones.find((z) => z.teams.some((t) => t.id === fixtureTeamId));
    const teamByes: FixtureItem[] = [];
    if (teamZone) {
      for (const [matchday, team] of byesByZone.get(teamZone.zone.id) ?? []) {
        if (team.id === fixtureTeamId) {
          teamByes.push({ kind: "bye", matchday, zoneName: teamZone.zone.name });
        }
      }
    }
    const items = [
      ...allFixtureItems.filter(
        (it) => it.kind === "match" && (it.m.home_team_id === fixtureTeamId || it.m.away_team_id === fixtureTeamId),
      ),
      ...teamByes,
    ].sort((x, y) => mdOf(x) - mdOf(y) || timeOf(x) - timeOf(y));
    fixtureGroups = [
      {
        key: `t${fixtureTeamId}`,
        title: teamsById[fixtureTeamId]?.name ?? "Equipo",
        items,
      },
    ];
  } else if (fixtureSort === "zona") {
    fixtureGroups = zones
      .filter((z) => z.matches.length > 0)
      .map((z) => ({
        key: `z${z.zone.id}`,
        title: z.zone.name,
        items: z.matches.map((m) => ({ kind: "match" as const, m, zoneName: z.zone.name })),
      }));
  } else if (fixtureSort === "fecha") {
    const byDay = new Map<number | null, FixtureItem[]>();
    for (const it of allFixtureItems) {
      const key = it.kind === "match" ? it.m.matchday ?? null : it.matchday;
      (byDay.get(key) ?? byDay.set(key, []).get(key)!).push(it);
    }
    const keys = [...byDay.keys()].sort((a, b) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    });
    // Cada grupo es una fecha, así que los libres de esa fecha van al pie de la tarjeta.
    fixtureGroups = keys.map((k) => ({
      key: `f${k ?? "none"}`,
      title: k === null ? "Sin fecha asignada" : `Fecha ${k}`,
      items: byDay.get(k)!.slice().sort((x, y) => timeOf(x) - timeOf(y)),
      byes:
        k === null
          ? undefined
          : zones.flatMap((z) => {
              const team = byesByZone.get(z.zone.id)?.get(k);
              return team ? [{ teamName: team.name, zoneName: z.zone.name }] : [];
            }),
    }));
  } else {
    const byDate = new Map<string, FixtureItem[]>();
    for (const it of allFixtureItems) {
      const key =
        it.kind === "match" && it.m.scheduled_at ? formatMatchDay(it.m.scheduled_at) : "￿Sin día asignado";
      (byDate.get(key) ?? byDate.set(key, []).get(key)!).push(it);
    }
    const sorted = [...byDate.entries()].sort(([, a], [, b]) => timeOf(a[0]) - timeOf(b[0]));
    fixtureGroups = sorted.map(([title, items]) => ({
      key: `d${title}`,
      title: title.startsWith("￿") ? "Sin día asignado" : title[0].toUpperCase() + title.slice(1),
      items: items.slice().sort((x, y) => timeOf(x) - timeOf(y)),
    }));
  }
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
              <div className="fixture-controls" role="group" aria-label="Ordenar fixture">
                {fixtureTeamId === null &&
                  (Object.keys(FIXTURE_SORT_LABELS) as FixtureSort[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`chip ${fixtureSort === k ? "active" : ""}`}
                      aria-pressed={fixtureSort === k}
                      onClick={() => setFixtureSort(k)}
                    >
                      {FIXTURE_SORT_LABELS[k]}
                    </button>
                  ))}
                <select
                  className="team-filter"
                  aria-label="Filtrar por equipo"
                  value={fixtureTeamId ?? ""}
                  onChange={(e) => setFixtureTeamId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Todos los equipos</option>
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

              {fixtureGroups.map((group) => (
                <div className="card" key={group.key}>
                  <div className="card-head">
                    <h2>{group.title}</h2>
                  </div>
                  {group.items.length === 0 ? (
                    <div className="empty">Este equipo todavía no tiene partidos cargados.</div>
                  ) : (
                    group.items.map((it) =>
                      it.kind === "bye"
                        ? renderBye(it.matchday, it.zoneName)
                        : renderMatch(it.m, it.zoneName),
                    )
                  )}
                  {group.byes && group.byes.length > 0 && (
                    <div className="bye-note">
                      <span className="bye-note-lbl">Libre</span>
                      {group.byes.map((b) => `${b.teamName} (${b.zoneName})`).join(" · ")}
                    </div>
                  )}
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

        {tab === "historial" &&
          (champions.length === 0 ? (
            <div className="card empty">Todavía no hay campeones cargados.</div>
          ) : (
            <section className="panel">
              <div className="card">
                <div className="card-head">
                  <h2>Historial de campeones</h2>
                </div>
                <div className="tscroll">
                  <table className="champions">
                    <thead>
                      <tr>
                        <th className="season">Temporada</th>
                        <th>Campeón</th>
                      </tr>
                    </thead>
                    <tbody>
                      {champions.map((c) => (
                        <tr key={c.id}>
                          <td className="season">{c.season}</td>
                          <td>{c.champion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ))}
      </main>
    </>
  );
}
