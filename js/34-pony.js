"use strict";
/* ================= pony wall (knee wall / half wall) =================
   A plan item standing on the floor against a wall. Two layouts:
   - "out": it sticks out from the wall (shower knee wall) — w = thickness, dp = length;
   - "along": it runs along the wall — w = length, dp = thickness.
   You pick which faces get tile (sides, end(s), top) and how every outside edge is finished
   (Schluter, pencil liner, bullnose, 45° miter, or nothing). Each tiled face becomes its own
   surface ("pony:<id>:<face>") with its edges set; the floor gets the footprint cut out. */
PL_KINDS.pony = { ic: "▮", w: 4.5, dp: 36, h: 42, z: 0 };
if (!PL_ORDER.includes("pony")) PL_ORDER.push("pony");
PLT.ru.k_pony = "Pony wall (низкая стенка)";
PLT.en.k_pony = "Pony wall";

const PNT = {
  ru: {
    orient: "Как стоит",
    o_out: "торцом к стене (выходит в комнату)",
    o_along: "вдоль стены",
    faces: "Что облицовано плиткой",
    edges: "Края (внешние углы)",
    f_a: "Сторона 1",
    f_b: "Сторона 2",
    f_e: "Торец",
    f_f: "Лицо",
    f_l: "Левый торец",
    f_r: "Правый торец",
    f_c: "Верх",
    capNote:
      "Если верх — камень/кварц/дерево, сними галочку «Верх»: края верха закроются на боковых сторонах.",
    e_ae: "Угол сторона 1 / торец",
    e_be: "Угол сторона 2 / торец",
    e_ac: "Верх / сторона 1",
    e_bc: "Верх / сторона 2",
    e_ec: "Верх / торец",
    e_fl: "Угол лицо / левый торец",
    e_fr: "Угол лицо / правый торец",
    e_fc: "Верх / лицо",
    e_lc: "Верх / левый торец",
    e_rc: "Верх / правый торец",
    none: "ничего (без плитки рядом)",
    size: "Длина × толщина × высота",
    len: "Длина стенки",
    thick: "Толщина (каркас + борд)",
    built: "Поверхности стенки создаются автоматически при выходе из плана.",
    name: "Pony",
    niche: "Ниша в стенке",
    nFace: "На какой стороне",
    nW: "Ширина ниши",
    nH: "Высота ниши",
    nZ: "Низ ниши от пола",
    nX: "Край ниши от стены",
    nDeep: "Глубина ниши (не больше стойки)",
    glass: "Стекло сверху",
    gTop: "Верх стекла от пола",
    gIs: "Стекло",
    gBlock:
      "Под стекло: в верх стенки — сплошная обвязка (2× 2×6 или 2×4 + фанера) под U-канал/зажимы; если стенка не к стене, нужна сквозная шпилька или стальная пластина у основания.",
    nTooDeep: "Ниша глубже стойки — уменьшится до",
  },
  en: {
    orient: "Placement",
    o_out: "end against the wall (sticks out)",
    o_along: "along the wall",
    faces: "Faces with tile",
    edges: "Edges (outside corners)",
    f_a: "Side 1",
    f_b: "Side 2",
    f_e: "End",
    f_f: "Face",
    f_l: "Left end",
    f_r: "Right end",
    f_c: "Top",
    capNote:
      "If the top is stone/quartz/wood, untick “Top”: its edges are then finished on the sides.",
    e_ae: "Corner side 1 / end",
    e_be: "Corner side 2 / end",
    e_ac: "Top / side 1",
    e_bc: "Top / side 2",
    e_ec: "Top / end",
    e_fl: "Corner face / left end",
    e_fr: "Corner face / right end",
    e_fc: "Top / face",
    e_lc: "Top / left end",
    e_rc: "Top / right end",
    none: "nothing (no tile next to it)",
    size: "Length × thickness × height",
    len: "Wall length",
    thick: "Thickness (studs + board)",
    built:
      "The wall's surfaces are made automatically when you leave the plan.",
    name: "Pony",
    niche: "Niche in the wall",
    nFace: "On which face",
    nW: "Niche width",
    nH: "Niche height",
    nZ: "Niche bottom from floor",
    nX: "Niche edge from the wall",
    nDeep: "Niche depth (stud width max)",
    glass: "Glass on top",
    gTop: "Glass top from floor",
    gIs: "Glass",
    gBlock:
      "For the glass: solid top plate in the wall (2× 2×6, or 2×4 + plywood) for the U-channel/clamps; a freestanding wall needs a through rod or a steel plate at the base.",
    nTooDeep: "Niche deeper than the stud — it will be cut to",
  },
};
const pnt = (k) => (PNT[lang] || PNT.en)[k] || k;

// faces and edges for each placement. An edge: [id, face X, side of X, face Y, side of Y, length key]
const PONY = {
  out: {
    faces: ["a", "b", "e", "c"],
    edges: [
      ["ae", "a", "r", "e", "l", "H"],
      ["be", "b", "l", "e", "r", "H"],
      ["ac", "a", "t", "c", "b", "L"],
      ["bc", "b", "t", "c", "t", "L"],
      ["ec", "e", "t", "c", "r", "T"],
    ],
  },
  along: {
    faces: ["f", "l", "r", "c"],
    edges: [
      ["fl", "f", "l", "l", "r", "H"],
      ["fr", "f", "r", "r", "l", "H"],
      ["fc", "f", "t", "c", "b", "L"],
      ["lc", "l", "t", "c", "l", "T"],
      ["rc", "r", "t", "c", "r", "T"],
    ],
  },
};
function ponyNorm(it) {
  const o = (it.pony = it.pony || {});
  o.orient = o.orient === "along" ? "along" : "out";
  // switching placement keeps the wall's length and thickness: swap width and depth
  if (o.was && o.was !== o.orient) {
    const w = it.w;
    it.w = it.dp;
    it.dp = w;
  }
  o.was = o.orient;
  o.niche = Object.assign(
    {
      on: false,
      face: o.orient === "out" ? "a" : "f",
      w: 12,
      h: 12,
      z: 18,
      x: 6,
      d: 3.5,
    },
    o.niche || {},
  );
  o.glass = Object.assign({ on: false, top: 76 }, o.glass || {});
  o.faces = o.faces || {};
  o.edge = o.edge || {};
  ["a", "b", "e", "f", "l", "r", "c"].forEach((k) => {
    if (o.faces[k] == null) o.faces[k] = true;
  });
  Object.values(PONY).forEach((D) =>
    D.edges.forEach((e) => {
      if (!o.edge[e[0]]) o.edge[e[0]] = "sch";
    }),
  );
  return o;
}
// length (L), thickness (T), height (H) of the wall itself
function ponyDims(it) {
  const o = ponyNorm(it);
  return o.orient === "out"
    ? { L: +it.dp || 0, T: +it.w || 0, H: +it.h || 0 }
    : { L: +it.w || 0, T: +it.dp || 0, H: +it.h || 0 };
}
function ponySheet(it, p) {
  const o = ponyNorm(it),
    D = PONY[o.orient],
    d = ponyDims(it);
  let h = `</div><p class="hint">${pnt("size")}: <b>${fmtIn(d.L)}″ × ${fmtIn(d.T)}″ × ${fmtIn(d.H)}″</b></p><div class="grid2">`;
  h += SEL(
    pnt("orient"),
    p + "pony.orient",
    ["out", "along"],
    1,
    "p",
    "w2",
    (x) => pnt("o_" + x),
  );
  h += `</div><p class="hsec">${pnt("faces")}</p><div class="grid2">`;
  h += D.faces
    .map((f) => CHK(pnt("f_" + f), p + "pony.faces." + f, 1, "p"))
    .join("");
  h += `</div><p class="hint">${pnt("capNote")}</p><p class="hsec">${pnt("edges")}</p><div class="grid2">`;
  D.edges.forEach((e) => {
    const on = o.faces[e[1]] || o.faces[e[3]];
    if (!on) return;
    h += SEL(
      pnt("e_" + e[0]),
      p + "pony.edge." + e[0],
      EDGE_KINDS.concat(["none"]),
      1,
      "p",
      "",
      (x) => (x === "none" ? pnt("none") : edgeKT(x)),
    );
  });
  // niche in a face
  h += `</div>${CHK(pnt("niche"), p + "pony.niche.on", 1, "p")}<div class="grid2">`;
  if (o.niche.on) {
    const nf = D.faces.filter((f) => f !== "c" && o.faces[f]);
    h += SEL(pnt("nFace"), p + "pony.niche.face", nf, 1, "p", "", (x) =>
      pnt("f_" + x),
    );
    h +=
      F(pnt("nW"), p + "pony.niche.w", "len", "p") +
      F(pnt("nH"), p + "pony.niche.h", "len", "p") +
      F(pnt("nZ"), p + "pony.niche.z", "len", "p") +
      F(pnt("nX"), p + "pony.niche.x", "len", "p") +
      F(pnt("nDeep"), p + "pony.niche.d", "len", "p");
    const maxD = Math.max(0, d.T - 1);
    if (+o.niche.d > maxD)
      h += `</div><p class="hint">⚠ ${pnt("nTooDeep")} ${fmtIn(maxD)}″</p><div class="grid2">`;
  }
  // glass on top
  h += `</div>${CHK(pnt("glass"), p + "pony.glass.on", 1, "p")}<div class="grid2">`;
  if (o.glass.on) {
    h += F(pnt("gTop"), p + "pony.glass.top", "len", "p");
    h += `</div><p class="hint">${pnt("gIs")}: <b>${fmtIn(d.L)}″ × ${fmtIn(Math.max(0, +o.glass.top - d.H))}″</b>. ${pnt("gBlock")}</p><div class="grid2">`;
  }
  h += `</div><p class="hint">${pnt("built")}</p><div class="grid2">`;
  return h;
}
// make / update the surfaces of every pony wall
function ponyBuild(pl, get, fresh) {
  const keep = new Set();
  pl.items
    .filter((it) => it.k === "pony")
    .forEach((it) => {
      const o = ponyNorm(it),
        D = PONY[o.orient],
        d = ponyDims(it),
        size = {
          a: [d.L, d.H],
          b: [d.L, d.H],
          f: [d.L, d.H],
          e: [d.T, d.H],
          l: [d.T, d.H],
          r: [d.T, d.H],
          c: [d.L, d.T],
        },
        S2 = {};
      D.faces.forEach((f) => {
        if (!o.faces[f]) return;
        const key = `pony:${it.id}:${f}`;
        keep.add(key);
        const [s, isNew] = get(key, () => {
          const s2 = newSurface("wall");
          s2.nk = null;
          return s2;
        });
        if (isNew || !s.name || s.name === s.plName)
          s.name = s.plName = `${pnt("name")} · ${pnt("f_" + f)}`;
        s.shape = "rect";
        s.w = Math.round(size[f][0] * 16) / 16;
        s.h = Math.round(size[f][1] * 16) / 16;
        s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
        s.openings = (s.openings || []).filter((q) => !q.pl);
        // edges are set fresh from the plan each time
        s.trim = { l: false, r: false, t: false, b: false };
        s.trimK = { l: "sch", r: "sch", t: "sch", b: "sch" };
        if (isNew) fresh.push(s);
        S2[f] = s;
        const n = o.niche;
        if (n.on && n.face === f) {
          const dd = Math.min(+n.d || 3.5, Math.max(0.5, d.T - 1)),
            // the face's left edge is at the wall for side 1 / face; side 2 is seen from the other side
            fromWall = f === "b" ? s.w - +n.x - +n.w : +n.x;
          s.openings.push({
            id: uid(),
            pl: 1,
            type: "niche",
            shape: "rect",
            trim: true,
            x: Math.max(0, Math.min(s.w - +n.w, fromWall)),
            y: +n.z,
            w: +n.w,
            h: +n.h,
            d: dd,
          });
        }
      });
      D.edges.forEach(([id, fx, sx, fy, sy]) => {
        let kd = o.edge[id] || "sch";
        if (kd === "none") return;
        const X = S2[fx],
          Y = S2[fy];
        if (!X && !Y) return;
        // a miter needs tile on both faces
        if (kd === "miter" && !(X && Y)) kd = "sch";
        if (kd === "miter") {
          X.trim[sx] = true;
          X.trimK[sx] = "miter";
          Y.trim[sy] = true;
          Y.trimK[sy] = "miterx"; // same edge, counted once
          return;
        }
        // profile / pencil / bullnose go on the first tiled face (sides before ends before the top)
        const T = X || Y,
          k = X ? sx : sy;
        T.trim[k] = true;
        T.trimK[k] = kd;
      });
    });
  // faces that were turned off or whose wall is gone
  P.surfaces = P.surfaces.filter(
    (s) => !/^pony:/.test(s.fromPlan || "") || keep.has(s.fromPlan),
  );
}

/* glass on top of a pony wall: a plan glass item that follows the wall's top centre line */
function ponyGlassSync() {
  const pl = P && P.plan;
  if (!pl || !pl.items) return;
  let pts;
  try {
    pts = planPts();
  } catch (e) {
    return;
  }
  pl.items
    .filter((it) => it.k === "pony")
    .forEach((it) => {
      const o = ponyNorm(it);
      let g = o.glass.gid && pl.items.find((x) => x.id === o.glass.gid);
      if (!o.glass.on) {
        if (g) pl.items.splice(pl.items.indexOf(g), 1);
        delete o.glass.gid;
        return;
      }
      const W = planWall(it.wall, pts),
        c = +it.c,
        dp = +it.dp || 0,
        A = o.orient === "out" ? plAt(W, c, 0) : plAt(W, c - +it.w / 2, dp / 2),
        B =
          o.orient === "out" ? plAt(W, c, dp) : plAt(W, c + +it.w / 2, dp / 2),
        d = ponyDims(it);
      if (!g) {
        g = Object.assign(
          { id: uid(), k: "glass", door: "none", dw: 24, dsn: 1 },
          {},
        );
        pl.items.push(g);
        o.glass.gid = g.id;
      }
      g.x = (A[0] + B[0]) / 2;
      g.y = (A[1] + B[1]) / 2;
      g.ang = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI;
      g.w = Math.round(d.L * 16) / 16;
      g.z = d.H;
      g.h = Math.max(0, +o.glass.top - d.H);
      g.gpony = it.id; // glass that sits on a pony wall
    });
}
