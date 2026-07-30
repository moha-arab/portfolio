/* Desktop wallpaper. Modes: topo (contour map), stars, flat. `matrix` is a
   hidden mode reachable from the terminal. Static modes draw once; animated
   modes run a rAF loop that respects prefers-reduced-motion live. */
const Wallpaper = (() => {
  const canvas = document.getElementById("wallpaper");
  const ctx = canvas.getContext("2d");
  const MODES = ["topo", "stars", "flat"];
  const mq = matchMedia("(prefers-reduced-motion: reduce)");
  let mode = parseInt(localStorage.getItem("wall") || "0", 10) % MODES.length;
  let special = null; // "matrix" overrides the cycle
  let w = 0, h = 0, stars = [], cols = [], dirty = true;

  // deterministic rand so the topo map is the same on every visit
  function mulberry(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function active() { return special || MODES[mode]; }

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    dirty = true;
  }

  function seed() {
    const rnd = mulberry(20260730);
    stars = Array.from({ length: 130 }, () => ({
      x: rnd() * w, y: rnd() * h, r: 0.4 + rnd() * 1.2,
      a: 0.15 + rnd() * 0.5, sp: 0.0004 + rnd() * 0.001, ph: rnd() * 6.28,
    }));
    const n = Math.ceil(w / 16);
    cols = Array.from({ length: n }, () => ({ y: rnd() * h, v: 2 + rnd() * 4 }));
  }

  function base() {
    ctx.fillStyle = "#0e0c09";
    ctx.fillRect(0, 0, w, h);
  }

  function drawTopo() {
    base();
    const rnd = mulberry(7);
    const peaks = Array.from({ length: 4 }, () => ({
      x: rnd() * w, y: rnd() * h,
      waves: Array.from({ length: 3 }, () => ({ f: 2 + Math.floor(rnd() * 4), a: 6 + rnd() * 18, p: rnd() * 6.28 })),
    }));
    ctx.lineWidth = 1;
    for (const pk of peaks) {
      const rings = 14;
      for (let i = 1; i <= rings; i++) {
        const r = i * (Math.min(w, h) / 16);
        ctx.strokeStyle = `rgba(201, 192, 176, ${0.055 - i * 0.002})`;
        ctx.beginPath();
        for (let a = 0; a <= 6.3; a += 0.06) {
          let rr = r;
          for (const wv of pk.waves) rr += Math.sin(a * wv.f + wv.p + i * 0.35) * wv.a;
          const x = pk.x + Math.cos(a) * rr;
          const y = pk.y + Math.sin(a) * rr;
          if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
    // faint elevation marker, map-style
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(148, 137, 122, 0.25)";
    ctx.fillText("· 174 m", w * 0.62, h * 0.31);
    ctx.fillText("· 202 m", w * 0.24, h * 0.68);
  }

  function drawStars(t) {
    base();
    for (const s of stars) {
      const tw = mq.matches ? s.a : s.a * (0.6 + 0.4 * Math.sin(t * s.sp + s.ph));
      ctx.fillStyle = `rgba(236, 229, 218, ${tw.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.283);
      ctx.fill();
    }
  }

  function drawMatrix() {
    ctx.fillStyle = "rgba(14, 12, 9, 0.12)";
    ctx.fillRect(0, 0, w, h);
    ctx.font = "13px 'JetBrains Mono', monospace";
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      const ch = String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96));
      ctx.fillStyle = "rgba(157, 178, 122, 0.8)";
      ctx.fillText(ch, i * 16, c.y);
      c.y += c.v;
      if (c.y > h + 20 && Math.random() > 0.975) c.y = -10;
    }
  }

  function frame(t) {
    if (w !== innerWidth || h !== innerHeight) resize();
    const m = active();
    const animated = (m === "stars" || m === "matrix") && !mq.matches;
    if (animated || dirty) {
      if (m === "topo") drawTopo();
      else if (m === "stars") drawStars(t);
      else if (m === "matrix") { if (dirty) base(); drawMatrix(); }
      else base();
      dirty = false;
    }
    requestAnimationFrame(frame);
  }

  addEventListener("resize", resize);
  mq.addEventListener("change", () => { dirty = true; });
  resize();
  requestAnimationFrame(frame);

  return {
    cycle() {
      special = null;
      mode = (mode + 1) % MODES.length;
      localStorage.setItem("wall", String(mode));
      dirty = true;
      return MODES[mode];
    },
    matrix(on) {
      special = on ? "matrix" : null;
      dirty = true;
    },
    isMatrix() { return special === "matrix"; },
  };
})();
