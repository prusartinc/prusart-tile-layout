"use strict";
/* ================= tile-area close-up on the plan =================
   On a wall view the tile area is small and its labels crowd. Tap it and the
   view frames only that area (the real layout, readable); a bar on top goes
   back to the whole wall or opens that surface in the layout editor. */

const ZFT = {
  ru: {
    all: "Вся стена",
    edit: "Править раскладку",
    tap: "Нажми на плитку — приблизится",
  },
  en: {
    all: "Whole wall",
    edit: "Edit the layout",
    tap: "Tap the tile to zoom in",
  },
};
const zft = (k) => (ZFT[lang === "ru" ? "ru" : "en"] || ZFT.en)[k];

function zfBar(box) {
  const V = S.plan;
  document.body.classList.toggle("zfon", !!(V && V.zf && V.v !== "top"));
  if (!V || V.v === "top") return;
  const i = P.surfaces.findIndex((x) => x.fromPlan === V.zf);
  if (V.zf && i < 0) V.zf = null;
  const d = document.createElement("div");
  d.className = "zfbar";
  d.innerHTML = V.zf
    ? `<button class="btn" data-act="plZf:">‹ ${zft("all")}</button><button class="btn p" data-act="plGo:${i}">${zft("edit")} ›</button>`
    : P.surfaces.some(
          (x) =>
            x.plOrg &&
            x.type === "wall" &&
            (x.fromPlan === "w" + V.v ||
              (x.fromPlan || "").startsWith(`z${V.v}:`)),
        )
      ? `<span class="zfhint">${zft("tap")}</span>`
      : "";
  if (d.innerHTML) box.appendChild(d);
  if (V.zf && typeof motionRestart === "function")
    motionRestart(box.querySelector("svg"), "c-swap", 600);
}
function zfSet(k) {
  const V = S.plan;
  if (!V) return;
  const was = !!V.zf;
  V.zf = k || null;
  V.z = 1;
  V.zx = V.zy = 0;
  if (V.v !== "top") V.wsel = +V.v; // keep this wall's sheet below
  document.body.classList.toggle("zfon", !!V.zf);
  // the box grows for the close-up: re-render so the frame uses the new size
  if (was !== !!V.zf) renderPlan();
  else planDraw();
}
{
  const pa = planAct;
  planAct = function (a, arg) {
    if (a === "plZf") return zfSet(arg);
    return pa.apply(this, arguments);
  };
}
/* a tap (not a drag) on the tile area of a wall view; items on top keep their own taps */
{
  let down = null;
  document.addEventListener(
    "pointerdown",
    (e) => {
      down =
        e.target.closest && e.target.closest("#plsvg")
          ? [e.clientX, e.clientY, Date.now()]
          : null;
    },
    true,
  );
  document.addEventListener(
    "pointerup",
    (e) => {
      const d0 = down;
      down = null;
      if (!d0 || !S.plan || S.plan.v === "top" || S.plan.zf) return;
      if (
        Math.hypot(e.clientX - d0[0], e.clientY - d0[1]) > 8 ||
        Date.now() - d0[2] > 600
      )
        return;
      const t = e.target;
      if (
        !t.closest ||
        t.closest("[data-pi],[data-stud],[data-drn],[data-act],.zfbar")
      )
        return;
      const g = t.closest("#plsvg [data-zf]");
      if (!g) return;
      setTimeout(() => zfSet(g.getAttribute("data-zf")), 0);
    },
    true,
  );
}
