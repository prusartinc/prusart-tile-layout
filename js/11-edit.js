"use strict";
/* ================= on-drawing editing ================= */
function editDim(key) {
  const [a, b, c] = key.split(":");
  const si = +a,
    s = P.surfaces[si];
  if (!s) return;
  if (b === "gap") return walkFixModal(si);
  let path, label;
  if (b === "seg") {
    path = `surfaces.${si}.segs.${c}.l`;
    label = `${t("wallN")} ${+c + 1}`;
  } else {
    path = `surfaces.${si}.${b}`;
    label =
      b === "w" ? t("width") : s.type === "wall" ? t("height") : t("length");
  }
  modal(
    `<h3>${esc(s.name)} — ${esc(label)}</h3><div class="grid">${F(label, path, "len", "p", "w2")}</div><div class="btns"><button class="btn p" data-act="closeModal">${t("done")}</button></div>`,
  );
  setTimeout(() => {
    const i = $("#mbody input");
    if (i) {
      i.focus();
      i.select();
    }
  }, 60);
}
function editOpening(si, j) {
  const s = P.surfaces[si],
    o = s && s.openings[j];
  if (!o) return;
  if (o.type === "niche") return nicheModal(si, j);
  if (o.pi) return linkedCutModal(s, o);
  const pre = `surfaces.${si}.openings.${j}`,
    circ = o.shape === "circle";
  let h = `<h3>${esc(opName(o))} — ${esc(s.name)}</h3>`;
  // distances to the nearest walls (or the side the user picked)
  const D = opDists(s, o);
  if (D) {
    h += `<p class="hsec">${odT(circ ? "titleC" : "titleE")}</p><div class="grid">`;
    ["h", "v"].forEach((ax) => {
      const k = opSide(s, o, ax, D),
        v = D[k];
      if (v == null) return;
      h += `<label class="f"><span>${odL(s, k)} <button type="button" class="btn sm odsw" data-act="opSideSw:${si}:${j}:${ax}" title="${odT("sw")}">⇄</button></span><input data-opw="${si}:${j}:${k}" data-t="len" value="${fmtIn(v)}" autocomplete="off"></label>`;
    });
    h += `</div><p class="hint">${["l", "r", "b", "t"]
      .filter((k) => D[k] != null)
      .map((k) => `${odL(s, k)}: <b>${fmtIn(D[k])}″</b>`)
      .join(" · ")}</p>`;
  }
  h += `<div class="grid">`;
  h += circ
    ? F(t("dia"), pre + ".dia", "len", "p")
    : F(t("width"), pre + ".w", "len", "p") +
      F(t("height"), pre + ".h", "len", "p");
  if (o.type === "niche") h += F(t("depth"), pre + ".d", "len", "p");
  h += "</div>";
  if (TRIMMABLE[o.type]) h += CHK(t("trimmed"), pre + ".trim", 0, "p");
  h += `<p class="hint">${t("dragOpHint")}</p><div class="btns"><button class="btn p" data-act="closeModal">${t("done")}</button><button class="btn d" data-act="delOpenP:${si}:${j}">${t("del")}</button></div>`;
  modal(h);
}
/* ---------- opening ↔ wall distances ---------- */
const ODT = {
  ru: {
    titleC: "Центр от стен",
    titleE: "Край от стен",
    l: "до левой стены",
    r: "до правой стены",
    b: "до нижней стены",
    t: "до верхней стены",
    sw: "считать от другой стены",
  },
  en: {
    titleC: "Center from the walls",
    titleE: "Edge from the walls",
    l: "to left wall",
    r: "to right wall",
    b: "to bottom wall",
    t: "to top wall",
    sw: "measure from the other wall",
  },
};
const ODW = {
  ru: {
    l: "до левого угла",
    r: "до правого угла",
    b: "от пола",
    t: "до потолка",
  },
  en: {
    l: "to left corner",
    r: "to right corner",
    b: "from floor",
    t: "to ceiling",
  },
};
const odT = (k) => (ODT[lang] || ODT.en)[k] || k;
// labels depend on the surface: on a wall the sides are corners, floor and ceiling
const odL = (s, k) =>
  s && s.type === "wall" ? (ODW[lang] || ODW.en)[k] : odT(k);
function opCenter(o) {
  return o.shape === "circle" || o.w == null
    ? [+o.x, +o.y]
    : [+o.x + +o.w / 2, +o.y + +o.h / 2];
}
// distance along a ray from p in direction (dx,dy) to the first outline edge
function rayToPoly(poly, p, dx, dy) {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i],
      b = poly[(i + 1) % poly.length],
      ex = b[0] - a[0],
      ey = b[1] - a[1],
      den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = ((a[0] - p[0]) * ey - (a[1] - p[1]) * ex) / den,
      u = ((a[0] - p[0]) * dy - (a[1] - p[1]) * dx) / den;
    if (t > 1e-6 && u >= -1e-6 && u <= 1 + 1e-6 && t < best) best = t;
  }
  return isFinite(best) ? best : null;
}
// center (round) or near edge (rectangle) to the wall in each direction
function opDists(s, o) {
  let poly;
  try {
    poly = outerPoly(s);
  } catch (e) {
    return null;
  }
  if (!poly || poly.length < 3) return null;
  const c = opCenter(o),
    hw = o.shape === "circle" || o.w == null ? 0 : +o.w / 2,
    hh = o.shape === "circle" || o.h == null ? 0 : +o.h / 2,
    r = (d, k) => (d == null ? null : Math.round((d - k) * 16) / 16);
  return {
    l: r(rayToPoly(poly, c, -1, 0), hw),
    r: r(rayToPoly(poly, c, 1, 0), hw),
    b: r(rayToPoly(poly, c, 0, -1), hh),
    t: r(rayToPoly(poly, c, 0, 1), hh),
  };
}
// which wall a value is measured from: the user's pick, else the nearest one
function opSide(s, o, ax, D) {
  const pick = o.ref && o.ref[ax],
    A = ax === "h" ? ["l", "r"] : ["b", "t"];
  if (pick && D[pick] != null) return pick;
  // on a wall, heights are measured from the floor unless chosen otherwise
  if (s && s.type === "wall" && ax === "v" && D.b != null) return "b";
  if (D[A[0]] == null) return A[1];
  if (D[A[1]] == null) return A[0];
  return D[A[0]] <= D[A[1]] ? A[0] : A[1];
}
function opSideSw(si, j, ax) {
  const s = P.surfaces[si],
    o = s && s.openings[j];
  if (!o) return;
  const D = opDists(s, o),
    cur = opSide(s, o, ax, D),
    A = ax === "h" ? ["l", "r"] : ["b", "t"];
  o.ref = Object.assign({}, o.ref, { [ax]: cur === A[0] ? A[1] : A[0] });
  saveSoon();
  editOpening(si, j);
}
function opwInp(e) {
  const el = e.target;
  if (!el.dataset || !el.dataset.opw) return;
  const [si, j, k] = el.dataset.opw.split(":"),
    s = P.surfaces[+si],
    o = s && s.openings[+j];
  if (!o) return;
  const v = parseLen(el.value);
  if (!isFinite(v) || v < 0) return el.classList.add("bad");
  el.classList.remove("bad");
  const D = opDists(s, o);
  if (!D || D[k] == null) return;
  const sh = v - D[k]; // how far the item must move away from that wall
  if (k === "l") o.x = +o.x + sh;
  if (k === "r") o.x = +o.x - sh;
  if (k === "b") o.y = +o.y + sh;
  if (k === "t") o.y = +o.y - sh;
  o.x = Math.round(o.x * 16) / 16;
  o.y = Math.round(o.y * 16) / 16;
  // remember the wall the user typed against
  o.ref = Object.assign({}, o.ref, {
    [k === "l" || k === "r" ? "h" : "v"]: k,
  });
  changed();
  if (e.type === "change") {
    editOpening(+si, +j);
    if (!isMulti()) renderPanel();
  }
}
// live distance lines while an opening is dragged
function opDragSVG(s, o, px, fs0) {
  const D = opDists(s, o);
  if (!D) return "";
  const c = opCenter(o),
    hw = o.shape === "circle" || o.w == null ? 0 : +o.w / 2,
    hh = o.shape === "circle" || o.h == null ? 0 : +o.h / 2;
  let h = "";
  ["h", "v"].forEach((ax) => {
    const k = opSide(s, o, ax, D),
      d = D[k];
    if (d == null) return;
    const dir = { l: [-1, 0], r: [1, 0], b: [0, -1], t: [0, 1] }[k],
      x1 = c[0] + dir[0] * hw,
      y1 = c[1] + dir[1] * hh,
      x2 = x1 + dir[0] * d,
      y2 = y1 + dir[1] * d;
    h += `<line x1="${x1}" y1="${-y1}" x2="${x2}" y2="${-y2}" stroke="#d0342c" stroke-width="${px(1.6)}" stroke-dasharray="${px(4)} ${px(3)}"/>`;
    h += `<text x="${(x1 + x2) / 2}" y="${-(y1 + y2) / 2}" font-size="${px(14 * (fs0 || 1))}" text-anchor="middle" dominant-baseline="central" fill="#d0342c" font-weight="800" font-family="${FONT}" paint-order="stroke" stroke="#fff" stroke-width="${px(4)}">${fmtIn(d)}″</text>`;
  });
  return h;
}
document.addEventListener("input", opwInp);
document.addEventListener("change", opwInp);
$("#mbody").addEventListener("input", onInp);
$("#mbody").addEventListener("change", onInp);
$("#mbody").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.tagName === "INPUT") {
    e.preventDefault();
    closeModal();
  }
});
function padTarget() {
  if (cur()) return cur();
  if (isMulti()) {
    const it = S.items.find((i) => i.s.id === S.sel) || S.items[0];
    return it ? it.s : null;
  }
  return null;
}
function nudgeS(s, dir) {
  if (!s) return;
  const d = S.step;
  if (zoneMode()) {
    const p = (s.pos = s.pos || { x: 0, y: 0 });
    s.posUser = true; // placed by hand: don't snap it back into the room
    if (dir === "l") p.x = +p.x - d;
    if (dir === "r") p.x = +p.x + d;
    if (dir === "u") p.y = +p.y + d;
    if (dir === "d") p.y = +p.y - d;
    return;
  }
  if (S.layer === "prep") {
    const o = (s.prepO = s.prepO || { x: 0, y: 0 });
    if (dir === "l") o.x -= d;
    if (dir === "r") o.x += d;
    if (dir === "u") o.y += d;
    if (dir === "d") o.y -= d;
    return;
  }
  const T = effT(s);
  let x = T.ox,
    y = T.oy;
  if (dir === "l") x -= d;
  if (dir === "r") x += d;
  if (dir === "u") y += d;
  if (dir === "d") y -= d;
  setO(s, x, y);
  normalizeS(s);
}
let repT = null,
  repI = null;
function stopRep() {
  if (repT) {
    clearTimeout(repT);
    repT = null;
  }
  if (repI) {
    clearInterval(repI);
    repI = null;
    changed();
  }
}
$("#pad").addEventListener("pointerdown", (e) => {
  const b = e.target.closest("[data-nudge]");
  if (!b) return;
  e.preventDefault();
  const dir = b.dataset.nudge,
    s = padTarget();
  if (!s) return;
  if (zoneMode()) S.vbLock = { vb: S.vb.slice(), upp: S.upp };
  nudgeS(s, dir);
  drawSoon();
  stopRep();
  repI = setInterval(() => {}, 1e9);
  clearInterval(repI);
  repI = null;
  repT = setTimeout(() => {
    repI = setInterval(() => {
      nudgeS(s, dir);
      drawSoon();
    }, 70);
  }, 380);
  const end = () => {
    stopRep();
    S.vbLock = null;
    changed();
    b.removeEventListener("pointerup", end);
    b.removeEventListener("pointerleave", end);
    b.removeEventListener("pointercancel", end);
  };
  b.addEventListener("pointerup", end);
  b.addEventListener("pointerleave", end);
  b.addEventListener("pointercancel", end);
});
document.addEventListener("keydown", (e) => {
  if (
    (e.ctrlKey || e.metaKey) &&
    e.key.toLowerCase() === "z" &&
    !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)
  ) {
    e.preventDefault();
    if (e.shiftKey) doRedo();
    else doUndo();
  }
});

/* ================= draw shape / help ================= */
let DRAW = null;
function drawModal() {
  const s = cur();
  if (!s) return;
  DRAW = { pts: [], stroke: null };
  modal(`<h3>✏️ ${t("drawTitle")}</h3><p class="hint">${t("drawHint")}</p><svg id="dsvg" style="width:100%;height:52vh;background:#fbfaf7;border:1px solid var(--line);border-radius:10px;touch-action:none;display:block"></svg>
 <div class="btns"><button class="btn" data-act="drawUndo">↶ ${t("drawUndoPt")}</button><button class="btn" data-act="drawClear">${t("drawClear")}</button><button class="btn p" data-act="drawApply">${t("drawApply")}</button><button class="btn" data-act="closeModal">${t("close")}</button></div>`);
  const el = $("#dsvg");
  requestAnimationFrame(() => {
    const r = el.getBoundingClientRect();
    DRAW.W = r.width;
    DRAW.H = r.height;
    el.setAttribute("viewBox", `0 0 ${r.width} ${r.height}`);
    renderDraw();
  });
  const pt = (e) => {
    const r = el.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    DRAW.stroke = [pt(e)];
    renderDraw();
  });
  el.addEventListener("pointermove", (e) => {
    if (!DRAW.stroke) return;
    const q = pt(e),
      l = DRAW.stroke[DRAW.stroke.length - 1];
    if (Math.hypot(q[0] - l[0], q[1] - l[1]) > 3) {
      DRAW.stroke.push(q);
      renderDraw();
    }
  });
  const up = () => {
    if (!DRAW.stroke) return;
    const st = DRAW.stroke;
    DRAW.stroke = null;
    let len = 0;
    for (let i = 1; i < st.length; i++)
      len += Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1]);
    if (len < 10) {
      DRAW.pts.push(st[0]);
    } else {
      const diag = Math.hypot(DRAW.W, DRAW.H);
      const simp = rdp(st, diag * 0.025);
      const add =
        DRAW.pts.length &&
        Math.hypot(
          simp[0][0] - DRAW.pts[DRAW.pts.length - 1][0],
          simp[0][1] - DRAW.pts[DRAW.pts.length - 1][1],
        ) <
          diag * 0.05
          ? simp.slice(1)
          : simp;
      DRAW.pts.push(...add);
    }
    renderDraw();
  };
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
}
function rdp(pts, eps) {
  if (pts.length < 3) return pts.slice();
  const a = pts[0],
    b = pts[pts.length - 1];
  let mx = -1,
    ix = 0;
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-9;
  for (let i = 1; i < pts.length - 1; i++) {
    const d =
      Math.abs(
        (b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1]),
      ) / L;
    if (d > mx) {
      mx = d;
      ix = i;
    }
  }
  if (mx > eps) {
    const l = rdp(pts.slice(0, ix + 1), eps),
      r = rdp(pts.slice(ix), eps);
    return l.slice(0, -1).concat(r);
  }
  return [a, b];
}
function renderDraw() {
  const el = $("#dsvg");
  if (!el || !DRAW) return;
  let h = "";
  const W = DRAW.W || 300,
    H = DRAW.H || 300;
  for (let x = 0; x < W; x += 20)
    h += `<line x1="${x}" x2="${x}" y1="0" y2="${H}" stroke="#ece7de"/>`;
  for (let y = 0; y < H; y += 20)
    h += `<line y1="${y}" y2="${y}" x1="0" x2="${W}" stroke="#ece7de"/>`;
  const RAW = DRAW.pts,
    P2 = snapPolyline(RAW);
  if (RAW.length)
    h += `<polyline points="${RAW.map((q) => q.join(",")).join(" ")}" fill="none" stroke="#c9c3b8" stroke-width="1.5" stroke-dasharray="3 3"/>`;
  if (P2.length)
    h += `<polyline points="${P2.map((q) => q.join(",")).join(" ")}" fill="none" stroke="#1e2226" stroke-width="2.5"/>`;
  if (P2.length > 2)
    h += `<line x1="${P2[P2.length - 1][0]}" y1="${P2[P2.length - 1][1]}" x2="${P2[0][0]}" y2="${P2[0][1]}" stroke="#7c7765" stroke-width="2" stroke-dasharray="6 4"/>`;
  for (let i = 1; i < P2.length - 1; i++) {
    const a = P2[i - 1],
      b = P2[i],
      c = P2[i + 1];
    const h1 = Math.atan2(-(b[1] - a[1]), b[0] - a[0]),
      h2 = Math.atan2(-(c[1] - b[1]), c[0] - b[0]);
    let d = Math.round(((h2 - h1) * 180) / Math.PI);
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    const ang = 180 - Math.abs(d);
    h += `<text x="${b[0] + 8}" y="${b[1] - 8}" font-size="13" font-weight="700" fill="#2f6fab" font-family="${FONT}" paint-order="stroke" stroke="#fbfaf7" stroke-width="3">${ang}°</text>`;
  }
  P2.forEach(
    (q, i) =>
      (h += `<circle cx="${q[0]}" cy="${q[1]}" r="${i === 0 ? 7 : 5}" fill="${i === 0 ? "#7c7765" : "#1e2226"}"/>`),
  );
  if (DRAW.stroke && DRAW.stroke.length > 1)
    h += `<polyline points="${DRAW.stroke.map((q) => q.join(",")).join(" ")}" fill="none" stroke="#2f6fab" stroke-width="2"/>`;
  if (!P2.length && !DRAW.stroke)
    h += `<text x="${W / 2}" y="${H / 2}" text-anchor="middle" fill="#9a958c" font-size="15" font-family="${FONT}">${esc(t("drawEmpty"))}</text>`;
  el.innerHTML = h;
}
const SNAPS = (() => {
  const a = new Set();
  for (let d = -180; d <= 180; d += 30) a.add(d);
  for (let d = -180; d <= 180; d += 45) a.add(d);
  return [...a];
})();
function snapDeg(d) {
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  let best = null;
  for (const c of SNAPS) {
    const df = Math.abs(d - c),
      tol = c % 90 === 0 ? 15 : 9;
    if (
      df <= tol &&
      (!best ||
        df < best.df - 0.01 ||
        (Math.abs(df - best.df) <= 0.01 && c % 90 === 0))
    )
      best = { c, df };
  }
  return best ? best.c : Math.round(d);
}
function snapPolyline(pts) {
  if (pts.length < 2) return pts.slice();
  const out = [pts[0].slice()];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1],
      b = pts[i],
      L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const h =
      (snapDeg((Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180) / Math.PI) *
        Math.PI) /
      180;
    const pr = out[out.length - 1];
    out.push([pr[0] + L * Math.cos(h), pr[1] - L * Math.sin(h)]);
  }
  return out;
}
function straighten(raw, target) {
  let P0 = raw.map((q) => [q[0], -q[1]]);
  const bb = bboxOf(P0),
    diag = Math.hypot(bb.x1 - bb.x0, bb.y1 - bb.y0) || 1;
  const M = [];
  P0.forEach((q) => {
    if (
      !M.length ||
      Math.hypot(q[0] - M[M.length - 1][0], q[1] - M[M.length - 1][1]) >
        diag * 0.04
    )
      M.push(q);
  });
  while (
    M.length > 3 &&
    Math.hypot(M[0][0] - M[M.length - 1][0], M[0][1] - M[M.length - 1][1]) <
      diag * 0.1
  )
    M.pop();
  if (M.length < 3) return null;
  const n = M.length,
    hs = [],
    L0 = [];
  for (let i = 0; i < n; i++) {
    const a = M[i],
      b = M[(i + 1) % n];
    let d = snapDeg((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI);
    hs.push((d * Math.PI) / 180);
    L0.push(Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  let a11 = 0,
    a12 = 0,
    a22 = 0,
    b1 = 0,
    b2 = 0;
  hs.forEach((h, i) => {
    const c = Math.cos(h),
      sn = Math.sin(h);
    a11 += c * c;
    a12 += c * sn;
    a22 += sn * sn;
    b1 += L0[i] * c;
    b2 += L0[i] * sn;
  });
  const det = a11 * a22 - a12 * a12;
  let L = L0.slice();
  if (Math.abs(det) > 1e-9) {
    const l1 = (b1 * a22 - b2 * a12) / det,
      l2 = (a11 * b2 - a12 * b1) / det;
    const Lc = hs.map((h, i) => L0[i] - (Math.cos(h) * l1 + Math.sin(h) * l2));
    if (Lc.every((v) => v > diag * 0.01)) L = Lc;
  }
  let x = 0,
    y = 0;
  const pts = [[0, 0]];
  hs.forEach((h, i) => {
    x += L[i] * Math.cos(h);
    y += L[i] * Math.sin(h);
    pts.push([x, y]);
  });
  pts.pop();
  const b3 = bboxOf(pts),
    k = target / Math.max(b3.x1 - b3.x0, b3.y1 - b3.y0);
  const segs = polyToSegs(pts.map((q) => [q[0] * k, q[1] * k]));
  segs.forEach((g) => {
    g.l = Math.max(1, Math.round(g.l * 2) / 2);
    g.a = Math.round(g.a);
  });
  return segs;
}
/* which measured side is wrong? offer to fix one horizontal and one vertical side */
function walkMiss(s) {
  let x = 0,
    y = 0,
    h = ((+s.a0 || 0) * Math.PI) / 180;
  const H = [];
  (s.segs || []).forEach((g) => {
    H.push(h);
    x += (+g.l || 0) * Math.cos(h);
    y += (+g.l || 0) * Math.sin(h);
    h += ((+g.a || 0) * Math.PI) / 180;
  });
  return { x, y, H };
}
function walkFixModal(si) {
  const s = P.surfaces[si];
  if (!s || s.shape !== "walk") return;
  const { x, y, H } = walkMiss(s);
  if (Math.hypot(x, y) <= 0.1) {
    closeModal();
    toast("✓ " + t("walkFixOk"));
    return;
  }
  const opts = (ax, d) =>
    s.segs
      .map((g, i) => {
        const c = ax ? Math.sin(H[i]) : Math.cos(H[i]);
        if (Math.abs(c) < 0.999) return "";
        const nl = Math.round((+g.l - d * Math.sign(c)) * 16) / 16;
        if (nl < 0.5) return "";
        return `<button class="btn" data-act="walkFix:${si}:${i}:${nl}">${t("wallN")} ${i + 1}: ${fmt(+g.l)} → <b>${fmt(nl)}</b></button>`;
      })
      .join("");
  let h = `<h3>⚠ ${t("walkFixT")}</h3><p class="hint">${t("walkFixQ")}</p>`;
  const ox = Math.abs(x) > 0.05 ? opts(0, x) : "",
    oy = Math.abs(y) > 0.05 ? opts(1, y) : "";
  if (Math.abs(x) > 0.05)
    h += `<h4>${t("walkFixX")} ${fmt(Math.abs(x))}</h4><div class="btns">${ox || "—"}</div>`;
  if (Math.abs(y) > 0.05)
    h += `<h4>${t("walkFixY")} ${fmt(Math.abs(y))}</h4><div class="btns">${oy || "—"}</div>`;
  if ((Math.abs(x) > 0.05 && !ox) || (Math.abs(y) > 0.05 && !oy))
    h += `<p class="note">${t("walkFixA")}</p>`;
  h += `<div class="btns"><button class="btn" data-act="closeWalk">${t("closeWalk")}</button><button class="btn p" data-act="closeModal">${t("manual")}</button></div>`;
  modal(h);
}
function closeWalk(s) {
  const g = s.segs,
    n = g.length;
  if (n < 3) return false;
  let h = 0;
  const H = [];
  g.forEach((q) => {
    H.push(h);
    h += ((+q.a || 0) * Math.PI) / 180;
  });
  let vx = 0,
    vy = 0;
  for (let i = 0; i < n - 2; i++) {
    vx += +g[i].l * Math.cos(H[i]);
    vy += +g[i].l * Math.sin(H[i]);
  }
  const c1 = Math.cos(H[n - 2]),
    s1 = Math.sin(H[n - 2]),
    c2 = Math.cos(H[n - 1]),
    s2 = Math.sin(H[n - 1]),
    det = c1 * s2 - c2 * s1;
  if (Math.abs(det) < 1e-6) return false;
  const l1 = (-vx * s2 + vy * c2) / det,
    l2 = (c1 * -vy + s1 * vx) / det;
  if (l1 <= 0 || l2 <= 0) return false;
  g[n - 2].l = Math.round(l1 * 16) / 16;
  g[n - 1].l = Math.round(l2 * 16) / 16;
  return true;
}
function helpModal() {
  modal(
    `<h3>? ${t("helpTitle")}</h3>${t("helpHtml")}<div class="btns"><button class="btn p" data-act="closeModal">${t("close")}</button></div>`,
  );
}

/* put a full tile edge on the threshold line, a tile centered on the door */
function transStart(s, tr) {
  const T = effT(s);
  if (
    angOf(T) ||
    !["grid", "offset"].includes(patOf(T)) ||
    T.shape === "hex" ||
    T.shape === "penny"
  )
    return false;
  const O = outerPoly(s),
    n = O.length,
    a = O[+tr.edge % n],
    b = O[(+tr.edge + 1) % n],
    L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1,
    ux = (b[0] - a[0]) / L,
    uy = (b[1] - a[1]) / L,
    sg = sArea(O) > 0 ? 1 : -1,
    nx = uy * sg,
    ny = -ux * sg,
    d = transExt(tr),
    f0 = Math.max(0, Math.min(L, +tr.from || 0)),
    fc = Math.min(L, f0 + (+tr.len || 0) / 2),
    { tw: lw, th: lh } = rdims(T);
  const cx = a[0] + ux * fc + nx * d,
    cy = a[1] + uy * fc + ny * d;
  if (Math.abs(uy) < 1e-6) {
    // horizontal side: rows start at the threshold
    setO(s, cx - lw / 2, ny < 0 ? cy : cy - lh);
  } else if (Math.abs(ux) < 1e-6) {
    setO(s, nx < 0 ? cx : cx - lw, cy - lh / 2);
  } else return false;
  return true;
}

/* a floor cut-out that belongs to a shower pan / tub: it is changed through the pan or the plan */
function linkedCutModal(s, o) {
  const ru = lang === "ru",
    panS = P.surfaces.find((x) => x.fromPlan === "it" + o.pi),
    D = opDists(s, o);
  let h = `<h3>${esc(opName(o))} — ${esc(s.name)}</h3>`;
  h += `<p>${fmtIn(o.w)}″ × ${fmtIn(o.h)}″${o.pts ? (ru ? " · по форме поддона" : " · follows the pan's shape") : ""}</p>`;
  if (D)
    h += `<p class="hint">${["l", "r", "b", "t"]
      .filter((k) => D[k] != null)
      .map((k) => `${odT(k)}: <b>${fmtIn(D[k])}″</b>`)
      .join(" · ")}</p>`;
  h += `<p class="hint">${
    ru
      ? "Этот вырез — сам " +
        (o.pk === "tub" ? "ванна" : "поддон") +
        ": он меняется вместе с ним. Размер, форму и место меняй " +
        (panS ? "на странице поддона или " : "") +
        "на плане — плитка пола подстроится сама."
      : "This cut-out is the " +
        (o.pk === "tub" ? "tub" : "pan") +
        " itself and changes with it. Change its size, shape and place " +
        (panS ? "on the pan's page or " : "") +
        "on the plan — the floor tile follows."
  }</p><div class="btns">`;
  if (panS)
    h += `<button class="btn p" data-act="goSurf:${P.surfaces.indexOf(panS)}">${ru ? "Открыть поддон" : "Open the pan"}</button>`;
  h += `<button class="btn" data-act="goPlanItem:${o.pi}">${ru ? "Открыть на плане" : "Open on the plan"}</button><button class="btn" data-act="closeModal">${t("close")}</button></div>`;
  modal(h);
}
