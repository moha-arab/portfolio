/* mo.bot — floating chat. Tries the real LLM endpoint (api/chat.js on Vercel)
   first; if it's missing or errors (e.g. locally on a static server), falls
   back to the hand-written brain and stops retrying. */
(() => {
  const CHAT_ENDPOINT = "/api/chat";
  let endpointDown = false;

  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  const BOT = `<svg class="bot-ava" viewBox="0 0 32 32" aria-hidden="true">
    <rect x="4" y="9" width="24" height="19" rx="6" fill="#26211a" stroke="#3f3729"/>
    <rect class="eye" x="10.5" y="15.5" width="3.6" height="6" rx="1.6" fill="var(--accent)"/>
    <rect class="eye" x="17.9" y="15.5" width="3.6" height="6" rx="1.6" fill="var(--accent)"/>
    <line x1="16" y1="9" x2="16" y2="4.5" stroke="#3f3729" stroke-width="2"/>
    <circle cx="16" cy="3.6" r="2" fill="var(--accent)"/></svg>`;
  const BOT_FAB = `<svg viewBox="0 0 32 32" aria-hidden="true">
    <rect x="4" y="9" width="24" height="19" rx="6" fill="#191207"/>
    <rect class="eye" x="10.5" y="15.5" width="3.6" height="6" rx="1.6" fill="var(--accent)" style="--accent:#e8a03d"/>
    <rect class="eye" x="17.9" y="15.5" width="3.6" height="6" rx="1.6" fill="#e8a03d"/>
    <line x1="16" y1="9" x2="16" y2="4.5" stroke="#191207" stroke-width="2"/>
    <circle cx="16" cy="3.6" r="2" fill="#191207"/></svg>`;

  /* ---- knowledge base (fallback brain) ---- */
  // match: keywords. reply: string | array | fn. chips: follow-ups. actions: [label, target]
  // target: a tab id, "projects/jinto", or "mailto".
  const KB = [
    {
      id: "greeting",
      match: ["hi", "hello", "hey", "yo", "sup", "hiya", "morning", "afternoon", "evening", "howdy"],
      reply: () => {
        const h = new Date().getHours();
        const t = h < 5 ? "you're up late" : h < 12 ? "good morning" : h < 18 ? "good afternoon" : "good evening";
        return `${t}! i'm mo.bot. mohammad hand-wrote my backup brain, which explains a lot. ask me anything about him`;
      },
      chips: ["what has he built?", "is he looking for work?", "what's his gpa?"],
    },
    {
      id: "help",
      match: ["help", "what can i ask", "what do you know", "options"],
      reply: "i know his projects, experience, school, skills, and how to reach him. i also know his valorant rank, but i'm legally not allowed to share it",
      chips: ["what has he built?", "where does he study?", "how do i contact him?"],
    },
    {
      id: "about",
      match: ["who", "about", "mohammad", "yourself", "he like", "tell me about"],
      reply: "mohammad is a cs student at queen's university who ships real things: an AI valorant coach, an AI-judged debate app, and a RAG search engine at his last internship. also me",
      actions: [["see projects", "projects"]],
      chips: ["is he looking for work?", "what's his gpa?"],
    },
    {
      id: "projects",
      match: ["projects", "built", "portfolio", "made", "work on", "building", "shipped", "created"],
      reply: "two main ones:\n• jinto.gg, an AI coach that talks you through your valorant games\n• YapStage, 1v1 video debates scored by an AI judge\n\nboth real, both his",
      actions: [["jinto.gg", "projects/jinto"], ["YapStage", "projects/yapstage"]],
      chips: ["what's his stack?", "is he looking for work?"],
    },
    {
      id: "jinto",
      match: ["jinto", "coach", "overlay", "coaching"],
      reply: "jinto.gg is his AI valorant coach. live overlay, coaches like a duo partner: econ calls, why you died, what to try next round. built, waiting on riot's developer approval, waitlist already forming",
      actions: [["open jinto.gg", "projects/jinto"]],
      chips: ["tell me about yapstage", "what's his stack?"],
    },
    {
      id: "yapstage",
      match: ["yapstage", "debate", "debates", "judge"],
      reply: "YapStage is 1v1 video debates with an AI judge. live video over webrtc, and an LLM scores structure, evidence and rebuttals. launched public, pivoted to private lobbies when concurrent users were thin. he tells that story honestly, which i respect",
      actions: [["open YapStage", "projects/yapstage"]],
      chips: ["tell me about jinto", "how do i contact him?"],
    },
    {
      id: "experience",
      match: ["experience", "job", "jobs", "worked", "employer", "intern", "internship", "groundwater", "expense"],
      reply: "three work terms so far: AI engineer intern at the groundwater project (RAG search engine + tutor mode), software engineer intern at expense trend (iOS app store optimization webapp), and software developer with queen's engineering society (campus occupancy tracker)",
      actions: [["see experience", "experience"]],
      chips: ["is he looking for work?", "what's his stack?"],
    },
    {
      id: "education",
      match: ["education", "school", "university", "college", "degree", "study", "studying", "student", "queen", "queen's", "queens", "gpa", "grades", "graduate", "graduation", "kingston"],
      reply: "queen's university in kingston, ontario. b.comp (hons.) computer science, gpa 4.04/4.30, graduating april 2028. and no, he's not restricted to kingston, he'll work anywhere",
      actions: [["details", "hello"]],
      chips: ["is he looking for work?", "what has he built?"],
    },
    {
      id: "skills",
      match: ["skills", "stack", "languages", "tech", "technologies", "framework", "code in", "programming", "python", "typescript", "react", "java"],
      reply: "day to day: python, java, typescript, react, next.js, node. plus mongodb, postgres, aws, docker, and a lot of LLM api work. full list is one tab over",
      actions: [["see skills", "skills"]],
      chips: ["what has he built?", "is he looking for work?"],
    },
    {
      id: "hiring",
      match: ["hire", "hiring", "looking", "available", "co-op", "coop", "recruit", "position", "role", "opportunity", "join", "work for", "work with", "relocate", "remote"],
      reply: "yes, he's looking for his next co-op term, and he's not tied to kingston: he'll relocate or work remote. if you're hiring someone who ships fast and learns faster, email him. he actually replies",
      actions: [["email him", "mailto"]],
      chips: ["what has he built?", "what's his gpa?"],
    },
    {
      id: "contact",
      match: ["contact", "email", "reach", "phone", "call", "message", "touch", "linkedin", "github"],
      reply: "email is the way: mohd.e.arab@gmail.com. his github is github.com/moha-arab, and everything else is on the hello tab",
      actions: [["email him", "mailto"], ["hello tab", "hello"]],
      chips: ["is he looking for work?"],
    },
    {
      id: "resume",
      match: ["resume", "cv"],
      reply: "email him at mohd.e.arab@gmail.com and he'll send the current version, usually same day. it's shorter than this website",
      actions: [["email him", "mailto"]],
      chips: ["is he looking for work?"],
    },
    {
      id: "valorant",
      match: ["valorant", "rank", "game", "games", "gaming", "play", "agent", "main", "riot"],
      reply: ["he plays valorant, which you may have guessed from the AI valorant coach he built. his rank is classified information (he asked me not to say)", "valorant? he built an entire AI coach for it. draw your own conclusions about his hours"],
      chips: ["tell me about jinto", "what else does he do?"],
    },
    {
      id: "website",
      match: ["website", "site", "this page", "how did he make", "how was this", "built this", "source", "framework"],
      reply: "hand-built, no frameworks, and the source is public. fun fact: the previous version of this site was an entire fake operating system with a terminal and a snake game. he decided it was too much, which was correct. i'm the only survivor of the redesign",
      chips: ["are you a real AI?", "what has he built?"],
    },
    {
      id: "ai",
      match: ["are you ai", "real ai", "chatgpt", "gpt", "llm", "are you real", "robot", "chatbot", "are you a bot", "claude"],
      reply: "when the site is deployed i run on claude. if the api is down i fall back to a few hundred lines of if-statements mohammad wrote by hand. either way i'm doing my best",
      chips: ["tell me about jinto", "what's his stack?"],
    },
    {
      id: "thanks",
      match: ["thanks", "thank", "thx", "appreciate", "cool", "nice", "awesome", "great"],
      reply: ["anytime, that's literally my whole job", "glad i could help. i'll be down here in the corner"],
      chips: ["how do i contact him?"],
    },
    {
      id: "bye",
      match: ["bye", "goodbye", "later", "cya", "see you", "gtg"],
      reply: "see you around. if you remember one thing, make it this: mohd.e.arab@gmail.com",
      chips: [],
    },
  ];

  const FALLBACKS = [
    "hm, that one's past my pay grade (i am unpaid). try his projects, experience, or contact info. or email the man himself: mohd.e.arab@gmail.com",
    "i don't know that one, and unlike some chatbots i won't make it up. his projects and school i CAN do",
    "no idea, honestly. ask me about jinto, yapstage, queen's, or how to reach him",
  ];

  function think(input) {
    const q = " " + input.toLowerCase().replace(/[^\w\s.@'-]/g, " ") + " ";
    let best = null, bestScore = 0;
    for (const entry of KB) {
      let score = 0;
      for (const kw of entry.match) {
        if (q.includes(` ${kw} `)) score += 2;        // whole-word hit
        else if (kw.length > 4 && q.includes(kw)) score += 1; // partial, longer words only
      }
      if (score > bestScore) { bestScore = score; best = entry; }
    }
    if (!best || bestScore < 2) {
      return { reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)], chips: ["what has he built?", "is he looking for work?"], actions: [] };
    }
    const reply = Array.isArray(best.reply)
      ? best.reply[Math.floor(Math.random() * best.reply.length)]
      : typeof best.reply === "function" ? best.reply() : best.reply;
    return { reply, chips: best.chips || [], actions: best.actions || [] };
  }

  function go(target) {
    if (target === "mailto") { location.href = "mailto:mohd.e.arab@gmail.com"; return; }
    const [tab, project] = target.split("/");
    showTab(tab, project);
  }

  /* ---------- UI ---------- */
  const fab = document.getElementById("chatfab");
  const panel = document.getElementById("chatpanel");
  fab.innerHTML = BOT_FAB;
  let ui = null;

  function buildPanel() {
    panel.innerHTML = `
      <div class="chat-head">
        ${BOT}
        <div>
          <div class="chat-name">mo.bot</div>
          <div class="chat-status"><span class="dot"></span>always online</div>
        </div>
        <button class="chat-close" aria-label="Close chat"><svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7"/></svg></button>
      </div>
      <div class="chat-log"></div>
      <form class="chat-form">
        <input class="chat-in" placeholder="ask about mohammad…" autocomplete="off" maxlength="200" aria-label="chat message">
        <button class="chat-send" type="submit" aria-label="send">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 14-7-4 7 4 7-14-7z"/></svg>
        </button>
      </form>`;
    ui = { log: panel.querySelector(".chat-log"), input: panel.querySelector(".chat-in"), history: [], busy: false };
    panel.querySelector(".chat-close").addEventListener("click", toggle);
    panel.querySelector(".chat-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = ui.input.value;
      ui.input.value = "";
      send(v);
    });
    setTimeout(() => {
      if (ui.history.length) return; // they already started talking — skip the intro
      typing(true);
      setTimeout(() => {
        typing(false);
        if (ui.history.length) return;
        pushBot("hey, i'm mo.bot. ask me anything about mohammad, or tap one of these:",
          ["what has he built?", "is he looking for work?", "what's his gpa?"], []);
      }, 650);
    }, 200);
  }

  function pushBot(text, chips, actions) {
    const row = document.createElement("div");
    row.className = "msg bot";
    row.innerHTML = `${BOT}<div class="bubble">${esc(text).replace(/\n/g, "<br>")}</div>`;
    ui.log.appendChild(row);
    if ((actions && actions.length) || (chips && chips.length)) {
      const tray = document.createElement("div");
      tray.className = "chip-tray";
      for (const [label, target] of actions || []) {
        const b = document.createElement("button");
        b.className = "chatchip action";
        b.textContent = label;
        b.addEventListener("click", () => go(target));
        tray.appendChild(b);
      }
      for (const c of chips || []) {
        const b = document.createElement("button");
        b.className = "chatchip";
        b.textContent = c;
        b.addEventListener("click", () => send(c));
        tray.appendChild(b);
      }
      ui.log.appendChild(tray);
    }
    ui.log.scrollTop = ui.log.scrollHeight;
  }

  function pushUser(text) {
    const row = document.createElement("div");
    row.className = "msg me";
    row.innerHTML = `<div class="bubble">${esc(text)}</div>`;
    ui.log.appendChild(row);
    ui.log.scrollTop = ui.log.scrollHeight;
  }

  function typing(on) {
    let t = ui.log.querySelector(".typing-row");
    if (!on) { if (t) t.remove(); return; }
    if (t) return;
    t = document.createElement("div");
    t.className = "msg bot typing-row";
    t.innerHTML = `${BOT}<div class="bubble typing"><i></i><i></i><i></i></div>`;
    ui.log.appendChild(t);
    ui.log.scrollTop = ui.log.scrollHeight;
  }

  async function send(raw) {
    const text = raw.trim();
    if (!text || ui.busy) return;
    ui.busy = true;
    ui.log.querySelectorAll(".chip-tray").forEach((el) => el.remove());
    pushUser(text);
    ui.history.push({ role: "user", text });
    typing(true);

    let out = null;
    if (CHAT_ENDPOINT && !endpointDown) {
      try {
        const r = await fetch(CHAT_ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ message: text, history: ui.history.slice(-10) }),
        });
        if (!r.ok) throw new Error(String(r.status));
        const data = await r.json();
        if (typeof data.reply === "string" && data.reply) out = { reply: data.reply, chips: [], actions: [] };
        else throw new Error("empty");
      } catch { endpointDown = true; }
    }
    if (!out) out = think(text);

    const delay = Math.min(400 + out.reply.length * 5, 1300);
    await new Promise((res) => setTimeout(res, delay));
    typing(false);
    pushBot(out.reply, out.chips, out.actions);
    ui.history.push({ role: "bot", text: out.reply });
    ui.busy = false;
    if (matchMedia("(pointer: fine)").matches) ui.input.focus();
  }

  function toggle() {
    if (panel.hidden) {
      if (!ui) buildPanel();
      panel.hidden = false;
      if (matchMedia("(pointer: fine)").matches) setTimeout(() => ui.input.focus(), 80);
    } else {
      panel.hidden = true;
    }
  }

  fab.addEventListener("click", toggle);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) toggle();
  });

  window.Chat = { open() { if (panel.hidden) toggle(); }, toggle };
})();
