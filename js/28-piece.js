"use strict";
/* ================= tile card =================
   Tap a tile: its real shape on the full tile, the length of every side, the cut lines in red
   and where to mark them — measured from the tile's corners — so an angled or tapered cut
   can be marked straight onto the tile. Quick actions (joint here, center, deco) live here too. */
const PCT = {
  ru: {
    pcTitle: "Плитка",
    pcFull: "Целая плитка",
    pcSides: "Стороны куска",
    pcMarks: "Разметка на плитке",
    pcFrom: "от угла",
    pcSide: "сторона",
    pcCut: "рез",
    pcAng: "угол",
    pcGap: "Уже с зазором {g} у стены.",
    pcTaper: "Клин: ширина с одного конца → с другого.",
    pcTri: "Срезан угол плитки.",
    pcNotch: "Вырез угла (L).",
    pcHoles: "Есть отверстия — см. отметки на чертеже.",
    pcHow:
      "Красное — линия реза. Отметь точки на краях плитки от букв-углов и соедини.",
  },
  en: {
    pcTitle: "Tile",
    pcFull: "Full tile",
    pcSides: "Piece sides",
    pcMarks: "Marks on the tile",
    pcFrom: "from corner",
    pcSide: "side",
    pcCut: "cut",
    pcAng: "angle",
    pcGap: "Wall gap {g} already taken off.",
    pcTaper: "Taper: width at one end → the other.",
    pcTri: "A corner of the tile is cut off.",
    pcNotch: "Corner notch (L).",
    pcHoles: "Has holes — see the drawing.",
    pcHow:
      "Red is the cut line. Mark the points on the tile edges from the lettered corners and join them.",
  },
};
const pct = (k) => (PCT[lang] || PCT.en)[k] || k;

/* the piece in its tile's own frame: tile W×H from corner A (0,0), piece polygon, cut edges, marks */
function pieceGeom(p) {
  let o, u, v, W, H;
  if (p.k === "p" && p.t && p.t.poly && p.t.poly.length === 4) {
    const Q = p.t.poly;
    o = Q[0];
    W = Math.hypot(Q[1][0] - Q[0][0], Q[1][1] - Q[0][1]);
    H = Math.hypot(Q[3][0] - Q[0][0], Q[3][1] - Q[0][1]);
    u = [(Q[1][0] - Q[0][0]) / W, (Q[1][1] - Q[0][1]) / W];
    v = [(Q[3][0] - Q[0][0]) / H, (Q[3][1] - Q[0][1]) / H];
  } else {
    o = [p.x0, p.y0];
    u = [1, 0];
    v = [0, 1];
    W = p.lw;
    H = p.lh;
  }
  let pts = (p.C || []).map((q) => [
    (q[0] - o[0]) * u[0] + (q[1] - o[1]) * u[1],
    (q[0] - o[0]) * v[0] + (q[1] - o[1]) * v[1],
  ]);
  // keep the long side horizontal on the card
  if (H > W + 1e-6) {
    pts = pts.map(([s, t]) => [t, W - s]);
    [W, H] = [H, W];
  }
  // clean: snap to the tile edges, drop repeated points, counter-clockwise
  const e = 1e-3,
    sn = (x, a) => (Math.abs(x - a) < 0.02 ? a : x);
  pts = pts.map(([s, t]) => [sn(sn(s, 0), W), sn(sn(t, 0), H)]);
  pts = pts.filter((q, i) => {
    const r = pts[(i + 1) % pts.length];
    return Math.hypot(q[0] - r[0], q[1] - r[1]) > e;
  });
  // drop points in the middle of a straight line
  for (let k = 0; k < 3; k++)
    pts = pts.filter((q, i) => {
      const a = pts[(i - 1 + pts.length) % pts.length],
        b = pts[(i + 1) % pts.length],
        cr = (q[0] - a[0]) * (b[1] - a[1]) - (q[1] - a[1]) * (b[0] - a[0]);
      return Math.abs(cr) > 1e-4 * Math.hypot(b[0] - a[0], b[1] - a[1]);
    });
  if (sArea(pts) < 0) pts.reverse();
  const onB = (q) =>
    Math.abs(q[0]) < e ||
    Math.abs(q[0] - W) < e ||
    Math.abs(q[1]) < e ||
    Math.abs(q[1] - H) < e;
  const sameSide = (a, b) =>
    (Math.abs(a[0]) < e && Math.abs(b[0]) < e) ||
    (Math.abs(a[0] - W) < e && Math.abs(b[0] - W) < e) ||
    (Math.abs(a[1]) < e && Math.abs(b[1]) < e) ||
    (Math.abs(a[1] - H) < e && Math.abs(b[1] - H) < e);
  // an edge is a cut when it does not run along the tile's factory edge
  const cut = pts.map((a, i) => !sameSide(a, pts[(i + 1) % pts.length]));
  // take the wall gap off the cut edges (offset them inward)
  const g = +P.edgeGap || 0,
    n = pts.length;
  let Pg = pts;
  if (g > 0 && n >= 3 && !p.hl) {
    const L = pts.map((a, i) => {
      const b = pts[(i + 1) % n],
        l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1,
        d = [(b[0] - a[0]) / l, (b[1] - a[1]) / l],
        nn = [-d[1], d[0]],
        off = cut[i] ? g : 0;
      return { p: [a[0] + nn[0] * off, a[1] + nn[1] * off], d };
    });
    Pg = pts.map((_, i) => {
      const A = L[(i - 1 + n) % n],
        B = L[i],
        det = A.d[0] * B.d[1] - A.d[1] * B.d[0];
      if (Math.abs(det) < 1e-9) return B.p.slice();
      const dx = B.p[0] - A.p[0],
        dy = B.p[1] - A.p[1],
        k = (dx * B.d[1] - dy * B.d[0]) / det;
      return [A.p[0] + A.d[0] * k, A.p[1] + A.d[1] * k];
    });
  }
  // marks: where the cut lines leave the tile edges, measured from the nearest corner along that edge
  const C = { A: [0, 0], B: [W, 0], Cc: [W, H], D: [0, H] },
    marks = [];
  Pg.forEach((q, i) => {
    if (!onB(pts[i])) return;
    if (!(cut[i] || cut[(i - 1 + n) % n])) return;
    const isCorner = Object.values(C).some(
      (c) => Math.hypot(c[0] - pts[i][0], c[1] - pts[i][1]) < 0.02,
    );
    if (isCorner) return;
    let side, from, dist;
    if (Math.abs(pts[i][1]) < e)
      [side, from, dist] = [
        "AB",
        q[0] <= W / 2 ? "A" : "B",
        q[0] <= W / 2 ? q[0] : W - q[0],
      ];
    else if (Math.abs(pts[i][1] - H) < e)
      [side, from, dist] = [
        "DC",
        q[0] <= W / 2 ? "D" : "C",
        q[0] <= W / 2 ? q[0] : W - q[0],
      ];
    else if (Math.abs(pts[i][0]) < e)
      [side, from, dist] = [
        "AD",
        q[1] <= H / 2 ? "A" : "D",
        q[1] <= H / 2 ? q[1] : H - q[1],
      ];
    else
      [side, from, dist] = [
        "BC",
        q[1] <= H / 2 ? "B" : "C",
        q[1] <= H / 2 ? q[1] : H - q[1],
      ];
    marks.push({ q, side, from, dist: Math.max(0, dist) });
  });
  // angles at cut corners that are not square
  const ang = Pg.map((b, i) => {
    const a = Pg[(i - 1 + n) % n],
      c = Pg[(i + 1) % n];
    let d =
      Math.atan2(c[1] - b[1], c[0] - b[0]) -
      Math.atan2(a[1] - b[1], a[0] - b[0]);
    d = ((d * 180) / Math.PI + 360) % 360;
    return 360 - d > 180 ? d : 360 - d;
  });
  return { W, H, pts: Pg, cut, marks, ang, g };
}

function pieceCard(it, p) {
  const s = it && it.s ? it.s : cur(),
    T = s ? effT(s) : null;
  const G = pieceGeom(p),
    { W, H, pts, cut, marks } = G,
    n = pts.length;
  // drawing scale: fit about 300 × 230 px, with room for labels
  const k = Math.min(300 / W, 220 / H),
    pad = 46,
    VW = W * k + pad * 2,
    VH = H * k + pad * 2,
    X = (s2) => pad + s2 * k,
    Y = (t2) => pad + (H - t2) * k;
  const P2 = (A) =>
    A.map((q) => `${X(q[0]).toFixed(1)},${Y(q[1]).toFixed(1)}`).join(" ");
  let svg = `<svg viewBox="0 0 ${VW.toFixed(0)} ${VH.toFixed(0)}" width="100%" style="max-width:${VW.toFixed(0)}px;display:block;margin:0 auto">`;
  svg += `<defs><pattern id="pcw" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#f1eee7"/><path d="M0 0V7" stroke="#d6d0c4" stroke-width="2"/></pattern></defs>`;
  svg += `<rect x="${X(0)}" y="${Y(H)}" width="${W * k}" height="${H * k}" fill="url(#pcw)" stroke="#8d877b" stroke-width="1.2" stroke-dasharray="5 4"/>`;
  if (n >= 3)
    svg += `<polygon points="${P2(pts)}" fill="#cfe1f3" stroke="#3d4b5c" stroke-width="1.2"/>`;
  // cut edges in red
  pts.forEach((a, i) => {
    if (!cut[i]) return;
    const b = pts[(i + 1) % n];
    svg += `<line x1="${X(a[0])}" y1="${Y(a[1])}" x2="${X(b[0])}" y2="${Y(b[1])}" stroke="#d0342c" stroke-width="3" stroke-linecap="round"/>`;
  });
  // side lengths: label outside each edge (right of a counter-clockwise edge = outside)
  const lbl = (x, y, txt, col, sz = 13) =>
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${sz}" text-anchor="middle" dominant-baseline="central" font-weight="700" fill="${col}" font-family="${FONT}" paint-order="stroke" stroke="#fff" stroke-width="3.5">${esc(txt)}</text>`;
  pts.forEach((a, i) => {
    const b = pts[(i + 1) % n],
      L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 0.2) return;
    const mx = (X(a[0]) + X(b[0])) / 2,
      my = (Y(a[1]) + Y(b[1])) / 2,
      dx = X(b[0]) - X(a[0]),
      dy = Y(b[1]) - Y(a[1]),
      dl = Math.hypot(dx, dy) || 1,
      // in screen space y is flipped, so "outside" is to the left of the drawn direction
      nx = dy / dl,
      ny = -dx / dl,
      off = 13;
    svg += lbl(
      mx - nx * off,
      my - ny * off,
      fmtIn(L) + "″",
      cut[i] ? "#d0342c" : "#1d5fa8",
    );
  });
  // corners of the full tile
  [
    ["A", 0, 0, -1, 1],
    ["B", W, 0, 1, 1],
    ["C", W, H, 1, -1],
    ["D", 0, H, -1, -1],
  ].forEach(
    ([c, s2, t2, dx, dy]) =>
      (svg += lbl(X(s2) + dx * 13, Y(t2) + dy * 13, c, "#6b665c", 14)),
  );
  // marks on the tile edges
  marks.forEach((m) => {
    const x = X(m.q[0]),
      y = Y(m.q[1]);
    svg += `<circle cx="${x}" cy="${y}" r="4.5" fill="#d0342c"/>`;
  });
  // non-square angles
  G.ang.forEach((a, i) => {
    if (Math.abs(a - 90) < 1 || Math.abs(a - 180) < 1) return;
    const q = pts[i],
      cx = pts.reduce((m, r) => m + r[0], 0) / n,
      cy = pts.reduce((m, r) => m + r[1], 0) / n,
      dx = cx - q[0],
      dy = cy - q[1],
      dl = Math.hypot(dx, dy) || 1;
    svg += lbl(
      X(q[0] + (dx / dl) * Math.min(3, dl * 0.4)),
      Y(q[1] + (dy / dl) * Math.min(3, dl * 0.4)),
      Math.round(a) + "°",
      "#b4441b",
      11,
    );
  });
  svg += `</svg>`;

  const tileName = `${fmtIn(W)}×${fmtIn(H)}`;
  let head = p.no ? `№${p.no}` : "";
  if (p.row) head += ` · ${t("rowW")} ${p.row}`;
  let h = `<h3>${pct("pcTitle")} ${head.replace(/^ · /, "")}</h3>`;
  if (p.full) h += `<p><b>${pct("pcFull")}</b> ${tileName}</p>`;
  else {
    h += `<p class="hint" style="margin:0 0 6px"><b>${pieceSize(p)}</b> · ${t("tile")} ${tileName}${pieceNote(p) ? " · " + esc(pieceNote(p)) : ""}</p>`;
    h += svg;
    if (marks.length) {
      const sideL = { AB: W, DC: W, AD: H, BC: H };
      h += `<p class="hsec" style="margin-top:10px">${pct("pcMarks")}</p><div class="pcm">${marks
        .map(
          (m) =>
            `<div><b>${fmtIn(m.dist)}″</b> ${pct("pcFrom")} <b>${m.from}</b> · ${pct("pcSide")} ${m.side} (${fmtIn(sideL[m.side])}″)</div>`,
        )
        .join("")}</div>`;
    }
    const notes = [];
    if (p.taper || p.taperW) notes.push(pct("pcTaper"));
    if (p.notch && p.ax) notes.push(pct("pcNotch"));
    else if (p.notch && !p.hl) notes.push(pct("pcTri"));
    if (p.hl) notes.push(pct("pcHoles"));
    if (G.g > 0 && !p.hl)
      notes.push(pct("pcGap").replace("{g}", fmtIn(G.g) + "″"));
    notes.push(pct("pcHow"));
    h += `<p class="hint">${notes.join(" ")}</p>`;
  }
  // quick actions on this tile
  const deco = s && T && (s.deco || []).includes(decoKey(p, T));
  if (s && T && !S.client) {
    S.qp = { key: decoKey(p, T), c: [p.x0 + p.lw / 2, p.y0 + p.lh / 2] };
    h += `<div class="btns"><button class="btn" data-act="qa:joint">┼ ${nt("qaJoint")}</button><button class="btn" data-act="qa:center">◎ ${nt("qaCenter")}</button><button class="btn" data-act="qa:deco">${deco ? "✕ " + nt("qaDecoOff") : "◆ " + nt("qaDeco")}</button></div>`;
  }
  h += `<div class="btns"><button class="btn p" data-act="closeModal">${t("close")}</button></div>`;
  modal(h);
}
// tapping a tile opens its card instead of a one-line toast
pieceInfo = function (it, x, y) {
  const p = pieceAt(it, x, y);
  if (!p) return;
  pieceCard(it, p);
};
{
  const qa = qaAct;
  qaAct = function (k) {
    closeModal();
    qa(k);
  };
}
