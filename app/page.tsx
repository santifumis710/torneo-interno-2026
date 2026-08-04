"use client";

import { useState } from "react";
import "./tournament.css";

/* ---------- Datos de ejemplo (luego vendrán de la base de datos) ---------- */

const COLORS = ["#123a86", "#1f9d55", "#d94a3d", "#7a3fb0", "#0d8f9e", "#c85a12", "#334155", "#b02a5b"];

type RawTeam = { name: string; pj: number; g: number; e: number; p: number; gf: number; gc: number };

const ZONE_A: RawTeam[] = [
  { name: "Sistemas FC", pj: 5, g: 4, e: 1, p: 0, gf: 14, gc: 4 },
  { name: "Los Ingenieros", pj: 5, g: 4, e: 0, p: 1, gf: 11, gc: 6 },
  { name: "Mecánica United", pj: 5, g: 3, e: 1, p: 1, gf: 9, gc: 5 },
  { name: "Química CF", pj: 5, g: 2, e: 2, p: 1, gf: 8, gc: 7 },
  { name: "Civil Athletic", pj: 5, g: 1, e: 2, p: 2, gf: 6, gc: 8 },
  { name: "Eléctricos", pj: 5, g: 1, e: 0, p: 4, gf: 4, gc: 12 },
  { name: "Industrial FC", pj: 5, g: 0, e: 0, p: 5, gf: 3, gc: 16 },
];

const ZONE_B: RawTeam[] = [
  { name: "Los Decanos", pj: 5, g: 5, e: 0, p: 0, gf: 16, gc: 3 },
  { name: "Naval SC", pj: 5, g: 3, e: 1, p: 1, gf: 10, gc: 6 },
  { name: "Ambiental FC", pj: 5, g: 3, e: 0, p: 2, gf: 9, gc: 8 },
  { name: "Textil United", pj: 5, g: 2, e: 1, p: 2, gf: 7, gc: 7 },
  { name: "Metalúrgica", pj: 5, g: 1, e: 1, p: 3, gf: 5, gc: 9 },
  { name: "Rectorado FC", pj: 5, g: 1, e: 0, p: 4, gf: 6, gc: 13 },
  { name: "Becados CF", pj: 5, g: 0, e: 1, p: 4, gf: 4, gc: 11 },
];

const QUALIFIERS = 4; // configurable por zona en el admin

/* ---------- Helpers ---------- */

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

function Logo({ name }: { name: string }) {
  return (
    <span className="logo" style={{ background: colorFor(name) }}>
      {initials(name)}
    </span>
  );
}

function computeStandings(rows: RawTeam[]) {
  return rows
    .map((t) => ({ ...t, dif: t.gf - t.gc, pts: t.g * 3 + t.e }))
    .sort((a, b) => b.pts - a.pts || b.dif - a.dif || b.gf - a.gf);
}

/* ---------- Componentes ---------- */

function ZoneTable({ name, rows }: { name: string; rows: RawTeam[] }) {
  const table = computeStandings(rows);
  return (
    <div className="card">
      <div className="card-head">
        <h2>{name}</h2>
        <span className="badge">Clasifican {QUALIFIERS}</span>
      </div>
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
            {table.map((t, i) => (
              <tr key={t.name} className={i < QUALIFIERS ? "qual" : ""}>
                <td className="pos">
                  <span className="num-pos">{i + 1}</span>
                </td>
                <td className="team">
                  <Logo name={t.name} />
                  <span className="team-name">{t.name}</span>
                </td>
                <td>{t.pj}</td>
                <td>{t.g}</td>
                <td>{t.e}</td>
                <td>{t.p}</td>
                <td>{t.gf}</td>
                <td>{t.gc}</td>
                <td>
                  {t.dif > 0 ? "+" : ""}
                  {t.dif}
                </td>
                <td className="pts">{t.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="legend">
        <span className="swatch" /> Zona de clasificación a playoffs
      </div>
    </div>
  );
}

type MatchData = { home: string; away: string; hs: number | null; as: number | null };

function Match({ home, away, hs, as }: MatchData) {
  const pending = hs === null;
  return (
    <div className="match">
      <div className="side home">
        <span className="team-name">{home}</span>
        <Logo name={home} />
      </div>
      {pending ? (
        <div className="score pending">VS</div>
      ) : (
        <div className="score">
          {hs} - {as}
        </div>
      )}
      <div className="side away">
        <Logo name={away} />
        <span className="team-name">{away}</span>
      </div>
    </div>
  );
}

type TieRow = { seed?: string; name: string; score: string | number; win?: boolean };

function Tie({ rows }: { rows: [TieRow, TieRow] }) {
  return (
    <div className="tie">
      {rows.map((r, i) => (
        <div key={i} className={`tie-row ${r.win ? "win" : ""}`}>
          <span className="tie-name">
            {r.seed ? <span className="seed">{r.seed}</span> : null}
            {r.name}
          </span>
          <span className="tie-score">{r.score}</span>
        </div>
      ))}
    </div>
  );
}

const FIXTURE_A: MatchData[] = [
  { home: "Sistemas FC", away: "Industrial FC", hs: 3, as: 0 },
  { home: "Los Ingenieros", away: "Eléctricos", hs: 2, as: 1 },
  { home: "Mecánica United", away: "Civil Athletic", hs: null, as: null },
  { home: "Química CF", away: "Los Ingenieros", hs: null, as: null },
];
const FIXTURE_B: MatchData[] = [
  { home: "Los Decanos", away: "Becados CF", hs: 4, as: 1 },
  { home: "Naval SC", away: "Rectorado FC", hs: 2, as: 2 },
  { home: "Ambiental FC", away: "Metalúrgica", hs: null, as: null },
  { home: "Textil United", away: "Naval SC", hs: null, as: null },
];

const QF: [TieRow, TieRow][] = [
  [{ seed: "1°A", name: "Sistemas FC", score: 2, win: true }, { seed: "4°B", name: "Textil United", score: 1 }],
  [{ seed: "2°B", name: "Naval SC", score: 0 }, { seed: "3°A", name: "Mecánica United", score: 1, win: true }],
  [{ seed: "1°B", name: "Los Decanos", score: 3, win: true }, { seed: "4°A", name: "Química CF", score: 0 }],
  [{ seed: "2°A", name: "Los Ingenieros", score: 2 }, { seed: "3°B", name: "Ambiental FC", score: 2 }],
];

/* ---------- Página ---------- */

type Tab = "posiciones" | "fixture" | "playoffs";

export default function Home() {
  const [tab, setTab] = useState<Tab>("posiciones");

  function toggleTheme() {
    const root = document.documentElement;
    const cur =
      root.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    root.setAttribute("data-theme", cur === "dark" ? "light" : "dark");
  }

  return (
    <>
      <header className="topbar">
        <div className="wrap">
          <div className="crest">UTN</div>
          <div className="title">
            <h1>Torneo Interno 2026</h1>
            <p>UTN · Facultad Regional Santa Fe</p>
          </div>
          <div className="spacer" />
          <button className="theme-btn" type="button" onClick={toggleTheme}>
            Tema
          </button>
        </div>
      </header>

      <main className="wrap">
        <div className="tabs" role="tablist">
          {(["posiciones", "fixture", "playoffs"] as Tab[]).map((t) => (
            <button
              key={t}
              className="tab"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
            >
              {t === "posiciones" ? "Posiciones" : t === "fixture" ? "Fixture" : "Playoffs"}
            </button>
          ))}
        </div>

        {tab === "posiciones" && (
          <section className="panel">
            <div className="zones">
              <ZoneTable name="Zona A" rows={ZONE_A} />
              <ZoneTable name="Zona B" rows={ZONE_B} />
            </div>
            <p className="note">Los primeros {QUALIFIERS} de cada zona clasifican al playoff.</p>
          </section>
        )}

        {tab === "fixture" && (
          <section className="panel">
            <div className="card">
              <div className="card-head">
                <h2>Zona A · Fecha 5</h2>
                <span className="badge">Sáb 15/03</span>
              </div>
              {FIXTURE_A.map((m, i) => (
                <Match key={i} {...m} />
              ))}
            </div>
            <div className="card">
              <div className="card-head">
                <h2>Zona B · Fecha 5</h2>
                <span className="badge">Dom 16/03</span>
              </div>
              {FIXTURE_B.map((m, i) => (
                <Match key={i} {...m} />
              ))}
            </div>
          </section>
        )}

        {tab === "playoffs" && (
          <section className="panel">
            <div className="card" style={{ padding: 16 }}>
              <div className="bracket">
                <div>
                  <div className="round-h">Cuartos</div>
                  <div className="round">
                    {QF.map((rows, i) => (
                      <Tie key={i} rows={rows} />
                    ))}
                  </div>
                </div>
                <div>
                  <div className="round-h">Semifinales</div>
                  <div className="round">
                    <Tie rows={[{ name: "Sistemas FC", score: "—" }, { name: "Mecánica United", score: "—" }]} />
                    <Tie rows={[{ name: "Los Decanos", score: "—" }, { name: "Ganador C4", score: "—" }]} />
                  </div>
                </div>
                <div>
                  <div className="round-h">Final</div>
                  <div className="round">
                    <Tie rows={[{ name: "Por definir", score: "—" }, { name: "Por definir", score: "—" }]} />
                  </div>
                </div>
              </div>
              <div className="champion">
                Cruces editables por el profesor · ej. <b>1°A vs 4°B</b>
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
