"use strict";
/* ================= what is on each wall now =================
   On site a wall is bare framing, drywall, or still has old tile. Each wall
   (and the room, for all walls at once) says what is on it now; the size it
   was measured to ("plan.walls.i.meas", see 41-measure) follows it by
   default and can still be set apart. The plan shows a small tag at every
   wall: К / ГК / Пл. The layout math only depends on what the size was
   measured to; "what is on it now" is for the crew and sets that default. */

const WST = {
  ru: {
    have: "Сейчас на стене",
    haveRoom: "Сейчас на стенах",
    h_frame: "каркас (стойки)",
    h_dry: "гипсокартон",
    h_tile: "старая плитка",
    h_room: "как вся комната",
    measBy: "Размер замерен по",
    tag_frame: "К",
    tag_dry: "ГК",
    tag_tile: "Пл",
    allHint:
      "Для всех стен сразу. У отдельной стены можно поставить своё — нажми на стену на плане.",
    demo: "снять до стоек",
  },
  en: {
    have: "On the wall now",
    haveRoom: "On the walls now",
    h_frame: "framing (studs)",
    h_dry: "drywall",
    h_tile: "old tile",
    h_room: "same as the room",
    measBy: "Size measured to",
    tag_frame: "F",
    tag_dry: "DW",
    tag_tile: "T",
    allHint:
      "For all walls at once. A single wall can differ — tap it on the plan.",
    demo: "tear to the studs",
  },
};
const wst = (k) => (WST[lang === "ru" ? "ru" : "en"] || WST.en)[k] || k;
const HAVE_K = ["frame", "dry", "tile"];

function haveRoom(pl) {
  pl = pl || P.plan;
  if (pl.have) return pl.have;
  return HAVE_K.includes(pl.meas) ? pl.meas : "frame";
}
function haveOf(i, pl) {
  pl = pl || P.plan;
  const w = (pl.walls || [])[i] || {};
  return w.have && w.have !== "room" ? w.have : haveRoom(pl);
}
/* tags are shown once the crew has said anything about it */
function haveSet(pl) {
  pl = pl || P.plan;
  return (
    !!pl &&
    (!!pl.have ||
      (pl.walls || []).some((w) => w && w.have && w.have !== "room"))
  );
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
        const i = V.wsel,
          lab0 = `<label class="f w2"><span>${mt("wall")}</span>`,
          sel = SEL(
            wst("have"),
            `plan.walls.${i}.have`,
            ["room"].concat(HAVE_K),
            1,
            "p",
            "w2",
            (o) =>
              o === "room"
                ? `${wst("h_room")} (${wst("h_" + haveRoom(pl))})`
                : wst("h_" + o),
          );
        if (h.includes(lab0))
          h = h.replace(
            lab0,
            sel + `<label class="f w2"><span>${wst("measBy")}</span>`,
          );
        if (haveOf(i, pl) === "tile")
          h = h.replace(
            `<label class="f w2"><span>${wst("measBy")}</span>`,
            `<p class="hint w2">⚠ ${wst("h_tile")}: ${wst("demo")}</p><label class="f w2"><span>${wst("measBy")}</span>`,
          );
      } else if (V.sel == null && V.wsel == null) {
        const lab0 = `<label class="f w2"><span>${mt("room")}</span>`;
        if (h.includes(lab0))
          h = h.replace(
            lab0,
            SEL(wst("haveRoom"), "plan.have", HAVE_K, 1, "p", "w2", (o) =>
              wst("h_" + o),
            ) +
              `<p class="hint w2">${wst("allHint")}</p>` +
              `<label class="f w2"><span>${wst("measBy")}</span>`,
          );
      }
    } catch (e) {
      console.error(e);
    }
    return h;
  };
}

/* "what is on it" sets "measured to" (the crew measures to what is there) */
document.addEventListener("change", (e) => {
  const k = e.target && e.target.dataset && e.target.dataset.k;
  if (!k || !P.plan || !S.plan) return;
  const pl = P.plan;
  let m;
  if (k === "plan.have") {
    pl.meas = pl.have;
    // walls that follow the room follow it here too
    pl.walls.forEach((w) => {
      if (w && (!w.have || w.have === "room") && w.meas && w.meas !== "room")
        w.meas = "room";
    });
  } else if ((m = /^plan\.walls\.(\d+)\.have$/.exec(k))) {
    const w = pl.walls[+m[1]];
    if (!w) return;
    w.meas = w.have === "room" ? "room" : w.have;
  } else return;
  saveSoon();
  renderPlan();
});

/* the plan: lock and wall-state tags at the wall numbers */
{
  const pd = planDraw;
  planDraw = function () {
    const r = pd.apply(this, arguments);
    try {
      const pl = P.plan,
        V = S.plan;
      if (!pl || !V || V.v !== "top") return r;
      const tags = haveSet(pl),
        NS = "http://www.w3.org/2000/svg";
      document.querySelectorAll("#plsvg circle[data-pw]").forEach((c) => {
        const i = +c.getAttribute("data-pw"),
          w = pl.walls[i] || {},
          k = +c.getAttribute("r") / 7 || 1,
          cx = +c.getAttribute("cx"),
          cy = +c.getAttribute("cy");
        if (w.lk && V.wsel !== i) {
          c.setAttribute("fill", "#161512");
          c.setAttribute("stroke", "#161512");
          const tx = c.parentNode.querySelector(`text[data-pw="${i}"]`);
          if (tx) tx.setAttribute("fill", "#fff");
        }
        if (tags) {
          const hv = haveOf(i, pl),
            t = document.createElementNS(NS, "text");
          t.setAttribute("x", cx);
          t.setAttribute("y", cy + 15.5 * k);
          t.setAttribute("text-anchor", "middle");
          t.setAttribute("font-size", 7.5 * k);
          t.setAttribute("font-weight", "800");
          t.setAttribute(
            "font-family",
            typeof FONT === "string" ? FONT : "sans-serif",
          );
          t.setAttribute(
            "fill",
            hv === "tile" ? "#b4441b" : hv === "dry" ? "#2f6fab" : "#5f5a48",
          );
          t.setAttribute("paint-order", "stroke");
          t.setAttribute("stroke", "#fbfaf7");
          t.setAttribute("stroke-width", 2.5 * k);
          t.setAttribute("pointer-events", "none");
          t.textContent = wst("tag_" + hv);
          c.parentNode.insertBefore(t, c.nextSibling);
        }
      });
    } catch (e) {
      console.error(e);
    }
    return r;
  };
}
