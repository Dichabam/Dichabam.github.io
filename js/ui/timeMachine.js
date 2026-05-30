/**
 * TIME MACHINE — hidden easter egg feature
 *
 * Trigger:
 *   Desktop  → long-press (600ms hold) on the footer copyright text
 *   Mobile   → triple-tap on the footer copyright text
 *
 * The widget is never in the DOM until triggered.
 * It injects a full-screen overlay with a cinematic year dial,
 * applies the theme, then tears everything down on close.
 */

const ERAS = [
  {
    year: "1998",
    theme: "1998",
    themeEvent: "retro",
    label: "Terminal Era",
    desc: "Web was text, blinking cursors, and dial-up hope.",
    color: "#00ff00",
    bg: "#000",
  },
  {
    year: "2010",
    theme: "2010",
    themeEvent: "web2",
    label: "Web 2.0 Era",
    desc: "Gradients, gloss, and the rise of the social web.",
    color: "#4a90d9",
    bg: "#d1d8e0",
  },
  {
    year: "NOW",
    theme: null,
    themeEvent: "default",
    label: "Present",
    desc: "WebGL, AI, and pushing what the browser can do.",
    color: "#03b3c3",
    bg: "#050505",
  },
];

export class TimeMachine {
  constructor() {
    this.currentEraIndex = 2; // start at "NOW"
    this.isOpen = false;
    this.overlay = null;

    // Remove the old hard-coded DOM widget if it exists
    const old = document.getElementById("time-machine-container");
    if (old) old.remove();

    this.init();
  }

  init() {
    // Wait until the loader is gone before attaching the trigger
    window.addEventListener("introAnimationComplete", () => {
      this.attachTrigger();
    });

    // Fallback: if loader event never fires (e.g. dev reload)
    setTimeout(() => {
      if (!this._triggerAttached) this.attachTrigger();
    }, 4000);
  }

  attachTrigger() {
    if (this._triggerAttached) return;
    this._triggerAttached = true;

    // Find the footer copyright paragraph
    const footer = document.querySelector("footer p");
    if (!footer) return;

    // Make it subtly hint-able but not obvious
    footer.style.cursor = "default";
    footer.style.userSelect = "none";
    footer.style.webkitUserSelect = "none";
    footer.title = ""; // no tooltip hint

    // ── Desktop: long-press ─────────────────────────────────────────────
    let holdTimer = null;
    let holdProgress = null;

    const startHold = (e) => {
      if (e.button !== undefined && e.button !== 0) return;

      holdProgress = this._createHoldRing(footer);

      holdTimer = setTimeout(() => {
        clearTimeout(holdTimer);
        holdTimer = null;
        if (holdProgress) {
          holdProgress.remove();
          holdProgress = null;
        }
        this.open();
      }, 700);
    };

    const cancelHold = () => {
      clearTimeout(holdTimer);
      holdTimer = null;
      if (holdProgress) {
        holdProgress.remove();
        holdProgress = null;
      }
    };

    footer.addEventListener("mousedown", startHold);
    footer.addEventListener("mouseup", cancelHold);
    footer.addEventListener("mouseleave", cancelHold);

    // ── Mobile: triple-tap ──────────────────────────────────────────────
    let tapCount = 0;
    let tapTimer = null;

    footer.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        tapCount++;
        clearTimeout(tapTimer);

        if (tapCount >= 3) {
          tapCount = 0;
          this.open();
          return;
        }

        tapTimer = setTimeout(() => {
          tapCount = 0;
        }, 500);
      },
      { passive: false },
    );
  }

  // Small SVG ring that fills up during the hold — visual hint without spoiling it
  _createHoldRing(anchor) {
    const ring = document.createElement("div");
    const rect = anchor.getBoundingClientRect();
    ring.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2 - 18}px;
      top:  ${rect.top + rect.height / 2 - 18}px;
      width: 36px; height: 36px;
      pointer-events: none;
      z-index: 99999;
    `;
    ring.innerHTML = `
      <svg viewBox="0 0 36 36" width="36" height="36">
        <circle cx="18" cy="18" r="15" fill="none"
                stroke="rgba(3,179,195,0.2)" stroke-width="2"/>
        <circle cx="18" cy="18" r="15" fill="none"
                stroke="#03b3c3" stroke-width="2"
                stroke-dasharray="94.2" stroke-dashoffset="94.2"
                stroke-linecap="round"
                transform="rotate(-90 18 18)"
                style="transition: stroke-dashoffset 0.65s linear;">
        </circle>
      </svg>`;
    document.body.appendChild(ring);

    // Trigger the animation on next frame
    requestAnimationFrame(() => {
      const circle = ring.querySelector("circle:last-child");
      if (circle) circle.style.strokeDashoffset = "0";
    });

    return ring;
  }

  // ── Build and open the overlay ────────────────────────────────────────
  open() {
    if (this.isOpen) return;
    this.isOpen = true;

    this._injectStyles();
    this._buildOverlay();
    document.body.appendChild(this.overlay);

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.overlay.classList.add("tm-open");
      });
    });

    this._renderEra(this.currentEraIndex, false);
  }

  close() {
    if (!this.isOpen) return;
    this.overlay.classList.remove("tm-open");

    setTimeout(() => {
      if (this.overlay) this.overlay.remove();
      this.overlay = null;
      document.body.style.overflow = "";
      this.isOpen = false;
    }, 500);
  }

  // ── Build overlay DOM ─────────────────────────────────────────────────
  _buildOverlay() {
    this.overlay = document.createElement("div");
    this.overlay.id = "tm-overlay";
    this.overlay.innerHTML = `
      <button class="tm-close" id="tm-close-btn" aria-label="Close time machine">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div class="tm-header">
        <div class="tm-eyebrow">HIDDEN FEATURE</div>
        <h2 class="tm-title">TIME MACHINE</h2>
        <p class="tm-subtitle">Travel through the evolution of this site.</p>
      </div>

      <div class="tm-dial-wrapper">
        <button class="tm-arrow tm-arrow-left" id="tm-prev" aria-label="Previous era">&#8592;</button>

        <div class="tm-dial" id="tm-dial">
          <div class="tm-era-year"  id="tm-year">NOW</div>
          <div class="tm-era-label" id="tm-label">Present</div>
          <div class="tm-era-desc"  id="tm-desc">WebGL, AI, and pushing what the browser can do.</div>

          <div class="tm-dots">
            ${ERAS.map((_, i) => `<button class="tm-dot ${i === this.currentEraIndex ? "active" : ""}" data-index="${i}" aria-label="Era ${i + 1}"></button>`).join("")}
          </div>
        </div>

        <button class="tm-arrow tm-arrow-right" id="tm-next" aria-label="Next era">&#8594;</button>
      </div>

      <div class="tm-hint">
        <span class="tm-hint-key">← →</span> navigate eras &nbsp;·&nbsp;
        <span class="tm-hint-key">ESC</span> close
        <span class="tm-hint-mobile"> swipe to travel</span>
      </div>

      <div class="tm-scanlines"></div>
    `;

    // Events
    this.overlay
      .querySelector("#tm-close-btn")
      .addEventListener("click", () => this.close());
    this.overlay
      .querySelector("#tm-prev")
      .addEventListener("click", () => this._navigate(-1));
    this.overlay
      .querySelector("#tm-next")
      .addEventListener("click", () => this._navigate(1));

    this.overlay.querySelectorAll(".tm-dot").forEach((dot) => {
      dot.addEventListener("click", () => {
        const idx = parseInt(dot.dataset.index, 10);
        this._goToEra(idx);
      });
    });

    // Keyboard
    this._keyHandler = (e) => {
      if (e.key === "Escape") this.close();
      if (e.key === "ArrowLeft") this._navigate(-1);
      if (e.key === "ArrowRight") this._navigate(1);
    };
    window.addEventListener("keydown", this._keyHandler);

    // Swipe (mobile)
    this._bindSwipe(this.overlay);

    // Click backdrop to close
    this.overlay.addEventListener("click", (e) => {
      if (e.target === this.overlay) this.close();
    });
  }

  _navigate(delta) {
    const next = Math.max(
      0,
      Math.min(ERAS.length - 1, this.currentEraIndex + delta),
    );
    if (next !== this.currentEraIndex) this._goToEra(next);
  }

  _goToEra(index) {
    this.currentEraIndex = index;
    this._renderEra(index, true);
  }

  _renderEra(index, animate) {
    const era = ERAS[index];

    // Apply the CSS theme
    const root = document.documentElement;
    if (era.theme) {
      root.setAttribute("data-theme", era.theme);
    } else {
      root.removeAttribute("data-theme");
    }
    window.dispatchEvent(
      new CustomEvent("theme-change", { detail: era.themeEvent }),
    );

    if (!this.overlay) return;

    const dial = this.overlay.querySelector("#tm-dial");
    const yearEl = this.overlay.querySelector("#tm-year");
    const labelEl = this.overlay.querySelector("#tm-label");
    const descEl = this.overlay.querySelector("#tm-desc");
    const dots = this.overlay.querySelectorAll(".tm-dot");

    // Update dots
    dots.forEach((d, i) => d.classList.toggle("active", i === index));

    // Update arrow states
    const prev = this.overlay.querySelector("#tm-prev");
    const next = this.overlay.querySelector("#tm-next");
    if (prev) prev.disabled = index === 0;
    if (next) next.disabled = index === ERAS.length - 1;

    if (animate) {
      dial.classList.add("tm-switching");
      setTimeout(() => {
        yearEl.textContent = era.year;
        labelEl.textContent = era.label;
        descEl.textContent = era.desc;
        this._applyEraColours(era);
        dial.classList.remove("tm-switching");
      }, 200);
    } else {
      yearEl.textContent = era.year;
      labelEl.textContent = era.label;
      descEl.textContent = era.desc;
      this._applyEraColours(era);
    }
  }

  _applyEraColours(era) {
    if (!this.overlay) return;
    this.overlay.style.setProperty("--tm-accent", era.color);
    this.overlay.style.setProperty("--tm-bg", era.bg);
  }

  // ── Touch swipe ───────────────────────────────────────────────────────
  _bindSwipe(el) {
    let startX = 0;
    el.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true },
    );

    el.addEventListener(
      "touchend",
      (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 50) {
          this._navigate(dx < 0 ? 1 : -1);
        }
      },
      { passive: true },
    );
  }

  // ── Styles (injected once) ────────────────────────────────────────────
  _injectStyles() {
    if (document.getElementById("tm-styles")) return;
    const style = document.createElement("style");
    style.id = "tm-styles";
    style.textContent = `
      /* ── Overlay ─────────────────────────────────────────────────────── */
      #tm-overlay {
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 40px;
        padding: 30px 20px;

        background: rgba(2, 2, 2, 0.97);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);

        --tm-accent: #03b3c3;
        --tm-bg: #050505;

        opacity: 0;
        transform: scale(0.96);
        transition: opacity 0.45s cubic-bezier(0.23, 1, 0.32, 1),
                    transform 0.45s cubic-bezier(0.23, 1, 0.32, 1);
      }

      #tm-overlay.tm-open {
        opacity: 1;
        transform: scale(1);
      }

      /* Scanlines */
      .tm-scanlines {
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(
          0deg,
          transparent,
          transparent 3px,
          rgba(0,0,0,0.08) 3px,
          rgba(0,0,0,0.08) 4px
        );
        pointer-events: none;
        z-index: 0;
      }

      /* ── Close button ─────────────────────────────────────────────────── */
      .tm-close {
        position: absolute;
        top: 24px; right: 24px;
        width: 40px; height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.5);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: background 0.2s, color 0.2s, border-color 0.2s;
        z-index: 10;
      }
      .tm-close:hover {
        background: rgba(255,255,255,0.12);
        color: #fff;
        border-color: rgba(255,255,255,0.25);
      }

      /* ── Header ───────────────────────────────────────────────────────── */
      .tm-header {
        text-align: center;
        position: relative;
        z-index: 2;
      }

      .tm-eyebrow {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.6rem;
        font-weight: 700;
        letter-spacing: 4px;
        color: var(--tm-accent);
        opacity: 0.7;
        margin-bottom: 8px;
        transition: color 0.5s ease;
      }

      .tm-title {
        font-family: 'Montserrat', sans-serif;
        font-size: clamp(2rem, 6vw, 3.5rem);
        font-weight: 900;
        color: #fff;
        margin: 0 0 10px;
        letter-spacing: -1px;
        line-height: 1;
      }

      .tm-subtitle {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.85rem;
        color: rgba(255,255,255,0.35);
        margin: 0;
      }

      /* ── Dial ─────────────────────────────────────────────────────────── */
      .tm-dial-wrapper {
        display: flex;
        align-items: center;
        gap: 24px;
        position: relative;
        z-index: 2;
      }

      .tm-dial {
        width: min(420px, 88vw);
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 20px;
        padding: 40px 32px 32px;
        text-align: center;
        position: relative;
        overflow: hidden;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }

      .tm-dial::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: var(--tm-accent);
        transition: background 0.5s ease;
        box-shadow: 0 0 20px var(--tm-accent);
      }

      .tm-dial.tm-switching {
        opacity: 0;
        transform: translateY(8px);
      }

      .tm-era-year {
        font-family: 'Montserrat', sans-serif;
        font-size: clamp(3.5rem, 12vw, 6rem);
        font-weight: 900;
        color: var(--tm-accent);
        line-height: 1;
        margin-bottom: 8px;
        transition: color 0.5s ease;
        letter-spacing: -2px;
      }

      .tm-era-label {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: rgba(255,255,255,0.4);
        margin-bottom: 16px;
      }

      .tm-era-desc {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.9rem;
        color: rgba(255,255,255,0.55);
        line-height: 1.6;
        max-width: 300px;
        margin: 0 auto 28px;
      }

      /* Dots */
      .tm-dots {
        display: flex;
        justify-content: center;
        gap: 10px;
      }

      .tm-dot {
        width: 8px; height: 8px;
        border-radius: 50%;
        background: rgba(255,255,255,0.15);
        border: none;
        cursor: pointer;
        transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
        padding: 0;
      }

      .tm-dot.active {
        background: var(--tm-accent);
        transform: scale(1.4);
        box-shadow: 0 0 8px var(--tm-accent);
      }

      /* ── Arrows ───────────────────────────────────────────────────────── */
      .tm-arrow {
        width: 48px; height: 48px;
        border-radius: 50%;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.5);
        font-size: 1.2rem;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        transition: all 0.25s ease;
        flex-shrink: 0;
      }

      .tm-arrow:hover:not(:disabled) {
        background: rgba(255,255,255,0.1);
        border-color: var(--tm-accent);
        color: var(--tm-accent);
        box-shadow: 0 0 15px rgba(3,179,195,0.15);
      }

      .tm-arrow:disabled {
        opacity: 0.2;
        cursor: default;
      }

      /* ── Hint bar ─────────────────────────────────────────────────────── */
      .tm-hint {
        font-family: 'Montserrat', sans-serif;
        font-size: 0.65rem;
        color: rgba(255,255,255,0.2);
        letter-spacing: 1px;
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 4px;
        flex-wrap: wrap;
        justify-content: center;
      }

      .tm-hint-key {
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 3px;
        padding: 1px 5px;
        font-family: 'Montserrat', monospace;
        font-size: 0.6rem;
      }

      .tm-hint-mobile {
        display: none;
      }

      @media (hover: none) and (pointer: coarse) {
        .tm-hint-mobile { display: inline; }
        .tm-hint-key { display: none; }
      }

      @media (max-width: 500px) {
        .tm-arrow { width: 36px; height: 36px; font-size: 1rem; }
        .tm-dial  { padding: 28px 20px 24px; }
        #tm-overlay { gap: 28px; }
      }
    `;
    document.head.appendChild(style);
  }
}
