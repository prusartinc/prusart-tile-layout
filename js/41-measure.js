"use strict";
/* ================= what the walls were measured to =================
   On site the room is measured to whatever is there: bare studs, drywall or
   old tile. The layout has to be worked out on the face the new tile goes on
   (the board). So each wall says what it was measured to (the room sets the
   default) and what goes under the tile there; the plan keeps the numbers as
   measured and the surfaces are built from the finished faces:
     framing  → + board thickness
     drywall  → wet walls lose the drywall for board: + (board − drywall)
     old tile → torn to the studs: + board − old finish (stud to old tile face)
   A shower pan sits stud to stud, so its tile area loses the board on the
   wall sides. Projects that never set this behave exactly as before. */

const MTX = {
  ru: {
    title: "Замеры",
    room: "Размеры стен замерены по",
    wall: "Эта стена замерена по",
    m_fin: "уже под плитку (чистовые)",
    m_frame: "каркасу (стойкам)",
    m_dry: "гипсокартону",
    m_tile: "старой плитке",
    m_room: "как вся комната",
    dryT: "Гипсокартон",
    oldT: "Старая отделка: от стойки до плитки",
    brd: "Под плитку",
    b_auto: "авто",
    b_dry: "гипсокартон (без борда)",
    bsize: "Панели",
    bdir: "Ставить",
    d_auto: "авто",
    d_v: "вертикально",
    d_h: "горизонтально",
    hint: "Цифры на плане — как замерено, и расстояния на плане (унитаз, трап, окна) тоже от того, по чему замерял. Раскладка считается по лицу борда (под плитку). Поддон — по каркасу.",
    oldHint:
      "Старую плитку снимают до стоек — размер примерный, перемерь после демонтажа.",
    sum: "Под плитку",
    wallN: "Стена",
    wet: "мокрая зона",
  },
  en: {
    title: "Measurements",
    room: "Walls were measured to",
    wall: "This wall was measured to",
    m_fin: "the finished face (ready for tile)",
    m_frame: "framing (studs)",
    m_dry: "drywall",
    m_tile: "old tile",
    m_room: "same as the room",
    dryT: "Drywall",
    oldT: "Old finish: stud to tile face",
    brd: "Under the tile",
    b_auto: "auto",
    b_dry: "drywall (no board)",
    bsize: "Panels",
    bdir: "Hang",
    d_auto: "auto",
    d_v: "vertical",
    d_h: "horizontal",
    hint: "Plan numbers are as measured, and so are distances on the plan (toilet, drain, windows): from what you measured to. The layout is worked out on the board face. The pan sits stud to stud.",
    oldHint:
      "Old tile comes off to the studs — the size is approximate, re-measure after demo.",
    sum: "Ready for tile",
    wallN: "Wall",
    wet: "wet area",
  },
};
const mt = (k) => (MTX[lang === "ru" ? "ru" : "en"] || MTX.en)[k] || k;

/* boards PrusArt hangs (sheets 4×8 or 3×5) */
[
  ["hb12", "HYDRO-BLOK 1/2″", 0.5],
  ["hb58", "HYDRO-BLOK 5/8″", 0.625],
  ["go12", "GoBoard 1/2″", 0.5],
  ["go58", "GoBoard 5/8″", 0.625],
  ["wedi12", "wedi 1/2″", 0.5],
  ["wedi58", "wedi 5/8″", 0.625],
  ["kb12", "Schluter KERDI-BOARD 1/2″", 0.5],
  ["kb58", "Schluter KERDI-BOARD 5/8″", 0.625],
].forEach(([id, n, tt]) => {
  if (!UNDER.find((u) => u.id === id))
    UNDER.push({
      id,
      n,
      t: tt,
      k: "board",
      u: [
        [32, "4×8"],
        [15, "3×5"],
      ],
    });
});
const MEAS_K = ["fin", "frame", "dry", "tile"],
  BRD_K = [
    "auto",
    "hb12",
    "hb58",
    "go12",
    "go58",
    "wedi12",
    "wedi58",
    "kb12",
    "kb58",
    "dry",
  ];

function measOf(i, pl) {
  pl = pl || P.plan;
  const w = (pl.walls || [])[i] || {};
  return w.meas && w.meas !== "room" ? w.meas : pl.meas || "fin";
}
function measOn(pl) {
  pl = pl || P.plan;
  return !!pl && (pl.walls || []).some((_, i) => measOf(i, pl) !== "fin");
}
/* walls with a shower / tub tile zone on them */
function measWet(pl) {
  const wet = new Set();
  try {
    planZones(walkPoly(pl.room).pts).forEach((z) => {
      if (z.k === "shower" || z.k === "tub") wet.add(z.wall);
    });
  } catch (e) {}
  return wet;
}
function brdOf(i, pl, wet) {
  const w = (pl.walls || [])[i] || {};
  if (w.brd && w.brd !== "auto") return w.brd;
  return wet.has(i) ? "hb12" : "dry";
}
function brdT(id, pl) {
  return id === "dry" ? +pl.dryT || 0.5 : underOf(id).t || 0;
}
/* how far the face the tile goes on sits inside the measured face (+ = room gets smaller) */
function measDelta(i, pl, wet) {
  const m = measOf(i, pl),
    id = brdOf(i, pl, wet),
    d = brdT(id, pl),
    dry = +pl.dryT || 0.5,
    old = +pl.oldT || 1;
  if (m === "frame") return d;
  if (m === "dry") return id === "dry" ? 0 : d - dry;
  if (m === "tile") return d - old;
  return 0;
}
function measInfo(pl) {
  pl = pl || P.plan;
  const wet = measWet(pl),
    n = (pl.room.segs || []).length,
    d = [];
  for (let i = 0; i < n; i++) d.push(measOn(pl) ? measDelta(i, pl, wet) : 0);
  return { wet, d };
}
/* the plan as it is on the board faces; null when nothing changes */
function planFin(pl, info) {
  pl = pl || P.plan;
  if (!pl || !measOn(pl)) return null;
  info = info || measInfo(pl);
  const d = info.d;
  if (!d.some((x) => Math.abs(x) > 1e-4)) return null;
  const pts = walkPoly(pl.room).pts,
    n = pts.length;
  if (n < 3 || n !== d.length) return null;
  const Ws = pts.map((_, i) => planWall(i, pts));
  const np = [];
  for (let j = 0; j < n; j++) {
    const A = Ws[(j - 1 + n) % n],
      B = Ws[j],
      dA = d[(j - 1 + n) % n],
      dB = d[j],
      pA = [A.a[0] + A.nin[0] * dA, A.a[1] + A.nin[1] * dA],
      pB = [B.a[0] + B.nin[0] * dB, B.a[1] + B.nin[1] * dB],
      cr = A.u[0] * B.u[1] - A.u[1] * B.u[0];
    if (Math.abs(cr) < 1e-6) {
      np.push(pB);
      continue;
    }
    // pA + s·uA = pB + t·uB
    const dx = pB[0] - pA[0],
      dy = pB[1] - pA[1],
      s = (dx * B.u[1] - dy * B.u[0]) / cr;
    np.push([pA[0] + A.u[0] * s, pA[1] + A.u[1] * s]);
  }
  for (let i = 0; i < n; i++) {
    const a = np[i],
      b = np[(i + 1) % n];
    if ((b[0] - a[0]) * Ws[i].u[0] + (b[1] - a[1]) * Ws[i].u[1] < 2)
      return null; // a wall would vanish
  }
  const q = JSON.parse(JSON.stringify(pl)),
    mn = [Math.min(...np.map((v) => v[0])), Math.min(...np.map((v) => v[1]))];
  ptsToWalk(q.room, np);
  q.items.forEach((it) => {
    const K = PL_KINDS[it.k] || {};
    if (!K.floor && it.wall != null && Ws[+it.wall]) {
      const w = +it.wall,
        sh =
          (np[w][0] - pts[w][0]) * Ws[w].u[0] +
          (np[w][1] - pts[w][1]) * Ws[w].u[1];
      it.c = +it.c - sh;
      // a pan / tub goes in before the board: its front stays where it is
      if ((it.k === "shower" || it.k === "tub") && +it.dp > d[w] + 1)
        it.dp = +it.dp - d[w];
    }
    if (it.x != null && it.y != null) {
      it.x = +it.x - mn[0];
      it.y = +it.y - mn[1];
    }
  });
  q.__fin = d;
  return q;
}
/* finished lengths of the walls (for the sheet) */
function measLens(pl) {
  pl = pl || P.plan;
  const f = planFin(pl),
    a = walkPoly(pl.room).pts,
    b = f ? walkPoly(f.room).pts : a;
  return a.map((_, i) => ({
    m: planWall(i, a).L,
    f: planWall(i, b).L,
  }));
}
function withFin(fn, self, args) {
  const pl = P && P.plan;
  const fin = pl && planFin(pl);
  if (!fin) return fn.apply(self, args);
  P.plan = fin;
  try {
    return fn.apply(self, args);
  } finally {
    P.plan = pl;
  }
}
/* boards on the built surfaces + the pan loses the board on its wall sides */
function measApply(pl) {
  if (!measOn(pl)) {
    P.surfaces.forEach((s) => {
      if (s.type === "pan" && s.bIns && /^it/.test(s.fromPlan || ""))
        delete s.bIns;
    });
    return;
  }
  const wet = measWet(pl),
    pts = walkPoly(pl.room).pts,
    n = pts.length;
  P.surfaces.forEach((s) => {
    const k = s.fromPlan || "";
    const m = /^w(\d+)$/.exec(k) || /^z(\d+):/.exec(k);
    if (!m) return;
    const i = +m[1],
      id = brdOf(i, pl, wet),
      w = pl.walls[i] || {};
    s.stack = s.stack || {};
    if (id === "dry") {
      if (underOf(s.stack.under || "none").k === "board")
        s.stack.under = "none";
    } else s.stack.under = id;
    s.stack.bsize = w.bsize === "3x5" ? "3x5" : "4x8";
    s.stack.bdir = w.bdir || "auto";
  });
  pl.items
    .filter((it) => it.k === "shower")
    .forEach((it) => {
      const s = P.surfaces.find((x) => x.fromPlan === "it" + it.id);
      if (!s) return;
      // the pan itself keeps its real size (it was built from the board-face copy)
      if (Math.abs(+s.w - +it.w) > 1e-6 || Math.abs(+s.h - +it.dp) > 1e-6) {
        s.w = +it.w;
        s.h = +it.dp;
        if (s.shape === "rect") s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
        s.drain = Object.assign(s.drain || {}, planDrain(it));
        panNorm(s);
        panApplyShape(s);
      }
      const W = planWall(+it.wall, pts),
        e = planItemX(it, W),
        L = W.flip ? (+it.wall + 1) % n : (+it.wall - 1 + n) % n,
        R2 = W.flip ? (+it.wall - 1 + n) % n : (+it.wall + 1) % n,
        bt = (i) => (measOf(i, pl) === "fin" ? 0 : brdT(brdOf(i, pl, wet), pl));
      s.bIns = {
        t: bt(+it.wall),
        l: e[0] <= 1 ? bt(L) : 0,
        r: e[1] >= W.L - 1 ? bt(R2) : 0,
      };
    });
}
{
  const pb = planBuild;
  planBuild = function () {
    const pl = planEnsure();
    if (typeof ponyGlassSync === "function") ponyGlassSync();
    const r = withFin(pb, this, arguments);
    measApply(pl);
    return r;
  };
  const cs = planCutSync;
  planCutSync = function () {
    return withFin(cs, this, arguments);
  };
}

/* ---------- plan sheet: the room block and the wall block ---------- */
function measRoomHTML(pl) {
  const m = pl.meas || "fin";
  let h = `<p class="hsec">${mt("title")}</p><div class="grid2">${SEL(mt("room"), "plan.meas", MEAS_K, 1, "p", "w2", (o) => mt("m_" + o))}`;
  if (measOn(pl)) {
    h += SEL(mt("dryT"), "plan.dryT", ["0.5", "0.625"], 1, "p", "", (o) =>
      o === "0.5" ? "1/2″" : "5/8″",
    );
    if (m === "tile" || pl.walls.some((_, i) => measOf(i, pl) === "tile"))
      h += F(mt("oldT"), "plan.oldT", "len", "p");
  }
  h += `</div>`;
  if (measOn(pl)) {
    const L = measLens(pl),
      wet = measWet(pl);
    h += `<p class="hint">${mt("hint")}${pl.walls.some((_, i) => measOf(i, pl) === "tile") ? " " + mt("oldHint") : ""}</p><div class="meastab">${L.map(
      (x, i) =>
        `<span><b>${mt("wallN")} ${i + 1}</b><i>${fmtIn(x.m)}″ → <b>${fmtIn(x.f)}″</b></i><small>${esc(mt("m_" + measOf(i, pl)))}${wet.has(i) ? " · " + mt("wet") : ""}</small></span>`,
    ).join("")}</div>`;
  }
  return h;
}
function measWallHTML(pl, i) {
  const w = pl.walls[i] || {},
    wet = measWet(pl),
    tiled = w.tile || wet.has(i);
  let h = `<p class="hsec">${mt("title")}</p><div class="grid2">${SEL(mt("wall"), `plan.walls.${i}.meas`, ["room"].concat(MEAS_K), 1, "p", "w2", (o) => (o === "room" ? `${mt("m_room")} (${mt("m_" + (pl.meas || "fin"))})` : mt("m_" + o)))}`;
  if (tiled) {
    h += SEL(mt("brd"), `plan.walls.${i}.brd`, BRD_K, 1, "p", "w2", (o) =>
      o === "auto"
        ? `${mt("b_auto")} (${brdOf(i, Object.assign({}, pl, { walls: pl.walls.map((x, j) => (j === i ? Object.assign({}, x, { brd: "auto" }) : x)) }), wet) === "dry" ? mt("b_dry") : "HYDRO-BLOK 1/2″"})`
        : o === "dry"
          ? mt("b_dry")
          : underOf(o).n,
    );
    if (brdOf(i, pl, wet) !== "dry")
      h +=
        SEL(
          mt("bsize"),
          `plan.walls.${i}.bsize`,
          ["4x8", "3x5"],
          1,
          "p",
          "",
          (o) => o.replace("x", "×"),
        ) +
        SEL(
          mt("bdir"),
          `plan.walls.${i}.bdir`,
          ["auto", "v", "h"],
          1,
          "p",
          "",
          (o) => mt("d_" + o),
        );
  }
  h += `</div>`;
  if (measOn(pl)) {
    const L = measLens(pl)[i];
    if (L)
      h += `<p class="hint">${fmtIn(L.m)}″ → ${mt("sum").toLowerCase()} <b>${fmtIn(L.f)}″</b></p>`;
  }
  return h;
}
{
  const ps = planSheet;
  planSheet = function () {
    let h = ps.apply(this, arguments);
    const pl = P.plan,
      V = S.plan || {};
    if (!pl || typeof h !== "string") return h;
    try {
      if (V.sel == null && V.wsel != null) {
        const mark = `<p class="hsec">${pt("plAddHere")}</p>`;
        h = h.includes(mark)
          ? h.replace(mark, measWallHTML(pl, V.wsel) + mark)
          : h + measWallHTML(pl, V.wsel);
      } else if (V.sel == null && V.wsel == null) {
        const mark = `<!--/room-->`;
        if (h.includes(mark))
          h = h.replace(
            mark,
            `<details class="plblk" data-pd="meas" ${plBlkOpen("meas") || measOn(pl) ? "open" : ""}><summary>${mt("title")}${measOn(pl) ? " · " + mt("m_" + (pl.meas || "fin")) : ""}</summary>${measRoomHTML(pl).replace(`<p class="hsec">${mt("title")}</p>`, "")}</details>`,
          );
      }
    } catch (e) {
      console.error(e);
    }
    return h;
  };
}

/* distances "from the wall": on the plan they are from the measured face;
   on a pan sized stud to stud its edges are the framing, not the board */
{
  const ro = refOff;
  refOff = function (L) {
    const pl = P && P.plan;
    if (!pl || !measOn(pl)) return ro.apply(this, arguments);
    if (S.plan) return 0;
    const s = typeof cur === "function" && !isMulti() ? cur() : null;
    if (s && s.type === "pan" && s.bIns)
      return ro.apply(this, arguments) - (L ? +L.prep || 0 : 0);
    return ro.apply(this, arguments);
  };
}
