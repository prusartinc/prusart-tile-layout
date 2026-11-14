"use strict";
/* ================= room plan: page, drawing, pointer ================= */
/* ---------- page ---------- */
function planEl() {
  let el = $("#plan");
  if (!el) {
    el = document.createElement("div");
    el.id = "plan";
    document.body.appendChild(el);
    el.addEventListener("input", onInp);
    el.addEventListener("change", onInp);
    el.addEventListener("pointerdown", planDown);
    el.addEventListener("change", (e) => {
      const a = e.target.dataset && e.target.dataset.actSel;
      if (a) planAct(a, e.target.value);
    });
  }
  return el;
}
function planOpen() {
  planEnsure();
  closeModal();
  S.plan = { v: "top", sel: null, wsel: null };
  document.body.classList.add("planon");
  renderPlan();
  renderBtab();
}
function planClose() {
  S.plan = null;
  document.body.classList.remove("planon");
  renderAll();
  requestAnimationFrame(() => draw());
}
function renderPlan() {
  if (!S.plan) return;
  const el = planEl(),
    pl = planEnsure(),
    V = S.plan,
    n = pl.room.segs.length;
  if (typeof V.v === "number" && V.v >= n) V.v = "top";
  if (V.sel && !pl.items.find((x) => x.id === V.sel)) V.sel = null;
  if (V.wsel != null && V.wsel >= n) V.wsel = null;
  let h = `<div class="plhead"><button data-act="plClose">‹ ${pt("plBack")}</button><b>${pt("plT")}</b><button data-act="plUndo" title="Undo">↶</button></div>`;
  h += `<div class="plviews"><button data-act="plView:top" class="${V.v === "top" ? "on" : ""}">▦ ${pt("plTop")}</button>${pl.room.segs
    .map(
      (g, i) =>
        `<button data-act="plView:${i}" class="${V.v === i ? "on" : ""}">▥ ${i + 1} · ${fmt(+g.l)}</button>`,
    )
    .join(
      "",
    )}<span class="plsep"></span><button data-act="plLayerE" class="lay ${V.hideE ? "" : "on2"}">⚡ ${pt("plElec")}</button>${V.v !== "top" ? `<button data-act="plTiles" class="lay ${V.noTiles ? "" : "on2"}">▦ ${pt("plTilesL")}</button>` : ""}<button data-act="plPdf" class="lay">📄 PDF</button></div>`;
  h += `<div class="plsvg" id="plsvg"></div><div class="plsheet" id="plsheet">${planSheet()}</div>`;
  el.innerHTML = h;
  planDraw();
}
function planSheet() {
  const pl = P.plan,
    V = S.plan,
    idx = pl.items.findIndex((x) => x.id === V.sel);
  const B = (act, label, cls = "") =>
    `<button class="btn sm ${cls}" data-act="${act}">${label}</button>`;
  if (idx >= 0) {
    const it = pl.items[idx],
      K = PL_KINDS[it.k],
      p = `plan.items.${idx}.`;
    let h = `<h4>${K.ic} ${pt("k_" + it.k)}</h4><div class="grid2">`;
    if (!K.floor) {
      h += `<label class="f"><span>${pt("plWall")}</span><select data-k="${p}wall" data-sc="p" data-t="sel" data-rb="1">${pl.room.segs
        .map(
          (_, i) =>
            `<option value="${i}" ${i === +it.wall ? "selected" : ""}>${pt("plWall")} ${i + 1}</option>`,
        )
        .join("")}</select></label>`;
      h += F(pt("plC"), p + "c", "len", "p");
    } else {
      h +=
        F(pt("plX"), p + "x", "len", "p") + F(pt("plY"), p + "y", "len", "p");
    }
    if (!K.pt) h += F(K.glass ? pt("plGl") : pt("plW"), p + "w", "len", "p");
    if (K.glass) {
      h +=
        F(pt("plAng"), p + "ang", "num", "p") +
        F(pt("plHh"), p + "h", "len", "p") +
        F(pt("plGz"), p + "z", "len", "p");
      h += SEL(pt("plGdoor"), p + "door", ["none", "a", "b"], 1, "p", "", (o) =>
        pt("gd_" + o),
      );
      if (it.door !== "none") h += F(pt("plDw"), p + "dw", "len", "p");
    }
    if (!K.inwall && !K.pt && !K.floor)
      h += F(pt("plDp"), p + "dp", "len", "p");
    if (it.k === "register") h += F(pt("plDp"), p + "dp", "len", "p");
    if (it.k === "niche") h += F(pt("plDp"), p + "dp", "len", "p");
    if (!K.floor && it.k !== "shower") h += F(pt("plHh"), p + "h", "len", "p");
    if (["window", "ucab", "mirror", "niche", "shelf"].includes(it.k))
      h += F(pt("plZ"), p + "z", "len", "p");
    if (K.pt) h += F(pt("plZc"), p + "z", "len", "p");
    if (it.k === "toilet") h += F(pt("plRi"), p + "ri", "len", "p");
    if (it.k === "cab")
      h += `</div><p class="hsec">${pt("plCt")}</p><div class="grid2">${F(pt("plCtt"), p + "ctt", "len", "p")}${F(pt("plCtf"), p + "ctf", "len", "p")}${F(pt("plCtl"), p + "ctl", "len", "p")}${F(pt("plCtr"), p + "ctr", "len", "p")}`;
    if (it.k === "shower") {
      h += `</div><p class="hsec">${pt("plDrain")}</p><div class="grid2">${SEL(pt("plDrain"), p + "drn", ["center", "point", "linear"], 1, "p", "", (o) => pt("drn_" + o))}`;
      if (it.drn === "point")
        h +=
          F(pt("plDl"), p + "dl", "len", "p") +
          F(pt("plDb"), p + "db", "len", "p");
      if (it.drn === "linear")
        h +=
          SEL(
            pt("plLside"),
            p + "lside",
            ["back", "left", "right", "front"],
            1,
            "p",
            "",
            (o) => pt("ls_" + o),
          ) +
          F(pt("plLoff"), p + "loff", "len", "p") +
          F(pt("plLlen"), p + "llen", "len", "p");
      if (it.drn === "point")
        h += `<p class="hint" style="grid-column:1/-1">${pt("plDhint")
          .replace("{r}", fmt(+it.w - +it.dl))
          .replace("{f}", fmt(+it.dp - +it.db))}</p>`;
    }
    if (K.tzh != null) {
      h += `</div>${CHK(pt("plTz"), p + "tz", 1, "p")}`;
      if (it.tz) {
        h += `<div class="grid2">${F(pt("plTzh"), p + "tzh", "len", "p")}</div>`;
        h += CHK(pt("plTzf"), p + "tzf", 1, "p");
        if (!it.tzf)
          h += `<div class="grid2">${F(pt("plTzl"), p + "tzl", "len", "p")}${F(pt("plTzr"), p + "tzr", "len", "p")}</div>`;
        if (K.side) {
          h += CHK(pt("plTzs"), p + "tzs", 1, "p");
          if (it.tzs) {
            h += CHK(pt("plTzsf"), p + "tzsf", 1, "p");
            if (!it.tzsf)
              h += `<div class="grid2">${F(pt("plTzo"), p + "tzo", "len", "p")}</div>`;
          }
        }
        const zs = planZones(planPts()).filter((z) => z.ids.includes(it.id));
        if (zs.length)
          h += `<p class="hint">${zs.map((z) => `${pt("plWall")} ${z.wall + 1}: ${fmt(z.x1 - z.x0)} × ${fmt(z.z1 - z.z0)}`).join(" · ")}</p>`;
      }
      h += `<div class="grid2">`;
    }
    if (it.k === "door") {
      h += SEL(
        pt("plDtype"),
        p + "dtype",
        ["swing", "pocket", "slide", "opening"],
        1,
        "p",
        "",
        (o) => pt(o),
      );
      if (it.dtype === "swing") {
        h += SEL(pt("plSwing"), p + "swing", ["in", "out"], 1, "p", "", (o) =>
          pt("sw_" + o),
        );
        h += SEL(pt("plHinge"), p + "hinge", ["a", "b"], 1, "p", "", (o) =>
          pt("hg_" + o),
        );
        h += F(pt("plDt"), p + "dt", "len", "p");
      }
    }
    h += `</div>`;
    if (!K.floor && !K.pt) {
      const W = planWall(it.wall);
      h += `<p class="hint">${pt("plEdges")}: ${fmt(+it.c - it.w / 2)} · ${fmt(W.L - +it.c - it.w / 2)} ${pt("plCs")}</p>`;
    }
    if (it.k === "outlet") h += CHK("GFCI", p + "gfci", 1, "p");
    if (K.glass)
      h += `<div class="btns">${B("plGlassPan", "⤓ " + pt("plGpan"))}${B("plGlassFlip", "⇅ " + pt("plGflip"))}${B("plGlassRot", "↻ 90°")}</div>`;
    const warn = planChecks().filter((w) => w.id === it.id);
    if (warn.length)
      h += `<div class="note">${warn.map((w) => "⚠ " + w.msg).join("<br>")}</div>`;
    if (!K.floor)
      h += `<div class="btns">${B("plCenterW", "⇹ " + pt("plCenterW"))}<label class="f" style="flex:1;min-width:150px"><span>${pt("plCopyTo")}</span><select data-act-sel="plCopyTo"><option value="">—</option>${pl.room.segs
        .map((_, i) =>
          i === +it.wall
            ? ""
            : `<option value="${i}">${pt("plWall")} ${i + 1}</option>`,
        )
        .join("")}</select></label></div>`;
    h += `<div class="btns plnudge">${B("plNudge:-1:0", "←")}${B("plNudge:1:0", "→")}${B("plNudge:0:1", "↑")}${B("plNudge:0:-1", "↓")}${B("plDup", pt("plDup"))}${B("plDel", pt("plDel"), "d")}</div>`;
    return h;
  }
  if (V.wsel != null) {
    const i = V.wsel,
      w = pl.walls[i];
    let h = `<h4>▥ ${pt("plWall")} ${i + 1}</h4><div class="grid2">${F(pt("plLen"), `plan.room.segs.${i}.l`, "len", "p")}${F(pt("plTurn"), `plan.room.segs.${i}.a`, "num", "p")}${F(pt("plTh"), `plan.walls.${i}.th`, "len", "p")}</div>`;
    h += CHK(pt("plTile"), `plan.walls.${i}.tile`, 1, "p");
    if (w.tile)
      h += `<div class="grid2">${F(pt("plTileH"), `plan.walls.${i}.tileH`, "len", "p")}</div>`;
    h += `<p class="hsec">${pt("plAddHere")}</p><div class="pllib">${PL_ORDER.filter(
      (k) => !PL_KINDS[k].floor,
    )
      .map(
        (k) =>
          `<button data-act="plAdd:${k}:${i}"><span>${PL_KINDS[k].ic}</span>${pt("k_" + k)}</button>`,
      )
      .join("")}</div>`;
    const sf = P.surfaces.findIndex((s) => s.fromPlan === "w" + i);
    if (sf >= 0)
      h += `<div class="btns">${B("plGo:" + sf, "▦ " + pt("plOpen"))}</div>`;
    return h;
  }
  // room
  const wk = walkPoly(pl.room);
  let h = `<div class="btns">${B("plAdd:door", pt("plAddDoor"))}${B("plAdd:window", pt("plAddWin"))}${B("plLib", pt("plAddItem"), "p")}</div>`;
  h += `<p class="hint">${pt("plNone")}</p>`;
  const W2 = planChecks();
  if (W2.length)
    h += `<div class="note"><b>${pt("plChk")}</b><br>${W2.map((w) => "⚠ " + w.msg).join("<br>")}</div>`;
  else if (pl.items.length) h += `<p class="hint">✓ ${pt("plChkOk")}</p>`;
  if (wk.gap > 0.1)
    h += `<div class="note">⚠ ${pt("plGap")}: ${fmt(wk.gap)} <button class="btn sm" data-act="plFit">${pt("plFit")}</button></div>`;
  h += `<h4>${pt("plRoom")}</h4><div class="grid2">${F(pt("plH"), "plan.H", "len", "p")}</div>`;
  h += `<p class="hint">${pt("plWalls")}</p><div class="plwalls">${pl.room.segs
    .map(
      (g, i) =>
        `<div class="plwrow"><b data-act="plWsel:${i}">${i + 1}</b>${F(pt("plLen"), `plan.room.segs.${i}.l`, "len", "p")}${F(pt("plTurn"), `plan.room.segs.${i}.a`, "num", "p")}${F(pt("plTh"), `plan.walls.${i}.th`, "len", "p")}<button class="btn sm" data-act="plWdel:${i}" ${pl.room.segs.length <= 3 ? "disabled" : ""}>✕</button></div>`,
    )
    .join(
      "",
    )}</div><div class="btns">${B("plWadd", "+ " + pt("plWall"))}${B("plRot", "↻ 90°")}${B("plMirror", "⇋ " + pt("plMirror"))}</div>`;
  const built = P.surfaces
    .map((s2, i) => [s2, i])
    .filter(([s2]) => s2.fromPlan);
  if (built.length)
    h += `<p class="hsec">▦ ${nt("plOpenL")}</p><div class="btns plgo">${built.map(([s2, i]) => B("plGo:" + i, esc(s2.name))).join("")}</div>`;
  h += `<p class="hsec">${pt("plTpl")}</p><div class="btns">${["bath58", "walkin", "kitchen"].map((k2) => B("plTpl:" + k2, pt("tpl_" + k2))).join("")}</div>`;
  h += `<div class="btns">${B("plBuild", "⇄ " + pt("plBuild"), "p")}${P.surfaces.some((s) => s.type === "floor") ? B("plFromFloor", pt("plFromFloor")) : ""}</div><p class="hint">${pt("plBuildHint")}</p>`;
  return h;
}

/* ---------- drawing ---------- */
const PLC = {
  wall: "#4a4743",
  cut: "#d0342c",
  sel: "#e07a1f",
  dim: "#1d5fa8",
  item: "#141414",
  fill: "#f6f3ec",
};
function plText(x, y, s, size, o = {}) {
  const rot = o.rot
    ? ` transform="rotate(${o.rot.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)})"`
    : "";
  return `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" font-size="${size.toFixed(2)}" text-anchor="middle" dominant-baseline="central" fill="${o.fill || PLC.dim}" font-weight="${o.fw || 700}" font-family="${FONT}" paint-order="stroke" stroke="${o.bg || "#fff"}" stroke-width="${(size * 0.28).toFixed(2)}"${rot}>${esc(s)}</text>`;
}
/* dimension line from p to q (screen coords), text above */
function plDim(p, q, label, k, off) {
  const dx = q[0] - p[0],
    dy = q[1] - p[1],
    L = Math.hypot(dx, dy) || 1,
    ux = dx / L,
    uy = dy / L,
    nx = -uy,
    ny = ux,
    a = [p[0] + nx * off, p[1] + ny * off],
    b = [q[0] + nx * off, q[1] + ny * off],
    tk = 4 * k;
  let ang = (Math.atan2(uy, ux) * 180) / Math.PI;
  if (ang > 90) ang -= 180;
  if (ang <= -90) ang += 180;
  const sl = (c) =>
    `M${(c[0] - (ux - nx) * tk * 0.7).toFixed(2)} ${(c[1] - (uy - ny) * tk * 0.7).toFixed(2)}L${(c[0] + (ux - nx) * tk * 0.7).toFixed(2)} ${(c[1] + (uy - ny) * tk * 0.7).toFixed(2)}`;
  let h = `<path d="M${p[0].toFixed(2)} ${p[1].toFixed(2)}L${(a[0] + nx * 3 * k).toFixed(2)} ${(a[1] + ny * 3 * k).toFixed(2)}M${q[0].toFixed(2)} ${q[1].toFixed(2)}L${(b[0] + nx * 3 * k).toFixed(2)} ${(b[1] + ny * 3 * k).toFixed(2)}" stroke="${PLC.dim}" stroke-width="${(0.6 * k).toFixed(2)}" opacity=".55"/>`;
  h += `<path d="M${a[0].toFixed(2)} ${a[1].toFixed(2)}L${b[0].toFixed(2)} ${b[1].toFixed(2)}${sl(a)}${sl(b)}" stroke="${PLC.dim}" stroke-width="${(1 * k).toFixed(2)}" fill="none"/>`;
  if (label && L > 9 * k) {
    const fs = Math.min(11 * k, (L / Math.max(3, label.length * 0.62)) * 1.05);
    if (fs > 6.5 * k)
      h += plText(
        (a[0] + b[0]) / 2 + nx * 7 * k,
        (a[1] + b[1]) / 2 + ny * 7 * k,
        label,
        fs,
        { rot: ang },
      );
  }
  return h;
}
function planDraw() {
  const box = $("#plsvg");
  if (!box || !S.plan) return;
  const W0 = box.clientWidth || 360,
    H0 = box.clientHeight || 360;
  box.innerHTML =
    S.plan.v === "top" ? planTopSVG(W0, H0) : planElevSVG(+S.plan.v, W0, H0);
  plZoomApply();
}
/* pinch zoom: S.plan.z = scale, zx/zy = offset of the visible window from the fitted one (plan units) */
function plZoomApply() {
  const V = S.plan,
    svg = $("#plsvg svg");
  if (!svg) return;
  const b = svg.getAttribute("viewBox").split(" ").map(Number);
  svg.dataset.vb0 = b.join(" ");
  if (!(V.z > 1.01)) return;
  svg.setAttribute(
    "viewBox",
    `${b[0] + (V.zx || 0)} ${b[1] + (V.zy || 0)} ${b[2] / V.z} ${b[3] / V.z}`,
  );
  svg.dataset.k = String((+svg.dataset.k || 1) / V.z);
}
let PLPRINT = null; // {k} while rendering sheets for the PDF
function plFit(bb, W0, H0, pad) {
  const w = bb.x1 - bb.x0 || 1,
    h = bb.y1 - bb.y0 || 1,
    k =
      PLPRINT && PLPRINT.k
        ? PLPRINT.k
        : Math.max(
            w / Math.max(40, W0 - 2 * pad),
            h / Math.max(40, H0 - 2 * pad),
          );
  const vw = W0 * k,
    vh = H0 * k,
    x0 = (bb.x0 + bb.x1) / 2 - vw / 2,
    y0 = (bb.y0 + bb.y1) / 2 - vh / 2;
  return {
    k,
    vb: `${x0.toFixed(2)} ${y0.toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`,
  };
}
function planTopSVG(W0, H0) {
  const pl = P.plan,
    V = S.plan,
    pts = planPts(),
    n = pts.length,
    out = planOuter(pts),
    // screen coords: y down
    sp = (p) => [p[0], -p[1]],
    pd = (A) =>
      "M" +
      A.map((q) =>
        sp(q)
          .map((v) => v.toFixed(2))
          .join(" "),
      ).join("L") +
      "Z";
  const ob = bboxOf(out),
    m = 34,
    bb = { x0: ob.x0 - m, x1: ob.x1 + m, y0: -ob.y1 - m, y1: -ob.y0 + m },
    F0 = plFit(bb, W0, H0, 6),
    k = F0.k;
  let h = `<svg viewBox="${F0.vb}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" data-k="${k}">`;
  h += `<defs><pattern id="plh" width="${6 * k}" height="${6 * k}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${6 * k}" height="${6 * k}" fill="#d8d3c8"/><path d="M0 0V${6 * k}" stroke="#8d877b" stroke-width="${1.1 * k}"/></pattern></defs>`;
  h += `<path d="${pd(pts)}" fill="${PLC.fill}"/>`;
  h += `<path d="${pd(out)}${pd(pts)}" fill="url(#plh)" fill-rule="evenodd" stroke="${PLC.wall}" stroke-width="${1.4 * k}" data-pwall="1"/>`;
  // wall hit lines + numbers
  for (let i = 0; i < n; i++) {
    const W = planWall(i, pts),
      a = sp(W.a),
      b = sp(W.b),
      mid = sp(plAt(W, W.L / 2, -W.th / 2)),
      on = V.wsel === i;
    h += `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="${on ? PLC.sel : "transparent"}" stroke-width="${(on ? 3 : 1) * k}" opacity=".9"/>`;
    const q1 = sp(plAt(W, 0, -W.th / 2)),
      q2 = sp(plAt(W, W.L, -W.th / 2));
    h += `<path d="M${q1[0]} ${q1[1]}L${q2[0]} ${q2[1]}" stroke="transparent" stroke-width="${Math.max(W.th, 16 * k)}" data-pw="${i}"/>`;
    const nb = sp(plAt(W, W.L / 2, 11 * k + 2));
    h += `<circle cx="${nb[0]}" cy="${nb[1]}" r="${7 * k}" fill="${on ? PLC.sel : "#fff"}" stroke="${on ? PLC.sel : PLC.wall}" stroke-width="${k}" data-pw="${i}"/>${plText(nb[0], nb[1], String(i + 1), 9 * k, { fill: on ? "#fff" : PLC.wall, bg: "none" }).replace("<text", `<text data-pw="${i}"`)}`;
    void mid;
  }
  // tiled stretches of wall: blue band on the inner face
  for (let i = 0; i < n; i++)
    if ((pl.walls[i] || {}).tile) {
      const W = planWall(i, pts),
        a = sp(plAt(W, 0, 1.2 * k)),
        b = sp(plAt(W, W.L, 1.2 * k));
      h += `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="#2f7fd0" stroke-width="${2.6 * k}" opacity=".75"/>`;
    }
  planZones(pts).forEach((z) => {
    const W = planWall(z.wall, pts),
      a = sp(plAt(W, z.s0, 1.2 * k)),
      b = sp(plAt(W, z.s1, 1.2 * k));
    h += `<path d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}" stroke="#2f7fd0" stroke-width="${2.6 * k}" opacity=".75"/>`;
  });
  // items
  pl.items
    .filter((it) => !(V.hideE && PL_KINDS[it.k].el))
    .forEach(
      (it) => (h += planItemTop(it, pts, k, !PLPRINT && it.id === V.sel)),
    );
  // dimensions outside each wall: chain of item edges + overall
  for (let i = 0; i < n; i++) {
    const W = planWall(i, pts),
      br = [0, W.L];
    pl.items
      .filter((it) => it.wall === i && !PL_KINDS[it.k].floor)
      .forEach((it) => {
        if (PL_KINDS[it.k].pt || it.k === "toilet") br.push(+it.c);
        else br.push(+it.c - it.w / 2, +it.c + it.w / 2);
      });
    const S2 = [
      ...new Set(
        br.map((v) => Math.round(Math.max(0, Math.min(W.L, v)) * 16) / 16),
      ),
    ].sort((x, y) => x - y);
    const base = (s) => sp(plAt(W, s, -W.th)),
      // offsets are to the left of the a->b direction in screen space; flip sign so it points outward
      sideSign = (() => {
        const a = sp(W.a),
          b = sp(W.b),
          o = sp(plAt(W, W.L / 2, -W.th - 10)),
          mx = (a[0] + b[0]) / 2,
          my = (a[1] + b[1]) / 2,
          dx = b[0] - a[0],
          dy = b[1] - a[1];
        return -dy * (o[0] - mx) + dx * (o[1] - my) > 0 ? 1 : -1;
      })();
    if (S2.length > 2)
      for (let j = 0; j < S2.length - 1; j++)
        if (S2[j + 1] - S2[j] > 0.05)
          h += plDim(
            base(S2[j]),
            base(S2[j + 1]),
            fmt(S2[j + 1] - S2[j]),
            k,
            sideSign * 12 * k,
          );
    h += plDim(
      base(0),
      base(W.L),
      fmt(W.L),
      k,
      sideSign * (S2.length > 2 ? 26 : 12) * k,
    );
  }
  // code checks
  (PLPRINT ? [] : planChecks()).forEach((w) => {
    if (!w.p) return;
    const q = sp(w.p);
    h += `<g><circle cx="${q[0]}" cy="${q[1]}" r="${6.5 * k}" fill="#d0342c"/>${plText(q[0], q[1], "!", 9 * k, { fill: "#fff", bg: "none", fw: 800 })}</g>`;
  });
  // corner handles
  if (!PLPRINT)
    pts.forEach((q, i) => {
      const c = sp(q);
      h += `<g data-pc="${i}"><circle cx="${c[0]}" cy="${c[1]}" r="${14 * k}" fill="transparent"/><circle cx="${c[0]}" cy="${c[1]}" r="${4.5 * k}" fill="#fff" stroke="${PLC.dim}" stroke-width="${1.6 * k}"/></g>`;
    });
  // odd angles
  const A = cornerAngles(pts);
  pts.forEach((q, i) => {
    if (Math.abs(A[i] - 90) < 0.3 || Math.abs(A[i] - 270) < 0.3) return;
    const W = planWall(i, pts),
      Wp = planWall((i - 1 + n) % n, pts),
      d = [W.nin[0] + Wp.nin[0], W.nin[1] + Wp.nin[1]],
      dl = Math.hypot(d[0], d[1]) || 1,
      p = sp([q[0] + (d[0] / dl) * 16 * k, q[1] + (d[1] / dl) * 16 * k]);
    h += plText(p[0], p[1], Math.round(A[i] * 10) / 10 + "°", 9 * k, {
      fill: "#b4441b",
    });
  });
  return h + `</svg>`;
}
function planItemTop(it, pts, k, sel) {
  const K = PL_KINDS[it.k],
    sp = (p) => [p[0], -p[1]],
    P2 = (A) =>
      A.map((q) =>
        sp(q)
          .map((v) => v.toFixed(2))
          .join(","),
      ).join(" "),
    stc = sel ? PLC.sel : PLC.item,
    sw = (sel ? 2 : 1.1) * k;
  const g = (inner) => `<g data-pi="${it.id}" style="cursor:move">${inner}</g>`;
  if (K.glass) {
    const G = planGlassEnds(it),
      L = +it.w,
      dw = it.door === "none" ? 0 : Math.min(L, +it.dw || 24),
      at2 = (s2) => sp([G.A[0] + G.u[0] * s2, G.A[1] + G.u[1] * s2]),
      dS = it.door === "b" ? L - dw : 0,
      dE = dS + dw,
      gl = (s0, s1) =>
        `<path d="M${at2(s0).join(" ")}L${at2(s1).join(" ")}" stroke="#5aa0d8" stroke-width="${2.6 * k}"/><path d="M${at2(s0).join(" ")}L${at2(s1).join(" ")}" stroke="${stc}" stroke-width="${0.6 * k}"/>`;
    let h = `<path d="M${at2(0).join(" ")}L${at2(L).join(" ")}" stroke="transparent" stroke-width="${16 * k}"/>`;
    if (dw < L) h += dS > 0 ? gl(0, dS) : gl(dE, L);
    if (dw > 0) {
      const hingeS = it.door === "b" ? dE : dS,
        freeS = it.door === "b" ? dS : dE,
        sn = +it.dsn || 1,
        hp = [G.A[0] + G.u[0] * hingeS, G.A[1] + G.u[1] * hingeS],
        tip = sp([hp[0] + G.n[0] * dw * sn, hp[1] + G.n[1] * dw * sn]),
        fp = at2(freeS),
        hq = sp(hp),
        ctl = sp([
          hp[0] + (G.u[0] * (freeS - hingeS)) / 2 + G.n[0] * dw * sn * 0.6,
          hp[1] + (G.u[1] * (freeS - hingeS)) / 2 + G.n[1] * dw * sn * 0.6,
        ]),
        cr = (A2, B2, C2) =>
          (B2[0] - A2[0]) * (C2[1] - A2[1]) - (B2[1] - A2[1]) * (C2[0] - A2[0]);
      h += `<path d="M${hq.join(" ")}L${tip.join(" ")}" stroke="#5aa0d8" stroke-width="${2.2 * k}"/>`;
      h += `<path d="M${tip.join(" ")}A${dw} ${dw} 0 0 ${cr(tip, fp, ctl) > 0 ? 0 : 1} ${fp.join(" ")}" fill="none" stroke="${stc}" stroke-width="${0.8 * k}" stroke-dasharray="${3 * k} ${2 * k}"/>`;
    }
    return g(h);
  }
  if (K.ceil) {
    const c = sp([+it.x, +it.y]),
      r = Math.max(+it.w / 2, 4 * k);
    if (it.k === "fan")
      return g(
        `<rect x="${c[0] - r}" y="${c[1] - r}" width="${2 * r}" height="${2 * r}" fill="#fff" stroke="${stc}" stroke-width="${sw}" stroke-dasharray="${2 * k} ${1.5 * k}"/><path d="M${c[0] - r} ${c[1] - r}L${c[0] + r} ${c[1] + r}M${c[0] + r} ${c[1] - r}L${c[0] - r} ${c[1] + r}" stroke="${stc}" stroke-width="${0.6 * k}"/>${plText(c[0], c[1] + r + 5 * k, "FAN", 6 * k, { fill: stc, fw: 600 })}`,
      );
    return g(
      `<circle cx="${c[0]}" cy="${c[1]}" r="${r}" fill="#fff" stroke="${stc}" stroke-width="${sw}" stroke-dasharray="${2 * k} ${1.5 * k}"/><path d="M${c[0] - r * 0.7} ${c[1] - r * 0.7}L${c[0] + r * 0.7} ${c[1] + r * 0.7}M${c[0] + r * 0.7} ${c[1] - r * 0.7}L${c[0] - r * 0.7} ${c[1] + r * 0.7}" stroke="${stc}" stroke-width="${0.6 * k}"/>`,
    );
  }
  if (K.floor) {
    const c = sp([+it.x, +it.y]);
    if (it.k === "drain")
      return g(
        `<circle cx="${c[0]}" cy="${c[1]}" r="${Math.max(+it.w / 2, 5 * k)}" fill="#fff" stroke="${stc}" stroke-width="${sw}"/><path d="M${c[0] - 2.5} ${c[1]}h5M${c[0]} ${c[1] - 2.5}v5" stroke="${stc}" stroke-width="${0.7 * k}"/>`,
      );
    const F0 = planFoot(it, pts);
    return g(
      `<polygon points="${P2(F0)}" fill="#fff" stroke="${stc}" stroke-width="${sw}"/><path d="M${c[0] - it.w / 2 + 1.5} ${c[1] - 1}h${it.w - 3}M${c[0] - it.w / 2 + 1.5} ${c[1] + 1}h${it.w - 3}" stroke="${stc}" stroke-width="${0.6 * k}"/>`,
    );
  }
  const W = planWall(it.wall, pts),
    c = +it.c,
    w = +it.w,
    at = (s, d) => sp(plAt(W, s, d)),
    poly = (A) =>
      `<polygon points="${A.map((q) => q.map((v) => v.toFixed(2)).join(",")).join(" ")}"`,
    rect = (s0, s1, d0, d1) => [at(s0, d0), at(s1, d0), at(s1, d1), at(s0, d1)],
    ang = (Math.atan2(-W.u[1], W.u[0]) * 180) / Math.PI;
  const ell = (sc, dc, rs, rd) => {
    const q = at(sc, dc);
    return `<ellipse cx="${q[0].toFixed(2)}" cy="${q[1].toFixed(2)}" rx="${rs}" ry="${rd}" transform="rotate(${ang.toFixed(2)} ${q[0].toFixed(2)} ${q[1].toFixed(2)})"`;
  };
  const lbl = (s, d, txt, fs) => {
    const q = at(s, d);
    let a2 = ang;
    if (a2 > 90) a2 -= 180;
    if (a2 <= -90) a2 += 180;
    return plText(q[0], q[1], txt, fs || 8 * k, {
      fill: "#6b665c",
      fw: 600,
      rot: a2,
    });
  };
  let h = "";
  const s0 = c - w / 2,
    s1 = c + w / 2,
    dp = +it.dp || 0;
  switch (it.k) {
    case "door": {
      h +=
        poly(rect(s0, s1, -W.th - 0.5, 0.5)) + ` fill="#fff" stroke="none"/>`;
      h += `<path d="M${at(s0, -W.th).join(" ")}L${at(s0, 0).join(" ")}M${at(s1, -W.th).join(" ")}L${at(s1, 0).join(" ")}" stroke="${PLC.wall}" stroke-width="${1.4 * k}"/>`;
      const hs = it.hinge === "b" ? s1 : s0,
        fs = it.hinge === "b" ? s0 : s1;
      if (it.dtype === "swing") {
        const inn = it.swing !== "out",
          d0 = inn ? 0 : -W.th,
          dir = inn ? 1 : -1,
          hp = at(hs, d0),
          tip = at(hs, d0 + dir * w),
          fp = at(fs, d0);
        // the arc's sweep flag depends on the wall direction; pick the one that bulges into the swing side
        const ctl = at((hs + fs) / 2, d0 + dir * w * 0.6),
          cr = (A, B, C) =>
            (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
        const sweep = cr(tip, fp, ctl) > 0 ? 0 : 1;
        h += `<path d="M${hp.join(" ")}L${tip.join(" ")}" stroke="${stc}" stroke-width="${sw * 1.4}"/>`;
        h += `<path d="M${tip.join(" ")}A${w} ${w} 0 0 ${sweep} ${fp.join(" ")}" fill="none" stroke="${stc}" stroke-width="${0.8 * k}" stroke-dasharray="${3 * k} ${2 * k}"/>`;
      } else if (it.dtype === "pocket") {
        h +=
          poly(
            rect(
              fs > hs ? s0 - w : s1,
              fs > hs ? s0 : s1 + w,
              -W.th / 2 - 0.9,
              -W.th / 2 + 0.9,
            ),
          ) +
          ` fill="none" stroke="${stc}" stroke-width="${0.9 * k}" stroke-dasharray="${3 * k} ${2 * k}"/>`;
        h +=
          poly(rect(s0, s0 + w * 0.15, -W.th / 2 - 0.9, -W.th / 2 + 0.9)) +
          ` fill="${stc}"/>`;
      } else if (it.dtype === "slide") {
        h +=
          poly(rect(s0 - 2, s1 + 2, 1.5, 3.2)) +
          ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      }
      h += poly(rect(s0, s1, -W.th, 0)) + ` fill="transparent"/>`;
      h += lbl(c, -W.th / 2, `${fmtIn(w)}`, 7 * k);
      break;
    }
    case "window":
      h +=
        poly(rect(s0, s1, -W.th, 0)) +
        ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      h += `<path d="M${at(s0, -W.th / 2).join(" ")}L${at(s1, -W.th / 2).join(" ")}M${at(s0, -W.th / 2 - 1).join(" ")}L${at(s1, -W.th / 2 - 1).join(" ")}" stroke="${PLC.dim}" stroke-width="${0.8 * k}"/>`;
      break;
    case "toilet": {
      h +=
        poly(rect(c - 9.5, c + 9.5, 0, 8)) +
        ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      h +=
        ell(
          c,
          8 + (Math.max(dp, 20) - 8) / 2,
          Math.min(w, 20) * 0.38,
          (Math.max(dp, 20) - 8) / 2,
        ) + ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      const f = at(c, +it.ri || 12);
      h += `<path d="M${f[0] - 2} ${f[1]}h4M${f[0]} ${f[1] - 2}v4" stroke="${PLC.cut}" stroke-width="${0.8 * k}"/>`;
      break;
    }
    case "vanity":
      h +=
        poly(rect(s0, s1, 0, dp)) +
        ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      h +=
        ell(c, dp * 0.52, Math.min(w * 0.3, 9), dp * 0.27) +
        ` fill="none" stroke="${stc}" stroke-width="${0.8 * k}"/>`;
      h += lbl(c, dp - 3, pt("k_vanity"));
      break;
    case "tub":
      h +=
        poly(rect(s0, s1, 0, dp)) +
        ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      h +=
        poly(rect(s0 + 3, s1 - 3, 3, dp - 3)) +
        ` fill="none" stroke="${stc}" stroke-width="${0.8 * k}" rx="4"/>`;
      h += lbl(c, dp / 2, pt("k_tub"));
      break;
    case "shower": {
      h +=
        poly(rect(s0, s1, 0, dp)) +
        ` fill="#eef3f8" stroke="${stc}" stroke-width="${sw}"/>`;
      const D = planDrain(it),
        // pan x (as seen facing the back wall) -> distance along the wall
        sx = (x) => (W.flip ? s1 - x : s0 + x),
        ty = (y) => dp - y;
      if (D.type === "linear") {
        const xa = D.x,
          xb = D.vert ? D.x + D.wid : D.x + D.len,
          ya = D.y,
          yb = D.vert ? D.y + D.len : D.y + D.wid;
        h +=
          poly([
            at(sx(xa), ty(ya)),
            at(sx(xb), ty(ya)),
            at(sx(xb), ty(yb)),
            at(sx(xa), ty(yb)),
          ]) + ` fill="#555" stroke="${stc}" stroke-width="${0.6 * k}"/>`;
      } else {
        const q = at(sx(D.x), ty(D.y));
        h += `<path d="M${at(s0, 0).join(" ")}L${q.join(" ")}L${at(s1, 0).join(" ")}M${at(s0, dp).join(" ")}L${q.join(" ")}L${at(s1, dp).join(" ")}" fill="none" stroke="${stc}" stroke-width="${0.5 * k}" opacity=".35"/>`;
        h += `<circle cx="${q[0]}" cy="${q[1]}" r="2" fill="#fff" stroke="${stc}" stroke-width="${0.8 * k}"/>`;
      }
      break;
    }
    case "cab":
    case "fridge":
    case "range":
      h +=
        poly(rect(s0, s1, 0, dp)) +
        ` fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      if (it.k === "cab") {
        const e = planItemX(it, W),
          sa = W.cx(e[0]),
          sb = W.cx(e[1]);
        h +=
          poly(
            rect(
              Math.min(sa, sb),
              Math.max(sa, sb),
              0,
              dp + Math.max(0, +it.ctf || 0),
            ),
          ) +
          ` fill="none" stroke="${stc}" stroke-width="${0.7 * k}" stroke-dasharray="${3 * k} ${2 * k}"/>`;
      }
      if (it.k === "range")
        [
          [0.3, 0.3],
          [0.7, 0.3],
          [0.3, 0.7],
          [0.7, 0.7],
        ].forEach(([a1, b1]) => {
          const q = at(s0 + w * a1, dp * b1);
          h += `<circle cx="${q[0]}" cy="${q[1]}" r="${Math.min(w, dp) * 0.13}" fill="none" stroke="${stc}" stroke-width="${0.7 * k}"/>`;
        });
      else h += lbl(c, dp / 2, it.k === "fridge" ? "REF" : pt("k_cab"), 7 * k);
      break;
    case "ucab":
    case "shelf":
      h +=
        poly(rect(s0, s1, 0, dp)) +
        ` fill="none" stroke="${stc}" stroke-width="${sw}" stroke-dasharray="${4 * k} ${3 * k}"/>`;
      break;
    case "mirror":
      h +=
        poly(rect(s0, s1, 0, 1)) +
        ` fill="#cfe3f2" stroke="${stc}" stroke-width="${sw}"/>`;
      break;
    case "niche":
      h +=
        poly(rect(s0, s1, -dp, 0)) +
        ` fill="#fff" stroke="${stc}" stroke-width="${sw}" stroke-dasharray="${3 * k} ${2 * k}"/>`;
      break;
    default: {
      // point items on the wall face
      const q = at(c, 2.2),
        r = 2.4;
      h += `<circle cx="${q[0]}" cy="${q[1]}" r="${Math.max(r, 3.2 * k)}" fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
      h += plText(
        q[0],
        q[1],
        it.k === "outlet"
          ? "⏚"
          : it.k === "switch"
            ? "S"
            : it.k === "valve"
              ? "V"
              : "H",
        5 * k,
        { fill: stc, bg: "none" },
      );
      if (it.k === "outlet" && it.gfci) {
        const q2 = at(c, 7.5);
        h += plText(q2[0], q2[1], "GFCI", 4.5 * k, { fill: stc, fw: 600 });
      }
    }
  }
  if (sel && !K.pt)
    h +=
      poly(planFoot(it, pts).map(sp)) +
      ` fill="none" stroke="${PLC.sel}" stroke-width="${1 * k}" stroke-dasharray="${2 * k} ${2 * k}"/>`;
  return g(h);
}

/* elevation of wall i, seen from inside the room */
function planElevSVG(i, W0, H0) {
  const pl = P.plan,
    pts = planPts(),
    n = pts.length,
    W = planWall(i, pts),
    L = W.L,
    H = +pl.H || 96,
    ws = pl.walls[i] || {},
    V = S.plan;
  const thL = planWall(W.flip ? (i + 1) % n : (i - 1 + n) % n, pts).th,
    thR = planWall(W.flip ? (i - 1 + n) % n : (i + 1) % n, pts).th;
  const bb = { x0: -thL - 16, x1: L + thR + 44, y0: -H - 14, y1: 40 },
    F0 = plFit(bb, W0, H0, 6),
    k = F0.k,
    Y = (z) => -z;
  let h = `<svg viewBox="${F0.vb}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" data-k="${k}">`;
  h += `<defs><pattern id="plh2" width="${6 * k}" height="${6 * k}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${6 * k}" height="${6 * k}" fill="#d8d3c8"/><path d="M0 0V${6 * k}" stroke="#8d877b" stroke-width="${1.1 * k}"/></pattern></defs>`;
  h += `<rect x="0" y="${Y(H)}" width="${L}" height="${H}" fill="${PLC.fill}" stroke="${PLC.wall}" stroke-width="${k}"/>`;
  if (ws.tile) {
    const th2 = Math.min(H, +ws.tileH || H);
    h += `<rect x="0" y="${Y(th2)}" width="${L}" height="${th2}" fill="#e6eef5" stroke="${PLC.dim}" stroke-width="${0.8 * k}" stroke-dasharray="${4 * k} ${3 * k}"/>`;
    h += plText(L / 2, Y(th2) + 8 * k, `${t("tile")} ↑ ${fmt(th2)}`, 8 * k, {
      fill: PLC.dim,
      fw: 600,
      bg: "#e6eef5",
    });
  }
  h += `<rect x="${-thL}" y="${Y(H)}" width="${thL}" height="${H}" fill="url(#plh2)" stroke="${PLC.wall}" stroke-width="${k}"/><rect x="${L}" y="${Y(H)}" width="${thR}" height="${H}" fill="url(#plh2)" stroke="${PLC.wall}" stroke-width="${k}"/>`;
  h += `<path d="M${-thL - 8} 0H${L + thR + 8}" stroke="${PLC.wall}" stroke-width="${2.2 * k}"/>`;
  const xs = [0, L],
    zs = [0, H];
  if (ws.tile) zs.push(Math.min(H, +ws.tileH || H));
  planZones(pts)
    .filter((z) => z.wall === i)
    .forEach((z) => {
      h += `<rect x="${z.x0}" y="${Y(z.z1)}" width="${z.x1 - z.x0}" height="${z.z1 - z.z0}" fill="#e6eef5" stroke="${PLC.dim}" stroke-width="${0.8 * k}" stroke-dasharray="${4 * k} ${3 * k}"/>`;
      h += plText(
        (z.x0 + z.x1) / 2,
        Y(z.z1) + 8 * k,
        `${t("tile")} ${fmt(z.x1 - z.x0)} × ${fmt(z.z1 - z.z0)}`,
        Math.min(8 * k, (z.x1 - z.x0) / 9),
        { fill: PLC.dim, fw: 600, bg: "#e6eef5" },
      );
      xs.push(z.x0, z.x1);
      zs.push(z.z0, z.z1);
    });
  // the real tile layout of the surfaces built from this wall
  if (!V.noTiles)
    P.surfaces
      .filter(
        (s2) =>
          s2.plOrg &&
          (s2.fromPlan === "w" + i || (s2.fromPlan || "").startsWith(`z${i}:`)),
      )
      .forEach((s2, j) => {
        try {
          const R2 = compute(s2),
            body = surfBody(s2, R2, {
              id: `pe${i}_${j}`,
              fs: 0.7,
              upp: k,
              m: 0,
              noDims: 1,
            });
          h += `<g transform="translate(${s2.plOrg[0]} ${-s2.plOrg[1]})" opacity=".9">${body}</g>`;
        } catch (e) {}
      });
  // items on this wall, then side views of items standing against it from other walls
  const own = pl.items.filter(
    (it) =>
      it.wall === i && !PL_KINDS[it.k].floor && !(V.hideE && PL_KINDS[it.k].el),
  );
  const side = [];
  pl.items.forEach((it) => {
    if (
      it.wall === i ||
      PL_KINDS[it.k].floor ||
      PL_KINDS[it.k].inwall ||
      PL_KINDS[it.k].pt ||
      !(+it.h > 0)
    )
      return;
    const Fp = planFoot(it, pts),
      ss = Fp.map((q) => (q[0] - W.a[0]) * W.u[0] + (q[1] - W.a[1]) * W.u[1]),
      dd = Fp.map(
        (q) => (q[0] - W.a[0]) * W.nin[0] + (q[1] - W.a[1]) * W.nin[1],
      );
    if (Math.min(...dd) > 1 || Math.max(...ss) < 0 || Math.min(...ss) > L)
      return;
    const x0 = W.cx(Math.max(0, Math.min(...ss))),
      x1 = W.cx(Math.min(L, Math.max(...ss)));
    side.push({ it, x0: Math.min(x0, x1), x1: Math.max(x0, x1) });
  });
  side.forEach(({ it, x0, x1 }) => {
    h += `<rect x="${x0}" y="${Y(+it.z + +it.h)}" width="${x1 - x0}" height="${+it.h}" fill="#efebe3" stroke="#8d877b" stroke-width="${k}" stroke-dasharray="${3 * k} ${2 * k}" data-pi="${it.id}"/>`;
    h += plText((x0 + x1) / 2, Y(+it.z + +it.h / 2), pt("k_" + it.k), 7.5 * k, {
      fill: "#8d877b",
      fw: 600,
      bg: "#efebe3",
    });
    xs.push(x0, x1);
    zs.push(+it.z + +it.h);
  });
  pl.items
    .filter((it) => it.k === "glass")
    .forEach((it) => {
      const G = planGlassEnds(it),
        sA = (G.A[0] - W.a[0]) * W.u[0] + (G.A[1] - W.a[1]) * W.u[1],
        sB = (G.B[0] - W.a[0]) * W.u[0] + (G.B[1] - W.a[1]) * W.u[1],
        dA = (G.A[0] - W.a[0]) * W.nin[0] + (G.A[1] - W.a[1]) * W.nin[1],
        dB = (G.B[0] - W.a[0]) * W.nin[0] + (G.B[1] - W.a[1]) * W.nin[1],
        par = Math.abs(G.u[0] * W.u[0] + G.u[1] * W.u[1]),
        z0 = +it.z || 0,
        gh = +it.h || 76;
      if (Math.max(sA, sB) < 0 || Math.min(sA, sB) > L || Math.min(dA, dB) < -1)
        return;
      if (par > 0.9) {
        const x0 = W.cx(Math.max(0, Math.min(sA, sB))),
          x1 = W.cx(Math.min(L, Math.max(sA, sB)));
        h += `<rect x="${Math.min(x0, x1)}" y="${Y(z0 + gh)}" width="${Math.abs(x1 - x0)}" height="${gh}" fill="#5aa0d8" fill-opacity=".12" stroke="#5aa0d8" stroke-width="${1.2 * k}" data-pi="${it.id}"/>`;
        h += plText((x0 + x1) / 2, Y(z0) - 6 * k, pt("k_glass"), 7 * k, {
          fill: "#3d7fb5",
          fw: 600,
          bg: "none",
        });
      } else if (par < 0.3 && Math.min(dA, dB) < 2) {
        const sx = W.cx(dA < dB ? sA : sB);
        h += `<rect x="${sx - 0.5}" y="${Y(z0 + gh)}" width="1" height="${gh}" fill="#5aa0d8" stroke="#3d7fb5" stroke-width="${0.6 * k}" data-pi="${it.id}"/>`;
        xs.push(sx);
      }
    });
  own.forEach((it) => {
    const K = PL_KINDS[it.k],
      sel = it.id === V.sel,
      stc = sel ? PLC.sel : PLC.item,
      sw = (sel ? 2 : 1.1) * k,
      xc = W.ex(+it.c),
      w = +it.w,
      x0 = xc - w / 2,
      z0 = +it.z || 0,
      hh = +it.h || 0;
    let g = "";
    const R = (x, z, ww, hhh, extra) =>
      `<rect x="${x.toFixed(2)}" y="${Y(z + Math.max(0, hhh)).toFixed(2)}" width="${Math.max(0, ww).toFixed(2)}" height="${Math.max(0, hhh).toFixed(2)}" ${extra}/>`;
    switch (it.k) {
      case "door": {
        g += R(
          x0,
          0,
          w,
          hh,
          `fill="#fff" stroke="${stc}" stroke-width="${sw}"`,
        );
        g += R(
          x0 + 1.5,
          0,
          w - 3,
          hh - 1.5,
          `fill="none" stroke="${stc}" stroke-width="${0.7 * k}"`,
        );
        if (it.dtype === "swing") {
          // hinge side: dashed triangle pointing to the hinges
          const hingeLeft = W.flip ? it.hinge === "b" : it.hinge !== "b";
          const hx = hingeLeft ? x0 + 1.5 : x0 + w - 1.5,
            fx = hingeLeft ? x0 + w - 1.5 : x0 + 1.5;
          g += `<path d="M${fx} ${Y(0)}L${hx} ${Y(hh / 2)}L${fx} ${Y(hh - 1.5)}" fill="none" stroke="${stc}" stroke-width="${0.7 * k}" stroke-dasharray="${3 * k} ${2 * k}"/>`;
        }
        break;
      }
      case "window":
        g += R(
          x0,
          z0,
          w,
          hh,
          `fill="#dfeaf3" stroke="${stc}" stroke-width="${sw}"`,
        );
        g += R(
          x0 + 1.5,
          z0 + 1.5,
          w - 3,
          hh - 3,
          `fill="none" stroke="${stc}" stroke-width="${0.7 * k}"`,
        );
        g += `<path d="M${xc} ${Y(z0 + 1.5)}V${Y(z0 + hh - 1.5)}" stroke="${stc}" stroke-width="${0.7 * k}"/>`;
        break;
      case "toilet":
        g += R(
          xc - 9.5,
          15,
          19,
          Math.max(1, hh - 15),
          `fill="#fff" stroke="${stc}" stroke-width="${sw}"`,
        );
        g += `<path d="M${xc - 8} ${Y(15)}Q${xc - 9} ${Y(6)} ${xc - 5} ${Y(0)}H${xc + 5}Q${xc + 9} ${Y(6)} ${xc + 8} ${Y(15)}Z" fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
        break;
      case "vanity":
      case "cab":
        g += R(
          x0,
          z0,
          w,
          hh,
          `fill="#fff" stroke="${stc}" stroke-width="${sw}"`,
        );
        if (it.k === "cab") {
          const e = planItemX(it, W),
            ct = Math.max(0.5, +it.ctt || 1.5);
          g += R(
            e[0],
            z0 + hh,
            e[1] - e[0],
            ct,
            `fill="#d6d0c4" stroke="${stc}" stroke-width="${0.8 * k}"`,
          );
        } else
          g += R(
            x0 - 0.5,
            z0 + hh - 1.5,
            w + 1,
            1.5,
            `fill="#d6d0c4" stroke="${stc}" stroke-width="${0.6 * k}"`,
          );
        g += R(
          x0 + 1,
          z0 + 4,
          w - 2,
          hh - 6.5,
          `fill="none" stroke="${stc}" stroke-width="${0.6 * k}"`,
        );
        if (w > 20)
          g += `<path d="M${xc} ${Y(z0 + 4)}V${Y(z0 + hh - 2.5)}" stroke="${stc}" stroke-width="${0.6 * k}"/>`;
        if (it.k === "vanity")
          g += `<path d="M${xc} ${Y(z0 + hh)}v${-6}h3" fill="none" stroke="${stc}" stroke-width="${1.2 * k}"/>`;
        break;
      case "ucab":
        g += R(
          x0,
          z0,
          w,
          hh,
          `fill="#fff" stroke="${stc}" stroke-width="${sw}"`,
        );
        if (w > 20)
          g += `<path d="M${xc} ${Y(z0 + 1)}V${Y(z0 + hh - 1)}" stroke="${stc}" stroke-width="${0.6 * k}"/>`;
        break;
      case "tub":
        g += R(
          x0,
          0,
          w,
          hh,
          `fill="#fff" stroke="${stc}" stroke-width="${sw}"`,
        );
        g += `<path d="M${x0} ${Y(hh - 2)}H${x0 + w}" stroke="${stc}" stroke-width="${0.6 * k}"/>`;
        break;
      case "shower":
        g += R(x0, 0, w, 4, `fill="#fff" stroke="${stc}" stroke-width="${sw}"`);
        g += R(
          x0,
          0,
          w,
          Math.min(H, 80),
          `fill="none" stroke="${stc}" stroke-width="${0.6 * k}" stroke-dasharray="${4 * k} ${3 * k}"`,
        );
        break;
      case "fridge":
      case "range":
        g += R(
          x0,
          0,
          w,
          hh,
          `fill="#fff" stroke="${stc}" stroke-width="${sw}"`,
        );
        break;
      case "mirror":
        g += R(
          x0,
          z0,
          w,
          hh,
          `fill="#cfe3f2" stroke="${stc}" stroke-width="${sw}"`,
        );
        break;
      case "niche":
        g += R(
          x0,
          z0,
          w,
          hh,
          `fill="#fff" stroke="${stc}" stroke-width="${sw}"`,
        );
        g += R(
          x0 + 1.2,
          z0 + 1.2,
          w - 2.4,
          hh - 2.4,
          `fill="none" stroke="${stc}" stroke-width="${0.6 * k}" stroke-dasharray="${2 * k} ${1.5 * k}"`,
        );
        break;
      case "shelf":
        g += R(
          x0,
          z0,
          w,
          Math.max(hh, 1),
          `fill="#d6d0c4" stroke="${stc}" stroke-width="${sw}"`,
        );
        break;
      default: {
        const zc = z0;
        if (it.k === "outlet" || it.k === "switch") {
          g += R(
            xc - 1.4,
            zc - 2.25,
            2.8,
            4.5,
            `fill="#fff" stroke="${stc}" stroke-width="${sw}"`,
          );
          g +=
            it.k === "outlet"
              ? `<path d="M${xc - 0.4} ${Y(zc + 1.2)}v0.9M${xc + 0.4} ${Y(zc + 1.2)}v0.9M${xc - 0.4} ${Y(zc - 1.2)}v0.9M${xc + 0.4} ${Y(zc - 1.2)}v0.9" stroke="${stc}" stroke-width="${0.6 * k}"/>`
              : "";
        } else if (it.k === "valve") {
          g += `<circle cx="${xc}" cy="${Y(zc)}" r="3.5" fill="#fff" stroke="${stc}" stroke-width="${sw}"/><path d="M${xc} ${Y(zc)}l2.5 -2.5" stroke="${stc}" stroke-width="${1.2 * k}"/>`;
        } else {
          g += `<path d="M${xc} ${Y(zc + 3)}v-3M${xc - 3} ${Y(zc)}h6l-1.5 2.5h-3z" fill="#fff" stroke="${stc}" stroke-width="${sw}"/>`;
        }
      }
    }
    if (!K.pt && hh > 6 && w > 10 && it.k !== "door")
      g += plText(
        xc,
        Y(z0 + (it.k === "shower" ? 10 : hh / 2)),
        `${pt("k_" + it.k)}`,
        Math.min(8 * k, w / 7),
        { fill: "#6b665c", fw: 600 },
      );
    h += `<g data-pi="${it.id}" style="cursor:move">${g}</g>`;
    if (K.pt) xs.push(xc);
    else xs.push(x0, x0 + w);
    if (it.k !== "shower") {
      if (z0 > 0) zs.push(z0);
      if (!K.pt) zs.push(z0 + hh);
    }
  });
  // horizontal chain under the floor, overall below it
  const X = [
    ...new Set(
      xs.map((v) => Math.round(Math.max(0, Math.min(L, v)) * 16) / 16),
    ),
  ].sort((a, b) => a - b);
  if (X.length > 2)
    for (let j = 0; j < X.length - 1; j++)
      if (X[j + 1] - X[j] > 0.05)
        h += plDim([X[j], 0], [X[j + 1], 0], fmt(X[j + 1] - X[j]), k, 12 * k);
  h += plDim([0, 0], [L, 0], fmt(L), k, (X.length > 2 ? 26 : 12) * k);
  // vertical chain of heights at the right
  const Z = [
      ...new Set(
        zs.map((v) => Math.round(Math.max(0, Math.min(H, v)) * 16) / 16),
      ),
    ].sort((a, b) => a - b),
    xr = L + thR;
  for (let j = 0; j < Z.length - 1; j++)
    if (Z[j + 1] - Z[j] > 0.05)
      h += plDim(
        [xr, Y(Z[j])],
        [xr, Y(Z[j + 1])],
        fmt(Z[j + 1] - Z[j]),
        k,
        12 * k,
      );
  if (Z.length > 2) h += plDim([xr, Y(0)], [xr, Y(H)], fmt(H), k, 28 * k);
  // which corner is which
  const lc = W.flip ? (i + 1) % n : i,
    rc = W.flip ? i : (i + 1) % n;
  h +=
    plText(-thL / 2, Y(H) - 6 * k, `∟${lc + 1}`, 7 * k, {
      fill: "#8d877b",
      fw: 600,
    }) +
    plText(L + thR / 2, Y(H) - 6 * k, `∟${rc + 1}`, 7 * k, {
      fill: "#8d877b",
      fw: 600,
    });
  return h + `</svg>`;
}

/* ---------- pointer: select, drag items along walls, drag corners ---------- */
let plDrag = null;
function plPoint(svg, e) {
  const m = svg.getScreenCTM();
  if (!m) return [0, 0];
  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
  return [p.x, p.y];
}
const PLP = new Map();
function plPinchStart() {
  const V = S.plan,
    svg = $("#plsvg svg");
  if (!svg) return;
  const [a, b] = [...PLP.values()],
    r = svg.getBoundingClientRect();
  plDrag = {
    kind: "pinch",
    d0: Math.hypot(a.x - b.x, a.y - b.y) || 1,
    z0: V.z || 1,
    zx0: V.zx || 0,
    zy0: V.zy || 0,
    m0: [(a.x + b.x) / 2, (a.y + b.y) / 2],
    r,
    vb0: svg.dataset.vb0.split(" ").map(Number),
    moved: true,
  };
}
function plPinchMove() {
  const d = plDrag,
    V = S.plan;
  if (!d || d.kind !== "pinch" || PLP.size < 2) return;
  const [a, b] = [...PLP.values()],
    z = Math.max(
      1,
      Math.min(10, (d.z0 * Math.hypot(a.x - b.x, a.y - b.y)) / d.d0),
    ),
    m = [(a.x + b.x) / 2, (a.y + b.y) / 2],
    [bx, by, bw, bh] = d.vb0,
    fx0 = (d.m0[0] - d.r.left) / d.r.width,
    fy0 = (d.m0[1] - d.r.top) / d.r.height,
    fx = (m[0] - d.r.left) / d.r.width,
    fy = (m[1] - d.r.top) / d.r.height,
    px = d.zx0 + (fx0 * bw) / d.z0,
    py = d.zy0 + (fy0 * bh) / d.z0;
  V.z = z;
  V.zx = z > 1.01 ? px - (fx * bw) / z : 0;
  V.zy = z > 1.01 ? py - (fy * bh) / z : 0;
  planDraw();
}
function planDown(e) {
  const svg = e.target.closest && e.target.closest("#plsvg svg");
  if (!svg) return;
  if (e.isPrimary) PLP.clear(); // a lost pointerup must not leave a ghost finger behind
  PLP.set(e.pointerId, { x: e.clientX, y: e.clientY });
  const clr = (ev) => {
    PLP.delete(ev.pointerId);
    window.removeEventListener("pointerup", clr);
    window.removeEventListener("pointercancel", clr);
  };
  window.addEventListener("pointerup", clr);
  window.addEventListener("pointercancel", clr);
  if (PLP.size === 2) {
    e.preventDefault();
    if (plDrag && plDrag.kind === "item" && plDrag.moved) saveSoon();
    plPinchStart();
    const mv = (ev) => {
        if (!PLP.has(ev.pointerId)) return;
        ev.preventDefault();
        PLP.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
        plPinchMove();
      },
      up = () => {
        if (PLP.size >= 2) return;
        window.removeEventListener("pointermove", mv);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        plDrag = null;
        renderPlan();
      };
    window.addEventListener("pointermove", mv, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return;
  }
  if (PLP.size > 2) return;
  const V = S.plan,
    pl = P.plan,
    pi = e.target.closest("[data-pi]"),
    pc = e.target.closest("[data-pc]"),
    pw = e.target.closest("[data-pw]");
  const p0 = plPoint(svg, e);
  if (pc && V.v === "top") {
    plDrag = {
      kind: "corner",
      i: +pc.dataset.pc,
      p0,
      pts: planPts().map((q) => q.slice()),
      svg,
      vb: svg.getAttribute("viewBox"),
      moved: false,
    };
  } else if (pi) {
    const it = pl.items.find((x) => x.id === pi.dataset.pi);
    if (!it) return;
    V.sel = it.id;
    V.wsel = null;
    plDrag = {
      kind: "item",
      it,
      p0,
      c0: +it.c,
      z0: +it.z,
      x0: +it.x,
      y0: +it.y,
      svg,
      vb: svg.getAttribute("viewBox"),
      moved: false,
    };
  } else if (pw && V.v === "top") {
    V.sel = null;
    V.wsel = +pw.dataset.pw;
    $("#plsheet").innerHTML = planSheet();
    planDraw();
    return;
  } else {
    const now = Date.now();
    if (V.lastTap && now - V.lastTap < 350 && V.z > 1.01) {
      V.z = 1;
      V.zx = V.zy = 0;
      V.lastTap = 0;
      planDraw();
      return;
    }
    V.lastTap = now;
    if (V.sel || V.wsel != null) {
      V.sel = null;
      V.wsel = null;
      $("#plsheet").innerHTML = planSheet();
      planDraw();
    }
    if (!(V.z > 1.01)) return;
    const r = svg.getBoundingClientRect(),
      vb0 = svg.dataset.vb0.split(" ").map(Number);
    plDrag = {
      kind: "pan",
      x: e.clientX,
      y: e.clientY,
      zx0: V.zx || 0,
      zy0: V.zy || 0,
      r,
      vb0,
      moved: false,
    };
    e.preventDefault();
    const mv = (ev) => {
        if (!plDrag || plDrag.kind !== "pan") return;
        ev.preventDefault();
        const d = plDrag;
        d.moved = true;
        V.zx = d.zx0 - ((ev.clientX - d.x) / d.r.width) * (d.vb0[2] / V.z);
        V.zy = d.zy0 - ((ev.clientY - d.y) / d.r.height) * (d.vb0[3] / V.z);
        plZoomApplyOnly();
      },
      up = () => {
        window.removeEventListener("pointermove", mv);
        window.removeEventListener("pointerup", up);
        window.removeEventListener("pointercancel", up);
        plDrag = null;
      };
    window.addEventListener("pointermove", mv, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return;
  }
  e.preventDefault();
  const mv = (ev) => {
      ev.preventDefault();
      planMove(ev);
    },
    up = () => {
      window.removeEventListener("pointermove", mv);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      const d = plDrag;
      plDrag = null;
      if (d && d.moved) saveSoon();
      renderPlan();
    };
  window.addEventListener("pointermove", mv, { passive: false });
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  planDraw();
  const s2 = $("#plsvg svg");
  if (s2) s2.setAttribute("viewBox", plDrag.vb);
}
function plZoomApplyOnly() {
  const V = S.plan,
    svg = $("#plsvg svg");
  if (!svg || !svg.dataset.vb0) return;
  const b = svg.dataset.vb0.split(" ").map(Number);
  svg.setAttribute(
    "viewBox",
    `${b[0] + (V.zx || 0)} ${b[1] + (V.zy || 0)} ${b[2] / V.z} ${b[3] / V.z}`,
  );
}
/* inputs on the plan page: keep numbers numeric, keep items inside their wall */
function planInp(k) {
  const pl = P.plan,
    m = k.match(/^plan\.items\.(\d+)\.(\w+)$/),
    mw = k.match(/^plan\.walls\.(\d+)\.tile$/);
  if (mw && pl.walls[+mw[1]].tile && !(+pl.walls[+mw[1]].tileH > 0))
    pl.walls[+mw[1]].tileH = +pl.H || 96;
  if (m) {
    const it = pl.items[+m[1]];
    if (it && m[2] === "wall") {
      it.wall = +it.wall;
      const W = planWall(it.wall),
        half = PL_KINDS[it.k].pt ? 0 : +it.w / 2;
      it.c = Math.max(half, Math.min(W.L - half, +it.c));
    }
  }
}
function planMove(e) {
  const d = plDrag;
  if (!d || d.kind === "pinch" || d.kind === "pan" || PLP.size > 1) return;
  const svg = $("#plsvg svg");
  if (!svg) return;
  svg.setAttribute("viewBox", d.vb); // keep the view still while dragging
  const p = plPoint(svg, e),
    dx = p[0] - d.p0[0],
    dy = p[1] - d.p0[1];
  if (!d.moved && Math.hypot(dx, dy) < 1.5) return;
  d.moved = true;
  const r2 = (v) => Math.round(v * 2) / 2;
  const pl = P.plan,
    V = S.plan;
  if (d.kind === "corner") {
    const pts = d.pts.map((q) => q.slice()),
      n = pts.length,
      i = d.i,
      tol = 4 * (+svg.dataset.k || 1);
    let x = Math.round((d.pts[i][0] + dx) * 8) / 8,
      y = Math.round((d.pts[i][1] - dy) * 8) / 8;
    [pts[(i - 1 + n) % n], pts[(i + 1) % n]].forEach((q) => {
      if (Math.abs(q[0] - x) < tol) x = q[0];
      if (Math.abs(q[1] - y) < tol) y = q[1];
    });
    pts[i] = [x, y];
    if (polyArea(pts) < 10) return;
    // shift floor items so they stay put when the outline re-bases at its min corner
    const m0 = [
        Math.min(...d.pts.map((q) => q[0])),
        Math.min(...d.pts.map((q) => q[1])),
      ],
      m1 = [
        Math.min(...pts.map((q) => q[0])),
        Math.min(...pts.map((q) => q[1])),
      ];
    if (!d.fl)
      d.fl = pl.items
        .filter((it) => PL_KINDS[it.k].floor)
        .map((it) => [it, +it.x, +it.y]);
    d.fl.forEach(([it, x0, y0]) => {
      it.x = x0 - (m1[0] - m0[0]);
      it.y = y0 - (m1[1] - m0[1]);
    });
    ptsToWalk(pl.room, pts);
    const box = $("#plsvg"),
      W0 = box.clientWidth,
      H0 = box.clientHeight;
    box.innerHTML = planTopSVG(W0, H0);
    const s2 = $("#plsvg svg");
    // keep the original framing so the finger stays on the corner
    const sh = m1[0] - m0[0],
      shy = m1[1] - m0[1];
    const vb = d.vb.split(" ").map(Number);
    s2.setAttribute(
      "viewBox",
      `${vb[0] - sh} ${vb[1] + shy} ${vb[2]} ${vb[3]}`,
    );
    s2.setAttribute("data-k", svg.dataset.k);
    return;
  }
  const it = d.it,
    K = PL_KINDS[it.k];
  if (V.v === "top") {
    if (K.floor) {
      it.x = r2(d.x0 + dx);
      it.y = r2(d.y0 - dy);
    } else {
      const pts = planPts(),
        q = [p[0], -p[1]],
        nw = planNearWall(pts, q);
      if (nw && nw.i !== it.wall && Math.abs(nw.d) < 30) {
        it.wall = nw.i;
        d.c0 = nw.s;
        d.p0 = p;
      }
      const W = planWall(it.wall, pts),
        ds = (p[0] - d.p0[0]) * W.u[0] + (-p[1] + d.p0[1]) * W.u[1],
        half = K.pt ? 0 : +it.w / 2;
      it.c = planSnap(
        it,
        W,
        Math.max(half, Math.min(W.L - half, r2(d.c0 + ds))),
      );
    }
  } else {
    const W = planWall(it.wall),
      half = K.pt ? 0 : +it.w / 2;
    if (it.wall === +V.v) {
      it.c = Math.max(
        half,
        Math.min(W.L - half, r2(d.c0 + (W.flip ? -dx : dx))),
      );
      if (
        ![
          "door",
          "toilet",
          "vanity",
          "tub",
          "shower",
          "cab",
          "fridge",
          "range",
        ].includes(it.k)
      )
        it.z = Math.max(0, r2(d.z0 - dy));
    }
  }
  const box = $("#plsvg");
  box.innerHTML =
    V.v === "top"
      ? planTopSVG(box.clientWidth, box.clientHeight)
      : planElevSVG(+V.v, box.clientWidth, box.clientHeight);
  $("#plsvg svg").setAttribute("viewBox", d.vb);
}
