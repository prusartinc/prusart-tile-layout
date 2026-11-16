"use strict";
/* ================= one-time tips =================
   A short hint the first time a screen shows something non-obvious. Tapping "Got it" hides
   that hint for good (remembered in DB.tips). Never shown in client view or shared links. */
const TIPS = {
  ru: {
    pan: [
      "Трап",
      "Двигай трап пальцем на чертеже или тапни по нему — откроются расстояния от стен.",
    ],
    card: [
      "Тап по плитке",
      "Откроется карточка: все стороны куска, красные линии реза и отметки от углов A/B/C/D.",
    ],
    cut: [
      "Лист резки",
      "В «Ещё → Лист резки» отмечай нарезанные куски галочкой — увидишь, сколько осталось.",
    ],
    plan: [
      "План комнаты",
      "Отсюда строятся стены, пол и поддон. Поменял душ или поддон — пол подстроится сам.",
    ],
    ok: "Понятно",
  },
  en: {
    pan: [
      "Drain",
      "Drag the drain on the drawing, or tap it to see its distances from the walls.",
    ],
    card: [
      "Tap a tile",
      "Its card shows every side, the red cut lines and marks from corners A/B/C/D.",
    ],
    cut: [
      "Cut list",
      "In “More → Cut list” tick pieces as you cut them and see what's left.",
    ],
    plan: [
      "Room plan",
      "Walls, floor and pan are built from here. Change the shower or pan — the floor follows.",
    ],
    ok: "Got it",
  },
};
function tipShow(id) {
  if (S.client || S.shared || !DB) return;
  DB.tips = DB.tips || {};
  if (DB.tips[id] || document.querySelector(".tip")) return;
  const T = TIPS[lang] || TIPS.en,
    tx = T[id];
  if (!tx) return;
  const el = document.createElement("div");
  el.className = "tip";
  el.innerHTML = `<div><b>💡 ${esc(tx[0])}</b>${esc(tx[1])}</div><button data-act="tipOk:${id}">${esc(T.ok)}</button>`;
  document.body.appendChild(el);
}
function tipOk(id) {
  DB.tips = DB.tips || {};
  DB.tips[id] = 1;
  saveSoon();
  const el = document.querySelector(".tip");
  if (el) el.remove();
}
// pick the tip that fits what is on screen now
function tipCheck() {
  if (S.home || S.client || S.shared || !P) return;
  if (S.plan) return tipShow("plan");
  const s = !isMulti() && cur();
  if (!s) return;
  if (s.type === "pan" && s.drain && s.drain.type !== "none")
    return tipShow("pan");
  if (DB.tips && DB.tips.card) return tipShow("cut");
  tipShow("card");
}
{
  const ra = renderAll;
  renderAll = function () {
    const r = ra.apply(this, arguments);
    setTimeout(() => {
      try {
        tipCheck();
      } catch (e) {}
    }, 400);
    return r;
  };
}
