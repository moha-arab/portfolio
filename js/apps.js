/* App registry: icons + window content. Icons are flat tiles — one fill, one
   stroke, no gradients, no duplicate SVG ids. */

const S = 'fill="none" stroke="#efe8db" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';

function tile(fill, inner) {
  return `<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="1.5" y="1.5" width="45" height="45" rx="7" fill="${fill}"/>
    <rect x="1.5" y="1.5" width="45" height="45" rx="7" fill="none" stroke="rgba(255,255,255,0.09)"/>
    ${inner}</svg>`;
}

const ICONS = {
  about: tile("#4d4639",
    `<rect x="15" y="10" width="18" height="28" rx="2" ${S}/><path d="M20 18h8M20 24h8M20 30h5" ${S}/>`),
  projects: tile("#a06b2c",
    `<path d="M9 17c0-1.6 1.3-3 3-3h8l4 4h12c1.6 0 3 1.4 3 3v12c0 1.6-1.4 3-3 3H12c-1.7 0-3-1.4-3-3V17z" ${S}/>`),
  chat: tile("#5c6e4f",
    `<path d="M10 16c0-1.6 1.3-3 3-3h22c1.6 0 3 1.4 3 3v13c0 1.6-1.4 3-3 3H21l-7 6v-6h-1c-1.7 0-3-1.4-3-3V16z" ${S}/><path d="M17 20h14M17 25h9" ${S}/>`),
  terminal: tile("#232823",
    `<path d="M12 16l8 8-8 8" fill="none" stroke="#9db27a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M25 32h11" ${S}/>`),
  skills: tile("#3f5c66",
    `<path d="M11 16h26M11 24h26M11 32h26" ${S}/><circle cx="19" cy="16" r="3.2" fill="#3f5c66" stroke="#efe8db" stroke-width="2.2"/><circle cx="30" cy="24" r="3.2" fill="#3f5c66" stroke="#efe8db" stroke-width="2.2"/><circle cx="16" cy="32" r="3.2" fill="#3f5c66" stroke="#efe8db" stroke-width="2.2"/>`),
  education: tile("#6e5340",
    `<path d="M24 13 8 20.5 24 28l16-7.5L24 13z" ${S}/><path d="M15 24.5V32c0 2.2 4 4.5 9 4.5s9-2.3 9-4.5v-7.5" ${S}/><path d="M40 21v8" ${S}/>`),
  experience: tile("#55504a",
    `<rect x="10" y="19" width="28" height="16" rx="2.5" ${S}/><path d="M19 19v-3c0-1.6 1.3-3 3-3h4c1.6 0 3 1.4 3 3v3" ${S}/><path d="M10 26h28" ${S}/>`),
  contact: tile("#7d4a3f",
    `<rect x="10" y="15" width="28" height="19" rx="2.5" ${S}/><path d="m11.5 17.5 12.5 9 12.5-9" ${S}/>`),
  trash: tile("#3c3934",
    `<path d="M13 17h22M20 17v-3h8v3" ${S}/><path d="M15.5 17l1.6 18c.1 1.6 1.4 3 3 3h7.8c1.6 0 2.9-1.4 3-3l1.6-18" ${S}/><path d="M21 23v9M27 23v9" ${S}/>`),
  jinto: tile("#96453b",
    `<circle cx="24" cy="24" r="9" ${S}/><path d="M24 9v6M24 33v6M9 24h6M33 24h6" ${S}/>`),
  yapstage: tile("#4a5d80",
    `<path d="M10 15c0-1.6 1.3-3 3-3h12c1.6 0 3 1.4 3 3v7c0 1.6-1.4 3-3 3h-7l-5 4v-4h-.5c-1.4 0-2.5-1.3-2.5-3v-7z" ${S}/><path d="M32 20h3c1.6 0 3 1.4 3 3v7c0 1.6-1.4 3-3 3h-1v4l-5-4h-6c-1 0-1.9-.4-2.4-1.2" ${S}/>`),
  aboutos: tile("#44403a",
    `<circle cx="24" cy="24" r="13" ${S}/><path d="M24 22v8" ${S}/><path d="M24 16.5v.5" ${S}/>`),
};

const APPS = {

  about: {
    title: "readme.md", icon: ICONS.about, w: 580, h: 500, desktop: true,
    content: () => `
      <h1>Hey, I'm Mohammad.</h1>
      <p class="lede">Second-year CS co-op student. I build things people actually use, then I rebuild them when the first version embarrasses me.</p>
      <div class="tldr">
        <span class="t-label">in a hurry? the short version: 2nd-year CS co-op, ships real software, looking for his next work term.</span>
        <button class="btn" onclick="wm.open('projects')">projects</button>
        <button class="btn ghost" onclick="wm.open('contact')">contact</button>
        <button class="btn ghost" onclick="wm.open('chat')">ask mo.bot</button>
      </div>
      <h2>what you're looking at</h2>
      <p>This site is a small operating system I wrote from scratch. No frameworks, no template. Windows drag and snap to screen edges, the terminal works (<span class="kbd">help</span> is a good start), and there's more hidden in here than I'll admit to.</p>
      <h2>right now</h2>
      <p>Building <strong>jinto.gg</strong>, an AI coach for Valorant. The first version's plan got scrapped in July, and the rebuild is better for it. Also hunting for a winter co-op term. If you're hiring, <a href="#" onclick="wm.open('contact');return false">the contact window is right there</a>.</p>`,
  },

  projects: {
    title: "projects", icon: ICONS.projects, w: 640, h: 540, desktop: true,
    content: () => `
      <h1>Projects</h1>
      <p>The two I care about most. Both are working software, not tutorial clones.</p>
      <div style="height:8px"></div>

      <div class="pcard">
        <span class="ic">${ICONS.jinto}</span>
        <div class="pcard-body">
          <div class="pcard-top"><h3>jinto.gg</h3><span class="pill dev">in development</span></div>
          <p>An AI coach for Valorant that talks you through your own games like a duo partner: econ calls, why you died, what to try next round.</p>
          <div class="chips"><span class="chip">TypeScript</span><span class="chip">live overlay</span><span class="chip">Riot API</span><span class="chip">LLM coaching</span></div>
          <div class="pcard-actions"><button class="btn ghost" onclick="wm.open('jinto')">open</button></div>
        </div>
      </div>

      <div class="pcard">
        <span class="ic">${ICONS.yapstage}</span>
        <div class="pcard-body">
          <div class="pcard-top"><h3>YapStage</h3><span class="pill built">mvp built</span></div>
          <p>1v1 video debates, judged by AI. Two strangers, one topic, live video, and a verdict nobody can argue with (they try).</p>
          <div class="chips"><span class="chip">WebRTC</span><span class="chip">Node.js</span><span class="chip">LLM judging</span><span class="chip">TURN</span></div>
          <div class="pcard-actions"><button class="btn ghost" onclick="wm.open('yapstage')">open</button></div>
        </div>
      </div>

      <p style="font-size:12.5px;color:var(--muted)">Repos are private while these are in flight. Email me for a walkthrough, I like giving them.</p>`,
  },

  jinto: {
    title: "jinto.gg", icon: ICONS.jinto, w: 600, h: 520,
    content: () => `
      <div class="pcard-top"><h1>jinto.gg</h1><span class="pill dev">in development</span></div>
      <p class="lede">An AI Valorant coach that watches your game and talks you through it.</p>
      <h2>the problem</h2>
      <p>Most players plateau because nobody ever tells them <em>why</em> they're losing rounds. Stats dashboards tell you what happened after the fact. Nobody wants homework.</p>
      <h2>the product</h2>
      <p>jinto sits on top of the game as a live overlay and coaches mid-match like a duo partner would: what to buy this round, what went wrong on that push, what to change next time. Round events and match context feed an LLM pipeline that turns raw game state into short, specific advice.</p>
      <h2>where it's at</h2>
      <p>Built. Riot developer application pending, launching when it's approved, and a waitlist is already forming while it waits. The first version's PRD got thrown out in July and rewritten from scratch, which hurt, and was correct.</p>`,
  },

  yapstage: {
    title: "yapstage", icon: ICONS.yapstage, w: 600, h: 520,
    content: () => `
      <div class="pcard-top"><h1>YapStage</h1><span class="pill built">mvp built</span></div>
      <p class="lede">1v1 video debates with an AI judge.</p>
      <h2>the idea</h2>
      <p>Two people join a room, get a topic, and argue it over live video. When time runs out, an AI judge scores the arguments and declares a winner. Arguing on the internet, but as a sport with a referee.</p>
      <h2>how it works</h2>
      <p>Live video runs peer-to-peer over WebRTC, with a TURN server relaying the connections that can't go direct (that part was most of the pain). A Node backend handles rooms and matchmaking, and the judging pipeline sends the transcript through an LLM to score structure, evidence and rebuttals.</p>
      <h2>where it's at</h2>
      <p>Live, with a lesson attached: it launched with public matchmaking, and when there weren't enough concurrent users to make random matches work, I pivoted it to private lobbies. Cold-start problems are real and now I respect them.</p>`,
  },

  skills: {
    title: "skills", icon: ICONS.skills, w: 540, h: 480, desktop: true,
    content: () => `
      <h1>Skills</h1>
      <p>What I actually reach for when building, not a keyword wall.</p>
      <h2>languages</h2>
      <div class="chips"><span class="chip">Python</span><span class="chip">Java</span><span class="chip">JavaScript</span><span class="chip">TypeScript</span><span class="chip">C</span><span class="chip">Bash</span><span class="chip">HTML/CSS</span></div>
      <h2>frameworks</h2>
      <div class="chips"><span class="chip">React</span><span class="chip">Next.js</span><span class="chip">Node.js</span><span class="chip">Express</span><span class="chip">React Native</span><span class="chip">Expo</span></div>
      <h2>ai</h2>
      <div class="chips"><span class="chip">LLM APIs (Claude, OpenAI)</span><span class="chip">RAG pipelines</span><span class="chip">Claude Code</span></div>
      <h2>services &amp; tools</h2>
      <div class="chips"><span class="chip">Git/GitHub</span><span class="chip">MongoDB</span><span class="chip">PostgreSQL</span><span class="chip">AWS</span><span class="chip">Docker</span><span class="chip">JWT auth</span></div>
      <p style="margin-top:14px;font-size:12.5px;color:var(--muted)">Proof lives in the Projects and Experience windows.</p>`,
  },

  education: {
    title: "education", icon: ICONS.education, w: 520, h: 360, desktop: true,
    content: () => `
      <h1>Education</h1>
      <div style="height:6px"></div>
      <div class="tl">
        <div class="tl-item">
          <h3>Queen's University</h3>
          <div class="tl-meta">kingston, ontario · expected graduation april 2028</div>
          <p>B.Comp. (Hons.), Computer Science. <strong>GPA 4.04 / 4.30</strong>, which I mention exactly once on this site, here.</p>
          <div class="chips"><span class="chip">GPA 4.04/4.30</span><span class="chip">class of 2028</span></div>
        </div>
      </div>`,
  },

  experience: {
    title: "experience", icon: ICONS.experience, w: 560, h: 420, desktop: true,
    content: () => `
      <h1>Experience</h1>
      <div style="height:6px"></div>
      <div class="tl">
        <div class="tl-item">
          <h3>AI Engineer Intern · The Groundwater Project</h3>
          <div class="tl-meta">may – aug 2026 · waterloo, ontario</div>
          <p>Built a RAG-based educational search engine for a groundwater-education nonprofit, then added a tutor mode on top. Learned firsthand what an LLM token bill looks like when real users show up.</p>
        </div>
        <div class="tl-item">
          <h3>Software Engineer Intern · Expense Trend</h3>
          <div class="tl-meta">jan – apr 2026 · calgary (remote)</div>
          <p>Built an iOS App Store optimization tool as a web app.</p>
        </div>
        <div class="tl-item">
          <h3>Software Developer · Engineering Society of Queen's</h3>
          <div class="tl-meta">nov 2024 – apr 2025 · kingston, ontario</div>
          <p>Worked with a team on a live occupancy tracker for the campus gym, cafeteria and library.</p>
        </div>
        <div class="tl-item">
          <h3>Your company?</h3>
          <div class="tl-meta">next co-op term · applications open</div>
          <p>This slot is available. <a href="#" onclick="wm.open('contact');return false">Interviews are shorter than this website took to build.</a></p>
        </div>
      </div>`,
  },

  contact: {
    title: "contact", icon: ICONS.contact, w: 480, h: 420, desktop: true,
    content: () => `
      <div class="contact-head">
        <img class="avatar" src="assets/me.jpg" alt="Mohammad Arab">
        <div>
          <h1>Mohammad Arab</h1>
          <p style="margin:0">CS co-op student · open to work terms</p>
        </div>
      </div>
      <h2>reach me</h2>
      <dl class="kv">
        <dt>email</dt><dd><a href="mailto:mohd.e.arab@gmail.com">mohd.e.arab@gmail.com</a></dd>
        <dt>github</dt><dd><a href="https://github.com/moha-arab" target="_blank" rel="noopener">github.com/moha-arab</a></dd>
        <dt>location</dt><dd>Kingston, Ontario (Queen's University)</dd>
        <dt>response</dt><dd>usually same day, faster if your subject line mentions Valorant</dd>
      </dl>
      <div class="contact-actions">
        <a class="btn" href="mailto:mohd.e.arab@gmail.com">email me</a>
        <button class="btn ghost" onclick="wm.open('chat')">ask mo.bot first</button>
      </div>`,
  },

  trash: {
    title: "recycle bin", icon: ICONS.trash, w: 520, h: 400, desktop: true,
    content: () => `
      <h1>Recycle Bin</h1>
      <p>Deleted, not forgotten. These failures are load-bearing.</p>
      <div style="height:6px"></div>
      <div class="trash-item"><span class="tname">jinto_prd_v1.md</span><span class="twhy">the original plan. scrapped in july, and the rebuild is better for it.</span></div>
      <div class="trash-item"><span class="tname">portfolio_v1/</span><span class="twhy">glassmorphism and gradients. looked like every AI-generated site on the internet. deleted with prejudice.</span></div>
      <div class="trash-item"><span class="tname">essay_final_FINAL_v3(2).docx</span><span class="twhy">every student has one.</span></div>
      <div class="trash-item"><span class="tname">ranked_clips_2am/</span><span class="twhy">evidence. destroyed.</span></div>
      <div class="contact-actions">
        <button class="btn ghost" onclick="this.textContent='these failures are load-bearing. keeping them.'">empty recycle bin</button>
      </div>`,
  },

  aboutos: {
    title: "about mohdOS", icon: ICONS.aboutos, w: 470, h: 430,
    content: () => `
      <h1>mohdOS 2.0</h1>
      <p class="lede">A portfolio pretending to be an operating system.</p>
      <h2>colophon</h2>
      <p>Hand-built in vanilla HTML, CSS and JavaScript. No frameworks, no UI libraries. The window manager, terminal, chatbot and wallpaper engine are all original code you can read.</p>
      <p>Type is JetBrains Mono for the chrome and your system font for prose. The accent is one amber, used only where it means something: focus, links, the active window. The wallpaper is a contour map, a nod to the groundwater search team I volunteer with.</p>
      <h2>changelog</h2>
      <p style="font-family:var(--mono);font-size:12px">2.0 · rebuilt the design, fixed 27 bugs, taught the terminal snake<br>1.0 · glassmorphism era. see recycle bin.</p>
      <div class="contact-actions">
        <button class="btn ghost" onclick="wm.open('terminal');">view source: type 'src wm.js'</button>
        <a class="btn ghost" href="https://github.com/moha-arab/portfolio" target="_blank" rel="noopener">github repo</a>
      </div>
      <p style="margin-top:10px">© 2026 Mohammad Arab</p>`,
  },
};
