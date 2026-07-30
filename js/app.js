/* Renders everything from js/data.js. Tabs, keyboard nav, hash deep links,
   per-project page themes, and the contour-map background. */
(() => {
  const TABS = [
    { id: "hello", label: "hello" },
    { id: "experience", label: "experience" },
    { id: "projects", label: "projects" },
    { id: "skills", label: "skills" },
  ];
  const view = document.getElementById("view");
  const tabsEl = document.getElementById("tabs");
  let currentTab = "hello";
  let currentProject = PROJECTS[0].id;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- motifs (drawn per project theme) ---------- */
  const MOTIFS = {
    crosshair: `<svg class="motif" width="340" height="340" viewBox="0 0 340 340" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--accent)">
      <circle cx="170" cy="170" r="150"/><circle cx="170" cy="170" r="100"/><circle cx="170" cy="170" r="50"/>
      <path d="M170 0v90M170 250v90M0 170h90M250 170h340"/></svg>`,
    stage: `<svg class="motif" width="360" height="340" viewBox="0 0 360 340" fill="currentColor" style="color:var(--accent)">
      <polygon points="60,0 10,340 190,340" opacity="0.5"/>
      <polygon points="300,0 170,340 350,340" opacity="0.5"/></svg>`,
  };

  /* ---------- panes ---------- */
  function heroPane() {
    const p = PROFILE, e = p.education;
    const linkedinRow = p.linkedin
      ? `<dt>linkedin</dt><dd><a href="${esc(p.linkedin)}" target="_blank" rel="noopener">${esc(p.linkedin.replace(/^https?:\/\/(www\.)?/, ""))}</a></dd>`
      : "";
    return `
      <div class="hero">
        <div class="hero-text">
          <h1>${esc(p.name)}<span class="dot">.</span></h1>
          <p class="tagline">${esc(p.tagline)}</p>
          <p class="locline">${esc(p.location)}</p>
          <dl class="spec">
            <dt>email</dt><dd><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></dd>
            <dt>github</dt><dd><a href="${esc(p.github)}" target="_blank" rel="noopener">${esc(p.github.replace(/^https?:\/\//, ""))}</a></dd>
            ${linkedinRow}
            <dt>school</dt><dd>${esc(e.school)} <span class="sub">· ${esc(e.campus)}</span></dd>
            <dt>degree</dt><dd>${esc(e.degree)}</dd>
            <dt>gpa</dt><dd>${esc(e.gpa)}</dd>
            <dt>graduation</dt><dd>${esc(e.grad)}</dd>
          </dl>
          <div class="cta-row">
            <a class="btn" href="mailto:${esc(p.email)}">email me</a>
            <button class="btn ghost" onclick="Chat.open()">ask mo.bot</button>
          </div>
        </div>
        <div class="photo-wrap"><img class="photo" src="${esc(p.photo)}" alt="${esc(p.name)}"></div>
      </div>`;
  }

  function experiencePane() {
    return `
      <h2>experience</h2>
      <div class="xp">
        ${EXPERIENCE.map((x) => `
          <div class="xp-item">
            <h3>${esc(x.role)} <em>@ ${esc(x.org)}</em></h3>
            <div class="xp-meta">${esc(x.when)} · ${esc(x.where)}</div>
            <ul>${x.points.map((pt) => `<li>${esc(pt)}</li>`).join("")}</ul>
          </div>`).join("")}
      </div>`;
  }

  function projectsPane() {
    const proj = PROJECTS.find((p) => p.id === currentProject) || PROJECTS[0];
    return `
      <h2>projects</h2>
      <div class="proj-switch" role="tablist">
        ${PROJECTS.map((p) => `<button class="proj-tab${p.id === proj.id ? " on" : ""}" data-project="${p.id}">${esc(p.name)}</button>`).join("")}
      </div>
      <article class="proj">
        ${MOTIFS[proj.theme.motif] || ""}
        <div class="proj-head"><h3>${esc(proj.name)}</h3><span class="pill">${esc(proj.status)}</span></div>
        <p class="lede">${esc(proj.tagline)}</p>
        <p class="desc">${esc(proj.desc)}</p>
        <div class="chips">${proj.stack.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>
        <div class="foot-note">${esc(proj.footnote)}</div>
      </article>`;
  }

  function skillsPane() {
    return `
      <h2>skills</h2>
      ${Object.entries(SKILLS).map(([group, items]) => `
        <h2>${esc(group)}</h2>
        <div class="chips">${items.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>`).join("")}
      <p class="skills-note">Proof lives in the projects and experience tabs, not in this list.</p>`;
  }

  const PANES = { hello: heroPane, experience: experiencePane, projects: projectsPane, skills: skillsPane };

  /* ---------- tab machinery ---------- */
  function applyTheme() {
    document.body.dataset.theme = currentTab === "projects" ? currentProject : "";
  }

  function showTab(id, projectId) {
    if (!PANES[id]) return;
    currentTab = id;
    if (projectId && PROJECTS.some((p) => p.id === projectId)) currentProject = projectId;
    view.innerHTML = `<div class="pane">${PANES[id]()}</div>`;
    for (const b of tabsEl.children) b.classList.toggle("on", b.dataset.tab === id);
    applyTheme();
    history.replaceState(null, "", "#" + (id === "projects" ? currentProject : id));
    if (id === "projects") {
      view.querySelectorAll(".proj-tab").forEach((b) =>
        b.addEventListener("click", () => showTab("projects", b.dataset.project)));
    }
  }
  window.showTab = showTab;

  TABS.forEach((t, i) => {
    const b = document.createElement("button");
    b.className = "tab";
    b.dataset.tab = t.id;
    b.innerHTML = `<span class="n">0${i + 1}</span>${t.label}`;
    b.addEventListener("click", () => showTab(t.id));
    tabsEl.appendChild(b);
  });

  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    const i = TABS.findIndex((x) => x.id === currentTab);
    if (e.key >= "1" && e.key <= String(TABS.length)) showTab(TABS[+e.key - 1].id);
    else if (e.key === "ArrowRight") showTab(TABS[(i + 1) % TABS.length].id);
    else if (e.key === "ArrowLeft") showTab(TABS[(i - 1 + TABS.length) % TABS.length].id);
  });

  /* ---------- contour-map background (static) ---------- */
  const canvas = document.getElementById("bg");
  const ctx = canvas.getContext("2d");
  function mulberry(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function drawBg() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = innerWidth, h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const rnd = mulberry(7);
    const peaks = Array.from({ length: 4 }, () => ({
      x: rnd() * w, y: rnd() * h,
      waves: Array.from({ length: 3 }, () => ({ f: 2 + Math.floor(rnd() * 4), a: 6 + rnd() * 18, p: rnd() * 6.28 })),
    }));
    ctx.lineWidth = 1;
    for (const pk of peaks) {
      for (let i = 1; i <= 14; i++) {
        const r = i * (Math.min(w, h) / 16);
        ctx.strokeStyle = `rgba(201, 192, 176, ${Math.max(0.05 - i * 0.002, 0.008)})`;
        ctx.beginPath();
        for (let a = 0; a <= 6.3; a += 0.06) {
          let rr = r;
          for (const wv of pk.waves) rr += Math.sin(a * wv.f + wv.p + i * 0.35) * wv.a;
          const x = pk.x + Math.cos(a) * rr, y = pk.y + Math.sin(a) * rr;
          if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  }
  addEventListener("resize", drawBg);
  drawBg();

  /* ---------- boot from hash ---------- */
  const target = location.hash.slice(1);
  if (PROJECTS.some((p) => p.id === target)) showTab("projects", target);
  else if (PANES[target]) showTab(target);
  else showTab("hello");
})();
