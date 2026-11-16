"use strict";
/* ================= layout guide lines =================
   The line(s) you snap with chalk / a laser and keep while setting tile. They run through a real
   grout joint of the current layout:
   - walls: a level line at the top of the first row (or the ledger height) + a plumb line;
   - floors / pans: a cross through the joints nearest the middle.
   Each can be moved joint by joint, turned off per surface, and the whole feature toggled with ⊹.
   Distances say where to mark them from the walls / floor. */
const GLT = {
  ru: {
    btn: "Линия",
    title: "Линия укладки",
    on: "Показывать линию укладки",
    h: "Горизонтальная",
    v: "Вертикальная",
    hW: "Уровень (горизонталь)",
    vW: "Отвес (вертикаль)",
    shift: "Сдвиг по швам",
    reset: "По умолчанию",
    from: {
      l: "от левого края",
      r: "от правого края",
      b: "от низа",
      t: "от верха",
      bw: "от пола",
      tw: "от потолка / верха",
    },
    how: "Линия идёт по шву между плитками. Отбей её мелом или лазером по этим размерам и держи ряд по ней.",
    angled:
      "Раскладка под углом: отметь точки на стенах, где линия их пересекает, и соедини.",
    hit: "на стене",
    fromCorner: "от угла",
    side: {
      b: "по низу",
      t: "по верху",
      l: "по левой стороне",
      r: "по правой стороне",
    },
    corner: {
      lb: "от левого нижнего угла",
      rb: "от правого нижнего угла",
      lt: "от левого верхнего угла",
      rt: "от правого верхнего угла",
    },
    none: "Для этой раскладки линию не построить (нет прямых швов).",
  },
  en: {
    btn: "Line",
    title: "Layout line",
    on: "Show the layout line",
    h: "Horizontal",
    v: "Vertical",
    hW: "Level (horizontal)",
    vW: "Plumb (vertical)",
    shift: "Move by joints",
    reset: "Default",
    from: {
      l: "from the left edge",
      r: "from the right edge",
      b: "from the bottom",
      t: "from the top",
      bw: "from the floor",
      tw: "from the ceiling / top",
    },
    how: "The line runs in a grout joint. Snap it with chalk or a laser at these sizes and keep the row on it.",
    angled:
      "Angled layout: mark where the line crosses the walls and join the marks.",
    hit: "on the wall",
    fromCorner: "from the corner",
    side: {
      b: "along the bottom",
      t: "along the top",
      l: "along the left side",
      r: "along the right side",
    },
    corner: {
      lb: "from the bottom-left corner",
      rb: "from the bottom-right corner",
      lt: "from the top-left corner",
      rt: "from the top-right corner",
    },
    none: "No straight joint to run a line on in this layout.",
  },
};
const glt = (k) => (GLT[lang] || GLT.en)[k];

function glState(s) {
  s.gl = s.gl || { h: true, v: true, dh: 0, dv: 0 };
  return s.gl;
}
// the joints of the layout, in the layout's own frame
function glJoints(R) {
  const g = +R.T.g || 0,
    xs = new Map(),
    ys = new Map();
  for (const p of R.all) {
    if (p.k !== "r") continue;
    const kx = Math.round((p.x0 - g / 2) * 1000) / 1000,
      ky = Math.round((p.y0 - g / 2) * 1000) / 1000;
    xs.set(kx, (xs.get(kx) || 0) + 1);
    ys.set(ky, (ys.get(ky) || 0) + 1);
  }
  const srt = (m) => [...m.keys()].sort((a, b) => a - b);
  return { xs: srt(xs), ys: srt(ys) };
}
// chord of a line through the outline: its two farthest crossings
function glChord(poly, a, d) {
  const hits = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i],
      q = poly[(i + 1) % poly.length],
      ex = q[0] - p[0],
      ey = q[1] - p[1],
      den = d[0] * ey - d[1] * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = ((p[0] - a[0]) * ey - (p[1] - a[1]) * ex) / den,
      u = ((p[0] - a[0]) * d[1] - (p[1] - a[1]) * d[0]) / den;
    if (u >= -1e-9 && u <= 1 + 1e-9) hits.push({ t, i, u });
  }
  if (hits.length < 2) return null;
  hits.sort((x, y) => x.t - y.t);
  return [hits[0], hits[hits.length - 1]];
}
function glCalc(s, R) {
  if (!R || R.err || !R.all || !R.all.length) return null;
  const st = glState(s),
    J = glJoints(R),
    bb = bboxOf(R.regionL),
    G = R.G,
    W = G.outer || G.region,
    wb = bboxOf(W),
    wall = s.type === "wall",
    inside = (v, a, b) => v > a + 0.25 && v < b - 0.25;
  const xs = J.xs.filter((x) => inside(x, bb.x0, bb.x1)),
    ys = J.ys.filter((y) => inside(y, bb.y0, bb.y1));
  if (!xs.length && !ys.length) return { none: true };
  const near = (arr, v) =>
    arr.reduce(
      (bi, x, i) => (Math.abs(x - v) < Math.abs(arr[bi] - v) ? i : bi),
      0,
    );
  const out = { lines: [], a: R.a || 0 };
  const cx = (bb.x0 + bb.x1) / 2,
    cy = (bb.y0 + bb.y1) / 2;
  if (st.v && xs.length) {
    let i = near(xs, cx) + (st.dv | 0);
    i = Math.max(0, Math.min(xs.length - 1, i));
    out.lines.push({ ax: "v", L: xs[i], i, n: xs.length });
  }
  if (st.h && ys.length) {
    let i0;
    if (wall && R.ledger && R.ledger.y != null)
      i0 = near(ys, R.toL ? R.toL([0, R.ledger.y])[1] : R.ledger.y);
    else if (wall)
      i0 = 0; // top of the first row
    else i0 = near(ys, cy);
    let i = Math.max(0, Math.min(ys.length - 1, i0 + (st.dh | 0)));
    out.lines.push({ ax: "h", L: ys[i], i, n: ys.length });
  }
  // to world, clipped to the outline; distances to the walls
  out.lines.forEach((ln) => {
    const pL = ln.ax === "v" ? [ln.L, cy] : [cx, ln.L],
      dL = ln.ax === "v" ? [0, 1] : [1, 0],
      p = R.toW ? R.toW(pL) : pL,
      p2 = R.toW
        ? R.toW([pL[0] + dL[0], pL[1] + dL[1]])
        : [pL[0] + dL[0], pL[1] + dL[1]],
      d = [p2[0] - p[0], p2[1] - p[1]],
      ch = glChord(W, p, d);
    if (!ch) return;
    ln.A = [p[0] + d[0] * ch[0].t, p[1] + d[1] * ch[0].t];
    ln.B = [p[0] + d[0] * ch[1].t, p[1] + d[1] * ch[1].t];
    if (!out.a) {
      // straight layout: plain distances from the sides
      if (ln.ax === "v") ln.dist = { l: p[0] - wb.x0, r: wb.x1 - p[0] };
      else
        ln.dist = wall
          ? { bw: p[1] - wb.y0, tw: wb.y1 - p[1] }
          : { b: p[1] - wb.y0, t: wb.y1 - p[1] };
    } else {
      // angled: where it crosses the walls, from the nearer corner of that wall
      ln.hits = ch.map((h) => {
        const a = W[h.i],
          b = W[(h.i + 1) % W.length],
          len = Math.hypot(b[0] - a[0], b[1] - a[1]),
          s0 = h.u * len;
        const ci = s0 <= len - s0 ? h.i : (h.i + 1) % W.length,
          c = W[ci],
          mx = (wb.x0 + wb.x1) / 2,
          my = (wb.y0 + wb.y1) / 2,
          horiz = Math.abs(b[0] - a[0]) >= Math.abs(b[1] - a[1]),
          em = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        return {
          edge: h.i,
          d: Math.min(s0, len - s0),
          corner: ci,
          side: horiz ? (em[1] < my ? "b" : "t") : em[0] < mx ? "l" : "r",
          ck: (c[0] < mx ? "l" : "r") + (c[1] < my ? "b" : "t"),
        };
      });
    }
  });
  out.lines = out.lines.filter((l) => l.A);
  return out;
}
function glSVG(s, R, px, fs) {
  if (DB.glOff || S.client) return "";
  const st = glState(s);
  if (st.off) return "";
  const C = glCalc(s, R);
  if (!C || C.none) return "";
  const col = "#e8590c";
  let h = "";
  const T = (x, y, txt, anchor) =>
    `<text x="${x}" y="${-y}" font-size="${px(11.5 * fs)}" text-anchor="${anchor || "middle"}" dominant-baseline="central" fill="${col}" font-weight="800" font-family="${FONT}" paint-order="stroke" stroke="${PAL.bg}" stroke-width="${px(3.5)}" pointer-events="none">${esc(txt)}</text>`;
  C.lines.forEach((ln) => {
    const ext = +px(10),
      dx = ln.B[0] - ln.A[0],
      dy = ln.B[1] - ln.A[1],
      L = Math.hypot(dx, dy) || 1,
      ux = dx / L,
      uy = dy / L,
      A = [ln.A[0] - ux * ext, ln.A[1] - uy * ext],
      B = [ln.B[0] + ux * ext, ln.B[1] + uy * ext];
    h += `<line class="glLine" x1="${A[0]}" y1="${-A[1]}" x2="${B[0]}" y2="${-B[1]}" stroke="${col}" stroke-width="${px(2.2)}" stroke-dasharray="${px(10)} ${px(4)} ${px(2)} ${px(4)}" pointer-events="none"/>`;
    // a small target at both ends
    [A, B].forEach(
      (q) =>
        (h += `<circle cx="${q[0]}" cy="${-q[1]}" r="${px(3.2)}" fill="${col}" pointer-events="none"/>`),
    );
    // sizes go just inside the outline, next to the line's start, so they don't sit on the room sizes
    const inA = [ln.A[0] + ux * +px(22), ln.A[1] + uy * +px(22)];
    if (ln.dist) {
      if (ln.ax === "v") {
        const k = ln.dist;
        h += T(inA[0] - +px(5), inA[1], `◂ ${fmtIn(k.l)}`, "end");
        h += T(inA[0] + +px(5), inA[1], `${fmtIn(k.r)} ▸`, "start");
      } else {
        const k = ln.dist,
          lo = k.bw != null ? k.bw : k.b,
          hi = k.tw != null ? k.tw : k.t;
        h += T(inA[0], inA[1] + +px(9), `▴ ${fmtIn(hi)}`, "start");
        h += T(inA[0], inA[1] - +px(9), `▾ ${fmtIn(lo)}`, "start");
      }
    } else if (ln.hits) {
      ln.hits.forEach((hh, k) => {
        const q = k ? [ln.B[0] - ux * +px(22), ln.B[1] - uy * +px(22)] : inA;
        h += T(q[0], q[1], `${fmtIn(hh.d)}`);
      });
    }
  });
  return h;
}
function glModal() {
  const s = !isMulti() && cur();
  if (!s || !R) return;
  const st = glState(s),
    C = glCalc(s, R),
    wall = s.type === "wall",
    F = glt("from"),
    on = !DB.glOff && !st.off;
  let h = `<h3>⊹ ${glt("title")} — ${esc(s.name)}</h3>`;
  h += `<label class="chk"><input type="checkbox" data-gl="on" ${on ? "checked" : ""}> ${glt("on")}</label>`;
  if (!C || C.none) h += `<p class="hint">${glt("none")}</p>`;
  else {
    ["h", "v"].forEach((ax) => {
      const ln = C.lines.find((l) => l.ax === ax),
        name = wall ? glt(ax + "W") : glt(ax);
      h += `<div class="glrow"><label class="chk"><input type="checkbox" data-gl="${ax}" ${st[ax] ? "checked" : ""}> <b>${name}</b></label>`;
      if (ln) {
        h += `<div class="glsh"><span>${glt("shift")}</span><button class="btn sm" data-act="glShift:${ax}:-1">${ax === "v" ? "◀" : "▼"}</button><b>${ln.i + 1}/${ln.n}</b><button class="btn sm" data-act="glShift:${ax}:1">${ax === "v" ? "▶" : "▲"}</button></div>`;
        if (ln.dist)
          h += `<div class="pcm">${Object.keys(ln.dist)
            .map((k) => `<div>${F[k]}: <b>${fmtIn(ln.dist[k])}″</b></div>`)
            .join("")}</div>`;
        else if (ln.hits)
          h += `<div class="pcm">${ln.hits
            .map(
              (q, i) =>
                `<div>${glt("side")[q.side]}: <b>${fmtIn(q.d)}″</b> ${glt("corner")[q.ck]}</div>`,
            )
            .join("")}</div>`;
      }
      h += `</div>`;
    });
    h += `<p class="hint">${glt("how")}${C.a ? " " + glt("angled") : ""}</p>`;
  }
  h += `<div class="btns"><button class="btn" data-act="glShift:reset">${glt("reset")}</button><button class="btn p" data-act="closeModal">${t("done")}</button></div>`;
  modal(h);
}
document.addEventListener("change", (e) => {
  const el = e.target;
  if (!el.dataset || !el.dataset.gl) return;
  const s = cur();
  if (!s) return;
  const st = glState(s);
  if (el.dataset.gl === "on") {
    if (el.checked) {
      DB.glOff = false;
      st.off = false;
    } else st.off = true;
  } else st[el.dataset.gl] = el.checked;
  saveSoon();
  draw();
  renderTools();
  glModal();
});
function glAct(a, arg) {
  const s = !isMulti() && cur();
  if (a === "glToggle") {
    // one tap: the whole feature on / off
    DB.glOff = !DB.glOff;
    if (!DB.glOff && s) glState(s).off = false;
    saveSoon();
    renderTools();
    draw();
    if (!DB.glOff) toast(glt("title") + " ⊹", false);
    return;
  }
  if (!s) return;
  const st = glState(s);
  if (a === "glShift") {
    if (arg === "reset") {
      st.dh = st.dv = 0;
      st.h = st.v = true;
    } else {
      const [ax, d] = arg.split(":"),
        ln0 = ((glCalc(s, R) || {}).lines || []).find((l) => l.ax === ax);
      st["d" + ax] = (st["d" + ax] | 0) + +d;
      // at the last joint: don't keep counting past it
      const ln1 = ((glCalc(s, R) || {}).lines || []).find((l) => l.ax === ax);
      if (ln0 && ln1 && ln0.i === ln1.i) st["d" + ax] -= +d;
    }
    saveSoon();
    draw();
    glModal();
  }
  if (a === "glSet") glModal();
}
