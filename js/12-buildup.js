"use strict";
/* ================= profiles, underlayments, stack ================= */
const PROF = {
  JOLLY: { use: "edge", vis: 0.125 },
  RONDEC: { use: "edge", vis: 0.25 },
  QUADEC: { use: "edge", vis: 0.25 },
  SCHIENE: { use: "edge", vis: 0.0625 },
  "RENO-T": { use: "trans" },
  "RENO-TK": { use: "trans" },
  "RENO-U": { use: "trans" },
  "RENO-V": { use: "trans" },
  "RENO-RAMP": { use: "trans" },
};
const PSIZES = [
  [0.1875, "45"],
  [0.25, "60"],
  [0.3125, "80"],
  [0.375, "100"],
  [0.4375, "110"],
  [0.5, "125"],
  [0.6875, "175"],
];
function autoSize(th) {
  let best = null;
  for (const [v] of PSIZES) if (v <= th + 1 / 32) best = v;
  return best == null ? PSIZES[0][0] : best;
}
const sizeCode = (v) => {
  const f = PSIZES.find((q) => Math.abs(q[0] - v) < 1e-6);
  return f ? f[1] : "";
};
function edgeProf(s) {
  const p = s.prof || {},
    type = p.type && p.type !== "inherit" ? p.type : P.sch.type || "JOLLY";
  const size =
    p.size && p.size !== "auto" ? +p.size : autoSize(+s.tile.thick || 0.375);
  const vis =
    p.vis != null && p.vis !== "" && isFinite(+p.vis)
      ? +p.vis
      : (PROF[type] || {}).vis || 0.125;
  return {
    type,
    size,
    vis,
    key: `${type} ${fmtIn(size)}″${sizeCode(size) ? " (" + sizeCode(size) + ")" : ""}`,
  };
}
const UNDER = [
  { id: "none", n: "—", t: 0, k: "none" },
  {
    id: "ditraheat",
    n: "Schluter DITRA-HEAT",
    t: 0.217,
    k: "heat",
    u: [
      [134.5, "roll 134.5 sf"],
      [8.4, "sheet 8.4 sf"],
    ],
  },
  {
    id: "ditraheatduo",
    n: "Schluter DITRA-HEAT-DUO",
    t: 0.315,
    k: "heat",
    u: [[8.4, "sheet 8.4 sf"]],
  },
  {
    id: "ditra",
    n: "Schluter DITRA",
    t: 0.125,
    k: "mem",
    u: [
      [54, "roll 54 sf"],
      [150, "roll 150 sf"],
      [323, "roll 323 sf"],
    ],
  },
  {
    id: "ditraxl",
    n: "Schluter DITRA-XL",
    t: 0.276,
    k: "mem",
    u: [[175, "roll 175 sf"]],
  },
  {
    id: "flexbone",
    n: "Ardex FLEXBONE UI 740",
    t: 0.118,
    k: "mem",
    u: [[200, "roll 200 sf"]],
  },
  {
    id: "flexboneheat",
    n: "Ardex FLEXBONE HEAT",
    t: 0.236,
    k: "heat",
    u: [
      [134.5, "roll 134.5 sf"],
      [8.4, "sheet 8.4 sf"],
    ],
  },
  {
    id: "strataheat",
    n: "Laticrete STRATA_HEAT Mat",
    t: 0.118,
    k: "heat",
    u: [
      [161, "roll 161 sf"],
      [8.6, "sheet 8.6 sf"],
    ],
    chk: true,
  },
  {
    id: "kerdi",
    n: "Schluter KERDI",
    t: 0.008,
    k: "mem",
    u: [[54, "roll 54 sf"]],
  },
  {
    id: "fiberock14",
    n: "USG Fiberock 1/4″",
    t: 0.25,
    k: "board",
    u: [[15, "3×5"]],
  },
  {
    id: "fiberock38",
    n: "USG Fiberock 3/8″",
    t: 0.375,
    k: "board",
    u: [[15, "3×5"]],
  },
  {
    id: "fiberock12",
    n: "USG Fiberock 1/2″",
    t: 0.5,
    k: "board",
    u: [[15, "3×5"]],
  },
  {
    id: "hardie14",
    n: "HardieBacker 1/4″",
    t: 0.25,
    k: "board",
    u: [[15, "3×5"]],
  },
  {
    id: "hardie12",
    n: "HardieBacker 1/2″",
    t: 0.5,
    k: "board",
    u: [[15, "3×5"]],
  },
  {
    id: "durock14",
    n: "USG Durock 1/4″",
    t: 0.25,
    k: "board",
    u: [[15, "3×5"]],
  },
  {
    id: "durock12",
    n: "USG Durock 1/2″",
    t: 0.5,
    k: "board",
    u: [[15, "3×5"]],
  },
  {
    id: "foam12",
    n: "Foam board 1/2″ (Hydroblok, Wedi, Kerdi-Board)",
    t: 0.5,
    k: "board",
    u: [
      [32, "4×8"],
      [15, "3×5"],
    ],
  },
  { id: "ply12", n: "Plywood 1/2″", t: 0.5, k: "ply", u: [[32, "4×8"]] },
  { id: "ply34", n: "Plywood 3/4″", t: 0.75, k: "ply", u: [[32, "4×8"]] },
];
function underList() {
  return UNDER.concat(
    (P.customUnder || []).map((c) => ({
      id: c.id,
      n: c.n,
      t: +c.t || 0,
      k: c.k || "mem",
      u: [[+c.sf || 0, c.sf ? c.sf + " sf" : ""]],
      custom: true,
    })),
  );
}
const underOf = (id) => underList().find((u) => u.id === id) || UNDER[0];
const HEATSYS = {
  ditraheat: {
    under: "ditraheat",
    sp: { 3: 3.5, 32: 2.95 },
    wsf: { 3: 12.7, 32: 15.2 },
  },
  ditraheatduo: {
    under: "ditraheatduo",
    sp: { 3: 3.5, 32: 2.95 },
    wsf: { 3: 12.7, 32: 15.2 },
  },
  flexboneheat: { under: "flexboneheat" },
  strataheat: { under: "strataheat" },
  cable: {},
  mat: {},
};
/* DITRA-HEAT-E-HK cables: [length ft, coverage sf at 3-stud spacing]. Coverage at alternating 3-2 ≈ 83%.
   From Schluter product tables / retailer listings (275.5 ft coverage estimated from length). */
const DH_CABLES = {
  120: [
    [35.3, 10.7],
    [52.9, 16.0],
    [70.5, 21.3],
    [88.2, 26.7],
    [105.8, 32.0],
    [124.1, 37.5],
    [141.1, 42.7],
    [169.8, 51.4],
    [212.9, 64.4],
    [240.2, 72.7],
    [275.5, 83.4],
    [303.0, 91.7],
    [336.9, 101.9],
    [372.2, 112.6],
    [444.0, 134.5],
  ],
  240: [
    [124.1, 37.5],
    [176.3, 53.3],
    [211.6, 64.0],
    [248.2, 75.1],
    [339.4, 101.9],
    [425.8, 128.8],
    [480.5, 145.3],
    [551.0, 166.7],
    [605.9, 183.3],
    [673.8, 203.8],
    [744.4, 225.2],
    [888.0, 268.6],
  ],
};
function cableCatalog(sys, volt) {
  if (sys !== "ditraheat" && sys !== "ditraheatduo") return [];
  const v = +volt === 240 ? 240 : 120;
  return DH_CABLES[v].map(([ft, sf]) => ({
    id: v + "-" + ft,
    ft,
    sf,
    sf32: Math.round(sf * 8.32) / 10,
    v,
  }));
}
function tileBondAuto(T) {
  return { s: 0.125, m: 0.1875, l: 0.25 }[trowelOf(T)];
}
function stackOf(s) {
  const st = s.stack || {},
    u = underOf(st.under || "none"),
    u2 = underOf(st.under2 || "none"),
    T = s.tile;
  const L = [];
  if (u2.t > 0) L.push({ n: u2.n, t: u2.t, c: "#e2cfa6", k: u2.k });
  const ub =
    u.k === "none"
      ? 0
      : st.ub != null && st.ub !== ""
        ? +st.ub
        : u.k === "board" || u.k === "ply"
          ? 0.125
          : 0.094;
  if (ub > 0) L.push({ n: t("bondUnder"), t: ub, c: "#bdb7ad", k: "bond" });
  if (u.t > 0)
    L.push({
      n: u.n,
      t: u.t,
      c: u.k === "heat" ? "#f08a24" : u.k === "mem" ? "#f6b24a" : "#c8c8c8",
      k: u.k,
    });
  const tb = st.tb != null && st.tb !== "" ? +st.tb : tileBondAuto(T);
  L.push({ n: t("bondTile"), t: tb, c: "#bdb7ad", k: "bond" });
  L.push({
    n: t("tile") + " " + tileDesc(T),
    t: +T.thick || 0.375,
    c: "#ece5d7",
    k: "tile",
  });
  return { L, total: L.reduce((a, x) => a + x.t, 0), u, u2, ub, tb };
}
const ADJ = {
  hardwood: 0.75,
  engineered: 0.5,
  laminate: 0.5,
  lvp: 0.25,
  vinyl: 0.125,
  carpet: 0.75,
  tile: 0.75,
  concrete: 0,
  custom: 0.5,
};
function transCalc(s, tr) {
  const st = stackOf(s),
    tileTop = st.total,
    adjTop = (+tr.at || 0) + (+tr.sub || 0),
    diff = tileTop - adjTop;
  let type, msg;
  if (Math.abs(diff) <= 1 / 16) {
    type = "RENO-T";
    msg = t("recSame");
  } else if (diff > 0) {
    type = tr.adj === "carpet" ? "RENO-TK" : "RENO-U";
    msg = t("recHigher");
  } else {
    type = "RENO-T";
    msg = t("recLower");
  }
  if (tr.prof && tr.prof !== "auto") type = tr.prof;
  let size = autoSize(+s.tile.thick || 0.375);
  if (type === "RENO-U" && (st.u.k === "mem" || st.u.k === "heat"))
    size = autoSize((+s.tile.thick || 0.375) + st.u.t);
  const alts = [];
  if (Math.abs(diff) > 1 / 16) {
    underList()
      .filter(
        (u) =>
          u.id !== st.u.id &&
          u.k !== "none" &&
          (s.type !== "floor" || u.k !== "board" || true),
      )
      .forEach((u) => {
        const nd =
          diff -
          st.u.t +
          u.t +
          (st.u.k === "none"
            ? u.k === "board" || u.k === "ply"
              ? 0.125
              : 0.094
            : 0);
        alts.push({ u, nd });
      });
    alts.sort((a, b) => Math.abs(a.nd) - Math.abs(b.nd));
  }
  return {
    st,
    tileTop,
    adjTop,
    diff,
    type,
    size,
    key: `${type} ${fmtIn(size)}″${sizeCode(size) ? " (" + sizeCode(size) + ")" : ""}`,
    msg,
    alts: alts.slice(0, 3),
  };
}
function sectionSVG(s, tr) {
  const c = transCalc(s, tr),
    k = 90,
    W = 360,
    base = 230,
    left = 20,
    mid = 200,
    right = W - 14;
  let h = "";
  const yOf = (v) => base - v * k;
  h += `<rect x="${left}" y="${base}" width="${right - left}" height="18" fill="#d8c4a0"/><text x="${left + 4}" y="${base + 13}" font-size="11" fill="#5a4a30">${esc(t("subfloor"))}</text>`;
  let y = 0;
  c.st.L.forEach((l) => {
    h += `<rect x="${left}" y="${yOf(y + l.t)}" width="${mid - left}" height="${Math.max(1, l.t * k)}" fill="${l.c}" stroke="#8a847a" stroke-width=".6"/>`;
    if (l.t * k >= 9)
      h += `<text x="${left + 4}" y="${yOf(y + l.t / 2) + 4}" font-size="10.5" fill="#222">${esc(l.n)} · ${fmtIn(l.t)}″</text>`;
    else
      h += `<text x="${left + 4}" y="${yOf(y + l.t / 2) + 3}" font-size="8.5" fill="#444">${esc(l.n)} ${fmtIn(l.t)}″</text>`;
    y += l.t;
  });
  if (s.heat && s.heat.on) {
    const hl = c.st.L.find((l) => l.k === "heat");
    if (hl) {
      let y2 = 0;
      for (const l of c.st.L) {
        if (l === hl) break;
        y2 += l.t;
      }
      for (let x = left + 14; x < mid - 6; x += 22)
        h += `<circle cx="${x}" cy="${yOf(y2 + hl.t * 0.45)}" r="3" fill="#c0281c"/>`;
    }
  }
  const sub = +tr.sub || 0,
    at = +tr.at || 0,
    ax = mid + 16;
  if (sub !== 0)
    h += `<rect x="${ax}" y="${Math.min(yOf(sub), base)}" width="${right - ax}" height="${Math.abs(sub) * k}" fill="#e2cfa6" stroke="#8a847a" stroke-width=".6"/>`;
  if (at > 0)
    h += `<rect x="${ax}" y="${yOf(sub + at)}" width="${right - ax}" height="${at * k}" fill="${tr.adj === "carpet" ? "#b9a6c9" : "#c9a27a"}" stroke="#8a847a" stroke-width=".6"/><text x="${ax + 4}" y="${yOf(sub + at / 2) + 4}" font-size="10.5">${esc(t("adj_" + tr.adj))} ${fmtIn(at)}″</text>`;
  h += `<path d="M${mid} ${yOf(c.tileTop)} L${ax} ${yOf(c.adjTop)} L${ax} ${base} L${mid} ${base} Z" fill="#c3c8d0" stroke="#7f8690" stroke-width=".8"/>`;
  h += `<text x="${(left + mid) / 2}" y="${yOf(c.tileTop) - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="#1d3550">${fmt(c.tileTop)}</text><text x="${(ax + right) / 2}" y="${yOf(c.adjTop) - 8}" text-anchor="middle" font-size="12" font-weight="700" fill="#5a4129">${fmt(c.adjTop)}</text>`;
  const top = Math.min(yOf(c.tileTop), yOf(c.adjTop)) - 40;
  return {
    c,
    svg: `<svg viewBox="0 ${top} ${W} ${base + 24 - top}" style="width:100%;background:#fbfaf7;border:1px solid var(--line);border-radius:10px;font-family:${FONT}">${h}</svg>`,
  };
}
function transModal(si, i) {
  const s = P.surfaces[si],
    tr = s.trans[i];
  const { c, svg } = sectionSVG(s, tr);
  let h = `<h3>${t("section")} — ${esc(s.name)} → ${esc(t("adj_" + tr.adj))}</h3>${svg}<div class="note" style="margin-top:10px"><b>${t("diffTxt")}: ${c.diff >= 0 ? "+" : "−"}${fmt(Math.abs(c.diff))}</b> (${t("tileTop")} ${fmt(c.tileTop)}, ${t("adjTop")} ${fmt(c.adjTop)}).<br>${c.msg}<br><b>${t("profRec")}: ${esc(c.key)}</b></div>`;
  if (c.alts.length)
    h +=
      `<p class="hint">${t("altsTxt")}</p>` +
      c.alts
        .map(
          (a) =>
            `<div class="dl">${esc(a.u.n)} → ${t("diffTxt").toLowerCase()} ${a.nd >= 0 ? "+" : "−"}${fmt(Math.abs(a.nd))}</div>`,
        )
        .join("");
  h += `<p class="hint">${t("transNote")}</p><div class="btns"><button class="btn p" data-act="closeModal">${t("close")}</button></div>`;
  modal(h);
}
