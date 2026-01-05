export class Flashlight {
  constructor() {
    this.isActive = false;
    this.overlay = null;
    this.popup = null;
    this.hint = null; // New hint element
    this.mouseX = 0;
    this.mouseY = 0;

    // Store previous positions to avoid unnecessary DOM updates
    this.currentX = 0;
    this.currentY = 0;
    this.animationId = null;

    this.init();
  }

  init() {
    const isMobile =
      window.matchMedia("(hover: none)").matches ||
      window.matchMedia("(pointer: coarse)").matches;
    if (isMobile) return;

    // 1. Setup Overlay
    this.overlay = document.createElement("div");
    this.overlay.id = "flashlight-overlay";
    this.overlay.style.willChange = "background";
    document.body.appendChild(this.overlay);

    // 2. Setup Hint (Clue)
    this.setupHint();

    // 3. Listeners
    window.addEventListener("keydown", (e) => {
      if (
        e.key.toLowerCase() === "f" &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        this.toggle();
      }
    });

    window.addEventListener("mousemove", (e) => {
      // Always track mouse for hint parallax even if not active
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  }

  setupHint() {
    // Create a subtle hint in the bottom left
    this.hint = document.createElement("div");
    this.hint.className = "system-clue";
    this.hint.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        font-family: 'Space Mono', monospace;
        font-size: 10px;
        color: rgba(255, 255, 255, 0.3);
        z-index: 50;
        pointer-events: none;
        opacity: 0.7;
        transition: opacity 0.3s ease;
    `;
    this.hint.innerHTML =
      ":: <span style='color:#00ff88'>[FOCUS]</span>";
    document.body.appendChild(this.hint);

    // Fade hint out after 8 seconds, but bring it back if they hover near it
    setTimeout(() => {
      if (this.hint) this.hint.style.opacity = "0.2";
    }, 8000);
  }

  toggle() {
    this.isActive = !this.isActive;

    if (this.isActive) {
      this.overlay.classList.add("active");
      this.startLoop();
      this.showPopup(true);

      // Update hint to show how to exit
      if (this.hint) {
        this.hint.innerHTML =
          ":: FOCUS ACTIVE. PRESS <span style='color:#ff0055'>[F]</span> TO DISENGAGE";
        this.hint.style.opacity = "1";
      }
    } else {
      this.overlay.classList.remove("active");
      this.stopLoop();
      this.showPopup(false);

      // Revert hint
      if (this.hint) {
        this.hint.innerHTML =
          ":: <span style='color:#00ff88'>[FOCUS]</span>";
        this.hint.style.opacity = "0.2";
      }
    }
  }

  startLoop() {
    if (this.animationId) return;
    this.loop();
  }

  stopLoop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  loop() {
    if (!this.isActive) return;

    this.currentX += (this.mouseX - this.currentX) * 0.2;
    this.currentY += (this.mouseY - this.currentY) * 0.2;

    if (this.overlay) {
      this.overlay.style.setProperty("--x", `${this.currentX.toFixed(1)}px`);
      this.overlay.style.setProperty("--y", `${this.currentY.toFixed(1)}px`);
    }

    this.animationId = requestAnimationFrame(() => this.loop());
  }

  showPopup(show) {
    if (!this.popup) {
      this.popup = document.createElement("div");
      this.popup.className = "feature-popup";
      this.popup.innerHTML = `
        <h3>FOCUS MODE INITIALIZED</h3>
        <p>Distractions masked. Light focus engaged.</p>
        <p style="margin-top:5px; font-size: 0.75rem; color: #888;">// PRESS 'F' TO ABORT</p>
      `;
      document.body.appendChild(this.popup);
    }

    if (show) {
      setTimeout(() => this.popup.classList.add("active"), 10);
      if (this.hideTimer) clearTimeout(this.hideTimer);
      this.hideTimer = setTimeout(() => {
        this.popup.classList.remove("active");
      }, 4000);
    } else {
      this.popup.classList.remove("active");
    }
  }
}
