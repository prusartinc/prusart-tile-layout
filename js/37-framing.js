"use strict";
/* ================= framing layer =================
   On a wall's elevation (plan page), "🪵 Framing" draws the studs, plates, the framing around
   doors / windows / niches and the blocking you'll want (valve, shower head, glass, niche).
   Studs start as a 16″ (or 24″) layout from one corner; drag any stud to where it really is
   (or type its distance), add or remove studs. The real positions are kept per wall
   (pl.walls[i].studs, centers from the left corner as seen from inside the room). A niche that
   lands on a stud is flagged. */
const FRT = {
  ru: {
    btn: "Каркас",
    title: "Каркас стены",
    oc: "Шаг стоек",
    from: "Разметка от угла",
    f_l: "левого",
    f_r: "правого",
    auto: "Как по шагу",
    add: "+ стойка",
    del: "Удалить стойку",
    studs: "Стойки (центр от левого угла)",
    drag: "Тяни стойку пальцем на виде стены или впиши размер — так отмечаешь, где она на самом деле.",
    real: "отмечено вручную",
    nicheHit: "Ниша попадает на стойку",
    nicheOk: "Ниша между стойками",
    block: "Блокинг",
    b_valve: "смеситель",
    b_head: "лейка",
    b_glass: "стекло",
    b_niche: "ниша",
    b_vanity: "тумба",
    b_shelf: "полка",
    stud: "стойка",
  },
  en: {
    btn: "Framing",
    title: "Wall framing",
    oc: "Stud spacing",
    from: "Layout from the",
    f_l: "left corner",
    f_r: "right corner",
    auto: "Reset to spacing",
    add: "+ stud",
    del: "Delete stud",
    studs: "Studs (center from the left corner)",
    drag: "Drag a stud on the wall view or type its size to mark where it really is.",
    real: "marked by hand",
    nicheHit: "Niche lands on a stud",
    nicheOk: "Niche fits between studs",
    block: "Blocking",
    b_valve: "valve",
    b_head: "shower head",
    b_glass: "glass",
    b_niche: "niche",
    b_vanity: "vanity",
    b_shelf: "shelf",
    stud: "stud",
  },
};
const frt = (k) => (FRT[lang] || FRT.en)[k] || k;
const STUD = 1.5;

function frWall(i) {
  const ws = (P.plan.walls[i] = P.plan.walls[i] || {});
  ws.oc = +ws.oc || 16;
  ws.ocFrom = ws.ocFrom === "r" ? "r" : "l";
  return ws;
}
// openings framed on this wall, in elevation x (from the left corner) and height
function frOpenings(i, pts) {
  const W = planWall(i, pts);
  return P.plan.items
    .filter((it) => it.wall === i && ["door", "window", "niche"].includes(it.k))
    .map((it) => {
      const xc = W.ex(+it.c),
        w = +it.w;
      return {
        it,
        k: it.k,
        x0: xc - w / 2,
        x1: xc + w / 2,
        z0: it.k === "door" ? 0 : +it.z || 0,
        z1: (it.k === "door" ? 0 : +it.z || 0) + (+it.h || 0),
      };
    });
}
// stud centers: what was marked by hand, else the spacing from the chosen corner
function frStuds(i, pts) {
  const ws = frWall(i),
    L = planWall(i, pts).L;
  if (Array.isArray(ws.studs)) return ws.studs.slice().sort((a, b) => a - b);
  const oc = ws.oc,
    out = [STUD / 2];
  for (let x = oc; x < L - STUD; x += oc) out.push(x);
  out.push(L - STUD / 2);
  const xs =
    ws.ocFrom === "r" ? out.map((x) => L - x).sort((a, b) => a - b) : out;
  // door / window openings: no common studs inside them
  const ops = frOpenings(i, pts).filter((o) => o.k !== "niche");
  return xs.filter((x) => !ops.some((o) => x > o.x0 - 3 && x < o.x1 + 3));
}
function frBlocking(i, pts) {
  const W = planWall(i, pts),
    out = [];
  P.plan.items.forEach((it) => {
    if (it.wall !== i) return;
    const xc = W.ex(+it.c);
    if (it.k === "valve") out.push({ z: +it.z, x: xc, k: "valve" });
    if (it.k === "head") out.push({ z: +it.z, x: xc, k: "head" });
    if (it.k === "vanity")
      out.push({ z: (+it.h || 34) - 4, x: xc, k: "vanity", w: +it.w });
    if (it.k === "shelf") out.push({ z: +it.z, x: xc, k: "shelf", w: +it.w });
  });
  // glass whose end meets this wall: clamps at 3 heights
  P.plan.items
    .filter((g) => g.k === "glass")
    .forEach((g) => {
      const G = planGlassEnds(g);
      [G.A, G.B].forEach((q) => {
        const s = (q[0] - W.a[0]) * W.u[0] + (q[1] - W.a[1]) * W.u[1],
          d = (q[0] - W.a[0]) * W.nin[0] + (q[1] - W.a[1]) * W.nin[1];
        if (Math.abs(d) > 2 || s < -1 || s > W.L + 1) return;
        const z0 = +g.z || 0,
          gh = +g.h || 72;
        [z0 + 6, z0 + gh / 2, z0 + gh - 6].forEach((z) =>
          out.push({ z, x: W.ex(s), k: "glass" }),
        );
      });
    });
  return out;
}
function frameSVG(i, W, L, H, k, Y) {
  const pts = planPts(),
    xs = frStuds(i, pts),
    ops = frOpenings(i, pts),
    wood = "#c89a5a",
    edge = "#7a5a2e",
    R = (x, z, w, h, extra = "") =>
      `<rect x="${x}" y="${Y(z + h)}" width="${w}" height="${h}" fill="${wood}" fill-opacity=".55" stroke="${edge}" stroke-width="${0.5 * k}" ${extra}/>`;
  let h = `<g class="frame">`;
  h += R(0, 0, L, STUD) + R(0, H - 2 * STUD, L, STUD) + R(0, H - STUD, L, STUD);
  xs.forEach((x, j) => {
    const hit = ops.some(
      (o) => o.k === "niche" && x + STUD / 2 > o.x0 && x - STUD / 2 < o.x1,
    );
    h += `<g data-stud="${i}:${j}" style="cursor:ew-resize">${R(x - STUD / 2, STUD, STUD, H - 3 * STUD, hit ? `stroke="#d0342c" stroke-width="${1.4 * k}"` : "")}<rect x="${x - 6 * k}" y="${Y(H - 2 * STUD)}" width="${12 * k}" height="${H - 3 * STUD}" fill="transparent"/></g>`;
    // close studs: every other label one line lower
    const low = j > 0 && x - xs[j - 1] < 14 * k && j % 2 === 1;
    h += plText(x, Y(STUD) + (low ? 17 : 9) * k, fmtIn(x), 6.5 * k, {
      fill: edge,
      fw: 700,
      bg: "#fff",
    });
  });
  // doors / windows: jacks, kings, header (+ sill and cripples for windows); niches: header & sill blocks
  ops.forEach((o) => {
    if (o.k === "niche") {
      h +=
        R(o.x0, o.z0 - STUD, o.x1 - o.x0, STUD) +
        R(o.x0, o.z1, o.x1 - o.x0, STUD);
      return;
    }
    const hd = 5.5;
    h +=
      R(o.x0 - STUD, STUD, STUD, o.z1 - STUD) +
      R(o.x1, STUD, STUD, o.z1 - STUD); // jacks
    h +=
      R(o.x0 - 2 * STUD, STUD, STUD, H - 3 * STUD) +
      R(o.x1 + STUD, STUD, STUD, H - 3 * STUD); // kings
    h += R(o.x0 - STUD, o.z1, o.x1 - o.x0 + 2 * STUD, hd); // header
    if (o.k === "window") h += R(o.x0, o.z0 - STUD, o.x1 - o.x0, STUD);
  });
  // blocking: a 2× between the two studs around each point
  frBlocking(i, pts).forEach((b) => {
    const left = Math.max(
        ...xs.filter((x) => x <= b.x - (b.w || 0) / 2).concat([STUD / 2]),
      ),
      right = Math.min(
        ...xs.filter((x) => x >= b.x + (b.w || 0) / 2).concat([L - STUD / 2]),
      );
    h += R(
      left + STUD / 2,
      b.z - STUD / 2,
      Math.max(STUD, right - left - STUD),
      STUD,
      `fill="#4f8a3c" fill-opacity=".6"`,
    );
    h += plText(
      (left + right) / 2,
      Y(b.z) - 5 * k,
      `${frt("block")}: ${frt("b_" + b.k)} ${fmtIn(b.z)}″`,
      5.5 * k,
      { fill: "#2f5d24", fw: 700, bg: "#fff" },
    );
  });
  return h + `</g>`;
}
// sheet block under the wall view
function frameSheet(i) {
  const ws = frWall(i),
    pts = planPts(),
    xs = frStuds(i, pts),
    manual = Array.isArray(ws.studs),
    ops = frOpenings(i, pts).filter((o) => o.k === "niche");
  let h = `<h4>🪵 ${frt("title")} · ${pt("plWall")} ${i + 1}</h4>`;
  h += `<div class="grid2"><label class="f"><span>${frt("oc")}</span><select data-fr="oc:${i}"><option ${ws.oc === 16 ? "selected" : ""} value="16">16″</option><option ${ws.oc === 24 ? "selected" : ""} value="24">24″</option><option ${ws.oc === 12 ? "selected" : ""} value="12">12″</option></select></label><label class="f"><span>${frt("from")}</span><select data-fr="from:${i}"><option value="l" ${ws.ocFrom === "l" ? "selected" : ""}>${frt("f_l")}</option><option value="r" ${ws.ocFrom === "r" ? "selected" : ""}>${frt("f_r")}</option></select></label></div>`;
  ops.forEach((o) => {
    const hit = xs.find((x) => x + STUD / 2 > o.x0 && x - STUD / 2 < o.x1);
    h += `<p class="hint">${hit != null ? `⚠ <b style="color:#d0342c">${frt("nicheHit")}</b> ${fmtIn(hit)}″` : `✓ ${frt("nicheOk")}`} (${fmtIn(o.x0)}–${fmtIn(o.x1)}″)</p>`;
  });
  h += `<p class="hsec">${frt("studs")}${manual ? ` · ${frt("real")}` : ""}</p><div class="frl">${xs
    .map(
      (x, j) =>
        `<label><input data-fr="x:${i}:${j}" data-t="len" value="${fmtIn(x)}" autocomplete="off"><button class="btn sm d" data-act="frDel:${i}:${j}" title="${frt("del")}">✕</button></label>`,
    )
    .join("")}</div>`;
  h += `<div class="btns"><button class="btn sm" data-act="frAdd:${i}">${frt("add")}</button>${manual ? `<button class="btn sm" data-act="frAuto:${i}">${frt("auto")}</button>` : ""}</div><p class="hint">${frt("drag")}</p>`;
  return h;
}
function frMaterialize(i) {
  const ws = frWall(i);
  if (!Array.isArray(ws.studs)) ws.studs = frStuds(i, planPts());
  return ws.studs;
}
function frAct(a, arg) {
  const [i, j] = String(arg).split(":").map(Number),
    ws = frWall(i);
  if (a === "frAuto") delete ws.studs;
  if (a === "frDel") {
    const st = frMaterialize(i).sort((x, y) => x - y);
    st.splice(j, 1);
  }
  if (a === "frAdd") {
    const st = frMaterialize(i).sort((x, y) => x - y),
      L = planWall(i).L;
    // in the middle of the widest bay
    let best = [0, L],
      bw = 0;
    const all = [0].concat(st, [L]);
    for (let q = 0; q < all.length - 1; q++)
      if (all[q + 1] - all[q] > bw) {
        bw = all[q + 1] - all[q];
        best = [all[q], all[q + 1]];
      }
    st.push(Math.round(((best[0] + best[1]) / 2) * 8) / 8);
  }
  saveSoon();
  renderPlan();
}
document.addEventListener("change", (e) => {
  const el = e.target;
  if (!el.dataset || !el.dataset.fr) return;
  const [k, a, b] = el.dataset.fr.split(":"),
    i = +a,
    ws = frWall(i);
  if (k === "oc") {
    ws.oc = +el.value;
    delete ws.studs;
  } else if (k === "from") {
    ws.ocFrom = el.value;
    delete ws.studs;
  } else if (k === "x") {
    const v = parseLen(el.value);
    if (!isFinite(v)) return el.classList.add("bad");
    const st = frMaterialize(i).sort((x, y) => x - y);
    st[+b] = Math.max(STUD / 2, Math.min(planWall(i).L - STUD / 2, v));
  }
  saveSoon();
  renderPlan();
});
// drag a stud on the wall view
{
  let D = null;
  document.addEventListener(
    "pointerdown",
    (e) => {
      const g = e.target.closest && e.target.closest("[data-stud]");
      if (!g || !S.plan) return;
      const [i, j] = g.dataset.stud.split(":").map(Number),
        svg = g.ownerSVGElement,
        st = frMaterialize(i).sort((x, y) => x - y);
      D = { i, j, svg, x0: st[j], p0: null };
      const m = svg.getScreenCTM().inverse(),
        p = svg.createSVGPoint();
      p.x = e.clientX;
      p.y = e.clientY;
      D.p0 = p.matrixTransform(m).x;
      D.m = m;
      e.stopPropagation();
      e.preventDefault();
    },
    true,
  );
  document.addEventListener(
    "pointermove",
    (e) => {
      if (!D) return;
      const p = D.svg.createSVGPoint();
      p.x = e.clientX;
      p.y = e.clientY;
      const x = p.matrixTransform(D.m).x,
        st = frWall(D.i).studs,
        L = planWall(D.i).L;
      // no re-sorting while dragging: the finger keeps the same stud even past a neighbour
      st[D.j] = Math.max(
        STUD / 2,
        Math.min(L - STUD / 2, Math.round((D.x0 + x - D.p0) * 8) / 8),
      );
      e.stopPropagation();
      if (typeof planDraw === "function") planDraw();
      // the drawing was replaced: keep pointing at the same coordinate system
      const svg2 = document.querySelector("#plsvg svg");
      if (svg2) {
        D.svg = svg2;
        D.m = svg2.getScreenCTM().inverse();
      }
    },
    true,
  );
  document.addEventListener(
    "pointerup",
    () => {
      if (!D) return;
      const st = frWall(D.i).studs;
      if (st) st.sort((a, b) => a - b);
      D = null;
      saveSoon();
      renderPlan();
    },
    true,
  );
}

// the wall view's sheet starts with the framing panel while the layer is on
{
  const ps = planSheet;
  planSheet = function () {
    const h = ps.apply(this, arguments),
      V = S.plan;
    if (
      V &&
      V.frame &&
      V.v !== "top" &&
      !(V.sel && P.plan.items.some((x) => x.id === V.sel))
    )
      return frameSheet(+V.v) + h;
    return h;
  };
}
