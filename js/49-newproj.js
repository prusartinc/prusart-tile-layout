"use strict";
/* ================= one way to start a new project =================
   Home has a single "New project" button. Step 1: name, client, address.
   Step 2: what we do on this job — the whole room (drawn as a plan), shower
   walls with a tiled pan, shower walls only (acrylic / ready pan), tub
   walls, bathroom floor, backsplash, a floor, a wall. "Whole room" goes
   straight to sketching the plan; the rest continue with the questions. */

const NPX = {
  ru: {
    room: "Вся комната",
    roomD: "рисуешь план — стены, пол, душ по плану",
    showerp: "Душ + поддон под плитку",
    showerpD: "стены, поддон, бордюр, ниша",
    showerw: "Только стены душа",
    showerwD: "поддон акриловый или готовый",
    kitchen: "Backsplash",
    kitchenD: "фартук по шкафам",
    roomOnly: "Вся комната делается по плану — остальное отметишь на плане.",
  },
  en: {
    room: "Whole room",
    roomD: "draw the plan — walls, floor, shower from it",
    showerp: "Shower + tiled pan",
    showerpD: "walls, pan, curb, niche",
    showerw: "Shower walls only",
    showerwD: "acrylic or ready-made pan",
    kitchen: "Backsplash",
    kitchenD: "along the cabinets",
    roomOnly: "The whole room is done from the plan — mark the rest on it.",
  },
};
const npx = (k) => (NPX[lang === "ru" ? "ru" : "en"] || NPX.en)[k];
const NP_JOBS = [
  ["room", "▦"],
  ["showerp", "🚿"],
  ["showerw", "🚿"],
  ["tub", "🛁"],
  ["bfloor", "🚽"],
  ["kitchen", "🍳"],
  ["floor", "▦"],
  ["wall", "🧱"],
];
function npOn(N, j) {
  if (j === "room") return !!N.room;
  if (j === "showerp") return N.jobs.shower && !!N.sh.pan;
  if (j === "showerw") return N.jobs.shower && !N.sh.pan;
  return !!N.jobs[j];
}
function npLabel(j) {
  if (j === "room" || j === "showerp" || j === "showerw" || j === "kitchen")
    return [npx(j), npx(j + "D")];
  return [t("job_" + j), t("jobd_" + j)];
}

{
  const ri = renderInterview;
  renderInterview = function () {
    const r = ri.apply(this, arguments);
    try {
      const N = S.nh,
        el = homeEl(),
        k = nhSteps(N)[N.step - 1];
      // the plan card is a job now ("Whole room")
      el.querySelectorAll('.nhdraw[data-act="homeNewPlan"]').forEach((b) =>
        b.remove(),
      );
      if (k === "jobs") {
        const box = el.querySelector(".jobs");
        if (box)
          box.innerHTML = NP_JOBS.map(([j, ic]) => {
            const [b, sm] = npLabel(j);
            return `<button class="job ${npOn(N, j) ? "on" : ""} ${j === "room" ? "jroom" : ""}" data-act="nhJob:${j}"><span>${ic}</span><b>${b}</b><small>${sm}</small></button>`;
          }).join("");
        if (N.room && box)
          box.insertAdjacentHTML(
            "afterend",
            `<p class="hint">${npx("roomOnly")}</p>`,
          );
        const nx = el.querySelector('.nhbar [data-act="nhNext"]');
        if (nx && N.room) nx.disabled = false;
      }
    } catch (e) {
      console.error(e);
    }
    return r;
  };
}
{
  const rh = renderHome;
  renderHome = function () {
    const r = rh.apply(this, arguments);
    try {
      // one "New project" button: the separate plan card goes
      if (!S.nh)
        homeEl()
          .querySelectorAll('.hnew2[data-act="wzOpen"]')
          .forEach((b) => b.remove());
    } catch (e) {}
    return r;
  };
}
{
  const ha = homeAct;
  homeAct = function (a, arg) {
    const N = S.nh;
    if (N && a === "nhJob") {
      if (arg === "room") {
        N.room = !N.room;
        if (N.room) JOBS.forEach((j) => (N.jobs[j] = false));
        return renderHome();
      }
      N.room = false;
      if (arg === "showerp" || arg === "showerw") {
        const pan = arg === "showerp";
        if (npOn(N, arg)) N.jobs.shower = false;
        else {
          N.jobs.shower = true;
          N.sh.pan = pan;
          N.sh.curb = pan;
        }
        return renderHome();
      }
    }
    if (N && a === "nhNext" && N.room && nhSteps(N)[N.step - 1] === "jobs") {
      const info = { name: N.name, client: N.client, addr: N.addr };
      S.nh = null;
      const r = homeAct("homeNewPlan");
      if (info.name) {
        P.name = info.name;
        P.nk = null;
      }
      P.client = info.client || "";
      P.addr = info.addr || "";
      saveSoon();
      if (S.plan) renderPlan();
      return r;
    }
    return ha.apply(this, arguments);
  };
}
