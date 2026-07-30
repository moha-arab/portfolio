/* mo.bot — Mohammad's desk gremlin.
   Tries the real LLM endpoint (api/chat.js on Vercel) first; if it's missing
   or errors (e.g. running locally on a static server), falls back to the
   hand-written brain below and stops retrying. */
(() => {
  const CHAT_ENDPOINT = "/api/chat";
  let endpointDown = false;

  const esc = (s) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  /* ---- knowledge base ---- */
  // match: keywords (scored per hit). reply: string or array (random pick).
  // chips: suggested follow-ups. actions: [label, appId] buttons.
  const KB = [
    {
      id: "greeting",
      match: ["hi", "hello", "hey", "yo", "sup", "hiya", "morning", "afternoon", "evening", "howdy"],
      reply: () => {
        const h = new Date().getHours();
        const t = h < 5 ? "you're up late" : h < 12 ? "good morning" : h < 18 ? "good afternoon" : "good evening";
        return `${t}! i'm mo.bot, mohammad's desk gremlin. he's probably in a valorant queue, so ask me anything about him`;
      },
      chips: ["what has he built?", "is he looking for work?", "what's this website?"],
    },
    {
      id: "help",
      match: ["help", "what can i ask", "what do you know", "commands", "options"],
      reply: "i know about his projects, skills, school, work experience, and how to reach him. i also know which agent he mains, but you have to ask nicely",
      chips: ["what has he built?", "what's his stack?", "how do i contact him?"],
    },
    {
      id: "about",
      match: ["who", "about", "mohammad", "yourself", "he like", "tell me about"],
      reply: "mohammad is a second-year CS co-op student who ships real things instead of tutorial clones: an AI valorant coach, a video debate app with an AI judge, and search tooling for a volunteer team. also he built me, which i'm told counts",
      chips: ["what has he built?", "is he looking for work?", "does he play valorant?"],
    },
    {
      id: "projects",
      match: ["projects", "built", "portfolio", "made", "work on", "building", "shipped", "created"],
      reply: "the big two right now:\n• jinto.gg, an AI coach that talks you through your valorant games like a duo partner\n• YapStage, 1v1 video debates where an AI judge scores the arguments\n\nboth are real, working software. want a closer look?",
      actions: [["open jinto.gg", "jinto"], ["open YapStage", "yapstage"]],
      chips: ["tell me about jinto", "tell me about yapstage", "what's his stack?"],
    },
    {
      id: "jinto",
      match: ["jinto", "coach", "overlay", "coaching"],
      reply: "jinto.gg is his AI valorant coach. it sits on the game as a live overlay and coaches like a duo partner: econ calls, why you died, what to try next round. the product is built, he's waiting on riot's developer approval to launch",
      actions: [["open jinto.gg", "jinto"]],
      chips: ["tell me about yapstage", "what's his stack?", "is he looking for work?"],
    },
    {
      id: "yapstage",
      match: ["yapstage", "debate", "debates", "judge"],
      reply: "YapStage is 1v1 video debates with an AI judge. two people, one topic, live video over WebRTC, and at the end an AI scores structure, evidence and rebuttals and picks a winner. arguing on the internet, but as a sport. the MVP is built and smoke-tested",
      actions: [["open YapStage", "yapstage"]],
      chips: ["tell me about jinto", "what has he built?", "how do i contact him?"],
    },
    {
      id: "skills",
      match: ["skills", "stack", "languages", "tech", "technologies", "framework", "code in", "programming", "python", "typescript", "react"],
      reply: "day to day: python, typescript, react, node. he's shipped WebRTC video, LLM pipelines, and a discord bot or two. full list is in the Skills window",
      actions: [["open Skills", "skills"]],
      chips: ["what has he built?", "is he looking for work?"],
    },
    {
      id: "education",
      match: ["education", "school", "university", "college", "degree", "study", "studying", "student", "year"],
      reply: "second-year computer science, co-op program. details are in the Education window",
      actions: [["open Education", "education"]],
      chips: ["is he looking for work?", "what has he built?"],
    },
    {
      id: "experience",
      match: ["experience", "job", "jobs", "worked", "employer", "intern", "internship", "volunteer"],
      reply: "his work history is in the Experience window, including volunteer dev work building search tooling for a real search team",
      actions: [["open Experience", "experience"]],
      chips: ["is he looking for work?", "how do i contact him?"],
    },
    {
      id: "hiring",
      match: ["hire", "hiring", "looking", "available", "co-op", "coop", "recruit", "position", "role", "opportunity", "join", "work for", "work with"],
      reply: "yes! he's looking for his next co-op term. if you're hiring someone who ships fast, learns faster, and will absolutely redesign your internal tools without being asked, email him. he actually replies",
      actions: [["open Contact", "contact"]],
      chips: ["how do i contact him?", "what has he built?"],
    },
    {
      id: "contact",
      match: ["contact", "email", "reach", "phone", "call", "message", "touch", "linkedin", "github"],
      reply: "easiest way is email: mohd.e.arab@gmail.com. everything else is in the Contact window",
      actions: [["open Contact", "contact"]],
      chips: ["is he looking for work?"],
    },
    {
      id: "resume",
      match: ["resume", "cv"],
      reply: "email him at mohd.e.arab@gmail.com and he'll send you the latest version. it's shorter than this website",
      actions: [["open Contact", "contact"]],
      chips: ["is he looking for work?", "what has he built?"],
    },
    {
      id: "valorant",
      match: ["valorant", "rank", "game", "games", "gaming", "play", "agent", "main", "riot"],
      reply: ["he plays valorant, which you may have guessed from the two valorant-related projects. his rank is classified information that i am legally not allowed to share (he asked me not to)", "valorant? he's built two tools for it, so either he loves the game or he's stuck in it. possibly both"],
      chips: ["tell me about jinto", "what else does he do?"],
    },
    {
      id: "hobbies",
      match: ["hobbies", "fun", "free time", "outside", "else does", "interests"],
      reply: "building side projects, valorant, and convincing his friends to test the side projects. the venn diagram of those three is nearly a circle",
      chips: ["what has he built?", "does he play valorant?"],
    },
    {
      id: "website",
      match: ["website", "site", "this os", "mohdos", "desktop", "how did he make", "how was this", "built this", "source"],
      reply: "this whole site is a fake operating system he wrote from scratch in vanilla HTML, CSS and JS. window manager, terminal, wallpaper engine, me. no frameworks. try dragging a window into the screen edge, or type 'neofetch' in the terminal",
      actions: [["open Terminal", "terminal"]],
      chips: ["are you a real AI?", "what has he built?"],
    },
    {
      id: "ai",
      match: ["are you ai", "real ai", "chatgpt", "gpt", "llm", "are you real", "robot", "chatbot", "are you a bot"],
      reply: "i'm a few hundred lines of hand-written if-statements wearing a chat interface. the real AI work is in jinto and YapStage. i'm just here doing my best",
      chips: ["tell me about jinto", "tell me about yapstage"],
    },
    {
      id: "joke",
      match: ["joke", "funny", "laugh"],
      reply: ["why do programmers prefer dark mode? because light attracts bugs. mohammad made me say that, complaints to his email please", "there are only two hard things in computer science: cache invalidation, naming things, and off-by-one errors"],
      chips: ["what has he built?", "does he play valorant?"],
    },
    {
      id: "thanks",
      match: ["thanks", "thank", "thx", "appreciate", "cool", "nice", "awesome", "great"],
      reply: ["anytime! that's literally my whole job", "glad i could help. i'll be here, living in the taskbar"],
      chips: ["how do i contact him?", "what has he built?"],
    },
    {
      id: "bye",
      match: ["bye", "goodbye", "later", "cya", "see you", "gtg"],
      reply: "see you around! if you remember one thing, make it this: mohd.e.arab@gmail.com",
      chips: [],
    },
  ];

  const FALLBACKS = [
    "hm, that one's beyond my if-statements. try asking about his projects, skills, or how to reach him. or just email the man himself: mohd.e.arab@gmail.com",
    "i don't have an answer for that, and unlike some chatbots i won't make one up. his projects and contact info i CAN do",
    "no clue, honestly. i'm a small bot. ask me about jinto, YapStage, his skills, or how to contact him",
  ];

  function think(input) {
    const q = " " + input.toLowerCase().replace(/[^\w\s.@'-]/g, " ") + " ";
    let best = null, bestScore = 0;
    for (const entry of KB) {
      let score = 0;
      for (const kw of entry.match) {
        if (q.includes(" " + kw) || q.includes(kw + " ") || q.includes(kw)) score += kw.length > 3 ? 2 : 1;
      }
      if (score > bestScore) { bestScore = score; best = entry; }
    }
    if (!best || bestScore < 2) {
      return { reply: FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)], chips: ["what has he built?", "what's his stack?", "how do i contact him?"], actions: [] };
    }
    const reply = Array.isArray(best.reply)
      ? best.reply[Math.floor(Math.random() * best.reply.length)]
      : typeof best.reply === "function" ? best.reply() : best.reply;
    return { reply, chips: best.chips || [], actions: best.actions || [] };
  }

  /* ---- UI ---- */
  function pushBot(ui, text, chips, actions) {
    const row = document.createElement("div");
    row.className = "msg bot";
    row.innerHTML = `<img class="msg-ava" src="assets/me.jpg" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'msg-ava msg-ava-fb',textContent:'m'}))"><div class="bubble">${esc(text).replace(/\n/g, "<br>")}</div>`;
    ui.log.appendChild(row);

    if ((actions && actions.length) || (chips && chips.length)) {
      const tray = document.createElement("div");
      tray.className = "chip-tray";
      for (const [label, appId] of actions || []) {
        const b = document.createElement("button");
        b.className = "chatchip action";
        b.textContent = label;
        b.addEventListener("click", () => wm.open(appId));
        tray.appendChild(b);
      }
      for (const c of chips || []) {
        const b = document.createElement("button");
        b.className = "chatchip";
        b.textContent = c;
        b.addEventListener("click", () => send(ui, c));
        tray.appendChild(b);
      }
      ui.log.appendChild(tray);
    }
    ui.log.scrollTop = ui.log.scrollHeight;
  }

  function pushUser(ui, text) {
    const row = document.createElement("div");
    row.className = "msg me";
    row.innerHTML = `<div class="bubble">${esc(text)}</div>`;
    ui.log.appendChild(row);
    ui.log.scrollTop = ui.log.scrollHeight;
  }

  function typing(ui, on) {
    let t = ui.log.querySelector(".typing-row");
    if (!on) { if (t) t.remove(); return; }
    if (t) return;
    t = document.createElement("div");
    t.className = "msg bot typing-row";
    t.innerHTML = `<img class="msg-ava" src="assets/me.jpg" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'msg-ava msg-ava-fb',textContent:'m'}))"><div class="bubble typing"><i></i><i></i><i></i></div>`;
    ui.log.appendChild(t);
    ui.log.scrollTop = ui.log.scrollHeight;
  }

  async function send(ui, raw) {
    const text = raw.trim();
    if (!text || ui.busy) return;
    ui.busy = true;
    // clear stale chip trays so the thread stays tidy
    ui.log.querySelectorAll(".chip-tray").forEach((el) => el.remove());
    pushUser(ui, text);
    ui.history.push({ role: "user", text });
    typing(ui, true);

    let out = null;
    if (CHAT_ENDPOINT && !endpointDown) {
      try {
        const r = await fetch(CHAT_ENDPOINT, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: text, history: ui.history.slice(-10) }) });
        if (!r.ok) throw new Error(String(r.status));
        const data = await r.json();
        if (typeof data.reply === "string" && data.reply) out = { reply: data.reply, chips: [], actions: [] };
        else throw new Error("empty");
      } catch {
        endpointDown = true;
      }
    }
    if (!out) out = think(text);

    const delay = Math.min(420 + out.reply.length * 6, 1400);
    await new Promise((res) => setTimeout(res, delay));
    typing(ui, false);
    pushBot(ui, out.reply, out.chips, out.actions);
    ui.history.push({ role: "bot", text: out.reply });
    ui.busy = false;
    if (matchMedia("(pointer: fine)").matches) ui.input.focus();
  }

  APPS.chat = {
    title: "chat", icon: ICONS.chat, w: 460, h: 560, desktop: true, bare: true,
    content: () => `
      <div class="chat">
        <div class="chat-head">
          <img class="chat-ava" src="assets/me.jpg" alt="Mohammad" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'chat-ava chat-ava-fb',textContent:'m'}))">
          <div>
            <div class="chat-name">mo.bot</div>
            <div class="chat-status"><span class="dot"></span>always online</div>
          </div>
        </div>
        <div class="chat-log"></div>
        <form class="chat-form">
          <input class="chat-in" placeholder="ask about mohammad…" autocomplete="off" maxlength="200" aria-label="chat message">
          <button class="chat-send" type="submit" aria-label="send">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 14-7-4 7 4 7-14-7z"/></svg>
          </button>
        </form>
      </div>`,
    onMount(el) {
      const ui = {
        log: el.querySelector(".chat-log"),
        input: el.querySelector(".chat-in"),
        history: [],
        busy: false,
      };
      el.querySelector(".chat-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const v = ui.input.value;
        ui.input.value = "";
        send(ui, v);
      });
      setTimeout(() => {
        typing(ui, true);
        setTimeout(() => {
          typing(ui, false);
          pushBot(ui,
            "hey! i'm mo.bot, mohammad's chatbot. he hand-wrote my entire brain, which explains a lot.\n\nask me anything about him, or tap one of these:",
            ["what has he built?", "is he looking for work?", "what's this website?"],
            []);
        }, 700);
      }, 250);
      if (matchMedia("(pointer: fine)").matches) setTimeout(() => ui.input.focus(), 120);
    },
    onFocus(el) {
      if (matchMedia("(pointer: fine)").matches) {
        const inp = el.querySelector(".chat-in");
        if (inp) setTimeout(() => inp.focus(), 0);
      }
    },
  };
})();
