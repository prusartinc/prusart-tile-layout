"use strict";
/* ================= on-drawing editing ================= */
function editDim(key) {
  const [a, b, c] = key.split(":");
  const si = +a,
    s = P.surfaces[si];
  if (!s) return;
  let path, label;
  if (b === "seg") {
    path = `surfaces.${si}.segs.${c}.l`;
    label = `${t("wallN")} ${+c + 1}`;
  } else {
    path = `surfaces.${si}.${b}`;
    label = b === "w" ? t("width") : s.type === "wall" ? t("height") : t("length");
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
  const pre = `surfaces.${si}.openings.${j}`,
    circ = o.shape === "circle";
  let h = `<h3>${esc(t(o.type))} — ${esc(s.name)}</h3><div class="grid">`;
  h += circ
    ? F(t("cx"), pre + ".x", "len", "p") +
      F(t("cy"), pre + ".y", "len", "p") +
      F(t("dia"), pre + ".dia", "len", "p")
    : F(t("fromLeft"), pre + ".x", "len", "p") +
      F(t("fromBottom"), pre + ".y", "len", "p") +
      F(t("width"), pre + ".w", "len", "p") +
      F(t("height"), pre + ".h", "len", "p");
  if (o.type === "niche") h += F(t("depth"), pre + ".d", "len", "p");
  h += "</div>";
  if (TRIMMABLE[o.type]) h += CHK(t("trimmed"), pre + ".trim", 0, "p");
  h += `<p class="hint">${t("dragOpHint")}</p><div class="btns"><button class="btn p" data-act="closeModal">${t("done")}</button><button class="btn d" data-act="delOpenP:${si}:${j}">${t("del")}</button></div>`;
  modal(h);
}
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
    for (let i = 1; i < st.length; i++) len += Math.hypot(st[i][0] - st[i - 1][0], st[i][1] - st[i - 1][1]);
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
    const d = Math.abs((b[0] - a[0]) * (a[1] - pts[i][1]) - (a[0] - pts[i][0]) * (b[1] - a[1])) / L;
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
  for (let x = 0; x < W; x += 20) h += `<line x1="${x}" x2="${x}" y1="0" y2="${H}" stroke="#ece7de"/>`;
  for (let y = 0; y < H; y += 20) h += `<line y1="${y}" y2="${y}" x1="0" x2="${W}" stroke="#ece7de"/>`;
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
    if (df <= tol && (!best || df < best.df - 0.01 || (Math.abs(df - best.df) <= 0.01 && c % 90 === 0)))
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
    const h = (snapDeg((Math.atan2(-(b[1] - a[1]), b[0] - a[0]) * 180) / Math.PI) * Math.PI) / 180;
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
    if (!M.length || Math.hypot(q[0] - M[M.length - 1][0], q[1] - M[M.length - 1][1]) > diag * 0.04)
      M.push(q);
  });
  while (M.length > 3 && Math.hypot(M[0][0] - M[M.length - 1][0], M[0][1] - M[M.length - 1][1]) < diag * 0.1)
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
