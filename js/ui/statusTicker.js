import { optimizeWillChange } from "../core/utils.js";

export class StatusTicker {
  constructor() {
    this.element = null;
    this.init();
  }

  init() {
    const isMobile =
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(pointer: coarse)").matches;

    if (isMobile) return;

    this.element = document.createElement("div");
    this.element.id = "status-ticker";
    this.element.innerHTML = `
        <div class="ticker-item">
            <span class="ticker-label">POS</span>
            <span class="ticker-val" id="tick-pos">0,0</span>
        </div>
        <div class="ticker-item">
            <span class="ticker-label">SCR</span>
            <span class="ticker-val" id="tick-scr">0%</span>
        </div>
        <div class="ticker-item">
            <span class="ticker-label">MEM</span>
            <span class="ticker-val" id="tick-mem">--</span>
        </div>
    `;
    document.body.appendChild(this.element);

    this.posEl = document.getElementById("tick-pos");
    this.scrEl = document.getElementById("tick-scr");
    this.memEl = document.getElementById("tick-mem");

    optimizeWillChange(this.element);

    let lastUpdate = 0;

    // OPTIMIZATION: Throttle DOM updates
    window.addEventListener("mousemove", (e) => {
      const now = Date.now();
      // Update only every ~50ms (20fps) instead of every frame (60-144fps)
      if (now - lastUpdate > 50) {
        this.updatePos(e);
        lastUpdate = now;
      }
    });

    // Passive listener for scroll is good, but let's throttle that too
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            this.updateScroll();
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );

    setInterval(this.updateMem.bind(this), 1000);
  }

  updatePos(e) {
    if (this.posEl) {
      this.posEl.innerText = `${e.clientX}:${e.clientY}`;
    }
  }

  updateScroll() {
    if (!this.scrEl) return;
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = doc.scrollHeight - doc.clientHeight;

    let pct = 0;
    if (scrollHeight > 0) {
      pct = Math.round((scrollTop / scrollHeight) * 100);
    }

    this.scrEl.innerText = `${pct}%`;
  }

  updateMem() {
    if (!this.memEl) return;
    const usage = Math.floor(Math.random() * 40) + 20;
    const bar = "||||||||||";
    const filled = Math.floor((usage / 100) * 10);
    const viz =
      bar.substring(0, filled) + bar.substring(filled).replace(/\|/g, ".");
    this.memEl.innerText = `[${viz}]`;
  }
}
