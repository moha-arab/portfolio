/* ============================================================
   ALL SITE CONTENT LIVES HERE. Edit this file, refresh, done.
   Everything renders automatically — add a skill, it appears.
   ============================================================ */

const PROFILE = {
  name: "mohammad arab",
  photo: "assets/me.jpg",
  // one line under your name. keep it short.
  tagline: "computer science student who ships real software.",
  email: "mohd.e.arab@gmail.com",
  github: "https://github.com/moha-arab",
  // paste your LinkedIn URL between the quotes and it appears automatically:
  linkedin: "",
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
  },
  {
    role: "Software Engineer Intern",
    org: "Expense Trend",
    when: "jan – apr 2026",
    where: "Calgary, Alberta (remote)",
    points: [
      "Built an iOS App Store optimization tool as a web app.",
    ],
  },
  {
    role: "Software Developer",
    org: "Engineering Society of Queen's University",
    when: "nov 2024 – apr 2025",
    where: "Kingston, Ontario",
    points: [
      "Worked with a team on a live occupancy tracker for the campus gym, cafeteria and library.",
    ],
  },
];

const PROJECTS = [
  {
    id: "jinto",
    name: "jinto.gg",
    status: "in development",
    tagline: "an AI coach for Valorant",
    desc: "A live overlay that coaches mid-match like a duo partner: what to buy this round, why you died, what to try next. Round events and match context feed an LLM pipeline that turns raw game state into short, specific advice.",
    footnote: "built · riot developer application pending · waitlist forming",
    stack: ["TypeScript", "live overlay", "Riot API", "LLM pipeline"],
    theme: { accent: "#e8574a", bg: "#150c0a", motif: "crosshair" },
  },
  {
    id: "yapstage",
    name: "YapStage",
    status: "live",
    tagline: "1v1 video debates, judged by AI",
    desc: "Two people, one topic, live video over WebRTC, and an AI judge that scores structure, evidence and rebuttals. Launched with public matchmaking, then pivoted to private lobbies when the concurrent-user math didn't work yet.",
    footnote: "live · private lobbies · cold-start lessons included free",
    stack: ["WebRTC", "Node.js", "TURN", "LLM judging"],
    theme: { accent: "#6f8fd4", bg: "#0b0e16", motif: "stage" },
  },
];

/* add or remove skills freely — groups and chips render automatically */
const SKILLS = {
  "languages": ["Python", "Java", "JavaScript", "TypeScript", "C", "Bash", "HTML/CSS"],
  "frameworks": ["React", "Next.js", "Node.js", "Express", "React Native", "Expo"],
  "ai": ["LLM APIs (Claude, OpenAI)", "RAG pipelines", "Claude Code"],
  "services & tools": ["Git/GitHub", "MongoDB", "PostgreSQL", "AWS", "Docker", "JWT auth"],
};
