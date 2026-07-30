/* Desktop bootstrap: icons, boot, menus, clock, toasts, achievements,
   screensaver, konami, BSOD, shutdown, and other load-bearing nonsense. */
const wm = new WindowManager();
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

const DESKTOP_ORDER = ["about", "projects", "chat", "terminal", "skills", "experience", "education", "contact", "trash"];

/* ---------- toasts ---------- */
const toastsEl = document.getElementById("toasts");
function toast(msg, { title = "", timeout = 5200 } = {}) {
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = (title ? `<div class="t-title">${title}</div>` : "") + msg;
  toastsEl.appendChild(el);
  const kill = () => { el.classList.add("out"); setTimeout(() => el.remove(), 260); };
  el.addEventListener("click", kill);
  setTimeout(kill, timeout);
}
window.toast = toast;

/* ---------- achievements ---------- */
const Achievements = (() => {
  const DEFS = {
    explorer: "explorer — opened every app",
    multitasker: "multitasker — 5 windows at once",
    hacker: "terminal person — ran 10 commands",
    konami: "cheat codes — you know the one",
    bsod: "system administrator — deleted / and lived",
    nightowl: "night shift — visiting after midnight",
  };
  const load = () => { try { return JSON.parse(localStorage.getItem("ach") || "{}"); } catch { return {}; } };
  const state = load();
  const save = () => localStorage.setItem("ach", JSON.stringify(state));
  return {
    unlock(id) {
      if (!DEFS[id] || state[id]) return;
      state[id] = true;
      save();
      toast(DEFS[id], { title: "achievement unlocked" });
    },
    bump(key) {
      state["_" + key] = (state["_" + key] || 0) + 1;
      save();
      if (key === "hacker" && state._hacker >= 10) this.unlock("hacker");
    },
    opened(id) {
      state._opened = state._opened || {};
      if (state._opened[id]) return;
      state._opened[id] = true;
      save();
      if (DESKTOP_ORDER.every((a) => state._opened[a])) this.unlock("explorer");
    },
    list() {
      const got = Object.keys(DEFS).filter((k) => state[k]);
      const lines = Object.entries(DEFS).map(([k, v]) =>
        state[k] ? `  <span class="t-g">[x]</span> ${v}` : `  <span class="t-mut">[ ] ?????</span>`);
      return `<span class="t-mut">achievements (${got.length}/${Object.keys(DEFS).length}):</span>\n` + lines.join("\n");
    },
  };
})();
window.Achievements = Achievements;

/* ---------- windows: open hooks + hash routing ---------- */
const HASHABLE = new Set(DESKTOP_ORDER.concat(["jinto", "yapstage", "aboutos"]));
wm.onOpen = (id, app) => {
  if (HASHABLE.has(id) && !app.nohash) history.replaceState(null, "", "#" + id);
  Achievements.opened(id);
  let visible = 0;
  for (const [, w] of wm.wins) if (!w.el.classList.contains("gone")) visible++;
  if (visible >= 5) Achievements.unlock("multitasker");
};

/* ---------- desktop icons (single click opens — recruiters don't dblclick) ---------- */
const iconsEl = document.getElementById("icons");
DESKTOP_ORDER.forEach((id, i) => {
  const app = APPS[id];
  const b = document.createElement("button");
  b.className = "icon";
  b.style.animationDelay = `${i * 40}ms`;
  b.innerHTML = `<span class="ic">${app.icon}</span><span class="label">${app.title}</span>`;
  b.addEventListener("click", () => {
    b.classList.add("sel");
    setTimeout(() => b.classList.remove("sel"), 350);
    wm.open(id);
  });
  iconsEl.appendChild(b);
});

/* ---------- sticky note drag ---------- */
(() => {
  const note = document.getElementById("sticky");
  note.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    note.setPointerCapture(e.pointerId);
    const r = note.getBoundingClientRect();
    const ox = e.clientX - r.left, oy = e.clientY - r.top;
    const move = (ev) => {
      if (ev.buttons === 0) return;
      note.style.left = Math.min(Math.max(ev.clientX - ox, 4), innerWidth - r.width - 4) + "px";
      note.style.top = Math.min(Math.max(ev.clientY - oy, 4), innerHeight - TASKBAR - r.height - 4) + "px";
      note.style.right = "auto";
    };
    const up = () => {
      note.removeEventListener("pointermove", move);
      note.removeEventListener("pointerup", up);
      note.removeEventListener("pointercancel", up);
    };
    note.addEventListener("pointermove", move);
    note.addEventListener("pointerup", up);
    note.addEventListener("pointercancel", up);
  });
})();

/* ---------- clock ---------- */
const clockEl = document.getElementById("clock");
function tick() {
  const d = new Date();
  clockEl.textContent =
    d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) +
    "  " +
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
tick();
setInterval(tick, 10000);

/* ---------- start menu + context menu (mutually exclusive) ---------- */
const sm = document.getElementById("startmenu");
const smList = document.getElementById("sm-list");
const smSearch = document.getElementById("sm-search");
const startBtn = document.getElementById("startbtn");
const ctx = document.getElementById("ctxmenu");
const SM_ORDER = ["about", "projects", "chat", "jinto", "yapstage", "skills", "experience", "education", "contact", "terminal", "trash", "aboutos"];

function buildStartList(filter = "") {
  smList.innerHTML = "";
  SM_ORDER.filter((id) => APPS[id].title.toLowerCase().includes(filter.toLowerCase())).forEach((id) => {
    const b = document.createElement("button");
    b.className = "sm-item";
    b.innerHTML = `${APPS[id].icon}<span>${APPS[id].title}</span>`;
    b.addEventListener("click", () => { toggleStart(false); wm.open(id); });
    smList.appendChild(b);
  });
}
function toggleStart(show = sm.hidden) {
  hideCtx();
  sm.hidden = !show;
  startBtn.classList.toggle("on", show);
  if (show) { buildStartList(); smSearch.value = ""; if (!wm.isMobile()) smSearch.focus(); }
}
function hideCtx() { ctx.hidden = true; }
function showCtx(x, y) {
  toggleStart(false);
  ctx.innerHTML = "";
  const items = [
    ["new terminal", () => wm.open("terminal")],
    ["change wallpaper", () => Wallpaper.cycle()],
    ["about mohdOS", () => wm.open("aboutos")],
  ];
  for (const [label, fn] of items) {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.textContent = label;
    b.addEventListener("click", () => { hideCtx(); fn(); });
    li.appendChild(b);
    ctx.appendChild(li);
  }
  ctx.hidden = false;
  const r = ctx.getBoundingClientRect();
  ctx.style.left = Math.min(x, innerWidth - r.width - 8) + "px";
  ctx.style.top = Math.min(y, innerHeight - r.height - 8) + "px";
}

startBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
startBtn.addEventListener("click", () => toggleStart());
smSearch.addEventListener("input", () => buildStartList(smSearch.value));
smSearch.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { const first = smList.querySelector(".sm-item"); if (first) first.click(); }
});
sm.addEventListener("pointerdown", (e) => e.stopPropagation());
ctx.addEventListener("pointerdown", (e) => e.stopPropagation());
document.addEventListener("pointerdown", () => { if (!sm.hidden) toggleStart(false); hideCtx(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!sm.hidden || !ctx.hidden) { toggleStart(false); hideCtx(); return; }
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    wm.closeFocused();
  }
});
document.getElementById("desktop").addEventListener("contextmenu", (e) => {
  if (e.target.closest(".icon") || e.target.closest("#sticky")) return;
  e.preventDefault();
  showCtx(e.clientX, e.clientY);
});

document.getElementById("wallbtn").addEventListener("click", () => Wallpaper.cycle());
document.getElementById("hirebtn").addEventListener("click", () => wm.open("contact"));
document.getElementById("sm-terminal").addEventListener("click", () => { toggleStart(false); wm.open("terminal"); });
document.getElementById("sm-shutdown").addEventListener("click", () => { toggleStart(false); shutdown(); });

/* ---------- konami ---------- */
(() => {
  const SEQ = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let at = 0;
  document.addEventListener("keydown", (e) => {
    at = e.key === SEQ[at] ? at + 1 : (e.key === SEQ[0] ? 1 : 0);
    if (at === SEQ.length) {
      at = 0;
      confetti();
      toast("cheat code accepted. salary expectations doubled.");
      Achievements.unlock("konami");
    }
  });
})();

function confetti() {
  if (reducedMotion.matches) return;
  const c = document.createElement("canvas");
  Object.assign(c.style, { position: "fixed", inset: 0, zIndex: 7000, pointerEvents: "none" });
  c.width = innerWidth; c.height = innerHeight;
  document.body.appendChild(c);
  const g = c.getContext("2d");
  const colors = ["#e8a03d", "#9db27a", "#cf5f52", "#4a5d80", "#ece5da"];
  const bits = Array.from({ length: 90 }, () => ({
    x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5,
    v: 2 + Math.random() * 3.5, w: 5 + Math.random() * 5,
    r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.2,
    col: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  (function fall(t) {
    g.clearRect(0, 0, c.width, c.height);
    for (const b of bits) {
      b.y += b.v; b.r += b.vr; b.x += Math.sin(b.y / 30);
      g.save(); g.translate(b.x, b.y); g.rotate(b.r);
      g.fillStyle = b.col; g.fillRect(-b.w / 2, -b.w / 4, b.w, b.w / 2);
      g.restore();
    }
    if (t - t0 < 4500) requestAnimationFrame(fall); else c.remove();
  })(t0);
}

/* ---------- tab-title mischief ---------- */
(() => {
  const REAL = document.title;
  const AWAY = ["mohdOS — paused", "come back :(", "downloading offer_letter.pdf (1%)"];
  let timer = null, i = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      i = 0;
      timer = setInterval(() => { document.title = AWAY[i % AWAY.length]; i++; }, 6000);
      document.title = AWAY[0];
    } else {
      clearInterval(timer);
      document.title = REAL;
    }
  });
})();

/* ---------- screensaver (DVD logo) ---------- */
(() => {
  let idleTimer = null, saver = null, raf = null;
  const IDLE_MS = 60000;

  function start() {
    if (saver || reducedMotion.matches || document.hidden) return;
    saver = document.createElement("div");
    saver.id = "saver";
    saver.innerHTML = `<span class="dvd">mohdOS</span><span class="hits"></span>`;
    document.body.appendChild(saver);
    const dvd = saver.querySelector(".dvd");
    const hitsEl = saver.querySelector(".hits");
    const colors = ["#e8a03d", "#9db27a", "#cf5f52", "#4a5d80", "#ece5da"];
    let x = 80, y = 80, vx = 2.2, vy = 1.7, ci = 0, corners = 0;
    dvd.style.color = colors[0];
    (function step() {
      const bw = dvd.offsetWidth, bh = dvd.offsetHeight;
      x += vx; y += vy;
      let hitX = false, hitY = false;
      if (x <= 0 || x + bw >= innerWidth) { vx *= -1; hitX = true; x = Math.max(0, Math.min(x, innerWidth - bw)); }
      if (y <= 0 || y + bh >= innerHeight) { vy *= -1; hitY = true; y = Math.max(0, Math.min(y, innerHeight - bh)); }
      if (hitX || hitY) dvd.style.color = colors[++ci % colors.length];
      if (hitX && hitY) { corners++; hitsEl.textContent = `corner hits: ${corners} (you saw it)`; }
      dvd.style.transform = `translate(${x}px, ${y}px)`;
      raf = requestAnimationFrame(step);
    })();
  }
  function stop() {
    if (!saver) return;
    cancelAnimationFrame(raf);
    saver.remove();
    saver = null;
  }
  function poke() {
    stop();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(start, IDLE_MS);
  }
  ["pointermove", "pointerdown", "keydown", "wheel"].forEach((ev) => addEventListener(ev, poke, { passive: true }));
  poke();
})();

/* ---------- BSOD ---------- */
window.BSOD = function BSOD() {
  if (document.getElementById("bsod")) return;
  const el = document.createElement("div");
  el.id = "bsod";
  el.innerHTML = `
    <div class="inner">
      <div class="face">:(</div>
      <p>mohdOS ran into a problem it pretends it can fix. it's just collecting some excuses, and then it will restart for you.</p>
      <p><span class="pct">0</span>% complete</p>
      <p class="code">stop code: HIRE_ME_0x2026<br>what failed: nothing, you typed that on purpose</p>
    </div>`;
  document.body.appendChild(el);
  Achievements.unlock("bsod");
  const pct = el.querySelector(".pct");
  let p = 0;
  const iv = setInterval(() => {
    p = Math.min(99, p + Math.ceil(Math.random() * 12));
    pct.textContent = p;
    if (p >= 99) clearInterval(iv);
  }, 350);
  setTimeout(() => {
    const reboot = () => {
      sessionStorage.removeItem("booted");
      sessionStorage.setItem("rebooted", "1");
      location.reload();
    };
    el.addEventListener("pointerdown", reboot, { once: true });
    document.addEventListener("keydown", reboot, { once: true });
  }, 900);
};

/* ---------- shutdown ---------- */
function shutdown() {
  [...wm.wins.keys()].forEach((id, i) => setTimeout(() => wm.close(id), i * 120));
  const el = document.createElement("div");
  Object.assign(el.style, {
    position: "fixed", inset: 0, zIndex: 9000, background: "#0a0806", opacity: 0,
    transition: "opacity 0.7s ease", display: "flex", alignItems: "center", justifyContent: "center",
  });
  el.innerHTML = `<pre style="font-family:var(--mono);font-size:13px;color:var(--muted);line-height:2"></pre>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = 1; });
  const pre = el.querySelector("pre");
  const LINES = [
    "stopping 3 side projects…",
    "saving unsaved ambition…",
    "parking the window manager…",
    "",
    "it is now safe to close this tab.",
    "(or press any key to boot back up)",
  ];
  LINES.forEach((l, i) => setTimeout(() => { pre.textContent += l + "\n"; }, 600 + i * 450));
  setTimeout(() => {
    const reboot = () => { sessionStorage.removeItem("booted"); location.reload(); };
    el.addEventListener("pointerdown", reboot, { once: true });
    document.addEventListener("keydown", reboot, { once: true });
  }, 1200);
}

/* ---------- boot ---------- */
(() => {
  const boot = document.getElementById("boot");
  const h = new Date().getHours();
  const greet = h < 5 ? "you're up late. same." : h < 12 ? "good morning." : h < 18 ? "good afternoon." : "good evening.";
  if (h >= 0 && h < 5) Achievements.unlock("nightowl");

  const LINES = [
    "[ <span class='ok'>ok</span> ] mounting /dev/coffee",
    "[ <span class='ok'>ok</span> ] starting window manager (259 lines, hand-typed)",
    "[ <span class='ok'>ok</span> ] loading projects… 2 found, 1 compiling",
    "[ <span class='ok'>ok</span> ] waking up mo.bot",
    sessionStorage.getItem("rebooted")
      ? "[ <span class='warn'>!!</span> ] restoring from backup… found 1 lesson learned"
      : "[ <span class='ok'>ok</span> ] no lessons learned since last boot",
    `[ <span class='ok'>ok</span> ] ${greet}`,
  ];
  sessionStorage.removeItem("rebooted");

  function afterBoot(openReadme) {
    if (openReadme) {
      const target = location.hash.slice(1);
      if (target && HASHABLE.has(target) && APPS[target]) {
        setTimeout(() => wm.open(target), 500);
      } else {
        setTimeout(() => wm.open("about"), 550);
        setTimeout(() => {
          if (!localStorage.getItem("hinted")) {
            localStorage.setItem("hinted", "1");
            toast("this is a real little OS. click any icon, drag any window, or ask mo.bot about me.", { title: "welcome", timeout: 8000 });
          }
        }, 2600);
      }
      // mo.bot nudge, once ever, only if chat stays unopened
      setTimeout(() => {
        if (!wm.wins.has("chat") && !localStorage.getItem("nudged")) {
          localStorage.setItem("nudged", "1");
          toast("mo.bot is online and knows everything about mohammad. the chat icon, when you're ready.", { timeout: 7000 });
        }
      }, 30000);
    }
  }

  function endBoot(openReadme) {
    if (!boot.parentNode) return;
    sessionStorage.setItem("booted", "1");
    boot.classList.add("fade");
    setTimeout(() => boot.remove(), 450);
    afterBoot(openReadme);
  }

  if (sessionStorage.getItem("booted")) {
    boot.remove();
    const target = location.hash.slice(1);
    if (target && HASHABLE.has(target) && APPS[target]) wm.open(target);
  } else {
    const log = document.getElementById("bootlog");
    LINES.forEach((line, i) => {
      setTimeout(() => { if (boot.parentNode) log.innerHTML += line + "\n"; }, 140 + i * 160);
    });
    const auto = setTimeout(() => endBoot(true), 1900);
    boot.addEventListener("pointerdown", () => {
      clearTimeout(auto);
      sessionStorage.setItem("booted", "1");
      boot.remove(); // instant on skip — no half-faded overlay eating clicks
      afterBoot(true);
    }, { once: true });
  }
})();
