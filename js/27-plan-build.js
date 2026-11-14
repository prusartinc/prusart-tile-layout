"use strict";
/* ================= room plan: plan -> surfaces, code checks, templates, client PDF ================= */
/* ---------- plan -> surfaces ---------- */
function planBuild() {
  const pl = planEnsure(),
    pts = planPts(),
    n = pts.length;
  let a = 0,
    b = 0;
  const get = (key, mk) => {
    let s = P.surfaces.find((x) => x.fromPlan === key);
    if (!s && key === "floor" && pl.src)
      s = P.surfaces.find((x) => x.id === pl.src && x.type === "floor");
    if (s) {
      b++;
      s.fromPlan = key;
      return [s, false];
    }
    s = mk();
    s.fromPlan = key;
    P.surfaces.push(s);
    a++;
    return [s, true];
  };
  const axis = (W) => Math.abs(W.u[0]) > 0.999 || Math.abs(W.u[1]) > 0.999;
  const bbo = (A) => {
    const q = bboxOf(A);
    return { x: q.x0, y: q.y0, w: q.x1 - q.x0, h: q.y1 - q.y0 };
  };
  const fresh = [];
  // floor
  {
    const [f, isNew] = get("floor", () => {
      const s = newSurface("floor");
      s.name = pt("plFloorName");
      s.nk = null;
      s.tile = stdTile("floor");
      return s;
    });
    if (isNew) fresh.push(f);
    f.shape = "walk";
    f.segs = JSON.parse(JSON.stringify(pl.room.segs));
    f.a0 = pl.room.a0;
    f.openings = f.openings.filter((o) => !o.pl);
    f.trans = (f.trans || []).filter((tr) => !tr.pl);
    pl.items.forEach((it) => {
      const K = PL_KINDS[it.k];
      if (K.glass || K.ceil) return;
      if (K.floor) {
        if (it.k === "drain")
          f.openings.push({
            id: uid(),
            pl: 1,
            type: "round",
            shape: "circle",
            x: +it.x,
            y: +it.y,
            dia: +it.w || 4,
          });
        else
          f.openings.push({
            id: uid(),
            pl: 1,
            type: "duct",
            shape: "rect",
            x: +it.x - it.w / 2,
            y: +it.y - (it.dp || 4) / 2,
            w: +it.w,
            h: +it.dp || 4,
          });
        return;
      }
      const W = planWall(it.wall, pts);
      if (it.k === "door") {
        f.trans.push({
          id: uid(),
          pl: 1,
          edge: it.wall,
          from: Math.max(0, +it.c - it.w / 2),
          len: +it.w,
          adj: "hardwood",
          at: ADJ.hardwood,
          sub: 0,
          prof: "auto",
          stop:
            it.dtype === "pocket" || it.dtype === "opening"
              ? "pocket"
              : it.dtype === "slide"
                ? "in"
                : it.swing === "out"
                  ? "out"
                  : "in",
          wt: W.th,
          dt: +it.dt || 1.375,
          ext: 0,
        });
      } else if (it.k === "toilet") {
        const q = plAt(W, +it.c, +it.ri || 12);
        f.openings.push({
          id: uid(),
          pl: 1,
          type: "toilet",
          shape: "circle",
          x: q[0],
          y: q[1],
          dia: 5,
          face: "auto",
        });
      } else if ((it.k === "tub" || it.k === "shower") && axis(W)) {
        f.openings.push(
          Object.assign(
            { id: uid(), pl: 1, type: "cutout", shape: "rect", trim: false },
            bbo(planFoot(it, pts)),
          ),
        );
      } else if (
        ["vanity", "cab", "fridge", "range"].includes(it.k) &&
        axis(W)
      ) {
        f.openings.push(
          Object.assign(
            { id: uid(), pl: 1, type: "noheat", shape: "rect", nohole: true },
            bbo(planFoot(it, pts)),
          ),
        );
      }
    });
  }
  // walls with tile
  for (let i = 0; i < n; i++) {
    const ws = pl.walls[i];
    if (!ws || !ws.tile) continue;
    const W = planWall(i, pts),
      H = Math.min(+pl.H || 96, +ws.tileH || +pl.H || 96);
    const [s, isNew] = get("w" + i, () => {
      const s2 = newSurface("wall");
      s2.name = `${pt("plWall")} ${i + 1}`;
      s2.nk = null;
      return s2;
    });
    if (isNew) fresh.push(s);
    s.shape = "rect";
    s.w = Math.round(W.L * 16) / 16;
    s.h = H;
    s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
    s.openings = s.openings.filter((o) => !o.pl);
    s.plOrg = [0, 0];
    planWallOps(i, pts, 0, 0, s);
  }
  // tile zones over tubs, shower pans, cabinet runs
  {
    const zones = planZones(pts),
      used = new Set(),
      old = P.surfaces.filter((x) => /^z\d+:/.test(x.fromPlan || ""));
    zones.forEach((z) => {
      const key = `z${z.wall}:${z.ids.slice().sort().join("+")}`;
      let s = P.surfaces.find((x) => x.fromPlan === key);
      // a zone that merged/split keeps the surface (and its tile settings) of an old zone on that wall
      if (!s)
        s = old.find(
          (x) => !used.has(x) && x.fromPlan.startsWith(`z${z.wall}:`),
        );
      let isNew = false;
      if (s) b++;
      else {
        s = newSurface("wall");
        s.nk = null;
        P.surfaces.push(s);
        fresh.push(s);
        isNew = true;
        a++;
      }
      used.add(s);
      s.fromPlan = key;
      if (isNew || s.name === s.plName)
        s.name = s.plName = `${pt("k_" + z.k)} · ${pt("plWall")} ${z.wall + 1}`;
      s.shape = "rect";
      s.w = Math.round((z.x1 - z.x0) * 16) / 16;
      s.h = Math.round((z.z1 - z.z0) * 16) / 16;
      s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
      s.openings = s.openings.filter((o) => !o.pl);
      s.plOrg = [z.x0, z.z0];
      planWallOps(z.wall, pts, z.x0, z.z0, s);
    });
    const gone = old.filter((x) => !used.has(x));
    if (gone.length) P.surfaces = P.surfaces.filter((x) => !gone.includes(x));
  }
  // shower pans
  pl.items
    .filter((it) => it.k === "shower")
    .forEach((it) => {
      const [s, isNew] = get("it" + it.id, () => {
        const s2 = newSurface("pan");
        s2.name = pt("plPanName");
        s2.nk = null;
        s2.tile = stdTile("pan");
        return s2;
      });
      s.shape = "rect";
      s.w = +it.w;
      s.h = +it.dp;
      s.segs = polyToSegs(rectPoly(0, 0, s.w, s.h));
      s.drain = Object.assign(s.drain || {}, planDrain(it));
      if (isNew) {
        s.curb.on = true;
        s.curb.len = s.w;
        fresh.push(s);
      }
    });
  // drop surfaces whose plan wall lost its tile
  P.surfaces = P.surfaces.filter((s) => {
    const m = /^w(\d+)$/.exec(s.fromPlan || "");
    if (m && !(pl.walls[+m[1]] && pl.walls[+m[1]].tile)) {
      delete s.fromPlan; // keep the surface, just unlink it
    }
    const mi = /^it(.+)$/.exec(s.fromPlan || "");
    if (mi && !pl.items.find((x) => x.id === mi[1])) delete s.fromPlan;
    return true;
  });
  try {
    if (fresh.some((s) => s.type !== "wall")) arrangeFloors(P);
  } catch (e) {}
  P.surfaces.forEach((s) => {
    if (s.fromPlan && (fresh.includes(s) || true)) {
      try {
        if (fresh.includes(s)) autoLayout(s);
      } catch (e) {}
    }
  });
  return { a, b };
}

/* openings of plan wall i, in a surface whose origin sits at (ox, oy) of that wall's elevation */
function planWallOps(i, pts, ox, oy, s) {
  const pl = P.plan,
    W = planWall(i, pts);
  const clip = (o) => {
    if (o.shape === "circle")
      return o.x >= 0 && o.x <= s.w && o.y >= 0 && o.y <= s.h ? o : null;
    const x0 = Math.max(0, o.x),
      y0 = Math.max(0, o.y),
      x1 = Math.min(s.w, o.x + o.w),
      y1 = Math.min(s.h, o.y + o.h);
    if (x1 - x0 < 0.25 || y1 - y0 < 0.25) return null;
    return Object.assign(o, { x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
  };
  const push = (o) => {
    const c = clip(
      Object.assign({ id: uid(), pl: 1 }, o, { x: o.x - ox, y: o.y - oy }),
    );
    if (c) s.openings.push(c);
  };
  pl.items.forEach((it) => {
    const K = PL_KINDS[it.k];
    if (K.floor) return;
    if (it.wall === i) {
      const xc = W.ex(+it.c),
        x0 = xc - it.w / 2,
        z = +it.z || 0;
      switch (it.k) {
        case "door":
          push({
            type: "cutout",
            shape: "rect",
            trim: false,
            x: x0,
            y: 0,
            w: +it.w,
            h: +it.h,
          });
          break;
        case "window":
          push({
            type: "window",
            shape: "rect",
            trim: true,
            x: x0,
            y: z,
            w: +it.w,
            h: +it.h,
          });
          break;
        case "niche":
          push({
            type: "niche",
            shape: "rect",
            trim: true,
            x: x0,
            y: z,
            w: +it.w,
            h: +it.h,
            d: +it.dp || 3.5,
          });
          break;
        case "outlet":
        case "switch":
          push({
            type: "outlet",
            shape: "rect",
            x: xc - 1.125,
            y: z - 1.875,
            w: 2.25,
            h: 3.75,
          });
          break;
        case "valve":
          push({ type: "valve", shape: "circle", x: xc, y: z, dia: 3 });
          break;
        case "head":
          push({ type: "pipe", shape: "circle", x: xc, y: z, dia: 1.125 });
          break;
        case "shelf":
          push({
            type: "shelf",
            shape: "rect",
            nohole: true,
            x: x0,
            y: z,
            w: +it.w,
            h: 2,
          });
          break;
        case "vanity":
        case "cab":
        case "tub":
        case "fridge":
        case "range":
        case "ucab":
          push({
            type: "cutout",
            shape: "rect",
            trim: false,
            x: x0,
            y: z,
            w: +it.w,
            h: +it.h,
          });
          break;
      }
      return;
    }
    // items from other walls standing against this one (tub end, vanity side)
    if (
      K.inwall ||
      K.pt ||
      !(+it.h > 0) ||
      it.k === "toilet" ||
      it.k === "shower" ||
      it.k === "mirror"
    )
      return;
    const Fp = planFoot(it, pts),
      ss = Fp.map((q) => (q[0] - W.a[0]) * W.u[0] + (q[1] - W.a[1]) * W.u[1]),
      dd = Fp.map(
        (q) => (q[0] - W.a[0]) * W.nin[0] + (q[1] - W.a[1]) * W.nin[1],
      );
    if (Math.min(...dd) > 1) return;
    const x0 = W.cx(Math.max(0, Math.min(...ss))),
      x1 = W.cx(Math.min(W.L, Math.max(...ss)));
    push({
      type: "cutout",
      shape: "rect",
      trim: false,
      x: Math.min(x0, x1),
      y: +it.z || 0,
      w: Math.abs(x1 - x0),
      h: +it.h,
    });
  });
}

/* ---------- code checks (IRC / NEC basics) ---------- */
function planChecks() {
  const pl = P.plan;
  if (!pl) return [];
  const pts = planPts(),
    out = [],
    OBST = [
      "toilet",
      "vanity",
      "tub",
      "shower",
      "cab",
      "fridge",
      "range",
      "glass",
    ],
    obs = pl.items
      .filter((x) => OBST.includes(x.k))
      .map((x) => ({ it: x, F: planFoot(x, pts) })),
    inRoom = (q) => pip(pts, q[0], q[1]),
    hit = (q, self) =>
      !inRoom(q) || obs.some((o) => o.it !== self && pip(o.F, q[0], q[1])),
    area = (A) => Math.abs(sArea(A)),
    overl = (A, self) =>
      obs.some((o) => o.it !== self && area(clipConvex(A, o.F)) > 1);
  const ray = (W, s0, t0, dir, self, max) => {
    for (let d = 0.25; d <= max - 0.125; d += 0.25)
      if (hit(plAt(W, s0 + dir * d, t0), self)) return d;
    return max + 1;
  };
  const wet = pl.items.some((x) =>
    ["toilet", "tub", "shower", "vanity"].includes(x.k),
  );
  if (wet && !pl.items.some((x) => x.k === "fan" || x.k === "window"))
    out.push({ id: null, p: null, msg: pt("ckFan") });
  pl.items.forEach((it) => {
    if (it.k === "outlet" && wet && !it.gfci) {
      const W = planWall(it.wall, pts);
      out.push({ id: it.id, p: plAt(W, +it.c, 4), msg: pt("ckGfci") });
    }
  });
  pl.items.forEach((it) => {
    if (PL_KINDS[it.k].floor) return;
    const W = planWall(it.wall, pts),
      c = +it.c,
      dp = +it.dp || 0;
    if (it.k === "toilet") {
      let side = 99;
      [6, Math.max(8, dp - 6)].forEach((t0) => {
        side = Math.min(
          side,
          ray(W, c, t0, 1, it, 15),
          ray(W, c, t0, -1, it, 15),
        );
      });
      if (side < 15)
        out.push({
          id: it.id,
          p: plAt(W, c, dp / 2),
          msg: pt("ckToiletSide").replace("{d}", fmt(side)),
        });
      const fr = [
        plAt(W, c - 15, dp + 0.5),
        plAt(W, c + 15, dp + 0.5),
        plAt(W, c + 15, dp + 21),
        plAt(W, c - 15, dp + 21),
      ];
      if (fr.some((q) => !inRoom(q)) || overl(fr, it))
        out.push({
          id: it.id,
          p: plAt(W, c, dp + 10),
          msg: pt("ckToiletFront"),
        });
    }
    if (it.k === "vanity") {
      const fr = [
        plAt(W, c - it.w / 2, dp + 0.5),
        plAt(W, c + it.w / 2, dp + 0.5),
        plAt(W, c + it.w / 2, dp + 21),
        plAt(W, c - it.w / 2, dp + 21),
      ];
      if (fr.some((q) => !inRoom(q)) || overl(fr, it))
        out.push({
          id: it.id,
          p: plAt(W, c, dp + 10),
          msg: pt("ckVanityFront"),
        });
      const near = pl.items.some(
        (o) =>
          (o.k === "outlet" || o.k === "switch") &&
          o.k === "outlet" &&
          o.wall === it.wall &&
          Math.abs(+o.c - c) <= it.w / 2 + 36,
      );
      if (!near) out.push({ id: it.id, p: plAt(W, c, 3), msg: pt("ckOutlet") });
    }
    if (it.k === "shower") {
      if (Math.min(+it.w, dp) < 30 || +it.w * dp < 900)
        out.push({ id: it.id, p: plAt(W, c, dp / 2), msg: pt("ckShower") });
    }
    if (it.k === "door" && it.dtype === "swing" && it.swing !== "out") {
      const hs = it.hinge === "b" ? c + it.w / 2 : c - it.w / 2,
        fs = it.hinge === "b" ? c - it.w / 2 : c + it.w / 2,
        sq = [
          plAt(W, hs, 0.5),
          plAt(W, fs, 0.5),
          plAt(W, fs, +it.w),
          plAt(W, hs, +it.w),
        ];
      if (overl(sq, null))
        out.push({ id: it.id, p: plAt(W, c, it.w / 2), msg: pt("ckDoor") });
    }
  });
  return out;
}

/* ---------- room templates ---------- */
function planTemplate(k) {
  const pl = P.plan,
    N = planNew;
  pl.items = [];
  if (k === "kitchen") {
    pl.room = { shape: "walk", segs: [], a0: 0 };
    ptsToWalk(pl.room, rectPoly(0, 0, 144, 120));
    pl.walls = pl.room.segs.map(() => ({ th: 4.5, tile: false, tileH: null }));
    pl.H = 96;
    pl.items.push(
      N("cab", 2, 18, { w: 36 }),
      N("cab", 2, 54, { w: 36 }),
      N("range", 2, 87, { w: 30 }),
      N("cab", 2, 120, { w: 36, ctr: 0 }),
      N("ucab", 2, 18, { w: 36 }),
      N("ucab", 2, 54, { w: 36 }),
      N("ucab", 2, 120, { w: 36 }),
      N("window", 2, 54, { w: 30, h: 36, z: 42 }),
      N("outlet", 2, 30, { z: 44 }),
      N("outlet", 2, 108, { z: 44 }),
      N("door", 0, 30, { w: 32 }),
    );
    return;
  }
  // 5' x 8' bathroom: tub or walk-in shower across the far 5' wall
  pl.room = { shape: "walk", segs: [], a0: 0 };
  ptsToWalk(pl.room, rectPoly(0, 0, 60, 96));
  pl.walls = pl.room.segs.map(() => ({ th: 4.5, tile: false, tileH: null }));
  pl.H = 96;
  // walls: 0 bottom (60, door), 1 right (96), 2 top (60, tub/shower), 3 left (96, toilet + vanity)
  if (k === "walkin") {
    pl.items.push(
      N("shower", 2, 30, { w: 60, dp: 36, tzh: 84 }),
      N("valve", 3, 18, { z: 44 }),
      N("head", 3, 18, { z: 80 }),
      N("niche", 2, 30, { z: 48, w: 12, h: 24 }),
      N("fan", null, 0, { x: 30, y: 48 }),
    );
    const g = N("glass", null, 0, {
      x: 30,
      y: 96 - 36,
      w: 60,
      ang: 180,
      door: "a",
      dw: 24,
    });
    pl.items.push(g);
  } else {
    pl.items.push(
      N("tub", 2, 30, { w: 60, dp: 30 }),
      N("valve", 3, 15, { z: 30 }),
      N("head", 3, 15, { z: 80 }),
      N("niche", 2, 30, { z: 48, w: 12, h: 24 }),
      N("fan", null, 0, { x: 30, y: 48 }),
    );
  }
  // left wall from the top corner: tub/shower, toilet (15" each side of center), vanity to the door wall
  const back = k === "walkin" ? 36 : 30,
    vw = 96 - back - 32,
    vc = 96 - vw / 2;
  pl.items.push(
    N("toilet", 3, back + 16, {}),
    N("vanity", 3, vc, { w: vw }),
    N("mirror", 3, vc, { w: Math.min(30, vw - 4), z: 40 }),
    N("outlet", 3, Math.min(94, vc + vw / 2 - 4), { z: 44 }),
    N("door", 0, 42, { w: 30, hinge: "b" }),
  );
  if (k === "walkin") {
    // glass door swings out of the shower
    planGlassToPan(
      pl.items.find((x) => x.k === "glass"),
      pl.items.find((x) => x.k === "shower"),
    );
  }
}

/* ---------- client sheets (PDF, letter, true scale) ---------- */
const PL_SCALES = [
  ["1″ = 1′-0″", 150 / 12],
  ["3/4″ = 1′-0″", (150 * 0.75) / 12],
  ["1/2″ = 1′-0″", (150 * 0.5) / 12],
  ["3/8″ = 1′-0″", (150 * 0.375) / 12],
  ["1/4″ = 1′-0″", (150 * 0.25) / 12],
  ["1/8″ = 1′-0″", (150 * 0.125) / 12],
];
function plSvgImage(str, W, H) {
  return new Promise((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src =
      "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        str
          .replace("<svg ", `<svg xmlns="http://www.w3.org/2000/svg" `)
          .replace('width="100%" height="100%"', `width="${W}" height="${H}"`),
      );
  });
}
async function planPdf() {
  const pl = planEnsure(),
    V = S.plan,
    keep = { sel: V.sel, wsel: V.wsel, z: V.z, hideE: V.hideE };
  modal(`<h3>${t("building")}</h3><p class="hint">…</p>`);
  await new Promise((r) => setTimeout(r, 40));
  const PW = 1275,
    PH = 1650,
    M = 60,
    TB = 170; // title block height
  const pages = [];
  const date = new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : "en-US");
  // content of each sheet: the plan, then walls that have something on them
  const pts = planPts(),
    zones = planZones(pts),
    sheets = [{ kind: "top" }];
  pl.room.segs.forEach((g, i) => {
    if (
      (pl.walls[i] || {}).tile ||
      zones.some((z) => z.wall === i) ||
      pl.items.some((it) => it.wall === i)
    )
      sheets.push({ kind: "wall", i });
  });
  try {
    V.sel = null;
    V.wsel = null;
    V.z = 1;
    V.hideE = false;
    const pal = PAL;
    PAL = PAL_L;
    const total = sheets.length;
    for (let n = 0; n < total; n++) {
      const sh = sheets[n],
        c = document.createElement("canvas");
      c.width = PW;
      c.height = PH;
      const x = c.getContext("2d");
      x.fillStyle = "#fff";
      x.fillRect(0, 0, PW, PH);
      const aw = PW - 2 * M,
        ah = PH - 2 * M - TB - (sh.kind === "top" ? 230 : 0);
      // pick the largest standard scale that fits
      let bbw, bbh;
      if (sh.kind === "top") {
        const ob = bboxOf(planOuter(pts));
        bbw = ob.x1 - ob.x0 + 90;
        bbh = ob.y1 - ob.y0 + 90;
      } else {
        const W = planWall(sh.i, pts);
        bbw = W.L + 80;
        bbh = (+pl.H || 96) + 70;
      }
      const sc =
        PL_SCALES.find((q) => bbw * q[1] <= aw && bbh * q[1] <= ah) ||
        PL_SCALES[PL_SCALES.length - 1];
      // draw at 2x for crisp lines; plan units per output px = 1/scale
      PLPRINT = { k: 1 / sc[1] };
      const svgStr =
        sh.kind === "top" ? planTopSVG(aw, ah) : planElevSVG(sh.i, aw, ah);
      const img = await plSvgImage(svgStr, aw * 2, ah * 2);
      PLPRINT = null;
      if (img) x.drawImage(img, M, M, aw, ah);
      let y = M + ah + 10;
      // materials on the plan sheet
      if (sh.kind === "top") {
        x.fillStyle = "#111";
        x.font = "700 24px -apple-system,Segoe UI,Roboto,Arial,sans-serif";
        x.fillText(pt("pdfMat"), M, y + 24);
        y += 40;
        x.font = "18px -apple-system,Segoe UI,Roboto,Arial,sans-serif";
        const rows = P.surfaces.filter((s2) => s2.fromPlan);
        (rows.length ? rows : P.surfaces).slice(0, 8).forEach((s2) => {
          try {
            const R2 = compute(s2);
            x.fillStyle = "#111";
            x.fillText(`${s2.name}`, M, y + 18);
            x.fillStyle = "#555";
            x.fillText(
              `${tileDesc(R2.T)} · ${patName(R2.T)} · ${sq(R2.area)} sf`,
              M + 360,
              y + 18,
            );
          } catch (e) {}
          y += 24;
        });
      }
      // title block
      const ty = PH - M - TB;
      x.strokeStyle = "#111";
      x.lineWidth = 2;
      x.strokeRect(M, ty, PW - 2 * M, TB);
      x.beginPath();
      x.moveTo(M + 200, ty);
      x.lineTo(M + 200, ty + TB);
      x.moveTo(PW - M - 300, ty);
      x.lineTo(PW - M - 300, ty + TB);
      x.stroke();
      if (typeof LOGOIMG !== "undefined" && LOGOIMG)
        x.drawImage(LOGOIMG, M + 30, ty + 15, 140, 140);
      x.fillStyle = "#111";
      x.font = "700 26px -apple-system,Segoe UI,Roboto,Arial,sans-serif";
      x.fillText("PrusArt Inc", M + 220, ty + 40);
      x.font = "20px -apple-system,Segoe UI,Roboto,Arial,sans-serif";
      [P.name, P.client, P.addr, date]
        .filter(Boolean)
        .forEach((l, j) =>
          x.fillText(String(l).slice(0, 48), M + 220, ty + 72 + j * 26),
        );
      x.font = "700 22px -apple-system,Segoe UI,Roboto,Arial,sans-serif";
      x.fillText(
        sh.kind === "top"
          ? pt("pdfPlan")
          : pt("pdfElev").replace("{n}", sh.i + 1),
        PW - M - 285,
        ty + 40,
      );
      x.font = "19px -apple-system,Segoe UI,Roboto,Arial,sans-serif";
      x.fillText(`${pt("pdfScale")}: ${sc[0]}`, PW - M - 285, ty + 76);
      x.fillText(
        `${pt("pdfSheet")} ${n + 1} / ${total}`,
        PW - M - 285,
        ty + 104,
      );
      x.fillStyle = "#666";
      x.font = "14px -apple-system,Segoe UI,Roboto,Arial,sans-serif";
      const nw = pt("pdfNote").split(". ");
      nw.forEach((l, j) =>
        x.fillText(
          l + (j < nw.length - 1 ? "." : ""),
          PW - M - 285,
          ty + 132 + j * 18,
        ),
      );
      pages.push(c);
    }
    PAL = pal;
    PDF = {
      bytes: pdfFromCanvases(pages),
      name: `${
        (P.name || "project")
          .replace(/[^\wЀ-ӿ -]+/g, "")
          .trim()
          .replace(/\s+/g, "_") || "project"
      }_plan.pdf`,
      n: pages.length,
    };
  } catch (e) {
    PLPRINT = null;
    console.error(e);
    modal(
      `<h3>Error</h3><p>${esc(e.message)}</p><div class="btns"><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
    );
    return;
  } finally {
    Object.assign(V, keep);
  }
  const url = URL.createObjectURL(
    new Blob([PDF.bytes], { type: "application/pdf" }),
  );
  modal(
    `<h3>${t("pdfReady")}</h3><p class="hint">${esc(PDF.name)} · ${PDF.n} ${t("pagesN")}</p><div class="btns" style="flex-direction:column"><button class="btn p w" data-act="sharePdf">${t("sharePdf")}</button><a class="btn w" style="text-align:center;text-decoration:none" href="${url}" download="${esc(PDF.name)}" target="_blank">${t("dlPdf")}</a><button class="btn w" data-act="closeModal">${t("close")}</button></div>`,
  );
}
