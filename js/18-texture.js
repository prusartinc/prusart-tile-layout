"use strict";
/* ================= tile photo texture ================= */
/* A photo of one tile, cropped to the tile's proportions and shrunk, stored as a JPEG data URL in tile.tex
   (tile.texAR = its width / height). Drawn on the plan in client view, when "Tile photo" is on, and in client PDFs. */
const TEX_MAX = 360;

function texFromBlob(blob, T) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob),
      img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      // crop the center of the photo to the tile proportions (the photo may be portrait or landscape)
      let a = (+T.w || 1) / (+T.h || +T.w || 1);
      if (img.width >= img.height !== a >= 1) a = 1 / a;
      let sw = img.width,
        sh = img.height;
      if (sw / sh > a) sw = sh * a;
      else sh = sw / a;
      const k = Math.min(1, TEX_MAX / Math.max(sw, sh)),
        c = document.createElement("canvas");
      c.width = Math.max(8, Math.round(sw * k));
      c.height = Math.max(8, Math.round(sh * k));
      c.getContext("2d").drawImage(
        img,
        (img.width - sw) / 2,
        (img.height - sh) / 2,
        sw,
        sh,
        0,
        0,
        c.width,
        c.height,
      );
      try {
        T.tex = c.toDataURL("image/jpeg", 0.82);
        T.texAR = c.width / c.height;
        res(T.tex);
      } catch (e) {
        rej(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rej(new Error("img"));
    };
    img.src = url;
  });
}
function texDone(ok) {
  S.texOn = S.texOn || ok;
  renderPanel();
  changed();
  toast(ok ? t("texOk") : t("texErr"), false);
}
function texBlock(T) {
  return `<p style="margin:12px 0 4px"><b>📷 ${t("texT")}</b></p>${
    T.tex
      ? `<div class="texrow"><img src="${T.tex}" alt=""><div class="hint">${t("texHint")}</div></div>`
      : `<p class="hint">${t("texNone")}</p>`
  }<div class="btns"><button class="btn sm" data-act="texPick">📷 ${t("texPick")}</button><button class="btn sm" data-act="texPaste">📋 ${t("texPaste")}</button><button class="btn sm" data-act="texUrl">🔗 ${t("texUrl")}</button>${T.tex ? `<button class="btn sm d" data-act="texDel">✕</button>` : ""}</div>${CHK(t("texShow"), "texOn", 1, "x")}`;
}
async function texAct(cmd) {
  const s = cur();
  if (!s) return;
  const T = s.tile;
  if (cmd === "texPick") {
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.onchange = async () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      try {
        await texFromBlob(f, T);
        texDone(true);
      } catch (e) {
        texDone(false);
      }
    };
    inp.click();
    return;
  }
  if (cmd === "texPaste") {
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const ty = it.types.find((x) => x.startsWith("image/"));
        if (ty) {
          await texFromBlob(await it.getType(ty), T);
          return texDone(true);
        }
        if (it.types.includes("text/plain")) {
          const txt = (await (await it.getType("text/plain")).text()).trim();
          if (/^https?:\/\//.test(txt)) return texFromUrl(txt, T);
        }
      }
      toast(t("texNoClip"), false);
    } catch (e) {
      toast(t("texNoClip"), false);
    }
    return;
  }
  if (cmd === "texUrl") {
    modal(
      `<h3>🔗 ${t("texUrl")}</h3><p class="hint">${t("texUrlHint")}</p><label class="f"><span>URL</span><input id="texU" type="url" autocomplete="off" placeholder="https://"></label><div class="btns"><button class="btn p" data-act="texUrlGo">${t("texLoad")}</button><button class="btn" data-act="closeModal">${t("cancel")}</button></div>`,
    );
    setTimeout(() => $("#texU") && $("#texU").focus(), 50);
    return;
  }
  if (cmd === "texUrlGo") {
    const u = ($("#texU") || {}).value || "";
    closeModal();
    return texFromUrl(u.trim(), T);
  }
  if (cmd === "texDel") {
    delete T.tex;
    delete T.texAR;
    renderPanel();
    changed();
  }
}
async function texFromUrl(u, T) {
  if (!/^https?:\/\//.test(u)) return toast(t("texErr"), false);
  try {
    const r = await fetch(u, { mode: "cors" });
    if (!r.ok) throw 0;
    const b = await r.blob();
    if (!/^image\//.test(b.type)) throw 0;
    await texFromBlob(b, T);
    texDone(true);
  } catch (e) {
    // most stores don't allow other sites to download their pictures
    modal(
      `<h3>${t("texBlockedT")}</h3><p>${t("texBlocked")}</p><div class="btns"><button class="btn p" data-act="texPick">📷 ${t("texPick")}</button><button class="btn" data-act="closeModal">${t("close")}</button></div>`,
    );
  }
}
