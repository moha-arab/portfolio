/* Window manager: open/close/focus, drag with threshold, resize, minimize,
   maximize, edge snapping, browser-resize recovery, touch/mobile handling. */
const TASKBAR = 44;

class WindowManager {
  constructor() {
    this.layer = document.getElementById("windows");
    this.tasksEl = document.getElementById("tasks");
    this.snapEl = document.getElementById("snap-preview");
    this.z = 20;
    this.topId = null;
    this.wins = new Map(); // id -> { el, app, taskBtn, prevRect, snapEdge, hideTimer, lastDragEnd }
    this.openCount = 0;
    this.mobileMq = matchMedia("(max-width: 720px)");

    // browser resized: keep snapped windows snapped, keep floaters reachable
    addEventListener("resize", () => this.onViewportResize());
    // crossing mobile -> desktop: windows opened on mobile have no inline
    // geometry, so give them some or they render collapsed at the top-left
    this.mobileMq.addEventListener("change", (e) => {
      if (e.matches) return;
      for (const [, win] of this.wins) {
        if (!win.el.style.left) this.placeDefault(win.el, win.app);
      }
    });
  }

  isMobile() { return this.mobileMq.matches; }
  availH() { return innerHeight - TASKBAR; }

  placeDefault(el, app) {
    const w = Math.max(320, Math.min(app.w || 560, innerWidth - 24));
    const h = Math.max(200, Math.min(app.h || 420, this.availH() - 24));
    const n = this.openCount++ % 7;
    const x = Math.max(12, Math.min(80 + n * 32, innerWidth - w - 12));
    const y = Math.max(10, Math.min(36 + n * 28, this.availH() - h - 10));
    Object.assign(el.style, { width: w + "px", height: h + "px", left: x + "px", top: y + "px" });
  }

  open(id) {
    const app = APPS[id];
    if (!app) return;
    const existing = this.wins.get(id);
    if (existing) {
      this.restore(id);
      this.focus(id);
      return;
    }

    const el = document.createElement("section");
    el.className = "window opening";
    el.dataset.id = id;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", app.title);
    el.innerHTML = `
      <header class="titlebar">
        <div class="t-id">${app.icon || ""}<span>${app.title}</span></div>
        <div class="t-btns">
          <button class="wbtn min" aria-label="Minimize"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2 6h8"/></svg></button>
          <button class="wbtn max" aria-label="Maximize"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/></svg></button>
          <button class="wbtn close" aria-label="Close"><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7"/></svg></button>
        </div>
      </header>
      <div class="win-body${app.bare ? " bare" : ""}">${app.content()}</div>
      <div class="grip" aria-hidden="true"></div>`;

    if (!this.isMobile()) this.placeDefault(el, app);

    this.layer.appendChild(el);
    el.addEventListener("animationend", () => el.classList.remove("opening"), { once: true });

    const taskBtn = document.createElement("button");
    taskBtn.className = "task";
    taskBtn.dataset.id = id;
    taskBtn.innerHTML = `${app.icon || ""}<span>${app.title}</span>`;
    taskBtn.addEventListener("click", () => {
      const win = this.wins.get(id);
      if (!win) return;
      if (win.el.classList.contains("gone") || win.el.classList.contains("minimized")) {
        this.restore(id); this.focus(id);
      } else if (win.el.classList.contains("focused")) {
        this.minimize(id);
      } else {
        this.focus(id);
      }
    });
    this.tasksEl.appendChild(taskBtn);

    this.wins.set(id, { el, app, taskBtn, prevRect: null, snapEdge: null, hideTimer: null, lastDragEnd: 0 });
    this.bindWindow(id, el, app);
    this.focus(id);
    if (app.onMount) app.onMount(el);
    if (typeof this.onOpen === "function") this.onOpen(id, app);
  }

  bindWindow(id, el, app) {
    el.addEventListener("pointerdown", () => this.focus(id), true);
    el.querySelector(".wbtn.close").addEventListener("click", () => this.close(id));
    el.querySelector(".wbtn.min").addEventListener("click", () => this.minimize(id));
    el.querySelector(".wbtn.max").addEventListener("click", () => this.toggleMax(id));

    const bar = el.querySelector(".titlebar");
    bar.addEventListener("dblclick", (e) => {
      if (e.target.closest(".wbtn")) return;
      // a drag that just ended fires a click pair too; don't treat it as dblclick
      if (Date.now() - this.wins.get(id).lastDragEnd < 300) return;
      this.toggleMax(id);
    });
    bar.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest(".wbtn") || this.isMobile()) return;
      this.startDrag(id, e);
    });

    el.querySelector(".grip").addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || this.isMobile()) return;
      this.startResize(id, e);
    });
  }

  startDrag(id, e) {
    const win = this.wins.get(id);
    const el = win.el;
    e.preventDefault();

    const bar = el.querySelector(".titlebar");
    bar.setPointerCapture(e.pointerId);

    const pid = e.pointerId;
    const startX = e.clientX, startY = e.clientY;
    let rect = el.getBoundingClientRect();
    let offX = e.clientX - rect.left;
    let offY = e.clientY - rect.top;
    let started = false;
    let edge = null;

    const cleanup = (ev) => {
      try { bar.releasePointerCapture(pid); } catch {}
      bar.removeEventListener("pointermove", onMove);
      bar.removeEventListener("pointerup", onUp);
      bar.removeEventListener("pointercancel", onUp);
      bar.removeEventListener("lostpointercapture", onUp);
      this.showSnapPreview(null);
      if (started) win.lastDragEnd = Date.now();
    };

    const onMove = (ev) => {
      if (ev.pointerId !== pid || ev.buttons === 0) return;
      if (!started) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 4) return;
        started = true;
        // dragging a maximized/snapped window releases it under the cursor
        if (el.dataset.max === "1") {
          const ratio = offX / rect.width;
          this.unmax(id, false);
          rect = el.getBoundingClientRect();
          offX = Math.round(rect.width * ratio);
          offY = Math.min(offY, 28);
        }
      }
      const nl = Math.min(Math.max(ev.clientX - offX, -rect.width + 90), innerWidth - 90);
      const nt = Math.min(Math.max(ev.clientY - offY, 0), this.availH() - 30);
      el.style.left = nl + "px";
      el.style.top = nt + "px";
      edge = ev.clientX < 12 ? "left" : ev.clientX > innerWidth - 12 ? "right" : ev.clientY < 8 ? "top" : null;
      this.showSnapPreview(edge);
    };
    const onUp = (ev) => {
      if (ev.pointerId !== pid) return;
      cleanup(ev);
      if (started && edge && ev.type === "pointerup") this.snap(id, edge);
    };
    bar.addEventListener("pointermove", onMove);
    bar.addEventListener("pointerup", onUp);
    bar.addEventListener("pointercancel", onUp);
    bar.addEventListener("lostpointercapture", onUp);
  }

  showSnapPreview(edge) {
    const s = this.snapEl;
    if (!edge) { s.hidden = true; return; }
    const half = Math.round(innerWidth / 2);
    const geo = edge === "left" ? [6, 6, half - 12, this.availH() - 12]
      : edge === "right" ? [half + 6, 6, half - 12, this.availH() - 12]
      : [6, 6, innerWidth - 12, this.availH() - 12];
    s.hidden = false;
    Object.assign(s.style, { left: geo[0] + "px", top: geo[1] + "px", width: geo[2] + "px", height: geo[3] + "px" });
  }

  snap(id, edge, animate = true) {
    const win = this.wins.get(id);
    const el = win.el;
    if (!win.prevRect) win.prevRect = this.rectOf(el);
    el.dataset.max = "1";
    win.snapEdge = edge;
    if (animate) {
      el.classList.add("animate");
      setTimeout(() => el.classList.remove("animate"), 220);
    }
    const half = Math.round(innerWidth / 2);
    if (edge === "top") {
      Object.assign(el.style, { left: "0px", top: "0px", width: innerWidth + "px", height: this.availH() + "px" });
    } else {
      Object.assign(el.style, {
        left: (edge === "left" ? 0 : half) + "px", top: "0px",
        width: half + "px", height: this.availH() + "px",
      });
    }
  }

  rectOf(el) {
    return { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height };
  }

  toggleMax(id) {
    const win = this.wins.get(id);
    if (win.el.dataset.max === "1") this.unmax(id, true);
    else this.snap(id, "top");
  }

  unmax(id, animate) {
    const win = this.wins.get(id);
    const el = win.el;
    el.dataset.max = "";
    win.snapEdge = null;
    if (animate) {
      el.classList.add("animate");
      setTimeout(() => el.classList.remove("animate"), 220);
    }
    if (win.prevRect) Object.assign(el.style, win.prevRect);
    win.prevRect = null;
  }

  startResize(id, e) {
    const win = this.wins.get(id);
    const el = win.el;
    e.preventDefault();
    e.stopPropagation();

    // resizing a maximized window makes it a normal floater at its new size
    if (el.dataset.max === "1") {
      el.dataset.max = "";
      win.snapEdge = null;
      win.prevRect = null;
    }

    const rect = el.getBoundingClientRect();
    const grip = el.querySelector(".grip");
    const pid = e.pointerId;
    grip.setPointerCapture(pid);
    const sx = e.clientX, sy = e.clientY, sw = rect.width, sh = rect.height;

    const onMove = (ev) => {
      if (ev.pointerId !== pid || ev.buttons === 0) return;
      const w = Math.min(Math.max(320, sw + ev.clientX - sx), innerWidth - rect.left - 4);
      const h = Math.min(Math.max(200, sh + ev.clientY - sy), this.availH() - rect.top - 4);
      el.style.width = w + "px";
      el.style.height = h + "px";
    };
    const onUp = (ev) => {
      if (ev.pointerId !== pid) return;
      try { grip.releasePointerCapture(pid); } catch {}
      grip.removeEventListener("pointermove", onMove);
      grip.removeEventListener("pointerup", onUp);
      grip.removeEventListener("pointercancel", onUp);
      grip.removeEventListener("lostpointercapture", onUp);
    };
    grip.addEventListener("pointermove", onMove);
    grip.addEventListener("pointerup", onUp);
    grip.addEventListener("pointercancel", onUp);
    grip.addEventListener("lostpointercapture", onUp);
  }

  onViewportResize() {
    if (this.isMobile()) return;
    for (const [id, win] of this.wins) {
      const el = win.el;
      if (el.classList.contains("gone")) continue;
      if (el.dataset.max === "1") {
        this.snap(id, win.snapEdge || "top", false);
      } else if (el.style.left) {
        const rect = el.getBoundingClientRect();
        const nl = Math.min(Math.max(parseFloat(el.style.left) || 0, -rect.width + 90), innerWidth - 90);
        const nt = Math.min(Math.max(parseFloat(el.style.top) || 0, 0), this.availH() - 30);
        el.style.left = nl + "px";
        el.style.top = nt + "px";
      }
    }
  }

  focus(id) {
    if (this.topId === id && this.wins.get(id)?.el.classList.contains("focused")) return;
    for (const [wid, win] of this.wins) {
      const on = wid === id;
      win.el.classList.toggle("focused", on);
      win.taskBtn.classList.toggle("active", on);
      if (on) {
        win.el.style.zIndex = ++this.z;
        this.topId = id;
        if (win.app.onFocus) win.app.onFocus(win.el);
      }
    }
  }

  focusTopmost(skipId) {
    let top = null, topZ = -1;
    for (const [wid, w] of this.wins) {
      if (wid === skipId || w.el.classList.contains("minimized") || w.el.classList.contains("gone")) continue;
      const z = parseInt(w.el.style.zIndex || "0", 10);
      if (z > topZ) { topZ = z; top = wid; }
    }
    if (top) this.focus(top);
    else this.topId = null;
  }

  minimize(id) {
    const win = this.wins.get(id);
    win.el.classList.add("minimized");
    win.taskBtn.classList.remove("active");
    win.taskBtn.classList.add("min");
    clearTimeout(win.hideTimer);
    win.hideTimer = setTimeout(() => win.el.classList.add("gone"), 180);
    this.focusTopmost(id);
  }

  restore(id) {
    const win = this.wins.get(id);
    clearTimeout(win.hideTimer);
    win.el.classList.remove("gone");
    win.taskBtn.classList.remove("min");
    requestAnimationFrame(() => win.el.classList.remove("minimized"));
  }

  close(id) {
    const win = this.wins.get(id);
    if (!win) return;
    clearTimeout(win.hideTimer);
    win.el.classList.add("closing");
    win.taskBtn.remove();
    this.wins.delete(id);
    setTimeout(() => win.el.remove(), 150);
    if (this.topId === id) this.focusTopmost(id);
  }

  closeFocused() {
    if (this.topId && this.wins.has(this.topId)) this.close(this.topId);
  }
}
