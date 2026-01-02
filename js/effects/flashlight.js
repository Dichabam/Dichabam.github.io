export class Flashlight {
  constructor() {
    this.isActive = false;
    this.overlay = null;
    this.popup = null;
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

    this.overlay = document.createElement("div");
    this.overlay.id = "flashlight-overlay";
    // OPTIMIZATION: Hardware acceleration hint
    this.overlay.style.willChange = "background";
    document.body.appendChild(this.overlay);

    window.addEventListener("keydown", (e) => {
      if (
        e.key.toLowerCase() === "f" &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        this.toggle();
      }
    });

    // OPTIMIZATION: Only update coordinate variables, do NOT touch DOM here
    window.addEventListener("mousemove", (e) => {
      if (!this.isActive) return;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  }

  toggle() {
    this.isActive = !this.isActive;

    if (this.isActive) {
      this.overlay.classList.add("active");
      this.startLoop(); // Start the render loop
      this.showPopup(true);
    } else {
      this.overlay.classList.remove("active");
      this.stopLoop(); // Stop the render loop
      this.showPopup(false);
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

  // OPTIMIZATION: Update DOM in sync with refresh rate
  loop() {
    if (!this.isActive) return;

    // Linear interpolation for smoothness
    this.currentX += (this.mouseX - this.currentX) * 0.2;
    this.currentY += (this.mouseY - this.currentY) * 0.2;

    // Only update DOM if overlay is present
    if (this.overlay) {
      // Use toFixed to avoid sub-pixel rendering jitter
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
        <h3>Flashlight Mode</h3>
        <p>Focus mode enabled. Distractions hidden in shadow.</p>
        <p style="margin-top:5px; font-size: 0.75rem;">Press <span class="key-badge">F</span> to toggle off.</p>
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
