/* Renders everything from js/data.js. Tabs, keyboard nav, hash deep links,
   per-project page themes, org-branded experience cards, drifting contour
   background, and staggered reveals. */
(() => {
  const TABS = [
    { id: "hello", label: "hello" },
    { id: "experience", label: "experience" },
    { id: "projects", label: "projects" },
    { id: "skills", label: "skills" },
  ];
  const view = document.getElementById("view");
  const tabsEl = document.getElementById("tabs");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let currentTab = "hello";
  let currentProject = PROJECTS[0].id;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- org icons (drawn, not hotlinked) ---------- */
  const ORG_ICONS = {
    water: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3.5c3 3.8 6 6.8 6 10a6 6 0 0 1-12 0c0-3.2 3-6.2 6-10z"/>
      <path d="M8.5 14.5c0 1.9 1.6 3.5 3.5 3.5"/></svg>`,
    chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 20V4"/><path d="M4 20h16"/><path d="m7 14 4-4 3 3 5-6"/><path d="M19 7h-4M19 7v4"/></svg>`,
    gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3.2"/>
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"/></svg>`,
  };

  /* ---------- panes ---------- */
  function heroPane() {
    const p = PROFILE, e = p.education;
    const linkedin = p.linkedin
      ? `<a href="${esc(p.linkedin)}" target="_blank" rel="noopener">${esc(p.linkedin.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""))}</a>`
      : `<span class="soon">soon</span>`;
    const resumeBtn = p.resume
      ? `<a class="btn ghost" href="${esc(p.resume)}" download>resume (pdf)</a>`
      : `<a class="btn ghost" href="mailto:${esc(p.email)}?subject=${encodeURIComponent("resume, please")}" title="pdf coming soon — email gets you the current one">resume · email me</a>`;
    const stats = (p.stats || []).map(([n, l]) => `<div class="stat"><b>${esc(n)}</b><span>${esc(l)}</span></div>`).join("");
    const seq = (p.ticker || []).join("&nbsp;&nbsp;·&nbsp;&nbsp;");
    return `
      <div class="hero">
        <div class="hero-text">
          <h1><span id="typed"></span><span class="dot caret">.</span></h1>
          <p class="tagline">${esc(p.tagline)}</p>
          <p class="nowline"><span class="live"></span>${esc(p.now)}</p>
          <div class="stats">${stats}</div>
          <dl class="spec">
            <dt>email</dt><dd><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></dd>
            <dt>github</dt><dd><a href="${esc(p.github)}" target="_blank" rel="noopener">${esc(p.github.replace(/^https?:\/\//, ""))}</a></dd>
            <dt>linkedin</dt><dd>${linkedin}</dd>
            <dt>school</dt><dd>${esc(e.school)} <span class="sub">· ${esc(e.campus)}</span></dd>
            <dt>degree</dt><dd>${esc(e.degree)}</dd>
            <dt>gpa</dt><dd>${esc(e.gpa)}</dd>
            <dt>graduation</dt><dd>${esc(e.grad)}</dd>
          </dl>
          <p class="locline">${esc(p.location)}</p>
          <div class="cta-row">
            <a class="btn" href="mailto:${esc(p.email)}">email me</a>
            ${resumeBtn}
            <button class="btn ghost" onclick="Chat.open()">ask mo.bot</button>
          </div>
        </div>
        <div class="photo-wrap"><img class="photo" src="${esc(p.photo)}" alt="${esc(p.name)}"></div>
      </div>
      <div class="ticker" aria-hidden="true"><div class="ticker-track">${(seq + "&nbsp;&nbsp;·&nbsp;&nbsp;").repeat(3)}</div></div>`;
  }

  function experiencePane() {
    return `<h2>experience</h2>` + EXPERIENCE.map((x) => `
      <div class="xcard" style="--xc:${x.brand.color}">
        <div class="xicon">${ORG_ICONS[x.brand.icon] || ""}</div>
        <div class="xbody">
          <h3>${esc(x.role)} <em>@ ${esc(x.org)}</em></h3>
          <div class="xp-meta">${esc(x.when)} · ${esc(x.where)}</div>
          <ul>${x.points.map((pt) => `<li>${esc(pt)}</li>`).join("")}</ul>
        </div>
      </div>`).join("");
  }

  function projectsPane() {
    const proj = PROJECTS.find((p) => p.id === currentProject) || PROJECTS[0];
    const t = proj.theme;
    const MOTIF_ART = {
      crosshair: `<i class="slash s1"></i><i class="slash s2"></i>
         <svg class="rings" viewBox="0 0 300 300" fill="none" stroke="currentColor" stroke-width="1.4">
           <circle cx="150" cy="150" r="130"/><circle cx="150" cy="150" r="85"/><circle cx="150" cy="150" r="40"/>
           <path d="M150 0v70M150 230v70M0 150h70M230 150h70"/></svg>`,
      stage: `<i class="beam b1"></i><i class="beam b2"></i>
         <svg class="bubbles" viewBox="0 0 200 120" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M10 20c0-6 5-10 10-10h50c6 0 10 4 10 10v30c0 6-4 10-10 10H40l-16 14v-14h-4c-6 0-10-4-10-10V20z"/>
           <path d="M120 40c0-6 5-10 10-10h50c6 0 10 4 10 10v30c0 6-4 10-10 10h-4v14l-16-14h-30c-6 0-10-4-10-10V40z"/></svg>`,
      wave: `<svg class="wavebars" viewBox="0 0 240 120" stroke="currentColor" stroke-width="7" stroke-linecap="round">
           ${[22, 46, 72, 96, 58, 82, 36, 66, 92, 48, 74, 30, 56, 40].map((h, i) => `<line x1="${12 + i * 16}" y1="${60 - h / 2}" x2="${12 + i * 16}" y2="${60 + h / 2}"/>`).join("")}</svg>`,
    };
    const art = MOTIF_ART[t.motif] || "";
    const name = proj.link
      ? `<a class="proj-name" href="${esc(proj.link)}" target="_blank" rel="noopener">${esc(proj.name)}<span class="ext">↗</span></a>`
      : `<span class="proj-name">${esc(proj.name)}</span>`;
    const actions = [
      proj.link ? `<a class="btn" href="${esc(proj.link)}" target="_blank" rel="noopener">visit ${esc(proj.name)} ↗</a>` : "",
      proj.repo ? `<a class="btn ghost" href="${esc(proj.repo)}" target="_blank" rel="noopener">view code ↗</a>` : "",
      !proj.link && !proj.repo ? `<a class="btn ghost" href="mailto:${esc(PROFILE.email)}?subject=${encodeURIComponent("show me " + proj.name)}">ask for a demo</a>` : "",
    ].join("");
    const idx = PROJECTS.indexOf(proj);
    return `
      <h2>projects</h2>
      <div class="proj-switch" role="tablist">
        ${PROJECTS.map((p) => `<button class="proj-tab${p.id === proj.id ? " on" : ""}" data-project="${p.id}">${esc(p.name)}</button>`).join("")}
        <div class="proj-nav">
          <button class="pnav" data-dir="-1" aria-label="previous project">←</button>
          <span class="pcount">0${idx + 1} / 0${PROJECTS.length}</span>
          <button class="pnav" data-dir="1" aria-label="next project">→</button>
        </div>
      </div>
      <article class="proj proj--${esc(proj.id)}">
        <div class="art" aria-hidden="true">${art}<span class="gword">${esc(t.ghost)}</span></div>
        <div class="proj-inner">
          <div class="proj-head">${name}<span class="pill">${esc(proj.status)}</span></div>
          <p class="lede">${esc(proj.tagline)}</p>
          <p class="desc">${esc(proj.desc)}</p>
          <div class="chips">${proj.stack.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>
          <div class="proj-actions">${actions}</div>
          <div class="foot-note">${esc(proj.footnote)}</div>
        </div>
      </article>`;
  }

  function skillsPane() {
    return `
      <h2>skills</h2>
      ${Object.entries(SKILLS).map(([group, items]) => `
        <h2 class="sk-group">${esc(group)}</h2>
        <div class="chips big">${items.map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>`).join("")}
      <p class="skills-note">Proof lives in the projects and experience tabs, not in this list.</p>`;
  }

  const PANES = { hello: heroPane, experience: experiencePane, projects: projectsPane, skills: skillsPane };

  /* ---------- tab machinery ---------- */
  function showTab(id, projectId) {
    if (!PANES[id]) return;
    currentTab = id;
    if (projectId && PROJECTS.some((p) => p.id === projectId)) currentProject = projectId;
    view.innerHTML = `<div class="pane">${PANES[id]()}</div>`;
    for (const b of tabsEl.children) b.classList.toggle("on", b.dataset.tab === id);
    // theme colors come straight from data.js, so new projects theme themselves
    if (id === "projects") {
      const proj = PROJECTS.find((p) => p.id === currentProject) || PROJECTS[0];
      document.body.dataset.theme = proj.id;
      document.body.style.setProperty("--accent", proj.theme.accent);
      document.body.style.setProperty("--bg", proj.theme.bg);
    } else {
      document.body.dataset.theme = "";
      document.body.style.removeProperty("--accent");
      document.body.style.removeProperty("--bg");
    }
    history.replaceState(null, "", "#" + (id === "projects" ? currentProject : id));
    // staggered reveal
    const kids = view.querySelectorAll(".pane > *, .hero-text > *");
    kids.forEach((el, i) => { el.classList.add("rv"); el.style.animationDelay = `${Math.min(i * 55, 500)}ms`; });
    if (id === "projects") {
      view.querySelectorAll(".proj-tab").forEach((b) =>
        b.addEventListener("click", () => showTab("projects", b.dataset.project)));
      view.querySelectorAll(".pnav").forEach((b) =>
        b.addEventListener("click", () => {
          const i = PROJECTS.findIndex((p) => p.id === currentProject);
          const next = PROJECTS[(i + Number(b.dataset.dir) + PROJECTS.length) % PROJECTS.length];
          showTab("projects", next.id);
        }));
    }
    if (id === "hello") typeName();
    // cursor-tracking spotlight on the big surfaces
    view.querySelectorAll(".spec, .xcard, .proj").forEach((el) => {
      el.classList.add("spot");
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
    placeTabInd();
  }

  function typeName() {
    const el = view.querySelector("#typed");
    if (!el) return;
    const name = PROFILE.name;
    if (sessionStorage.getItem("typed") || reduced.matches) { el.textContent = name; return; }
    let i = 0;
    const iv = setInterval(() => {
      if (!el.isConnected) return clearInterval(iv);
      el.textContent = name.slice(0, ++i);
      if (i >= name.length) { clearInterval(iv); sessionStorage.setItem("typed", "1"); }
    }, 52);
  }

  /* sliding indicator behind the active tab */
  const tabInd = document.createElement("i");
  tabInd.id = "tab-ind";
  function placeTabInd() {
    const on = tabsEl.querySelector(".tab.on");
    if (!on) return;
    tabInd.style.left = on.offsetLeft + "px";
    tabInd.style.width = on.offsetWidth + "px";
  }
  addEventListener("resize", placeTabInd);
  window.showTab = showTab;

  TABS.forEach((t, i) => {
    const b = document.createElement("button");
    b.className = "tab";
    b.dataset.tab = t.id;
    b.innerHTML = `<span class="n">0${i + 1}</span>${t.label}`;
    b.addEventListener("click", () => showTab(t.id));
    tabsEl.appendChild(b);
  });
  tabsEl.appendChild(tabInd);
  setTimeout(placeTabInd, 250); // again once the mono font has loaded

  /* one-time chat nudge bubble */
  setTimeout(() => {
    if (localStorage.getItem("fabtip") || !document.getElementById("chatpanel").hidden) return;
    localStorage.setItem("fabtip", "1");
    const tip = document.createElement("div");
    tip.id = "fabtip";
    tip.textContent = "ask me anything about mohammad";
    document.body.appendChild(tip);
    const kill = () => tip.remove();
    tip.addEventListener("click", () => { kill(); window.Chat && Chat.open(); });
    setTimeout(kill, 7000);
  }, 6000);

  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    const i = TABS.findIndex((x) => x.id === currentTab);
    if (e.key >= "1" && e.key <= String(TABS.length)) showTab(TABS[+e.key - 1].id);
    else if (e.key === "ArrowRight") showTab(TABS[(i + 1) % TABS.length].id);
    else if (e.key === "ArrowLeft") showTab(TABS[(i - 1 + TABS.length) % TABS.length].id);
  });

  /* ---------- drifting contour background ---------- */
  const canvas = document.getElementById("bg");
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, peaks = [];
  function mulberry(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function sizeBg() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const rnd = mulberry(7);
    peaks = Array.from({ length: 4 }, (_, i) => ({
      x: rnd() * W, y: rnd() * H, dp: rnd() * 6.28, ds: 0.00008 + rnd() * 0.00006,
      waves: Array.from({ length: 3 }, () => ({ f: 2 + Math.floor(rnd() * 4), a: 6 + rnd() * 18, p: rnd() * 6.28 })),
    }));
  }
  let lastDraw = 0;
  function drawBg(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1;
    for (const pk of peaks) {
      const ox = Math.sin(t * pk.ds + pk.dp) * 26;
      const oy = Math.cos(t * pk.ds * 0.8 + pk.dp) * 20;
      for (let i = 1; i <= 14; i++) {
        const r = i * (Math.min(W, H) / 16);
        ctx.strokeStyle = `rgba(201, 192, 176, ${Math.max(0.052 - i * 0.002, 0.008)})`;
        ctx.beginPath();
        for (let a = 0; a <= 6.3; a += 0.06) {
          let rr = r;
          for (const wv of pk.waves) rr += Math.sin(a * wv.f + wv.p + i * 0.35 + t * 0.00004) * wv.a;
          const x = pk.x + ox + Math.cos(a) * rr, y = pk.y + oy + Math.sin(a) * rr;
          if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  }
  function loop(t) {
    if (!reduced.matches && !document.hidden && t - lastDraw > 50) { drawBg(t); lastDraw = t; }
    requestAnimationFrame(loop);
  }
  addEventListener("resize", () => { sizeBg(); drawBg(performance.now()); });
  sizeBg();
  drawBg(0);
  requestAnimationFrame(loop);

  /* ---------- boot from hash ---------- */
  const target = location.hash.slice(1);
  if (PROJECTS.some((p) => p.id === target)) showTab("projects", target);
  else if (PANES[target]) showTab(target);
  else showTab("hello");
})();
