"use strict";
/* ================= interaction ================= */
const ptrs = new Map();
let drag = null,
  pinch = null;
const dist = () => {
  const a = [...ptrs.values()];
  return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1;
};
function toWorld(cx, cy) {
  const r = svg.getBoundingClientRect();
  return [S.vb[0] + (cx - r.left) * S.upp, -(S.vb[1] + (cy - r.top) * S.upp)];
}
function hitAt(cx, cy) {
  if (!S.items || !S.items.length) return null;
  const w = toWorld(cx, cy),
    tol = 10 * S.upp;
  for (let k = S.items.length - 1; k >= 0; k--) {
    const it = S.items[k],
      s = it.s,
      lx = w[0] - it.dx,
      ly = w[1] - it.dy;
    for (let j = s.openings.length - 1; j >= 0; j--) {
      const o = s.openings[j];
      if (o.shape === "circle") {
        if (Math.hypot(lx - o.x, ly - o.y) <= o.dia / 2 + tol) return { it, op: j };
      } else if (lx >= o.x - tol && lx <= o.x + o.w + tol && ly >= o.y - tol && ly <= o.y + o.h + tol)
        return { it, op: j };
    }
    if (pip(it.R.G.outer, lx, ly)) return { it };
    if (s.type === "pan" && s.curb.on && lx >= 0 && lx <= s.curb.len && ly >= -s.curb.w && ly <= 0)
      return { it };
  }
  return null;
}
const canEdit = () => !S.client && S.tab !== "tot";
function connAt(cx, cy) {
  if (!S.items || !canEdit()) return null;
  const w = toWorld(cx, cy),
    tol = 22 * S.upp;
  for (const it of S.items) {
    const hp = it.R && it.R.heat;
    if (!hp || !(S.layer === "wire" || (S.layer !== "tile" && S.layer !== "prep" && it.s.heat.show)))
      continue;
    const c = hp.conn;
    if (Math.hypot(w[0] - it.dx - c[0], w[1] - it.dy - c[1]) <= tol) return it;
    const sn = hp.sensor;
    if (sn && Math.hypot(w[0] - it.dx - sn[0], w[1] - it.dy - sn[1]) <= tol)
      return Object.assign({ sensor: true }, it);
  }
  return null;
}
svg.addEventListener(
  "touchstart",
  (e) => {
    if (S.tab === "tot") return;
    if (e.touches.length > 1 || S.mode === "view") {
      e.preventDefault();
      return;
    }
    const tc = e.touches[0];
    if (
      S.pickConn ||
      connAt(tc.clientX, tc.clientY) ||
      (S.mode === "tiles" && canEdit() && hitAt(tc.clientX, tc.clientY))
    )
      e.preventDefault();
  },
  { passive: false },
);
function startDrag(x, y, target, pt) {
  const ci = S.pickConn ? null : connAt(x, y);
  if (ci) {
    drag = { x, y, conn: ci, s: null, op: null, px: S.view.panX, py: S.view.panY, upp: S.upp, moved: false };
    return true;
  }
  const h = hitAt(x, y);
  const dimEl = target && target.closest ? target.closest("[data-dim]") : null;
  if (pt === "touch" && !h && !dimEl && S.mode !== "view" && !S.pickConn && !S.full) return false;
  const s = h ? h.it.s : null;
  const T = s ? effT(s) : null;
  drag = {
    x,
    y,
    s,
    it: h ? h.it : null,
    op: h && h.op != null ? h.op : null,
    dim: dimEl ? dimEl.dataset.dim : null,
    ox: T ? T.ox : 0,
    oy: T ? T.oy : 0,
    pox: s && s.prepO ? +s.prepO.x || 0 : 0,
    poy: s && s.prepO ? +s.prepO.y || 0 : 0,
    px: S.view.panX,
    py: S.view.panY,
    upp: S.upp,
    moved: false,
  };
  if (drag.op != null) {
    const o = s.openings[drag.op];
    drag.opx = o.x;
    drag.opy = o.y;
  }
  if (s && isMulti()) S.sel = s.id;
  if (s && zoneMode() && drag.op == null) {
    drag.zone = { px0: +(s.pos || {}).x || 0, py0: +(s.pos || {}).y || 0 };
    S.vbLock = { vb: S.vb.slice(), upp: S.upp };
  }
  return true;
}
svg.addEventListener("pointerdown", (e) => {
  if (S.tab === "tot") return;
  if (ptrs.size === 0) {
    if (!startDrag(e.clientX, e.clientY, e.target, e.pointerType)) return;
  }
  try {
    svg.setPointerCapture(e.pointerId);
  } catch (_) {}
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) {
    pinch = { d: dist(), z: S.view.zoom };
    drag = null;
  }
});
svg.addEventListener("pointermove", (e) => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pinch && ptrs.size >= 2) {
    S.view.zoom = Math.min(14, Math.max(0.4, (pinch.z * dist()) / pinch.d));
    drawSoon();
    return;
  }
  if (!drag) return;
  if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5) drag.moved = true;
  if (!drag.moved) return;
  const dx = (e.clientX - drag.x) * drag.upp,
    dy = (e.clientY - drag.y) * drag.upp,
    sn = (v) => Math.round(v * 16) / 16;
  if (drag.conn) {
    const it = drag.conn,
      w = toWorld(e.clientX, e.clientY);
    if (it.sensor) it.s.heat.sensor = [w[0] - it.dx, w[1] - it.dy];
    else it.s.heat.conn = snapWall(it.R.G.outer, [w[0] - it.dx, w[1] - it.dy]);
    drawSoon();
    return;
  }
  if (drag.zone) {
    const p = zoneSnap(drag.s, drag.zone.px0 + dx, drag.zone.py0 - dy, 12 * drag.upp);
    drag.s.pos = { x: p[0], y: p[1] };
    drawSoon();
    return;
  }
  if (S.mode === "tiles" && canEdit() && drag.s && drag.op != null) {
    const o = drag.s.openings[drag.op];
    o.x = Math.round((drag.opx + dx) * 8) / 8;
    o.y = Math.round((drag.opy - dy) * 8) / 8;
  } else if (S.mode === "tiles" && S.layer === "tile" && canEdit() && drag.s) {
    setO(drag.s, sn(drag.ox + dx), sn(drag.oy - dy));
  } else if (S.mode === "tiles" && S.layer === "prep" && canEdit() && drag.s) {
    drag.s.prepO = { x: sn(drag.pox + dx), y: sn(drag.poy - dy) };
  } else if (S.mode === "view" || e.pointerType !== "touch" || S.layer === "wire") {
    S.view.panX = drag.px - dx;
    S.view.panY = drag.py + dy;
  }
  drawSoon();
});
function pEnd(e) {
  if (!ptrs.has(e.pointerId)) return;
  const cancel = e.type === "pointercancel";
  ptrs.delete(e.pointerId);
  if (ptrs.size < 2) pinch = null;
  if (ptrs.size === 1) {
    const a = [...ptrs.values()][0];
    startDrag(a.x, a.y, null, "mouse");
    if (drag) drag.moved = true;
    return;
  }
  if (ptrs.size === 0 && drag) {
    const d = drag;
    drag = null;
    if (d.zone) {
      S.vbLock = null;
      if (d.moved) {
        changed();
        return;
      }
    }
    if (d.conn) {
      if (d.moved) changed();
      return;
    }
    if (!d.moved && !cancel) {
      // double tap on a surface: open it full screen (✕ brings you back)
      const now = Date.now(),
        lt = S.lastTap;
      if (
        lt &&
        (d.it || S.full) &&
        !S.pickConn &&
        now - lt.t < 380 &&
        Math.hypot(d.x - lt.x, d.y - lt.y) < 36
      ) {
        clearTimeout(S.tapTimer);
        S.lastTap = null;
        if (S.full) act("full");
        else openFull(d.it.s, lt.tab);
        return;
      }
      S.lastTap = d.it || S.full ? { t: now, x: d.x, y: d.y, tab: S.tab } : null;
      if (S.pickConn && canEdit()) {
        const s2 = P.surfaces.find((x) => x.id === S.pickConn);
        const it = S.items.find((i) => i.s === s2);
        if (s2 && it) {
          const w = toWorld(d.x, d.y);
          s2.heat.conn = snapWall(it.R.G.outer, [w[0] - it.dx, w[1] - it.dy]);
          S.pickConn = null;
          changed();
          renderPanel();
        }
        return;
      }
      if (d.dim && canEdit()) {
        editDim(d.dim);
        return;
      }
      if (d.op != null && canEdit()) {
        editOpening(P.surfaces.indexOf(d.s), d.op);
        return;
      }
      if (!isMulti() && d.it && S.layer === "tile" && S.tab !== "tot") {
        pieceInfo(d.it, d.x, d.y);
        return;
      }
      if (isMulti() && d.it && !S.client) {
        // wait a moment: a second tap opens the surface full screen instead
        const it = d.it;
        clearTimeout(S.tapTimer);
        S.tapTimer = setTimeout(() => {
          S.tab = P.surfaces.indexOf(it.s);
          S.view = { zoom: 1, panX: 0, panY: 0 };
          renderAll();
        }, 300);
      }
      return;
    }
    if (
      d.s &&
      S.mode === "tiles" &&
      canEdit() &&
      (d.op != null || S.layer === "tile" || S.layer === "prep")
    ) {
      if (d.op == null && S.layer === "tile") normalizeS(d.s);
      changed();
      if (S.layer === "prep" && !isMulti()) renderPanel();
      if (d.op != null && !isMulti()) renderPanel();
    }
  }
}
svg.addEventListener("pointerup", pEnd);
svg.addEventListener("pointercancel", pEnd);
svg.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    S.view.zoom = Math.min(14, Math.max(0.4, S.view.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
    drawSoon();
  },
  { passive: false },
);
new ResizeObserver(() => drawSoon()).observe($("#stage"));
