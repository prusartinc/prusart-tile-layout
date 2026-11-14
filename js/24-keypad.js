"use strict";
/* ================= inch keypad + voice + typo check =================
   On phones a length field opens our own keypad: digits, feet mark, the common fractions
   (1/16 … 7/8) as one tap, a microphone ("ninety six and three eighths") and ✓.
   ⌨ switches back to the system keyboard. */
const KPT = {
  ru: {
    kpOwn: "Клавиатура дюймов",
    kpNext: "Далее",
    kpSys: "Клавиатура",
    kpVoice: "Голос",
    kpHear: "Слушаю…",
    kpNo: "Не понял: «{t}»",
    kpTypo: "Было {a}, стало {b} — точно? (↶ вернёт)",
  },
  en: {
    kpOwn: "Inch keypad",
    kpNext: "Next",
    kpSys: "Keyboard",
    kpVoice: "Voice",
    kpHear: "Listening…",
    kpNo: "Didn't get: “{t}”",
    kpTypo: "Was {a}, now {b} — sure? (↶ undoes it)",
  },
};
const kt = (k) => (KPT[lang] || KPT.en)[k] || k;
const KP_LEN = (el) =>
  el &&
  el.tagName === "INPUT" &&
  /^(len|slen)$/.test(el.dataset.t || "") &&
  !el.readOnly;
const kpCoarse = () => matchMedia("(pointer: coarse)").matches;
let KP = null;

function kpShow(inp) {
  KP = inp;
  let el = $("#kp");
  if (!el) {
    el = document.createElement("div");
    el.id = "kp";
    document.body.appendChild(el);
    // keep focus in the field while tapping keys
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const b = e.target.closest("button");
      if (b) kpKey(b.dataset.k);
    });
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const fr = [
    "1/16",
    "1/8",
    "3/16",
    "1/4",
    "5/16",
    "3/8",
    "1/2",
    "5/8",
    "3/4",
    "7/8",
  ];
  const K = (k, label, cls = "") =>
    `<button data-k="${k}" class="${cls}">${label}</button>`;
  const lab =
    inp.closest("label") && inp.closest("label").querySelector("span");
  el.innerHTML =
    `<div class="kpv"><span>${esc(lab ? lab.textContent : "")}</span><b id="kpval">${esc(inp.value)}</b><i>″</i></div>` +
    `<div class="kpfr">${fr.map((f) => K("f" + f, f)).join("")}</div>` +
    `<div class="kpg">${K("7", "7")}${K("8", "8")}${K("9", "9")}${K("bs", "⌫", "op")}${K("4", "4")}${K("5", "5")}${K("6", "6")}${K("ft", "′ ft", "op")}${K("1", "1")}${K("2", "2")}${K("3", "3")}${K("sp", "␣", "op")}${K(".", ".")}${K("0", "0")}${K("/", "/")}${K("ok", "✓", "ok")}</div>` +
    `<div class="kpb">${K("sys", "⌨", "op")}${SR ? K("mic", "🎤 " + kt("kpVoice"), "op") : ""}${K("next", kt("kpNext") + " ⇥", "op")}${K("clr", "C", "op")}</div>`;
  document.body.classList.add("kpon");
  setTimeout(
    () =>
      inp.scrollIntoView &&
      inp.scrollIntoView({ block: "center", behavior: "smooth" }),
    60,
  );
}
function kpHide() {
  KP = null;
  document.body.classList.remove("kpon");
  const el = $("#kp");
  if (el) el.innerHTML = "";
}
function kpSet(v) {
  if (!KP) return;
  KP.value = v;
  const pv = $("#kpval");
  if (pv) pv.textContent = v;
  KP.dispatchEvent(new Event("input", { bubbles: true }));
}
function kpKey(k) {
  const inp = KP;
  if (!inp) return;
  let v = inp.value;
  if (k === "ok") {
    inp.dispatchEvent(new Event("change", { bubbles: true }));
    inp.blur();
    return kpHide();
  }
  if (k === "sys") {
    inp.inputMode = "decimal";
    inp.dataset.sys = "1";
    kpHide();
    inp.blur();
    setTimeout(() => inp.focus(), 50);
    return;
  }
  if (k === "mic") return kpVoice();
  if (k === "next") {
    // jump to the next length field (and keep the keypad)
    const all = [
      ...document.querySelectorAll("input[data-t='len'],input[data-t='slen']"),
    ].filter((x) => x.offsetParent);
    const nx = all[all.indexOf(inp) + 1];
    inp.dispatchEvent(new Event("change", { bubbles: true }));
    if (nx) {
      nx.focus();
      if (nx.select) nx.select();
    } else {
      inp.blur();
      kpHide();
    }
    return;
  }
  if (k === "clr") return kpSet("");
  if (k === "bs") return kpSet(v.slice(0, -1));
  if (k === "sp") return kpSet(v.endsWith(" ") || !v ? v : v + " ");
  if (k === "ft") return kpSet(/['′]/.test(v) ? v : v.trim() + "′ ");
  if (k[0] === "f") {
    // replace any fraction already typed, keep the whole inches
    const whole = v.replace(/\s*\d+\s*\/\s*\d*\s*$/, "").trim();
    return kpSet((whole ? whole + " " : "") + k.slice(1));
  }
  kpSet(v + k);
}
document.addEventListener("focusin", (e) => {
  const el = e.target;
  if (!KP_LEN(el)) return;
  el.dataset.prev = el.value; // for the typo check
  if (!kpCoarse() || el.dataset.sys || (DB && DB.kp === false)) return;
  el.inputMode = "none";
  kpShow(el);
});
document.addEventListener("focusout", (e) => {
  if (e.target === KP)
    setTimeout(() => {
      if (document.activeElement !== KP) kpHide();
    }, 120);
});

/* typo check: a length that jumps by 10x or more is almost always a missed or extra digit */
document.addEventListener(
  "change",
  (e) => {
    const el = e.target;
    if (!KP_LEN(el) || el.dataset.prev == null) return;
    const a = parseLen(el.dataset.prev),
      b = parseLen(el.value);
    el.dataset.prev = el.value;
    if (!(a > 2 && b > 0)) return;
    if (b / a >= 8 || a / b >= 8)
      toast(
        "⚠ " + kt("kpTypo").replace("{a}", fmt(a)).replace("{b}", fmt(b)),
        true,
      );
  },
  true,
);

/* ---------- voice: "96 и 3/8", "девяносто шесть и три восьмых", "five feet two and a half" ---------- */
function kpVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR || !KP) return;
  const r = new SR(),
    inp = KP;
  r.lang = lang === "ru" ? "ru-RU" : "en-US";
  r.interimResults = false;
  r.maxAlternatives = 3;
  toast("🎤 " + kt("kpHear"), false);
  r.onresult = (ev) => {
    const alts = [...ev.results[0]].map((x) => x.transcript);
    for (const a of alts) {
      const v = spokenLen(a);
      if (v != null && isFinite(v) && v > 0) {
        KP = inp;
        kpSet(fmtIn(v));
        inp.dispatchEvent(new Event("change", { bubbles: true }));
        return;
      }
    }
    toast(kt("kpNo").replace("{t}", alts[0] || ""), false);
  };
  r.onerror = () => toast(kt("kpNo").replace("{t}", "…"), false);
  try {
    r.start();
  } catch (e) {}
}
const NUMW = {
  ноль: 0,
  один: 1,
  одна: 1,
  одну: 1,
  два: 2,
  две: 2,
  три: 3,
  четыре: 4,
  пять: 5,
  шесть: 6,
  семь: 7,
  восемь: 8,
  девять: 9,
  десять: 10,
  одиннадцать: 11,
  двенадцать: 12,
  тринадцать: 13,
  четырнадцать: 14,
  пятнадцать: 15,
  шестнадцать: 16,
  семнадцать: 17,
  восемнадцать: 18,
  девятнадцать: 19,
  двадцать: 20,
  тридцать: 30,
  сорок: 40,
  пятьдесят: 50,
  шестьдесят: 60,
  семьдесят: 70,
  восемьдесят: 80,
  девяносто: 90,
  сто: 100,
  двести: 200,
  триста: 300,
  четыреста: 400,
  пятьсот: 500,
  zero: 0,
  one: 1,
  a: 1,
  an: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
};
function spokenDen(w) {
  if (/^(половин|half|halves)/.test(w)) return 2;
  if (/^(четверт|quarter)/.test(w)) return 4;
  if (/^(восьм|eighth)/.test(w)) return 8;
  if (/^(шестнадцат.*(ая|ых|ые|ую)|sixteenth)/.test(w)) return 16;
  return 0;
}
function spokenLen(text) {
  let s = String(text || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[,]/g, ".")
    .trim();
  const direct = parseLen(s.replace(/\s*(дюйм\w*|inch\w*|in)\.?\s*$/, ""));
  if (isFinite(direct)) return direct;
  const toks = s.split(/[\s-]+/).filter(Boolean);
  let ft = 0,
    whole = 0,
    acc = null,
    frac = 0;
  const flush = () => {
    const v = acc;
    acc = null;
    return v;
  };
  for (let i = 0; i < toks.length; i++) {
    const w = toks[i].replace(/[.]$/, "");
    if (/^\d+(\.\d+)?$/.test(w)) {
      acc = (acc || 0) + parseFloat(w);
      continue;
    }
    const fm = w.match(/^(\d+)\/(\d+)$/);
    if (fm) {
      frac += +fm[1] / +fm[2];
      continue;
    }
    if (w in NUMW) {
      const n = NUMW[w];
      acc = n === 100 && acc ? acc * 100 : (acc || 0) + n;
      continue;
    }
    const den = spokenDen(w);
    if (den) {
      // "три восьмых" = 3/8; "половина" / "a half" = 1/2
      const num = flush();
      frac += (num && num < den ? num : 1) / den;
      continue;
    }
    if (/^(фут|foot|feet|ft)/.test(w)) {
      ft += (flush() || 0) * 12;
      continue;
    }
    if (/^(дюйм|inch|in)/.test(w)) {
      whole += flush() || 0;
      continue;
    }
    if (/^(и|and|с|плюс|plus|целых|точка|point)$/.test(w)) {
      if (acc != null && /^(точка|point)$/.test(w)) {
        // "96 point 5"
        const nxt = toks[i + 1];
        if (nxt && /^\d+$/.test(nxt)) {
          acc += parseFloat("0." + nxt);
          i++;
        }
        continue;
      }
      if (acc != null) whole += flush();
      continue;
    }
  }
  if (acc != null) whole += acc;
  const v = ft + whole + frac;
  return v > 0 ? v : null;
}
