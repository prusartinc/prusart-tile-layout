"use strict";
/* ================= shower bench =================
   A plan item against a wall: straight (length × depth) or a corner (triangle in the corner).
   Seat height is the finished tile top; the seat falls toward the front by `slope`.
   Built from wood framing or from foam board (KERDI-BOARD, wedi, HYDRO-BLOK, other 1½–2″).
   The sheet shows how to build it: a framing cut list (2×4, plywood, backer) or a panel cut list
   with a drawing of the panels. Tiled faces become surfaces ("bench:<id>:<face>") with finished
   edges, and the footprint is cut out of the pan (when it stands in the shower) or the floor. */
PL_KINDS.bench = { ic: "🪑", w: 36, dp: 15, h: 18, z: 0 };
if (!PL_ORDER.includes("bench")) PL_ORDER.push("bench");
PLT.ru.k_bench = "Скамейка в душе";
PLT.en.k_bench = "Shower bench";

const BNT = {
  ru: {
    shape: "Форма",
    sh_rect: "прямая вдоль стены",
    sh_corner: "угловая (треугольник)",
    corner: "Угол",
    c_l: "слева",
    c_r: "справа",
    len: "Длина вдоль стены",
    dep: "Глубина сиденья",
    hgt: "Высота сиденья (готовая, с плиткой)",
    slope: "Уклон сиденья к краю, на 1 фут",
    slopeAll: "на всю глубину",
    sys: "Из чего строим",
    s_wood: "каркас из дерева (2×4 + фанера + борд)",
    s_kerdi: "Schluter KERDI-BOARD",
    s_wedi: "wedi",
    s_hydro: "HYDRO-BLOK",
    s_other: "другие панели",
    t: "Толщина панели",
    sheet: "Размер листа",
    faces: "Что облицовано плиткой",
    f_f: "Перед",
    f_t: "Сиденье (верх)",
    f_l: "Левый бок",
    f_r: "Правый бок",
    edges: "Края",
    e_ft: "Сиденье / перед",
    e_fl: "Перед / левый бок",
    e_fr: "Перед / правый бок",
    e_tl: "Сиденье / левый бок",
    e_tr: "Сиденье / правый бок",
    how: "📐 Как строить",
    built:
      "Поверхности скамейки создаются при выходе из плана, место под неё вырезается из поддона или пола.",
    name: "Скамейка",
    cut: "Список нарезки",
    pcs: "шт",
    front: "Передняя панель",
    top: "Сиденье",
    sup: "Внутренняя опора (перегородка)",
    side: "Боковая панель",
    plate: "Обвязка 2×4 (низ/верх) переда",
    stud: "Стойки 2×4 переда",
    ledger: "Опорный брус 2×4 на стене (к стойкам)",
    joist: "Лаги 2×4 (на ребро), срезать на клин под уклон",
    ply: "Фанера ¾″ на сиденье",
    backer: "Борд ½″ (перед + сиденье + бока)",
    sheets: "Листов",
    glue: "Все стыки панелей — на герметик системы (KERDI-FIX / wedi Joint Sealant), швы проклеить лентой, крепить к стенам и поддону по инструкции системы.",
    woodNote:
      "Каркас: перед как маленькая стенка (обвязка + стойки через 16″), брус на стене. Верх бруса и верх обвязки переда на одной высоте — лаги лежат на них плоским низом, а верх лаги срезан на клин под уклон. Сверху фанера ¾″, затем борд ½″ и мембрана.",
    slopeNote: "Перед ниже стены на",
    hFrame: "Верх каркаса у стены / у края",
    ledTop: "верх бруса от поддона",
    plTop: "верх от поддона",
    sideTop: "верх с уклоном",
  },
  en: {
    shape: "Shape",
    sh_rect: "straight along the wall",
    sh_corner: "corner (triangle)",
    corner: "Corner",
    c_l: "left",
    c_r: "right",
    len: "Length along the wall",
    dep: "Seat depth",
    hgt: "Seat height (finished, with tile)",
    slope: "Seat fall to the front, per foot",
    slopeAll: "over the depth",
    sys: "Built from",
    s_wood: "wood framing (2×4 + plywood + board)",
    s_kerdi: "Schluter KERDI-BOARD",
    s_wedi: "wedi",
    s_hydro: "HYDRO-BLOK",
    s_other: "other panels",
    t: "Panel thickness",
    sheet: "Sheet size",
    faces: "Faces with tile",
    f_f: "Front",
    f_t: "Seat (top)",
    f_l: "Left side",
    f_r: "Right side",
    edges: "Edges",
    e_ft: "Seat / front",
    e_fl: "Front / left side",
    e_fr: "Front / right side",
    e_tl: "Seat / left side",
    e_tr: "Seat / right side",
    how: "📐 How to build",
    built:
      "The bench's surfaces are made when you leave the plan; its footprint is cut out of the pan or the floor.",
    name: "Bench",
    cut: "Cut list",
    pcs: "pcs",
    front: "Front panel",
    top: "Seat",
    sup: "Inner support (bulkhead)",
    side: "Side panel",
    plate: "2×4 plates (bottom/top) of the front",
    stud: "2×4 studs of the front",
    ledger: "2×4 ledger on the wall (into studs)",
    joist: "2×4 joists (on edge), ripped to the slope",
    ply: "¾″ plywood seat",
    backer: "½″ board (front + seat + sides)",
    sheets: "Sheets",
    glue: "Every panel joint on the system's sealant (KERDI-FIX / wedi Joint Sealant), seams banded, fixed to walls and pan as the system says.",
    woodNote:
      "Framing: the front like a small wall (plates + studs at 16″) and a ledger on the wall. Ledger top and front top plate are at the same height — joists sit flat on both, their top ripped to the slope. Then ¾″ plywood, ½″ board and membrane.",
    slopeNote: "Front lower than the wall by",
    hFrame: "Frame top at the wall / at the edge",
    ledTop: "ledger top above the pan",
    plTop: "top above the pan",
    sideTop: "sloped top",
  },
};
const bnt = (k) => (BNT[lang] || BNT.en)[k] || k;
const BENCH_T = { wood: 0.5, kerdi: 2, wedi: 2, hydro: 2, other: 2 };
const BENCH_SHEET = {
  kerdi: [32, 62.5],
  wedi: [24, 96],
  hydro: [48, 96],
  other: [48, 96],
  wood: [48, 96],
};

function benchNorm(it) {
  const b = (it.bench = it.bench || {});
  b.shape = b.shape === "corner" ? "corner" : "rect";
  b.corner = b.corner === "r" ? "r" : "l";
  b.sys = BENCH_T[b.sys] != null ? b.sys : "kerdi";
  if (b.t == null) b.t = BENCH_T[b.sys];
  if (b.sysWas && b.sysWas !== b.sys) {
    b.t = BENCH_T[b.sys];
    b.sw = BENCH_SHEET[b.sys][0];
    b.sl = BENCH_SHEET[b.sys][1];
  }
  b.sysWas = b.sys;
  if (b.sw == null) b.sw = BENCH_SHEET[b.sys][0];
  if (b.sl == null) b.sl = BENCH_SHEET[b.sys][1];
  if (b.spf == null) b.spf = 0.25; // seat fall per foot (¼″ standard)
  b.faces = Object.assign(
    { f: true, t: true, l: false, r: false },
    b.faces || {},
  );
  b.edge = Object.assign(
    { ft: "sch", fl: "sch", fr: "sch", tl: "sch", tr: "sch" },
    b.edge || {},
  );
  return b;
}
// the bench's footprint in the wall's frame: s along the wall, d out from it
// seat fall at the front edge: per-foot slope × the farthest run from the wall
function benchFall(it) {
  const b = benchNorm(it),
    L = +it.w || 0,
    D = +it.dp || 0,
    run = b.shape === "corner" ? (L * D) / (Math.hypot(L, D) || 1) : D;
  return Math.round(Math.max(0, +b.spf || 0) * (run / 12) * 16) / 16;
}
function benchFootSD(it) {
  const b = benchNorm(it),
    c = +it.c,
    w = +it.w,
    dp = +it.dp,
    s0 = c - w / 2,
    s1 = c + w / 2;
  if (b.shape === "corner")
    return b.corner === "l"
      ? [
          [s0, 0],
          [s1, 0],
          [s0, dp],
        ]
      : [
          [s0, 0],
          [s1, 0],
          [s1, dp],
        ];
  return [
    [s0, 0],
    [s1, 0],
    [s1, dp],
    [s0, dp],
  ];
}
function benchFoot(it, pts) {
  const W = planWall(it.wall, pts);
  return benchFootSD(it).map(([s, d]) => plAt(W, s, d));
}
// how to build it: cut list rows [what, count, size] and panel shapes for the drawing
function benchCut(it) {
  const b = benchNorm(it),
    L = +it.w,
    D = +it.dp,
    H = +it.h,
    corner = b.shape === "corner",
    front = corner ? Math.hypot(L, D) : L,
    sl = benchFall(it),
    tileAll = 0.5, // tile + thinset on the seat
    rows = [],
    panels = [];
  const hWall = H - tileAll,
    hEdge = H - tileAll - sl;
  if (b.sys === "wood") {
    // joists sit flat on the ledger and the front top plate (both at one height);
    // only the joist top is ripped to the slope
    const seat = hWall - 0.75 - 0.5, // joist top at the wall: under plywood and board
      plTop = seat - 3.5, // ledger top = front top plate top
      n = Math.max(2, Math.ceil(front / 16) + 1);
    rows.push([
      bnt("plate"),
      2,
      `${fmtIn(front)}″ · ${bnt("plTop")} ${fmtIn(plTop)}″`,
    ]);
    rows.push([bnt("stud"), n, `${fmtIn(Math.max(0.5, plTop - 3))}″`]);
    rows.push([
      bnt("ledger"),
      1,
      `${fmtIn(L)}″ · ${bnt("ledTop")} ${fmtIn(plTop)}″`,
    ]);
    rows.push([
      bnt("joist"),
      corner ? Math.max(2, Math.ceil(L / 16)) : n,
      `${fmtIn(Math.max(1, D - 1.5))}″ (${fmtIn(3.5)}→${fmtIn(Math.max(0.5, 3.5 - sl))}″)`,
    ]);
    rows.push([
      bnt("ply"),
      1,
      corner
        ? `△ ${fmtIn(L)}×${fmtIn(D)}″`
        : `${fmtIn(L)} × ${fmtIn(D - 0.5)}″`,
    ]);
    const bA =
      front * hEdge +
      (corner ? (L * D) / 2 : L * D) +
      (b.faces.l ? D * H : 0) +
      (b.faces.r ? D * H : 0);
    rows.push([
      bnt("backer"),
      Math.ceil((bA / (b.sw * b.sl)) * 1.15) +
        " " +
        bnt("sheets").toLowerCase(),
      `${fmtIn(b.sw)}×${fmtIn(b.sl)}″`,
    ]);
    return { rows, panels, note: bnt("woodNote"), hWall, hEdge };
  }
  const t = +b.t || 2,
    fH = hEdge - t, // front panel stands under the seat panel
    nSup = Math.max(0, Math.ceil(front / 16) - 1);
  panels.push({ k: "front", w: front, h: fH });
  panels.push(corner ? { k: "top", tri: [L, D] } : { k: "top", w: L, h: D });
  if (!corner)
    for (let i = 0; i < nSup; i++)
      panels.push({ k: "sup", w: D - t, h: fH, h2: hWall - t });
  if (b.faces.l && !corner)
    panels.push({ k: "side", w: D - t, h: fH, h2: hWall - t });
  if (b.faces.r && !corner)
    panels.push({ k: "side", w: D - t, h: fH, h2: hWall - t });
  rows.push([bnt("front"), 1, `${fmtIn(front)} × ${fmtIn(fH)}″`]);
  rows.push([
    bnt("top"),
    1,
    corner ? `△ ${fmtIn(L)} × ${fmtIn(D)}″` : `${fmtIn(L)} × ${fmtIn(D)}″`,
  ]);
  if (nSup && !corner)
    rows.push([
      bnt("sup"),
      nSup,
      `${fmtIn(D - t)} × ${fmtIn(fH)}→${fmtIn(hWall - t)}″`,
    ]);
  const sides = (b.faces.l && !corner ? 1 : 0) + (b.faces.r && !corner ? 1 : 0);
  if (sides)
    rows.push([
      bnt("side"),
      sides,
      `${fmtIn(D - t)} × ${fmtIn(fH)}→${fmtIn(hWall - t)}″`,
    ]);
  const area = panels.reduce(
    (a, p) =>
      a + (p.tri ? (p.tri[0] * p.tri[1]) / 2 : p.w * Math.max(p.h, p.h2 || 0)),
    0,
  );
  rows.push([
    bnt("sheets"),
    Math.ceil((area / (b.sw * b.sl)) * 1.15),
    `${fmtIn(b.sw)}×${fmtIn(b.sl)}″ · ${fmtIn(t)}″`,
  ]);
  return { rows, panels, note: bnt("glue"), hWall, hEdge };
}
function benchSheet(it, p) {
  const b = benchNorm(it),
    rect = b.shape === "rect";
  let h = "";
  h += SEL(
    bnt("shape"),
    p + "bench.shape",
    ["rect", "corner"],
    1,
    "p",
    "",
    (x) => bnt("sh_" + x),
  );
  if (!rect)
    h += SEL(bnt("corner"), p + "bench.corner", ["l", "r"], 1, "p", "", (x) =>
      bnt("c_" + x),
    );
  h +=
    F(bnt("len"), p + "w", "len", "p") +
    F(bnt("dep"), p + "dp", "len", "p") +
    F(bnt("hgt"), p + "h", "len", "p") +
    F(bnt("slope"), p + "bench.spf", "len", "p");
  h += `<p class="hint">${bnt("slopeAll")}: <b>${fmtIn(benchFall(it))}″</b></p>`;
  h += SEL(
    bnt("sys"),
    p + "bench.sys",
    Object.keys(BENCH_T),
    1,
    "p",
    "w2",
    (x) => bnt("s_" + x),
  );
  if (b.sys !== "wood") h += F(bnt("t"), p + "bench.t", "len", "p");
  h +=
    F(bnt("sheet") + " ↔", p + "bench.sw", "len", "p") +
    F(bnt("sheet") + " ↕", p + "bench.sl", "len", "p");
  h += `</div><p class="hsec">${bnt("faces")}</p><div class="grid2">`;
  h += (rect ? ["f", "t", "l", "r"] : ["f", "t"])
    .map((f) => CHK(bnt("f_" + f), p + "bench.faces." + f, 1, "p"))
    .join("");
  h += `</div><p class="hsec">${bnt("edges")}</p><div class="grid2">`;
  (rect ? ["ft", "fl", "fr", "tl", "tr"] : ["ft"]).forEach((e) => {
    const [x, y] = e.split("");
    if ((y === "l" || y === "r") && !b.faces[y]) return; // that side is against a wall
    if (!(b.faces[x] || b.faces[y])) return;
    h += SEL(
      bnt("e_" + e),
      p + "bench.edge." + e,
      EDGE_KINDS.concat(["none"]),
      1,
      "p",
      "",
      (k) => (k === "none" ? pnt("none") : edgeKT(k)),
    );
  });
  h += `</div><div class="btns"><button class="btn p" data-act="benchHow:${it.id}">${bnt("how")}</button></div><p class="hint">${bnt("built")}</p><div class="grid2">`;
  return h;
}
function benchHow(id) {
  const it = P.plan.items.find((x) => x.id === id);
  if (!it) return;
  const b = benchNorm(it),
    C = benchCut(it);
  let h = `<h3>${bnt("how")} — ${esc(bnt("s_" + b.sys))}</h3>`;
  h += `<p class="hint">${bnt("hFrame")}: <b>${fmtIn(C.hWall)}″ / ${fmtIn(C.hEdge)}″</b> · ${bnt("slopeNote")} <b>${fmtIn(benchFall(it))}″</b> (${fmtIn(+b.spf || 0)}″ / 1′)</p>`;
  h += `<p class="hsec">${bnt("cut")}</p><table class="cutt">${C.rows.map((r) => `<tr><td>${esc(r[0])}</td><td class="n"><b>${esc(String(r[1]))}</b></td><td class="n">${esc(r[2])}</td></tr>`).join("")}</table>`;
  if (C.panels.length) h += benchSVG(C.panels);
  h += `<p class="hint">${C.note}</p><div class="btns"><button class="btn p" data-act="closeModal">${t("done")}</button></div>`;
  modal(h);
}
// panels drawn to one scale as small cards that wrap on a phone
function benchSVG(panels) {
  const dims = (p) =>
      p.tri ? [p.tri[0], p.tri[1]] : [p.w, Math.max(p.h, p.h2 || 0)],
    maxW = Math.max(...panels.map((p) => dims(p)[0])),
    maxH = Math.max(...panels.map((p) => dims(p)[1])),
    k = Math.min(150 / maxW, 110 / maxH),
    pad = 6;
  return `<div class="bpan">${panels
    .map((p) => {
      const [w0, h0] = dims(p),
        w = w0 * k,
        hh = h0 * k,
        base = pad + hh;
      let shape;
      if (p.tri)
        shape = `<polygon points="${pad},${base} ${pad + w},${base} ${pad},${pad}"/>`;
      else if (p.h2)
        shape = `<polygon points="${pad},${base} ${pad + w},${base} ${pad + w},${base - p.h * k} ${pad},${base - p.h2 * k}"/>`;
      else shape = `<rect x="${pad}" y="${pad}" width="${w}" height="${hh}"/>`;
      return `<figure><svg width="${w + pad * 2}" height="${hh + pad * 2}"><g fill="#e9eef5" stroke="#2f6fb5" stroke-width="1.5">${shape}</g></svg><figcaption><b>${esc(bnt(p.k))}</b><br>${p.tri ? "△ " + fmtIn(p.tri[0]) + "×" + fmtIn(p.tri[1]) : fmtIn(p.w) + "×" + fmtIn(p.h) + (p.h2 ? "→" + fmtIn(p.h2) : "")}″</figcaption></figure>`;
    })
    .join("")}</div>`;
}
function benchBuild(pl, get, fresh) {
  const keep = new Set();
  pl.items
    .filter((it) => it.k === "bench")
    .forEach((it) => {
      const b = benchNorm(it),
        rect = b.shape === "rect",
        L = +it.w,
        D = +it.dp,
        H = +it.h,
        front = rect ? L : Math.hypot(L, D),
        fall = benchFall(it),
        size = { f: [front, H - fall], t: [L, D], l: [D, H], r: [D, H] },
        S2 = {};
      (rect ? ["f", "t", "l", "r"] : ["f", "t"]).forEach((f) => {
        if (!b.faces[f]) return;
        const key = `bench:${it.id}:${f}`;
        keep.add(key);
        const [s, isNew] = get(key, () => {
          const s2 = newSurface(f === "t" ? "floor" : "wall");
          s2.nk = null;
          return s2;
        });
        if (isNew || !s.name || s.name === s.plName)
          s.name =
            s.plName = `${bnt("name")} · ${bnt("f_" + f)}${f === "t" && +b.spf ? " ↘" : ""}${(f === "l" || f === "r") && fall ? ` (${bnt("sideTop")} ↘${fmtIn(fall)}″)` : ""}`;
        if (f === "t" && !rect) {
          s.shape = "walk";
          s.segs = polyToSegs(
            b.corner === "l"
              ? [
                  [0, 0],
                  [L, 0],
                  [0, D],
                ]
              : [
                  [0, 0],
                  [L, 0],
                  [L, D],
                ],
          );
          s.w = L;
          s.h = D;
        } else {
          s.shape = "rect";
          s.w = Math.round(size[f][0] * 16) / 16;
          s.h = Math.round(size[f][1] * 16) / 16;
          s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
        }
        s.openings = (s.openings || []).filter((q) => !q.pl);
        s.trim = { l: false, r: false, t: false, b: false };
        s.trimK = { l: "sch", r: "sch", t: "sch", b: "sch" };
        if (isNew) fresh.push(s);
        S2[f] = s;
      });
      // edges: [id, face X, side of X, face Y, side of Y]
      const E = [
        ["ft", "f", "t", "t", "b"],
        ["fl", "f", "l", "l", "r"],
        ["fr", "f", "r", "r", "l"],
        ["tl", "t", "l", "l", "t"],
        ["tr", "t", "r", "r", "t"],
      ];
      E.forEach(([id, fx, sx, fy, sy]) => {
        let kd = b.edge[id] || "sch";
        if (kd === "none") return;
        if ((fy === "l" || fy === "r") && !b.faces[fy]) return; // that side is against a wall
        const X = S2[fx] && S2[fx].shape === "rect" ? S2[fx] : null,
          Y = S2[fy] && S2[fy].shape === "rect" ? S2[fy] : null;
        if (!X && !Y) return;
        if (kd === "miter" && !(X && Y)) kd = "sch";
        if (kd === "miter") {
          X.trim[sx] = true;
          X.trimK[sx] = "miter";
          Y.trim[sy] = true;
          Y.trimK[sy] = "miterx";
          return;
        }
        const T = X || Y,
          k = X ? sx : sy;
        T.trim[k] = true;
        T.trimK[k] = kd;
      });
    });
  P.surfaces = P.surfaces.filter(
    (s) => !/^bench:/.test(s.fromPlan || "") || keep.has(s.fromPlan),
  );
}
// cut-outs: on the pan it stands in (pan coordinates) or on the floor
function benchCuts(pl, pts) {
  const f = P.surfaces.find((x) => x.fromPlan === "floor");
  P.surfaces.forEach((s) => {
    if (s.openings)
      s.openings = s.openings.filter((o) => !(o.pl && o.pk === "bench"));
  });
  pl.items
    .filter((it) => it.k === "bench")
    .forEach((it) => {
      const on = benchOnPan(it, pts),
        pan = on && P.surfaces.find((x) => x.fromPlan === "it" + on.sh.id),
        A = on && pan ? on.loc : benchFoot(it, pts),
        tgt = on && pan ? pan : f;
      if (!tgt) return;
      const q = bboxOf(A);
      tgt.openings.push({
        id: uid(),
        pl: 1,
        type: "cutout",
        shape: "rect",
        trim: false,
        pk: "bench",
        x: q.x0,
        y: q.y0,
        w: q.x1 - q.x0,
        h: q.y1 - q.y0,
        pts: A.map((v) => [v[0], v[1]]),
      });
    });
}
// the bench's footprint on the pan it stands in (pan coordinates), or null
function benchOnPan(it, pts) {
  const F = benchFoot(it, pts),
    sh = P.plan.items.find((x) => {
      if (x.k !== "shower") return false;
      const fp = planFoot(x, pts);
      return (
        F.every(
          (q) =>
            pip(fp, q[0], q[1]) ||
            fp.some((v) => Math.hypot(v[0] - q[0], v[1] - q[1]) < 0.6),
        ) || pip(fp, ...centroid(F))
      );
    });
  if (!sh) return null;
  const W = planWall(sh.wall, pts),
    c = +sh.c,
    hw = +sh.w / 2,
    dp = +sh.dp;
  const loc = F.map((q) => {
    const s = (q[0] - W.a[0]) * W.u[0] + (q[1] - W.a[1]) * W.u[1],
      d = (q[0] - W.a[0]) * W.nin[0] + (q[1] - W.a[1]) * W.nin[1];
    return [W.flip ? c + hw - s : s - c + hw, dp - d];
  });
  return { sh, loc };
}
const centroid = (A) => [
  A.reduce((m, q) => m + q[0], 0) / A.length,
  A.reduce((m, q) => m + q[1], 0) / A.length,
];
