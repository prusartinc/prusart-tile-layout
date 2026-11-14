"use strict";
/* ================= room plan: actions ================= */
/* ---------- actions ---------- */
function planAct(a, arg) {
  const pl = P.plan,
    V = S.plan;
  const sel = () => pl.items.find((x) => x.id === V.sel);
  switch (a) {
    case "plan":
      return planOpen();
    case "plClose":
      return planClose();
    case "plUndo":
      doUndo();
      if (S.plan) renderPlan();
      return;
    case "plView":
      V.v = arg === "top" ? "top" : +arg;
      V.z = 1;
      V.zx = V.zy = 0;
      if (V.v !== "top") V.wsel = V.v;
      break;
    case "plLayerE":
      V.hideE = !V.hideE;
      break;
    case "plTiles":
      V.noTiles = !V.noTiles;
      break;
    case "plPdf":
      planPdf();
      return;
    case "plWsel":
      V.wsel = +arg;
      V.sel = null;
      break;
    case "plLib":
      return modal(
        `<h3>${pt("plLib")}</h3><div class="pllib">${PL_ORDER.map((k) => `<button data-act="plAdd:${k}"><span>${PL_KINDS[k].ic}</span>${pt("k_" + k)}</button>`).join("")}</div><div class="btns"><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
      );
    case "plAdd": {
      closeModal();
      const [k, wi] = arg.split(":"),
        K = PL_KINDS[k],
        pts = planPts();
      let it;
      if (K.floor) {
        const bb = bboxOf(pts);
        it = planNew(k, null, 0, {
          x: Math.round((bb.x0 + bb.x1) / 2),
          y: Math.round((bb.y0 + bb.y1) / 2),
        });
        if (k === "glass" && pl.items.some((x) => x.k === "shower")) {
          pl.items.push(it);
          V.sel = it.id;
          planAct("plGlassPan");
          return;
        }
      } else {
        const w =
            wi != null && wi !== ""
              ? +wi
              : V.wsel != null
                ? V.wsel
                : typeof V.v === "number"
                  ? V.v
                  : planLongest(pts),
          W = planWall(w, pts);
        it = planNew(k, w, W.L / 2);
        if (!K.pt) it.w = Math.min(+it.w, W.L);
        if (k === "tub" || k === "shower")
          it.w = Math.min(W.L, k === "tub" ? 60 : it.w);
        if (k === "tub" && W.L < 66) {
          it.w = W.L;
        }
      }
      pl.items.push(it);
      V.sel = it.id;
      V.wsel = null;
      saveSoon();
      break;
    }
    case "plDup": {
      const it = sel();
      if (!it) break;
      const c = JSON.parse(JSON.stringify(it));
      c.id = uid();
      if (PL_KINDS[it.k].floor) c.x = +c.x + 6;
      else
        c.c = Math.min(
          planWall(c.wall).L - (PL_KINDS[c.k].pt ? 0 : c.w / 2),
          +c.c + (PL_KINDS[c.k].pt ? 6 : +c.w),
        );
      pl.items.push(c);
      V.sel = c.id;
      saveSoon();
      break;
    }
    case "plDel":
      pl.items = pl.items.filter((x) => x.id !== V.sel);
      V.sel = null;
      saveSoon();
      break;
    case "plNudge": {
      const it = sel();
      if (!it) break;
      const [ax, ay] = arg.split(":").map(Number),
        K = PL_KINDS[it.k];
      if (K.floor) {
        it.x = +it.x + ax * 0.5;
        it.y = +it.y + ay * 0.5;
      } else {
        const W = planWall(it.wall),
          half = K.pt ? 0 : +it.w / 2,
          dir = V.v === "top" ? 1 : W.flip ? -1 : 1;
        it.c = Math.max(half, Math.min(W.L - half, +it.c + ax * 0.5 * dir));
        if (ay) it.z = Math.max(0, (+it.z || 0) + ay * 0.5);
      }
      saveSoon();
      break;
    }
    case "plWadd": {
      const g = pl.room.segs,
        last = g[g.length - 1];
      g.push({ l: Math.max(12, Math.round((+last.l || 24) / 2)), a: 90 });
      pl.walls.push({ th: 4.5, tile: false, tileH: null });
      saveSoon();
      break;
    }
    case "plWdel": {
      const i = +arg;
      bkBefore(`${pt("plDel")} ${pt("plWall")} ${i + 1}`);
      if (pl.room.segs.length <= 3) break;
      pl.room.segs.splice(i, 1);
      pl.walls.splice(i, 1);
      // surfaces built from walls after the deleted one move down one number; the deleted wall's are unlinked
      P.surfaces.forEach((s2) => {
        const m = /^(w|z)(\d+)(:.*)?$/.exec(s2.fromPlan || "");
        if (!m) return;
        const j = +m[2];
        if (j === i) delete s2.fromPlan;
        else if (j > i) s2.fromPlan = m[1] + (j - 1) + (m[3] || "");
      });
      pl.items = pl.items
        .filter((x) => x.wall !== i)
        .map((x) =>
          x.wall != null && x.wall > i
            ? Object.assign(x, { wall: x.wall - 1 })
            : x,
        );
      saveSoon();
      break;
    }
    case "plGlassPan": {
      const it = sel(),
        sh = pl.items.find((x) => x.k === "shower");
      if (!it || !sh) {
        toast(pt("plNoPan"), false);
        break;
      }
      planGlassToPan(it, sh);
      saveSoon();
      break;
    }
    case "plCenterW": {
      const it = sel();
      if (it && !PL_KINDS[it.k].floor) it.c = planWall(it.wall).L / 2;
      saveSoon();
      break;
    }
    case "plCopyTo": {
      const it = sel();
      if (!it || arg === "") break;
      const c = JSON.parse(JSON.stringify(it)),
        W = planWall(+arg);
      c.id = uid();
      c.wall = +arg;
      c.c = Math.max(
        PL_KINDS[c.k].pt ? 0 : c.w / 2,
        Math.min(W.L - (PL_KINDS[c.k].pt ? 0 : c.w / 2), +it.c),
      );
      pl.items.push(c);
      V.sel = c.id;
      saveSoon();
      break;
    }
    case "plRot":
    case "plMirror":
      bkBefore(a === "plRot" ? "↻ 90°" : pt("plMirror"));
      planTransform(a === "plRot" ? "rot" : "mirror");
      saveSoon();
      break;
    case "plGlassFlip": {
      const it = sel();
      if (it) it.dsn = -(+it.dsn || 1);
      saveSoon();
      break;
    }
    case "plGlassRot": {
      const it = sel();
      if (it) it.ang = ((+it.ang || 0) + 90) % 360;
      saveSoon();
      break;
    }
    case "plTpl":
      if (pl.items.length && !confirm(pt("plTplQ"))) return;
      bkBefore(pt("plTpl"));
      planTemplate(arg);
      V.sel = null;
      V.wsel = null;
      V.v = "top";
      saveSoon();
      break;
    case "plFit":
      if (closeWalk(pl.room)) saveSoon();
      break;
    case "plFromFloor": {
      const f = P.surfaces.find((s) => s.type === "floor" && !isShaped(s));
      if (f) {
        planFromFloor(f);
        planEnsure();
        saveSoon();
      }
      break;
    }
    case "plGo":
      S.tab = +arg;
      return planClose();
    case "plBuild": {
      bkBefore(pt("plBuild"));
      const r = planBuild();
      saveSoon();
      toast(
        "✓ " + pt("plBuilt").replace("{a}", r.a).replace("{b}", r.b),
        false,
      );
      break;
    }
  }
  renderPlan();
}
function planLongest(pts) {
  let b = 0,
    bl = 0;
  for (let i = 0; i < pts.length; i++) {
    const L = planWall(i, pts).L;
    if (L > bl) {
      bl = L;
      b = i;
    }
  }
  return b;
}

/* glass along the shower pan's front edge, door swinging out of the shower */
function planGlassToPan(it, sh) {
  if (!it || !sh) return;
  const W = planWall(sh.wall),
    a1 = plAt(W, +sh.c - sh.w / 2, +sh.dp),
    b1 = plAt(W, +sh.c + sh.w / 2, +sh.dp);
  it.x = (a1[0] + b1[0]) / 2;
  it.y = (a1[1] + b1[1]) / 2;
  it.ang =
    Math.round(
      ((Math.atan2(b1[1] - a1[1], b1[0] - a1[0]) * 180) / Math.PI) * 100,
    ) / 100;
  it.w = +sh.w;
  const G = planGlassEnds(it);
  it.dsn = G.n[0] * W.nin[0] + G.n[1] * W.nin[1] > 0 ? 1 : -1;
}

/* ---------- snapping along a wall: corners, wall center, neighbours' edges, toilet 15"/16" ---------- */
function planSnap(it, W, c) {
  const K = PL_KINDS[it.k],
    half = K.pt ? 0 : +it.w / 2,
    tol = 1.5,
    cand = [half, W.L - half, W.L / 2];
  P.plan.items.forEach((o) => {
    if (o === it || o.wall !== it.wall || PL_KINDS[o.k].floor) return;
    const oh = PL_KINDS[o.k].pt ? 0 : +o.w / 2,
      oc = +o.c;
    cand.push(oc); // same center (mirror over vanity, valve over the tub)
    if (!K.pt && !PL_KINDS[o.k].pt) cand.push(oc - oh - half, oc + oh + half); // flush side by side
    if (it.k === "toilet")
      cand.push(oc - oh - 15, oc + oh + 15, oc - oh - 18, oc + oh + 18);
    if (o.k === "toilet" && !K.pt)
      cand.push(oc - 15 - half, oc + 15 + half, oc - 18 - half, oc + 18 + half);
  });
  if (it.k === "toilet") cand.push(15, W.L - 15, 18, W.L - 18);
  // items on other walls that reach this one (a tub or shower pan end, glass): line up with their edge
  if (!K.pt) {
    const pts = planPts();
    P.plan.items.forEach((o) => {
      const OK = PL_KINDS[o.k];
      if (
        o === it ||
        o.wall === it.wall ||
        OK.pt ||
        OK.ceil ||
        OK.inwall ||
        o.k === "drain" ||
        o.k === "register"
      )
        return;
      const F2 = planFoot(o, pts),
        ss = F2.map((q) => (q[0] - W.a[0]) * W.u[0] + (q[1] - W.a[1]) * W.u[1]),
        dd = F2.map(
          (q) => (q[0] - W.a[0]) * W.nin[0] + (q[1] - W.a[1]) * W.nin[1],
        );
      if (Math.min(...dd) > (+it.dp || 24) + 2) return;
      [Math.min(...ss), Math.max(...ss)].forEach((e) => {
        cand.push(e - half, e + half);
        if (it.k === "toilet") cand.push(e - 15, e + 15, e - 18, e + 18);
      });
    });
  }
  let best = c,
    bd = tol;
  cand.forEach((v) => {
    if (v >= half - 1e-6 && v <= W.L - half + 1e-6 && Math.abs(v - c) < bd) {
      bd = Math.abs(v - c);
      best = v;
    }
  });
  return Math.round(best * 16) / 16;
}

/* ---------- rotate the whole room 90° or mirror it ---------- */
function planTransform(mode) {
  const pl = P.plan,
    pts = planPts(),
    n = pts.length,
    lens = pl.room.segs.map((_, i) => planWall(i, pts).L);
  const f = mode === "rot" ? (q) => [-q[1], q[0]] : (q) => [-q[0], q[1]];
  let np = pts.map(f),
    wallMap = (i) => i;
  if (mode === "mirror") {
    // mirroring flips the walk direction: reverse it so walls keep going the same way round
    np = np.slice().reverse();
    // new edge j runs from old point n-1-j to old point n-2-j = old edge (n-2-j), reversed
    wallMap = (i) => (((n - 2 - i) % n) + n) % n;
  }
  const inv = {};
  for (let j = 0; j < n; j++) inv[wallMap(j)] = j;
  const mx = Math.min(...np.map((q) => q[0])),
    my = Math.min(...np.map((q) => q[1]));
  ptsToWalk(pl.room, np);
  const walls0 = pl.walls.slice();
  pl.walls = pl.room.segs.map(
    (_, j) => walls0[wallMap(j)] || { th: 4.5, tile: false, tileH: null },
  );
  pl.items.forEach((it) => {
    const K = PL_KINDS[it.k];
    if (K.floor) {
      const q = f([+it.x, +it.y]);
      it.x = q[0] - mx;
      it.y = q[1] - my;
      if (K.glass) {
        it.ang =
          mode === "rot"
            ? ((+it.ang || 0) + 90) % 360
            : (180 - (+it.ang || 0) + 360) % 360;
        if (mode === "mirror") it.dsn = -(+it.dsn || 1);
      }
      return;
    }
    if (mode === "mirror") {
      const old = +it.wall;
      it.wall = inv[old];
      it.c = lens[old] - +it.c;
      if (it.k === "door") it.hinge = it.hinge === "b" ? "a" : "b";
      // left/right swap on the wall seen from inside
      [it.tzl, it.tzr] = [it.tzr, it.tzl];
      [it.ctl, it.ctr] = [it.ctr, it.ctl];
      if (it.k === "shower") {
        it.dl = +it.w - +it.dl;
        if (it.lside === "left") it.lside = "right";
        else if (it.lside === "right") it.lside = "left";
      }
    }
  });
  // surfaces built from the plan follow their walls
  if (mode === "mirror")
    P.surfaces.forEach((s2) => {
      const m = /^(w|z)(\d+)(:.*)?$/.exec(s2.fromPlan || "");
      if (m) s2.fromPlan = m[1] + inv[+m[2]] + (m[3] || "");
    });
}
