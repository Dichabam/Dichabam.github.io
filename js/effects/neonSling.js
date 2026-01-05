import { state } from "../core/state.js";
import { debounce } from "../core/utils.js";

export class NeonSling {
  constructor() {
    this.isActive = false;
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    this.animationId = null;

    this.projectiles = [];
    this.particles = [];
    this.dragStart = null;
    this.dragCurrent = null;

    this.isSlinging = false;
    this.slingTimer = null;

    // Interaction properties
    this.clickCount = 0;
    this.clickTimer = null;
    this.clueElement = null;

    this.colors = ["#ff00ff", "#00ffff", "#ffff00", "#ff0055"];
    this.friction = 0.99;
    this.gravity = 0.2;
    this.bounceDamping = 0.7;

    // Initialize immediately
    this.init();
  }

  init() {
    // 1. Setup Canvas
    this.canvas = document.createElement("canvas");
    this.canvas.id = "sling-canvas";
    this.canvas.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        z-index: 9998; pointer-events: none; opacity: 0;
        transition: opacity 0.5s ease;
        touch-action: none;
    `;
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");

    // 2. Setup Clue (The "Button")
    // Wait for DOM to be fully ready to find the footer
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setupClue());
    } else {
      setTimeout(() => this.setupClue(), 500);
    }

    // 3. Resize Listener
    window.addEventListener(
      "resize",
      debounce(() => this.resize(), 200)
    );

    // 4. Input Listeners
    this.bindInputEvents();

    this.resize();
  }

  bindInputEvents() {
    const options = { passive: false };

    // Touch
    window.addEventListener("touchstart", (e) => this.handleStart(e), options);
    window.addEventListener("touchmove", (e) => this.handleMove(e), options);
    window.addEventListener("touchend", (e) => this.handleEnd(e));

    // Mouse
    window.addEventListener("mousedown", (e) => this.handleStart(e));
    window.addEventListener("mousemove", (e) => this.handleMove(e));
    window.addEventListener("mouseup", (e) => this.handleEnd(e));
  }

  setupClue() {
    // Prevent duplicate creation
    if (document.getElementById("sling-clue")) return;

    const findFooter = () => {
      const footer =
        document.querySelector(".site-footer") ||
        document.querySelector("footer");

      if (footer) {
        this.createClueInFooter(footer);
      } else {
        // Retry if footer not found yet (e.g. dynamic content)
        setTimeout(findFooter, 500);
      }
    };

    findFooter();
  }

  createClueInFooter(footer) {
    this.clueElement = document.createElement("div");
    this.clueElement.id = "sling-clue";

    // Ensure footer can position absolute children
    const computedStyle = window.getComputedStyle(footer);
    if (computedStyle.position === "static") {
      footer.style.position = "relative";
    }

    // Centered at the bottom of the footer
    this.clueElement.style.cssText = `
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: 2px;
      color: rgba(255, 255, 255, 0.15);
      cursor: pointer;
      z-index: 100;
      user-select: none;
      padding: 10px 20px;
      white-space: nowrap;
      transition: all 0.3s ease;
      pointer-events: auto; 
    `;
    this.clueElement.innerText = "PLAY";

    footer.appendChild(this.clueElement);

    // Click Logic for Single vs Double Click
    this.clueElement.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleClueInteraction();
    });

    // Touch support for the button specifically
    this.clueElement.addEventListener(
      "touchstart",
      (e) => {
        // We rely on the click event that usually follows touch,
        // but we prevent propagation to avoid firing slingshot logic
        e.stopPropagation();
      },
      { passive: false }
    );
  }

  handleClueInteraction() {
    this.clickCount++;

    if (this.clickCount === 1) {
      // Wait to see if it's a double click
      this.clickTimer = setTimeout(() => {
        this.clickCount = 0;
        this.triggerSingleClickEffect(); // Single Click Action
      }, 300); // 300ms delay window
    } else if (this.clickCount === 2) {
      // Double click detected
      clearTimeout(this.clickTimer);
      this.clickCount = 0;
      this.toggle(); // Double Click Action
    }
  }

  triggerSingleClickEffect() {
    // Visual Ripple/Glow Effect without toggling state
    if (!this.clueElement) return;

    const originalColor = this.isActive
      ? "#ff0055"
      : "rgba(255, 255, 255, 0.15)";
    const originalShadow = this.isActive ? "0 0 10px #ff0055" : "none";

    // Flash Effect
    this.clueElement.style.color = "#00ff88";
    this.clueElement.style.textShadow = "0 0 15px #00ff88";

    if (navigator.vibrate) navigator.vibrate(5);

    setTimeout(() => {
      if (this.clueElement) {
        this.clueElement.style.color = originalColor;
        this.clueElement.style.textShadow = originalShadow;
      }
    }, 400);
  }

  toggle() {
    this.isActive = !this.isActive;

    if (this.isActive) {
      // Activate
      this.canvas.style.opacity = "1";
      this.canvas.style.pointerEvents = "auto";
      this.startLoop();
      this.showFeedback("SYSTEM: SLINGSHOT ENGAGED");

      if (this.clueElement) {
        this.clueElement.innerText = "STOP";
        this.clueElement.style.color = "#ff0055";
        this.clueElement.style.textShadow = "0 0 10px #ff0055";
      }
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    } else {
      // Deactivate
      this.canvas.style.opacity = "0";
      this.canvas.style.pointerEvents = "none";
      this.showFeedback("SYSTEM: DAMPENERS ENABLED");

      if (this.clueElement) {
        this.clueElement.innerText = "PLAY";
        this.clueElement.style.color = "rgba(255, 255, 255, 0.15)";
        this.clueElement.style.textShadow = "none";
      }
      if (navigator.vibrate) navigator.vibrate(50);
    }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  getInputCoordinates(e) {
    if (e.changedTouches) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  handleStart(e) {
    if (!this.isActive) return;
    // Important: Don't start slinging if clicking the toggle button
    if (e.target === this.clueElement || this.clueElement?.contains(e.target))
      return;

    const coords = this.getInputCoordinates(e);
    this.dragStart = coords;
    this.dragCurrent = coords;

    this.isSlinging = false;

    // Small delay to distinguish tap from drag
    this.slingTimer = setTimeout(() => {
      this.isSlinging = true;
      if (navigator.vibrate) navigator.vibrate(20);
    }, 150);
  }

  handleMove(e) {
    if (!this.isActive || !this.dragStart) return;

    const coords = this.getInputCoordinates(e);
    const dx = coords.x - this.dragStart.x;
    const dy = coords.y - this.dragStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.isSlinging) {
      if (e.cancelable) e.preventDefault();
      this.dragCurrent = coords;
    } else {
      // If moved significantly before timer fires, cancel sling (it's likely a scroll)
      if (dist > 10) {
        if (this.slingTimer) {
          clearTimeout(this.slingTimer);
          this.slingTimer = null;
        }
      }
    }
  }

  handleEnd(e) {
    if (!this.isActive || !this.dragStart) return;

    if (this.slingTimer) {
      clearTimeout(this.slingTimer);
      this.slingTimer = null;
    }

    if (this.isSlinging && this.dragCurrent) {
      const dx = this.dragStart.x - this.dragCurrent.x;
      const dy = this.dragStart.y - this.dragCurrent.y;

      const power = Math.sqrt(dx * dx + dy * dy);
      if (power > 30) {
        this.fireProjectile(
          this.dragStart.x,
          this.dragStart.y,
          dx * 0.15,
          dy * 0.15
        );
        if (navigator.vibrate) navigator.vibrate(40);
      }
    }

    this.dragStart = null;
    this.dragCurrent = null;
    this.isSlinging = false;
  }

  fireProjectile(x, y, vx, vy) {
    this.projectiles.push({
      x,
      y,
      vx,
      vy,
      radius: 8,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      life: 1.0,
      trail: [],
    });
  }

  spawnExplosion(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        color: color,
        gravity: 0.1,
      });
    }
  }

  startLoop() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animate();
  }

  animate() {
    if (
      !this.isActive &&
      this.projectiles.length === 0 &&
      this.particles.length === 0
    ) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.isSlinging && this.dragStart && this.dragCurrent) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.dragStart.x, this.dragStart.y);
      this.ctx.lineTo(this.dragCurrent.x, this.dragCurrent.y);
      this.ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      this.ctx.setLineDash([5, 5]);
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      this.ctx.beginPath();
      this.ctx.arc(this.dragStart.x, this.dragStart.y, 10, 0, Math.PI * 2);
      this.ctx.fillStyle = "#fff";
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.arc(this.dragCurrent.x, this.dragCurrent.y, 20, 0, Math.PI * 2);
      this.ctx.strokeStyle = "#00ff88";
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 10) p.trail.shift();

      p.vy += this.gravity;
      p.x += p.vx;
      p.y += p.vy;

      let hit = false;
      if (p.x < 0 || p.x > this.width) {
        p.vx *= -this.bounceDamping;
        p.x = p.x < 0 ? 0 : this.width;
        hit = true;
      }
      if (p.y < 0 || p.y > this.height) {
        p.vy *= -this.bounceDamping;
        p.y = p.y < 0 ? 0 : this.height;
        if (Math.abs(p.vy) > 2) hit = true;
      }

      if (hit) {
        this.spawnExplosion(p.x, p.y, p.color, 15);
        p.life -= 0.1;
      }

      p.life -= 0.005;

      this.ctx.beginPath();
      if (p.trail.length > 0) {
        this.ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let t of p.trail) this.ctx.lineTo(t.x, t.y);
      }
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = "#fff";
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = p.color;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;

      if (p.life <= 0) {
        this.spawnExplosion(p.x, p.y, p.color, 40);
        this.projectiles.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx;
      part.y += part.vy;
      part.vy += part.gravity;
      part.life -= 0.02;

      this.ctx.globalAlpha = part.life;
      this.ctx.fillStyle = part.color;
      this.ctx.fillRect(part.x, part.y, 3, 3);
      this.ctx.globalAlpha = 1;

      if (part.life <= 0) this.particles.splice(i, 1);
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  showFeedback(text) {
    const popup = document.querySelector(".feature-popup");
    if (!popup) {
      const div = document.createElement("div");
      div.className = "feature-popup active";
      div.innerHTML = `<h3>${text}</h3>`;
      document.body.appendChild(div);
      setTimeout(() => div.remove(), 2500);
    } else {
      popup.innerHTML = `<h3>${text}</h3>`;
      popup.classList.add("active");
      setTimeout(() => popup.classList.remove("active"), 2500);
    }
  }
}
