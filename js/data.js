/* ============================================================
   ALL SITE CONTENT LIVES HERE. Edit this file, refresh, done.
   Empty string fields ("") render as visible "soon" slots, so
   you can fill them in later without touching anything else.
   ============================================================ */

const PROFILE = {
  name: "mohammad arab",
  photo: "assets/me.jpg",
  tagline: "computer science student who ships real software.",
  now: "currently building jinto.gg · looking for my next co-op term",
  email: "mohd.e.arab@gmail.com",
  github: "https://github.com/moha-arab",
  linkedin: "https://www.linkedin.com/in/mohammadearab/",
  // when you have a resume pdf, drop it in assets/ and put the path here,
  // e.g. "assets/resume.pdf" — the button switches from email to download:
  resume: "",
  education: {
    school: "Queen's University",
    degree: "B.Comp. (Hons.), Computer Science",
    gpa: "4.04 / 4.30",
    grad: "expected April 2028",
    campus: "Kingston, Ontario",
  },
  location: "based in Kingston, ON · open to working anywhere",
};

const EXPERIENCE = [
  {
    role: "AI Engineer Intern",
    org: "The Groundwater Project",
    when: "may – aug 2026",
    where: "Waterloo, Ontario",
    points: [
      "Built a RAG-based educational search engine for a groundwater-education nonprofit.",
      "Added a tutor mode on top, and learned what an LLM token bill looks like when real users show up.",
    ],
    brand: { color: "#4fb3c6", icon: "water" },
  },
  {
    role: "Software Engineer Intern",
    org: "Expense Trend",
    when: "jan – apr 2026",
    where: "Calgary, Alberta (remote)",
    points: [
      "Built an iOS App Store optimization tool as a web app.",
    ],
    brand: { color: "#6fbf8a", icon: "chart" },
  },
  {
    role: "Software Developer",
    org: "Engineering Society of Queen's University",
    when: "nov 2024 – apr 2025",
    where: "Kingston, Ontario",
    points: [
      "Worked with a team on a live occupancy tracker for the campus gym, cafeteria and library.",
    ],
    brand: { color: "#fabd0f", icon: "gear" },
  },
];

const PROJECTS = [
  {
    id: "jinto",
    name: "jinto.gg",
    link: "https://jinto.gg",
    status: "in development",
    tagline: "an AI coach for Valorant",
    desc: "A live overlay that coaches mid-match like a duo partner: what to buy this round, why you died, what to try next. Round events and match context feed an LLM pipeline that turns raw game state into short, specific advice.",
    footnote: "built · riot developer application pending · waitlist forming",
    stack: ["TypeScript", "live overlay", "Riot API", "LLM pipeline"],
    theme: { accent: "#ff4655", bg: "#0f1923", ghost: "JINTO", motif: "crosshair" },
  },
  {
    id: "yapstage",
    name: "YapStage",
    link: "https://yapstage.com",
    status: "live",
    tagline: "1v1 video debates, judged by AI",
    desc: "Two people, one topic, live video over WebRTC, and an AI judge that scores structure, evidence and rebuttals. Launched with public matchmaking, then pivoted to private lobbies when the concurrent-user math didn't work yet.",
    footnote: "live · private lobbies · cold-start lessons included free",
    stack: ["WebRTC", "Node.js", "TURN", "LLM judging"],
    theme: { accent: "#9d8cff", bg: "#0d0a1a", ghost: "VS", motif: "stage" },
  },
  {
    id: "hometongue",
    name: "HomeTongue",
    link: "", // paste https://hometongue.me here once the domain is connected
    repo: "https://github.com/moha-arab/hometongue",
    status: "launching soon",
    tagline: "speak, and it guesses your dialect",
    desc: "Record a few sentences in the browser and it places your Arabic dialect. MediaRecorder captures the audio, Whisper turns it into text, and Claude reads the word choices and phrasing to make the call. Works from a phone, which is where families actually argue about this.",
    footnote: "built · hometongue.me secured · connecting the domain next",
    stack: ["MediaRecorder", "Groq Whisper", "Claude API", "Vercel"],
    theme: { accent: "#3ecf8e", bg: "#07130d", ghost: "لهجة", motif: "wave" },
  },
];

/* add or remove skills freely — groups and chips render automatically */
const SKILLS = {
  "languages": ["Python", "Java", "JavaScript", "TypeScript", "C", "Bash", "HTML/CSS"],
  "frameworks": ["React", "Next.js", "Node.js", "Express", "React Native", "Expo"],
  "ai": ["LLM APIs (Claude, OpenAI)", "RAG pipelines", "Claude Code"],
  "services & tools": ["Git/GitHub", "MongoDB", "PostgreSQL", "AWS", "Docker", "JWT auth"],
};
