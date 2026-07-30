/* Terminal app. Registers itself into APPS. Lookups are own-property guarded
   (typing "__proto__" should not throw), history preserves your draft, and
   there is more in here than `help` admits. */
(() => {
  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const own = (obj, key) => Object.hasOwn(obj, key) ? obj[key] : undefined;

  const NEOFETCH = `<span class="t-a">  ███╗   ███╗
  ████╗ ████║
  ██╔████╔██║
  ██║╚██╔╝██║
  ██║ ╚═╝ ██║
  ╚═╝     ╚═╝</span>
  <span class="t-g">mohammad</span>@<span class="t-g">mohdos</span>
  ─────────────────
  <span class="t-a">os</span>        mohdOS 2.0 (vanilla js)
  <span class="t-a">host</span>      portfolio, hand-built
  <span class="t-a">kernel</span>    caffeine 6.2.0
  <span class="t-a">uptime</span>    2nd year, cs co-op
  <span class="t-a">shell</span>     co-op seeker
  <span class="t-a">wm</span>        mohdwm (259 lines, snaps)
  <span class="t-a">packages</span>  2 shipped, 1 compiling
  <span class="t-a">memory</span>    mostly valorant clips`;

  const FILES = {
    "readme.md": "hey, i'm mohammad. second-year cs co-op student.\nthis whole site is a tiny OS i wrote from scratch.\ntype 'projects' or 'open contact' to look around.",
    "skills.txt": "python · typescript · react · node · webrtc · llm apis · git",
    "todo.txt": "[x] build window manager\n[x] rebuild it properly\n[x] teach the terminal snake\n[ ] get hired by whoever is reading this",
  };

  const SRC_FILES = {
    "wm.js": "js/wm.js", "apps.js": "js/apps.js", "terminal.js": "js/terminal.js",
    "chat.js": "js/chat.js", "main.js": "js/main.js", "wallpaper.js": "js/wallpaper.js",
    "style.css": "css/style.css", "index.html": "index.html",
  };

  const openable = ["about", "projects", "jinto", "yapstage", "skills", "education", "experience", "contact", "chat", "trash", "terminal", "aboutos"];

  const COMMANDS = {
    help: () => `<span class="t-mut">commands:</span>
  <span class="t-a">whoami</span>      who is this guy
  <span class="t-a">projects</span>    what he's built
  <span class="t-a">open</span> <span class="t-mut">&lt;app&gt;</span>  open a window (projects, chat, contact…)
  <span class="t-a">resume</span>      the thing recruiters want
  <span class="t-a">neofetch</span>    system info
  <span class="t-a">src</span> <span class="t-mut">&lt;file&gt;</span>  read this OS's actual source
  <span class="t-a">ls</span> / <span class="t-a">cat</span>    look at files
  <span class="t-a">sudo hire-me</span>
  <span class="t-a">clear</span> · <span class="t-a">echo</span> · <span class="t-a">date</span> · <span class="t-a">history</span> · <span class="t-a">exit</span>
<span class="t-mut">(this list is not exhaustive. poke around.)</span>`,
    whoami: () => `mohammad arab · 2nd-year cs co-op student · ships things, then rebuilds them better`,
    about: () => COMMANDS.whoami(),
    projects: () => `<span class="t-a">jinto.gg</span>   ai valorant coach, live overlay <span class="t-a">[in dev, riot approval pending]</span>
<span class="t-a">yapstage</span>   1v1 video debates judged by ai <span class="t-g">[mvp built]</span>
<span class="t-mut">try:</span> open jinto · open yapstage`,
    neofetch: () => NEOFETCH,
    ls: () => `<span class="t-a">readme.md</span>  <span class="t-a">skills.txt</span>  <span class="t-a">todo.txt</span>  <span class="t-mut">src/</span>`,
    date: () => new Date().toString(),
    history: (a, t) => t.history.map((h, i) => `  ${String(i + 1).padStart(3)}  ${esc(h)}`).join("\n") || " ",
    skills: () => FILES["skills.txt"] + `\n<span class="t-mut">try:</span> open skills`,
    resume: () => `no pdf hosted here yet. email <span class="t-a">mohd.e.arab@gmail.com</span> and he'll send the current one, usually same day.`,
    github: () => { window.open("https://github.com/moha-arab", "_blank", "noopener"); return `<span class="t-mut">opening</span> <span class="t-a">github.com/moha-arab</span>`; },
    linkedin: () => `not linked here yet. email him for it: <span class="t-a">mohd.e.arab@gmail.com</span>`,
    contact: () => `email: <span class="t-a">mohd.e.arab@gmail.com</span> · github: <span class="t-a">moha-arab</span>\n<span class="t-mut">try:</span> open contact · sudo hire-me`,
    education: () => `queen's university · b.comp (hons.) computer science · gpa 4.04/4.30 · class of 2028\n<span class="t-mut">try:</span> open education`,
    experience: () => `<span class="t-mut">try:</span> open experience`,
    achievements: () => (window.Achievements ? window.Achievements.list() : `<span class="t-mut">nothing tracked yet</span>`),
    matrix: () => {
      const on = !Wallpaper.isMatrix();
      Wallpaper.matrix(on);
      return on ? `<span class="t-g">wake up, recruiter…</span> <span class="t-mut">(type 'matrix' again to snap out of it)</span>` : `<span class="t-mut">back to reality.</span>`;
    },
  };

  function suggest(cmd) {
    const pool = Object.keys(COMMANDS).concat(["clear", "exit", "echo", "cat", "open", "sudo", "src", "snake"]);
    const hit = pool.find((c) => c.startsWith(cmd.slice(0, 3))) || pool.find((c) => c.includes(cmd));
    return hit ? ` <span class="t-mut">· did you mean '${hit}'?</span>` : ` <span class="t-mut">· try 'help'</span>`;
  }

  async function viewSource(name, t) {
    const path = own(SRC_FILES, name);
    if (!path) {
      return `<span class="t-err">src: unknown file '${esc(name)}'</span> <span class="t-mut">(${Object.keys(SRC_FILES).join(", ")})</span>`;
    }
    try {
      const res = await fetch(path);
      const text = await res.text();
      if (wm.wins.has("source")) wm.close("source");
      APPS.source = {
        title: "src: " + name, icon: ICONS.terminal, w: 660, h: 520, bare: true, nohash: true,
        content: () => `<div class="src">${esc(text)}</div>`,
      };
      setTimeout(() => wm.open("source"), 60);
      return `<span class="t-mut">${path} · ${text.split("\n").length} lines · every one hand-typed</span>`;
    } catch {
      return `<span class="t-err">src: couldn't fetch ${esc(path)}</span>`;
    }
  }

  /* ---- snake ---- */
  function startSnake(t, inp) {
    const W = 24, H = 13;
    let snake = [{ x: 5, y: 6 }, { x: 4, y: 6 }, { x: 3, y: 6 }];
    let dir = { x: 1, y: 0 }, nextDir = dir, food = null, score = 0, dead = false;
    const board = document.createElement("div");
    t.out.appendChild(board);
    const hs = () => parseInt(localStorage.getItem("snake-hs") || "0", 10);

    const place = () => {
      do { food = { x: Math.floor(Math.random() * W), y: Math.floor(Math.random() * H) }; }
      while (snake.some((s) => s.x === food.x && s.y === food.y));
    };
    place();

    const render = () => {
      const grid = Array.from({ length: H }, () => Array(W).fill(" "));
      grid[food.y][food.x] = "$";
      snake.forEach((s, i) => { grid[s.y][s.x] = i === 0 ? "@" : "o"; });
      const top = "┌" + "─".repeat(W) + "┐";
      const bot = "└" + "─".repeat(W) + "┘";
      board.innerHTML = `<span class="t-mut">${top}\n${grid.map((r) => "│" + r.join("") + "│").join("\n")}\n${bot}</span>\n score ${score} · best ${Math.max(hs(), score)} · wasd/arrows · q quits`;
      t.out.scrollTop = t.out.scrollHeight;
    };

    const DEATHS = ["skill issue.", "ctrl+z won't help.", "the snake was the friends we made along the way."];
    const stop = (msg) => {
      dead = true;
      clearInterval(timer);
      inp.removeEventListener("keydown", onKey, true);
      if (score > hs()) localStorage.setItem("snake-hs", String(score));
      board.innerHTML += `\n<span class="t-err">${msg}</span> <span class="t-mut">final score ${score}</span>\n`;
      t.out.scrollTop = t.out.scrollHeight;
      t.game = null;
    };

    const onKey = (e) => {
      const k = e.key.toLowerCase();
      const map = { arrowup: [0, -1], w: [0, -1], arrowdown: [0, 1], s: [0, 1], arrowleft: [-1, 0], a: [-1, 0], arrowright: [1, 0], d: [1, 0] };
      if (own(map, k)) {
        e.preventDefault(); e.stopPropagation();
        const [x, y] = map[k];
        if (x !== -dir.x || y !== -dir.y) nextDir = { x, y };
      } else if (k === "q" || k === "escape") {
        e.preventDefault(); e.stopPropagation();
        stop("rage quit.");
      }
    };
    inp.addEventListener("keydown", onKey, true);

    const timer = setInterval(() => {
      if (!board.isConnected) { clearInterval(timer); inp.removeEventListener("keydown", onKey, true); t.game = null; return; }
      dir = nextDir;
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.x >= W || head.y < 0 || head.y >= H || snake.some((s) => s.x === head.x && s.y === head.y)) {
        return stop(DEATHS[Math.floor(Math.random() * DEATHS.length)]);
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) { score++; place(); } else snake.pop();
      render();
    }, 140);

    t.game = { stop };
    render();
  }

  /* ---- command dispatch ---- */
  async function run(raw, t, ui) {
    const input = raw.trim();
    if (!input) return "";
    const [cmd, ...rest] = input.split(/\s+/);
    const arg = rest.join(" ").toLowerCase();
    const key = cmd.toLowerCase();

    switch (key) {
      case "clear": t.out.innerHTML = ""; return null;
      case "exit": wm.close("terminal"); return null;
      case "echo": return esc(rest.join(" "));
      case "snake": startSnake(t, ui.inp); return null;
      case "src": return viewSource(arg, t);
      case "cat": {
        const f = own(FILES, arg);
        return f ? esc(f) : `<span class="t-err">cat: ${esc(arg || "?")}: no such file</span>`;
      }
      case "open": {
        if (openable.includes(arg)) {
          if (arg === "terminal") return `<span class="t-mut">you're already here.</span>`;
          wm.open(arg);
          return `<span class="t-mut">opening ${arg}…</span>`;
        }
        return `<span class="t-err">open: unknown app '${esc(arg)}'</span> <span class="t-mut">(${openable.join(", ")})</span>`;
      }
      case "sudo": {
        if (arg === "hire-me") {
          const lines = [
            "[sudo] checking qualifications…",
            "  <span class='t-g'>[ok]</span> ships things",
            "  <span class='t-g'>[ok]</span> asks good questions",
            "  <span class='t-g'>[ok]</span> reads the error message before asking",
            "<span class='t-a'>access granted.</span> opening mail client…",
          ];
          lines.forEach((l, i) => setTimeout(() => { t.out.innerHTML += l + "\n"; t.out.scrollTop = t.out.scrollHeight; }, 250 * (i + 1)));
          setTimeout(() => {
            window.open("mailto:mohd.e.arab@gmail.com?subject=" + encodeURIComponent("re: co-op term"), "_self");
            wm.open("contact");
          }, 250 * (lines.length + 1));
          return null;
        }
        if (/^rm\s+-rf\s+\/?$/.test(arg)) {
          if (window.BSOD) { setTimeout(window.BSOD, 400); return `<span class="t-err">deleting /…</span>`; }
          return `<span class="t-err">nice try.</span>`;
        }
        return `<span class="t-err">mohammad is not in the sudoers file. this incident will be reported.</span>`;
      }
      default: {
        const fn = own(COMMANDS, key);
        if (typeof fn === "function") return fn(arg, t);
        return `<span class="t-err">command not found: ${esc(cmd)}</span>${suggest(key)}`;
      }
    }
  }

  APPS.terminal = {
    title: "terminal", icon: ICONS.terminal, w: 620, h: 440, desktop: true, bare: true,
    content: () => `
      <div class="term">
        <div class="t-out">mohdOS 2.0 (tty1)
type <span class="t-a">help</span> to get started.
</div>
        <div class="t-line"><span class="t-ps1">mohammad@mohdos</span><span class="t-path">:~$</span><input class="t-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="try: help" aria-label="terminal input"></div>
      </div>`,
    onMount(el) {
      const term = el.querySelector(".term");
      const out = el.querySelector(".t-out");
      const inp = el.querySelector(".t-in");
      const t = { out, history: [], game: null };
      let hIdx = 0;
      let draft = "";

      term.addEventListener("mousedown", () => setTimeout(() => inp.focus(), 0));
      inp.addEventListener("keydown", async (e) => {
        if (t.game) return; // snake owns the keyboard
        if (e.key === "Enter") {
          const raw = inp.value;
          inp.value = "";
          inp.placeholder = "";
          out.innerHTML += `<span class="t-ps1">mohammad@mohdos</span><span class="t-path">:~$</span> ${esc(raw)}\n`;
          if (raw.trim()) {
            t.history.push(raw);
            if (window.Achievements) window.Achievements.bump("hacker");
          }
          hIdx = t.history.length;
          draft = "";
          const res = await run(raw, t, { inp });
          if (res !== null && res !== "") out.innerHTML += res + "\n";
          out.scrollTop = out.scrollHeight;
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          if (hIdx === 0 || t.history.length === 0) return;
          if (hIdx === t.history.length) draft = inp.value;
          hIdx--;
          inp.value = t.history[hIdx];
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (hIdx >= t.history.length) return; // not navigating: leave the draft alone
          hIdx++;
          inp.value = hIdx === t.history.length ? draft : t.history[hIdx];
        } else if (e.key === "Tab") {
          e.preventDefault();
          const cur = inp.value.trim().toLowerCase();
          if (!cur) return;
          const pool = Object.keys(COMMANDS).concat(["clear", "exit", "echo", "cat", "open", "sudo", "src", "snake"]);
          const hit = pool.find((c) => c.startsWith(cur));
          if (hit) inp.value = hit + " ";
        }
      });
      setTimeout(() => { if (!wm.isMobile()) inp.focus(); }, 80);
    },
    onFocus(el) {
      if (wm.isMobile()) return;
      const inp = el.querySelector(".t-in");
      if (inp) setTimeout(() => inp.focus(), 0);
    },
  };
})();
